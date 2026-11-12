import { AsyncLocalStorage } from 'async_hooks';
import pino, { Logger, LoggerOptions } from 'pino';

/*
 * Logger único de la app (pino).
 *  - Nivel: LOG_LEVEL (trace|debug|info|warn|error|fatal|silent). Por defecto: info.
 *  - Producción (NODE_ENV=production): JSON, una línea por evento.
 *  - Desarrollo: legible con pino-pretty (si no está instalado, cae a JSON).
 *  - Redacta contraseñas, tokens, Authorization y cookies en cualquier objeto logueado.
 *  - Todo log hecho durante una petición lleva su reqId (vía AsyncLocalStorage),
 *    también los de services y los envíos de correo en segundo plano.
 */

const isProduction = process.env.NODE_ENV === 'production';

const LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'];
const envLevel = process.env.LOG_LEVEL?.trim().toLowerCase();
const level = envLevel && LEVELS.includes(envLevel) ? envLevel : 'info';

/* ---------- Contexto por petición ---------- */

interface RequestContext {
    reqId: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

/* ---------- Redacción ---------- */

const SENSITIVE_KEYS = [
    'password', 'newPassword', 'confirmar', 'pass',
    'token', 'tokenHash', 'accessToken', 'refreshToken', 'jwt', 'secret', 'clientSecret',
    'authorization', 'cookie', 'cookies', 'set-cookie',
    // Los errores de express.json() traen el cuerpo crudo (podría tener una contraseña)
    'body'
];

// Clave sensible en la raíz y hasta 3 niveles de profundidad (req.headers.authorization, err.config.auth.pass…)
const redactPaths = SENSITIVE_KEYS.flatMap((k) => {
    const key = /^[A-Za-z_$][\w$]*$/.test(k) ? k : `["${k}"]`;
    const join = (prefix: string) => (key.startsWith('[') ? `${prefix}${key}` : `${prefix}.${key}`);
    return [key, join('*'), join('*.*'), join('*.*.*')];
});

/* ---------- Construcción ---------- */

const canPrettyPrint = () => {
    if (isProduction) return false;
    try {
        require.resolve('pino-pretty');
        return true;
    } catch {
        return false;
    }
};

const options: LoggerOptions = {
    level,
    base: isProduction ? { pid: process.pid } : null,
    redact: { paths: redactPaths, censor: '[REDACTED]' },
    serializers: { err: pino.stdSerializers.err },
    mixin: () => {
        const ctx = requestContext.getStore();
        return ctx ? { reqId: ctx.reqId } : {};
    },
    ...(canPrettyPrint()
        ? {
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:HH:MM:ss.l',
                    ignore: 'pid,hostname,module', // module ya sale como prefijo [module]
                    messageFormat: '{if module}[{module}] {end}{msg}',
                    hideObject: false
                }
            }
        }
        : { timestamp: pino.stdTimeFunctions.isoTime })
};

export const logger: Logger = pino(options);

// Logger con etiqueta de módulo: logger.child({ module: 'mail' })
export const moduleLogger = (module: string) => logger.child({ module });

/* ---------- Utilidad: URL sin secretos en la query ---------- */

const SENSITIVE_QUERY = new Set(['token', 'code', 'state', 'password', 'access_token', 'id_token']);

// /verificar-email?token=abc → /verificar-email?token=[REDACTED]
export const sanitizeUrl = (url: string) => {
    const q = url.indexOf('?');
    if (q === -1) return url;
    try {
        const params = new URLSearchParams(url.slice(q + 1));
        let changed = false;
        for (const key of [...params.keys()]) {
            if (SENSITIVE_QUERY.has(key.toLowerCase())) {
                params.set(key, '[REDACTED]');
                changed = true;
            }
        }
        return changed ? `${url.slice(0, q)}?${params.toString().replace(/%5BREDACTED%5D/g, '[REDACTED]')}` : url;
    } catch {
        return url.slice(0, q); // query ilegible: mejor no loguearla
    }
};
