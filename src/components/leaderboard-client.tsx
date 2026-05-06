"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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

type Toast = {
  message: string;
  type: "up" | "down" | "neutral";
  exiting: boolean;
};

function relTime(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function ChevronUp({ className }: { className?: string }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M2.5 8.5L6.5 4.5L10.5 8.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M2.5 4.5L6.5 8.5L10.5 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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

  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialFigures.map((f) => [f.id, f.score])),
  );
  const [activity, setActivity] = useState<ActivityItem[]>(initialActivity);
  const [tab, setTab] = useState<TabKey>("all");
  const [toast, setToast] = useState<Toast | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [optimisticVoted, setOptimisticVoted] = useState<string[]>([]);
  const [voteDirections, setVoteDirections] = useState<Record<string, "up" | "down">>({});
  const [scoreAnimating, setScoreAnimating] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const votedIds = useMemo(
    () => new Set([...initialVotedFigureIds, ...optimisticVoted]),
    [initialVotedFigureIds, optimisticVoted],
  );

  const figures = useMemo(
    () =>
      [...initialFigures]
        .map((f) => ({ ...f, score: scores[f.id] ?? f.score }))
        .sort((a, b) => b.score - a.score),
    [initialFigures, scores],
  );

  const allCount     = figures.length;
  const risingCount  = useMemo(() => figures.filter((f) => f.score > 2000).length, [figures]);
  const fallingCount = useMemo(() => figures.filter((f) => f.score < 1000).length, [figures]);

  const filtered = useMemo(() => {
    if (tab === "rising")  return figures.filter((f) => f.score > 2000);
    if (tab === "falling") return figures.filter((f) => f.score < 1000);
    return figures;
  }, [figures, tab]);

  const maxAbsScore = useMemo(
    () => Math.max(1, ...figures.map((f) => Math.abs(f.score))),
    [figures],
  );

  useEffect(() => {
    refreshTimerRef.current = setInterval(() => router.refresh(), 15_000);
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [router]);

  function showToast(message: string, type: Toast["type"]) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type, exiting: false });
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, exiting: true } : null));
      setTimeout(() => setToast(null), 200);
    }, 2500);
  }

  async function vote(figureId: string, direction: "up" | "down") {
    if (busyId || votedIds.has(figureId)) return;

    const prevScore = scores[figureId] ?? 0;
    const delta = direction === "up" ? 100 : -100;

    setBusyId(figureId);
    setScores((prev) => ({ ...prev, [figureId]: prevScore + delta }));
    setOptimisticVoted((prev) => [...prev, figureId]);

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ figureId, direction }),
      });
      const body = await res.json().catch(() => ({}));

      if (res.status === 403 && body.code === "already_voted") {
        setScores((prev) => ({ ...prev, [figureId]: prevScore }));
        showToast("Already voted this session", "neutral");
        return;
      }
      if (!res.ok) {
        setScores((prev) => ({ ...prev, [figureId]: prevScore }));
        setOptimisticVoted((prev) => prev.filter((id) => id !== figureId));
        showToast(body.error ?? "Something went wrong", "neutral");
        return;
      }

      const confirmed =
        typeof body.score === "number" ? body.score : prevScore + delta;
      setScores((prev) => ({ ...prev, [figureId]: confirmed }));
      setVoteDirections((prev) => ({ ...prev, [figureId]: direction }));

      setScoreAnimating(figureId);
      setTimeout(() => setScoreAnimating(null), 250);

      const fig = initialFigures.find((f) => f.id === figureId);
      setActivity((prev) =>
        [
          {
            figureName: fig?.name ?? "Someone",
            direction,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 8),
      );

      showToast(
        direction === "up" ? "Aura boosted +100" : "Aura drained \u2212100",
        direction === "up" ? "up" : "down",
      );
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="w-full pb-16 pt-10">

      {/* ── Header ── */}
      <header className="flex items-start justify-between border-b border-edge pb-5">
        <div>
          <h1 className="text-[28px] font-semibold leading-none tracking-tight text-ink">
            Aura Farmer
          </h1>
          <p className="mt-1.5 text-[14px] text-ink-2">
            The internet&apos;s verdict on public figures.
          </p>
        </div>
        <div className="flex items-center gap-1.5 pt-1">
          <span className="pulse-dot h-2 w-2 rounded-full bg-up" />
          <span className="text-[12px] text-ink-2">live</span>
        </div>
      </header>

      {/* ── Tabs ── */}
      <nav className="mt-7 flex items-baseline gap-6" aria-label="Filter leaderboard">
        {(
          [
            ["all",     `All (${allCount})`],
            ["rising",  `Rising (${risingCount})`],
            ["falling", `Falling (${fallingCount})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => { setTab(key); setVisibleCount(12); }}
            className={
              tab === key
                ? "border-b-2 border-ink pb-0.5 text-[14px] font-semibold text-ink"
                : "pb-0.5 text-[14px] font-normal text-ink-2 transition-colors duration-100 hover:text-ink"
            }
          >
            {label}
          </button>
        ))}
      </nav>

      {/* ── Leaderboard ── */}
      <ul className="mt-4 flex flex-col gap-2">
        {filtered.slice(0, visibleCount).map((figure) => {
          const rank = figures.indexOf(figure) + 1;
          const score = figure.score;
          const positive = score >= 0;
          const pct = Math.min(100, Math.round((Math.abs(score) / maxAbsScore) * 100));
          const already = votedIds.has(figure.id);
          const isBusy = busyId === figure.id;
          const voteDir = voteDirections[figure.id]; // "up" | "down" | undefined (unknown for server-side voted)
          const initials =
            figure.avatar_initials?.trim().slice(0, 4) ??
            figure.name
              .split(/\s+/)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase() ?? "")
              .join("");

          return (
            <li
              key={figure.id}
              className="flex items-center gap-0 rounded-[10px] border border-edge bg-card px-4 py-3.5 transition-shadow duration-150 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
            >
              {/* Rank */}
              <div className="w-8 shrink-0 text-right text-[13px] font-medium text-ink-3">
                {rank === 1 ? "★" : rank}
              </div>

              {/* gap 12 */}
              <div className="w-3 shrink-0" />

              {/* Avatar */}
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[14px] font-medium text-white"
                /* avatar_color is a dynamic DB value — minimal inline style required */
                style={{ backgroundColor: figure.avatar_color ?? "#888580" }}
              >
                {initials || "?"}
              </div>

              {/* gap 14 */}
              <div className="w-3.5 shrink-0" />

              {/* Info block */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-ink">
                  {figure.name}
                </p>
                {figure.description && (
                  <p className="truncate text-[12px] text-ink-2">
                    {figure.description}
                  </p>
                )}
                {/* Score bar */}
                <div className="mt-2 h-[3px] w-full overflow-hidden rounded-sm bg-bar-track">
                  <div
                    className={`h-full rounded-sm ${positive ? "bg-up" : "bg-down"}`}
                    style={{
                      width: `${pct}%`,
                      transition: "width 400ms ease",
                    }}
                  />
                </div>
              </div>

              {/* gap 16 */}
              <div className="w-4 shrink-0" />

              {/* Score */}
              <div
                className={`w-20 shrink-0 text-right text-[20px] font-semibold tabular-nums ${
                  positive ? "text-up" : "text-down"
                } ${scoreAnimating === figure.id ? "score-pop" : ""}`}
              >
                {positive ? "+" : ""}
                {score.toLocaleString()}
              </div>

              {/* gap 12 */}
              <div className="w-3 shrink-0" />

              {/* Vote buttons */}
              <div className="flex shrink-0 flex-col items-center gap-1">
                {/* Upvote */}
                <button
                  type="button"
                  aria-label="Boost aura"
                  disabled={isBusy || already}
                  onClick={() => void vote(figure.id, "up")}
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-[120ms]",
                    already && voteDir === "up"
                      ? "border-up bg-up text-white"
                      : already || isBusy
                        ? "cursor-not-allowed border-edge bg-card text-ink-3 opacity-35"
                        : "border-edge bg-card text-ink-3 hover:border-up hover:text-up",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <ChevronUp />
                </button>

                {/* Downvote */}
                <button
                  type="button"
                  aria-label="Drain aura"
                  disabled={isBusy || already}
                  onClick={() => void vote(figure.id, "down")}
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-[120ms]",
                    already && voteDir === "down"
                      ? "border-down bg-down text-white"
                      : already || isBusy
                        ? "cursor-not-allowed border-edge bg-card text-ink-3 opacity-35"
                        : "border-edge bg-card text-ink-3 hover:border-down hover:text-down",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <ChevronDown />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {!filtered.length && (
        <p className="mt-6 text-center text-[14px] text-ink-2">
          Nothing here — try a different filter.
        </p>
      )}

      {/* Show more / collapse */}
      {filtered.length > 12 && (
        <div className="mt-3 flex items-center gap-4">
          {visibleCount < filtered.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((n) => n + 12)}
              className="text-[13px] text-ink-2 underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              Show {Math.min(12, filtered.length - visibleCount)} more
            </button>
          )}
          {visibleCount > 12 && (
            <button
              type="button"
              onClick={() => setVisibleCount(12)}
              className="text-[13px] text-ink-3 underline-offset-4 transition-colors hover:text-ink-2 hover:underline"
            >
              Collapse
            </button>
          )}
          <span className="text-[12px] text-ink-3">
            Showing {Math.min(visibleCount, filtered.length)} of {filtered.length}
          </span>
        </div>
      )}

      {/* ── Divider ── */}
      <div className="mt-8 border-t border-edge" />

      {/* ── Activity Feed ── */}
      <section className="mt-8">
        <h2 className="mb-4 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">
          Recent Activity
        </h2>
        <ul className="flex flex-col gap-2.5">
          {activity.slice(0, 8).map((row, i) => (
            <li
              key={`${row.createdAt}-${i}`}
              className="feed-item-enter flex items-center gap-2 text-[12px] text-ink-2"
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  row.direction === "up" ? "bg-up" : "bg-down"
                }`}
              />
              <span>
                <span className="font-medium text-ink">{row.figureName}</span>
                {row.direction === "up"
                  ? "'s aura was boosted"
                  : "'s aura was drained"}
              </span>
              <span className="ml-auto shrink-0 text-ink-3">
                {relTime(row.createdAt)}
              </span>
            </li>
          ))}
          {!activity.length && (
            <li className="text-[12px] text-ink-3">No votes yet.</li>
          )}
        </ul>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-12 text-center text-[12px] text-ink-3">
        <span>Aura Farmer · aurafarmer.live</span>
        <span className="mx-2 text-edge">·</span>
        <Link
          href="/about"
          className="underline-offset-4 transition-colors hover:text-ink-2 hover:underline"
        >
          About
        </Link>
      </footer>

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-5 ${
            toast.exiting ? "toast-exit" : "toast-enter"
          }`}
        >
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 rounded-lg border border-edge bg-card px-[18px] py-2.5 shadow-sm"
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                toast.type === "up"
                  ? "bg-up"
                  : toast.type === "down"
                    ? "bg-down"
                    : "bg-ink-3"
              }`}
            />
            <span className="text-[13px] text-ink">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
