import bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import usuarioModel from '../models/Usuario.model';
import { createOneTimeToken, consumeOneTimeToken, lastTokenCreatedAt } from './token.service';
import { appUrl, resetPasswordEmail, sendMailInBackground, verificationEmail } from './mail.service';
import { moduleLogger } from '../config/logger';

const log = moduleLogger('account');

/*
 * Verificación de correo y recuperación de contraseña.
 * Lo usan la API (/api/auth/...) y las vistas HTML (/verificar-email, /olvide-password, ...).
 */

const SALT_ROUNDS = 10; // igual que auth.service

const hours = (h: number) => h * 60 * 60 * 1000;
const minutes = (m: number) => m * 60 * 1000;

const positiveNumber = (value: string | undefined, fallback: number) => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const verifyEmailTtlMs = () => hours(positiveNumber(process.env.VERIFY_EMAIL_TTL_HOURS, 24));
export const resetPasswordTtlMs = () => minutes(positiveNumber(process.env.RESET_PASSWORD_TTL_MINUTES, 30));
export const RESEND_COOLDOWN_MS = 60 * 1000;

type UsuarioBasico = { _id: Types.ObjectId | string; correo: string; nombre: string };

/* Verificación de correo */

/*
 * Crea el token y manda el correo sin bloquear al llamador.
 * Si algo falla (base o SMTP) solo se loguea: el registro no se cae por esto.
 */
export const sendVerificationEmail = async (usuario: UsuarioBasico) => {
    try {
        const ttl = verifyEmailTtlMs();
        const token = await createOneTimeToken(usuario._id, 'verify_email', ttl);
        const url = `${appUrl()}/verificar-email?token=${token}`;
        sendMailInBackground(verificationEmail(usuario.correo, usuario.nombre, url, ttl));
    } catch (error) {
        log.warn({ err: error }, 'No se pudo preparar el correo de verificación');
    }
};

// true si el token era válido y el correo quedó verificado
export const verifyEmail = async (token: unknown) => {
    const usuarioId = await consumeOneTimeToken(token, 'verify_email');
    if (!usuarioId) return false;

    const usuario = await usuarioModel.findOneAndUpdate(
        { _id: usuarioId, isDeleted: { $ne: true } },
        { emailVerified: true },
        { new: true }
    );
    return !!usuario;
};

export type ResendResult = 'sent' | 'already_verified' | 'cooldown' | 'not_found';

export const resendVerification = async (usuarioId: string): Promise<ResendResult> => {
    const usuario = await usuarioModel.findById(usuarioId).select('correo nombre emailVerified isDeleted');
    if (!usuario || usuario.isDeleted) return 'not_found';
    if (usuario.emailVerified) return 'already_verified';

    const last = await lastTokenCreatedAt(usuario._id, 'verify_email');
    if (last && Date.now() - last.getTime() < RESEND_COOLDOWN_MS) return 'cooldown';

    await sendVerificationEmail(usuario);
    return 'sent';
};

/* Recuperación de contraseña */

/*
 * No devuelve nada a propósito: el llamador responde siempre lo mismo
 * exista o no el correo. El trabajo corre en segundo plano para que el tiempo
 * de respuesta tampoco delate si la cuenta existe.
 */
export const requestPasswordReset = (correo: unknown) => {
    if (typeof correo !== 'string' || correo.trim() === '') return;

    void (async () => {
        try {
            const usuario = await usuarioModel
                .findOne({ correo: correo.trim().toLowerCase(), isDeleted: { $ne: true } })
                .select('correo nombre');
            if (!usuario) return;

            const ttl = resetPasswordTtlMs();
            const token = await createOneTimeToken(usuario._id, 'reset_password', ttl);
            const url = `${appUrl()}/restablecer-password?token=${token}`;
            sendMailInBackground(resetPasswordEmail(usuario.correo, usuario.nombre, url, ttl));
        } catch (error) {
            log.warn({ err: error }, 'No se pudo procesar forgot-password');
        }
    })();
};

// true si el token era válido y la contraseña se cambió
export const resetPassword = async (token: unknown, nuevaPassword: string) => {
    const usuarioId = await consumeOneTimeToken(token, 'reset_password');
    if (!usuarioId) return false;

    const usuario = await usuarioModel.findOneAndUpdate(
        { _id: usuarioId, isDeleted: { $ne: true } },
        {
            password: await bcrypt.hash(nuevaPassword, SALT_ROUNDS),
            // Abrir el enlace del correo demuestra que el correo es suyo
            emailVerified: true
        },
        { new: true }
    );
    return !!usuario;
};
