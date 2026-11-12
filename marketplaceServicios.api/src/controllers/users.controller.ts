import { Request, Response } from 'express';
import usuarioModel from '../models/Usuario.model';
import { httpStatus } from '../constants/httpsNumbers';

export const obtenerUsuarios = async (_req: Request, res: Response) => {
  try {
    const usuarios = await usuarioModel.find({ isDeleted: { $ne: true } });
    res.status(httpStatus.SUCCESFUL).json(usuarios);
  } catch {
    res.status(httpStatus.SERVER_ERROR).json({ error: { message: 'Error interno' } });
  }
};

export const obtenerUsuarioPorId = async (req: Request, res: Response) => {
  try {
    const usuario = await usuarioModel.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true }
    });

    if (!usuario) {
      res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Usuario no encontrado' }
      });
      return;
    }

    res.status(httpStatus.SUCCESFUL).json(usuario);
  } catch {
    res.status(httpStatus.NOT_FOUND).json({
      error: { message: 'Usuario no encontrado' }
    });
  }
};

/**
 * PUT /users/:id
 * - Nunca cambia rol ni password
 * - Ownership ya validado por requireSelfOrAdmin
 */
export const actualizarUsuario = async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    delete data.rol;
    delete data.password;
    delete data.isDeleted; // por seguridad

    const usuario = await usuarioModel.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      data,
      { new: true, runValidators: true }
    );

    if (!usuario) {
      res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Usuario no encontrado' }
      });
      return;
    }

    res.status(httpStatus.SUCCESFUL).json(usuario);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar';
    res.status(httpStatus.REQUEST_ERROR).json({ error: { message } });
  }
};

export const eliminarUsuario = async (req: Request, res: Response) => {
  try {
    const usuario = await usuarioModel.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { isDeleted: true },
      { new: true }
    );

    if (!usuario) {
      res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Usuario no encontrado' }
      });
      return;
    }

    res.status(httpStatus.Object_ELIMINATED).send();
  } catch {
    res.status(httpStatus.SERVER_ERROR).json({ error: { message: 'Error interno' } });
  }
};

/**
 * PATCH /users/:id/role — solo admin (middleware)
 */
export const actualizarRolUsuario = async (req: Request, res: Response) => {
  try {
    const { rol } = req.body;

    const usuario = await usuarioModel.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { rol },
      { new: true, runValidators: true }
    );

    if (!usuario) {
      res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Usuario no encontrado' }
      });
      return;
    }

    res.status(httpStatus.SUCCESFUL).json(usuario);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al cambiar rol';
    res.status(httpStatus.REQUEST_ERROR).json({ error: { message } });
  }
};