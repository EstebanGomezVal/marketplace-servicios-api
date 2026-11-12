import { Request, Response } from 'express';
import reviewModel from '../models/Review.model';
import bookingModel from '../models/Booking.model';
import servicioModel from '../models/offering.model';
import { httpStatus } from '../constants/httpsNumbers';

const POPULATE = [
    { path: 'usuario', select: 'nombre apellido fotoPerfil' },
    {
        path: 'proveedor',
        select: 'usuario descripcion',
        populate: { path: 'usuario', select: 'nombre apellido' }
    },
    { path: 'servicio', select: 'titulo categoria' }
];

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

const notFound = (res: Response, message = 'Reseña no encontrada') => {
    res.status(httpStatus.NOT_FOUND).json({ error: { message } });
};

const serverError = (res: Response) => {
    res.status(httpStatus.SERVER_ERROR).json({ error: { message: 'Error interno' } });
};

const isCastError = (error: unknown) =>
    error instanceof Error && error.name === 'CastError';

const isDuplicate = (error: unknown) =>
    typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;

// GET /reviews?proveedor=&servicio=  (público)
export const obtenerReviews = async (req: Request, res: Response) => {
    try {
        const filtro: Record<string, unknown> = { isDeleted: { $ne: true } };
        for (const campo of ['proveedor', 'servicio'] as const) {
            const valor = req.query[campo];
            if (typeof valor === 'string' && valor !== '') {
                if (!OBJECT_ID.test(valor)) {
                    res.status(httpStatus.REQUEST_ERROR).json({
                        error: { message: `El filtro ${campo} no es un ID valido` }
                    });
                    return;
                }
                filtro[campo] = valor;
            }
        }

        const reviews = await reviewModel.find(filtro).populate(POPULATE).sort({ createdAt: -1 });
        res.status(httpStatus.SUCCESFUL).json(reviews);
    } catch {
        serverError(res);
    }
};

// GET /reviews/:id  (público)
export const obtenerReviewPorId = async (req: Request, res: Response) => {
    try {
        const review = await reviewModel
            .findOne({ _id: req.params.id, isDeleted: { $ne: true } })
            .populate(POPULATE);
        if (!review) return notFound(res);

        res.status(httpStatus.SUCCESFUL).json(review);
    } catch (error) {
        if (isCastError(error)) return notFound(res);
        serverError(res);
    }
};

// POST /reviews  (cliente | admin)
export const crearReview = async (req: Request, res: Response) => {
    try {
        const { booking: bookingId, calificacion, comentario } = req.body;
        const { id, rol } = req.user!;

        // El cliente solo puede reseñar sus propias bookings; admin cualquiera
        const filtro: Record<string, unknown> = { _id: bookingId, isDeleted: { $ne: true } };
        if (rol !== 'admin') filtro.usuario = id;

        const booking = await bookingModel.findOne(filtro);
        if (!booking) return notFound(res, 'Reserva no encontrada');

        if (booking.estado !== 'completada') {
            res.status(httpStatus.CONFLICT).json({
                error: { message: 'Solo se pueden reseñar reservas completadas', estadoActual: booking.estado }
            });
            return;
        }

        const yaExiste = await reviewModel.exists({ booking: booking._id, isDeleted: false });
        if (yaExiste) {
            res.status(httpStatus.CONFLICT).json({ error: { message: 'Esta reserva ya tiene una reseña' } });
            return;
        }

        // El proveedor se toma del servicio aunque el servicio se haya borrado después
        const servicio = await servicioModel.findById(booking.servicio).select('proveedor');
        if (!servicio) return notFound(res, 'Servicio de la reserva no encontrado');

        const review = await reviewModel.create({
            booking: booking._id,
            usuario: booking.usuario,   // autor = quien hizo la reserva
            proveedor: servicio.proveedor,
            servicio: servicio._id,
            calificacion,
            comentario
        });

        const populated = await review.populate(POPULATE);
        res.status(httpStatus.OBJECT_CREATED).json(populated);
    } catch (error) {
        if (isDuplicate(error)) {
            res.status(httpStatus.CONFLICT).json({ error: { message: 'Esta reserva ya tiene una reseña' } });
            return;
        }
        if (isCastError(error)) return notFound(res, 'Reserva no encontrada');
        serverError(res);
    }
};

// Autor o admin; otro → 404
const filtroAutorOAdmin = (req: Request) => {
    const filtro: Record<string, unknown> = { _id: req.params.id, isDeleted: { $ne: true } };
    if (req.user!.rol !== 'admin') filtro.usuario = req.user!.id;
    return filtro;
};

// PUT /reviews/:id
export const actualizarReview = async (req: Request, res: Response) => {
    try {
        const cambios: Record<string, unknown> = {};
        if (req.body.calificacion !== undefined) cambios.calificacion = req.body.calificacion;
        if (req.body.comentario !== undefined) cambios.comentario = req.body.comentario;

        const review = await reviewModel
            .findOneAndUpdate(filtroAutorOAdmin(req), cambios, { new: true, runValidators: true })
            .populate(POPULATE);
        if (!review) return notFound(res);

        res.status(httpStatus.SUCCESFUL).json(review);
    } catch (error) {
        if (isCastError(error)) return notFound(res);
        serverError(res);
    }
};

// DELETE /reviews/:id  (soft delete)
export const eliminarReview = async (req: Request, res: Response) => {
    try {
        const review = await reviewModel.findOneAndUpdate(
            filtroAutorOAdmin(req),
            { isDeleted: true },
            { new: true }
        );
        if (!review) return notFound(res);

        res.status(httpStatus.SUCCESFUL).json({ message: 'Reseña eliminada' });
    } catch (error) {
        if (isCastError(error)) return notFound(res);
        serverError(res);
    }
};
