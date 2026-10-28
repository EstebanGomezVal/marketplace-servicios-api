import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import suppliersRoutes from './suppliers.routes';
import servicesRoutes from './offering.routes';
import bookingRoutes from './booking.routes';
import reviewRoutes from './review.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/suppliers', suppliersRoutes);
router.use('/services', servicesRoutes);
router.use('/bookings', bookingRoutes);
router.use('/reviews', reviewRoutes);

export default router;