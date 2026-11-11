import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight, ArrowUpRight, BookOpen, Check, ChevronRight, CircleHelp,
  FileText, LayoutDashboard, LoaderCircle, Menu, Pencil, Plus, Save,
  Send, Sparkles, StickyNote, Trash2, X
} from "lucide-react";
import { api } from "./services/api.js";

function App() {
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [aiStatus, setAiStatus] = useState(null);
  const [noteBusy, setNoteBusy] = useState(false);
  const [questionBusy, setQuestionBusy] = useState(false);
  const [summaryBusyId, setSummaryBusyId] = useState(null);
  const [detailBusyId, setDetailBusyId] = useState(null);
  const [editInstructions, setEditInstructions] = useState("");
  const [editProposal, setEditProposal] = useState(null);
  const [editBusy, setEditBusy] = useState(false);
  const [saveEditBusy, setSaveEditBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [summary, setSummary] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [toast, setToast] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const loadNotes = useCallback(async () => {
    setLoadingNotes(true);
    try {
      const data = await api.listNotes();
      setNotes(data.notas);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoadingNotes(false);
    }
  }, [notify]);

  useEffect(() => { loadNotes(); }, [loadNotes]);
  useEffect(() => {
    api.getAiStatus().then(setAiStatus).catch((error) => notify(error.message, "error"));
  }, [notify]);

  const filteredNotes = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    if (!normalized) return notes;
    return notes.filter((note) => `${note.titulo} ${note.contenido}`.toLocaleLowerCase("es").includes(normalized));
  }, [notes, query]);

  async function handleCreate(event) {
    event.preventDefault();
    if (title.trim().length < 2) {
      notify("El título debe tener al menos 2 caracteres.", "error");
      return;
    }
    if (!content.trim()) {
      notify("Escribe el contenido de tu nota.", "error");
      return;
    }
    setNoteBusy(true);
    try {
      const data = await api.createNote({ titulo: title, contenido: content });
      setNotes((current) => [data.nota, ...current]);
      setTitle("");
      setContent("");
      notify("Tu nota se guardó correctamente.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setNoteBusy(false);
    }
  }

  async function handleDelete(note) {
    if (!window.confirm(`¿Eliminar “${note.titulo}”? Esta acción no se puede deshacer.`)) return;
    try {
      await api.deleteNote(note.id);
      setNotes((current) => current.filter((item) => item.id !== note.id));
      if (selectedNote?.id === note.id) setSelectedNote(null);
      if (summary?.notaId === note.id) setSummary(null);
      notify("Nota eliminada.");
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function handleOpenNote(note) {
    setDetailBusyId(note.id);
    try {
      const data = await api.getNote(note.id);
      setSelectedNote(data.nota);
      setEditInstructions("");
      setEditProposal(null);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setDetailBusyId(null);
    }
  }

  async function handleProposeEdit(event) {
    event.preventDefault();
    if (!selectedNote || editInstructions.trim().length < 3) {
      notify("Describe el cambio que quieres hacer con al menos 3 caracteres.", "error");
      return;
    }
    setEditBusy(true);
    setEditProposal(null);
    try {
      const result = await api.proposeNoteEdit(selectedNote.id, editInstructions);
      setEditProposal(result.propuesta);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setEditBusy(false);
    }
  }

  async function handleSaveEdit() {
    if (!selectedNote || !editProposal) return;
    setSaveEditBusy(true);
    try {
      const { nota } = await api.updateNote(selectedNote.id, editProposal);
      setNotes((current) => current.map((item) => item.id === nota.id ? nota : item));
      setSelectedNote(nota);
      setEditProposal(null);
      setEditInstructions("");
      notify("La nota se actualizó con la edición confirmada.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaveEditBusy(false);
    }
  }

  async function handleAsk(event) {
    event.preventDefault();
    if (question.trim().length < 2) {
      notify("Escribe una pregunta de al menos 2 caracteres.", "error");
      return;
    }
    setQuestionBusy(true);
    setAnswer(null);
    try {
      setAnswer(await api.askAi(question));
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setQuestionBusy(false);
    }
  }

  async function handleSummarize(note) {
    setSummaryBusyId(note.id);
    setSummary(null);
    try {
      const result = await api.summarizeNote(note.id);
      setSummary({ ...result, titulo: note.titulo });
      document.getElementById("ai-tools")?.scrollIntoView({ behavior: "smooth", block: "start" });
      notify("Resumen listo.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSummaryBusyId(null);
    }
  }

  function navigateTo(id) {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
        <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); navigateTo("home"); }}>
          <span className="brand-mark"><StickyNote size={21} strokeWidth={2.2} /></span>
          <span>smart<span className="brand-light">notes</span><small>YOUR SECOND BRAIN</small></span>
        </a>
        <div className="side-label">ESPACIO DE TRABAJO</div>
        <nav className="side-nav" aria-label="Navegación principal">
          <button className="nav-item active" onClick={() => navigateTo("home")}><LayoutDashboard size={18} /> Dashboard</button>
          <button className="nav-item" onClick={() => navigateTo("notes")}><FileText size={18} /> Mis notas <span className="nav-count">{notes.length}</span></button>
          <button className="nav-item" onClick={() => navigateTo("ai-tools")}><Sparkles size={18} /> Asistente IA</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon"><Sparkles size={16} /></div>
            <strong>Una idea a la vez</strong>
            <p>Guarda tus ideas hoy. Tu yo del futuro te lo agradecerá.</p>
            <button onClick={() => navigateTo("create-note")}>Crear una nota <ChevronRight size={14} /></button>
          </div>
          <a className="docs-link" href="/api-docs" target="_blank" rel="noreferrer"><BookOpen size={17} /> Documentación API <ArrowUpRight size={14} /></a>
          <div className="profile">
            <div className="avatar">S</div>
            <div><strong>Mi espacio</strong><span>Plan personal</span></div>
            <span className="profile-dot" title="Espacio local" />
          </div>
        </div>
      </aside>

      <main className="main-content" id="home">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Abrir menú" onClick={() => setMobileMenuOpen((open) => !open)}><Menu size={21} /></button>
          <div className="breadcrumb">Workspace <ChevronRight size={14} /> <span>Dashboard</span></div>
          <div className="topbar-right">
            <span className="today-label">{new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</span>
            <div className="top-avatar">S</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><span className="live-dot" /> TU ESPACIO DE IDEAS</div>
              <h1>Buenos días <span className="wave">✦</span></h1>
              <p className="welcome-copy">Un lugar tranquilo para pensar, escribir y crear algo genial.</p>
            </div>
            <button className="primary-button welcome-cta" onClick={() => navigateTo("create-note")}><Plus size={17} /> Nueva nota</button>
          </section>

          <section className="stats-grid" aria-label="Resumen">
            <article className="stat-card">
              <div className="stat-top"><span className="stat-icon blue"><FileText size={19} /></span><span className="stat-trend"><ArrowUpRight size={14} /> En tu espacio</span></div>
              <div className="stat-number">{loadingNotes ? "—" : notes.length}</div>
              <div className="stat-caption">Notas guardadas</div>
              <div className="stat-foot"><span className="tiny-bar blue-bar" /> Tus ideas, siempre a mano</div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span className="stat-icon purple"><Sparkles size={19} /></span><span className="stat-tag">AI POWERED</span></div>
              <div className="stat-number stat-word">Un poco de magia</div>
              <div className="stat-caption">Tu asistente está listo</div>
              <button className="text-action" onClick={() => navigateTo("ai-tools")}>Probar asistente <ArrowUpRight size={14} /></button>
            </article>
            <article className="stat-card inspiration-card">
              <div className="stat-top"><span className="stat-icon peach"><CircleHelp size={19} /></span><span className="stat-tag">UN RECORDATORIO</span></div>
              <div className="inspiration-quote">“Las grandes ideas empiezan con una simple nota.”</div>
              <div className="stat-caption">Captura lo que se te ocurra.</div>
            </article>
          </section>

          <section className="content-grid">
            <div className="panel notes-panel" id="notes">
              <div className="panel-heading">
                <div><div className="section-kicker">TU COLECCIÓN</div><h2>Notas recientes <span className="heading-count">{notes.length}</span></h2></div>
                <div className="panel-actions">
                  <label className="search-box"><span className="sr-only">Buscar notas</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar notas..." /><span className="search-glyph">⌕</span></label>
                  <button className="icon-button" aria-label="Crear nota" title="Crear nota" onClick={() => navigateTo("create-note")}><Plus size={18} /></button>
                </div>
              </div>
              {loadingNotes ? (
                <div className="loading-state"><LoaderCircle className="spin" size={22} /> Cargando tus notas...</div>
              ) : filteredNotes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><StickyNote size={24} /></div>
                  <strong>{query ? "No encontramos coincidencias" : "Tu espacio empieza aquí"}</strong>
                  <p>{query ? "Prueba con otras palabras." : "Guarda esa idea que no quieres olvidar."}</p>
                  {!query && <button className="text-action" onClick={() => navigateTo("create-note")}>Escribir mi primera nota <ChevronRight size={15} /></button>}
                </div>
              ) : (
                <div className="notes-list">
                  {filteredNotes.map((note, index) => (
                    <article className="note-row" key={note.id}>
                      <div className={`note-color note-color-${index % 4}`}><FileText size={18} /></div>
                      <button className="note-main" onClick={() => handleOpenNote(note)} disabled={detailBusyId === note.id}>
                        <strong>{detailBusyId === note.id ? "Cargando nota..." : note.titulo}</strong>
                        <span>{note.contenido}</span>
                      </button>
                      <div className="note-meta">
                        <time dateTime={note.creadaEn}>{new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(new Date(note.creadaEn))}</time>
                        <button className="mini-action" onClick={() => handleOpenNote(note)} disabled={detailBusyId === note.id} aria-label={`Editar ${note.titulo} con IA`} title="Editar con IA">
                          {detailBusyId === note.id ? <LoaderCircle className="spin" size={15} /> : <Pencil size={15} />}
                        </button>
                        <button className="mini-action" onClick={() => handleSummarize(note)} disabled={summaryBusyId === note.id} aria-label={`Resumir ${note.titulo}`} title="Resumir con IA">
                          {summaryBusyId === note.id ? <LoaderCircle className="spin" size={15} /> : <Sparkles size={15} />}
                        </button>
                        <button className="mini-action delete-action" onClick={() => handleDelete(note)} aria-label={`Eliminar ${note.titulo}`} title="Eliminar nota"><Trash2 size={15} /></button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              {notes.length > 0 && <button className="view-all" onClick={() => { setQuery(""); notify(`Tienes ${notes.length} notas en tu espacio.`); }}>Ver todas las notas <ArrowDownRight size={15} /></button>}
            </div>

            <section className="panel create-panel" id="create-note">
              <div className="section-kicker">GUARDA UNA IDEA</div>
              <h2>Nueva nota <span className="heading-sparkle"><Plus size={16} /></span></h2>
              <p className="form-intro">No hace falta que esté perfecta. Solo empieza.</p>
              <form className="note-form" onSubmit={handleCreate}>
                <label htmlFor="note-title">Título <span>Requerido</span></label>
                <input id="note-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="¿En qué estás pensando?" maxLength={120} required minLength={2} />
                <label htmlFor="note-content">Tu idea <span>Requerido</span></label>
                <textarea id="note-content" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Escribe todo lo que tengas en mente..." maxLength={10000} required rows={5} />
                <div className="form-footer"><span>{content.length} / 10000</span><button className="primary-button" type="submit" disabled={noteBusy}>{noteBusy ? <LoaderCircle className="spin" size={16} /> : <><Plus size={16} /> Guardar nota</>}</button></div>
              </form>
              <div className="privacy-note"><Check size={14} /> Tus notas se guardan en este espacio de trabajo.</div>
            </section>
          </section>

          <section className="ai-section" id="ai-tools">
            <div className="ai-heading">
              <div><div className="section-kicker">PIENSA EN VOZ ALTA</div><h2>Un poco de ayuda inteligente <Sparkles size={20} /></h2><p>Pregunta sobre Smart Notes o tus notas; abre una nota para pedirle a la IA que la edite.</p></div>
              <span className={`ai-powered ${aiStatus?.configurado === false ? "ai-not-configured" : ""}`}>
                <span className="live-dot" />
                {aiStatus === null ? "ESTADO NO DISPONIBLE" : aiStatus.configurado ? "DEEPSEEK CONFIGURADO" : "FALTA CLAVE DE DEEPSEEK"}
              </span>
            </div>
            <div className="ai-grid">
              <form className="panel ask-card" onSubmit={handleAsk}>
                <div className="ai-card-title"><span className="ai-icon"><Sparkles size={18} /></span><div><h3>Pregunta sobre Smart Notes</h3><p>La IA conoce las funciones y tus notas.</p></div></div>
                <label className="sr-only" htmlFor="ai-question">Tu pregunta para la IA</label>
                <textarea id="ai-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="¿Cómo edito una nota? ¿Qué anoté sobre mi proyecto?" rows={3} maxLength={2000} />
                <div className="ask-footer"><span>Respuestas en español <span className="separator-dot">·</span> {question.length}/2000</span><button className="ask-button" type="submit" disabled={questionBusy}>{questionBusy ? <LoaderCircle className="spin" size={16} /> : <Send size={15} />} Preguntar</button></div>
                {answer && <div className="ai-result"><div className="result-label"><Sparkles size={14} /> RESPUESTA</div><p>{answer.respuesta}</p>{answer.uso && <span className="usage-label">{answer.uso.total_tokens ?? "—"} tokens</span>}</div>}
              </form>
              <div className="panel summary-card">
                <div className="ai-card-title"><span className="summary-icon"><BookOpen size={18} /></span><div><h3>Resumen de una nota</h3><p>Tres ideas clave, sin perder el hilo.</p></div></div>
                {summary ? (
                  <div className="ai-result summary-result">
                    <div className="result-label"><Sparkles size={14} /> {summary.titulo}</div>
                    <p>{summary.resumen}</p>
                    {summary.uso && <span className="usage-label">{summary.uso.total_tokens ?? "—"} tokens</span>}
                  </div>
                ) : (
                  <div className="summary-empty">
                    <div className="summary-lines"><span /><span /><span /></div>
                    {notes.length > 0
                      ? <span>Elige una nota y pulsa <Sparkles size={13} /> para resumirla.</span>
                      : <span>Primero guarda una nota y luego podrás resumirla.</span>}
                  </div>
                )}
                {notes.length > 0 && <div className="summary-select"><span>RESUMIR NOTA</span><select defaultValue="" onChange={(event) => { const note = notes.find((item) => item.id === event.target.value); if (note) handleSummarize(note); }}><option value="" disabled>Elige de tus notas...</option>{notes.map((note) => <option key={note.id} value={note.id}>{note.titulo}</option>)}</select></div>}
              </div>
            </div>
          </section>

          <footer className="page-footer"><span>Hecho para las ideas que importan.</span><span>SMART NOTES <span className="footer-heart">✦</span> TU ESPACIO, TUS IDEAS</span></footer>
        </div>
      </main>

      {mobileMenuOpen && <button className="menu-scrim" aria-label="Cerrar menú" onClick={() => setMobileMenuOpen(false)} />}
      {toast && <div className={`toast ${toast.type === "error" ? "toast-error" : ""}`} role={toast.type === "error" ? "alert" : "status"}><span className="toast-check">{toast.type === "error" ? <X size={15} /> : <Check size={15} />}</span>{toast.message}<button aria-label="Cerrar mensaje" onClick={() => setToast(null)}><X size={15} /></button></div>}
      {selectedNote && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !editBusy && !saveEditBusy) setSelectedNote(null); }}><section className="note-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className="modal-close" aria-label="Cerrar" onClick={() => { setSelectedNote(null); setEditProposal(null); }}><X size={19} /></button>
        <div className="section-kicker">TU NOTA</div>
        <h2 id="modal-title">{selectedNote.titulo}</h2>
        <time>{new Intl.DateTimeFormat("es", { dateStyle: "long", timeStyle: "short" }).format(new Date(selectedNote.creadaEn))}</time>
        <p>{selectedNote.contenido}</p>
        <button className="primary-button" onClick={() => { const note = selectedNote; setSelectedNote(null); handleSummarize(note); }}><Sparkles size={16} /> Resumir con IA</button>
        <form className="edit-note-form" onSubmit={handleProposeEdit}>
          <div className="edit-heading"><Pencil size={16} /><div><strong>Editar con IA</strong><span>Describe los cambios; revisa la propuesta antes de guardarla.</span></div></div>
          <label className="sr-only" htmlFor="edit-instructions">Instrucciones para editar la nota</label>
          <textarea id="edit-instructions" value={editInstructions} onChange={(event) => setEditInstructions(event.target.value)} placeholder="Ej.: corrige la ortografía y organiza el contenido en puntos." maxLength={2000} rows={3} />
          <button className="primary-button" type="submit" disabled={editBusy || saveEditBusy || editInstructions.trim().length < 3}>
            {editBusy ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}
            {editBusy ? "Preparando propuesta..." : "Proponer edición"}
          </button>
          {editProposal && <div className="edit-proposal">
            <div className="edit-proposal-heading"><strong>Vista previa editable</strong><span>La nota original no cambia hasta que confirmes.</span></div>
            <label htmlFor="proposed-title">Título</label>
            <input id="proposed-title" value={editProposal.titulo} maxLength={120} onChange={(event) => setEditProposal((current) => ({ ...current, titulo: event.target.value }))} />
            <label htmlFor="proposed-content">Contenido</label>
            <textarea id="proposed-content" value={editProposal.contenido} maxLength={10000} rows={6} onChange={(event) => setEditProposal((current) => ({ ...current, contenido: event.target.value }))} />
            <button className="primary-button" type="button" onClick={handleSaveEdit} disabled={saveEditBusy || editProposal.titulo.trim().length < 2 || !editProposal.contenido.trim()}>
              {saveEditBusy ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}
              {saveEditBusy ? "Guardando..." : "Confirmar y guardar cambios"}
            </button>
          </div>}
        </form>
      </section></div>}
    </div>
  );
}

export default App;
