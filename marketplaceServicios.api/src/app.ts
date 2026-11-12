import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { engine } from 'express-handlebars';
import routes from './routes';
import viewRoutes from './routes/views.routes';
import { notFound, errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import { moduleLogger } from './config/logger';
import swaggerUi from 'swagger-ui-express';
import { openapiSpec } from './docs/openapi';

const viewErrorLog = moduleLogger('error');

const app = express();

const viewsDir = path.join(__dirname, '..', 'views');

app.engine('handlebars', engine({
    defaultLayout: 'main',
    partialsDir: path.join(viewsDir, 'partials'),
    helpers: {
        eq: (a: unknown, b: unknown) => a === b,
        fecha: (d: unknown) => {
            if (!d) return '';
            const date = new Date(d as string);
            return Number.isNaN(date.getTime())
                ? ''
                : date.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
        }
    }
}));
app.set('view engine', 'handlebars');
app.set('views', viewsDir);

// Primero: request id + log de cada petición (mide también los middlewares siguientes)
app.use(requestLogger);

app.use(cors({ exposedHeaders: ['X-Request-Id'] }));
app.use(express.json());
app.use(cookieParser());

// Documentación OpenAPI (antes de las vistas: si no, el 404 HTML se la come)
app.get('/docs/openapi.json', (_req: Request, res: Response) => {
    res.json(openapiSpec);
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, {
    customSiteTitle: 'Marketplace Servicios · API',
    swaggerOptions: { persistAuthorization: true }
}));

// API primero: así el middleware de sesión de las vistas no corre en /api/*
app.use('/api', routes);
app.use('/', viewRoutes);

// /api (y subrutas) siguen respondiendo JSON; todo lo demás es HTML
const isApiRequest = (req: Request) => /^\/api(\/|\?|$)/.test(req.originalUrl);

app.use((req: Request, res: Response, next: NextFunction) => {
    if (isApiRequest(req)) return next();
    res.status(404).render('errors/404', { title: 'Página no encontrada' });
});

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (isApiRequest(req) || res.headersSent) return next(err);
    viewErrorLog.error({ err, reqId: req.id, method: req.method }, `Error no controlado en vista: ${(err as Error)?.message ?? err}`);
    res.status(500).render('errors/500', { title: 'Error' });
});

app.use(notFound);
app.use(errorHandler);

export default app;
