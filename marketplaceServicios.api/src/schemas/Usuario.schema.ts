import { z } from 'zod';

export const usuarioSchemaZod = z.object({
     nombre: z.string()
        .min(1, { message: 'El nombre es obligatorio' }),
    apellido: z.string()
        .min(1, { message: 'El apeliido es obligatorio' }),
    correo: z.string()
        .min(1, { message: 'El correo es obligatorio' })
        .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
            message: 'Debe ser un correo electronico valido'
        }),
    password: z.string()
        .min(10, { message: 'La contraseniaa debe tener al menos 10 caracteres' })
        .regex(/^(?=.*[A-Z])(?=.*\d)/, { message: 'Debe incluir al menos una mayuscula y un numero' }),
    telefono: z.string()
        .min(1, { message: 'El telefono es obligatorio' })
        .regex(/^[0-9]{10}$/, { message: 'El telefono debe tener exactamente 10 digitos numericos' })
        .optional(),
    ciudad: z.string()
        .min(1, { message: 'La ciudad no puede estar vacia' })
        .optional(),
    fotoPerfil: z.string()
        .min(1, { message: 'La URL no puede estar vacia' })
        .refine((val) => {
            try {
                new URL(val)
                return true
            } catch {
                return false
            }
        }, {
            message: 'Debe ser una URL valida'
        })
        .optional(),
            rol: z.enum(['cliente', 'proveedor', 'admin']).optional()
})

