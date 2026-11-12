import { Schema, model } from 'mongoose';

const proveedorSchema = new Schema({
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, unique: true },
    descripcion: { type: String, required: true },
    experienciaAnios: { type: Number, required: true, min: 0 },
    zonaCobertura: [{ type: String }],
    fotosTrabajos: [{ type: String }],
    disponible: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
}, {
    timestamps: true
});

const proveedorModel = model('Proveedor', proveedorSchema);

export default proveedorModel;