import { Router } from 'express';
import {
  obtenerProveedores,
  obtenerProveedorPorId,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
} from '../controllers/suppliers.controller';
import { validate } from '../middleware/data.middleware';
import { objectIdSchema } from '../schemas/common.schema';
import { proveedorSchema, proveedorUpdateSchemaZod } from '../schemas/Proveedor.schema';
import { z } from 'zod';

const router = Router();

const idParamSchema = z.object({
  id: objectIdSchema,
});

router.get('/', obtenerProveedores);

router.get(
  '/:id',
  validate('params', idParamSchema),
  obtenerProveedorPorId
);

router.post(
  '/',
  crearProveedor
);

router.put(
  '/:id',
  validate('params', idParamSchema),
  actualizarProveedor
);

router.delete(
  '/:id',
  validate('params', idParamSchema),
  eliminarProveedor
);

export default router;