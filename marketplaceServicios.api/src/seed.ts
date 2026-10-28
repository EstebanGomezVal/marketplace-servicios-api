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

        const proveedorUser3 = await Usuario.create({
      nombre: 'Jorge',
      apellido: 'Salazar',
      correo: 'jorge@proveedor.com',
      password: passwordHash,
      telefono: '3312345678',
      ciudad: 'Guadalajara',
      rol: 'proveedor',
    });

    const proveedorUser4 = await Usuario.create({
      nombre: 'Patricia',
      apellido: 'Ruiz',
      correo: 'patricia@proveedor.com',
      password: passwordHash,
      telefono: '3323456789',
      ciudad: 'Zapopan',
      rol: 'proveedor',
    });

    const proveedorUser5 = await Usuario.create({
      nombre: 'Daniel',
      apellido: 'Torres',
      correo: 'daniel@proveedor.com',
      password: passwordHash,
      telefono: '3334567890',
      ciudad: 'Tonalá',
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

        const proveedor3 = await Proveedor.create({
      usuario: proveedorUser3._id,
      descripcion: 'Carpintero especializado en closets, cocinas integrales y muebles a medida.',
      experienciaAnios: 15,
      zonaCobertura: ['Guadalajara', 'Tlaquepaque'],
      disponible: true,
    });

    const proveedor4 = await Proveedor.create({
      usuario: proveedorUser4._id,
      descripcion: 'Servicio de limpieza profunda para casas y departamentos.',
      experienciaAnios: 6,
      zonaCobertura: ['Zapopan', 'Guadalajara'],
      disponible: true,
    });

    const proveedor5 = await Proveedor.create({
      usuario: proveedorUser5._id,
      descripcion: 'Jardinero con experiencia en mantenimiento y poda de áreas verdes.',
      experienciaAnios: 9,
      zonaCobertura: ['Tonalá', 'Tlaquepaque', 'Guadalajara'],
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

            {
        proveedor: proveedor3._id,
        titulo: 'Fabricación de closets',
        descripcion: 'Diseño y fabricación de closets a la medida.',
        categoria: 'Carpintería',
        precio: 1500,
        tipoPrecio: 'cotización',
      },
      {
        proveedor: proveedor4._id,
        titulo: 'Limpieza profunda de casa',
        descripcion: 'Limpieza completa de cocina, baños, pisos y ventanas.',
        categoria: 'Limpieza',
        precio: 700,
        tipoPrecio: 'fijo',
      },
      {
        proveedor: proveedor5._id,
        titulo: 'Mantenimiento de jardín',
        descripcion: 'Poda, riego y limpieza de jardines residenciales.',
        categoria: 'Jardinería',
        precio: 400,
        tipoPrecio: 'por hora',
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

            {
        usuario: cliente3._id,
        servicio: servicios[2]!._id,
        descripcion: 'Instalación de lámparas y contactos en dos recámaras.',
        direccion: 'Av. México 789, Guadalajara',
        fechaProgramada: new Date('2026-10-20T12:00:00'),
        estado: 'completada',
      },
      {
        usuario: cliente2._id,
        servicio: servicios[6]!._id,
        descripcion: 'Closet para la recámara principal.',
        direccion: 'Calle Juárez 456, Tlaquepaque',
        fechaProgramada: new Date('2026-10-18T10:00:00'),
        estado: 'completada',
      },
      {
        usuario: cliente3._id,
        servicio: servicios[7]!._id,
        descripcion: 'Limpieza profunda antes de una mudanza.',
        direccion: 'Av. México 789, Guadalajara',
        fechaProgramada: new Date('2026-10-22T09:00:00'),
        estado: 'completada',
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
            {
        booking: bookings[5]!._id,
        usuario: cliente3._id,
        proveedor: proveedor2._id,
        calificacion: 5,
        comentario: 'Muy profesional, dejó todo funcionando y limpio.',
      },
      {
        booking: bookings[6]!._id,
        usuario: cliente2._id,
        proveedor: proveedor3._id,
        calificacion: 4,
        comentario: 'El closet quedó muy bien, solo tardó un día más.',
      },
      {
        booking: bookings[7]!._id,
        usuario: cliente3._id,
        proveedor: proveedor4._id,
        calificacion: 5,
        comentario: 'Dejaron la casa impecable.',
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