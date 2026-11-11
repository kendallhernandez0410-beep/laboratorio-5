export const exampleNotes = [
  {
    titulo: "Smart Notes: funciones de la aplicación",
    contenido: [
      "Smart Notes es una aplicación para crear, consultar, buscar, resumir y eliminar notas.",
      "El panel muestra cuántas notas hay. El buscador filtra por título y contenido.",
      "Al abrir una nota se puede pedir a DeepSeek una propuesta de edición y revisar los cambios antes de guardarlos.",
      "Las notas viven en memoria y se reinician al volver a iniciar el backend.",
      "Swagger permite consultar y probar los endpoints en /api-docs."
    ].join("\n")
  },
  {
    titulo: "Guía rápida para usar el asistente de IA",
    contenido: [
      "Puedes preguntar sobre las funciones de Smart Notes y consultar información de tus notas guardadas.",
      "La IA recibe los títulos y extractos de hasta veinte notas recientes como contexto.",
      "Ejemplos de preguntas: ¿Cómo edito una nota?, ¿qué anoté sobre mi proyecto?, ¿cuáles son las funciones de Smart Notes?",
      "Para resumir una nota se puede pulsar el icono de destellos junto a la nota. El resumen debe tener tres viñetas breves en español.",
      "La integración usa DeepSeek desde el backend. La clave se configura en DEEPSEEK_API_KEY dentro de backend/.env y nunca se coloca en el frontend."
    ].join("\n")
  },
  {
    titulo: "Cómo editar una nota con IA",
    contenido: [
      "Abre una nota desde la lista o pulsa el icono del lápiz Editar con IA.",
      "Escribe instrucciones concretas, por ejemplo: corrige la ortografía y organiza el texto en una lista.",
      "La IA genera una propuesta con un título y un contenido nuevos; todavía no guarda ni reemplaza la nota original.",
      "Revisa la vista previa y edita el título o el contenido directamente si es necesario.",
      "Pulsa Confirmar y guardar cambios para actualizar la nota. Si no confirmas, la versión original se conserva."
    ].join("\n")
  },
  {
    titulo: "Ideas para probar las notas y el asistente",
    contenido: [
      "Proyecto: crear una aplicación de hábitos para registrar objetivos semanales.",
      "Primer paso: definir tres hábitos sencillos y registrar su progreso cada día.",
      "Idea para mejorar Smart Notes: crear una lista de tareas desde las notas de un proyecto.",
      "Pregunta para la IA: ¿Qué primer paso concreto recomiendas para avanzar con esta idea?",
      "Instrucción de edición: convierte esta nota en una lista breve de tareas y conserva las ideas originales."
    ].join("\n")
  }
];
