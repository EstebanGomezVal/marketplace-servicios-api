import { Request, Response, NextFunction } from 'express';
import Usuario from '../models/Usuario.model'; // ajusta el path si es diferente
import { httpStatus } from '../constants/httpsNumbers';

// GET /api/users
export const obtenerUsuarios = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const usuarios = await Usuario.find({ isDeleted: false })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(httpStatus.SUCCESFUL).json(usuarios);
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
export const obtenerUsuarioPorId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findOne({ _id: id, isDeleted: false })
      .select('-password');

    if (!usuario) {
      return res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Usuario no encontrado' },
      });
    }

    res.status(httpStatus.SUCCESFUL).json(usuario);
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id
export const actualizarUsuario = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const { password, ...datosActualizables } = req.body;

    const usuario = await Usuario.findOneAndUpdate(
      { _id: id, isDeleted: false },
      datosActualizables,
      { new: true, runValidators: true }
    ).select('-password');

    if (!usuario) {
      return res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Usuario no encontrado' },
      });
    }

    res.status(httpStatus.SUCCESFUL).json(usuario);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id  (borrado lógico)
export const eliminarUsuario = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!usuario) {
      return res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Usuario no encontrado' },
      });
    }

    res.status(httpStatus.Object_ELIMINATED).send(); // 204
  } catch (error) {
    next(error);
  }
};