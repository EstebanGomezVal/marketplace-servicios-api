import { Schema, model } from 'mongoose';

export const TOKEN_PURPOSES = ['verify_email', 'reset_password'] as const;
export type TokenPurpose = typeof TOKEN_PURPOSES[number];

/*
 * Tokens de un solo uso (verificación de correo, reset de contraseña).
 * Solo se guarda el sha256 del token; el valor en claro solo existe en el correo.
 */
const oneTimeTokenSchema = new Schema({
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    purpose: { type: String, enum: TOKEN_PURPOSES, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    usedAt: { type: Date }
}, {
    timestamps: true
});

// Limpieza automática: Mongo borra el documento 1 día después de expirar
oneTimeTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

const oneTimeTokenModel = model('OneTimeToken', oneTimeTokenSchema);

export default oneTimeTokenModel;
