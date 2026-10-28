import { z } from "zod";
import { objectIdSchema } from "./common.schema";

export const ESTADOS_BOOKING = [
  "pendiente",
  "aceptada",
  "rechazada",
  "completada",
  "cancelada",
] as const;

export const createBookingSchema = z.object({
  usuario: objectIdSchema,
  servicio: objectIdSchema,
  descripcion: z.string().min(1, "La descripción es obligatoria"),
  direccion: z.string().min(1, "La dirección es obligatoria"),
  fechaProgramada: z.coerce
    .date({
      message: "La fecha programada debe ser una fecha válida",
    })
    .refine((date) => !isNaN(date.getTime()), {
      message: "La fecha programada es obligatoria o no es válida",
    }),
  estado: z.enum(ESTADOS_BOOKING).optional(),
});

export const updateBookingSchema = createBookingSchema.partial();