import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import usuarioModel from '../models/Usuario.model';

// Solo para rutas HTML. Nunca responde 401: si no hay sesión válida,
// la petición sigue como anónima. La API usa auth.middleware.ts.

export const TOKEN_COOKIE = 'token';

export const tokenCookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 1000 // 1h, igual que el JWT
};

export interface CurrentUser {
    id: string;
    nombre: string;
    rol: 'cliente' | 'proveedor' | 'admin';
    emailVerified: boolean;
}

interface JwtPayload {
    id?: string;
    sub?: string;
}

export const loadUser = async (req: Request, res: Response, next: NextFunction) => {
    res.locals.currentUser = null;

    const token: string | undefined = req.cookies?.[TOKEN_COOKIE];
    if (!token) return next();

    try {
        const secret = process.env.JWT_SECRET || 'secreto_temporal';
        const payload = jwt.verify(token, secret) as JwtPayload;
        const userId = payload.id ?? payload.sub;
        if (!userId) return next();

        const usuario = await usuarioModel.findById(userId).select('nombre rol isDeleted emailVerified').lean();
        if (!usuario || usuario.isDeleted) {
            res.clearCookie(TOKEN_COOKIE);
            return next();
        }

        const currentUser: CurrentUser = {
            id: String(usuario._id),
            nombre: usuario.nombre,
            rol: usuario.rol as CurrentUser['rol'],
            emailVerified: usuario.emailVerified === true // lean: sin default para usuarios viejos
        };
        res.locals.currentUser = currentUser;
    } catch {
        // Token inválido o expirado: se limpia y se sigue como anónimo
        res.clearCookie(TOKEN_COOKIE);
    }

    next();
};

// Evita open redirects: solo rutas internas ("/algo", no "//host" ni URLs absolutas)
export const safeNext = (value: unknown, fallback = '/servicios'): string => {
    if (typeof value !== 'string') return fallback;
    if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
    return value;
};

export const requireViewAuth = (req: Request, res: Response, next: NextFunction) => {
    if (res.locals.currentUser) return next();
    res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
};

// Para /login y /registro: si ya hay sesión, no tiene sentido mostrarlos
export const redirectIfAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (res.locals.currentUser) {
        res.redirect(safeNext(req.query.next));
        return;
    }
    next();
};
