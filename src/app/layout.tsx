import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aurafarmer.live"),
  title: {
    default: "Aura Farmer",
    template: "%s · Aura Farmer",
  },
  description:
    "Crowdsourced aura scores and leaderboards for public figures—vote, watch the board move, share the moment.",
  openGraph: {
    title: "Aura Farmer",
    description:
      "Crowdsourced aura scores and leaderboards for public figures.",
    url: "https://aurafarmer.live",
    siteName: "Aura Farmer",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aura Farmer",
    description:
      "Crowdsourced aura scores and leaderboards for public figures.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-950 text-zinc-50">
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="border-t border-zinc-900/90 px-4 py-6 text-center text-[11px] leading-relaxed text-zinc-600">
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link
              href="/about"
              className="underline-offset-[3px] transition hover:text-emerald-400 hover:underline"
            >
              About
            </Link>
            <span className="text-zinc-800" aria-hidden>
              ·
            </span>
            <Link
              href="/about#how-it-works"
              className="underline-offset-[3px] transition hover:text-emerald-400 hover:underline"
            >
              How It Works
            </Link>
            <span className="text-zinc-800" aria-hidden>
              ·
            </span>
            <a
              href="https://aurafarmer.live/"
              target="_blank"
              rel="noreferrer noopener"
              className="underline-offset-[3px] transition hover:text-emerald-400 hover:underline"
            >
              aurafarmer.live
            </a>
          </nav>
        </footer>
      </body>
    </html>
  );
}
