import { Router } from 'express';
import {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario,
} from '../controllers/users.controller';
import { validate } from '../middleware/data.middleware';
import { objectIdSchema } from '../schemas/common.schema';
import { z } from 'zod';

const router = Router();

const idParamSchema = z.object({
  id: objectIdSchema,
});

router.get('/', obtenerUsuarios);

router.get(
  '/:id',
  validate('params', idParamSchema),
  obtenerUsuarioPorId
);

router.put(
  '/:id',
  validate('params', idParamSchema),
  actualizarUsuario
);

router.delete(
  '/:id',
  validate('params', idParamSchema),
  eliminarUsuario
);

export default router;