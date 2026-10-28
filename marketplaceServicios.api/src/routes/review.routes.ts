import { Router } from 'express';
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

router.get('/', (req, res) => res.status(501).json({ message: 'Pendiente' }));

router.get(
  '/:id',
  validate('params', idParamSchema),
  (req, res) => res.status(501).json({ message: 'Pendiente' })
);

router.post(
  '/',
  validate('body', createReviewSchema),
  (req, res) => res.status(501).json({ message: 'Pendiente' })
);

router.put(
  '/:id',
  validate('params', idParamSchema),
  validate('body', updateReviewSchema),
  (req, res) => res.status(501).json({ message: 'Pendiente' })
);

router.delete(
  '/:id',
  validate('params', idParamSchema),
  (req, res) => res.status(501).json({ message: 'Pendiente' })
);

export default router;