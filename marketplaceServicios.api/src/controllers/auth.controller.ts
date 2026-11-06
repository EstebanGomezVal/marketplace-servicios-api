import { Request, Response, NextFunction } from 'express';
import { httpStatus } from '../constants/httpsNumbers';
import { register, login as loginService, signToken, INVALID_CREDENTIALS_ERROR } from '../services/auth.service';
import Usuario from '../models/Usuario.model';

export const registrar = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const usuarioCreado = await register(req.body);
        res.status(httpStatus.OBJECT_CREATED).json(usuarioCreado);
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const usuario = await loginService(req.body);
        const token = signToken(usuario);

        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
        });

        res.status(httpStatus.SUCCESFUL).json({
            token,
            usuario
        });
    } catch (error) {
        if (error instanceof Error && error.message === INVALID_CREDENTIALS_ERROR) {
            res.status(httpStatus.UNAUTHORIZED).json({
                error: {
                    message: INVALID_CREDENTIALS_ERROR
                }
            });
            return;
        }
        next(error);
    }
};

export const logout = async (_req: Request, res: Response) => {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    });

    res.status(httpStatus.SUCCESFUL).json({
        message: 'Sesión cerrada correctamente'
    });
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            res.status(httpStatus.UNAUTHORIZED).json({
                error: {
                    message: 'No autenticado'
                }
            });
            return;
        }

        const usuario = await Usuario.findOne({ _id: req.user.id, isDeleted: { $ne: true } }).select('-password');

        if (!usuario) {
            res.status(httpStatus.NOT_FOUND).json({
                error: {
                    message: 'Usuario no encontrado'
                }
            });
            return;
        }

        res.status(httpStatus.SUCCESFUL).json({
            data: usuario
        });
    } catch (error) {
        next(error);
    }
};