import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import servicioModel from '../models/offering.model';
import '../models/Proveedor.model';
import '../models/Usuario.model';
import { createBookingSchema } from '../schemas/Booking.schema';
import {
    createBooking,
    listBookingsFor,
    SERVICIO_NO_DISPONIBLE
} from '../services/bookings.service';
import type { CurrentUser } from '../middleware/view-session.middleware';

const render404 = (res: Response) => {
    res.status(404).render('errors/404', { title: 'Página no encontrada' });
};

export const redirectToServices = (_req: Request, res: Response) => {
    res.redirect('/servicios');
};

export const listServicesView = async (_req: Request, res: Response) => {
    const servicios = await servicioModel
        .find({ isDeleted: { $ne: true } })
        .lean();

    res.render('services/index', { title: 'Servicios', servicios });
};

/* ---------- Detalle ---------- */

const cargarServicio = (id: string) =>
    servicioModel
        .findOne({ _id: id, isDeleted: { $ne: true } })
        .populate({
            path: 'proveedor',
            populate: {
                path: 'usuario',
                select: 'nombre apellido correo telefono'
            }
        })
        .lean();

type ServicioDetalle = NonNullable<Awaited<ReturnType<typeof cargarServicio>>>;

/*
 * Qué bloque de acción ve cada quien en el detalle:
 *  - anónimo            → enlace a /login?next=/servicios/:id
 *  - dueño del servicio → badge "Es tu servicio"
 *  - cliente / admin    → formulario "Solicitar servicio" (si el servicio está activo)
 *  - otro proveedor     → aviso de que los proveedores no solicitan
 */
const accionesDetalle = (servicio: ServicioDetalle, user: CurrentUser | null) => {
    const proveedor = servicio.proveedor as { usuario?: { _id?: unknown } } | null | undefined;
    const isOwner = !!user && String(proveedor?.usuario?._id) === user.id;
    const disponible = servicio.activo !== false;
    const rolPermitido = !!user && !isOwner && (user.rol === 'cliente' || user.rol === 'admin');
    // Mismo requisito que POST /api/bookings (requireVerifiedEmail)
    const verificado = !!user?.emailVerified;

    return {
        isOwner,
        disponible,
        puedeSolicitar: rolPermitido && disponible && verificado,
        necesitaVerificar: rolPermitido && disponible && !verificado,
        esOtroProveedor: !!user && !isOwner && user.rol === 'proveedor'
    };
};

const renderDetalle = (
    res: Response,
    servicio: ServicioDetalle,
    extra: { errors?: Record<string, string>; values?: Record<string, string> } = {},
    status = 200
) => {
    res.status(status).render('services/detail', {
        title: servicio.titulo,
        servicio,
        ...accionesDetalle(servicio, res.locals.currentUser),
        ...extra
    });
};

export const serviceDetailView = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    if (!isValidObjectId(id)) return render404(res);

    const servicio = await cargarServicio(id);
    if (!servicio) return render404(res);

    renderDetalle(res, servicio);
};

/* ---------- POST /servicios/:id/solicitar ---------- */

export const requestServiceSubmit = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    if (!isValidObjectId(id)) return render404(res);

    // Sin sesión → al login, volviendo al detalle (no a esta URL POST)
    const user: CurrentUser | null = res.locals.currentUser;
    if (!user) {
        res.redirect(`/login?next=${encodeURIComponent(`/servicios/${id}`)}`);
        return;
    }

    const servicio = await cargarServicio(id);
    if (!servicio) return render404(res);

    const acciones = accionesDetalle(servicio, user);
    if (!acciones.puedeSolicitar) {
        renderDetalle(res, servicio, {
            errors: {
                general: acciones.necesitaVerificar
                    ? 'Debes verificar tu correo antes de solicitar servicios.'
                    : 'No puedes solicitar este servicio.'
            }
        }, 403);
        return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const values = {
        descripcion: typeof body.descripcion === 'string' ? body.descripcion : '',
        direccion: typeof body.direccion === 'string' ? body.direccion : '',
        fechaProgramada: typeof body.fechaProgramada === 'string' ? body.fechaProgramada : ''
    };

    // Los inputs vacíos llegan como "": se omiten porque los tres campos son opcionales
    const entrada: Record<string, string> = { servicio: id };
    for (const [k, v] of Object.entries(values)) if (v.trim() !== '') entrada[k] = v;

    const parsed = createBookingSchema.safeParse(entrada);
    if (!parsed.success) {
        const errors: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
            const campo = String(issue.path[0] ?? 'general');
            if (!errors[campo]) errors[campo] = issue.message;
        }
        renderDetalle(res, servicio, { errors, values }, 400);
        return;
    }

    try {
        await createBooking(user.id, parsed.data);
        res.redirect('/mis-solicitudes?creada=1');
    } catch (error) {
        if (error instanceof Error && error.message === SERVICIO_NO_DISPONIBLE) {
            renderDetalle(res, servicio, {
                errors: { general: 'Este servicio ya no está disponible.' },
                values
            }, 409);
            return;
        }
        throw error; // → página 500
    }
};

/* ---------- GET /mis-solicitudes ---------- */

const TITULOS: Record<CurrentUser['rol'], { titulo: string; vacio: string }> = {
    cliente: {
        titulo: 'Mis solicitudes',
        vacio: 'Todavía no has solicitado ningún servicio.'
    },
    proveedor: {
        titulo: 'Solicitudes recibidas',
        vacio: 'Aún no has recibido solicitudes para tus servicios.'
    },
    admin: {
        titulo: 'Todas las solicitudes',
        vacio: 'No hay solicitudes registradas.'
    }
};

export const myRequestsView = async (req: Request, res: Response) => {
    const user: CurrentUser = res.locals.currentUser;
    const bookings = (await listBookingsFor(user)).map((b) => b.toObject());
    const textos = TITULOS[user.rol];

    res.render('bookings/index', {
        title: textos.titulo,
        ...textos,
        bookings,
        mostrarCliente: user.rol !== 'cliente',
        success: req.query.creada === '1' ? 'Solicitud enviada. El proveedor la revisará pronto.' : undefined
    });
};
