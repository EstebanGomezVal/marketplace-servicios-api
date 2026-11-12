import { Router } from 'express';
import {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario,
  actualizarRolUsuario
} from '../controllers/users.controller';
import { allowRole, authentication } from '../middleware/auth.middleware';
import { requireSelfOrAdmin } from '../middleware/ownership';
import { validate } from '../middleware/data.middleware';
import { z } from 'zod';
import { usuarioSchemaZod } from '../schemas/Usuario.schema'; // ajusta ruta

const router = Router();

const updateRoleSchema = z.object({
  rol: z.enum(['cliente', 'proveedor', 'admin'])
});

router.use(authentication);

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Usuarios]
 *     summary: Listar usuarios (solo admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Usuarios no eliminados
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Usuario' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
router.get('/', allowRole('admin'), obtenerUsuarios);

/**
 * @openapi
 * /users/{id}:
 *   parameters:
 *     - $ref: '#/components/parameters/IdParam'
 *   get:
 *     tags: [Usuarios]
 *     summary: Ver usuario (el propio o admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Usuario
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Usuario' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Usuarios]
 *     summary: Actualizar usuario (el propio o admin)
 *     description: "No cambia `rol` ni `password` aunque se envíen. El rol se cambia con PATCH /users/{id}/role."
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UsuarioUpdateInput' }
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Usuario' }
 *       400: { description: "Error de Mongoose (p. ej. correo duplicado)", content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { description: "No encontrado, sin acceso o datos inválidos (validate)", content: { application/json: { schema: { oneOf: [{ $ref: '#/components/schemas/Error' }, { $ref: '#/components/schemas/ValidationError' }] } } } }
 *   delete:
 *     tags: [Usuarios]
 *     summary: Eliminar usuario (soft delete; el propio o admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204: { description: "Eliminado" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
router.get('/:id', requireSelfOrAdmin, obtenerUsuarioPorId);
router.put('/:id', requireSelfOrAdmin, validate('body', usuarioSchemaZod), actualizarUsuario);
router.delete('/:id', requireSelfOrAdmin, eliminarUsuario);

/**
 * @openapi
 * /users/{id}/role:
 *   patch:
 *     tags: [Usuarios]
 *     summary: Cambiar rol (solo admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rol]
 *             properties:
 *               rol: { $ref: '#/components/schemas/Rol' }
 *     responses:
 *       200:
 *         description: Rol actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Usuario' }
 *       400: { description: "Error al cambiar rol", content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { description: "Usuario no encontrado o datos inválidos (validate)", content: { application/json: { schema: { oneOf: [{ $ref: '#/components/schemas/Error' }, { $ref: '#/components/schemas/ValidationError' }] } } } }
 */
router.patch(
  '/:id/role',
  allowRole('admin'),
  validate('body', updateRoleSchema),
  actualizarRolUsuario
);

export default router;