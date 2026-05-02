import type { Metadata } from "next";
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
