# Smart Notes — laboratorio-5

Sistema web para administrar notas y consultar una IA mediante una API REST con Express. Incluye validación con Zod, manejo centralizado de errores, Swagger UI y pruebas automatizadas.

> La guía PDF mencionada en el encargo no estaba disponible en los archivos de trabajo. Este proyecto se desarrolló siguiendo los requisitos detallados en el mensaje.

## Tecnologías

- **Frontend:** React, Vite, JavaScript y CSS responsivo.
- **Backend:** Node.js, Express, Zod, dotenv y Swagger UI.
- **IA:** DeepSeek Chat Completions API.
- **Pruebas:** Node.js Test Runner y Supertest.

## Estructura

```text
smart-notes/
├── backend/
│   ├── src/
│   │   ├── config/openapi.js
│   │   ├── middlewares/errorHandler.js
│   │   ├── routes/ai.routes.js
│   │   ├── routes/notes.routes.js
│   │   ├── services/notes.service.js
│   │   ├── services/deepseek.service.js
│   │   ├── validators/schemas.js
│   │   ├── app.js
│   │   └── index.js
│   ├── tests/api.test.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── services/api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Requisitos

- Node.js 18 o posterior y npm.
- Una clave de DeepSeek solo si se quieren probar las funciones de IA en vivo. El CRUD de notas y las pruebas funcionan sin ella.

## Instalación y configuración

1. Abre una terminal en la carpeta `backend` y ejecuta:

   ```bash
   npm install
   ```

2. Copia `backend/.env.example` como `backend/.env` y configura la clave, el modelo y el puerto:

   ```env
   DEEPSEEK_API_KEY=tu_clave_de_deepseek
   DEEPSEEK_MODEL=deepseek-chat
   PORT=3000
   ```

   Obtén tu clave desde [DeepSeek Platform](https://platform.deepseek.com/api_keys). La clave se utiliza exclusivamente en el backend; no la incluyas en variables `VITE_*` ni en código del frontend. `deepseek-chat` es el modelo predeterminado; puedes cambiarlo por otro modelo disponible para tu cuenta.

3. En una segunda terminal, entra a `frontend` e instala sus dependencias:

   ```bash
   npm install
   ```

## Ejecución

Desde `backend`:

```bash
npm run dev
```

Desde `frontend`, en otra terminal:

```bash
npm run dev
```

Abre la dirección que indique Vite (por defecto `http://localhost:5173`). El servidor Express escucha en `http://localhost:3000`; Vite reenvía `/api` y `/api-docs` al backend.

Las notas se conservan en memoria y se pierden al reiniciar el backend. Al iniciar, el backend agrega cuatro notas de ejemplo sobre Smart Notes, el asistente DeepSeek, la edición de notas y preguntas para probar. Así puedes explorar la interfaz y consultar inmediatamente a la IA sobre la página y esas notas.

El botón de descarga junto al buscador exporta todas las notas actuales a un archivo JSON, útil para guardar una copia antes de reiniciar el servidor.

## API

Todos los cuerpos y respuestas JSON usan UTF-8.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/notas` | Lista las notas |
| `GET` | `/api/notas/exportar` | Exporta las notas con fecha y cantidad en JSON |
| `GET` | `/api/notas/:id` | Obtiene una nota por UUID |
| `POST` | `/api/notas` | Crea una nota `{ "titulo": "...", "contenido": "..." }` |
| `PUT` | `/api/notas/:id` | Actualiza el título y contenido de una nota y registra `actualizadaEn` |
| `DELETE` | `/api/notas/:id` | Elimina una nota |
| `GET` | `/api/ia/estado` | Informa proveedor/modelo y si la clave está configurada, sin revelar el secreto |
| `POST` | `/api/ia/preguntar` | Pregunta sobre Smart Notes o las notas guardadas `{ "pregunta": "..." }` |
| `POST` | `/api/ia/notas/:id/editar` | Genera una propuesta de edición `{ "instrucciones": "..." }`; no guarda cambios |
| `POST` | `/api/notas/:id/resumen` | Genera un resumen en tres viñetas breves en español |
| `GET` | `/api-docs` | Abre la documentación Swagger UI |

El asistente conoce las funciones de Smart Notes y selecciona hasta 20 notas relevantes para la pregunta (con prioridad para las coincidencias en el título) como contexto para contestar preguntas sobre la página y el contenido guardado. Para editar, abre una nota, escribe las instrucciones en **Editar con IA**, revisa y ajusta la propuesta si hace falta, y pulsa **Confirmar y guardar cambios**. La IA nunca modifica la nota silenciosamente; la actualización confirmada se valida con Zod antes de guardar. La integración no edita archivos del equipo: modifica exclusivamente las notas de Smart Notes.

Las solicitudes inválidas devuelven `400` con detalles de validación; una nota inexistente devuelve `404`. Los fallos del proveedor de IA devuelven `502`, excepto los límites de solicitudes (`429`). Las respuestas de IA incluyen información de tokens cuando DeepSeek la proporciona.

## Swagger

Con el backend iniciado, visita [http://localhost:3000/api-docs](http://localhost:3000/api-docs). Desde el frontend también está disponible el botón **Documentación API**.

## Pruebas

Desde `backend`:

```bash
npm test
```

La suite automatizada cubre crear dos notas, listar, obtener una nota inexistente, body vacío, pregunta a la IA con contexto de página y notas, resumir una nota existente e inexistente, pregunta de una letra, rechazo de una API key inválida, límites de DeepSeek, propuesta de edición y confirmación de cambios, validaciones de edición y eliminación comprobando que la nota ya no existe. Las llamadas a DeepSeek se simulan en estas pruebas, por lo que no requieren credenciales ni consumen tokens.

Para comprobar DeepSeek en vivo, configura una clave válida y prueba las secciones **Pregunta a la IA** y **Resumen con IA** en la interfaz.

## Reflexión del laboratorio

**¿Por qué validar en el servidor si el frontend ya valida?** El servidor es la frontera de confianza de la API. Una petición puede realizarse sin la interfaz o manipularse, por lo que validar allí mantiene los datos y las respuestas consistentes.

**¿Qué ventajas ofrece el manejo centralizado de errores?** Unifica los códigos y el formato de respuesta, evita filtrar información interna o credenciales y simplifica el manejo de errores en las rutas y el cliente.

**¿Por qué guardar la API key en el backend?** El navegador expone el código y las solicitudes del cliente. Mantener el secreto en variables de entorno del servidor evita publicarlo y permite controlar las respuestas del proveedor.

**¿Qué limitación tiene guardar notas en memoria?** Los datos desaparecen al reiniciar el servidor y no se comparten entre instancias. Para esta práctica se mantiene el almacenamiento en memoria, como pide la guía; en un sistema persistente se usaría una base de datos.

**¿Qué aporta Swagger?** Permite explorar contratos, parámetros y respuestas de la API desde el navegador y realizar solicitudes de prueba sin una interfaz adicional.
