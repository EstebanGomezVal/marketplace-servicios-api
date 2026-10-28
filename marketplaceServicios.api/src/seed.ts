import { config } from 'dotenv';
config();

import { connect, disconnect } from 'mongoose';
import bcrypt from 'bcrypt';

import Usuario from './models/Usuario.model';      
import Proveedor from './models/Proveedor.model';
import Servicio from './models/offering.model'; 
import Booking from './models/booking.model';
import Review from './models/review.model';

const MONGODB_URI = process.env.MONGODB_URI || '';

async function seed() {
  try {
    await connect(MONGODB_URI);
    console.log('Conectado a MongoDB para seed...');

    // Limpiar colecciones
    await Promise.all([
      Usuario.deleteMany({}),
      Proveedor.deleteMany({}),
      Servicio.deleteMany({}),
      Booking.deleteMany({}),
      Review.deleteMany({}),
    ]);
    console.log('Colecciones limpiadas');

    // Crear usuarios
    const passwordHash = await bcrypt.hash('Password123', 10);

    const admin = await Usuario.create({
      nombre: 'Admin',
      apellido: 'Sistema',
      correo: 'admin@manosalaobra.mx',
      password: passwordHash,
      telefono: '3310675362',
      ciudad: 'Guadalajara',
      rol: 'admin',
    });

    const cliente1 = await Usuario.create({
      nombre: 'Laura',
      apellido: 'Martínez',
      correo: 'laura@cliente.com',
      password: passwordHash,
      telefono: '3327189203',
      ciudad: 'Zapopan',
      rol: 'cliente',
    });

    const cliente2 = await Usuario.create({
      nombre: 'Carlos',
      apellido: 'Ramírez',
      correo: 'carlos@cliente.com',
      password: passwordHash,
      telefono: '3310816383',
      ciudad: 'Tlaquepaque',
      rol: 'cliente',
    });

    const cliente3 = await Usuario.create({
      nombre: 'Ana',
      apellido: 'Gómez',
      correo: 'ana@cliente.com',
      password: passwordHash,
      telefono: '3391927338',
      ciudad: 'Guadalajara',
      rol: 'cliente',
    });

    const proveedorUser1 = await Usuario.create({
      nombre: 'Miguel',
      apellido: 'Hernández',
      correo: 'miguel@proveedor.com',
      password: passwordHash,
      telefono: '3318298337',
      ciudad: 'Guadalajara',
      rol: 'proveedor',
    });

    const proveedorUser2 = await Usuario.create({
      nombre: 'Sofía',
      apellido: 'López',
      correo: 'sofia@proveedor.com',
      password: passwordHash,
      telefono: '3310297438',
      ciudad: 'Zapopan',
      rol: 'proveedor',
    });

    console.log('Usuarios creados');

    // Crear perfiles de proveedor
    const proveedor1 = await Proveedor.create({
      usuario: proveedorUser1._id,
      descripcion: 'Plomero con más de 10 años de experiencia en instalaciones y reparaciones.',
      experienciaAnios: 12,
      zonaCobertura: ['Guadalajara', 'Zapopan', 'Tlaquepaque'],
      disponible: true,
    });

    const proveedor2 = await Proveedor.create({
      usuario: proveedorUser2._id,
      descripcion: 'Electricista certificada. Especialista en instalaciones residenciales y fallas eléctricas.',
      experienciaAnios: 8,
      zonaCobertura: ['Zapopan', 'Tlajomulco'],
      disponible: true,
    });

    console.log('Proveedores creados');

    // Crear servicios
    const servicios = await Servicio.insertMany([
      {
        proveedor: proveedor1._id,
        titulo: 'Reparación de fugas',
        descripcion: 'Detección y reparación de fugas de agua en baños y cocinas.',
        categoria: 'Plomería',
        precio: 450,
        tipoPrecio: 'fijo',
      },
      {
        proveedor: proveedor1._id,
        titulo: 'Instalación de calentador',
        descripcion: 'Instalación de calentadores de paso y de depósito.',
        categoria: 'Plomería',
        precio: 800,
        tipoPrecio: 'fijo',
      },
      {
        proveedor: proveedor2._id,
        titulo: 'Instalación eléctrica completa',
        descripcion: 'Cableado e instalación eléctrica para casa o departamento.',
        categoria: 'Electricidad',
        precio: 350,
        tipoPrecio: 'por hora',
      },
      {
        proveedor: proveedor2._id,
        titulo: 'Reparación de contactos y apagadores',
        descripcion: 'Cambio y reparación de contactos, apagadores e interruptores.',
        categoria: 'Electricidad',
        precio: 300,
        tipoPrecio: 'fijo',
      },
      {
        proveedor: proveedor1._id,
        titulo: 'Destape de drenaje',
        descripcion: 'Destape de lavabos, regaderas y coladeras.',
        categoria: 'Plomería',
        precio: 500,
        tipoPrecio: 'fijo',
      },
      {
        proveedor: proveedor2._id,
        titulo: 'Revisión de tablero eléctrico',
        descripcion: 'Diagnóstico y reparación de fallas en el centro de carga.',
        categoria: 'Electricidad',
        precio: 600,
        tipoPrecio: 'cotización',
      },
    ]);

    console.log('Servicios creados');

    // Crear bookings
    const bookings = await Booking.insertMany([
      {
        usuario: cliente1._id,
        servicio: servicios[0]!._id,
        descripcion: 'Tengo una fuga debajo del lavabo de la cocina.',
        direccion: 'Av. Patria 1234, Zapopan',
        fechaProgramada: new Date('2026-11-05T10:00:00'),
        estado: 'completada',
      },
      {
        usuario: cliente2._id,
        servicio: servicios[2]!._id,
        descripcion: 'Necesito instalar contactos nuevos en la sala.',
        direccion: 'Calle Juárez 456, Tlaquepaque',
        fechaProgramada: new Date('2026-11-08T16:00:00'),
        estado: 'aceptada',
      },
      {
        usuario: cliente3._id,
        servicio: servicios[1]!._id,
        descripcion: 'Quiero cambiar el calentador de la casa.',
        direccion: 'Av. México 789, Guadalajara',
        fechaProgramada: new Date('2026-11-12T09:00:00'),
        estado: 'pendiente',
      },
      {
        usuario: cliente1._id,
        servicio: servicios[4]!._id,
        descripcion: 'El drenaje de la regadera está tapado.',
        direccion: 'Av. Patria 1234, Zapopan',
        fechaProgramada: new Date('2026-11-03T11:00:00'),
        estado: 'completada',
      },
      {
        usuario: cliente2._id,
        servicio: servicios[3]!._id,
        descripcion: 'Varios apagadores no funcionan en la casa.',
        direccion: 'Calle Juárez 456, Tlaquepaque',
        fechaProgramada: new Date('2026-11-15T15:00:00'),
        estado: 'pendiente',
      },
    ]);

    console.log('Bookings creados');

    // Crear reviews
    await Review.insertMany([
      {
        booking: bookings[0]!._id,
        usuario: cliente1._id,
        proveedor: proveedor1._id,
        calificacion: 5,
        comentario: 'Excelente trabajo, llegó puntual y resolvió la fuga rápido.',
      },
      {
        booking: bookings[3]!._id,
        usuario: cliente1._id,
        proveedor: proveedor1._id,
        calificacion: 4,
        comentario: 'Buen servicio, aunque tardó un poco más de lo esperado.',
      },
    ]);

    console.log('Reviews creadas');
    console.log('Seed completado');
  } catch (error) {
    console.error('Error en el seed:', error);
    process.exitCode = 1;
  } finally {
    await disconnect();
  }
}

seed();