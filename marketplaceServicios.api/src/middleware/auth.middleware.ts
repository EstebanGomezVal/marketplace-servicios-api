import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.model';
import { httpStatus } from '../constants/httpsNumbers';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    rol: 'cliente' | 'proveedor' | 'admin';
  };
}

/**
 * Middleware de Autenticación
 */
export const authentication = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(httpStatus.UNAUTHORIZED).json({ error: { message: 'No autorizado. Token no proporcionado' } });
      return;
    }

    const secret = process.env.JWT_SECRET || 'secreto_temporal';
    const decoded = jwt.verify(token, secret) as any;

    const usuario = await Usuario.findOne({ 
      _id: decoded.id || decoded.sub, 
      isDeleted: { $ne: true } 
    }).lean();

    if (!usuario) {
      res.status(httpStatus.UNAUTHORIZED).json({ error: { message: 'No autorizado. El usuario ya no existe' } });
      return;
    }

    // Guardamos id en string y el rol directo de la BD
    req.user = {
      id: usuario._id.toString(),
      rol: usuario.rol as 'cliente' | 'proveedor' | 'admin'
    };

    next();
  } catch (error) {
    res.status(httpStatus.UNAUTHORIZED).json({ error: { message: 'Token inválido o expirado' } });
    return;
  }
};

/**
 * Middleware de Autorización por Rol
 */
export const allowRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(httpStatus.UNAUTHORIZED).json({ error: { message: 'No autorizado. Inicie sesión primero' } });
      return;
    }

    const userRole = req.user.rol;
    const normalizedAllowed = allowedRoles.map(r => (r === 'admins' ? 'admin' : r));

    if (!normalizedAllowed.includes(userRole)) {
      res.status(httpStatus.FORBIDDEN).json({ error: { message: 'Acceso prohibido. Permisos insuficientes' } });
      return;
    }

    next();
  };
};

export const requireAuth = authentication;
export const allowRoles = allowRole;