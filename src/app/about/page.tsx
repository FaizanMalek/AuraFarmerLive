import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "What Aura Farmer is, how voting works, why it matters, and how to contact us.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[600px] px-5 pb-20 pt-12">

      {/* Back */}
      <Link
        href="/"
        className="mb-10 inline-block text-[13px] text-ink-2 underline-offset-4 transition-colors hover:text-ink hover:underline"
      >
        ← Leaderboard
      </Link>

      {/* Header */}
      <header className="mb-10 border-b border-edge pb-8">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink">
          About Aura Farmer
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
          A live, crowdsourced leaderboard for public figures — built for the
          generation that judges people on vibes.
        </p>
      </header>

      {/* Sections */}
      <div className="flex flex-col gap-10">

        <section id="what-is">
          <h2 className="mb-3 text-[18px] font-semibold text-ink">
            What is Aura Farmer?
          </h2>
          <div className="flex flex-col gap-3 text-[15px] leading-[1.7] text-ink-2">
            <p>
              Aura Farmer is an entertainment site where anyone can vote on the
              &ldquo;aura&rdquo; of well-known public figures. Aura is a cultural
              shorthand — popularised by Gen Z — for someone&rsquo;s presence,
              reputation, and energy in the public eye. It goes up when people
              think you&rsquo;re winning. It goes down when you do something the
              internet doesn&rsquo;t forgive.
            </p>
            <p>
              The leaderboard updates in real time as votes come in from around
              the world. Scores are stored in a shared database, so every visitor
              sees the same live numbers. There is no algorithm, no editorial
              curation, and no promoted content — just raw, collective opinion.
            </p>
          </div>
        </section>

        <div className="border-t border-edge" />

        <section id="how-it-works">
          <h2 className="mb-3 text-[18px] font-semibold text-ink">
            How voting works
          </h2>
          <div className="flex flex-col gap-3 text-[15px] leading-[1.7] text-ink-2">
            <p>
              Each public figure on the leaderboard has an aura score. To vote,
              use the chevron buttons on each row — the up chevron boosts their
              score by 100, the down chevron drains it by 100. Scores can go
              negative.
            </p>
            <p>
              Without creating an account, you get{" "}
              <span className="font-medium text-ink">
                one vote per person per browser session
              </span>
              . Once you vote on someone, that row locks until you close your
              browser tab or clear site data. This works through a secure,
              cryptographically signed cookie — no tracking, no account required.
            </p>
            <p>
              The leaderboard refreshes automatically every 15 seconds. You can
              filter by All, Rising (score above 2,000), or Falling (score below
              1,000).
            </p>
          </div>
        </section>

        <div className="border-t border-edge" />

        <section id="why-it-matters">
          <h2 className="mb-3 text-[18px] font-semibold text-ink">
            Why it matters
          </h2>
          <div className="flex flex-col gap-3 text-[15px] leading-[1.7] text-ink-2">
            <p>
              Public figures are already discussed, debated, and rated constantly
              across social media. Aura Farmer gives that conversation a single,
              shared number to rally around — updated live, visible to everyone.
            </p>
            <p>
              Aura scores are{" "}
              <span className="font-medium text-ink">
                crowdsourced opinions, not statements of fact
              </span>
              . They reflect the collective sentiment of visitors at any given
              moment. They are not endorsements, verdicts, or verified ratings of
              any kind. Interpret them as cultural mood, not character judgement.
            </p>
          </div>
        </section>

        <div className="border-t border-edge" />

        <section id="contact">
          <h2 className="mb-3 text-[18px] font-semibold text-ink">Contact</h2>
          <div className="flex flex-col gap-3 text-[15px] leading-[1.7] text-ink-2">
            <p>
              For questions, feedback, removal requests, or partnership
              enquiries, email us at{" "}
              <a
                href="mailto:hello@aurafarmer.live"
                className="font-medium text-ink underline underline-offset-4 transition-colors hover:text-ink-2"
              >
                hello@aurafarmer.live
              </a>
              . We respond within 48 hours.
            </p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-14 border-t border-edge pt-6 text-[12px] text-ink-3">
        Aura Farmer · aurafarmer.live
      </footer>
    </div>
  );
}
