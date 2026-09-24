import Link from "next/link";

export default function DocumentsPage() {
  return (
    <main className="documents-page">
      <aside className="study-sidebar">
        <Link href="/dashboard" className="dashboard-brand"><span className="brand-mark">F</span> FlashStudy</Link>
        <span className="sidebar-label">Workspace</span>
        <nav className="sidebar-nav">
          <Link href="/dashboard" className="sidebar-link"><span className="sidebar-icon">⌂</span>Dashboard</Link>
          <Link href="/documents" className="sidebar-link active"><span className="sidebar-icon">▣</span>Documents</Link>
          <Link href="/doubts" className="sidebar-link"><span className="sidebar-icon">?</span>Doubts</Link>
          <Link href="/flashcards" className="sidebar-link"><span className="sidebar-icon">▤</span>Flashcards</Link>
          <Link href="/quizzes" className="sidebar-link"><span className="sidebar-icon">✓</span>Quizzes</Link>
          <Link href="/progress" className="sidebar-link"><span className="sidebar-icon">↗</span>Progress</Link>
        </nav>
        <div className="sidebar-bottom">
          <Link href="/settings" className="sidebar-link"><span className="sidebar-icon">⚙</span>Settings</Link>
        </div>
      </aside>

      <section className="documents-main">
        <header className="documents-header">
          <div>
            <p className="dashboard-kicker">Study library</p>
            <h1>Your <em>documents</em></h1>
            <p className="dashboard-subtitle">Keep your study material in one place. Upload filess, documents, slides, text files, or images and we’ll process them into study tools.</p>
          </div>
          <Link href="/documents?upload=true#upload" className="dashboard-primary-btn">+ Upload PDF</Link>
        </header>

        <section id="upload" className="upload-card">
          <div className="upload-icon">↑</div>
          <div>
            <p className="card-eyebrow">Add study material</p>
            <h2>Upload study material</h2>
            <p>Choose one or more supported files. The upload control is prepared for the storage, extraction, and AI backend.</p>
          </div>
          <label className="upload-select">
            <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.jpg,.jpeg,.png,.webp" multiple />
            Choose files
          </label>
          <small>PDF · DOCX · PPTX · TXT · MD · JPG · PNG · WEBP · Processing will be connected with the backend</small>
        </section>

        <section className="documents-section">
          <div className="card-heading">
            <div><span className="card-eyebrow">Library</span><h2>My documents</h2></div>
          </div>
          <div className="documents-empty">
            <div className="empty-icon">▣</div>
            <h3>No documents yet</h3>
            <p>Your uploaded study material will appear here with processing status and links to notes, doubts, flashcards, and quizzes.</p>
            <a href="#upload" className="dashboard-secondary-btn">Upload your first file</a>
          </div>
        </section>
      </section>
    </main>
  );
}
