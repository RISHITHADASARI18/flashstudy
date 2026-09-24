import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const firstName = user.firstName || "there";

  return (
    <main className="dashboard-placeholder">
      <div className="dashboard-top">
        <a className="brand" href="/"><span className="brand-mark">F</span> FlashStudy</a>
        <div className="dashboard-user">{user.emailAddresses[0]?.emailAddress}</div>
      </div>
      <section>
        <div className="eyebrow">Your study space</div>
        <h1>Hey {firstName}, <em>let&apos;s learn.</em></h1>
        <p>Your account is connected. The full dashboard is the next build step.</p>
        <a className="primary-btn" href="/documents">Continue to documents <span>→</span></a>
      </section>
    </main>
  );
}
