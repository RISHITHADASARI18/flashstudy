"use client";

import Link from "next/link";
import PageNavigation from "../components/PageNavigation";

const navigation = [
  ["Dashboard", "/dashboard", "⌂"], ["Documents", "/documents", "▣"], ["Doubts", "/doubts", "?"],
  ["Flashcards", "/flashcards", "◇"], ["Quizzes", "/quizzes", "✓"], ["Progress", "/progress", "↗"],
];

export default function FlashcardsPage() {
  return (
    <main className="study-dashboard">
      <aside className="study-sidebar">
        <Link href="/dashboard" className="dashboard-brand"><span className="brand-mark">F</span> FlashStudy</Link>
        <span className="sidebar-label">Workspace</span>
        <nav className="sidebar-nav" aria-label="Study navigation">
          {navigation.map(([label, href, icon]) => <Link key={href} href={href} className={href === "/flashcards" ? "sidebar-link active" : "sidebar-link"}><span className="sidebar-icon">{icon}</span>{label}</Link>)}
        </nav>
        <div className="sidebar-bottom"><Link href="/settings" className="sidebar-link"><span className="sidebar-icon">⚙</span>Settings</Link></div>
      </aside>
      <section className="dashboard-main">
        <header className="dashboard-header"><div><p className="dashboard-kicker">Review</p><h1>Your <em>flashcards</em></h1><p className="dashboard-subtitle">Review generated cards and remember what you study.</p></div></header>
        <PageNavigation />
        <section className="dashboard-card page-placeholder-card">
          <span className="card-eyebrow">Review</span><h2>Your flashcards</h2>
          <p>This page is connected to the FlashStudy workspace. Generated flashcards will live here and can be reviewed without losing your navigation.</p>
          <div className="page-placeholder-actions"><Link href="/quizzes" className="dashboard-primary-btn">Take a quiz <span>→</span></Link><Link href="/doubts" className="dashboard-secondary-btn">Back to doubts</Link></div>
        </section>
      </section>
    </main>
  );
}
