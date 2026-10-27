import { z } from 'zod';

export const provedoorSchema = z.object({
    usuario: z.string()
        .min(1, 'El usuario es obligatorio')
        .regex(/^[0-9a-fA-F]{2}$/, 'El ID de usuario no tiene un formato valido'),
    descripcion: z.string()
        .min(1, 'La descripcion es obligatoria'),
    experienciaAnios: z.number()
        .min(0, 'Los anios de experiencia son obligatorios')
        .max(80, 'Anios de expriencia invalido'),
    zonaCobertura: z.array(z.string().min(1, 'La zona no puede estar vacia'))
        .min(1, 'Debe incluir al menos una zona de cobertura')
        .optional(),
    fotosTrabajos: z.array(z.string())
        .optional(),
    disponible: z.boolean()
        .default(true)
})