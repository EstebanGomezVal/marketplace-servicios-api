import { Schema, model } from 'mongoose';

export const ESTADOS_BOOKING = ['pendiente', 'aceptada', 'rechazada', 'completada', 'cancelada'] as const;
export type EstadoBooking = typeof ESTADOS_BOOKING[number];

const bookingSchema = new Schema({
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    servicio: { type: Schema.Types.ObjectId, ref: 'Servicio', required: true, index: true },
    descripcion: { type: String },
    direccion: { type: String },
    fechaProgramada: { type: Date },
    estado: { type: String, enum: ESTADOS_BOOKING, default: 'pendiente' },
    isDeleted: { type: Boolean, default: false }
}, {
    timestamps: true
});

const bookingModel = model('Booking', bookingSchema);

export default bookingModel;
