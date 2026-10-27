import { z } from 'zod';

export const usuarioSchemaZod = z.object({
    descripcion: z.string()
        .min(1, 'El usuario es obligatorio'),
    apellido: z.string()
        .min(1, 'El apeliido es obligatorio'),
    email: z.string()
        .min(1, { message: 'El correo es obligatorio' })
        .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
        message: 'Debe ser un correo electronico valido'}),
    password: z.string()
        .min(10, 'La contraseniaa debe tener al menos 10 caracteres')
        .regex(/^(?=.*[A-Z])(?=.*\d)/, 'Debe incluir al menos una mayuscula y un numero'),
    telefono: z.string()
        .min(1, 'El telefono es obligatorio')
        .regex(/^[0-9]{10}$/, 'El telefono debe tener exactamente 10 dígitos numericos')
        .optional(),
    ciudad: z.string()
        .min(1, 'El apeliido es obligatorio')
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
        rol: z.enum(['admin', 'client', 'provider'], 'El rol debe ser admin, client o provider')
        .default('client')
})

