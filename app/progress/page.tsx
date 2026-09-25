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
          {navigation.map(([label, href, icon]) => <Link key={href} href={href} className={href === "/progress" ? "sidebar-link active" : "sidebar-link"}><span className="sidebar-icon">{icon}</span>{label}</Link>)}
        </nav>
        <div className="sidebar-bottom"><Link href="/settings" className={route === "settings" ? "sidebar-link active" : "sidebar-link"}><span className="sidebar-icon">⚙</span>Settings</Link></div>
      </aside>
      <section className="dashboard-main">
        <header className="dashboard-header"><div><p className="dashboard-kicker">Learning overview</p><h1>Your progress</h1><p className="dashboard-subtitle">Track study activity and areas to revisit</p></div></header>
        <section className="dashboard-card page-placeholder-card">
          <span className="card-eyebrow">Learning overview</span><h2>Your progress</h2>
          <p>This page is connected to the FlashStudy workspace. Its content can be built here without losing your navigation.</p>
          <div className="page-placeholder-actions"><Link href="/quizzes" className="dashboard-primary-btn">Back to quizzes <span>→</span></Link><Link href="/dashboard" className="dashboard-secondary-btn">Back to dashboard</Link></div>
        </section>
        <PageNavigation />
      </section>
    </main>
  );
}
