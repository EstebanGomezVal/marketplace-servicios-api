// middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { httpStatus } from '../constants/httpsNumbers'

export const notFound = (req: Request, res: Response) => {
    res.status(404).json({ error: { message: 'Ruta no encontrada' } })
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err)

    if (err.code === 11000) {
        res.status(httpStatus.CONFLICT).json({ error: { message: 'Registro duplicado' } })
        return;
    }

    if (err.name === 'CastError') {
        res.status(httpStatus.REQUEST_ERROR).json({ error: { message: 'Id con formato invalido' } })
        return;
    }

    res.status(500).json({ error: { message: 'Error interno del servidor' } })
};