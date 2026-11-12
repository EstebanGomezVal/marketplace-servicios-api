import { Request, Response } from 'express';
import { resetPasswordSchema } from '../schemas/Account.schema';
import {
    verifyEmail,
    resendVerification,
    requestPasswordReset,
    resetPassword,
    RESEND_COOLDOWN_MS
} from '../services/account.service';
import { FORGOT_PASSWORD_MESSAGE } from './account.controller';
import { safeNext, CurrentUser } from '../middleware/view-session.middleware';

/*
 * Páginas a las que llegan los enlaces de los correos, y formularios
 * de "olvidé mi contraseña". Usan la misma lógica que /api/auth/...
 */

type Mensaje = {
    title: string;
    tipo: 'success' | 'error' | 'info';
    mensaje: string;
    accion?: { href: string; texto: string };
};

const renderMensaje = (res: Response, data: Mensaje, status = 200) => {
    res.status(status).render('auth/message', data);
};

// Las URLs llevan el token: que no se filtre por Referer al seguir un enlace
const noReferrer = (res: Response) => res.setHeader('Referrer-Policy', 'no-referrer');

/* ---------- GET /verificar-email?token= ---------- */

export const verifyEmailPage = async (req: Request, res: Response) => {
    noReferrer(res);
    const ok = await verifyEmail(req.query.token);

    if (ok) {
        // Si la sesión abierta es la del usuario, el banner desaparece desde ya
        const user: CurrentUser | null = res.locals.currentUser;
        if (user) user.emailVerified = true;
        renderMensaje(res, {
            title: 'Correo verificado',
            tipo: 'success',
            mensaje: '¡Listo! Tu correo quedó verificado. Ya puedes solicitar servicios y dejar reseñas.',
            accion: { href: '/servicios', texto: 'Ver servicios' }
        });
        return;
    }

    renderMensaje(res, {
        title: 'Enlace no válido',
        tipo: 'error',
        mensaje: 'El enlace de verificación no es válido, ya se usó o expiró.',
        accion: res.locals.currentUser
            ? { href: '/mis-solicitudes', texto: 'Ir a mi cuenta' }
            : { href: '/login', texto: 'Iniciar sesión para pedir otro' }
    }, 400);
};

/* ---------- POST /reenviar-verificacion  (requireViewAuth) ---------- */

export const resendVerificationSubmit = async (req: Request, res: Response) => {
    const user: CurrentUser = res.locals.currentUser;
    const result = await resendVerification(user.id);
    const volver = { href: safeNext(req.body?.next), texto: 'Volver' };

    const mensajes: Record<typeof result, Mensaje> = {
        sent: { title: 'Correo enviado', tipo: 'success', mensaje: 'Te enviamos un nuevo enlace de verificación. Revisa tu bandeja (y la carpeta de spam).', accion: volver },
        already_verified: { title: 'Correo verificado', tipo: 'info', mensaje: 'Tu correo ya estaba verificado.', accion: volver },
        cooldown: { title: 'Espera un momento', tipo: 'info', mensaje: `Acabamos de enviarte un correo. Espera ${RESEND_COOLDOWN_MS / 1000} segundos antes de pedir otro.`, accion: volver },
        not_found: { title: 'Sesión no válida', tipo: 'error', mensaje: 'No encontramos tu cuenta. Inicia sesión de nuevo.', accion: { href: '/login', texto: 'Iniciar sesión' } }
    };

    renderMensaje(res, mensajes[result], result === 'cooldown' ? 429 : 200);
};

/* ---------- /olvide-password ---------- */

export const forgotPasswordForm = (_req: Request, res: Response) => {
    res.render('auth/forgot-password', { title: 'Recuperar contraseña' });
};

export const forgotPasswordSubmit = (req: Request, res: Response) => {
    requestPasswordReset(req.body?.correo); // en segundo plano; misma respuesta siempre
    renderMensaje(res, {
        title: 'Revisa tu correo',
        tipo: 'info',
        mensaje: FORGOT_PASSWORD_MESSAGE,
        accion: { href: '/login', texto: 'Volver al inicio de sesión' }
    });
};

/* ---------- /restablecer-password?token= ---------- */

export const resetPasswordForm = (req: Request, res: Response) => {
    noReferrer(res);
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    res.render('auth/reset-password', { title: 'Nueva contraseña', token });
};

export const resetPasswordSubmit = async (req: Request, res: Response) => {
    noReferrer(res);
    const token = typeof req.body?.token === 'string' ? req.body.token : '';
    const parsed = resetPasswordSchema.safeParse({ token, password: req.body?.password });

    const passwordIssue = parsed.success ? undefined : parsed.error.issues.find((i) => i.path[0] === 'password');
    if (passwordIssue) {
        res.status(400).render('auth/reset-password', {
            title: 'Nueva contraseña', token, errors: { password: passwordIssue.message }
        });
        return;
    }

    if (req.body?.password !== req.body?.confirmar) {
        res.status(400).render('auth/reset-password', {
            title: 'Nueva contraseña', token, errors: { confirmar: 'Las contraseñas no coinciden' }
        });
        return;
    }

    const ok = parsed.success && await resetPassword(parsed.data.token, parsed.data.password);
    if (!ok) {
        renderMensaje(res, {
            title: 'Enlace no válido',
            tipo: 'error',
            mensaje: 'El enlace para restablecer la contraseña no es válido, ya se usó o expiró.',
            accion: { href: '/olvide-password', texto: 'Pedir un enlace nuevo' }
        }, 400);
        return;
    }

    renderMensaje(res, {
        title: 'Contraseña actualizada',
        tipo: 'success',
        mensaje: 'Tu contraseña se cambió correctamente. Ya puedes iniciar sesión con ella.',
        accion: { href: '/login', texto: 'Iniciar sesión' }
    });
};
