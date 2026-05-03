import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aurafarmer.live"),
  title: {
    default: "AURA FARMER",
    template: "%s · AURA FARMER",
  },
  description:
    "The internet decides who has aura. Crowdsourced aura scores and live leaderboards for public figures — vote, watch the board move.",
  openGraph: {
    title: "AURA FARMER",
    description: "The internet decides who has aura.",
    url: "https://aurafarmer.live",
    siteName: "Aura Farmer",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AURA FARMER",
    description: "The internet decides who has aura.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased`}
      style={{ background: "#0a0a0a" }}
    >
      <body
        className="flex min-h-full flex-col"
        style={{ background: "#0a0a0a", color: "#f0f0f0" }}
      >
        <div className="flex flex-1 flex-col">{children}</div>
        <footer
          className="mt-auto px-4 py-8 text-center text-[11px] uppercase tracking-widest"
          style={{ color: "#333", borderTop: "1px solid #1f1f1f" }}
        >
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link
              href="/about"
              className="transition hover:opacity-70"
              style={{ color: "#555" }}
            >
              About
            </Link>
            <span style={{ color: "#222" }} aria-hidden>·</span>
            <Link
              href="/about#how-it-works"
              className="transition hover:opacity-70"
              style={{ color: "#555" }}
            >
              How It Works
            </Link>
            <span style={{ color: "#222" }} aria-hidden>·</span>
            <span style={{ color: "#333" }}>AURA FARMER · aurafarmer.live · 2025</span>
          </nav>
        </footer>
      </body>
    </html>
  );
}
