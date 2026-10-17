import { Router } from 'express';
import { obtenerUsuarios, obtenerUsuarioPorId, 
         actualizarUsuario, eliminarUsuario } from '../controllers/users.controller';
import { allowRole, authentication } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authentication, allowRole('admins'), obtenerUsuarios);
router.get('/:id', authentication, allowRole('admins'), obtenerUsuarioPorId);
router.put('/:id', authentication, allowRole('admins'), actualizarUsuario);
router.delete('/:id', authentication, allowRole('admins'), eliminarUsuario);

export default router;