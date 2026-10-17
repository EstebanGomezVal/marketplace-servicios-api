import { Request, Response } from 'express';

export const obtenerProveedores = async (req: Request, res: Response) => {
    res.json({ message: 'Obtener todos los proveedores' });
};

export const obtenerProveedorPorId = async (req: Request, res: Response) => {
    res.json({ message: 'Obtener proveedor por ID' });
};

export const crearProveedor = async (req: Request, res: Response) => {
    res.json({ message: 'Crear perfil de proveedor' });
};

export const actualizarProveedor = async (req: Request, res: Response) => {
    res.json({ message: 'Actualizar proveedor' });
};

export const eliminarProveedor = async (req: Request, res: Response) => {
    res.json({ message: 'Eliminar proveedor' });
};