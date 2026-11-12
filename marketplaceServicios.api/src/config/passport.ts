import crypto from 'crypto';
import { Request } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import usuarioModel from '../models/Usuario.model';
import { moduleLogger } from './logger';

const log = moduleLogger('auth');

/*
 * Login con Google (passport-google-oauth20), sin sesiones de express:
 * al volver de Google se emite el mismo JWT + cookie "token" que el login normal.
 *
 * Variables de entorno:
 *   GOOGLE_CLIENT_ID      (obligatoria)
 *   GOOGLE_CLIENT_SECRET  (obligatoria)
 *   GOOGLE_CALLBACK_URL   (opcional; por defecto http://localhost:<PORT>/api/auth/google/callback)
 *
 * Si falta alguna obligatoria, el servidor arranca igual y Google queda desactivado.
 */

let googleEnabled = false;

export const isGoogleEnabled = () => googleEnabled;

/* ---------- state anti-CSRF guardado en cookie (no hay express-session) ---------- */

const STATE_COOKIE = 'g_oauth_state';

type StoreCallback = (err: Error | null, state?: string) => void;
type VerifyStateCallback = (err: Error | null, ok: boolean, state?: unknown) => void;

const cookieStateStore = {
    // arity 3 → passport-oauth2 llama store(req, meta, cb)
    store(req: Request, _meta: unknown, callback: StoreCallback) {
        const state = crypto.randomBytes(24).toString('hex');
        req.res?.cookie(STATE_COOKIE, state, {
            httpOnly: true,
            sameSite: 'lax', // la vuelta desde Google es una navegación GET top-level
            maxAge: 10 * 60 * 1000,
            path: '/api/auth/google'
        });
        callback(null, state);
    },

    // arity 3 → verify(req, state, cb)
    verify(req: Request, state: string, callback: VerifyStateCallback) {
        const expected: unknown = req.cookies?.[STATE_COOKIE];
        req.res?.clearCookie(STATE_COOKIE, { path: '/api/auth/google' });

        const ok =
            typeof expected === 'string' &&
            typeof state === 'string' &&
            expected.length === state.length &&
            crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(state));

        if (!ok) return callback(null, false, { message: 'State de OAuth inválido o expirado' });
        callback(null, true);
    }
};

/* ---------- Usuario a partir del perfil de Google ---------- */

const findOrCreateGoogleUser = async (profile: Profile) => {
    const email = profile.emails?.[0]?.value?.toLowerCase();
    const emailVerified = profile._json.email_verified === true;

    // 1) Ya vinculado
    const vinculado = await usuarioModel.findOne({ googleId: profile.id });
    if (vinculado) {
        if (vinculado.isDeleted) return null;
        if (emailVerified && !vinculado.emailVerified) {
            vinculado.emailVerified = true;
            await vinculado.save();
        }
        return vinculado;
    }

    if (!email) return null;

    // 2) Cuenta existente con ese correo → se vincula solo si Google confirma el correo
    const existente = await usuarioModel.findOne({ correo: email });
    if (existente) {
        if (existente.isDeleted || !emailVerified) return null;
        existente.googleId = profile.id;
        existente.emailVerified = true; // Google confirmó el correo
        if (!existente.fotoPerfil && profile.photos?.[0]?.value) {
            existente.fotoPerfil = profile.photos[0].value;
        }
        await existente.save();
        return existente;
    }

    // 3) Cuenta nueva: siempre cliente, sin password
    if (!emailVerified) return null;
    return usuarioModel.create({
        googleId: profile.id,
        correo: email,
        nombre: profile.name?.givenName || profile.displayName || 'Usuario',
        apellido: profile.name?.familyName || '-', // apellido es obligatorio en el modelo
        ...(profile.photos?.[0]?.value ? { fotoPerfil: profile.photos[0].value } : {}),
        rol: 'cliente',
        emailVerified: true // solo se llega aquí con email_verified de Google
    });
};

/* ---------- Registro de la estrategia ---------- */

export const setupPassport = () => {
    const clientID = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

    if (!clientID || !clientSecret) {
        const faltan = [!clientID && 'GOOGLE_CLIENT_ID', !clientSecret && 'GOOGLE_CLIENT_SECRET']
            .filter(Boolean)
            .join(', ');
        log.warn({ missing: faltan }, `Login con Google desactivado: falta ${faltan} en el entorno`);
        googleEnabled = false;
        return;
    }

    const port = Number(process.env.PORT) || 3000;
    const callbackURL =
        process.env.GOOGLE_CALLBACK_URL?.trim() || `http://localhost:${port}/api/auth/google/callback`;

    passport.use(
        new GoogleStrategy(
            {
                clientID,
                clientSecret,
                callbackURL,
                store: cookieStateStore as never, // los tipos no exponen "store", passport-oauth2 sí lo soporta
                scope: ['profile', 'email']
            },
            async (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
                try {
                    const usuario = await findOrCreateGoogleUser(profile);
                    if (!usuario) return done(null, false);
                    done(null, usuario);
                } catch (error) {
                    done(error as Error);
                }
            }
        )
    );

    googleEnabled = true;
    log.info({ callbackURL }, `Login con Google activado (callback: ${callbackURL})`);
};

export default passport;
