const errorSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
    codigo: { type: "string" },
    detalles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          campo: { type: "string" },
          mensaje: { type: "string" },
          codigo: { type: "string" }
        }
      }
    }
  }
};

const json = (schema) => ({ "application/json": { schema } });
const errorResponse = (description) => ({
  description,
  content: json({ $ref: "#/components/schemas/Error" })
});
const noteNotFoundResponse = errorResponse("La nota solicitada no existe.");
const noteIdParameter = {
  name: "id",
  in: "path",
  required: true,
  description: "UUID de la nota.",
  schema: { type: "string", format: "uuid" }
};

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Smart Notes API",
    version: "1.0.0",
    description: "API REST para administrar notas y consultar DeepSeek."
  },
  servers: [{ url: "/" }],
  tags: [
    { name: "Notas", description: "Operaciones CRUD y resúmenes de notas" },
    { name: "IA", description: "Consultas al modelo configurado en DeepSeek" },
    { name: "Documentación", description: "Acceso a Swagger UI" }
  ],
  components: {
    schemas: {
      Nota: {
        type: "object",
        required: ["id", "titulo", "contenido", "creadaEn"],
        properties: {
          id: { type: "string", format: "uuid" },
          titulo: { type: "string", minLength: 2, maxLength: 120 },
          contenido: { type: "string", minLength: 1, maxLength: 10000 },
          creadaEn: { type: "string", format: "date-time" }
        }
      },
      CrearNota: {
        type: "object",
        required: ["titulo", "contenido"],
        additionalProperties: false,
        properties: {
          titulo: { type: "string", minLength: 2, maxLength: 120, example: "Ideas del proyecto" },
          contenido: { type: "string", minLength: 1, maxLength: 10000, example: "Organizar las tareas de esta semana." }
        }
      },
      EditarNotaConIA: {
        type: "object",
        required: ["instrucciones"],
        additionalProperties: false,
        properties: {
          instrucciones: {
            type: "string",
            minLength: 3,
            maxLength: 2000,
            example: "Corrige la ortografía y organiza el contenido en puntos."
          }
        }
      },
      Pregunta: {
        type: "object",
        required: ["pregunta"],
        additionalProperties: false,
        properties: {
          pregunta: { type: "string", minLength: 2, maxLength: 2000, example: "¿Cómo organizo mejor mis prioridades?" }
        }
      },
      Error: errorSchema,
      UsoIA: {
        type: "object",
        nullable: true,
        properties: {
          prompt_tokens: { type: "integer" },
          completion_tokens: { type: "integer" },
          total_tokens: { type: "integer" }
        },
        additionalProperties: true
      }
    }
  },
  paths: {
    "/api/notas": {
      get: {
        tags: ["Notas"],
        summary: "Listar notas",
        responses: {
          200: {
            description: "Colección de notas en memoria.",
            content: json({
              type: "object",
              properties: {
                notas: { type: "array", items: { $ref: "#/components/schemas/Nota" } }
              }
            })
          }
        }
      },
      post: {
        tags: ["Notas"],
        summary: "Crear nota",
        requestBody: {
          required: true,
          content: json({ $ref: "#/components/schemas/CrearNota" })
        },
        responses: {
          201: {
            description: "Nota creada.",
            content: json({
              type: "object",
              properties: { nota: { $ref: "#/components/schemas/Nota" } }
            })
          },
          400: errorResponse("Campos inválidos o requeridos.")
        }
      }
    },
    "/api/notas/{id}": {
      parameters: [noteIdParameter],
      get: {
        tags: ["Notas"],
        summary: "Consultar una nota",
        responses: {
          200: {
            description: "Nota encontrada.",
            content: json({
              type: "object",
              properties: { nota: { $ref: "#/components/schemas/Nota" } }
            })
          },
          400: errorResponse("UUID inválido."),
          404: noteNotFoundResponse
        }
      },
      delete: {
        tags: ["Notas"],
        summary: "Eliminar una nota",
        responses: {
          200: {
            description: "Nota eliminada.",
            content: json({
              type: "object",
              properties: {
                mensaje: { type: "string" },
                nota: { $ref: "#/components/schemas/Nota" }
              }
            })
          },
          400: errorResponse("UUID inválido."),
          404: noteNotFoundResponse
        }
      },
      put: {
        tags: ["Notas"],
        summary: "Actualizar una nota después de revisar los cambios",
        requestBody: {
          required: true,
          content: json({ $ref: "#/components/schemas/CrearNota" })
        },
        responses: {
          200: {
            description: "Nota actualizada.",
            content: json({
              type: "object",
              properties: { nota: { $ref: "#/components/schemas/Nota" } }
            })
          },
          400: errorResponse("UUID o campos inválidos."),
          404: noteNotFoundResponse
        }
      }
    },
    "/api/notas/{id}/resumen": {
      post: {
        tags: ["Notas", "IA"],
        summary: "Resumir una nota en tres viñetas en español",
        parameters: [noteIdParameter],
        responses: {
          200: {
            description: "Resumen y uso de tokens si está disponible.",
            content: json({
              type: "object",
              properties: {
                notaId: { type: "string", format: "uuid" },
                resumen: { type: "string" },
                uso: { $ref: "#/components/schemas/UsoIA" }
              }
            })
          },
          400: errorResponse("UUID inválido."),
          404: noteNotFoundResponse,
          429: errorResponse("Límite del proveedor de IA."),
          502: errorResponse("Servicio de IA no disponible.")
        }
      }
    },
    "/api/ia/preguntar": {
      post: {
        tags: ["IA"],
        summary: "Hacer una pregunta a la IA",
        requestBody: {
          required: true,
          content: json({ $ref: "#/components/schemas/Pregunta" })
        },
        responses: {
          200: {
            description: "Respuesta y uso de tokens si está disponible.",
            content: json({
              type: "object",
              properties: {
                respuesta: { type: "string" },
                uso: { $ref: "#/components/schemas/UsoIA" }
              }
            })
          },
          400: errorResponse("Pregunta inválida."),
          429: errorResponse("Límite del proveedor de IA."),
          502: errorResponse("Servicio de IA no disponible.")
        }
      }
    },
    "/api/ia/notas/{id}/editar": {
      post: {
        tags: ["IA", "Notas"],
        summary: "Proponer una edición de nota con DeepSeek sin guardar automáticamente",
        parameters: [noteIdParameter],
        requestBody: {
          required: true,
          content: json({ $ref: "#/components/schemas/EditarNotaConIA" })
        },
        responses: {
          200: {
            description: "Propuesta validada para mostrar y confirmar desde la interfaz.",
            content: json({
              type: "object",
              properties: {
                notaId: { type: "string", format: "uuid" },
                original: {
                  type: "object",
                  properties: {
                    titulo: { type: "string" },
                    contenido: { type: "string" }
                  }
                },
                propuesta: { $ref: "#/components/schemas/CrearNota" },
                uso: { $ref: "#/components/schemas/UsoIA" }
              }
            })
          },
          400: errorResponse("UUID o instrucciones inválidos."),
          404: noteNotFoundResponse,
          429: errorResponse("Límite del proveedor de IA."),
          502: errorResponse("DeepSeek no pudo preparar una propuesta válida.")
        }
      }
    },
    "/api-docs": {
      get: {
        tags: ["Documentación"],
        summary: "Abrir documentación Swagger UI",
        responses: { 200: { description: "Interfaz interactiva de Swagger UI." } }
      }
    }
  }
};
