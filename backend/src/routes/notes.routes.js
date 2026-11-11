import { Router } from "express";
import { createNoteSchema, noteIdSchema } from "../validators/schemas.js";

export function createNotesRouter({ notesService, aiService }) {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json({ notas: notesService.list() });
  });

  router.get("/:id", (req, res) => {
    const id = noteIdSchema.parse(req.params.id);
    const nota = notesService.get(id);
    if (!nota) {
      return res.status(404).json({ error: "Nota no encontrada.", codigo: "NOTE_NOT_FOUND" });
    }
    return res.json({ nota });
  });

  router.post("/", (req, res) => {
    const input = createNoteSchema.parse(req.body);
    const nota = notesService.create(input);
    return res.status(201).json({ nota });
  });

  router.put("/:id", (req, res) => {
    const id = noteIdSchema.parse(req.params.id);
    const input = createNoteSchema.parse(req.body);
    const nota = notesService.update(id, input);
    if (!nota) {
      return res.status(404).json({ error: "Nota no encontrada.", codigo: "NOTE_NOT_FOUND" });
    }
    return res.json({ nota });
  });

  router.delete("/:id", (req, res) => {
    const id = noteIdSchema.parse(req.params.id);
    const nota = notesService.delete(id);
    if (!nota) {
      return res.status(404).json({ error: "Nota no encontrada.", codigo: "NOTE_NOT_FOUND" });
    }
    return res.json({ mensaje: "Nota eliminada correctamente.", nota });
  });

  router.post("/:id/resumen", async (req, res, next) => {
    try {
      const id = noteIdSchema.parse(req.params.id);
      const nota = notesService.get(id);
      if (!nota) {
        return res.status(404).json({ error: "Nota no encontrada.", codigo: "NOTE_NOT_FOUND" });
      }
      const resultado = await aiService.resumir(nota.contenido);
      return res.json({ notaId: nota.id, resumen: resultado.respuesta, uso: resultado.uso });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
