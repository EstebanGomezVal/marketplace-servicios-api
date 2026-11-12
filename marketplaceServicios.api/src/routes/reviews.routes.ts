import { Router } from 'express';
import {
    obtenerReviews,
    obtenerReviewPorId,
    crearReview,
    actualizarReview,
    eliminarReview
} from '../controllers/reviews.controller';
import { requireAuth, allowRoles } from '../middleware/auth.middleware';
import { validate } from '../middleware/data.middleware';
import { requireVerifiedEmail } from '../middleware/verified-email.middleware';
import { idParamSchema } from '../schemas/common.schema';
import { createReviewSchema, updateReviewSchema } from '../schemas/Review.schema';

const router = Router();

// Públicos
/**
 * @openapi
 * /reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: Listar reseñas (público)
 *     parameters:
 *       - { name: proveedor, in: query, description: Filtrar por proveedor, schema: { $ref: '#/components/schemas/ObjectId' } }
 *       - { name: servicio, in: query, description: Filtrar por servicio, schema: { $ref: '#/components/schemas/ObjectId' } }
 *     responses:
 *       200:
 *         description: "Reseñas no eliminadas, más recientes primero"
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Review' } }
 *       400: { description: "Filtro con ID inválido", content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       500: { $ref: '#/components/responses/ServerError' }
 *   post:
 *     tags: [Reviews]
 *     summary: "Reseñar una booking completada (cliente | admin, correo verificado)"
 *     description: El cliente solo puede reseñar sus propias bookings (admin cualquiera). Una reseña por booking.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ReviewInput' }
 *     responses:
 *       201:
 *         description: Reseña creada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Review' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/EmailNotVerified' }
 *       404: { description: "Booking no encontrada/ajena o datos inválidos (validate)", content: { application/json: { schema: { oneOf: [{ $ref: '#/components/schemas/Error' }, { $ref: '#/components/schemas/ValidationError' }] } } } }
 *       409: { description: "La booking no está completada o ya tiene reseña", content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
router.get('/', obtenerReviews);
/**
 * @openapi
 * /reviews/{id}:
 *   parameters:
 *     - $ref: '#/components/parameters/IdParam'
 *   get:
 *     tags: [Reviews]
 *     summary: Ver reseña (público)
 *     responses:
 *       200:
 *         description: Reseña
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Review' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Reviews]
 *     summary: Editar reseña (autor o admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ReviewUpdateInput' }
 *     responses:
 *       200:
 *         description: Reseña actualizada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Review' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { description: "No existe, no eres el autor o datos inválidos (validate)", content: { application/json: { schema: { oneOf: [{ $ref: '#/components/schemas/Error' }, { $ref: '#/components/schemas/ValidationError' }] } } } }
 *   delete:
 *     tags: [Reviews]
 *     summary: Eliminar reseña (autor o admin; soft delete)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Reseña eliminada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Message' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', validate('params', idParamSchema), obtenerReviewPorId);

// Autenticados
router.post(
    '/',
    requireAuth,
    allowRoles('cliente', 'admin'),
    requireVerifiedEmail,
    validate('body', createReviewSchema),
    crearReview
);
router.put('/:id', requireAuth, validate('params', idParamSchema), validate('body', updateReviewSchema), actualizarReview);
router.delete('/:id', requireAuth, validate('params', idParamSchema), eliminarReview);

export default router;
