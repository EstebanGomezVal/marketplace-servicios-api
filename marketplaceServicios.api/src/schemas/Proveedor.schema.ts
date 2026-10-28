import { z } from 'zod';

export const proveedorSchema = z.object({
    usuario: z.string()
        .min(1, { message: 'El usuario es obligatorio' })
        .regex(/^[0-9a-fA-F]{24}$/, { message: 'El ID de usuario no tiene un formato valido' }),
    descripcion: z.string()
        .min(1, { message: 'La descripcion es obligatoria' }),
    experienciaAnios: z.number()
        .min(0, { message: 'Los anios de experiencia son obligatorios' })
        .max(80, { message: 'Anios de expriencia invalido' }),
    zonaCobertura: z.array(z.string().min(1, { message: 'La zona no puede estar vacia' }))
        .min(1, { message: 'Debe incluir al menos una zona de cobertura' })
        .optional(),
    fotosTrabajos: z.array(z.string())
        .optional(),
    disponible: z.boolean()
        .default(true)
})