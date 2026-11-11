import { Router } from "express";
import {
  noteEditInstructionsSchema,
  noteIdSchema,
  questionSchema
} from "../validators/schemas.js";
import { selectRelevantNotes } from "../services/noteContext.service.js";

export function createAiRouter({ aiService, notesService }) {
  const router = Router();

  router.post("/preguntar", async (req, res, next) => {
    try {
      const { pregunta } = questionSchema.parse(req.body);
      const notas = selectRelevantNotes(notesService.list(), pregunta);
      const resultado = await aiService.preguntar(pregunta, notas);
      return res.json({ respuesta: resultado.respuesta, uso: resultado.uso });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/notas/:id/editar", async (req, res, next) => {
    try {
      const id = noteIdSchema.parse(req.params.id);
      const { instrucciones } = noteEditInstructionsSchema.parse(req.body);
      const nota = notesService.get(id);
      if (!nota) {
        return res.status(404).json({ error: "Nota no encontrada.", codigo: "NOTE_NOT_FOUND" });
      }
      const resultado = await aiService.proponerEdicion(nota, instrucciones);
      return res.json({
        notaId: nota.id,
        original: { titulo: nota.titulo, contenido: nota.contenido },
        propuesta: resultado.propuesta,
        uso: resultado.uso
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
