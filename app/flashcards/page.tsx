"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PageNavigation from "../components/PageNavigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

type Document = { id: string; original_filename: string; status: string };
type Card = {
  id: string;
  document_id: string | null;
  source_label: string | null;
  question: string;
  answer: string;
  difficulty: "Easy" | "Medium" | "Hard";
  review_rating: string | null;
  review_count: number;
  next_review_at: string | null;
};

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentId, setDocumentId] = useState("all");
  const [count, setCount] = useState("10");
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  const filteredCards = useMemo(
    () => documentId === "all" ? cards : cards.filter((card) => card.document_id === documentId),
    [cards, documentId],
  );
  const currentCard = filteredCards[index] ?? null;
  const reviewedCount = filteredCards.filter((card) => card.review_rating).length;
  const documentName = (id: string | null) => documents.find((doc) => doc.id === id)?.original_filename ?? "Study material";

  useEffect(() => {
    async function load() {
      if (!API_URL) {
        setMessage("Backend URL is not configured yet.");
        setLoading(false);
        return;
      }
      try {
        const [cardsResponse, docsResponse] = await Promise.all([
          fetch(API_URL + "/api/v1/flashcards"),
          fetch(API_URL + "/api/v1/documents"),
        ]);
        if (!cardsResponse.ok || !docsResponse.ok) throw new Error("Could not load your study data.");
        setCards(await cardsResponse.json());
        setDocuments(await docsResponse.json());
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not load flashcards.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function changeDocument(value: string) {
    setDocumentId(value);
    setIndex(0);
    setShowAnswer(false);
  }

  function move(step: number) {
    if (!filteredCards.length) return;
    setIndex((index + step + filteredCards.length) % filteredCards.length);
    setShowAnswer(false);
  }

  async function generateCards() {
    if (!API_URL || documentId === "all") {
      setMessage("Choose a processed document before generating flashcards.");
      return;
    }
    setGenerating(true);
    setMessage("");
    try {
      const response = await fetch(API_URL + "/api/v1/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: documentId, count: Number(count) }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail || "Flashcard generation failed.");
      setCards((previous) => [...data.cards, ...previous]);
      setDocumentId(documentId);
      setIndex(0);
      setShowAnswer(false);
      setMessage(data.created + " flashcards generated and saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Flashcard generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function review(rating: string) {
    if (!API_URL || !currentCard) return;
    try {
      const response = await fetch(API_URL + "/api/v1/flashcards/" + currentCard.id + "/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      if (!response.ok) throw new Error("Could not save this review.");
      const updated: Card = await response.json();
      setCards((previous) => previous.map((card) => card.id === updated.id ? updated : card));
      setShowAnswer(false);
      if (filteredCards.length > 1) setIndex((index + 1) % filteredCards.length);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save this review.");
    }
  }

  async function removeCard() {
    if (!API_URL || !currentCard) return;
    try {
      const response = await fetch(API_URL + "/api/v1/flashcards/" + currentCard.id, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not remove the flashcard.");
      setCards((previous) => previous.filter((card) => card.id !== currentCard.id));
      setIndex(0);
      setShowAnswer(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove the flashcard.");
    }
  }

  return (
    <main className="study-dashboard">
      <aside className="study-sidebar">
        <Link href="/dashboard" className="dashboard-brand"><span className="brand-mark">F</span> FlashStudy</Link>
        <span className="sidebar-label">Workspace</span>
        <nav className="sidebar-nav" aria-label="Study navigation">
          {[["Dashboard","/dashboard","⌂"],["Documents","/documents","▣"],["Doubts","/doubts","?"],["Flashcards","/flashcards","◇"],["Quizzes","/quizzes","✓"],["Progress","/progress","↗"]].map(([label, href, icon]) =>
            <Link key={href} href={href} className={href === "/flashcards" ? "sidebar-link active" : "sidebar-link"}><span className="sidebar-icon">{icon}</span>{label}</Link>
          )}
        </nav>
        <div className="sidebar-bottom"><Link href="/settings" className="sidebar-link"><span className="sidebar-icon">⚙</span>Settings</Link></div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-kicker">Review</p>
            <h1>Your <em>flashcards</em></h1>
            <p className="dashboard-subtitle">Generate cards from your processed study material, review them, and keep your progress saved.</p>
          </div>
        </header>

        <PageNavigation />

        <section className="flashcards-toolbar">
          <div>
            <span className="card-eyebrow">Saved study cards</span>
            <strong>{filteredCards.length} cards</strong>
            <span className="flashcards-reviewed">{reviewedCount} reviewed</span>
          </div>
          <div className="flashcards-generator">
            <label className="flashcards-filter"><span>Document</span>
              <select value={documentId} onChange={(event) => changeDocument(event.target.value)}>
                <option value="all">All documents</option>
                {documents.filter((doc) => doc.status === "ready").map((doc) => <option key={doc.id} value={doc.id}>{doc.original_filename}</option>)}
              </select>
            </label>
            <label className="flashcards-filter"><span>Cards</span>
              <select value={count} onChange={(event) => setCount(event.target.value)}>
                {[5,10,15,20,30].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <button type="button" className="dashboard-primary-btn" onClick={generateCards} disabled={generating || documentId === "all"}>
              {generating ? "Generating..." : "Generate flashcards"}
            </button>
          </div>
        </section>

        {message && <p className="doubt-form-message" role="status">{message}</p>}

        {loading ? (
          <section className="dashboard-card flashcards-empty"><h2>Loading your flashcards...</h2><p>Fetching your saved cards and processed documents.</p></section>
        ) : currentCard ? (
          <section className="flashcard-workspace">
            <div className="flashcard-counter">Card {index + 1} of {filteredCards.length}</div>
            <button type="button" className="flashcard" onClick={() => setShowAnswer((value) => !value)}>
              <span className="flashcard-subject">{documentName(currentCard.document_id)} · {currentCard.difficulty}</span>
              <span className="flashcard-label">{showAnswer ? "Answer" : "Question"}</span>
              <strong>{showAnswer ? currentCard.answer : currentCard.question}</strong>
              <span className="flashcard-hint">{showAnswer ? "Click to return to the question" : "Click to reveal the answer"}</span>
            </button>

            <div className="flashcard-controls">
              <button type="button" className="flashcard-secondary" onClick={() => move(-1)}>← Previous</button>
              <div className="review-actions">
                <button type="button" className="review-again" onClick={() => review("Again")}>Again</button>
                <button type="button" className="review-hard" onClick={() => review("Hard")}>Hard</button>
                <button type="button" className="review-good" onClick={() => review("Good")}>Good</button>
                <button type="button" className="review-easy" onClick={() => review("Easy")}>Easy</button>
              </div>
              <button type="button" className="flashcard-secondary" onClick={() => move(1)}>Next →</button>
            </div>

            <div className="flashcard-footer">
              <span>{currentCard.source_label ? "Source: " + currentCard.source_label : "Source: uploaded study material"} · Reviewed {currentCard.review_count} time{currentCard.review_count === 1 ? "" : "s"}</span>
              <button type="button" className="flashcard-remove" onClick={removeCard}>Remove card</button>
            </div>
          </section>
        ) : (
          <section className="dashboard-card flashcards-empty">
            <div className="empty-icon">◇</div>
            <h2>No saved flashcards yet</h2>
            <p>Upload and process a document, select it above, then generate flashcards. Generated cards are saved to your account so reviews remain available later.</p>
            <Link href="/documents" className="dashboard-primary-btn">Open documents <span>→</span></Link>
          </section>
        )}
      </section>
    </main>
  );
}
