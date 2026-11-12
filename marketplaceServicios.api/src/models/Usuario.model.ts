import { Schema, model } from 'mongoose';

const usuarioSchema = new Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    correo: { type: String, required: true, unique: true, lowercase: true },
    password: {
        type: String,
        select: false,
        required: function (this: { googleId?: string }) {
            return !this.googleId;
        }
    },
    googleId: { type: String, unique: true, sparse: true },
    isDeleted: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    telefono: { type: String },
    ciudad: { type: String },
    fotoPerfil: { type: String },
    rol: { type: String, enum: ['cliente', 'proveedor', 'admin'], default: 'cliente' }
}, {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret: Record<string, unknown>) => {
            delete ret.password;
            delete ret.__v;
            return ret;
        }
    },
    toObject: {
        transform: (_doc, ret: Record<string, unknown>) => {
            delete ret.password;
            delete ret.__v;
            return ret;
        }
    }
});

const usuarioModel = model('Usuario', usuarioSchema);

export default usuarioModel;
