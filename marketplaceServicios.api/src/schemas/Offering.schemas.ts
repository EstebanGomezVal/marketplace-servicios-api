import { z } from 'zod';
import { CATEGORIAS_VALIDAS, TIPOS_PRECIO_VALIDOS } from '../models/offering.model'

export const serviceSchemaZod = z.object({
    proveedor: z.string({ message: 'El proveedor es obligatorio' })
        .min(1, { message: 'El proveedor no puede estar vacIo' })
        .regex(/^[0-9a-fA-F]{24}$/, { message: 'El ID del proveedor no tiene un formato valido' }),

    titulo: z.string({ message: 'El titulo es obligatorio' })
        .min(1, { message: 'El titulo no puede estar vacio' }),

    descripcion: z.string({ message: 'La descripcion es obligatoria' })
        .min(1, { message: 'La descripcion no puede estar vacia' }),

    categoria: z.enum(CATEGORIAS_VALIDAS, {message: 'Categoria no valida' }),

    precio: z.coerce.number({ message: 'El precio debe ser un numero valido' })
        .min(0, { message: 'El precio no puede ser negativo' }),

    tipoPrecio: z.enum(TIPOS_PRECIO_VALIDOS, { 
        message: 'El tipo de precio debe ser fijo, por hora o cotizacion' }),

    activo: z.boolean().default(true)
})