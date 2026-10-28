import { Request, Response, NextFunction } from 'express';
import Proveedor from '../models/Proveedor.model'; // ajusta el path si es diferente
import { httpStatus } from '../constants/httpsNumbers';

// GET /api/suppliers
export const obtenerProveedores = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const proveedores = await Proveedor.find({ isDeleted: false })
      .populate('usuario', 'nombre apellido correo telefono ciudad')
      .sort({ createdAt: -1 });

    res.status(httpStatus.SUCCESFUL).json(proveedores);
  } catch (error) {
    next(error);
  }
};

// GET /api/suppliers/:id
export const obtenerProveedorPorId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const proveedor = await Proveedor.findOne({ _id: id, isDeleted: false })
      .populate('usuario', 'nombre apellido correo telefono ciudad');

    if (!proveedor) {
      return res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Proveedor no encontrado' },
      });
    }

    res.status(httpStatus.SUCCESFUL).json(proveedor);
  } catch (error) {
    next(error);
  }
};

// POST /api/suppliers
export const crearProveedor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const nuevoProveedor = await Proveedor.create(req.body);

    const proveedorPopulado = await Proveedor.findById(nuevoProveedor._id)
      .populate('usuario', 'nombre apellido correo telefono ciudad');

    res.status(httpStatus.OBJECT_CREATED).json(proveedorPopulado);
  } catch (error) {
    next(error);
  }
};

// PUT /api/suppliers/:id
export const actualizarProveedor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const proveedor = await Proveedor.findOneAndUpdate(
      { _id: id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    ).populate('usuario', 'nombre apellido correo telefono ciudad');

    if (!proveedor) {
      return res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Proveedor no encontrado' },
      });
    }

    res.status(httpStatus.SUCCESFUL).json(proveedor);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/suppliers/:id
export const eliminarProveedor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const proveedor = await Proveedor.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!proveedor) {
      return res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Proveedor no encontrado' },
      });
    }

    res.status(httpStatus.Object_ELIMINATED).send(); // 204
  } catch (error) {
    next(error);
  }
};