import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { logger, requestContext, sanitizeUrl } from '../config/logger';

const REQUEST_ID_HEADER = 'X-Request-Id';
// Se acepta el id del cliente/proxy solo si es "razonable" (evita inyectar basura en los logs)
const VALID_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

const httpLog = logger.child({ module: 'http' });

/*
 * - Toma X-Request-Id entrante (o genera un UUID) y lo devuelve en la respuesta.
 * - Al terminar: method, url (sin secretos en la query), status, durationMs, reqId.
 * - Nivel según status: 5xx error, 4xx warn, resto info.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const incoming = req.get(REQUEST_ID_HEADER);
    const reqId = incoming && VALID_REQUEST_ID.test(incoming) ? incoming : randomUUID();

    req.id = reqId;
    res.setHeader(REQUEST_ID_HEADER, reqId);

    const start = process.hrtime.bigint();
    let logged = false;

    const done = (aborted: boolean) => {
        if (logged) return;
        logged = true;

        const durationMs = Math.round(Number(process.hrtime.bigint() - start) / 1e4) / 100;
        const status = aborted && !res.writableFinished ? 499 : res.statusCode; // 499: cliente cortó
        const entry = {
            reqId,
            method: req.method,
            url: sanitizeUrl(req.originalUrl),
            status,
            durationMs
        };
        const msg = `${entry.method} ${entry.url} ${status} ${durationMs}ms`;

        if (status >= 500) httpLog.error(entry, msg);
        else if (status >= 400) httpLog.warn(entry, msg);
        else httpLog.info(entry, msg);
    };

    res.on('finish', () => done(false));
    res.on('close', () => done(true));

    // Todo lo que corra dentro de esta petición (también async) ve el reqId en sus logs
    requestContext.run({ reqId }, () => next());
};
