import crypto from 'crypto';
import { Types } from 'mongoose';
import oneTimeTokenModel, { TokenPurpose } from '../models/OneTimeToken.model';

type UserId = Types.ObjectId | string;

/*
 * Tokens de un solo uso.
 *  - Valor en claro: randomBytes(32) en hex (64 caracteres). Solo viaja en el correo.
 *  - En la base: sha256 del valor. Un volcado de la base no permite usar los tokens.
 *  - NUNCA loguear el valor en claro.
 */

export const TOKEN_FORMAT = /^[a-f0-9]{64}$/;

export const hashToken = (plain: string) =>
    crypto.createHash('sha256').update(plain, 'utf8').digest('hex');

/*
 * Crea un token nuevo e invalida los anteriores sin usar del mismo propósito,
 * así solo el último correo enviado sirve.
 */
export const createOneTimeToken = async (
    usuarioId: UserId,
    purpose: TokenPurpose,
    ttlMs: number
): Promise<string> => {
    await oneTimeTokenModel.updateMany(
        { usuario: usuarioId, purpose, used: false },
        { used: true, usedAt: new Date() }
    );

    const plain = crypto.randomBytes(32).toString('hex');
    await oneTimeTokenModel.create({
        usuario: usuarioId,
        tokenHash: hashToken(plain),
        purpose,
        expiresAt: new Date(Date.now() + ttlMs)
    });

    return plain;
};

/*
 * Consume el token de forma atómica: solo una petición puede marcarlo como usado.
 * Devuelve el id del usuario o null si no existe, está usado, expiró o es de otro propósito.
 */
export const consumeOneTimeToken = async (plain: unknown, purpose: TokenPurpose) => {
    if (typeof plain !== 'string' || !TOKEN_FORMAT.test(plain)) return null;

    const token = await oneTimeTokenModel.findOneAndUpdate(
        {
            tokenHash: hashToken(plain),
            purpose,
            used: false,
            expiresAt: { $gt: new Date() }
        },
        { used: true, usedAt: new Date() },
        { new: true }
    );

    return token ? String(token.usuario) : null;
};

// Para limitar reenvíos: fecha del último token emitido de ese propósito
export const lastTokenCreatedAt = async (usuarioId: UserId, purpose: TokenPurpose) => {
    const last = await oneTimeTokenModel
        .findOne({ usuario: usuarioId, purpose })
        .sort({ createdAt: -1 })
        .select('createdAt');
    return last?.get('createdAt') as Date | undefined;
};
