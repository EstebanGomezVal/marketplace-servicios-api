import { Request, Response, NextFunction } from 'express';
import usuarioModel from '../models/Usuario.model';
import { httpStatus } from '../constants/httpsNumbers';

export const EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED';

/*
 * Va DESPUÉS de requireAuth. Consulta la base (no el JWT) para que el cambio
 * tenga efecto apenas el usuario verifica, sin volver a iniciar sesión.
 */
export const requireVerifiedEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            res.status(httpStatus.UNAUTHORIZED).json({ error: { message: 'No autenticado' } });
            return;
        }

        const usuario = await usuarioModel.findById(req.user.id).select('emailVerified');
        if (!usuario?.emailVerified) {
            res.status(httpStatus.FORBIDDEN).json({
                error: {
                    code: EMAIL_NOT_VERIFIED,
                    message: 'Debes verificar tu correo antes de realizar esta acción. Revisa tu bandeja o usa POST /api/auth/resend-verification.'
                }
            });
            return;
        }

        next();
    } catch {
        res.status(httpStatus.SERVER_ERROR).json({ error: { message: 'Error interno' } });
    }
};
