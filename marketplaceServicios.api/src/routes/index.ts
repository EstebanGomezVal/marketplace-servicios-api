import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import suppliersRoutes from './suppliers.routes';
import servicesRoutes from './offering.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/supplieres', suppliersRoutes);
router.use('/servicess', servicesRoutes);

export default router;