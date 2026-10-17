import { Request, Response } from 'express';

export const obtenerServicios = async (req: Request, res: Response) => {
    res.json({ message: 'Obtener todos los servicios' });
};

export const obtenerServicioPorId = async (req: Request, res: Response) => {
    res.json({ message: 'Obtener servicio por ID' });
};

export const crearServicio = async (req: Request, res: Response) => {
    res.json({ message: 'Crear servicio' });
};

export const actualizarServicio = async (req: Request, res: Response) => {
    res.json({ message: 'Actualizar servicio' });
};

export const eliminarServicio = async (req: Request, res: Response) => {
    res.json({ message: 'Eliminar servicio' });
};