import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import usuarioModel from '../models/Usuario.model';
import { httpStatus } from '../constants/httpsNumbers';

type Rol = 'cliente' | 'proveedor' | 'admin';

interface JwtPayload {
  id?: string;
  sub?: string;
  rol?: string;
}

const getToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieToken = (req as Request & { cookies?: { token?: string } }).cookies?.token;
  if (cookieToken) return cookieToken;
  return null;
};

// requireAuth / authentication
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getToken(req);

    if (!token) {
      res.status(httpStatus.UNAUTHORIZED).json({
        error: { message: 'Token no proporcionado' }
      });
      return;
    }

    const secret = process.env.JWT_SECRET || 'secreto_temporal';
    let payload: JwtPayload;

    try {
      payload = jwt.verify(token, secret) as JwtPayload;
    } catch {
      res.status(httpStatus.UNAUTHORIZED).json({
        error: { message: 'Token inválido o expirado' }
      });
      return;
    }

    const userId = payload.id ?? payload.sub;
    if (!userId) {
      res.status(httpStatus.UNAUTHORIZED).json({
        error: { message: 'Token inválido' }
      });
      return;
    }

    const usuario = await usuarioModel.findById(userId).select('_id rol isDeleted');

    if (!usuario || usuario.isDeleted) {
      res.status(httpStatus.UNAUTHORIZED).json({
        error: { message: 'Usuario no encontrado o eliminado' }
      });
      return;
    }

    req.user = {
      id: String(usuario._id),
      rol: usuario.rol as Rol
    };

    next();
  } catch {
    res.status(httpStatus.UNAUTHORIZED).json({
      error: { message: 'Error de autenticación' }
    });
  }
};

// Alias para las rutas que ya importan authentication
export const authentication = requireAuth;

// 403 si req.user.rol no está en la lista
// Nunca responde y llama a next() a la vez
export const allowRoles = (...roles: Rol[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(httpStatus.UNAUTHORIZED).json({
        error: { message: 'No autenticado' }
      });
      return;
    }

    if (!roles.includes(req.user.rol)) {
      res.status(httpStatus.FORBIDDEN).json({
        error: { message: 'No tienes permiso para realizar esta acción' }
      });
      return;
    }

    next();
  };
};

/** Alias compatible con rutas actuales (acepta varios roles) */
export const allowRole = (...roles: string[]) => {
  const normalized = roles
    .map((r) => (r === 'admins' ? 'admin' : r))
    .filter((r): r is Rol => ['cliente', 'proveedor', 'admin'].includes(r));

  return allowRoles(...normalized);
};