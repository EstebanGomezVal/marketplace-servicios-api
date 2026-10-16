import { Request, Response } from 'express';

export const registrar = async (req: Request, res: Response) => {
    res.json({ message: 'Registro de usuario' });
};

export const login = async (req: Request, res: Response) => {
    res.json({ message: 'Login de usuario' });
};