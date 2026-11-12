import { Router } from 'express';
import {
  obtenerProveedores,
  obtenerProveedorPorId,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor
} from '../controllers/suppliers.controller';
import { allowRole, authentication } from '../middleware/auth.middleware';
import { requireProveedorOwnerOrAdmin } from '../middleware/ownership';
import { validate } from '../middleware/data.middleware';
import { provedoorSchema } from '../schemas/Proveedor.schema'; // ajusta

const router = Router();

/**
 * @openapi
 * /suppliers:
 *   get:
 *     tags: [Proveedores]
 *     summary: Listar proveedores (público)
 *     responses:
 *       200:
 *         description: "Proveedores no eliminados, con su usuario"
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Proveedor' } }
 *       500: { $ref: '#/components/responses/ServerError' }
 *   post:
 *     tags: [Proveedores]
 *     summary: Crear perfil de proveedor (proveedor | admin)
 *     description: "Para rol proveedor el `usuario` sale del token. Un usuario solo puede tener un perfil."
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProveedorInput' }
 *     responses:
 *       201:
 *         description: Perfil creado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Proveedor' }
 *       400: { description: "Falta `usuario` (admin) u otro error", content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/ValidationFailed' }
 *       409: { description: "Este usuario ya tiene un perfil de proveedor", content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.get('/', obtenerProveedores);
/**
 * @openapi
 * /suppliers/{id}:
 *   parameters:
 *     - $ref: '#/components/parameters/IdParam'
 *   get:
 *     tags: [Proveedores]
 *     summary: Ver proveedor (público)
 *     responses:
 *       200:
 *         description: Proveedor
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Proveedor' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Proveedores]
 *     summary: Actualizar perfil (dueño o admin)
 *     description: "Todos los campos opcionales. `usuario` no se puede cambiar."
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProveedorInput' }
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Proveedor' }
 *       400: { description: "Error al actualizar", content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: "No eres el dueño", content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: "No encontrado o datos inválidos (validate)", content: { application/json: { schema: { oneOf: [{ $ref: '#/components/schemas/Error' }, { $ref: '#/components/schemas/ValidationError' }] } } } }
 *   delete:
 *     tags: [Proveedores]
 *     summary: "Eliminar perfil (dueño o admin; soft delete, también sus servicios)"
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204: { description: "Eliminado" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: "No eres el dueño", content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
router.get('/:id', obtenerProveedorPorId);

router.post(
  '/',
  authentication,
  allowRole('proveedor', 'admin'),
  validate('body', provedoorSchema),
  crearProveedor
);

router.put(
  '/:id',
  authentication,
  requireProveedorOwnerOrAdmin,
  validate('body', provedoorSchema.partial()), // o un update schema
  actualizarProveedor
);

router.delete('/:id', authentication, requireProveedorOwnerOrAdmin, eliminarProveedor);

export default router;