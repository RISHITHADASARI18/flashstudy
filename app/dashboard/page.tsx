import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import PageNavigation from "../components/PageNavigation";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: "⌂" },
  { label: "Documents", href: "/documents", icon: "▤" },
  { label: "Flashcards", href: "/flashcards", icon: "◇" },
  { label: "Doubts", href: "/doubts", icon: "?" },
  { label: "Quizzes", href: "/quizzes", icon: "✓" },
  { label: "Progress", href: "/progress", icon: "↗" },
];

export default async function DashboardPage() {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const user = clerkEnabled ? await currentUser() : null;
  const firstName = user?.firstName || "there";
  const email = user?.emailAddresses[0]?.emailAddress || "Authentication will be connected before launch";

  return (
    <main className="study-dashboard">
      <aside className="study-sidebar">
        <a className="dashboard-brand" href="/"><span className="brand-mark">F</span><span>FlashStudy</span></a>
        <div className="sidebar-label">Study</div>
        <nav className="sidebar-nav" aria-label="Study navigation">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} className={item.href === "/dashboard" ? "sidebar-link active" : "sidebar-link"} aria-current={item.href === "/dashboard" ? "page" : undefined}>
              <span className="sidebar-icon" aria-hidden="true">{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a className="sidebar-link" href="/settings"><span className="sidebar-icon" aria-hidden="true">⚙</span>Settings</a>
          <div className="sidebar-user">
            {clerkEnabled ? <UserButton /> : <div className="brand-mark">F</div>}
            <div className="sidebar-user-copy"><strong>{firstName}</strong><span>{email}</span></div>
          </div>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-kicker">Your study space</p>
            <h1>Hey {firstName}, <em>let&apos;s learn.</em></h1>
            <p className="dashboard-subtitle">Everything you study in one place. Upload your material to get started.</p>
          </div>
          <div className="dashboard-header-actions">
            <a className="dashboard-secondary-btn" href="/documents">My documents</a>
            <a className="dashboard-primary-btn" href="/documents?upload=true"><span>+</span> Upload PDF</a>
          </div>
        </header>
        <PageNavigation />

        <section className="dashboard-grid" aria-label="Study overview">
          <article className="dashboard-card dashboard-card-large">
            <div className="card-heading"><div><span className="card-eyebrow">Your library</span><h2>Documents</h2></div><a href="/documents" className="card-link">View all <span>→</span></a></div>
            <div className="empty-state">
              <div className="empty-icon">▤</div><h3>No study material yet</h3>
              <p>Upload a PDF and FlashStudy can turn it into notes, flashcards, quizzes, and grounded answers.</p>
              <a className="dashboard-primary-btn" href="/documents?upload=true">Upload your first PDF <span>→</span></a>
            </div>
          </article>

          <article className="dashboard-card">
            <div className="card-heading"><div><span className="card-eyebrow">Review</span><h2>Flashcards due</h2></div><a href="/flashcards" className="card-link">Open <span>→</span></a></div>
            <div className="metric-empty"><strong>—</strong><span>Nothing to review yet</span></div>
          </article>

          <article className="dashboard-card">
            <div className="card-heading"><div><span className="card-eyebrow">Questions</span><h2>Doubts</h2></div><a href="/doubts" className="card-link">View all <span>→</span></a></div>
            <div className="metric-empty"><strong>—</strong><span>Your saved doubts will appear here</span></div>
          </article>

          <article className="dashboard-card dashboard-card-wide">
            <div className="card-heading"><div><span className="card-eyebrow">Learning</span><h2>Progress</h2></div><a href="/progress" className="card-link">Details <span>→</span></a></div>
            <div className="progress-empty"><div className="progress-ring"><span>0%</span></div><div><h3>Your progress starts with your first document.</h3><p>Once you study, FlashStudy will keep your review and learning progress here.</p></div></div>
          </article>

          <article className="dashboard-card dashboard-card-wide">
            <div className="card-heading"><div><span className="card-eyebrow">Next step</span><h2>Build your study set</h2></div></div>
            <div className="dashboard-steps">
              <div className="dashboard-step"><span>01</span><div><strong>Upload</strong><p>Add a lecture PDF, notes, or study material.</p></div></div>
              <div className="dashboard-step"><span>02</span><div><strong>Understand</strong><p>Ask questions and review material with context.</p></div></div>
              <div className="dashboard-step"><span>03</span><div><strong>Remember</strong><p>Turn what you learned into flashcards and quizzes.</p></div></div>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
