import { z } from 'zod';

const calificacion = z.coerce
    .number({ message: 'La calificacion debe ser un numero' })
    .int({ message: 'La calificacion debe ser un numero entero' })
    .min(1, { message: 'La calificacion minima es 1' })
    .max(5, { message: 'La calificacion maxima es 5' });

const comentario = z.string({ message: 'El comentario es obligatorio' })
    .trim()
    .min(1, { message: 'El comentario no puede estar vacio' })
    .max(1000, { message: 'El comentario no puede pasar de 1000 caracteres' });

// usuario y proveedor NO se aceptan: salen de la booking
export const createReviewSchema = z.object({
    booking: z.string({ message: 'El campo booking es obligatorio' })
        .regex(/^[0-9a-fA-F]{24}$/, { message: 'El ID de la booking no tiene un formato valido' }),
    calificacion,
    comentario
});

export const updateReviewSchema = z.object({
    calificacion: calificacion.optional(),
    comentario: comentario.optional()
}).refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar calificacion o comentario'
});
