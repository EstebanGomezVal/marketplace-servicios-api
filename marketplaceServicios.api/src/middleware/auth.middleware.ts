import { Request, Response, NextFunction } from 'express';


export const authentication = (req: Request, res: Response, next: NextFunction) => {
    res.json({message: "Autorizado"})
    next();
};

export const allowRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
            res.json({roles: roles, message: "Role aceptado"})
        next();
    };
};