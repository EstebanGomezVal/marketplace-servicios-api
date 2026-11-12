# marketplace-servicios-api

Marketplace de servicios (plomería, electricidad, etc.) con API REST y vistas HTML.

## Tecnologías
- Node.js, Express 5, TypeScript
- MongoDB Atlas + Mongoose
- Handlebars (vistas), Zod (validación)
- JWT (cookie `token` y `Authorization: Bearer`), Passport (Google OAuth)
- Nodemailer (correos), pino (logs), swagger-jsdoc + swagger-ui-express (`/docs`)

## Requisitos
- Node.js 24.22.0
- Cuenta MongoDB Atlas (lo único obligatorio). 
- Google OAuth y SMTP.

## Instalación
```bash
git clone https://github.com/EstebanGomezVal/marketplace-servicios-api
cd marketplace-servicios-api/marketplaceServicios.api
npm install
cp .env.example .env
```

## Cómo ejecutarlo

| Comando | Qué hace |
|---|---|
| `npm run dev` | Desarrollo con recarga (`tsx watch`) |
| `npm run build` | Compila a `dist/` |
| `npm start` | Ejecuta la versión compilada (`dist/index.js`) |
| `npm run seed` | Crea o actualiza los datos de prueba (ver *Usuarios de prueba*) |
| `npm run seed:dist` | Igual, pero desde `dist/` (tras `npm run build`) |

Con el servidor arriba (`PORT=3000` por defecto):
- Vistas: `http://localhost:3000/servicios`, `/login`, `/registro`, `/mis-solicitudes`
- API: `http://localhost:3000/api/...`
- Documentación: `http://localhost:3000/docs`

## Variables de entorno

La plantilla completa y comentada está en `marketplaceServicios.api/.env.example` (sin secretos).

| Variable | Obligatoria | Por defecto | Uso |
|---|---|---|---|
| `MONGODB_URI` | **Sí** | — | Cadena de conexión de Atlas |
| `JWT_SECRET` | **Sí** | — | Firma de los JWT. Sin ella el servidor no arranca |
| `PORT` | No | `3000` | Puerto HTTP |
| `NODE_ENV` | No | — | `production` → logs JSON, sin Ethereal y seed bloqueado |
| `APP_URL` | No | `http://localhost:<PORT>` | Base de los enlaces de los correos |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | — | Si falta alguna, Google queda desactivado (warn en el log) |
| `GOOGLE_CALLBACK_URL` | No | `/api/auth/google/callback` | Debe coincidir con la consola de Google |
| `SMTP_HOST` | No | — | Vacío → Ethereal en desarrollo; en producción no se envía nada |
| `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | No | `587` | Credenciales SMTP (Mailtrap, etc.) |
| `SMTP_SECURE` | No | según el puerto | `true` para 465 |
| `MAIL_FROM` | No | `Marketplace Servicios <no-reply@marketplace.local>` | Remitente |
| `MAIL_DISABLED` | No | `false` | `true` → no envía correos (solo warn) |
| `VERIFY_EMAIL_TTL_HOURS` | No | `24` | Vigencia del enlace de verificación |
| `RESET_PASSWORD_TTL_MINUTES` | No | `30` | Vigencia del enlace para restablecer la contraseña |
| `LOG_LEVEL` | No | `info` | `trace` … `fatal`, `silent` |
| `SEED_ALLOW_PRODUCTION` | No | — | `true` permite `npm run seed` con `NODE_ENV=production` |

`JWT_EXPIRES_IN` aparece comentada en la plantilla, pero el código no la lee: el JWT dura 1 h fija.

## Estructura

```
marketplaceServicios.api/
├── src/
│   ├── config/          # logger (pino) y passport (Google)
│   ├── constants/       # códigos HTTP
│   ├── controllers/     # API y vistas
│   ├── docs/            # definición base de OpenAPI
│   ├── middleware/      # auth, roles, sesión de vistas, email verificado, logs, errores
│   ├── models/          # Mongoose: Usuario, Proveedor, Servicio, Booking, Review, OneTimeToken
│   ├── routes/          # rutas /api (con bloques @openapi) y vistas
│   ├── schemas/         # Zod
│   ├── scripts/seed.ts  # datos de prueba
│   ├── services/        # auth, bookings, cuenta, tokens, correo
│   ├── app.ts           # Express y montaje de rutas
│   └── index.ts         # conexión a Mongo y arranque
├── views/               # Handlebars: layouts, partials, auth, services, bookings, errors
├── .env.example
├── package.json
└── tsconfig.json
```

## Endpoints

La lista completa, con schemas y "Try it out", está en **`/docs`**. Resumen (todo bajo `/api`):

| Recurso | Rutas |
|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/logout`, `GET /auth/me`, `GET /auth/google` |
| Cuenta | `/auth/verify-email`, `/auth/resend-verification`, `/auth/forgot-password`, `/auth/reset-password` |
| Usuarios | `/users` |
| Proveedores | `/suppliers` (perfil del proveedor) |
| Servicios | `/services` (listado público; alta y edición por su proveedor) |
| Reservas | `/bookings` (el cliente crea y cancela; el proveedor acepta, rechaza y completa) |
| Reseñas | `/reviews` (sobre una booking completada) |

Una ruta fuera de `/api` que no existe devuelve una página 404 HTML; dentro de `/api` la respuesta es JSON.

## Usuarios de prueba

`npm run seed` crea estos datos, o los actualiza si ya existen. Es idempotente, no borra nada y no envía correos.

| Correo | Contraseña | Rol | Correo verificado |
|---|---|---|---|
| `admin@seed.example.com` | `Seed1234!` | admin | Sí |
| `cliente@seed.example.com` | `Seed1234!` | cliente | Sí |
| `proveedor@seed.example.com` | `Seed1234!` | proveedor | Sí |
| `noverificado@seed.example.com` | `Seed1234!` | cliente | **No** |

Además crea:
- Un perfil de proveedor para `proveedor@seed.example.com`.
- Dos servicios suyos: **[Seed] Reparación de fugas** y **[Seed] Instalación eléctrica**.
- Una booking **pendiente** de `cliente@seed.example.com` sobre *Reparación de fugas*, para probar el correo de "aceptada".

Volver a correr el seed restablece la contraseña, el rol y la verificación de esos 4 usuarios. Con `NODE_ENV=production` se niega a correr, salvo que `SEED_ALLOW_PRODUCTION=true`.
El dominio `@seed.example.com` no existe: los correos a esas cuentas solo se ven en Ethereal o Mailtrap.

## Documentación de la API (Swagger)

| URL | Contenido |
|---|---|
| `GET /docs` | Swagger UI interactivo |
| `GET /docs/openapi.json` | La especificación OpenAPI 3 en JSON (para Postman, generadores, etc.) |

**Cómo usar "Authorize"**
1. Ejecuta `POST /auth/login` desde la misma página y copia el `token` de la respuesta.
2. Pulsa **Authorize** y pega el token, sin la palabra `Bearer`.
3. Las rutas con candado enviarán `Authorization: Bearer <token>`. El token se conserva al recargar la página (`persistAuthorization`).

**Cómo se genera**
- Se usa `swagger-jsdoc`.
- Los schemas compartidos (Usuario sin password, Proveedor, Servicio, Booking, Review, errores y respuestas comunes) y el esquema `bearerAuth` están en `src/docs/openapi.ts`. Los enums de categorías, tipos de precio y estados de booking se importan de los modelos.
- Cada endpoint se documenta con un bloque `@openapi` justo encima de su `router.<método>(...)`, en `src/routes/*.routes.ts`.

Funciona en desarrollo (`npm run dev` lee `src/routes/*.ts`) y tras `npm run build` + `npm start` (lee `dist/routes/*.js`; `tsc` conserva los comentarios).
Si un bloque `@openapi` tiene un error de YAML, la API arranca igual: el error queda en el log (`[docs] No se pudo generar la especificación OpenAPI`) y `/docs` muestra solo la parte base.

> Nota: cuando el body o los parámetros no pasan la validación Zod, el middleware `validate` responde **404** con `"Datos invalidos"` y `details`. Así está documentado porque así se comporta el código.

## Correos: verificación y recuperación de contraseña

### Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/verify-email` | — | `{ token }` → marca el correo como verificado. También acepta `GET ?token=` |
| `POST` | `/api/auth/resend-verification` | JWT | Reenvía el correo de verificación (máx. 1 por minuto → `429`) |
| `POST` | `/api/auth/forgot-password` | — | `{ correo }` → **siempre** `200` con el mismo mensaje, exista o no la cuenta |
| `POST` | `/api/auth/reset-password` | — | `{ token, password }` → cambia la contraseña (mín. 8 caracteres) |
| `GET` | `/api/auth/me` | JWT | Incluye `emailVerified` |

Los enlaces de los correos abren páginas HTML: `/verificar-email?token=…` y `/restablecer-password?token=…`.
También existe `/olvide-password` (enlazada desde el login).

Token inválido, usado o expirado → `400` con `error.code = "INVALID_TOKEN"`.

### Tokens

- 32 bytes aleatorios en hex. En la base solo se guarda su `sha256`, el propósito, la expiración y si ya se usó.
- Son de **un solo uso** y pedir uno nuevo invalida los anteriores del mismo tipo.
- Vigencia: `VERIFY_EMAIL_TTL_HOURS` (24 h por defecto) y `RESET_PASSWORD_TTL_MINUTES` (30 min por defecto).
- Nunca se escriben en los logs.

### Correos que envía la app

| Correo | Evento | Destinatario |
|---|---|---|
| Verifica tu correo | Registro con correo y contraseña (`POST /api/auth/register`, `/registro`) y `POST /api/auth/resend-verification` | El usuario que se registró |
| Restablece tu contraseña | `POST /api/auth/forgot-password` (y `/olvide-password`) con un correo que exista | El dueño de esa cuenta |
| Tu solicitud fue aceptada | `PUT /api/bookings/:id` cambia el estado de `pendiente` a `aceptada` | El cliente de la booking (`booking.usuario.correo`) |
| Servicio completado | `PUT /api/bookings/:id` cambia el estado de `aceptada` a `completada` | El cliente de la booking (`booking.usuario.correo`) |

Rechazar o cancelar una booking no envía correo. En todos los casos, si el envío falla la respuesta del API no cambia y en la consola queda un warn `[mail] Falló el envío ...`.

### Cómo ver los correos en desarrollo

**Opción 1: Ethereal (sin configurar nada).** Deja `SMTP_HOST` vacío. Al primer envío la app crea una cuenta de prueba y en la consola aparece:

```
[mail] Transporte Ethereal (pruebas). Bandeja: https://ethereal.email/login  usuario: xxxx@ethereal.email
[mail] Enviado "Verifica tu correo" a j***@example.com · vista previa: https://ethereal.email/message/...
```

Abre la URL de *vista previa* para ver el correo y hacer clic en el enlace. Los correos **no** llegan al destinatario real.
La cuenta cambia cada vez que reinicias el servidor.

**Opción 2: Mailtrap.** Crea un inbox en *Email Testing* y copia sus credenciales SMTP al `.env`:

```
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=<usuario del inbox>
SMTP_PASS=<password del inbox>
```

Los correos aparecen en ese inbox de Mailtrap.

Si el envío falla (SMTP caído, credenciales malas), la petición **responde igual** y en la consola queda un `[mail] Falló el envío ...` con nivel warn.

### Qué puede hacer un usuario sin verificar

Al registrarse con correo y contraseña la cuenta queda con `emailVerified: false`. Las cuentas creadas o vinculadas con Google, con un correo que Google confirma, quedan verificadas desde el inicio.

| Puede | No puede (403, `error.code = "EMAIL_NOT_VERIFIED"`) |
|---|---|
| Iniciar sesión, ver `/api/auth/me` | Crear reservas (`POST /api/bookings` y el botón "Solicitar servicio") |
| Ver servicios, proveedores y reseñas | Crear reseñas (`POST /api/reviews`) |
| Ver, editar y cancelar sus reservas existentes | |
| Editar su perfil, crear su perfil de proveedor y servicios | |
| Reenviar el correo de verificación y recuperar su contraseña | |

Restablecer la contraseña con el enlace del correo también marca el correo como verificado.

## Logs

Hay un único logger, con pino, en `src/config/logger.ts`. En `src/` no queda ningún `console.*`.

| Variable | Efecto |
|---|---|
| `LOG_LEVEL` | `trace`, `debug`, `info` (por defecto), `warn`, `error`, `fatal` o `silent` |
| `NODE_ENV=production` | JSON en una línea por evento, listo para un agregador de logs |
| Sin `NODE_ENV=production` | Salida legible con `pino-pretty` (dependencia de desarrollo) |

**Cada petición** genera una línea con `reqId`, `method`, `url`, `status` y `durationMs`. El nivel depende del status: `info` para 2xx y 3xx, `warn` para 4xx y `error` para 5xx.

```json
{"level":30,"module":"http","reqId":"c412b728-…","method":"GET","url":"/servicios","status":200,"durationMs":80.96,"msg":"GET /servicios 200 80.96ms"}
```

**Request id**
- Si la petición trae un `X-Request-Id` válido (hasta 128 caracteres `A-Z a-z 0-9 . _ : -`), se usa ese; si no, se genera un UUID.
- El id se devuelve en la cabecera de respuesta `X-Request-Id`, expuesta por CORS.
- Todos los logs que ocurren durante la petición llevan el mismo `reqId`, incluidos los de los services y los correos enviados en segundo plano.

**Errores**
- El `errorHandler` registra el error con su stack y el `reqId`.
- La respuesta nunca incluye el stack. Los 500 devuelven `{ "error": { "message", "requestId" } }`, para que quien reporte un error pueda dar el id.

**Datos sensibles**
- En cualquier objeto logueado se reemplazan por `[REDACTED]` las contraseñas, los tokens (`token`, `tokenHash`, `jwt`, `secret`…), `authorization`, las cookies y `body`.
- En las URLs se redactan los parámetros `token`, `code`, `state` y `password`, por ejemplo `/verificar-email?token=[REDACTED]`.
- Los correos aparecen enmascarados (`e***@dominio`).

## Checklist de pruebas

**Preparación**
1. `.env` con `MONGODB_URI` y `JWT_SECRET`, y `SMTP_HOST` vacío para usar Ethereal.
2. `npm run seed`
3. `npm run dev`

Los enlaces de los correos salen en la consola como `vista previa: https://ethereal.email/message/...`.

**Verificación de correo**
- [ ] Registrarse en `/registro` con un correo nuevo → la sesión queda iniciada y aparece el banner "verifica tu correo".
- [ ] En la consola aparece `Enviado "Verifica tu correo"` con su vista previa.
- [ ] Iniciar sesión como `noverificado@seed.example.com`:
  - [ ] En el detalle de un servicio, "Solicitar servicio" pide verificar el correo.
  - [ ] `POST /api/bookings` → `403` con `code: EMAIL_NOT_VERIFIED`.
  - [ ] `POST /api/reviews` → igual.
- [ ] "Reenviar" desde el banner (o `POST /api/auth/resend-verification`) → llega el correo. Repetir antes de 60 s → `429`.
- [ ] Abrir el enlace → "Correo verificado". `GET /api/auth/me` devuelve `emailVerified: true` y el banner desaparece.
- [ ] Abrir el mismo enlace otra vez → `INVALID_TOKEN` (un solo uso).
- [ ] Pedir dos correos seguidos, con 60 s entre ellos → el primer enlace ya no sirve.

**Restablecer contraseña**
- [ ] `/olvide-password` con `cliente@seed.example.com` → mensaje genérico y llega el correo "Restablece tu contraseña".
- [ ] Con un correo que no existe → el mismo mensaje y el mismo `200`, sin correo.
- [ ] Abrir el enlace y poner una contraseña de 8 caracteres o más → éxito. Se entra con la nueva y la vieja ya no funciona.
- [ ] Reusar el enlace → `INVALID_TOKEN`.
- [ ] Al terminar, `npm run seed` devuelve la contraseña a `Seed1234!`.

**Correo de booking**
- [ ] Iniciar sesión como `proveedor@seed.example.com`. `GET /api/bookings` muestra la booking pendiente del seed.
- [ ] `PUT /api/bookings/:id` con `{ "estado": "aceptada" }` → `200`, y en la consola aparece `Enviado "Tu solicitud fue aceptada" a c***@seed.example.com`.
- [ ] `PUT` con `{ "estado": "completada" }` → el mismo cliente recibe "Servicio completado".
- [ ] Rechazar o cancelar otra booking → `200`, sin correo.
- [ ] Con `MAIL_DISABLED=true`, o con credenciales SMTP malas → la respuesta no cambia y solo aparece un warn `[mail]`.
- [ ] Con la booking completada, el cliente puede crear su reseña con `POST /api/reviews`.

**Swagger**
- [ ] `GET /docs` carga la UI y `GET /docs/openapi.json` devuelve un JSON con `openapi: 3.x`.
- [ ] En `/docs`, `POST /auth/login` con `cliente@seed.example.com` / `Seed1234!` → copiar el `token`.
- [ ] **Authorize** → pegar el token → `GET /auth/me` responde `200`. Sin token responde `401`.
- [ ] Al recargar la página, la autorización se mantiene.
- [ ] Ningún schema ni ejemplo muestra `password`, salvo los de entrada (registro, login, reset).
- [ ] Tras `npm run build && npm start`, `/docs` muestra los mismos endpoints.

**Logs**
- [ ] Cada petición imprime método, URL, status, duración y `reqId`, y la respuesta trae la cabecera `X-Request-Id`.
- [ ] Las URLs con `?token=` aparecen como `token=[REDACTED]`.

## Autores
#### Esteban Gomez Valerio
#### Victor Hugo Magallan Salas