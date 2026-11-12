import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { loginSchema, registerSchema } from '../schemas/Usuario.schema';
import {
    register,
    login as loginService,
    signToken,
    INVALID_CREDENTIALS_ERROR,
    RegisterUserData
} from '../services/auth.service';
import { TOKEN_COOKIE, tokenCookieOptions, safeNext } from '../middleware/view-session.middleware';
type FieldErrors = Record<string, string>;

const toFieldErrors = (error: ZodError): FieldErrors => {
    const errors: FieldErrors = {};
    for (const issue of error.issues) {
        const field = String(issue.path[0] ?? 'general');
        if (!errors[field]) errors[field] = issue.message;
    }
    return errors;
};

const setSession = (res: Response, usuario: Parameters<typeof signToken>[0]) => {
    res.cookie(TOKEN_COOKIE, signToken(usuario), tokenCookieOptions);
};

const OPTIONAL_FIELDS = new Set(['telefono', 'ciudad']);

// Recorta espacios. Los opcionales vacíos se quitan (un input vacío llega como "");
// los obligatorios se dejan como "" para que salga el mensaje propio del schema.
const compact = (body: Record<string, unknown>) =>
    Object.fromEntries(
        Object.entries(body)
            .map(([k, v]) => [k, typeof v === 'string' && k !== 'password' ? v.trim() : v])
            .filter(([k, v]) => !(OPTIONAL_FIELDS.has(String(k)) && v === ''))
    );

// Login 

export const loginForm = (req: Request, res: Response) => {
    const errors = req.query.error === 'google'
        ? { general: 'No se pudo iniciar sesión con Google. Intenta de nuevo o usa tu correo y contraseña.' }
        : undefined;
    res.render('auth/login', { title: 'Iniciar sesión', next: safeNext(req.query.next), errors });
};

export const loginSubmit = async (req: Request, res: Response) => {
    const next = safeNext(req.body?.next);
    const values = { correo: req.body?.correo ?? '' };

    const parsed = loginSchema.safeParse(compact(req.body ?? {}));
    if (!parsed.success) {
        res.status(400).render('auth/login', {
            title: 'Iniciar sesión', next, values, errors: toFieldErrors(parsed.error)
        });
        return;
    }

    try {
        const usuario = await loginService(parsed.data);
        setSession(res, usuario);
        res.redirect(next);
    } catch (error) {
        const message = error instanceof Error && error.message === INVALID_CREDENTIALS_ERROR
            ? INVALID_CREDENTIALS_ERROR
            : 'No se pudo iniciar sesión. Intenta de nuevo.';
        res.status(error instanceof Error && error.message === INVALID_CREDENTIALS_ERROR ? 401 : 500)
            .render('auth/login', { title: 'Iniciar sesión', next, values, errors: { general: message } });
    }
};

// Registro 

export const registerForm = (_req: Request, res: Response) => {
    res.render('auth/register', { title: 'Crear cuenta' });
};

export const registerSubmit = async (req: Request, res: Response) => {
    const body = req.body ?? {};
    const quiereSerProveedor = body.esProveedor === 'on';
    const values = {
        nombre: body.nombre ?? '',
        apellido: body.apellido ?? '',
        correo: body.correo ?? '',
        telefono: body.telefono ?? '',
        ciudad: body.ciudad ?? '',
        esProveedor: quiereSerProveedor
    };

    // registerSchema descarta claves desconocidas: un "rol" enviado a mano se ignora
    const parsed = registerSchema.safeParse(compact(body));
    if (!parsed.success) {
        res.status(400).render('auth/register', {
            title: 'Crear cuenta', values, errors: toFieldErrors(parsed.error)
        });
        return;
    }

    // El rol lo decide el servidor: nunca admin
    const userData = {
        ...parsed.data,
        rol: quiereSerProveedor ? 'proveedor' : 'cliente'
    } as RegisterUserData;

    try {
        const usuario = await register(userData);
        setSession(res, usuario);
        res.redirect('/servicios');
    } catch (error) {
        const message = error instanceof Error ? error.message : '';
        const duplicado = message.includes('E11000') || message.includes('duplicate');
        res.status(duplicado ? 409 : 500).render('auth/register', {
            title: 'Crear cuenta',
            values,
            errors: duplicado
                ? { correo: 'El correo ya está registrado' }
                : { general: 'No se pudo crear la cuenta. Intenta de nuevo.' }
        });
    }
};

// logout

export const logoutSubmit = (_req: Request, res: Response) => {
    res.clearCookie(TOKEN_COOKIE, { httpOnly: true, sameSite: 'lax' });
    res.redirect('/servicios');
};
