import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlashStudy — Study smarter from your PDFs",
  description: "Turn study material into notes, flashcards, and clear answers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <ClerkProvider enabled={clerkEnabled}>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}