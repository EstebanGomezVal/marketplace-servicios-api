import { Schema, model } from 'mongoose';

const reviewSchema = new Schema({
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    proveedor: { type: Schema.Types.ObjectId, ref: 'Proveedor', required: true },
    calificacion: { type: Number, required: true, min: 1, max: 5 },
    comentario: { type: String },
    isDeleted: { type: Boolean, default: false }
}, {
    timestamps: true
});

const reviewModel = model('Review', reviewSchema);

export default reviewModel;