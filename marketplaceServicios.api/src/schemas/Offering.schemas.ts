import { z } from "zod";
import { objectIdSchema } from "./common.schema";

export const CATEGORIAS_VALIDAS = [
  "Plomería",
  "Electricidad",
  "Carpintería",
  "Limpieza",
  "Jardinería",
  "Construcción",
  "Tecnología",
  "Otro",
] as const;

export const TIPOS_PRECIO_VALIDOS = ["fijo", "por hora", "cotización"] as const;

export const createOfferingSchema = z.object({
  proveedor: objectIdSchema,
  titulo: z.string().min(1, "El título es obligatorio"),
  descripcion: z.string().min(1, "La descripción es obligatoria"),
  categoria: z.enum(CATEGORIAS_VALIDAS, {
    message: "Categoría no válida",
  }),
  precio: z.number().positive("El precio debe ser mayor a 0"),
  tipoPrecio: z.enum(TIPOS_PRECIO_VALIDOS, {
    message: "Tipo de precio no válido",
  }),
  activo: z.boolean().optional(),
});

export const updateOfferingSchema = createOfferingSchema.partial();