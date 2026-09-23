import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlashStudy — Study smarter from your PDFs",
  description: "Turn study material into notes, flashcards, and clear answers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}