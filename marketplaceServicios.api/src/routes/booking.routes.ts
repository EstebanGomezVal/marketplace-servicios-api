import { Router } from 'express';
import {
  obtenerBookings,
  obtenerBookingPorId,
  crearBooking,
  actualizarBooking,
  eliminarBooking,
} from '../controllers/booking.controller';
import { validate } from '../middleware/data.middleware';
import {
  createBookingSchema,
  updateBookingSchema,
} from '../schemas/booking.schema';
import { objectIdSchema } from '../schemas/common.schema';
import { z } from 'zod';

const router = Router();

const idParamSchema = z.object({
  id: objectIdSchema,
});

router.get('/', obtenerBookings);

router.get(
  '/:id',
  validate('params', idParamSchema),
  obtenerBookingPorId
);

router.post(
  '/',
  validate('body', createBookingSchema),
  crearBooking
);

router.put(
  '/:id',
  validate('params', idParamSchema),
  validate('body', updateBookingSchema),
  actualizarBooking
);

router.delete(
  '/:id',
  validate('params', idParamSchema),
  eliminarBooking
);

export default router;