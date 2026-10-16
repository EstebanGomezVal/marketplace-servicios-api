import { config } from 'dotenv';
config();

import { connect } from 'mongoose';

import app from './app';

const port = Number(process.env.PORT) || 3000;
const uri = process.env.MONGODB_URI || '';

connect(uri).then(() => {
    console.log('Conectado a MongoDB');

    const server = app.listen(port, () => {
        console.log(`App is running on http://localhost:${port}/`);
    });

    server.on('error', (e) => {
        console.log(e);
    });
}).catch(e => {
    console.log('Error al conectarse en la base de datos:', e);
});