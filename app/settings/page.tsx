"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import PageNavigation from "../components/PageNavigation";

const navigation = [
  ["Dashboard", "/dashboard", "⌂"],
  ["Documents", "/documents", "▣"],
  ["Flashcards", "/flashcards", "◇"],
  ["Doubts", "/doubts", "?"],
  ["Quizzes", "/quizzes", "✓"],
  ["Progress", "/progress", "↗"],
];

export default function Page() {
  const [login, setLogin] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Login details are ready to connect to the account authentication service.");
  }

  function handlePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setMessage("Use at least 8 characters for the new password.");
      return;
    }
    setMessage("Password form is validated and ready for the authentication backend.");
  }

  return (
    <main className="study-dashboard">
      <aside className="study-sidebar">
        <Link href="/dashboard" className="dashboard-brand">
          <span className="brand-mark">F</span> FlashStudy
        </Link>
        <span className="sidebar-label">Workspace</span>
        <nav className="sidebar-nav" aria-label="Study navigation">
          {navigation.map(([label, href, icon]) => (
            <Link key={href} href={href} className="sidebar-link">
              <span className="sidebar-icon">{icon}</span>{label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/settings" className="sidebar-link active">
            <span className="sidebar-icon">⚙</span>Settings
          </Link>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-kicker">Account settings</p>
            <h1>Login &amp; password</h1>
            <p className="dashboard-subtitle">Manage the login details and password for your FlashStudy account.</p>
          </div>
        </header>

        <PageNavigation />

        <div className="settings-grid">
          <section className="dashboard-card settings-card">
            <div className="card-heading">
              <div>
                <span className="card-eyebrow">Account</span>
                <h2>Login details</h2>
              </div>
            </div>
            <p className="settings-description">Update the email address or login identifier used to access FlashStudy.</p>
            <form className="settings-form" onSubmit={handleLogin}>
              <label htmlFor="login">Email / login</label>
              <input
                id="login"
                type="email"
                value={login}
                onChange={(event) => setLogin(event.target.value)}
                placeholder="student@example.com"
                autoComplete="username"
              />
              <button type="submit" className="dashboard-primary-btn">Save login</button>
            </form>
          </section>

          <section className="dashboard-card settings-card">
            <div className="card-heading">
              <div>
                <span className="card-eyebrow">Security</span>
                <h2>Change password</h2>
              </div>
            </div>
            <p className="settings-description">Use your current password and choose a new password for your account.</p>
            <form className="settings-form" onSubmit={handlePassword}>
              <label htmlFor="current-password">Current password</label>
              <input id="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" />
              <label htmlFor="new-password">New password</label>
              <input id="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} autoComplete="new-password" />
              <label htmlFor="confirm-password">Confirm new password</label>
              <input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} autoComplete="new-password" />
              <button type="submit" className="dashboard-primary-btn">Change password</button>
            </form>
          </section>
        </div>

        {message && <p className="settings-message">{message}</p>}

        <section className="dashboard-card settings-note">
          <span className="card-eyebrow">Account security</span>
          <h2>Authentication protection</h2>
          <p>Passwords should be changed through the authenticated backend and never stored in browser localStorage. FlashStudy will keep account credentials separate from your study data.</p>
        </section>
      </section>
    </main>
  );
}
