import { z } from 'zod';
import { TOKEN_FORMAT } from '../services/token.service';

const token = z.string({ message: 'El token es obligatorio' })
    .regex(TOKEN_FORMAT, { message: 'Token inválido o expirado' });

export const verifyEmailSchema = z.object({ token });

// Misma regla de contraseña que registerSchema
export const resetPasswordSchema = z.object({
    token,
    password: z.string({ message: 'La contraseña es obligatoria' })
        .min(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
});
