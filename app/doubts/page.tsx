"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import PageNavigation from "../components/PageNavigation";

type DoubtStatus = "all" | "unresolved" | "resolved";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: "⌂" },
  { label: "Documents", href: "/documents", icon: "▣" },
  { label: "Doubts", href: "/doubts", icon: "?" },
  { label: "Flashcards", href: "/flashcards", icon: "◇" },
  { label: "Quizzes", href: "/quizzes", icon: "✓" },
  { label: "Progress", href: "/progress", icon: "↗" },
];

export default function DoubtsPage() {
  const [status, setStatus] = useState<DoubtStatus>("all");
  const [question, setQuestion] = useState("");
  const [selectedDocument, setSelectedDocument] = useState("");
  const [message, setMessage] = useState("");

  const askDoubt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!question.trim()) {
      setMessage("Write your question first.");
      return;
    }

    if (!API_URL) {
      setMessage("Your question is ready, but the backend is not connected yet. Once NEXT_PUBLIC_API_URL is configured, this form will submit and save the doubt.");
      return;
    }

    setMessage("Submitting your doubt...");
    try {
      const response = await fetch(`${API_URL}/api/v1/doubts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          document_id: selectedDocument || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.detail || "Could not save your doubt.");
      }

      setQuestion("");
      setMessage("Doubt saved. Your answer will appear in the doubt history.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  return (
    <main className="doubts-page">
      <aside className="study-sidebar">
        <Link href="/dashboard" className="dashboard-brand">
          <span className="brand-mark">F</span> FlashStudy
        </Link>
        <span className="sidebar-label">Workspace</span>
        <nav className="sidebar-nav" aria-label="Study navigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={item.href === "/doubts" ? "sidebar-link active" : "sidebar-link"}
              aria-current={item.href === "/doubts" ? "page" : undefined}
            >
              <span className="sidebar-icon" aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/settings" className="sidebar-link">
            <span className="sidebar-icon" aria-hidden="true">⚙</span>Settings
          </Link>
        </div>
      </aside>

      <section className="doubts-main">
        <header className="doubts-header">
          <div>
            <p className="dashboard-kicker">Questions & answers</p>
            <h1>Your <em>doubts</em></h1>
            <p className="dashboard-subtitle">
              Ask questions about your study material and keep every answer available for later revision.
            </p>
          </div>
          <Link href="/documents" className="dashboard-secondary-btn">View documents</Link>
        </header>
        <PageNavigation />

        <section className="doubt-ask-card">
          <div className="doubt-ask-copy">
            <span className="card-eyebrow">Ask a new doubt</span>
            <h2>What are you stuck on?</h2>
            <p>
              Select a document when you want your answer grounded in a specific PDF. Page citations will be shown with the answer once the backend is connected.
            </p>
          </div>

          <form onSubmit={askDoubt} className="doubt-form">
            <label htmlFor="doubt-question">Your question</label>
            <textarea
              id="doubt-question"
              value={question}
              onChange={(event) => {
                setQuestion(event.target.value);
                if (message) setMessage("");
              }}
              placeholder="e.g. Explain normalization in DBMS using my Unit 3 notes."
              rows={4}
            />

            <div className="doubt-form-row">
              <label className="doubt-document-field">
                <span>Study material</span>
                <select value={selectedDocument} onChange={(event) => setSelectedDocument(event.target.value)}>
                  <option value="">Choose a document later</option>
                </select>
              </label>

              <button type="submit" className="dashboard-primary-btn">
                Ask doubt <span>→</span>
              </button>
            </div>

            {message && (
              <p className="doubt-form-message" role="status">{message}</p>
            )}
          </form>
        </section>

        <section className="doubt-history">
          <div className="doubt-history-heading">
            <div>
              <span className="card-eyebrow">Saved questions</span>
              <h2>Doubt history</h2>
            </div>
            <div className="doubt-filters" role="group" aria-label="Filter doubts">
              {(["all", "unresolved", "resolved"] as DoubtStatus[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={status === item ? "doubt-filter active" : "doubt-filter"}
                  onClick={() => setStatus(item)}
                >
                  {item === "all" ? "All" : item === "unresolved" ? "Unresolved" : "Resolved"}
                </button>
              ))}
            </div>
          </div>

          <div className="doubts-empty">
            <div className="empty-icon">?</div>
            <h3>No saved doubts yet</h3>
            <p>
              Your questions and their answers will stay here so you can revisit unresolved doubts,
              review page citations, and continue learning later.
            </p>
            <button
              type="button"
              className="dashboard-secondary-btn"
              onClick={() => document.getElementById("doubt-question")?.focus()}
            >
              Ask your first doubt
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
