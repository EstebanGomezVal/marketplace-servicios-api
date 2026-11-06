import { Router } from 'express';
import { 
  obtenerUsuarios, 
  obtenerUsuarioPorId, 
  actualizarUsuario, 
  eliminarUsuario,
  actualizarRolUsuario 
} from '../controllers/users.controller';
import { allowRole, authentication } from '../middleware/auth.middleware';
import { validate } from '../middleware/data.middleware';
import { z } from 'zod';

const router = Router();

const updateRoleSchema = z.object({
  rol: z.enum(['cliente', 'proveedor', 'admin'])
});

// Todas las rutas requieren estar autenticado
router.use(authentication);

// Solo admin puede listar a todos
router.get('/', allowRole('admin', 'admins'), obtenerUsuarios);

// Mismo usuario o Admin (la validación se hace en el controlador)
router.get('/:id', obtenerUsuarioPorId);
router.put('/:id', actualizarUsuario);
router.delete('/:id', eliminarUsuario);

// Cambio de rol exclusivo para admin
router.patch('/:id/role', allowRole('admin', 'admins'), validate('body', updateRoleSchema), actualizarRolUsuario);

export default router;