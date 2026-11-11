import { randomUUID } from "node:crypto";

export function createNotesService({ initialNotes = [] } = {}) {
  const notes = new Map();

  function create({ titulo, contenido }) {
    const note = {
      id: randomUUID(),
      titulo,
      contenido,
      creadaEn: new Date().toISOString()
    };
    notes.set(note.id, note);
    return note;
  }

  for (const note of initialNotes) {
    create(note);
  }

  return {
    list() {
      return [...notes.values()].sort((a, b) => b.creadaEn.localeCompare(a.creadaEn));
    },
    get(id) {
      return notes.get(id) ?? null;
    },
    create,
    update(id, { titulo, contenido }) {
      const existing = notes.get(id);
      if (!existing) return null;
      const updated = {
        ...existing,
        titulo,
        contenido,
        actualizadaEn: new Date().toISOString()
      };
      notes.set(id, updated);
      return updated;
    },
    delete(id) {
      const note = notes.get(id);
      if (!note) return null;
      notes.delete(id);
      return note;
    }
  };
}
