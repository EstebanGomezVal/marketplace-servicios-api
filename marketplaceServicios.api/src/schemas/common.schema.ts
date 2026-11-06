import { z } from 'zod';

// Valida que el parámetro
export const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, {
    message: 'El ID proporcionado no es un ObjectId de Mongo válido'
  })
});

export type IdParamInput = z.infer<typeof idParamSchema>;