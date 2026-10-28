import { Schema, model } from 'mongoose';

export const ESTADOS_BOOKING = ['pendiente', 'aceptada', 'rechazada', 'completada', 'cancelada'] as const

const bookingSchema = new Schema({
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    servicio: { type: Schema.Types.ObjectId, ref: 'Servicio', required: true },
    descripcion: { type: String, required: true },
    direccion: { type: String, required: true },
    fechaProgramada: { type: Date, required: true },
    estado: { type: String, enum: ESTADOS_BOOKING, default: 'pendiente' },
    isDeleted: { type: Boolean, default: false }
}, {
    timestamps: true
});

const bookingModel = model('Booking', bookingSchema);

export default bookingModel;