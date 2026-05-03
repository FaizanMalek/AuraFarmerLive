"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export type FigurePublic = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_initials: string | null;
  avatar_color: string | null;
  score: number;
};

export type ActivityItem = {
  figureName: string;
  direction: "up" | "down";
  createdAt: string;
};

type TabKey = "all" | "rising" | "falling";

function relativeTimeShort(iso: string): string {
  const deltaMs = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(deltaMs)) return iso;
  const sec = Math.max(0, Math.floor(deltaMs / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function scoreTone(score: number) {
  if (score > 0) return "text-emerald-400";
  if (score < 0) return "text-red-400";
  return "text-zinc-400";
}

function formatScore(score: number) {
  if (score > 0) return `+${score.toLocaleString()}`;
  return score.toLocaleString();
}

export default function LeaderboardClient({
  initialFigures,
  initialActivity,
  initialVotedFigureIds,
}: {
  initialFigures: FigurePublic[];
  initialActivity: ActivityItem[];
  initialVotedFigureIds: string[];
}) {
  const router = useRouter();
  const figures = useMemo(
    () => [...initialFigures].sort((a, b) => b.score - a.score),
    [initialFigures],
  );
  const activity = initialActivity.slice(0, 10);
  const [tab, setTab] = useState<TabKey>("all");
  const [toast, setToast] = useState<string | null>(null);
  const [busyFigureId, setBusyFigureId] = useState<string | null>(null);
  /** Client-side until `router.refresh()` returns updated server props + cookie. */
  const [optimisticVoted, setOptimisticVoted] = useState<string[]>([]);
  const votedIds = useMemo(
    () => new Set([...initialVotedFigureIds, ...optimisticVoted]),
    [initialVotedFigureIds, optimisticVoted],
  );

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const filtered = useMemo(() => {
    const list =
      tab === "rising"
        ? figures.filter((f) => f.score > 2000)
        : tab === "falling"
          ? figures.filter((f) => f.score < 1000)
          : figures;
    return [...list].sort((a, b) => b.score - a.score);
  }, [figures, tab]);

  const maxScore = useMemo(() => {
    if (!filtered.length) return 1;
    return Math.max(1, ...filtered.map((f) => Math.abs(f.score)));
  }, [filtered]);

  async function vote(
    figureId: string,
    direction: "up" | "down",
  ): Promise<void> {
    setBusyFigureId(figureId);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ figureId, direction }),
      });
      const body = await res.json().catch(() => ({}));

      if (res.status === 403 && body.code === "already_voted") {
        setToast("You already voted on them this session — like Ranker, one pick each until you close the tab.");
        return;
      }
      if (!res.ok) {
        setToast(body.error ?? "Could not record vote.");
        return;
      }

      setOptimisticVoted((prev) =>
        prev.includes(figureId) ? prev : [...prev, figureId],
      );
      setToast(direction === "up" ? "Aura boosted!" : "Aura drained!");
      router.refresh();
    } finally {
      setBusyFigureId(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12">
      <header className="text-center">
        <p className="mb-2 inline-flex rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
          aurafarmer.live
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Aura Farmer
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-pretty text-lg leading-relaxed text-zinc-400">
          Live aura board for public figures — each person gets{" "}
          <strong className="font-medium text-zinc-300">one vote per name per browser session</strong>{" "}
          (Ranker-style, no login). +/− moves the score by 100; everyone sees the
          same board.
        </p>
      </header>

      {toast ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-20 z-50 mx-auto flex w-fit max-w-sm justify-center px-4"
          aria-live="polite"
          role="status"
        >
          <div className="rounded-full border border-emerald-500/30 bg-emerald-950/90 px-4 py-2 text-sm text-emerald-100 shadow-xl backdrop-blur">
            {toast}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-zinc-800/80 bg-zinc-950/60 p-1">
        {(
          [
            ["all", "All"],
            ["rising", "Rising"],
            ["falling", "Falling"],
          ] as const
        ).map(([key, label]) => {
          const selected = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={
                selected
                  ? "rounded-full bg-emerald-600/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-inner shadow-emerald-900/40"
                  : "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 hover:bg-zinc-900/70 hover:text-emerald-200"
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      <ul className="flex flex-col gap-4">
        {filtered.map((figure, idx) => {
          const rank = idx + 1;
          const widthPct = Math.min(
            100,
            Math.round((Math.abs(figure.score) / maxScore) * 100),
          );
          const initials =
            figure.avatar_initials?.trim()?.slice(0, 4) ??
            figure.name
              .split(/\s+/)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase() ?? "")
              .join("");
          const ring = figure.avatar_color ?? "#10b981";
          const alreadyVoted = votedIds.has(figure.id);

          return (
            <li
              key={figure.id}
              className="rounded-2xl border border-zinc-800/70 bg-gradient-to-br from-zinc-900/80 to-zinc-950 px-5 py-4 shadow-lg shadow-black/30"
            >
              <div className="flex items-start gap-4">
                <div className="flex w-8 shrink-0 justify-center pt-1 text-xs font-semibold text-zinc-500">
                  {rank}.
                </div>
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ring-2 ring-emerald-500/50"
                  style={{ backgroundColor: ring }}
                  aria-hidden
                >
                  {initials || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h2 className="truncate text-base font-semibold text-zinc-50">
                      {figure.name}
                    </h2>
                    <span className={`text-sm font-semibold ${scoreTone(figure.score)}`}>
                      {formatScore(figure.score)}
                    </span>
                  </div>
                  {figure.description ? (
                    <p className="mt-1 text-sm text-zinc-500">{figure.description}</p>
                  ) : null}
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
                    <div
                      className="h-full rounded-full bg-emerald-500/80 shadow-[0_0_14px_rgba(16,185,129,0.45)]"
                      style={{
                        width: `${widthPct}%`,
                        transition: "width 420ms cubic-bezier(.4,.14,.3,1)",
                      }}
                      aria-valuenow={widthPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      role="progressbar"
                    />
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    title={
                      alreadyVoted
                        ? "Already voted this session"
                        : "Boost aura (+100)"
                    }
                    disabled={busyFigureId !== null || alreadyVoted}
                    onClick={() => void vote(figure.id, "up")}
                    className="flex size-10 items-center justify-center rounded-xl border border-emerald-700/70 bg-emerald-600 text-lg font-semibold leading-none text-white shadow-inner shadow-black/40 transition hover:bg-emerald-500 disabled:pointer-events-none disabled:opacity-40"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    title={
                      alreadyVoted
                        ? "Already voted this session"
                        : "Drain aura (-100)"
                    }
                    disabled={busyFigureId !== null || alreadyVoted}
                    onClick={() => void vote(figure.id, "down")}
                    className="flex size-10 items-center justify-center rounded-xl border border-red-800/70 bg-red-900/85 text-lg font-semibold leading-none text-white shadow-inner shadow-black/40 transition hover:bg-red-700 disabled:pointer-events-none disabled:opacity-40"
                  >
                    −
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {!filtered.length ? (
        <p className="text-center text-sm text-zinc-500">
          No one matches this filter right now — try another tab or cast the
          next vote wave.
        </p>
      ) : null}

      <section aria-labelledby="recent-activity-heading" className="space-y-3">
        <h2 id="recent-activity-heading" className="text-sm font-semibold text-emerald-200/90">
          Recent vibes
        </h2>
        <ul className="divide-y divide-zinc-800/80 rounded-xl border border-zinc-800/70 bg-zinc-950/50">
          {activity.slice(0, 10).map((row, i) => (
            <li key={`${row.createdAt}-${row.figureName}-${i}`} className="flex flex-wrap gap-x-2 gap-y-1 px-4 py-3 text-sm">
              <span className="font-medium text-zinc-200">{row.figureName}</span>
              <span className={row.direction === "up" ? "text-emerald-400" : "text-red-400"}>
                aura {row.direction === "up" ? "↑" : "↓"}
              </span>
              <span className="text-zinc-500">• {relativeTimeShort(row.createdAt)}</span>
            </li>
          ))}
          {!activity.length ? (
            <li className="px-4 py-6 text-center text-sm text-zinc-500">
              No votes logged yet — be the vibe check.
            </li>
          ) : null}
        </ul>
        <p className="text-center text-[11px] text-zinc-600">
          New here? Start with{" "}
          <Link href="/about" className="text-emerald-400 underline-offset-4 hover:underline">
            About &amp; how it works
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
