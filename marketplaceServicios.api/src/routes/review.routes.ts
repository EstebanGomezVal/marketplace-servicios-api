import { Router } from 'express';
import {
  obtenerReviews,
  obtenerReviewPorId,
  crearReview,
  actualizarReview,
  eliminarReview,
} from '../controllers/review.controller';
import { validate } from '../middleware/data.middleware';
import {
  createReviewSchema,
  updateReviewSchema,
} from '../schemas/review.schema';
import { objectIdSchema } from '../schemas/common.schema';
import { z } from 'zod';

const router = Router();

const idParamSchema = z.object({
  id: objectIdSchema,
});

router.get('/', obtenerReviews);

router.get(
  '/:id',
  validate('params', idParamSchema),
  obtenerReviewPorId
);

router.post(
  '/',
  validate('body', createReviewSchema),
  crearReview
);

router.put(
  '/:id',
  validate('params', idParamSchema),
  validate('body', updateReviewSchema),
  actualizarReview
);

router.delete(
  '/:id',
  validate('params', idParamSchema),
  eliminarReview
);

export default router;