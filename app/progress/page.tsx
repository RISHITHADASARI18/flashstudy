"use client";

import Link from "next/link";
import PageNavigation from "../components/PageNavigation";

const navigation = [
  ["Dashboard", "/dashboard", "⌂"], ["Documents", "/documents", "▣"], ["Flashcards", "/flashcards", "◇"],
  ["Doubts", "/doubts", "?"], ["Quizzes", "/quizzes", "✓"], ["Progress", "/progress", "↗"],
];

export default function Page() {
  return (
    <main className="study-dashboard">
      <aside className="study-sidebar">
        <Link href="/dashboard" className="dashboard-brand"><span className="brand-mark">F</span> FlashStudy</Link>
        <span className="sidebar-label">Workspace</span>
        <nav className="sidebar-nav" aria-label="Study navigation">
          {navigation.map(([label, href, icon]) => <Link key={href} href={href} className={href === "/progress" ? "sidebar-link active" : "sidebar-link"}><span className="sidebar-icon">{icon}</span>{label}</Link>)}
        </nav>
        <div className="sidebar-bottom"><Link href="/settings" className="sidebar-link"><span className="sidebar-icon">⚙</span>Settings</Link></div>
      </aside>
      <section className="dashboard-main">
        <header className="dashboard-header"><div><p className="dashboard-kicker">Learning overview</p><h1>Your progress</h1><p className="dashboard-subtitle">Track study activity and areas to revisit</p></div></header>
        <PageNavigation />
        <section className="dashboard-card progress-page-card">
          <div className="card-heading"><div><span className="card-eyebrow">Learning overview</span><h2>Your progress</h2></div></div>
          <div className="progress-page-content">
            <div className="progress-page-ring" aria-label="0 percent progress"><span>0%</span></div>
            <div className="progress-page-copy">
              <h3>Your learning progress starts here.</h3>
              <p>Upload study material, ask doubts, and review flashcards. FlashStudy will use your saved study activity to build this progress view.</p>
              <div className="progress-page-actions"><Link href="/documents" className="dashboard-primary-btn">Upload material <span>→</span></Link><Link href="/flashcards" className="dashboard-secondary-btn">Review flashcards</Link></div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
