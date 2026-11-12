import { Request, Response } from 'express';
import servicioModel from '../models/offering.model';
import proveedorModel from '../models/Proveedor.model';
import { httpStatus } from '../constants/httpsNumbers';

export const obtenerServicios = async (_req: Request, res: Response) => {
  try {
    const servicios = await servicioModel
      .find({ isDeleted: { $ne: true } })
      .populate({
        path: 'proveedor',
        match: { isDeleted: { $ne: true } },
        populate: {
          path: 'usuario',
          select: 'nombre apellido correo telefono ciudad fotoPerfil'
        }
      });

    res.status(httpStatus.SUCCESFUL).json(servicios);
  } catch {
    res.status(httpStatus.SERVER_ERROR).json({ error: { message: 'Error interno' } });
  }
};

export const obtenerServicioPorId = async (req: Request, res: Response) => {
  try {
    const servicio = await servicioModel
      .findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate({
        path: 'proveedor',
        populate: {
          path: 'usuario',
          select: 'nombre apellido correo telefono ciudad fotoPerfil'
        }
      });

    if (!servicio) {
      res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Servicio no encontrado' }
      });
      return;
    }

    res.status(httpStatus.SUCCESFUL).json(servicio);
  } catch {
    res.status(httpStatus.NOT_FOUND).json({
      error: { message: 'Servicio no encontrado' }
    });
  }
};

// POST /services
// proveedor → busca su perfil; si no existe 403
// admin → proveedor obligatorio en body

export const crearServicio = async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };

    if (req.user!.rol === 'proveedor') {
      const perfil = await proveedorModel.findOne({
        usuario: req.user!.id,
        isDeleted: { $ne: true }
      });

      if (!perfil) {
        res.status(httpStatus.FORBIDDEN).json({
          error: { message: 'Primero crea tu perfil de proveedor' }
        });
        return;
      }

      data.proveedor = perfil._id;
    } else if (req.user!.rol === 'admin') {
      if (!data.proveedor) {
        res.status(httpStatus.REQUEST_ERROR).json({
          error: { message: 'El campo proveedor es obligatorio' }
        });
        return;
      }
    }

    const servicio = await servicioModel.create(data);
    const populated = await servicio.populate({
      path: 'proveedor',
      populate: {
        path: 'usuario',
        select: 'nombre apellido correo telefono ciudad fotoPerfil'
      }
    });

    res.status(httpStatus.OBJECT_CREATED).json(populated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear servicio';
    res.status(httpStatus.REQUEST_ERROR).json({ error: { message } });
  }
};

export const actualizarServicio = async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    // No permitir reasignar el proveedor por este endpoint
    delete data.proveedor;
    delete data.isDeleted;

    const servicio = await servicioModel
      .findOneAndUpdate(
        { _id: req.params.id, isDeleted: { $ne: true } },
        data,
        { new: true, runValidators: true }
      )
      .populate({
        path: 'proveedor',
        populate: {
          path: 'usuario',
          select: 'nombre apellido correo telefono ciudad fotoPerfil'
        }
      });

    if (!servicio) {
      res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Servicio no encontrado' }
      });
      return;
    }

    res.status(httpStatus.SUCCESFUL).json(servicio);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar';
    res.status(httpStatus.REQUEST_ERROR).json({ error: { message } });
  }
};

export const eliminarServicio = async (req: Request, res: Response) => {
  try {
    const servicio = await servicioModel.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { isDeleted: true },
      { new: true }
    );

    if (!servicio) {
      res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Servicio no encontrado' }
      });
      return;
    }

    res.status(httpStatus.Object_ELIMINATED).send();
  } catch {
    res.status(httpStatus.SERVER_ERROR).json({ error: { message: 'Error interno' } });
  }
};