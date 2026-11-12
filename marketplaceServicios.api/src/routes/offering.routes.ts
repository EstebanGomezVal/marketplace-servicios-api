import { Router } from 'express';
import {
  obtenerServicios,
  obtenerServicioPorId,
  crearServicio,
  actualizarServicio,
  eliminarServicio
} from '../controllers/offering.controller';
import { allowRole, authentication } from '../middleware/auth.middleware';
import { requireServicioOwnerOrAdmin } from '../middleware/ownership';
import { validate } from '../middleware/data.middleware';
import { serviceSchemaZod } from '../schemas/Offering.schemas';

const router = Router();

/**
 * @openapi
 * /services:
 *   get:
 *     tags: [Servicios]
 *     summary: Listar servicios (público)
 *     responses:
 *       200:
 *         description: "Servicios no eliminados, con proveedor y su usuario"
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Servicio' } }
 *       500: { $ref: '#/components/responses/ServerError' }
 *   post:
 *     tags: [Servicios]
 *     summary: Crear servicio (proveedor | admin)
 *     description: "Para rol proveedor se usa su perfil de proveedor (debe existir). Admin debe enviar `proveedor`."
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ServicioInput' }
 *     responses:
 *       201:
 *         description: Servicio creado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Servicio' }
 *       400: { description: "Falta `proveedor` (admin) u otro error", content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: "Rol sin permiso, o el proveedor aún no tiene perfil", content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { $ref: '#/components/responses/ValidationFailed' }
 */
router.get('/', obtenerServicios);
/**
 * @openapi
 * /services/{id}:
 *   parameters:
 *     - $ref: '#/components/parameters/IdParam'
 *   get:
 *     tags: [Servicios]
 *     summary: Ver servicio (público)
 *     responses:
 *       200:
 *         description: Servicio
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Servicio' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Servicios]
 *     summary: Actualizar servicio (dueño o admin)
 *     description: "Todos los campos opcionales. `proveedor` no se puede cambiar."
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ServicioInput' }
 *     responses:
 *       200:
 *         description: Servicio actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Servicio' }
 *       400: { description: "Error al actualizar", content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: "No eres el dueño", content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: "No encontrado o datos inválidos (validate)", content: { application/json: { schema: { oneOf: [{ $ref: '#/components/schemas/Error' }, { $ref: '#/components/schemas/ValidationError' }] } } } }
 *   delete:
 *     tags: [Servicios]
 *     summary: Eliminar servicio (dueño o admin; soft delete)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204: { description: "Eliminado" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: "No eres el dueño", content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
router.get('/:id', obtenerServicioPorId);

router.post(
  '/',
  authentication,
  allowRole('proveedor', 'admin'),
  validate('body', serviceSchemaZod),
  crearServicio
);

router.put(
  '/:id',
  authentication,
  requireServicioOwnerOrAdmin,
  validate('body', serviceSchemaZod.partial()),
  actualizarServicio
);

router.delete('/:id', authentication, requireServicioOwnerOrAdmin, eliminarServicio);

export default router;