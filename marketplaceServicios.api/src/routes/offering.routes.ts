import { Router } from 'express';
import { obtenerServicios, obtenerServicioPorId, crearServicio, 
         actualizarServicio, eliminarServicio } from '../controllers/offering.controller';
import { allowRole, authentication } from '../middleware/auth.middleware';

const router = Router();

router.get('/', obtenerServicios);
router.get('/:id', obtenerServicioPorId);
router.post('/', authentication,  allowRole('admins'), crearServicio);
router.put('/:id', authentication,  allowRole('admins'), actualizarServicio);
router.delete('/:id', authentication,  allowRole('admins'), eliminarServicio);

export default router;