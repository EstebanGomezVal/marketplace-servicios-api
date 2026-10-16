import { Router } from 'express';
import { obtenerServicios, obtenerServicioPorId, crearServicio, 
         actualizarServicio, eliminarServicio } from '../controllers/services.controller';

const router = Router();

router.get('/', obtenerServicios);
router.get('/:id', obtenerServicioPorId);
router.post('/', crearServicio);
router.put('/:id', actualizarServicio);
router.delete('/:id', eliminarServicio);

export default router;