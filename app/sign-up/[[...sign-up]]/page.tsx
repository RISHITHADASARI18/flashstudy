import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <main className="auth-page">
      <div className="auth-brand"><a href="/"><span className="brand-mark">F</span> FlashStudy</a></div>
      <div className="auth-card">
        <div className="auth-copy">
          <div className="eyebrow">Create your study space</div>
          <h1>Make studying feel <em>simpler.</em></h1>
          <p>Create your account and keep your study material, doubts, and progress in one place.</p>
        </div>
        {clerkEnabled ? (
          <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/dashboard" appearance={{
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
            <h3>Account setup is coming next</h3>
            <p>Authentication is ready in the codebase and will be enabled after the rest of FlashStudy is built.</p>
            <a className="dashboard-primary-btn" href="/">Back to FlashStudy <span>→</span></a>
          </div>
        )}
      </div>
    </main>
  );
}
