import "dotenv/config";
import { createApp } from "./app.js";
import { exampleNotes } from "./config/exampleNotes.js";
import { createNotesService } from "./services/notes.service.js";

const port = Number(process.env.PORT) || 3000;
const notesService = createNotesService({ initialNotes: exampleNotes });
const app = createApp({ notesService });

app.listen(port, () => {
  console.log(`Smart Notes API disponible en http://localhost:${port}`);
});
