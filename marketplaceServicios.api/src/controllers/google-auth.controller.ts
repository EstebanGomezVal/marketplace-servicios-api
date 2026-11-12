import { Request, Response, NextFunction } from 'express';
import passport, { isGoogleEnabled } from '../config/passport';
import { signToken } from '../services/auth.service';
import { TOKEN_COOKIE, tokenCookieOptions } from '../middleware/view-session.middleware';
import { moduleLogger } from '../config/logger';

const log = moduleLogger('auth');

const FAIL_REDIRECT = '/login?error=google';
const SUCCESS_REDIRECT = '/servicios';

type GoogleUser = Parameters<typeof signToken>[0];

// GET /api/auth/google
export const googleStart = (req: Request, res: Response, next: NextFunction) => {
    if (!isGoogleEnabled()) {
        res.redirect(FAIL_REDIRECT);
        return;
    }
    passport.authenticate('google', { session: false })(req, res, next);
};

// GET /api/auth/google/callback
export const googleCallback = (req: Request, res: Response, next: NextFunction) => {
    if (!isGoogleEnabled()) {
        res.redirect(FAIL_REDIRECT);
        return;
    }

    passport.authenticate(
        'google',
        { session: false },
        (err: unknown, usuario: GoogleUser | false) => {
            if (err || !usuario) {
                if (err) log.error({ err }, 'Error en callback de Google');
                res.redirect(FAIL_REDIRECT);
                return;
            }

            res.cookie(TOKEN_COOKIE, signToken(usuario), tokenCookieOptions);
            res.redirect(SUCCESS_REDIRECT);
        }
    )(req, res, next);
};
