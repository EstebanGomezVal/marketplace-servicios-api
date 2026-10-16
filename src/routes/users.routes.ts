import { Router } from 'express';
import { obtenerUsuarios, obtenerUsuarioPorId, 
         actualizarUsuario, eliminarUsuario } from '../controllers/users.controller';

const router = Router();

router.get('/', obtenerUsuarios);
router.get('/:id', obtenerUsuarioPorId);
router.put('/:id', actualizarUsuario);
router.delete('/:id', eliminarUsuario);

export default router;