import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aurafarmer.live"),
  title: {
    default: "Aura Farmer",
    template: "%s · Aura Farmer",
  },
  description:
    "The internet's verdict on public figures. Crowdsourced aura scores and live leaderboards — vote, watch the board move.",
  openGraph: {
    title: "Aura Farmer",
    description: "The internet's verdict on public figures.",
    url: "https://aurafarmer.live",
    siteName: "Aura Farmer",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aura Farmer",
    description: "The internet's verdict on public figures.",
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
    >
      {/* Anti-flash: set theme class before first paint */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('af-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
