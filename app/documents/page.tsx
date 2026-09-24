"use client";

import Link from "next/link";
import { ChangeEvent, useRef, useState } from "react";

type UploadState = "idle" | "uploading" | "success" | "error";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export default function DocumentsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [message, setMessage] = useState("");

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    setFiles(selected);
    setUploadState("idle");
    setMessage(selected.length ? `${selected.length} file${selected.length === 1 ? "" : "s"} selected` : "");
  };

  const uploadFiles = async () => {
    if (!files.length) {
      openFilePicker();
      return;
    }

    if (!API_URL) {
      setUploadState("error");
      setMessage("The backend URL is not configured yet. File selection is working, but uploads need the deployed backend connected.");
      return;
    }

    setUploadState("uploading");
    setMessage("Uploading and processing your files...");

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API_URL}/api/v1/documents`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => null);
          throw new Error(error?.detail || `Upload failed for ${file.name}`);
        }
      }

      setUploadState("success");
      setMessage("Files uploaded successfully. Refreshing your library...");
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      window.location.reload();
    } catch (error) {
      setUploadState("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong while uploading.");
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
            <p className="dashboard-subtitle">Keep your study material in one place. Upload files, documents, slides, text files, or images and we’ll process them into study tools.</p>
          </div>
          <button type="button" className="dashboard-primary-btn" onClick={openFilePicker}>+ Upload files</button>
        </header>

        <section id="upload" className="upload-card">
          <div className="upload-icon">↑</div>
          <div>
            <p className="card-eyebrow">Add study material</p>
            <h2>Upload study material</h2>
            <p>Choose one or more supported files. Your selection will appear here before it is uploaded.</p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.jpg,.jpeg,.png,.webp"
            multiple
            onChange={handleFileChange}
            className="visually-hidden"
          />

          <div className="upload-actions">
            <button type="button" className="upload-select" onClick={openFilePicker}>
              Choose files
            </button>
            <button type="button" className="dashboard-primary-btn" onClick={uploadFiles} disabled={uploadState === "uploading"}>
              {uploadState === "uploading" ? "Uploading..." : "Upload selected files"}
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
            <p className={`upload-message upload-message-${uploadState}`} role={uploadState === "error" ? "alert" : "status"}>
              {message}
            </p>
          )}

          <small>PDF · DOCX · PPTX · TXT · MD · JPG · PNG · WEBP</small>
        </section>

        <section className="documents-section">
          <div className="card-heading">
            <div><span className="card-eyebrow">Library</span><h2>My documents</h2></div>
          </div>
          <div className="documents-empty">
            <div className="empty-icon">▣</div>
            <h3>No documents yet</h3>
            <p>Your uploaded study material will appear here with processing status and links to notes, doubts, flashcards, and quizzes.</p>
            <button type="button" className="dashboard-secondary-btn" onClick={openFilePicker}>Upload your first file</button>
          </div>
        </section>
      </section>
    </main>
  );
}
