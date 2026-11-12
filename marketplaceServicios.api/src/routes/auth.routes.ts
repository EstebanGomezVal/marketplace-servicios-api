import { Router } from 'express';
import { registrar, login, logout, getMe } from '../controllers/auth.controller';
import { validate } from '../middleware/data.middleware';
import { registerSchema, loginSchema } from '../schemas/Usuario.schema';
import { authentication } from '../middleware/auth.middleware';
import { googleStart, googleCallback } from '../controllers/google-auth.controller';
import {
    verifyEmailHandler,
    resendVerificationHandler,
    forgotPasswordHandler,
    resetPasswordHandler
} from '../controllers/account.controller';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar usuario (rol cliente)
 *     description: "Crea la cuenta con `emailVerified=false` y envía el correo de verificación (si el correo falla, la respuesta no cambia)."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RegisterInput' }
 *     responses:
 *       201:
 *         description: Usuario creado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       400: { description: "Error al registrar", content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { $ref: '#/components/responses/ValidationFailed' }
 *       409: { description: "El correo ya está registrado", content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.post('/register', validate('body', registerSchema), registrar);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesión
 *     description: "Devuelve el JWT y además lo pone en la cookie httpOnly `token` (1 h)."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginInput' }
 *     responses:
 *       200:
 *         description: Sesión iniciada
 *         headers:
 *           Set-Cookie: { schema: { type: string }, description: 'token=<JWT>; HttpOnly; SameSite=Lax' }
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       401: { description: "Correo o contraseña incorrectos", content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { $ref: '#/components/responses/ValidationFailed' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
router.post('/login', validate('body', loginSchema), login);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Cerrar sesión (borra la cookie token)
 *     responses:
 *       200:
 *         description: Sesión cerrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Message' }
 */
router.post('/logout', logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Usuario autenticado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Datos del usuario (incluye emailVerified)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Usuario' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
router.get('/me', authentication, getMe);

// Verificación de correo y recuperación de contraseña

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     tags: [Cuenta]
 *     summary: Verificar correo con el token del enlace
 *     description: El token es de un solo uso y expira (VERIFY_EMAIL_TTL_HOURS).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TokenInput' }
 *     responses:
 *       200:
 *         description: Correo verificado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Correo verificado }
 *                 emailVerified: { type: boolean, example: true }
 *       400:
 *         description: "Token inválido, usado o expirado (`code: INVALID_TOKEN`)"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorWithCode' }
 *       500: { $ref: '#/components/responses/ServerError' }
 *   get:
 *     tags: [Cuenta]
 *     summary: Verificar correo (token por query)
 *     parameters:
 *       - { name: token, in: query, required: true, schema: { type: string, pattern: '^[a-f0-9]{64}$' } }
 *     responses:
 *       200: { description: "Correo verificado" }
 *       400:
 *         description: "Token inválido, usado o expirado (`code: INVALID_TOKEN`)"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorWithCode' }
 */
router.post('/verify-email', verifyEmailHandler);
router.get('/verify-email', verifyEmailHandler);

/**
 * @openapi
 * /auth/resend-verification:
 *   post:
 *     tags: [Cuenta]
 *     summary: Reenviar correo de verificación
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: "Correo enviado, o el correo ya estaba verificado (`emailVerified: true`)"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 emailVerified: { type: boolean }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       429: { description: "Espera 60 segundos entre reenvíos", content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
router.post('/resend-verification', authentication, resendVerificationHandler);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Cuenta]
 *     summary: Pedir enlace para restablecer contraseña
 *     description: "Responde SIEMPRE 200 con el mismo mensaje, exista o no la cuenta (no revela qué correos están registrados)."
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               correo: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Respuesta genérica
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Message' }
 */
router.post('/forgot-password', forgotPasswordHandler);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Cuenta]
 *     summary: Restablecer contraseña con el token del correo
 *     description: Token de un solo uso (RESET_PASSWORD_TTL_MINUTES). También marca el correo como verificado.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ResetPasswordInput' }
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Message' }
 *       400:
 *         description: "Contraseña inválida (`details`) o token inválido/usado/expirado (`code: INVALID_TOKEN`)"
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - { $ref: '#/components/schemas/ValidationError' }
 *                 - { $ref: '#/components/schemas/ErrorWithCode' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
router.post('/reset-password', resetPasswordHandler);

// Google OAuth (si faltan GOOGLE_* ambas redirigen a /login?error=google)

/**
 * @openapi
 * /auth/google:
 *   get:
 *     tags: [Auth]
 *     summary: Iniciar login con Google (navegador)
 *     description: "Redirige a la pantalla de consentimiento de Google. Si Google no está configurado (faltan GOOGLE_*) redirige a `/login?error=google`. Ábrelo en el navegador, no desde \"Try it out\"."
 *     responses:
 *       302: { description: "Redirección a Google o a /login?error=google" }
 * /auth/google/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Callback de Google OAuth
 *     description: "Éxito → pone la cookie `token` y redirige a `/servicios`. Cualquier fallo → `/login?error=google`."
 *     parameters:
 *       - { name: code, in: query, schema: { type: string } }
 *       - { name: state, in: query, schema: { type: string } }
 *     responses:
 *       302: { description: "Redirección a /servicios o a /login?error=google" }
 */
router.get('/google', googleStart);
router.get('/google/callback', googleCallback);

export default router;
