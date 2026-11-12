import { Schema, model } from 'mongoose';

const reviewSchema = new Schema({
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    proveedor: { type: Schema.Types.ObjectId, ref: 'Proveedor', required: true, index: true },
    // Opcional solo por compatibilidad con reseñas anteriores; el controlador siempre lo llena
    servicio: { type: Schema.Types.ObjectId, ref: 'Servicio', index: true },
    calificacion: { type: Number, required: true, min: 1, max: 5 },
    comentario: { type: String, required: true },
    isDeleted: { type: Boolean, default: false }
}, {
    timestamps: true
});

// Una reseña viva por booking. Si se borra (soft delete) se puede volver a reseñar.
// OJO: si en la base existe el índice viejo "booking_1" (único sin filtro), sigue
// bloqueando re-reseñar tras borrar. Hay que eliminarlo a mano una vez.
reviewSchema.index(
    { booking: 1 },
    { name: 'booking_unico_activo', unique: true, partialFilterExpression: { isDeleted: false } }
);

const reviewModel = model('Review', reviewSchema);

export default reviewModel;
