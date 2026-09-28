"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PageNavigation from "../components/PageNavigation";

const API_URL = `${(process.env.NEXT_PUBLIC_API_URL || "https://flashstudy-backend.onrender.com").replace(/\/$/, "")}/api`;

type Quiz = {
  id: string;
  document_id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: string;
  source_label: string | null;
};

export default function Page() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [documents, setDocuments] = useState<{id:string; original_filename:string}[]>([]);
  const [documentId, setDocumentId] = useState("all");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("document");
    if (query) setDocumentId(query);

    async function load() {
      try {
        const [quizResponse, docResponse] = await Promise.all([
          fetch(`${API_URL}/v1/quizzes`),
          fetch(`${API_URL}/v1/documents`),
        ]);
        if (!quizResponse.ok || !docResponse.ok) throw new Error("Could not load your quizzes.");
        setQuizzes(await quizResponse.json());
        setDocuments(await docResponse.json());
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not load quizzes.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(
    () => documentId === "all" ? quizzes : quizzes.filter((quiz) => quiz.document_id === documentId),
    [quizzes, documentId],
  );
  const current = filtered[index] ?? null;

  const choose = (option: string) => {
    if (!current || selected) return;
    setSelected(option);
  };

  const move = (step: number) => {
    if (!filtered.length) return;
    setIndex((index + step + filtered.length) % filtered.length);
    setSelected(null);
  };

  const documentName = (id: string) => documents.find((doc) => doc.id === id)?.original_filename || "Study material";

  return (
    <main className="study-dashboard">
      <aside className="study-sidebar">
        <Link href="/dashboard" className="dashboard-brand"><span className="brand-mark">F</span> FlashStudy</Link>
        <span className="sidebar-label">Workspace</span>
        <nav className="sidebar-nav">
          <Link href="/dashboard" className="sidebar-link"><span className="sidebar-icon">⌂</span>Dashboard</Link>
          <Link href="/documents" className="sidebar-link"><span className="sidebar-icon">▣</span>Documents</Link>
          <Link href="/flashcards" className="sidebar-link"><span className="sidebar-icon">▤</span>Flashcards</Link>
          <Link href="/doubts" className="sidebar-link"><span className="sidebar-icon">?</span>Doubts</Link>
          <Link href="/quizzes" className="sidebar-link active"><span className="sidebar-icon">✓</span>Quizzes</Link>
          <Link href="/progress" className="sidebar-link"><span className="sidebar-icon">↗</span>Progress</Link>
        </nav>
        <div className="sidebar-bottom"><Link href="/settings" className="sidebar-link"><span className="sidebar-icon">⚙</span>Settings</Link></div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-kicker">Practice</p>
            <h1>Your <em>quizzes</em></h1>
            <p className="dashboard-subtitle">Answer AI-generated multiple-choice questions from your own study material.</p>
          </div>
        </header>

        <PageNavigation />

        {message && <p className="doubt-form-message" role="alert">{message}</p>}

        {loading ? (
          <section className="dashboard-card page-placeholder-card"><h2>Loading your quizzes...</h2><p>Fetching your saved AI-generated questions.</p></section>
        ) : current ? (
          <section className="flashcard-workspace">
            <div className="flashcard-counter">Question {index + 1} of {filtered.length}</div>
            <div className="flashcard">
              <span className="flashcard-subject">{documentName(current.document_id)} · {current.difficulty}</span>
              <span className="flashcard-label">Quiz</span>
              <strong>{current.question}</strong>
              <div className="quiz-options">
                {current.options.map((option) => {
                  const isCorrect = option === current.correct_answer;
                  const isSelected = option === selected;
                  const className = selected
                    ? isCorrect ? "quiz-option quiz-option-correct" : isSelected ? "quiz-option quiz-option-wrong" : "quiz-option"
                    : "quiz-option";
                  return <button key={option} type="button" className={className} onClick={() => choose(option)}>{option}</button>;
                })}
              </div>
              {selected && (
                <div className="quiz-explanation">
                  <strong>{selected === current.correct_answer ? "Correct!" : "Not quite."}</strong>
                  <p>{current.explanation}</p>
                  <small>Source: {current.source_label || "uploaded study material"}</small>
                </div>
              )}
            </div>
            <div className="flashcard-controls">
              <button type="button" className="flashcard-secondary" onClick={() => move(-1)}>← Previous</button>
              <span>{selected ? "Answer checked" : "Choose an answer"}</span>
              <button type="button" className="flashcard-secondary" onClick={() => move(1)}>Next →</button>
            </div>
          </section>
        ) : (
          <section className="dashboard-card page-placeholder-card">
            <div className="empty-icon">✓</div>
            <h2>No quizzes yet</h2>
            <p>Select a PDF, Word document, or PowerPoint on Documents and press Generate. AI-generated quizzes will appear here.</p>
            <Link href="/documents" className="dashboard-primary-btn">Generate from a document →</Link>
          </section>
        )}
      </section>
    </main>
  );
}
