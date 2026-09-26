"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import PageNavigation from "../components/PageNavigation";

type DoubtStatus = "all" | "unresolved" | "resolved";
type Citation = { content_unit_id: string; source_label: string; source_number: number | null; snippet: string };
type Doubt = { id: string; document_id: string | null; question: string; answer: string; citations: Citation[]; resolved: boolean; created_at: string; updated_at: string };
type Document = { id: string; original_filename: string; status: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: "⌂" },
  { label: "Documents", href: "/documents", icon: "▣" },
  { label: "Flashcards", href: "/flashcards", icon: "◇" },
  { label: "Doubts", href: "/doubts", icon: "?" },
  { label: "Quizzes", href: "/quizzes", icon: "✓" },
  { label: "Progress", href: "/progress", icon: "↗" },
];

export default function DoubtsPage() {
  const [status, setStatus] = useState<DoubtStatus>("all");
  const [question, setQuestion] = useState("");
  const [selectedDocument, setSelectedDocument] = useState("");
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [message, setMessage] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = async () => {
    if (!API_URL) {
      setLoading(false);
      setMessage("The backend URL is not configured yet, so saved doubts cannot be loaded.");
      return;
    }
    setLoading(true);
    try {
      const [doubtsResponse, documentsResponse] = await Promise.all([
        fetch(`${API_URL}/api/v1/doubts`, { cache: "no-store" }),
        fetch(`${API_URL}/api/v1/documents`, { cache: "no-store" }),
      ]);
      if (!doubtsResponse.ok) throw new Error("Could not load your saved doubts.");
      if (!documentsResponse.ok) throw new Error("Could not load your study documents.");
      const [doubtData, documentData] = await Promise.all([doubtsResponse.json(), documentsResponse.json()]);
      setDoubts(Array.isArray(doubtData) ? doubtData : []);
      setDocuments(Array.isArray(documentData) ? documentData : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load your saved doubts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredDoubts = useMemo(() => {
    if (status === "all") return doubts;
    return doubts.filter((doubt) => status === "resolved" ? doubt.resolved : !doubt.resolved);
  }, [doubts, status]);

  const documentName = (documentId: string | null) => {
    if (!documentId) return "General doubt";
    return documents.find((document) => document.id === documentId)?.original_filename || "Study material";
  };

  const askDoubt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim()) { setMessage("Write your question first."); return; }
    if (!API_URL) { setMessage("The backend URL is not configured yet, so this doubt cannot be saved."); return; }
    setSubmitting(true);
    setMessage("Saving your doubt and generating an answer...");
    try {
      const response = await fetch(`${API_URL}/api/v1/doubts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), document_id: selectedDocument || null }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.detail || "Could not save your doubt.");
      }
      const savedDoubt: Doubt = await response.json();
      setDoubts((current) => [savedDoubt, ...current]);
      setQuestion("");
      setExpandedId(savedDoubt.id);
      setMessage("Doubt saved. You can come back to it anytime.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleResolved = async (doubt: Doubt) => {
    if (!API_URL) return;
    try {
      const response = await fetch(`${API_URL}/api/v1/doubts/${doubt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: !doubt.resolved }),
      });
      if (!response.ok) throw new Error("Could not update this doubt.");
      const updated: Doubt = await response.json();
      setDoubts((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update this doubt.");
    }
  };

  const deleteDoubt = async (doubtId: string) => {
    if (!API_URL) return;
    if (!window.confirm("Delete this saved doubt? This cannot be undone.")) return;
    setDeletingId(doubtId);
    try {
      const response = await fetch(`${API_URL}/api/v1/doubts/${doubtId}`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.detail || "Could not delete this doubt.");
      }
      setDoubts((current) => current.filter((doubt) => doubt.id !== doubtId));
      if (expandedId === doubtId) setExpandedId(null);
      setMessage("Doubt deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete this doubt.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <main className="doubts-page">
      <aside className="study-sidebar">
        <Link href="/dashboard" className="dashboard-brand"><span className="brand-mark">F</span> FlashStudy</Link>
        <span className="sidebar-label">Workspace</span>
        <nav className="sidebar-nav" aria-label="Study navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className={item.href === "/doubts" ? "sidebar-link active" : "sidebar-link"} aria-current={item.href === "/doubts" ? "page" : undefined}>
              <span className="sidebar-icon" aria-hidden="true">{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom"><Link href="/settings" className="sidebar-link"><span className="sidebar-icon" aria-hidden="true">⚙</span>Settings</Link></div>
      </aside>

      <section className="doubts-main">
        <header className="doubts-header">
          <div>
            <p className="dashboard-kicker">Questions & answers</p>
            <h1>Your <em>doubts</em></h1>
            <p className="dashboard-subtitle">Save every question and answer so you can revisit, resolve, or delete it whenever you want.</p>
          </div>
          <Link href="/documents" className="dashboard-secondary-btn">View documents</Link>
        </header>
        <PageNavigation />

        <section className="doubt-ask-card">
          <div className="doubt-ask-copy">
            <span className="card-eyebrow">Ask a new doubt</span>
            <h2>What are you stuck on?</h2>
            <p>Ask from your study material and the answer will be saved automatically in your doubt history.</p>
          </div>
          <form onSubmit={askDoubt} className="doubt-form">
            <label htmlFor="doubt-question">Your question</label>
            <textarea id="doubt-question" value={question} onChange={(event) => { setQuestion(event.target.value); if (message) setMessage(""); }} placeholder="e.g. Explain normalization in DBMS using my Unit 3 notes." rows={4} disabled={submitting} />
            <div className="doubt-form-row">
              <label className="doubt-document-field">
                <span>Study material</span>
                <select value={selectedDocument} onChange={(event) => setSelectedDocument(event.target.value)} disabled={submitting}>
                  <option value="">All study material</option>
                  {documents.filter((document) => document.status === "ready").map((document) => (
                    <option key={document.id} value={document.id}>{document.original_filename}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className="dashboard-primary-btn" disabled={submitting}>{submitting ? "Saving..." : "Ask doubt"} <span>→</span></button>
            </div>
            {message && <p className="doubt-form-message" role="status">{message}</p>}
          </form>
        </section>

        <section className="doubt-history">
          <div className="doubt-history-heading">
            <div><span className="card-eyebrow">Saved questions</span><h2>Doubt history <span className="doubt-count">{doubts.length}</span></h2></div>
            <div className="doubt-filters" role="group" aria-label="Filter doubts">
              {(["all", "unresolved", "resolved"] as DoubtStatus[]).map((item) => (
                <button key={item} type="button" className={status === item ? "doubt-filter active" : "doubt-filter"} onClick={() => setStatus(item)}>
                  {item === "all" ? "All" : item === "unresolved" ? "Unresolved" : "Resolved"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="doubts-empty"><div className="empty-icon">…</div><h3>Loading your doubts</h3><p>Your saved questions are being loaded.</p></div>
          ) : filteredDoubts.length === 0 ? (
            <div className="doubts-empty">
              <div className="empty-icon">?</div>
              <h3>{doubts.length ? "No doubts in this filter" : "No saved doubts yet"}</h3>
              <p>{doubts.length ? "Try another filter to see your saved questions." : "Ask a question above and it will stay here for later revision until you delete it."}</p>
              {!doubts.length && <button type="button" className="dashboard-secondary-btn" onClick={() => document.getElementById("doubt-question")?.focus()}>Ask your first doubt</button>}
            </div>
          ) : (
            <div className="doubt-list">
              {filteredDoubts.map((doubt) => {
                const expanded = expandedId === doubt.id;
                return (
                  <article key={doubt.id} className={expanded ? "doubt-item expanded" : "doubt-item"}>
                    <button type="button" className="doubt-item-main" onClick={() => setExpandedId(expanded ? null : doubt.id)} aria-expanded={expanded}>
                      <span className={doubt.resolved ? "doubt-status resolved" : "doubt-status"}>{doubt.resolved ? "Resolved" : "Unresolved"}</span>
                      <strong>{doubt.question}</strong>
                      <span className="doubt-meta">{documentName(doubt.document_id)} · {new Date(doubt.created_at).toLocaleDateString()}</span>
                    </button>
                    <div className="doubt-item-actions">
                      <button type="button" className="doubt-action" onClick={() => toggleResolved(doubt)}>{doubt.resolved ? "Reopen" : "Resolve"}</button>
                      <button type="button" className="doubt-action danger" onClick={() => deleteDoubt(doubt.id)} disabled={deletingId === doubt.id}>{deletingId === doubt.id ? "Deleting..." : "Delete"}</button>
                    </div>
                    {expanded && (
                      <div className="doubt-answer">
                        <span className="card-eyebrow">Saved answer</span>
                        <p>{doubt.answer}</p>
                        {doubt.citations.length > 0 && (
                          <div className="doubt-citations">
                            <span className="card-eyebrow">Sources</span>
                            {doubt.citations.map((citation) => (
                              <div key={citation.content_unit_id} className="doubt-citation"><strong>{citation.source_label}</strong><span>{citation.snippet}</span></div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
