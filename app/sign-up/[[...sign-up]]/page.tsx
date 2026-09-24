import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <div className="auth-brand"><a href="/"><span className="brand-mark">F</span> FlashStudy</a></div>
      <div className="auth-card">
        <div className="auth-copy">
          <div className="eyebrow">Create your study space</div>
          <h1>Make studying feel <em>simpler.</em></h1>
          <p>Create your account and keep your study material, doubts, and progress in one place.</p>
        </div>
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
      </div>
    </main>
  );
}
