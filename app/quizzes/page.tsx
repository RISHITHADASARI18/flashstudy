"use client";

import Link from "next/link";
import PageNavigation from "../components/PageNavigation";

const navigation = [
  ["Dashboard", "/dashboard", "⌂"], ["Documents", "/documents", "▣"], ["Doubts", "/doubts", "?"],
  ["Flashcards", "/flashcards", "◇"], ["Quizzes", "/quizzes", "✓"], ["Progress", "/progress", "↗"],
];

export default function Page() {
  return (
    <main className="study-dashboard">
      <aside className="study-sidebar">
        <Link href="/dashboard" className="dashboard-brand"><span className="brand-mark">F</span> FlashStudy</Link>
        <span className="sidebar-label">Workspace</span>
        <nav className="sidebar-nav" aria-label="Study navigation">
          {navigation.map(([label, href, icon]) => <Link key={href} href={href} className={href === "/quizzes" ? "sidebar-link active" : "sidebar-link"}><span className="sidebar-icon">{icon}</span>{label}</Link>)}
        </nav>
        <div className="sidebar-bottom"><Link href="/settings" className={route === "settings" ? "sidebar-link active" : "sidebar-link"}><span className="sidebar-icon">⚙</span>Settings</Link></div>
      </aside>
      <section className="dashboard-main">
        <header className="dashboard-header"><div><p className="dashboard-kicker">Practice</p><h1>Your quizzes</h1><p className="dashboard-subtitle">Practice with quizzes from your study material</p></div></header>
        <section className="dashboard-card page-placeholder-card">
          <span className="card-eyebrow">Practice</span><h2>Your quizzes</h2>
          <p>This page is connected to the FlashStudy workspace. Its content can be built here without losing your navigation.</p>
          <div className="page-placeholder-actions"><Link href="/progress" className="dashboard-primary-btn">Open progress <span>→</span></Link><Link href="/flashcards" className="dashboard-secondary-btn">Back to flashcards</Link></div>
        </section>
        <PageNavigation />
      </section>
    </main>
  );
}
