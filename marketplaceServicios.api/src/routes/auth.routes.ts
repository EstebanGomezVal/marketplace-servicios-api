import { Router } from 'express';
import { registrar, login, logout, getMe } from '../controllers/auth.controller';
import { validate } from '../middleware/data.middleware';
import { registerSchema, loginSchema } from '../schemas/Usuario.schema';
import { authentication } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', validate('body', registerSchema), registrar);
router.post('/login', validate('body', loginSchema), login);
router.post('/logout', logout);
router.get('/me', authentication, getMe);

export default router;