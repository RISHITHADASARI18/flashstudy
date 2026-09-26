"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const pages = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Documents", href: "/documents" },
  { label: "Flashcards", href: "/flashcards" },
  { label: "Doubts", href: "/doubts" },
  { label: "Quizzes", href: "/quizzes" },
  { label: "Progress", href: "/progress" },
  { label: "Settings", href: "/settings" },
];

export default function PageNavigation() {
  const pathname = usePathname();
  const index = pages.findIndex((page) => pathname === page.href);
  const previous = index > 0 ? pages[index - 1] : null;
  const next = index >= 0 && index < pages.length - 1 ? pages[index + 1] : null;

  return (
    <nav className="page-navigation" aria-label="Page navigation">
      {previous ? (
        <Link href={previous.href} className="page-nav-button page-nav-back">
          <span aria-hidden="true">←</span>
          <span><small>Back</small>{previous.label}</span>
        </Link>
      ) : (
        <span className="page-nav-button page-nav-disabled" aria-disabled="true">
          <span aria-hidden="true">←</span>
          <span><small>Back</small>Dashboard</span>
        </span>
      )}

      <span className="page-nav-position">
        {index >= 0 ? index + 1 : 1} / {pages.length}
      </span>

      {next ? (
        <Link href={next.href} className="page-nav-button page-nav-next">
          <span><small>Next</small>{next.label}</span>
          <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <span className="page-nav-button page-nav-disabled" aria-disabled="true">
          <span><small>Next</small>Settings</span>
          <span aria-hidden="true">→</span>
        </span>
      )}
    </nav>
  );
}
