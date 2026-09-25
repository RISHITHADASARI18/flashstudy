"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import PageNavigation from "../components/PageNavigation";

type Card = {
  id: number;
  subject: string;
  question: string;
  answer: string;
  difficulty: "Easy" | "Medium" | "Hard";
};

const sampleCards: Card[] = [
  {
    id: 1,
    subject: "DBMS",
    question: "What is a primary key?",
    answer: "A primary key is a column or set of columns that uniquely identifies each row in a table. It cannot contain duplicate or NULL values.",
    difficulty: "Easy",
  },
  {
    id: 2,
    subject: "Java",
    question: "What is method overloading?",
    answer: "Method overloading allows a class to have multiple methods with the same name but different parameter lists.",
    difficulty: "Medium",
  },
  {
    id: 3,
    subject: "Computer Networks",
    question: "What does DNS do?",
    answer: "DNS translates human-readable domain names into IP addresses so devices can locate services on a network.",
    difficulty: "Easy",
  },
];

const subjects = ["All subjects", "DBMS", "Java", "Computer Networks"];

export default function FlashcardsPage() {
  const [cards, setCards] = useState(sampleCards);
  const [subject, setSubject] = useState("All subjects");
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewed, setReviewed] = useState<Record<number, string>>({});

  const filteredCards = useMemo(
    () => subject === "All subjects" ? cards : cards.filter((card) => card.subject === subject),
    [cards, subject],
  );

  const currentCard = filteredCards[index] ?? filteredCards[0];
  const reviewedCount = Object.keys(reviewed).length;

  function changeSubject(value: string) {
    setSubject(value);
    setIndex(0);
    setShowAnswer(false);
  }

  function goToCard(nextIndex: number) {
    if (!filteredCards.length) return;
    setIndex((nextIndex + filteredCards.length) % filteredCards.length);
    setShowAnswer(false);
  }

  function reviewCard(rating: string) {
    if (!currentCard) return;
    setReviewed((previous) => ({ ...previous, [currentCard.id]: rating }));
    setShowAnswer(false);
    if (filteredCards.length > 1) {
      const nextIndex = (index + 1) % filteredCards.length;
      setIndex(nextIndex);
    }
  }

  function removeCard() {
    if (!currentCard) return;
    const remaining = cards.filter((card) => card.id !== currentCard.id);
    setCards(remaining);
    setIndex(0);
    setShowAnswer(false);
  }

  return (
    <main className="study-dashboard">
      <aside className="study-sidebar">
        <Link href="/dashboard" className="dashboard-brand"><span className="brand-mark">F</span> FlashStudy</Link>
        <span className="sidebar-label">Workspace</span>
        <nav className="sidebar-nav" aria-label="Study navigation">
          {[
            ["Dashboard", "/dashboard", "⌂"],
            ["Documents", "/documents", "▣"],
            ["Doubts", "/doubts", "?"],
            ["Flashcards", "/flashcards", "◇"],
            ["Quizzes", "/quizzes", "✓"],
            ["Progress", "/progress", "↗"],
          ].map(([label, href, icon]) => (
            <Link key={href} href={href} className={href === "/flashcards" ? "sidebar-link active" : "sidebar-link"}>
              <span className="sidebar-icon">{icon}</span>{label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/settings" className="sidebar-link"><span className="sidebar-icon">⚙</span>Settings</Link>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-kicker">Review</p>
            <h1>Your <em>flashcards</em></h1>
            <p className="dashboard-subtitle">Review your study cards, reveal answers, and track how each card feels.</p>
          </div>
        </header>

        <PageNavigation />

        <section className="flashcards-toolbar">
          <div>
            <span className="card-eyebrow">Study set</span>
            <strong>{filteredCards.length} cards</strong>
            <span className="flashcards-reviewed">{reviewedCount} reviewed</span>
          </div>
          <label className="flashcards-filter">
            <span>Subject</span>
            <select value={subject} onChange={(event) => changeSubject(event.target.value)}>
              {subjects.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </section>

        {currentCard ? (
          <section className="flashcard-workspace">
            <div className="flashcard-counter">Card {index + 1} of {filteredCards.length}</div>
            <button type="button" className="flashcard" onClick={() => setShowAnswer((value) => !value)} aria-label={showAnswer ? "Show question" : "Reveal answer"}>
              <span className="flashcard-subject">{currentCard.subject} · {currentCard.difficulty}</span>
              <span className="flashcard-label">{showAnswer ? "Answer" : "Question"}</span>
              <strong>{showAnswer ? currentCard.answer : currentCard.question}</strong>
              <span className="flashcard-hint">{showAnswer ? "Click to see the question" : "Click the card to reveal the answer"}</span>
            </button>

            <div className="flashcard-controls">
              <button type="button" className="flashcard-secondary" onClick={() => goToCard(index - 1)}>← Previous</button>
              <div className="review-actions">
                <button type="button" className="review-again" onClick={() => reviewCard("Again")}>Again</button>
                <button type="button" className="review-hard" onClick={() => reviewCard("Hard")}>Hard</button>
                <button type="button" className="review-good" onClick={() => reviewCard("Good")}>Good</button>
                <button type="button" className="review-easy" onClick={() => reviewCard("Easy")}>Easy</button>
              </div>
              <button type="button" className="flashcard-secondary" onClick={() => goToCard(index + 1)}>Next →</button>
            </div>

            <div className="flashcard-footer">
              <span>Reviewed ratings are kept for this session.</span>
              <button type="button" className="flashcard-remove" onClick={removeCard}>Remove card</button>
            </div>
          </section>
        ) : (
          <section className="dashboard-card flashcards-empty">
            <div className="empty-icon">◇</div>
            <h2>No flashcards yet</h2>
            <p>Generate cards from your uploaded study material or saved doubts. Your generated cards will appear here.</p>
            <Link href="/documents" className="dashboard-primary-btn">Open documents <span>→</span></Link>
          </section>
        )}
      </section>
    </main>
  );
}
