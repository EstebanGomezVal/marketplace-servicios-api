import { Request, Response } from 'express';
import proveedorModel from '../models/Proveedor.model';
import servicioModel from '../models/offering.model';
import { httpStatus } from '../constants/httpsNumbers';

export const obtenerProveedores = async (_req: Request, res: Response) => {
  try {
    const proveedores = await proveedorModel
      .find({ isDeleted: { $ne: true } })
      .populate('usuario', 'nombre apellido correo telefono ciudad fotoPerfil rol');

    res.status(httpStatus.SUCCESFUL).json(proveedores);
  } catch {
    res.status(httpStatus.SERVER_ERROR).json({ error: { message: 'Error interno' } });
  }
};

export const obtenerProveedorPorId = async (req: Request, res: Response) => {
  try {
    const proveedor = await proveedorModel
      .findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate('usuario', 'nombre apellido correo telefono ciudad fotoPerfil rol');

    if (!proveedor) {
      res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Proveedor no encontrado' }
      });
      return;
    }

    res.status(httpStatus.SUCCESFUL).json(proveedor);
  } catch {
    res.status(httpStatus.NOT_FOUND).json({
      error: { message: 'Proveedor no encontrado' }
    });
  }
};

// POST /suppliers

export const crearProveedor = async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };

    if (req.user!.rol === 'proveedor') {
      data.usuario = req.user!.id;
    } else if (req.user!.rol === 'admin') {
      if (!data.usuario) {
        res.status(httpStatus.REQUEST_ERROR).json({
          error: { message: 'El campo usuario es obligatorio' }
        });
        return;
      }
    }

    // Evitar duplicado: un usuario solo un perfil proveedor
    const existente = await proveedorModel.findOne({
      usuario: data.usuario,
      isDeleted: { $ne: true }
    });
    if (existente) {
      res.status(httpStatus.CONFLICT).json({
        error: { message: 'Este usuario ya tiene un perfil de proveedor' }
      });
      return;
    }

    const proveedor = await proveedorModel.create(data);
    const populated = await proveedor.populate(
      'usuario',
      'nombre apellido correo telefono ciudad fotoPerfil rol'
    );

    res.status(httpStatus.OBJECT_CREATED).json(populated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear proveedor';
    if (message.includes('duplicate') || message.includes('E11000')) {
      res.status(httpStatus.CONFLICT).json({
        error: { message: 'Este usuario ya tiene un perfil de proveedor' }
      });
      return;
    }
    res.status(httpStatus.REQUEST_ERROR).json({ error: { message } });
  }
};

export const actualizarProveedor = async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    // No permitir cambiar el dueño por este endpoint
    delete data.usuario;
    delete data.isDeleted;

    const proveedor = await proveedorModel
      .findOneAndUpdate(
        { _id: req.params.id, isDeleted: { $ne: true } },
        data,
        { new: true, runValidators: true }
      )
      .populate('usuario', 'nombre apellido correo telefono ciudad fotoPerfil rol');

    if (!proveedor) {
      res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Proveedor no encontrado' }
      });
      return;
    }

    res.status(httpStatus.SUCCESFUL).json(proveedor);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar';
    res.status(httpStatus.REQUEST_ERROR).json({ error: { message } });
  }
};

// marca servicios del proveedor como eliminados
export const eliminarProveedor = async (req: Request, res: Response) => {
  try {
    const proveedor = await proveedorModel.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { isDeleted: true },
      { new: true }
    );

    if (!proveedor) {
      res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Proveedor no encontrado' }
      });
      return;
    }

    await servicioModel.updateMany(
      { proveedor: proveedor._id },
      { isDeleted: true }
    );

    res.status(httpStatus.Object_ELIMINATED).send();
  } catch {
    res.status(httpStatus.SERVER_ERROR).json({ error: { message: 'Error interno' } });
  }
};