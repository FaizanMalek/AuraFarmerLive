import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "What Aura Farmer is, how aura voting works, and how crowdsourced scores are meant to be interpreted.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 px-4 py-14 text-zinc-100">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
          Aura Farmer · About
        </p>
        <h1 className="text-balance text-3xl font-semibold">What Aura Farmer Is</h1>
      </header>

      <p className="text-pretty leading-relaxed text-zinc-400">
        Aura Farmer (<span className="text-emerald-300">aurafarmer.live</span>) is
        an entertainment leaderboard for publicly known figures. Visitors can bump
        someone&apos;s aura up or drag it down. Scores aggregate many small
        moves into one live number—the board is deliberately loud, meme-y, and
        fast-moving rather than pretending to be a scientific poll.
      </p>

      <section id="how-it-works" className="space-y-4 scroll-mt-20">
        <h2 className="text-xl font-semibold text-zinc-100">How Voting Works</h2>
        <ul className="list-disc space-y-2 ps-6 text-zinc-400 marker:text-emerald-500">
          <li>
            Tap <strong className="text-zinc-200">+</strong> to boost (+100 aura)
            or <strong className="text-zinc-200">−</strong> to drain (−100 aura).
          </li>
          <li>
            The site records each vote transparently inside the Aura Farmer
            database so everyone sees roughly the same running totals.
          </li>
          <li>
            Without logging in, you get <strong className="text-zinc-200">one vote per public figure per browser session</strong> (similar in spirit to Ranker-style list voting): after you pick + or − for someone, that row is locked until you end the session (closing the tab / clearing site data starts fresh).
          </li>
          <li>
            Use filters (All · Rising · Falling) to slice the leaderboard for quick
            skims.
          </li>
        </ul>
      </section>

      <section className="space-y-3 border-t border-zinc-800/80 pt-8">
        <h2 className="text-xl font-semibold text-zinc-100">Crowdsourced Opinions</h2>
        <p className="leading-relaxed text-zinc-400">
          Aura scores are <strong className="text-zinc-200">crowdsourced opinions</strong>
          {" "}from visitors, not statements of verified fact about any person&apos;s character.
          Interpret them as vibes, hype, backlash, meme energy, collective mood — not a report card.
          If you monetize via ads later, reviewers expect explanatory pages exactly like this one,
          so thanks for giving them context.
        </p>
      </section>

      <footer className="border-t border-zinc-800/80 pt-6 text-sm text-zinc-500">
        <Link href="/" className="text-emerald-400 underline-offset-4 hover:underline">
          ← Back to leaderboard
        </Link>
      </footer>
    </div>
  );
}
