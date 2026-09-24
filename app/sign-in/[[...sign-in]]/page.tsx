import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="auth-page">
      <div className="auth-brand"><a href="/"><span className="brand-mark">F</span> FlashStudy</a></div>
      <div className="auth-card">
        <div className="auth-copy">
          <div className="eyebrow">Welcome back</div>
          <h1>Pick up where <em>you left off.</em></h1>
          <p>Sign in to keep your documents, doubts, flashcards, and study progress together.</p>
        </div>
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/dashboard" appearance={{
          elements: {
            rootBox: "clerk-root",
            cardBox: "clerk-card",
            headerTitle: "clerk-title",
            headerSubtitle: "clerk-subtitle",
            formButtonPrimary: "clerk-primary",
            footerActionLink: "clerk-link",
          }
        }} />
      </div>
    </main>
  );
}
