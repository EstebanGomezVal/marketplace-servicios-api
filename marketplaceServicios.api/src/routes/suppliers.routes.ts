import { Router } from 'express';
import { 
    obtenerProveedores, obtenerProveedorPorId, crearProveedor, 
    actualizarProveedor, eliminarProveedor } from '../controllers/suppliers.controller';
import { allowRole, authentication } from '../middleware/auth.middleware';

const router = Router();

router.get('/', obtenerProveedores);
router.get('/:id', obtenerProveedorPorId);
router.post('/', authentication,  allowRole('admins'), crearProveedor);
router.put('/:id', authentication,  allowRole('admins'), actualizarProveedor);
router.delete('/:id', authentication,  allowRole('admins'), eliminarProveedor);

export default router;