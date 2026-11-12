import { z } from 'zod';
import { ESTADOS_BOOKING } from '../models/Booking.model';

const objectId = (campo: string) =>
    z.string({ message: `El campo ${campo} es obligatorio` })
        .regex(/^[0-9a-fA-F]{24}$/, { message: `El ID de ${campo} no tiene un formato valido` });

const fechaFutura = z.coerce
    .date({ message: 'La fecha programada no es valida' })
    .refine((d) => d.getTime() > Date.now(), { message: 'La fecha programada debe ser futura' });

// usuario y estado NO se aceptan: el dueño sale de req.user y el estado inicial es "pendiente"
export const createBookingSchema = z.object({
    servicio: objectId('servicio'),
    descripcion: z.string().trim().min(1, { message: 'La descripcion no puede estar vacia' }).optional(),
    direccion: z.string().trim().min(1, { message: 'La direccion no puede estar vacia' }).optional(),
    fechaProgramada: fechaFutura.optional()
});

export const updateBookingSchema = z.object({
    estado: z.enum(ESTADOS_BOOKING, { message: 'Estado no valido' }).optional(),
    descripcion: z.string().trim().min(1, { message: 'La descripcion no puede estar vacia' }).optional(),
    direccion: z.string().trim().min(1, { message: 'La direccion no puede estar vacia' }).optional(),
    fechaProgramada: fechaFutura.optional()
}).refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar'
});
