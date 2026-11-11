import { ZodError } from "zod";
import { DeepSeekError } from "../services/deepseek.service.js";

export function notFoundHandler(_req, res) {
  res.status(404).json({
    error: "Ruta no encontrada.",
    codigo: "ROUTE_NOT_FOUND"
  });
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Los datos enviados no son válidos.",
      codigo: "VALIDATION_ERROR",
      detalles: error.issues.map(({ path, message, code }) => ({
        campo: path.join("."),
        mensaje: message,
        codigo: code
      }))
    });
  }

  if (error instanceof DeepSeekError) {
    return res.status(error.statusCode).json({
      error: error.message,
      codigo: error.statusCode === 429 ? "AI_RATE_LIMIT" : "AI_UNAVAILABLE"
    });
  }

  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      error: "El cuerpo de la solicitud supera el tamaño permitido.",
      codigo: "PAYLOAD_TOO_LARGE"
    });
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      error: "El cuerpo JSON no tiene un formato válido.",
      codigo: "INVALID_JSON"
    });
  }

  console.error("Error interno de la API:", error);
  return res.status(500).json({
    error: "Ocurrió un error interno.",
    codigo: "INTERNAL_ERROR"
  });
}
