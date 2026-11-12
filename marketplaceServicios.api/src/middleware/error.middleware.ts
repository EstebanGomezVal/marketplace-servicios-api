// middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { httpStatus } from '../constants/httpsNumbers'
import { moduleLogger } from '../config/logger'

const log = moduleLogger('error');

export const notFound = (req: Request, res: Response) => {
    res.status(404).json({ error: { message: 'Ruta no encontrada' } })
};

// Loguea el error completo (stack + reqId). La respuesta nunca incluye el stack.
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    log.error({ err, reqId: req.id, method: req.method }, `Error no controlado: ${err?.message ?? err}`)

    if (err.code === 11000) {
        res.status(409).json({ error: { message: 'Registro duplicado' } })
        return;
    }

    if (err.name === 'CastError') {
        res.status(httpStatus.NOT_FOUND).json({ error: { message: 'Id con formato invalido' } })
        return;
    }

    // requestId para que el cliente pueda reportar el error y encontrarlo en los logs
    res.status(500).json({ error: { message: 'Error interno del servidor', requestId: req.id } })
};
