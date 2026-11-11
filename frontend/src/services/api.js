const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers
      }
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Verifica que el backend esté iniciado.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const validation = data.detalles?.map((detail) => detail.mensaje).join(" ");
    throw new Error(validation || data.error || "La solicitud no pudo completarse.");
  }
  return data;
}

export const api = {
  getAiStatus: () => request("/ia/estado"),
  listNotes: () => request("/notas"),
  exportNotes: () => request("/notas/exportar"),
  getNote: (id) => request(`/notas/${id}`),
  createNote: (note) => request("/notas", { method: "POST", body: JSON.stringify(note) }),
  updateNote: (id, note) => request(`/notas/${id}`, { method: "PUT", body: JSON.stringify(note) }),
  deleteNote: (id) => request(`/notas/${id}`, { method: "DELETE" }),
  askAi: (pregunta) => request("/ia/preguntar", { method: "POST", body: JSON.stringify({ pregunta }) }),
  proposeNoteEdit: (id, instrucciones) => request(`/ia/notas/${id}/editar`, {
    method: "POST",
    body: JSON.stringify({ instrucciones })
  }),
  summarizeNote: (id) => request(`/notas/${id}/resumen`, { method: "POST" })
};
