import { Request, Response, NextFunction } from 'express';
import Servicio from '../models/offering.model'; 
import { httpStatus } from '../constants/httpsNumbers';

// GET /api/services
export const obtenerServicios = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const servicios = await Servicio.find({ isDeleted: false })
      .populate('proveedor', 'nombre email telefono')
      .sort({ createdAt: -1 });

    res.status(httpStatus.SUCCESFUL).json(servicios);
  } catch (error) {
    next(error);
  }
};

// GET /api/services/:id
export const obtenerServicioPorId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const servicio = await Servicio.findOne({ _id: id, isDeleted: false })
      .populate('proveedor', 'nombre email telefono');

    if (!servicio) {
      return res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Servicio no encontrado' },
      });
    }

    res.status(httpStatus.SUCCESFUL).json(servicio);
  } catch (error) {
    next(error);
  }
};

// POST /api/services
export const crearServicio = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const nuevoServicio = await Servicio.create(req.body);

    const servicioPopulado = await Servicio.findById(nuevoServicio._id)
      .populate('proveedor', 'nombre email telefono');

    res.status(httpStatus.OBJECT_CREATED).json(servicioPopulado);
  } catch (error) {
    next(error);
  }
};

// PUT /api/services/:id
export const actualizarServicio = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const servicio = await Servicio.findOneAndUpdate(
      { _id: id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    ).populate('proveedor', 'nombre email telefono');

    if (!servicio) {
      return res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Servicio no encontrado' },
      });
    }

    res.status(httpStatus.SUCCESFUL).json(servicio);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/services/:id
export const eliminarServicio = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const servicio = await Servicio.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!servicio) {
      return res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Servicio no encontrado' },
      });
    }

    res.status(httpStatus.Object_ELIMINATED).send(); // 204
  } catch (error) {
    next(error);
  }
};