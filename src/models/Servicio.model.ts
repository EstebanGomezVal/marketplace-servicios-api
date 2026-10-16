import { Schema, model } from 'mongoose';

export const CATEGORIAS_VALIDAS = [
    'Plomería', 'Electricidad', 'Carpintería',
    'Limpieza', 'Jardinería', 'Construcción',
    'Tecnología', 'Otro'
];

const servicioSchema = new Schema({
    proveedor: { type: Schema.Types.ObjectId, ref: 'Proveedor', required: true },
    titulo: { type: String, required: true },
    descripcion: { type: String, required: true },
    categoria: { 
        type: String, 
        required: true, 
        enum: CATEGORIAS_VALIDAS 
    },
    precio: { type: Number, required: true },
    tipoPrecio: { type: String, enum: ['fijo', 'por hora', 'cotización'], required: true },
    activo: { type: Boolean, default: true }
}, {
    timestamps: true
});

const servicioModel = model('Servicio', servicioSchema);

export default servicioModel;