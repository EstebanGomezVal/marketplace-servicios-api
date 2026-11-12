import bookingModel from '../models/Booking.model';
import servicioModel from '../models/offering.model';
import proveedorModel from '../models/Proveedor.model';
import { bookingStatusEmail, EstadoNotificable, sendMailInBackground } from './mail.service';
import { moduleLogger } from '../config/logger';

const log = moduleLogger('bookings');

/*
 * Lógica de bookings compartida por la API (/api/bookings) y las vistas HTML
 * (/servicios/:id/solicitar, /mis-solicitudes).
 */

export const BOOKING_POPULATE = [
    { path: 'servicio', select: 'titulo precio categoria' },
    { path: 'usuario', select: 'nombre apellido correo' }
];

export const SERVICIO_NO_DISPONIBLE = 'SERVICIO_NO_DISPONIBLE';

type SessionUser = { id: string; rol: 'cliente' | 'proveedor' | 'admin' };

export interface CreateBookingData {
    servicio: string;
    descripcion?: string | undefined;
    direccion?: string | undefined;
    fechaProgramada?: Date | undefined;
}

// IDs de los servicios del proveedor (vacío si no tiene perfil)
export const serviciosDelProveedor = async (userId: string) => {
    const perfil = await proveedorModel
        .findOne({ usuario: userId, isDeleted: { $ne: true } })
        .select('_id');
    if (!perfil) return [];

    const servicios = await servicioModel.find({ proveedor: perfil._id }).select('_id');
    return servicios.map((s) => s._id);
};

/*
 * Crea una booking en estado "pendiente" para `userId`.
 * Lanza Error(SERVICIO_NO_DISPONIBLE) si el servicio no existe, está borrado o inactivo.
 */
export const createBooking = async (userId: string, data: CreateBookingData) => {
    const { servicio: servicioId, descripcion, direccion, fechaProgramada } = data;
    // Solo los campos presentes (exactOptionalPropertyTypes no admite undefined explícito)
    const detalle = {
        ...(descripcion !== undefined ? { descripcion } : {}),
        ...(direccion !== undefined ? { direccion } : {}),
        ...(fechaProgramada !== undefined ? { fechaProgramada } : {})
    };

    const servicio = await servicioModel.findOne({
        _id: servicioId,
        isDeleted: { $ne: true },
        activo: { $ne: false }
    });
    if (!servicio) throw new Error(SERVICIO_NO_DISPONIBLE);

    const booking = await bookingModel.create({
        ...detalle,
        servicio: servicio._id,
        usuario: userId, // el dueño siempre sale de la sesión
        estado: 'pendiente'
    });

    return booking.populate(BOOKING_POPULATE);
};

/*
 * Avisa al cliente cuando su booking pasa a "aceptada" o "completada".
 * Espera la booking ya populada (BOOKING_POPULATE): el destinatario sale de booking.usuario.correo.
 * No lanza ni espera el envío: un fallo de correo no cambia la respuesta del API (solo log warn).
 */
const ESTADOS_NOTIFICABLES = new Set<string>(['aceptada', 'completada']);

export const notifyBookingStatusChange = (booking: unknown, estadoAnterior: string) => {
    try {
        const b = booking as {
            estado?: string;
            fechaProgramada?: Date;
            direccion?: string;
            usuario?: { correo?: string; nombre?: string } | null;
            servicio?: { titulo?: string } | null;
        };

        if (!b.estado || b.estado === estadoAnterior || !ESTADOS_NOTIFICABLES.has(b.estado)) return;

        const correo = b.usuario?.correo;
        if (!correo) {
            log.warn({ estado: b.estado }, 'Booking sin correo de cliente; no se notifica el cambio de estado');
            return;
        }

        sendMailInBackground(bookingStatusEmail(correo, b.estado as EstadoNotificable, {
            nombre: b.usuario?.nombre ?? '',
            servicio: b.servicio?.titulo ?? 'tu servicio',
            fechaProgramada: b.fechaProgramada,
            direccion: b.direccion
        }));
    } catch (error) {
        log.warn({ err: error }, 'No se pudo preparar el aviso de cambio de estado');
    }
};

// cliente: las suyas · proveedor: las de sus servicios · admin: todas
export const listBookingsFor = async (user: SessionUser) => {
    const filtro: Record<string, unknown> = { isDeleted: { $ne: true } };

    if (user.rol === 'cliente') {
        filtro.usuario = user.id;
    } else if (user.rol === 'proveedor') {
        filtro.servicio = { $in: await serviciosDelProveedor(user.id) };
    }

    return bookingModel.find(filtro).populate(BOOKING_POPULATE).sort({ createdAt: -1 });
};
