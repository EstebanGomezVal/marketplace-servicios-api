import { Request, Response } from 'express';
import usuarioModel from '../models/Usuario.model';
import {
  register,
  login as loginService,
  signToken,
  INVALID_CREDENTIALS_ERROR
} from '../services/auth.service';
import { httpStatus } from '../constants/httpsNumbers';

export const registrar = async (req: Request, res: Response) => {
  try {
    const usuario = await register(req.body);
    const token = signToken(usuario);

    res.status(httpStatus.OBJECT_CREATED).json({
      usuario, // toJSON del modelo ya quita password
      token
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al registrar';
    // correo duplicado u otros
    if (message.includes('duplicate') || message.includes('E11000')) {
      res.status(httpStatus.CONFLICT).json({
        error: { message: 'El correo ya está registrado' }
      });
      return;
    }
    res.status(httpStatus.REQUEST_ERROR).json({ error: { message } });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const usuario = await loginService(req.body);
    const token = signToken(usuario);

    // Opcional: cookie
    res.cookie?.('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000 // 1h
    });

    res.status(httpStatus.SUCCESFUL).json({
      usuario, // sin password
      token
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
    if (message === INVALID_CREDENTIALS_ERROR) {
      res.status(httpStatus.UNAUTHORIZED).json({ error: { message } });
      return;
    }
    res.status(httpStatus.SERVER_ERROR).json({ error: { message: 'Error interno' } });
  }
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie?.('token');
  res.status(httpStatus.SUCCESFUL).json({ message: 'Sesión cerrada' });
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const usuario = await usuarioModel.findById(req.user!.id);

    if (!usuario || usuario.isDeleted) {
      res.status(httpStatus.UNAUTHORIZED).json({
        error: { message: 'Usuario no encontrado o eliminado' }
      });
      return;
    }

    res.status(httpStatus.SUCCESFUL).json(usuario);
  } catch {
    res.status(httpStatus.SERVER_ERROR).json({ error: { message: 'Error interno' } });
  }
};