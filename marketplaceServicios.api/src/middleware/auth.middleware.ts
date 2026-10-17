import { Request, Response, NextFunction } from 'express';


export const authentication = (req: Request, res: Response, next: NextFunction) => {
    console.log('[authenticate] petición recibida')
    next();
};

export const allowRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        console.log('Role aceptado')
        next();
    };
};