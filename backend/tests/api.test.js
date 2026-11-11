import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { exampleNotes } from "../src/config/exampleNotes.js";
import { createDeepSeekService } from "../src/services/deepseek.service.js";
import { createNotesService } from "../src/services/notes.service.js";
import { selectRelevantNotes } from "../src/services/noteContext.service.js";

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body
});

describe("Smart Notes API", () => {
  let app;
  let aiService;
  let lastAiRequest;

  beforeEach(() => {
    aiService = createDeepSeekService({
      apiKey: "test-key",
      model: "deepseek-chat",
      fetchImpl: async (url, options) => {
        assert.equal(url, "https://api.deepseek.com/chat/completions");
        assert.equal(options.headers.Authorization, "Bearer test-key");
        const body = JSON.parse(options.body);
        assert.equal(body.model, "deepseek-chat");
        lastAiRequest = body;
        const content = body.response_format?.type === "json_object"
          ? JSON.stringify({ titulo: "Título editado", contenido: "Contenido editado." })
          : body.messages[0].content.includes("tres viñetas")
            ? "- Punto uno\n- Punto dos\n- Punto tres"
            : "Respuesta de prueba";
        return jsonResponse({
          choices: [{ message: { content } }],
          usage: { prompt_tokens: 8, completion_tokens: 5, total_tokens: 13 }
        });
      }
    });
    app = createApp({ aiService });
    lastAiRequest = null;
  });

  it("carga notas de ejemplo y las deja disponibles para la IA", async () => {
    const seededNotes = createNotesService({ initialNotes: exampleNotes });
    const seededApp = createApp({ notesService: seededNotes, aiService });
    const response = await request(seededApp).get("/api/notas");

    assert.equal(response.status, 200);
    assert.equal(response.body.notas.length, 4);
    assert.ok(response.body.notas.some((note) => note.titulo === "Cómo editar una nota con IA"));
  });

  it("prioriza las notas relacionadas con la pregunta sin exceder el límite de contexto", () => {
    const notes = Array.from({ length: 25 }, (_, index) => ({
      id: `nota-${index}`,
      titulo: index === 0 ? "Ideas del huerto urbano" : `Apuntes generales ${index}`,
      contenido: index === 0 ? "Semillas, tomates y riego del huerto." : "Notas de reuniones generales.",
      creadaEn: new Date(2026, 0, index + 1).toISOString()
    }));

    const selected = selectRelevantNotes(notes, "¿Qué anoté sobre el huerto y los tomates?");
    assert.equal(selected.length, 20);
    assert.equal(selected[0].id, "nota-0");
    assert.ok(selected.every(({ contenido }) => contenido.length <= 600));
  });

  it("crea dos notas y lista ambas", async () => {
    const first = await request(app).post("/api/notas").send({ titulo: "Primera nota", contenido: "Contenido inicial." });
    const second = await request(app).post("/api/notas").send({ titulo: "Segunda nota", contenido: "Otro contenido." });
    assert.equal(first.status, 201);
    assert.equal(second.status, 201);

    const list = await request(app).get("/api/notas");
    assert.equal(list.status, 200);
    assert.equal(list.body.notas.length, 2);
  });

  it("exporta las notas como JSON sin cambiar la colección", async () => {
    await request(app).post("/api/notas").send({ titulo: "Exportación", contenido: "Nota para respaldar." });
    const exported = await request(app).get("/api/notas/exportar");
    assert.equal(exported.status, 200);
    assert.equal(exported.body.total, 1);
    assert.equal(exported.body.notas[0].titulo, "Exportación");
    assert.ok(Number.isFinite(Date.parse(exported.body.exportadoEn)));

    const list = await request(app).get("/api/notas");
    assert.equal(list.body.notas.length, 1);
  });

  it("responde 404 al consultar una nota inexistente", async () => {
    const response = await request(app).get("/api/notas/00000000-0000-4000-8000-000000000001");
    assert.equal(response.status, 404);
    assert.equal(response.body.codigo, "NOTE_NOT_FOUND");
  });

  it("rechaza un body vacío al crear una nota", async () => {
    const response = await request(app).post("/api/notas").send({});
    assert.equal(response.status, 400);
    assert.equal(response.body.codigo, "VALIDATION_ERROR");
    assert.ok(response.body.detalles.length >= 2);
  });

  it("envía una pregunta a la IA e incluye el uso de tokens", async () => {
    const note = await request(app).post("/api/notas").send({ titulo: "Proyecto", contenido: "Planear la entrega el viernes." });
    const response = await request(app).post("/api/ia/preguntar").send({ pregunta: "¿Cómo priorizo mis tareas?" });
    assert.equal(response.status, 200);
    assert.equal(response.body.respuesta, "Respuesta de prueba");
    assert.equal(response.body.uso.total_tokens, 13);
    assert.match(lastAiRequest.messages[0].content, /Smart Notes/);
    assert.match(lastAiRequest.messages[0].content, /solo se guardan cuando la persona confirma/);
    assert.match(lastAiRequest.messages[1].content, new RegExp(note.body.nota.id));
    assert.match(lastAiRequest.messages[1].content, /Planear la entrega el viernes/);
  });

  it("expone si DeepSeek está configurado sin revelar la API key", async () => {
    const response = await request(app).get("/api/ia/estado");
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      proveedor: "DeepSeek",
      modelo: "deepseek-chat",
      configurado: true
    });
    assert.equal(JSON.stringify(response.body).includes("test-key"), false);
  });

  it("resume una nota existente en tres viñetas", async () => {
    const created = await request(app).post("/api/notas").send({ titulo: "Resumen", contenido: "Texto para resumir." });
    const response = await request(app).post(`/api/notas/${created.body.nota.id}/resumen`);
    assert.equal(response.status, 200);
    assert.equal(response.body.resumen.split("\n").length, 3);
  });

  it("responde 404 al resumir una nota inexistente", async () => {
    const response = await request(app).post("/api/notas/00000000-0000-4000-8000-000000000001/resumen");
    assert.equal(response.status, 404);
  });

  it("rechaza una pregunta de una letra", async () => {
    const response = await request(app).post("/api/ia/preguntar").send({ pregunta: "¿" });
    assert.equal(response.status, 400);
    assert.equal(response.body.codigo, "VALIDATION_ERROR");
  });

  it("no filtra credenciales si DeepSeek rechaza una API key inválida", async () => {
    const invalidKeyService = createDeepSeekService({
      apiKey: "invalid-test-key",
      fetchImpl: async (url, options) => {
        assert.equal(url, "https://api.deepseek.com/chat/completions");
        assert.equal(options.headers.Authorization, "Bearer invalid-test-key");
        return jsonResponse({ error: { message: "Invalid API key" } }, 401);
      }
    });
    const invalidApp = createApp({ aiService: invalidKeyService });
    const response = await request(invalidApp).post("/api/ia/preguntar").send({ pregunta: "¿Funciona la prueba?" });
    assert.equal(response.status, 502);
    assert.equal(response.body.codigo, "AI_UNAVAILABLE");
    assert.equal(JSON.stringify(response.body).includes("invalid-test-key"), false);
  });

  it("responde 429 cuando DeepSeek limita las solicitudes", async () => {
    const rateLimitedService = createDeepSeekService({
      apiKey: "test-key",
      fetchImpl: async () => jsonResponse({ error: { message: "Rate limit" } }, 429)
    });
    const rateLimitedApp = createApp({ aiService: rateLimitedService });
    const response = await request(rateLimitedApp).post("/api/ia/preguntar").send({ pregunta: "¿Puedes responder?" });
    assert.equal(response.status, 429);
    assert.equal(response.body.codigo, "AI_RATE_LIMIT");
  });

  it("responde 504 cuando DeepSeek excede el tiempo de espera", async () => {
    const timeoutService = createDeepSeekService({
      apiKey: "test-key",
      fetchImpl: async () => {
        const error = new Error("Request timed out");
        error.name = "TimeoutError";
        throw error;
      }
    });
    const timeoutApp = createApp({ aiService: timeoutService });
    const response = await request(timeoutApp)
      .post("/api/ia/preguntar")
      .send({ pregunta: "¿Puedes responder?" });
    assert.equal(response.status, 504);
    assert.equal(response.body.codigo, "AI_UNAVAILABLE");
  });

  it("explica cuando falta la clave de DeepSeek sin llamar al proveedor", async () => {
    const unconfiguredService = createDeepSeekService({ apiKey: "" });
    const unconfiguredApp = createApp({ aiService: unconfiguredService });
    const status = await request(unconfiguredApp).get("/api/ia/estado");
    assert.equal(status.status, 200);
    assert.equal(status.body.configurado, false);
    const response = await request(unconfiguredApp).post("/api/ia/preguntar").send({ pregunta: "¿Puedes responder?" });
    assert.equal(response.status, 502);
    assert.equal(response.body.codigo, "AI_UNAVAILABLE");
  });

  it("propone una edición de nota y solo la guarda tras confirmación", async () => {
    const created = await request(app).post("/api/notas").send({
      titulo: "Borrador",
      contenido: "contenido con errores"
    });
    const { id } = created.body.nota;

    const proposal = await request(app).post(`/api/ia/notas/${id}/editar`).send({
      instrucciones: "Corrige y mejora el contenido."
    });
    assert.equal(proposal.status, 200);
    assert.deepEqual(proposal.body.propuesta, {
      titulo: "Título editado",
      contenido: "Contenido editado."
    });
    assert.equal(lastAiRequest.response_format.type, "json_object");

    const unchanged = await request(app).get(`/api/notas/${id}`);
    assert.equal(unchanged.body.nota.contenido, "contenido con errores");

    const updated = await request(app).put(`/api/notas/${id}`).send(proposal.body.propuesta);
    assert.equal(updated.status, 200);
    assert.equal(updated.body.nota.contenido, "Contenido editado.");
  });

  it("valida las instrucciones y el UUID de edición de notas", async () => {
    const invalidInstructions = await request(app)
      .post("/api/ia/notas/00000000-0000-4000-8000-000000000001/editar")
      .send({ instrucciones: " " });
    assert.equal(invalidInstructions.status, 400);

    const invalidId = await request(app)
      .post("/api/ia/notas/no-es-uuid/editar")
      .send({ instrucciones: "Corrige el texto" });
    assert.equal(invalidId.status, 400);
  });

  it("responde 404 al proponer cambios para una nota inexistente", async () => {
    const response = await request(app)
      .post("/api/ia/notas/00000000-0000-4000-8000-000000000001/editar")
      .send({ instrucciones: "Corrige el texto" });
    assert.equal(response.status, 404);
  });

  it("rechaza una respuesta de edición de IA que no cumple el esquema", async () => {
    const invalidService = createDeepSeekService({
      apiKey: "test-key",
      fetchImpl: async () => jsonResponse({
        choices: [{ message: { content: JSON.stringify({ titulo: "x", contenido: "" }) } }]
      })
    });
    const invalidApp = createApp({ aiService: invalidService });
    const created = await request(invalidApp).post("/api/notas").send({ titulo: "Nota", contenido: "Contenido." });
    const response = await request(invalidApp)
      .post(`/api/ia/notas/${created.body.nota.id}/editar`)
      .send({ instrucciones: "Mejora el texto" });
    assert.equal(response.status, 502);
    assert.equal(response.body.codigo, "AI_UNAVAILABLE");
  });

  it("elimina una nota y confirma que dejó de existir", async () => {
    const created = await request(app).post("/api/notas").send({ titulo: "Eliminar", contenido: "Contenido." });
    const { id } = created.body.nota;
    const deleted = await request(app).delete(`/api/notas/${id}`);
    assert.equal(deleted.status, 200);
    const lookup = await request(app).get(`/api/notas/${id}`);
    assert.equal(lookup.status, 404);
  });

  it("documenta todos los endpoints en Swagger UI", async () => {
    const response = await request(app).get("/api-docs/");
    assert.equal(response.status, 200);
    assert.match(response.text, /swagger-ui/);
  });
});
