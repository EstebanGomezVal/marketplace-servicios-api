import { Router } from 'express';
import {
  obtenerServicios,
  obtenerServicioPorId,
  crearServicio,
  actualizarServicio,
  eliminarServicio,
} from '../controllers/offering.controller';
import { validate } from '../middleware/data.middleware';
import {
  createOfferingSchema,
  updateOfferingSchema,
} from '../schemas/Offering.schemas';
import { objectIdSchema } from '../schemas/common.schema';
import { z } from 'zod';

const router = Router();

const idParamSchema = z.object({
  id: objectIdSchema,
});

router.get('/', obtenerServicios);

router.get(
  '/:id',
  validate('params', idParamSchema),
  obtenerServicioPorId
);

router.post(
  '/',
  validate('body', createOfferingSchema),
  crearServicio
);

router.put(
  '/:id',
  validate('params', idParamSchema),
  validate('body', updateOfferingSchema),
  actualizarServicio
);

router.delete(
  '/:id',
  validate('params', idParamSchema),
  eliminarServicio
);

export default router;