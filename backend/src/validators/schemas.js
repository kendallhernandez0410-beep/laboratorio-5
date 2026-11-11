import { z } from "zod";

export const noteIdSchema = z.string().uuid("El identificador debe ser un UUID válido.");

export const createNoteSchema = z.object({
  titulo: z
    .string({ required_error: "El título es obligatorio." })
    .trim()
    .min(2, "El título debe tener al menos 2 caracteres.")
    .max(120, "El título no puede superar los 120 caracteres."),
  contenido: z
    .string({ required_error: "El contenido es obligatorio." })
    .trim()
    .min(1, "El contenido es obligatorio.")
    .max(10000, "El contenido no puede superar los 10000 caracteres.")
}).strict();

export const questionSchema = z.object({
  pregunta: z
    .string({ required_error: "La pregunta es obligatoria." })
    .trim()
    .min(2, "La pregunta debe tener al menos 2 caracteres.")
    .max(2000, "La pregunta no puede superar los 2000 caracteres.")
}).strict();

export const noteEditInstructionsSchema = z.object({
  instrucciones: z
    .string({ required_error: "Las instrucciones de edición son obligatorias." })
    .trim()
    .min(3, "Describe el cambio con al menos 3 caracteres.")
    .max(2000, "Las instrucciones no pueden superar los 2000 caracteres.")
}).strict();
