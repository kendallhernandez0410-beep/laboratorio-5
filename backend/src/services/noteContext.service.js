const stopWords = new Set([
  "para", "como", "con", "que", "por", "una", "uno", "las", "los", "del",
  "sobre", "esta", "este", "mis", "tus", "sus", "hay", "donde", "cuando",
  "quiero", "puedo", "puedes", "tiene", "tienen"
]);

function tokenize(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es")
    .match(/[\p{L}\p{N}]+/gu)
    ?.filter((token) => token.length > 2 && !stopWords.has(token)) ?? [];
}

export function selectRelevantNotes(notes, question, limit = 20) {
  const terms = [...new Set(tokenize(question))];
  if (!terms.length) return notes.slice(0, limit);

  return notes
    .map((note, index) => {
      const titleTerms = new Set(tokenize(note.titulo));
      const contentTerms = tokenize(note.contenido);
      const score = terms.reduce((total, term) => {
        const titleMatches = titleTerms.has(term) ? 4 : 0;
        const contentMatches = contentTerms.filter((word) => word === term).length;
        return total + titleMatches + Math.min(contentMatches, 3);
      }, 0);
      return { note, index, score };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ note }) => ({
      id: note.id,
      titulo: note.titulo,
      contenido: note.contenido.slice(0, 600)
    }));
}
