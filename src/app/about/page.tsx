import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "What Aura Farmer is, how voting works, why celebrities, and how to contact us.",
};

export default function AboutPage() {
  return (
    <div
      className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-14"
      style={{ color: "#f0f0f0" }}
    >
      <header className="space-y-3">
        <p
          className="text-[10px] font-black uppercase tracking-[0.35em]"
          style={{ color: "#00ff87" }}
        >
          AURA FARMER · ABOUT
        </p>
        <h1 className="text-4xl font-black uppercase tracking-wide">
          What Is Aura Farmer?
        </h1>
        <p style={{ color: "#888" }}>
          The internet&apos;s crowdsourced verdict on who&apos;s gaining or
          losing cultural aura — updated in real time, no login required.
        </p>
      </header>

      <div
        className="h-px w-full"
        style={{ background: "#1f1f1f" }}
        aria-hidden
      />

      <section id="what-is" className="space-y-4 scroll-mt-24">
        <h2 className="text-xl font-black uppercase tracking-wide">
          The Concept
        </h2>
        <p style={{ color: "#888" }}>
          &ldquo;Aura&rdquo; is a cultural shorthand — Gen Z slang for someone&apos;s
          presence, reputation, and overall energy in the public eye. Aura
          Farmer takes that idea and makes it live and interactive. Real people
          vote, scores move, and the leaderboard tells the story of who the
          internet thinks is winning or losing right now.
        </p>
        <p style={{ color: "#888" }}>
          It&apos;s built for speed, shareability, and honesty. No algorithm,
          no editorial picks — just raw crowdsourced opinion at scale.
        </p>
      </section>

      <div className="h-px w-full" style={{ background: "#1f1f1f" }} aria-hidden />

      <section id="how-it-works" className="space-y-4 scroll-mt-24">
        <h2 className="text-xl font-black uppercase tracking-wide">
          How Voting Works
        </h2>
        <ul className="space-y-3" style={{ color: "#888" }}>
          <li className="flex items-start gap-3">
            <span
              className="mt-0.5 shrink-0 text-sm font-black"
              style={{ color: "#00ff87" }}
            >
              01
            </span>
            <span>
              Each public figure has an aura score. Tap{" "}
              <strong style={{ color: "#f0f0f0" }}>+ Boost</strong> to add
              +100 aura or{" "}
              <strong style={{ color: "#f0f0f0" }}>− Drain</strong> to remove
              100 aura.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span
              className="mt-0.5 shrink-0 text-sm font-black"
              style={{ color: "#00ff87" }}
            >
              02
            </span>
            <span>
              You get{" "}
              <strong style={{ color: "#f0f0f0" }}>
                one vote per person per browser session
              </strong>
              . Close and reopen the tab to start fresh — similar to how
              Ranker-style voting works. No account needed.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span
              className="mt-0.5 shrink-0 text-sm font-black"
              style={{ color: "#00ff87" }}
            >
              03
            </span>
            <span>
              Scores are stored globally in a Postgres database. Everyone
              reading the leaderboard sees the same live numbers — scores
              refresh every 10 seconds automatically.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span
              className="mt-0.5 shrink-0 text-sm font-black"
              style={{ color: "#00ff87" }}
            >
              04
            </span>
            <span>
              Use the{" "}
              <strong style={{ color: "#f0f0f0" }}>
                All / Rising / Falling
              </strong>{" "}
              tabs to filter the leaderboard. Rising = above 2,000 aura.
              Falling = below 1,000.
            </span>
          </li>
        </ul>
      </section>

      <div className="h-px w-full" style={{ background: "#1f1f1f" }} aria-hidden />

      <section id="why-celebrities" className="space-y-4 scroll-mt-24">
        <h2 className="text-xl font-black uppercase tracking-wide">
          Why Public Figures?
        </h2>
        <p style={{ color: "#888" }}>
          Public figures are already discussed, debated, and rated everywhere
          online — Aura Farmer gives that conversation a single live score to
          rally around. Aura scores are{" "}
          <strong style={{ color: "#f0f0f0" }}>
            crowdsourced opinions, not statements of fact
          </strong>
          . Interpret them as collective vibes, meme energy, or cultural
          sentiment — not a formal rating or endorsement. They can go up and
          down based on anything the internet cares about at any moment.
        </p>
      </section>

      <div className="h-px w-full" style={{ background: "#1f1f1f" }} aria-hidden />

      <section id="contact" className="space-y-4 scroll-mt-24">
        <h2 className="text-xl font-black uppercase tracking-wide">Contact</h2>
        <p style={{ color: "#888" }}>
          Questions, feedback, removal requests, or partnership inquiries —
          reach out at{" "}
          <a
            href="mailto:hello@aurafarmer.live"
            className="underline-offset-4 hover:underline"
            style={{ color: "#00ff87" }}
          >
            hello@aurafarmer.live
          </a>
          . We aim to respond within 48 hours.
        </p>
      </section>

      <div className="h-px w-full" style={{ background: "#1f1f1f" }} aria-hidden />

      <footer>
        <Link
          href="/"
          className="text-sm underline-offset-4 hover:underline"
          style={{ color: "#00ff87" }}
        >
          ← Back to leaderboard
        </Link>
      </footer>
    </div>
  );
}
