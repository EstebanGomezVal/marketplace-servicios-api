import { z } from "zod";
import { objectIdSchema } from "./common.schema";

export const createReviewSchema = z.object({
  booking: objectIdSchema,
  usuario: objectIdSchema,
  proveedor: objectIdSchema,
  calificacion: z
    .number()
    .int("La calificación debe ser un número entero")
    .min(1, "La calificación mínima es 1")
    .max(5, "La calificación máxima es 5"),
  comentario: z.string().optional(),
});

export const updateReviewSchema = createReviewSchema.partial();