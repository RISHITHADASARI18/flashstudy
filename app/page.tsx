const features = [
  { icon: "✦", title: "Smart notes", text: "Turn long PDFs into focused, easy-to-review notes." },
  { icon: "◇", title: "Flashcards", text: "Create active-recall cards from the material you actually study." },
  { icon: "?", title: "Ask doubts", text: "Ask questions and get answers grounded in your study material." },
  { icon: "↗", title: "Keep your progress", text: "Save doubts and study activity so you can pick up where you left off." },
];

export default function Home() {
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="#"><span className="brand-mark">F</span> FlashStudy</a>
        <div className="nav-links"><a href="#features">Features</a><a href="#how">How it works</a></div>
        <div className="nav-actions"><a className="login" href="/login">Log in</a><a className="dashboard-nav-btn" href="/dashboard">Dashboard</a><a className="nav-cta" href="/signup">Get started <span>→</span></a></div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse"></span> Your study material, made useful</div>
          <h1>Study less scattered.<br/><em>Learn more clearly.</em></h1>
          <p className="hero-text">Upload your PDFs and turn them into notes, flashcards, and answers to your doubts — all in one focused study space.</p>
          <div className="hero-actions"><a className="primary-btn" href="/signup">Start studying free <span>→</span></a><a className="text-btn" href="#how">See how it works <span>↓</span></a></div>
          <div className="trust"><span className="avatars"><i>✦</i><i>F</i><i>+</i></span><span>Built for students who want to understand, not just memorize.</span></div>
        </div>

        <div className="hero-visual">
          <div className="glow"></div>
          <div className="app-window">
            <div className="window-top"><span className="dots"><b></b><b></b><b></b></span><span className="window-title">FlashStudy</span><span className="window-menu">•••</span></div>
            <div className="window-body">
              <aside><div className="mini-logo">F</div><div className="side-active">⌂ <span>Dashboard</span></div><div>▤ <span>Documents</span></div><div>◇ <span>Flashcards</span></div><div>? <span>Doubts</span></div></aside>
              <div className="dash">
                <div className="dash-head"><div><small>Good evening</small><h3>Ready to learn?</h3></div><div className="profile">R</div></div>
                <div className="study-card"><div><span className="file-icon">PDF</span><div><strong>Computer Networks — Unit 3</strong><small>42 pages · Uploaded today</small></div></div><span className="open">Open →</span></div>
                <div className="mini-grid"><div className="stat-card"><small>Notes</small><strong>12</strong><span>from your PDFs</span></div><div className="stat-card"><small>Flashcards</small><strong>36</strong><span>ready to review</span></div></div>
                <div className="answer-card"><div className="answer-top"><span className="spark">✦</span><strong>Ask a doubt</strong><span className="source">Source · p. 18</span></div><p>“What is the difference between TCP and UDP?”</p><div className="answer-line"><span></span><span></span><span></span></div></div>
              </div>
            </div>
          </div>
          <div className="float-card notes-float"><span>✦</span><div><strong>Notes generated</strong><small>Ready to review</small></div></div>
          <div className="float-card flash-float"><span>◇</span><div><strong>8 cards ready</strong><small>Keep your streak going</small></div></div>
        </div>
      </section>

      <section className="feature-strip" id="features">
        <div className="section-label">Everything you need to study with your material</div>
        <div className="features">{features.map((f) => <article className="feature" key={f.title}><span className="feature-icon">{f.icon}</span><h3>{f.title}</h3><p>{f.text}</p></article>)}</div>
      </section>

      <section className="how" id="how">
        <div className="how-intro"><div className="eyebrow">A simpler study loop</div><h2>From PDF to <em>progress.</em></h2><p>No jumping between five different tools. Bring your material in, work with it, and keep what you learn.</p></div>
        <div className="steps"><div className="step"><span>01</span><div><h3>Upload</h3><p>Bring in the notes, slides, or PDFs you already use.</p></div></div><div className="step"><span>02</span><div><h3>Understand</h3><p>Generate notes, ask doubts, and explore the material.</p></div></div><div className="step"><span>03</span><div><h3>Remember</h3><p>Turn key ideas into flashcards and come back for review.</p></div></div></div>
      </section>

      <section className="cta"><div><div className="eyebrow light">Your next study session starts here</div><h2>Make your PDFs work <em>for you.</em></h2><p>One calm workspace for the material you need to master.</p></div><a className="light-btn" href="/signup">Create your account <span>→</span></a></section>

      <footer><a className="brand" href="#"><span className="brand-mark">F</span> FlashStudy</a><span>Study smarter. One document at a time.</span><span>© 2026 FlashStudy</span></footer>
    </main>
  );
}