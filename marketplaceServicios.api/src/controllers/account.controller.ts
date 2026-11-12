import { Request, Response } from 'express';
import { httpStatus } from '../constants/httpsNumbers';
import { verifyEmailSchema, resetPasswordSchema } from '../schemas/Account.schema';
import {
    verifyEmail,
    resendVerification,
    requestPasswordReset,
    resetPassword,
    RESEND_COOLDOWN_MS
} from '../services/account.service';

const INVALID_TOKEN = 'INVALID_TOKEN';

const invalidToken = (res: Response) => {
    res.status(httpStatus.REQUEST_ERROR).json({
        error: { code: INVALID_TOKEN, message: 'El enlace no es válido, ya se usó o expiró' }
    });
};

const serverError = (res: Response) => {
    res.status(httpStatus.SERVER_ERROR).json({ error: { message: 'Error interno' } });
};

// POST /api/auth/verify-email  { token }   (también GET ?token=)
export const verifyEmailHandler = async (req: Request, res: Response) => {
    try {
        const parsed = verifyEmailSchema.safeParse({ token: req.body?.token ?? req.query.token });
        if (!parsed.success) return invalidToken(res);

        const ok = await verifyEmail(parsed.data.token);
        if (!ok) return invalidToken(res);

        res.status(httpStatus.SUCCESFUL).json({ message: 'Correo verificado', emailVerified: true });
    } catch {
        serverError(res);
    }
};

// POST /api/auth/resend-verification  (requiere sesión)
export const resendVerificationHandler = async (req: Request, res: Response) => {
    try {
        const result = await resendVerification(req.user!.id);

        switch (result) {
            case 'already_verified':
                res.status(httpStatus.SUCCESFUL).json({ message: 'Tu correo ya está verificado', emailVerified: true });
                return;
            case 'cooldown':
                res.status(httpStatus.TOO_MANY_REQUESTS).json({
                    error: { message: `Espera ${RESEND_COOLDOWN_MS / 1000} segundos antes de pedir otro correo` }
                });
                return;
            case 'not_found':
                res.status(httpStatus.UNAUTHORIZED).json({ error: { message: 'Usuario no encontrado o eliminado' } });
                return;
            default:
                res.status(httpStatus.SUCCESFUL).json({ message: 'Te enviamos un nuevo correo de verificación' });
        }
    } catch {
        serverError(res);
    }
};

// POST /api/auth/forgot-password  { correo }  → SIEMPRE 200 con el mismo mensaje
export const FORGOT_PASSWORD_MESSAGE =
    'Si existe una cuenta con ese correo, te enviamos un enlace para restablecer la contraseña.';

export const forgotPasswordHandler = (req: Request, res: Response) => {
    requestPasswordReset(req.body?.correo); // en segundo plano; no lanza
    res.status(httpStatus.SUCCESFUL).json({ message: FORGOT_PASSWORD_MESSAGE });
};

// POST /api/auth/reset-password  { token, password }
export const resetPasswordHandler = async (req: Request, res: Response) => {
    try {
        const parsed = resetPasswordSchema.safeParse(req.body ?? {});
        if (!parsed.success) {
            const passwordIssue = parsed.error.issues.find((i) => i.path[0] === 'password');
            if (passwordIssue) {
                res.status(httpStatus.REQUEST_ERROR).json({
                    error: { message: 'Datos invalidos', details: [{ field: 'password', message: passwordIssue.message }] }
                });
                return;
            }
            return invalidToken(res);
        }

        const ok = await resetPassword(parsed.data.token, parsed.data.password);
        if (!ok) return invalidToken(res);

        res.status(httpStatus.SUCCESFUL).json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
    } catch {
        serverError(res);
    }
};
