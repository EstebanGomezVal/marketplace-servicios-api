import { Schema, model } from 'mongoose';

const usuarioSchema = new Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    correo: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true, select: false },
    telefono: { type: String },
    ciudad: { type: String },
    fotoPerfil: { type: String },
    rol: { type: String, enum: ['cliente', 'proveedor', 'admin'], default: 'cliente' },
    isDeleted: { type: Boolean, default: false }
}, {
    timestamps: true
});

const usuarioModel = model('Usuario', usuarioSchema);

export default usuarioModel;