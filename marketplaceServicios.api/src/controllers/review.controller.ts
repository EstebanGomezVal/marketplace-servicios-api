import { Request, Response, NextFunction } from 'express';
import Review from '../models/review.model';
import Booking from '../models/booking.model';
import { httpStatus } from '../constants/httpsNumbers';

export const obtenerReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reviews = await Review.find({ isDeleted: false })
      .populate('usuario', 'nombre email')
      .populate('proveedor', 'nombre')
      .populate('booking')
      .sort({ createdAt: -1 });

    res.status(httpStatus.SUCCESFUL).json(reviews);
  } catch (error) {
    next(error);
  }
};

export const obtenerReviewPorId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const review = await Review.findOne({ _id: id, isDeleted: false })
      .populate('usuario', 'nombre email')
      .populate('proveedor', 'nombre')
      .populate('booking');

    if (!review) {
      return res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Reseña no encontrada' },
      });
    }

    res.status(httpStatus.SUCCESFUL).json(review);
  } catch (error) {
    next(error);
  }
};

export const crearReview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Solo se permite reseñar una solicitud completada
    const booking = await Booking.findOne({
      _id: req.body.booking,
      isDeleted: false,
    });

    if (!booking) {
      return res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'La solicitud no existe' },
      });
    }

    if (booking.estado !== 'completada') {
      return res.status(httpStatus.REQUEST_ERROR).json({
        error: {
          message: 'Solo se puede reseñar una solicitud completada',
        },
      });
    }

    const nuevaReview = await Review.create(req.body);

    const reviewPopulada = await Review.findById(nuevaReview._id)
      .populate('usuario', 'nombre email')
      .populate('proveedor', 'nombre')
      .populate('booking');

    res.status(httpStatus.OBJECT_CREATED).json(reviewPopulada);
  } catch (error) {
    next(error);
  }
};

export const actualizarReview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const review = await Review.findOneAndUpdate(
      { _id: id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('usuario', 'nombre email')
      .populate('proveedor', 'nombre')
      .populate('booking');

    if (!review) {
      return res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Reseña no encontrada' },
      });
    }

    res.status(httpStatus.SUCCESFUL).json(review);
  } catch (error) {
    next(error);
  }
};

export const eliminarReview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const review = await Review.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!review) {
      return res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Reseña no encontrada' },
      });
    }

    res.status(httpStatus.Object_ELIMINATED).send();
  } catch (error) {
    next(error);
  }
};