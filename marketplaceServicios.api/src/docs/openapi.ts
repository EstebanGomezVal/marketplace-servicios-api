import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
import { CATEGORIAS_VALIDAS, TIPOS_PRECIO_VALIDOS } from '../models/offering.model';
import { ESTADOS_BOOKING } from '../models/Booking.model';
import { moduleLogger } from '../config/logger';

/*
 * OpenAPI 3 generado con swagger-jsdoc:
 *  - Esta definición base tiene info, seguridad y los schemas/respuestas compartidos.
 *  - Cada endpoint se documenta con un bloque @openapi en src/routes/*.routes.ts.
 *
 * Funciona en dev (tsx lee src/routes/*.ts) y tras build (node lee dist/routes/*.js,
 * tsc conserva los comentarios porque removeComments no está activado).
 */

const log = moduleLogger('docs');

const objectId = { type: 'string', pattern: '^[0-9a-fA-F]{24}$', example: '6af4fe5e8be23a12cb240aac' };
const timestamps = {
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
};
const errorBody = (message: string) => ({
    type: 'object',
    properties: {
        error: {
            type: 'object',
            properties: { message: { type: 'string', example: message } },
            required: ['message']
        }
    }
});
const jsonResponse = (description: string, schemaRef: string) => ({
    description,
    content: { 'application/json': { schema: { $ref: schemaRef } } }
});

// Campos públicos de un usuario (nunca password)
const usuarioPublico = {
    _id: objectId,
    nombre: { type: 'string', example: 'Ana' },
    apellido: { type: 'string', example: 'López' },
    correo: { type: 'string', format: 'email', example: 'ana@example.com' }
};

const definition: swaggerJSDoc.OAS3Definition = {
    openapi: '3.0.3',
    info: {
        title: 'Marketplace de Servicios API',
        version: '3.0.0',
        description: [
            'API REST del marketplace (entregas 1–3).',
            '',
            '**Autenticación:** `POST /auth/login` (o `/auth/register`) devuelve `token`. ',
            'Pulsa **Authorize**, pega el token (sin la palabra `Bearer`) y las peticiones protegidas lo enviarán como `Authorization: Bearer <token>`. ',
            'La API también acepta el JWT en la cookie `token` que pone el login.',
            '',
            '**Validación:** si el cuerpo o los parámetros no pasan el schema, el middleware `validate` responde **404** con `Datos invalidos` y `details`.',
            '',
            '**Request id:** toda respuesta trae la cabecera `X-Request-Id` (se respeta la que envíes).'
        ].join('\n')
    },
    servers: [{ url: '/api', description: 'Este servidor' }],
    tags: [
        { name: 'Auth', description: 'Registro, login, sesión y Google OAuth' },
        { name: 'Cuenta', description: 'Verificación de correo y recuperación de contraseña' },
        { name: 'Usuarios' },
        { name: 'Proveedores' },
        { name: 'Servicios' },
        { name: 'Bookings', description: 'Solicitudes de servicio (todas requieren JWT)' },
        { name: 'Reviews', description: 'Reseñas de bookings completadas' }
    ],
    components: {
        securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
        },
        parameters: {
            IdParam: {
                name: 'id', in: 'path', required: true,
                description: 'ObjectId de Mongo (24 hex)',
                schema: objectId
            }
        },
        schemas: {
            ObjectId: objectId,

            Error: errorBody('Mensaje de error'),
            ErrorWithCode: {
                type: 'object',
                properties: {
                    error: {
                        type: 'object',
                        properties: {
                            code: { type: 'string', example: 'EMAIL_NOT_VERIFIED' },
                            message: { type: 'string' }
                        }
                    }
                }
            },
            ValidationError: {
                type: 'object',
                properties: {
                    error: {
                        type: 'object',
                        properties: {
                            message: { type: 'string', example: 'Datos invalidos' },
                            details: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        field: { type: 'string', example: 'correo' },
                                        message: { type: 'string', example: 'Debe ser un correo electronico valido' }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            ServerError: {
                type: 'object',
                properties: {
                    error: {
                        type: 'object',
                        properties: {
                            message: { type: 'string', example: 'Error interno' },
                            requestId: { type: 'string', description: 'Solo en errores no controlados (errorHandler)' }
                        }
                    }
                }
            },
            Message: {
                type: 'object',
                properties: { message: { type: 'string' } }
            },

            /* ---------- Usuarios ---------- */
            Rol: { type: 'string', enum: ['cliente', 'proveedor', 'admin'] },
            Usuario: {
                type: 'object',
                description: 'Usuario sin password (el modelo la quita en toJSON)',
                properties: {
                    ...usuarioPublico,
                    telefono: { type: 'string', example: '3312345678' },
                    ciudad: { type: 'string', example: 'Guadalajara' },
                    fotoPerfil: { type: 'string', format: 'uri' },
                    rol: { $ref: '#/components/schemas/Rol' },
                    emailVerified: { type: 'boolean', example: false },
                    googleId: { type: 'string', description: 'Solo en cuentas vinculadas con Google' },
                    isDeleted: { type: 'boolean', example: false },
                    ...timestamps
                }
            },
            UsuarioResumen: {
                type: 'object',
                properties: usuarioPublico
            },
            RegisterInput: {
                type: 'object',
                required: ['nombre', 'apellido', 'correo', 'password'],
                properties: {
                    nombre: { type: 'string', minLength: 1 },
                    apellido: { type: 'string', minLength: 1 },
                    correo: { type: 'string', format: 'email' },
                    password: { type: 'string', format: 'password', minLength: 8 },
                    telefono: { type: 'string', pattern: '^[0-9]{10}$' },
                    ciudad: { type: 'string', minLength: 1 }
                }
            },
            LoginInput: {
                type: 'object',
                required: ['correo', 'password'],
                properties: {
                    correo: { type: 'string', format: 'email', example: 'ana@example.com' },
                    password: { type: 'string', format: 'password', example: '12345678' }
                }
            },
            AuthResponse: {
                type: 'object',
                properties: {
                    usuario: { $ref: '#/components/schemas/Usuario' },
                    token: { type: 'string', description: 'JWT (1 h). Úsalo en Authorize.' }
                }
            },
            UsuarioUpdateInput: {
                type: 'object',
                description: 'Todos opcionales. `rol` y `password` se ignoran aunque se envíen.',
                properties: {
                    nombre: { type: 'string', minLength: 1 },
                    apellido: { type: 'string', minLength: 1 },
                    correo: { type: 'string', format: 'email' },
                    telefono: { type: 'string', pattern: '^[0-9]{10}$' },
                    ciudad: { type: 'string', minLength: 1 },
                    fotoPerfil: { type: 'string', format: 'uri' }
                }
            },

            /* ---------- Proveedores ---------- */
            Proveedor: {
                type: 'object',
                properties: {
                    _id: objectId,
                    usuario: {
                        type: 'object',
                        description: 'Populado: nombre apellido correo telefono ciudad fotoPerfil rol',
                        properties: {
                            ...usuarioPublico,
                            telefono: { type: 'string' },
                            ciudad: { type: 'string' },
                            fotoPerfil: { type: 'string' },
                            rol: { $ref: '#/components/schemas/Rol' }
                        }
                    },
                    descripcion: { type: 'string', example: 'Plomero con 10 años de experiencia' },
                    experienciaAnios: { type: 'number', minimum: 0, example: 10 },
                    zonaCobertura: { type: 'array', items: { type: 'string' }, example: ['Centro', 'Zapopan'] },
                    fotosTrabajos: { type: 'array', items: { type: 'string' } },
                    disponible: { type: 'boolean', example: true },
                    isDeleted: { type: 'boolean' },
                    ...timestamps
                }
            },
            ProveedorInput: {
                type: 'object',
                required: ['descripcion', 'experienciaAnios'],
                properties: {
                    usuario: { ...objectId, description: 'Solo admin (obligatorio para admin). Para proveedor se toma del token.' },
                    descripcion: { type: 'string', minLength: 1 },
                    experienciaAnios: { type: 'number', minimum: 0, maximum: 80 },
                    zonaCobertura: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } },
                    fotosTrabajos: { type: 'array', items: { type: 'string' } },
                    disponible: { type: 'boolean', default: true }
                }
            },

            /* ---------- Servicios ---------- */
            Categoria: { type: 'string', enum: [...CATEGORIAS_VALIDAS] },
            TipoPrecio: { type: 'string', enum: [...TIPOS_PRECIO_VALIDOS] },
            Servicio: {
                type: 'object',
                properties: {
                    _id: objectId,
                    proveedor: {
                        description: 'Populado con su usuario (nombre apellido correo telefono ciudad fotoPerfil)',
                        allOf: [{ $ref: '#/components/schemas/Proveedor' }]
                    },
                    titulo: { type: 'string', example: 'Reparación de fugas' },
                    descripcion: { type: 'string' },
                    categoria: { $ref: '#/components/schemas/Categoria' },
                    precio: { type: 'number', minimum: 0, example: 450 },
                    tipoPrecio: { $ref: '#/components/schemas/TipoPrecio' },
                    activo: { type: 'boolean', example: true },
                    isDeleted: { type: 'boolean' },
                    ...timestamps
                }
            },
            ServicioInput: {
                type: 'object',
                required: ['titulo', 'descripcion', 'categoria', 'precio', 'tipoPrecio'],
                properties: {
                    proveedor: { ...objectId, description: 'Solo admin (obligatorio para admin). Para proveedor se usa su perfil.' },
                    titulo: { type: 'string', minLength: 1 },
                    descripcion: { type: 'string', minLength: 1 },
                    categoria: { $ref: '#/components/schemas/Categoria' },
                    precio: { type: 'number', minimum: 0 },
                    tipoPrecio: { $ref: '#/components/schemas/TipoPrecio' },
                    activo: { type: 'boolean', default: true }
                }
            },

            /* ---------- Bookings ---------- */
            EstadoBooking: { type: 'string', enum: [...ESTADOS_BOOKING] },
            Booking: {
                type: 'object',
                properties: {
                    _id: objectId,
                    usuario: { $ref: '#/components/schemas/UsuarioResumen' },
                    servicio: {
                        type: 'object',
                        properties: {
                            _id: objectId,
                            titulo: { type: 'string' },
                            precio: { type: 'number' },
                            categoria: { $ref: '#/components/schemas/Categoria' }
                        }
                    },
                    descripcion: { type: 'string' },
                    direccion: { type: 'string' },
                    fechaProgramada: { type: 'string', format: 'date-time' },
                    estado: { $ref: '#/components/schemas/EstadoBooking' },
                    isDeleted: { type: 'boolean' },
                    ...timestamps
                }
            },
            BookingInput: {
                type: 'object',
                required: ['servicio'],
                description: '`usuario` y `estado` no se aceptan: el dueño sale del token y el estado inicial es `pendiente`.',
                properties: {
                    servicio: objectId,
                    descripcion: { type: 'string', minLength: 1 },
                    direccion: { type: 'string', minLength: 1 },
                    fechaProgramada: { type: 'string', format: 'date-time', description: 'Debe ser futura' }
                }
            },
            BookingUpdateInput: {
                type: 'object',
                minProperties: 1,
                properties: {
                    estado: { $ref: '#/components/schemas/EstadoBooking' },
                    descripcion: { type: 'string', minLength: 1 },
                    direccion: { type: 'string', minLength: 1 },
                    fechaProgramada: { type: 'string', format: 'date-time', description: 'Debe ser futura' }
                }
            },
            TransitionError: {
                type: 'object',
                properties: {
                    error: {
                        type: 'object',
                        properties: {
                            message: { type: 'string', example: 'Transición no permitida: pendiente → completada' },
                            estadoActual: { $ref: '#/components/schemas/EstadoBooking' },
                            permitidas: { type: 'array', items: { $ref: '#/components/schemas/EstadoBooking' } }
                        }
                    }
                }
            },

            /* ---------- Reviews ---------- */
            Review: {
                type: 'object',
                properties: {
                    _id: objectId,
                    booking: objectId,
                    usuario: {
                        type: 'object',
                        properties: {
                            _id: objectId,
                            nombre: { type: 'string' },
                            apellido: { type: 'string' },
                            fotoPerfil: { type: 'string' }
                        }
                    },
                    proveedor: {
                        type: 'object',
                        properties: {
                            _id: objectId,
                            descripcion: { type: 'string' },
                            usuario: {
                                type: 'object',
                                properties: { _id: objectId, nombre: { type: 'string' }, apellido: { type: 'string' } }
                            }
                        }
                    },
                    servicio: {
                        type: 'object',
                        nullable: true,
                        properties: { _id: objectId, titulo: { type: 'string' }, categoria: { $ref: '#/components/schemas/Categoria' } }
                    },
                    calificacion: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                    comentario: { type: 'string', example: 'Excelente trabajo' },
                    isDeleted: { type: 'boolean' },
                    ...timestamps
                }
            },
            ReviewInput: {
                type: 'object',
                required: ['booking', 'calificacion', 'comentario'],
                description: '`usuario` y `proveedor` se toman de la booking.',
                properties: {
                    booking: objectId,
                    calificacion: { type: 'integer', minimum: 1, maximum: 5 },
                    comentario: { type: 'string', minLength: 1, maxLength: 1000 }
                }
            },
            ReviewUpdateInput: {
                type: 'object',
                minProperties: 1,
                properties: {
                    calificacion: { type: 'integer', minimum: 1, maximum: 5 },
                    comentario: { type: 'string', minLength: 1, maxLength: 1000 }
                }
            },

            /* ---------- Cuenta ---------- */
            TokenInput: {
                type: 'object',
                required: ['token'],
                properties: { token: { type: 'string', pattern: '^[a-f0-9]{64}$', description: 'Token del enlace del correo' } }
            },
            ResetPasswordInput: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                    token: { type: 'string', pattern: '^[a-f0-9]{64}$' },
                    password: { type: 'string', format: 'password', minLength: 8 }
                }
            }
        },
        responses: {
            Unauthorized: jsonResponse('Sin token, token inválido/expirado o usuario eliminado', '#/components/schemas/Error'),
            Forbidden: jsonResponse('El rol no tiene permiso para esta acción', '#/components/schemas/Error'),
            NotFound: jsonResponse('No existe, está eliminado o no tienes acceso', '#/components/schemas/Error'),
            ValidationFailed: jsonResponse('Datos inválidos (middleware validate; responde 404)', '#/components/schemas/ValidationError'),
            ServerError: jsonResponse('Error interno', '#/components/schemas/ServerError'),
            EmailNotVerified: jsonResponse('Rol sin permiso, o `code: EMAIL_NOT_VERIFIED` si el correo no está verificado', '#/components/schemas/ErrorWithCode')
        }
    }
};

// .ts con tsx (dev), .js tras build. Barras normales: glob no entiende "\" de Windows.
const routesGlob = path
    .join(__dirname, '..', 'routes', `*.routes${path.extname(__filename)}`)
    .replace(/\\/g, '/');

const buildSpec = (): object => {
    try {
        const spec = swaggerJSDoc({ definition, apis: [routesGlob], failOnErrors: true }) as {
            paths?: Record<string, unknown>;
        };
        const count = Object.keys(spec.paths ?? {}).length;
        if (count === 0) log.warn({ routesGlob }, 'OpenAPI sin paths: revisa los bloques @openapi');
        else log.debug({ paths: count }, 'Especificación OpenAPI generada');
        return spec;
    } catch (err) {
        // Un YAML mal escrito no debe tumbar la API: /docs muestra solo la base
        log.error({ err }, 'No se pudo generar la especificación OpenAPI');
        return { ...definition, paths: {} };
    }
};

export const openapiSpec = buildSpec();
