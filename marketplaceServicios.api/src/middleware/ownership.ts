import { Request, Response, NextFunction } from 'express';
import { httpStatus } from '../constants/httpsNumbers';
import usuarioModel from '../models/Usuario.model';
import proveedorModel from '../models/Proveedor.model';
import servicioModel from '../models/offering.model'; 

/**
 * Mismo usuario o admin. Si no → 404 "Usuario no encontrado"
 * (nunca revela si el id existe o no a quien no debe verlo)
 */
export const requireSelfOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(httpStatus.UNAUTHORIZED).json({ error: { message: 'No autenticado' } });
      return;
    }

    const { id } = req.params;
    const isSelf = req.user.id === id;
    const isAdmin = req.user.rol === 'admin';

    if (!isSelf && !isAdmin) {
      res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Usuario no encontrado' }
      });
      return;
    }

    // Opcional: comprobar que el usuario destino existe y no está borrado
    const target = await usuarioModel.findById(id).select('_id isDeleted');
    if (!target || target.isDeleted) {
      res.status(httpStatus.NOT_FOUND).json({
        error: { message: 'Usuario no encontrado' }
      });
      return;
    }

    next();
  } catch {
    res.status(httpStatus.SERVER_ERROR).json({ error: { message: 'Error interno' } });
  }
};

/**
 * Dueño del proveedor (proveedor.usuario === req.user.id) o admin.
 * Si no → 403
 */
export const requireProveedorOwnerOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(httpStatus.UNAUTHORIZED).json({ error: { message: 'No autenticado' } });
      return;
    }

    if (req.user.rol === 'admin') {
      next();
      return;
    }

    const proveedor = await proveedorModel.findById(req.params.id).select('usuario isDeleted');
    if (!proveedor || (proveedor as { isDeleted?: boolean }).isDeleted) {
      res.status(httpStatus.NOT_FOUND).json({ error: { message: 'Proveedor no encontrado' } });
      return;
    }

    if (String(proveedor.usuario) !== req.user.id) {
      res.status(httpStatus.FORBIDDEN).json({
        error: { message: 'No tienes permiso para realizar esta acción' }
      });
      return;
    }

    next();
  } catch {
    res.status(httpStatus.SERVER_ERROR).json({ error: { message: 'Error interno' } });
  }
};

/**
 * Dueño del servicio (servicio.proveedor.usuario === req.user.id) o admin.
 * Si no → 403
 */
export const requireServicioOwnerOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(httpStatus.UNAUTHORIZED).json({ error: { message: 'No autenticado' } });
      return;
    }

    if (req.user.rol === 'admin') {
      next();
      return;
    }

    const servicio = await servicioModel
      .findById(req.params.id)
      .populate<{ proveedor: { usuario: unknown; isDeleted?: boolean } | null }>('proveedor', 'usuario isDeleted');

    if (!servicio || !servicio.proveedor) {
      res.status(httpStatus.NOT_FOUND).json({ error: { message: 'Servicio no encontrado' } });
      return;
    }

    if (String(servicio.proveedor.usuario) !== req.user.id) {
      res.status(httpStatus.FORBIDDEN).json({
        error: { message: 'No tienes permiso para realizar esta acción' }
      });
      return;
    }

    next();
  } catch {
    res.status(httpStatus.SERVER_ERROR).json({ error: { message: 'Error interno' } });
  }
};