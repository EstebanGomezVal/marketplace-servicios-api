import { config } from 'dotenv';
config({ quiet: true });

import { connect } from 'mongoose';

import { logger } from './config/logger';
import app from './app';
import { setupPassport } from './config/passport';

const log = logger.child({ module: 'server' });

process.on('unhandledRejection', (reason) => {
    log.error({ err: reason }, 'Promesa rechazada sin manejar');
});

process.on('uncaughtException', (err) => {
    log.fatal({ err }, 'Excepción no capturada; se detiene el proceso');
    logger.flush(() => process.exit(1));
});

if (!process.env.JWT_SECRET) {
    log.fatal('La variable de entorno JWT_SECRET no está definida');
    logger.flush(() => process.exit(1));
} else {
    // Después de config(): lee GOOGLE_* del entorno. Sin ellas solo avisa, no detiene el arranque.
    setupPassport();

    const port = Number(process.env.PORT) || 3000;
    const uri = process.env.MONGODB_URI || '';

    connect(uri).then(() => {
        log.info('Conectado a MongoDB');

        const server = app.listen(port, () => {
            log.info({ port, logLevel: logger.level }, `App is running on http://localhost:${port}/`);
        });

        server.on('error', (err) => {
            log.error({ err }, 'Error del servidor HTTP');
        });
    }).catch((err) => {
        log.fatal({ err }, 'Error al conectarse en la base de datos');
    });
}
