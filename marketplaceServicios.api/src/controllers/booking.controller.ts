import { Request, Response, NextFunction } from 'express';
import Booking from '../models/booking.model';
import { httpStatus } from '../constants/httpsNumbers';

// GET /api/bookings
export const obtenerBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bookings = await Booking.find({ isDeleted: false })
      .populate('usuario', 'nombre apellido correo')
      .populate('servicio', 'titulo precio categoria')
      .sort({ createdAt: -1 });

    res.status(httpStatus.SUCCESFUL).json(bookings);
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/:id
export const obtenerBookingPorId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findOne({ _id: id, isDeleted: false })
      .populate('usuario', 'nombre email')
      .populate('servicio', 'titulo categoria precio tipoPrecio');

    if (!booking) {
      return res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Solicitud no encontrada' },
      });
    }

    res.status(httpStatus.SUCCESFUL).json(booking);
  } catch (error) {
    next(error);
  }
};

// POST /api/bookings
export const crearBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const nuevoBooking = await Booking.create(req.body);

    const bookingPopulado = await Booking.findById(nuevoBooking._id)
      .populate('usuario', 'nombre email')
      .populate('servicio', 'titulo categoria precio tipoPrecio');

    res.status(httpStatus.OBJECT_CREATED).json(bookingPopulado);
  } catch (error) {
    next(error);
  }
};

// PUT /api/bookings/:id
export const actualizarBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findOneAndUpdate(
      { _id: id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('usuario', 'nombre email')
      .populate('servicio', 'titulo categoria precio tipoPrecio');

    if (!booking) {
      return res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Solicitud no encontrada' },
      });
    }

    res.status(httpStatus.SUCCESFUL).json(booking);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/bookings/:id  (borrado lógico)
export const eliminarBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!booking) {
      return res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Solicitud no encontrada' },
      });
    }

    res.status(httpStatus.Object_ELIMINATED).send();
  } catch (error) {
    next(error);
  }
};