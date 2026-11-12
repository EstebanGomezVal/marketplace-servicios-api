import { Router } from 'express';
import {
    crearBooking,
    obtenerBookings,
    obtenerBookingPorId,
    actualizarBooking,
    eliminarBooking
} from '../controllers/bookings.controller';
import { requireAuth, allowRoles } from '../middleware/auth.middleware';
import { validate } from '../middleware/data.middleware';
import { requireVerifiedEmail } from '../middleware/verified-email.middleware';
import { idParamSchema } from '../schemas/common.schema';
import { createBookingSchema, updateBookingSchema } from '../schemas/Booking.schema';

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: "Solicitar un servicio (cliente | admin, correo verificado)"
 *     description: "El dueño es el usuario del token y el estado inicial es `pendiente`. El servicio debe existir, no estar eliminado y estar activo."
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/BookingInput' }
 *     responses:
 *       201:
 *         description: Booking creada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Booking' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/EmailNotVerified' }
 *       404: { description: "Servicio no encontrado/inactivo o datos inválidos (validate)", content: { application/json: { schema: { oneOf: [{ $ref: '#/components/schemas/Error' }, { $ref: '#/components/schemas/ValidationError' }] } } } }
 *       500: { $ref: '#/components/responses/ServerError' }
 *   get:
 *     tags: [Bookings]
 *     summary: Listar bookings según el rol
 *     description: cliente → las suyas · proveedor → las de sus servicios · admin → todas. Orden más recientes primero.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Bookings
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Booking' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
router.post(
    '/',
    allowRoles('cliente', 'admin'),
    requireVerifiedEmail,
    validate('body', createBookingSchema),
    crearBooking
);
router.get('/', obtenerBookings);
/**
 * @openapi
 * /bookings/{id}:
 *   parameters:
 *     - $ref: '#/components/parameters/IdParam'
 *   get:
 *     tags: [Bookings]
 *     summary: "Ver booking (cliente dueño, proveedor del servicio o admin)"
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Booking
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Booking' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { description: "No existe o sin acceso (no se revela)", content: { application/json: { schema: { oneOf: [{ $ref: '#/components/schemas/Error' }, { $ref: '#/components/schemas/ValidationError' }] } } } }
 *   put:
 *     tags: [Bookings]
 *     summary: Cambiar estado y/o detalles
 *     description: |
 *       Transiciones permitidas (cualquier otra → 409):
 *
 *       | Desde | Hacia | Quién |
 *       |---|---|---|
 *       | pendiente | aceptada, rechazada | proveedor del servicio, admin |
 *       | pendiente | cancelada | cliente dueño, admin |
 *       | aceptada | completada | proveedor del servicio, admin |
 *       | aceptada | cancelada | cliente dueño, admin |
 *
 *       rechazada, completada y cancelada son finales. `descripcion`, `direccion` y `fechaProgramada`
 *       solo los cambia el cliente (o admin) mientras está `pendiente`.
 *       Al pasar a `aceptada` o `completada` se envía un correo al cliente (un fallo de correo no cambia la respuesta).
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/BookingUpdateInput' }
 *     responses:
 *       200:
 *         description: Booking actualizada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Booking' }
 *       400: { description: "Error de validación de Mongoose", content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { description: "No existe, sin acceso o datos inválidos (validate)", content: { application/json: { schema: { oneOf: [{ $ref: '#/components/schemas/Error' }, { $ref: '#/components/schemas/ValidationError' }] } } } }
 *       409:
 *         description: Transición o edición no permitida
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/TransitionError' }
 *   delete:
 *     tags: [Bookings]
 *     summary: Eliminar booking (cliente dueño o admin; soft delete)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Reserva eliminada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Message' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', validate('params', idParamSchema), obtenerBookingPorId);
router.put('/:id', validate('params', idParamSchema), validate('body', updateBookingSchema), actualizarBooking);
router.delete('/:id', validate('params', idParamSchema), eliminarBooking);

export default router;
