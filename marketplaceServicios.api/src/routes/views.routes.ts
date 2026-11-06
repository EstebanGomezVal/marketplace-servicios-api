import { Router } from 'express';
import {
    redirectToServices,
    listServicesView,
    serviceDetailView
} from '../controllers/views.controller';
import { validate } from '../middleware/data.middleware';
import { idParamSchema } from '../schemas/common.schema';

const router = Router();

router.get('/', redirectToServices);
router.get('/servicios', listServicesView);
router.get('/servicios/:id', validate('params', idParamSchema), serviceDetailView);

export default router;
