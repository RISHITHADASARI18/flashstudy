"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import PageNavigation from "../components/PageNavigation";

type GenerateState = "idle" | "generating" | "success" | "error";
type Document = { id: string; original_filename: string; status: string; size_bytes: number; error_message: string | null };

const API_URL = `${(process.env.NEXT_PUBLIC_API_URL || "https://flashstudy-backend.onrender.com").replace(/\/$/, "")}/api`;

export default function DocumentsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [state, setState] = useState<GenerateState>("idle");
  const [message, setMessage] = useState("");

  const loadDocuments = async () => {
    try {
      const response = await fetch(`${API_URL}/v1/documents`);
      if (response.ok) setDocuments(await response.json());
    } catch {}
  };

  useEffect(() => { loadDocuments(); }, []);

  const openFilePicker = () => inputRef.current?.click();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    setFiles(selected);
    setState("idle");
    setMessage(selected.length ? `${selected.length} file${selected.length === 1 ? "" : "s"} selected` : "");
  };

  const generateStudySet = async () => {
    if (!files.length) {
      openFilePicker();
      return;
    }

    setState("generating");
    setMessage("Reading your material and generating flashcards + quizzes with AI...");

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API_URL}/v1/documents/generate`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.detail || `Could not generate study material for ${file.name}.`);
        }
      }

      await loadDocuments();
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      setState("success");
      setMessage("Done! Your AI flashcards and quizzes have been saved.");
    } catch (error) {
      console.error("FlashStudy generation error:", error);
      setState("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong while generating.");
    }
  };

  return (
    <main className="documents-page">
      <aside className="study-sidebar">
        <Link href="/dashboard" className="dashboard-brand"><span className="brand-mark">F</span> FlashStudy</Link>
        <span className="sidebar-label">Workspace</span>
        <nav className="sidebar-nav">
          <Link href="/dashboard" className="sidebar-link"><span className="sidebar-icon">⌂</span>Dashboard</Link>
          <Link href="/documents" className="sidebar-link active"><span className="sidebar-icon">▣</span>Documents</Link>
          <Link href="/flashcards" className="sidebar-link"><span className="sidebar-icon">▤</span>Flashcards</Link>
          <Link href="/doubts" className="sidebar-link"><span className="sidebar-icon">?</span>Doubts</Link>
          <Link href="/quizzes" className="sidebar-link"><span className="sidebar-icon">✓</span>Quizzes</Link>
          <Link href="/progress" className="sidebar-link"><span className="sidebar-icon">↗</span>Progress</Link>
        </nav>
        <div className="sidebar-bottom"><Link href="/settings" className="sidebar-link"><span className="sidebar-icon">⚙</span>Settings</Link></div>
      </aside>

      <section className="documents-main">
        <header className="documents-header">
          <div>
            <p className="dashboard-kicker">Study library</p>
            <h1>Your <em>documents</em></h1>
            <p className="dashboard-subtitle">Select your study material, then Generate. FlashStudy will extract it and create AI-powered flashcards and quizzes.</p>
          </div>
        </header>

        <PageNavigation />

        <section id="upload" className="upload-card">
          <div className="upload-icon">↑</div>
          <div>
            <p className="card-eyebrow">Create study tools</p>
            <h2>Select your material</h2>
            <p>Choose PDF, Word, or PowerPoint files. Nothing is sent until you press Generate.</p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.pptx"
            multiple
            onChange={handleFileChange}
            className="visually-hidden"
          />

          <div className="upload-actions">
            <button type="button" className="upload-select" onClick={openFilePicker}>Choose files</button>
            <button type="button" className="dashboard-primary-btn" onClick={generateStudySet} disabled={state === "generating"}>
              {state === "generating" ? "Generating..." : "Generate"}
            </button>
          </div>

          {files.length > 0 && (
            <div className="selected-files" aria-live="polite">
              <strong>Selected files</strong>
              {files.map((file) => (
                <span key={`${file.name}-${file.size}-${file.lastModified}`}>
                  {file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              ))}
            </div>
          )}

          {message && (
            <p className={`upload-message upload-message-${state}`} role={state === "error" ? "alert" : "status"}>
              {message}
            </p>
          )}

          <small>Supported: PDF · Word DOCX · PowerPoint PPTX · up to 25 MB per file</small>
        </section>

        <section className="documents-section">
          <div className="card-heading">
            <div><span className="card-eyebrow">Library</span><h2>My documents</h2></div>
          </div>

          {documents.length ? (
            <div className="documents-list">
              {documents.map((doc) => (
                <div className="document-row" key={doc.id}>
                  <div>
                    <strong>{doc.original_filename}</strong>
                    <span>{(doc.size_bytes / (1024 * 1024)).toFixed(2)} MB · {doc.status}</span>
                  </div>
                  <div className="document-row-actions">
                    <Link href={`/flashcards?document=${doc.id}`} className="dashboard-secondary-btn">Flashcards</Link>
                    <Link href={`/quizzes?document=${doc.id}`} className="dashboard-secondary-btn">Quizzes</Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="documents-empty">
              <div className="empty-icon">▣</div>
              <h3>No documents yet</h3>
              <p>Select a PDF, Word document, or PowerPoint above and press Generate.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
