import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <main className="auth-page">
      <div className="auth-brand"><a href="/"><span className="brand-mark">F</span> FlashStudy</a></div>
      <div className="auth-card">
        <div className="auth-copy">
          <div className="eyebrow">Welcome back</div>
          <h1>Pick up where <em>you left off.</em></h1>
          <p>Sign in to keep your documents, doubts, flashcards, and study progress together.</p>
        </div>
        {clerkEnabled ? (
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
        ) : (
          <div className="empty-state">
            <h3>Sign-in is being connected</h3>
            <p>Authentication is ready in the codebase and will be enabled after the rest of FlashStudy is built.</p>
            <a className="dashboard-primary-btn" href="/">Back to FlashStudy <span>→</span></a>
          </div>
        )}
      </div>
    </main>
  );
}
