import { Request, Response } from 'express';

export const obtenerUsuarios = async (req: Request, res: Response) => {
    res.json({ message: 'Obtener todos los usuarios' });
};

export const obtenerUsuarioPorId = async (req: Request, res: Response) => {
    res.json({ message: 'Obtener usuario por ID' });
};

export const actualizarUsuario = async (req: Request, res: Response) => {
    res.json({ message: 'Actualizar usuario' });
};

export const eliminarUsuario = async (req: Request, res: Response) => {
    res.json({ message: 'Eliminar usuario' });
};