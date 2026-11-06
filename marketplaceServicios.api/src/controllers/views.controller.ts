import { Request, Response } from 'express';
import servicioModel from '../models/offering.model';
import '../models/Proveedor.model';
import '../models/Usuario.model';

export const redirectToServices = (_req: Request, res: Response) => {
    res.redirect('/servicios');
};

export const listServicesView = async (_req: Request, res: Response) => {
    try {
        const servicios = await servicioModel
            .find({ isDeleted: { $ne: true } })
            .lean();

        res.render('services/index', { servicios });
    } catch (error) {
        res.status(500).render('not-found');
    }
};

export const serviceDetailView = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const servicio = await servicioModel
            .findOne({ _id: id, isDeleted: { $ne: true } })
            .populate({
                path: 'proveedor',
                populate: {
                    path: 'usuario',
                    select: 'nombre apellido correo telefono'
                }
            })
            .lean();

        if (!servicio) {
            res.status(404).render('not-found');
            return;
        }

        res.render('services/detail', { servicio });
    } catch (error) {
        res.status(404).render('not-found');
    }
};
