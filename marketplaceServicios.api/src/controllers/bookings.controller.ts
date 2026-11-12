import { Request, Response } from 'express';
import bookingModel, { EstadoBooking } from '../models/Booking.model';
import servicioModel from '../models/offering.model';
import proveedorModel from '../models/Proveedor.model';
import { httpStatus } from '../constants/httpsNumbers';
import {
    BOOKING_POPULATE as POPULATE,
    SERVICIO_NO_DISPONIBLE,
    createBooking,
    listBookingsFor,
    notifyBookingStatusChange
} from '../services/bookings.service';

/*
 * Relación del usuario con una booking (no confundir con su rol global):
 *  - cliente:   es quien la creó (booking.usuario)
 *  - proveedor: es el dueño del servicio reservado
 *  - admin:     rol admin
 */
type Actor = 'cliente' | 'proveedor' | 'admin';

/*
 * Máquina de estados. Estado actual → estado destino → quién puede hacerlo.
 * rechazada, completada y cancelada son finales.
 */
const TRANSICIONES: Record<EstadoBooking, Partial<Record<EstadoBooking, Actor[]>>> = {
    pendiente: {
        aceptada: ['proveedor', 'admin'],
        rechazada: ['proveedor', 'admin'],
        cancelada: ['cliente', 'admin']
    },
    aceptada: {
        completada: ['proveedor', 'admin'],
        cancelada: ['cliente', 'admin']
    },
    rechazada: {},
    completada: {},
    cancelada: {}
};

// Campos de detalle: solo el cliente (o admin) y solo mientras está pendiente
const CAMPOS_DETALLE = ['descripcion', 'direccion', 'fechaProgramada'] as const;

const notFound = (res: Response) => {
    res.status(httpStatus.NOT_FOUND).json({ error: { message: 'Reserva no encontrada' } });
};

const serverError = (res: Response) => {
    res.status(httpStatus.SERVER_ERROR).json({ error: { message: 'Error interno' } });
};

const isCastError = (error: unknown) =>
    error instanceof Error && error.name === 'CastError';

/*
 * Carga la booking y calcula qué es el usuario respecto a ella.
 * null si no existe, está borrada o el usuario no tiene relación (→ 404, no se revela).
 */
const cargarConAcceso = async (bookingId: string, user: NonNullable<Request['user']>) => {
    const booking = await bookingModel.findOne({ _id: bookingId, isDeleted: { $ne: true } });
    if (!booking) return null;

    const actores = new Set<Actor>();
    if (user.rol === 'admin') actores.add('admin');
    if (String(booking.usuario) === user.id) actores.add('cliente');

    const servicio = await servicioModel.findById(booking.servicio).select('proveedor');
    if (servicio) {
        const proveedor = await proveedorModel.findById(servicio.proveedor).select('usuario');
        if (proveedor && String(proveedor.usuario) === user.id) actores.add('proveedor');
    }

    if (actores.size === 0) return null;
    return { booking, actores };
};

// POST /bookings  (cliente | admin)
export const crearBooking = async (req: Request, res: Response) => {
    try {
        // el dueño siempre sale del token
        const booking = await createBooking(req.user!.id, req.body);
        res.status(httpStatus.OBJECT_CREATED).json(booking);
    } catch (error) {
        if (isCastError(error) || (error instanceof Error && error.message === SERVICIO_NO_DISPONIBLE)) {
            res.status(httpStatus.NOT_FOUND).json({ error: { message: 'Servicio no encontrado' } });
            return;
        }
        serverError(res);
    }
};

// GET /bookings
export const obtenerBookings = async (req: Request, res: Response) => {
    try {
        res.status(httpStatus.SUCCESFUL).json(await listBookingsFor(req.user!));
    } catch {
        serverError(res);
    }
};

// GET /bookings/:id
export const obtenerBookingPorId = async (req: Request, res: Response) => {
    try {
        const acceso = await cargarConAcceso(String(req.params.id), req.user!);
        if (!acceso) return notFound(res);

        const populated = await acceso.booking.populate(POPULATE);
        res.status(httpStatus.SUCCESFUL).json(populated);
    } catch (error) {
        if (isCastError(error)) return notFound(res);
        serverError(res);
    }
};

// PUT /bookings/:id
export const actualizarBooking = async (req: Request, res: Response) => {
    try {
        const acceso = await cargarConAcceso(String(req.params.id), req.user!);
        if (!acceso) return notFound(res);

        const { booking, actores } = acceso;
        const estadoActual = booking.estado as EstadoBooking;
        const { estado: estadoNuevo } = req.body as { estado?: EstadoBooking };

        // 1) Cambios de detalle
        const cambiosDetalle = CAMPOS_DETALLE.filter((campo) => req.body[campo] !== undefined);
        if (cambiosDetalle.length > 0) {
            const puedeEditar = actores.has('cliente') || actores.has('admin');
            if (!puedeEditar || estadoActual !== 'pendiente') {
                res.status(httpStatus.CONFLICT).json({
                    error: {
                        message: 'Solo el cliente puede modificar los detalles y solo mientras la reserva está pendiente'
                    }
                });
                return;
            }
            for (const campo of cambiosDetalle) booking.set(campo, req.body[campo]);
        }

        // 2) Cambio de estado
        if (estadoNuevo !== undefined) {
            const permitidos = TRANSICIONES[estadoActual][estadoNuevo];
            const autorizado = permitidos?.some((actor) => actores.has(actor)) ?? false;

            if (!autorizado) {
                res.status(httpStatus.CONFLICT).json({
                    error: {
                        message: `Transición no permitida: ${estadoActual} → ${estadoNuevo}`,
                        estadoActual,
                        permitidas: Object.entries(TRANSICIONES[estadoActual])
                            .filter(([, quien]) => quien?.some((actor) => actores.has(actor)))
                            .map(([destino]) => destino)
                    }
                });
                return;
            }
            booking.estado = estadoNuevo;
        }

        await booking.save();
        const populated = await booking.populate(POPULATE);
        notifyBookingStatusChange(populated, estadoActual); // correo al cliente si pasó a aceptada/completada
        res.status(httpStatus.SUCCESFUL).json(populated);
    } catch (error) {
        if (isCastError(error)) return notFound(res);
        if (error instanceof Error && error.name === 'ValidationError') {
            res.status(httpStatus.REQUEST_ERROR).json({ error: { message: error.message } });
            return;
        }
        serverError(res);
    }
};

// DELETE /bookings/:id  (cliente dueño o admin; soft delete)
export const eliminarBooking = async (req: Request, res: Response) => {
    try {
        const { id, rol } = req.user!;
        const filtro: Record<string, unknown> = { _id: req.params.id, isDeleted: { $ne: true } };
        if (rol !== 'admin') filtro.usuario = id;

        const booking = await bookingModel.findOneAndUpdate(filtro, { isDeleted: true }, { new: true });
        if (!booking) return notFound(res);

        res.status(httpStatus.SUCCESFUL).json({ message: 'Reserva eliminada' });
    } catch (error) {
        if (isCastError(error)) return notFound(res);
        serverError(res);
    }
};
