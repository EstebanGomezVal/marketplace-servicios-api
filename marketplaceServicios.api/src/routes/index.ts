import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import suppliersRoutes from './suppliers.routes';
import servicesRoutes from './offering.routes';
import bookingsRoutes from './bookings.routes';
import reviewsRoutes from './reviews.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/suppliers', suppliersRoutes);
router.use('/services', servicesRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/reviews', reviewsRoutes);

export default router;