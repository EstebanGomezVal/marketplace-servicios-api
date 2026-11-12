import { config } from 'dotenv';
config({ quiet: true });

import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { logger } from '../config/logger';
import usuarioModel from '../models/Usuario.model';
import proveedorModel from '../models/Proveedor.model';
import servicioModel from '../models/offering.model';
import bookingModel from '../models/Booking.model';

/*
 * Datos de prueba para desarrollo / revisión.
 *   npm run seed            (dev, con tsx)
 *   npm run seed:dist       (tras npm run build)
 *
 * - Idempotente: actualiza por correo; correrlo dos veces no duplica nada.
 * - NO borra datos existentes (la base puede ser compartida).
 * - No envía correos (crea los usuarios directamente, no vía /register).
 * - Se niega a correr con NODE_ENV=production salvo SEED_ALLOW_PRODUCTION=true.
 *
 * Las credenciales están en el README ("Usuarios de prueba"). Mantener ambos en sincronía.
 */

const log = logger.child({ module: 'seed' });

export const SEED_PASSWORD = 'Seed1234!';

type SeedUser = {
    key: 'admin' | 'cliente' | 'proveedor' | 'sinVerificar';
    nombre: string;
    apellido: string;
    correo: string;
    rol: 'cliente' | 'proveedor' | 'admin';
    emailVerified: boolean;
    telefono?: string;
    ciudad?: string;
};

const USERS: SeedUser[] = [
    { key: 'admin', nombre: 'Ada', apellido: 'Admin', correo: 'admin@seed.example.com', rol: 'admin', emailVerified: true, ciudad: 'Guadalajara' },
    { key: 'cliente', nombre: 'Carla', apellido: 'Cliente', correo: 'cliente@seed.example.com', rol: 'cliente', emailVerified: true, telefono: '3311111111', ciudad: 'Guadalajara' },
    { key: 'proveedor', nombre: 'Pedro', apellido: 'Proveedor', correo: 'proveedor@seed.example.com', rol: 'proveedor', emailVerified: true, telefono: '3322222222', ciudad: 'Zapopan' },
    { key: 'sinVerificar', nombre: 'Nico', apellido: 'Noverificado', correo: 'noverificado@seed.example.com', rol: 'cliente', emailVerified: false, ciudad: 'Tlaquepaque' }
];

const SERVICES = [
    { titulo: '[Seed] Reparación de fugas', descripcion: 'Detección y reparación de fugas en tubería y llaves.', categoria: 'Plomería', precio: 450, tipoPrecio: 'fijo' },
    { titulo: '[Seed] Instalación eléctrica', descripcion: 'Contactos, apagadores y revisión de tableros.', categoria: 'Electricidad', precio: 300, tipoPrecio: 'por hora' }
] as const;

const run = async () => {
    if (process.env.NODE_ENV === 'production' && process.env.SEED_ALLOW_PRODUCTION !== 'true') {
        throw new Error('Seed bloqueado con NODE_ENV=production (usa SEED_ALLOW_PRODUCTION=true si de verdad quieres)');
    }
    if (!process.env.MONGODB_URI) throw new Error('Falta MONGODB_URI');

    await mongoose.connect(process.env.MONGODB_URI);
    log.info('Conectado a MongoDB');

    const password = await bcrypt.hash(SEED_PASSWORD, 10);
    const ids = new Map<SeedUser['key'], mongoose.Types.ObjectId>();
    const id = (key: SeedUser['key']) => {
        const value = ids.get(key);
        if (!value) throw new Error(`Usuario de seed no creado: ${key}`);
        return value;
    };

    // 1) Usuarios (upsert por correo; se resetean contraseña, rol y verificación)
    for (const u of USERS) {
        const { key, ...data } = u;
        const doc = await usuarioModel.findOneAndUpdate(
            { correo: u.correo },
            { $set: { ...data, password, isDeleted: false } },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
        ids.set(key, doc._id);
        log.info({ correo: u.correo, rol: u.rol, emailVerified: u.emailVerified }, `Usuario listo: ${u.correo}`);
    }

    // 2) Perfil de proveedor
    const perfil = await proveedorModel.findOneAndUpdate(
        { usuario: id('proveedor') },
        {
            $set: {
                descripcion: 'Plomero y electricista con 8 años de experiencia (datos de seed).',
                experienciaAnios: 8,
                zonaCobertura: ['Guadalajara', 'Zapopan'],
                disponible: true,
                isDeleted: false
            }
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    if (!perfil) throw new Error('No se pudo crear el perfil de proveedor');
    log.info({ proveedor: String(perfil._id) }, 'Perfil de proveedor listo');

    // 3) Servicios del proveedor (upsert por proveedor + título)
    const servicios = [];
    for (const s of SERVICES) {
        const doc = await servicioModel.findOneAndUpdate(
            { proveedor: perfil._id, titulo: s.titulo },
            { $set: { ...s, activo: true, isDeleted: false } },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
        if (!doc) throw new Error(`No se pudo crear el servicio ${s.titulo}`);
        servicios.push(doc);
        log.info({ servicio: String(doc._id), titulo: s.titulo }, 'Servicio listo');
    }

    // 4) Una booking pendiente del cliente verificado (para probar aceptar → correo)
    const primero = servicios[0]!;
    const pendiente = await bookingModel.findOne({
        usuario: id('cliente'), servicio: primero._id, estado: 'pendiente', isDeleted: { $ne: true }
    });
    const booking = pendiente ?? await bookingModel.create({
        usuario: id('cliente'),
        servicio: primero._id,
        descripcion: 'Fuga debajo del fregadero (seed)',
        direccion: 'Av. Siempre Viva 742, Guadalajara',
        fechaProgramada: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        estado: 'pendiente'
    });
    log.info({ booking: String(booking._id), reutilizada: !!pendiente }, 'Booking pendiente lista');

    log.info({
        credenciales: 'README → Usuarios de prueba',
        servicio: String(primero._id),
        bookingPendiente: String(booking._id)
    }, 'Seed completado');
};

run()
    .catch((err) => {
        log.error({ err }, 'Seed falló');
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect().catch(() => undefined);
        logger.flush();
    });
