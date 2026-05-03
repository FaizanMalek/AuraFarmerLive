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
  id: number;
  message: string;
  type: "green" | "red" | "gray";
  exiting: boolean;
};

function relativeTimeShort(iso: string): string {
  const deltaMs = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(deltaMs)) return "";
  const sec = Math.max(0, Math.floor(deltaMs / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function rankColor(rank: number): string {
  if (rank === 1) return "text-[#ffd700]";
  if (rank === 2) return "text-[#c0c0c0]";
  if (rank === 3) return "text-[#cd7f32]";
  return "text-[#888888]";
}

let toastCounter = 0;

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
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [optimisticVoted, setOptimisticVoted] = useState<string[]>([]);
  const [scoreAnimate, setScoreAnimate] = useState<
    Record<string, "green" | "red" | null>
  >({});
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const votedIds = useMemo(
    () => new Set([...initialVotedFigureIds, ...optimisticVoted]),
    [initialVotedFigureIds, optimisticVoted],
  );

  const figures = useMemo(() => {
    return [...initialFigures]
      .map((f) => ({ ...f, score: scores[f.id] ?? f.score }))
      .sort((a, b) => b.score - a.score);
  }, [initialFigures, scores]);

  const filtered = useMemo(() => {
    if (tab === "rising") return figures.filter((f) => f.score > 2000);
    if (tab === "falling") return figures.filter((f) => f.score < 1000);
    return figures;
  }, [figures, tab]);

  const maxScore = useMemo(
    () => Math.max(1, ...figures.map((f) => Math.abs(f.score))),
    [figures],
  );

  useEffect(() => {
    refreshTimer.current = setInterval(() => router.refresh(), 10_000);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [router]);

  function addToast(message: string, type: Toast["type"]) {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type, exiting: false }]);
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
      );
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        200,
      );
    }, 2000);
  }

  async function vote(figureId: string, direction: "up" | "down") {
    if (busyId || votedIds.has(figureId)) return;
    setBusyId(figureId);

    const prevScore = scores[figureId] ?? 0;
    const delta = direction === "up" ? 100 : -100;
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
        addToast("🔒 Already voted this session", "gray");
        return;
      }
      if (!res.ok) {
        setScores((prev) => ({ ...prev, [figureId]: prevScore }));
        setOptimisticVoted((prev) => prev.filter((id) => id !== figureId));
        addToast(body.error ?? "Vote failed — try again", "gray");
        return;
      }

      const serverScore =
        typeof body.score === "number" ? body.score : prevScore + delta;
      setScores((prev) => ({ ...prev, [figureId]: serverScore }));
      setScoreAnimate((prev) => ({ ...prev, [figureId]: direction === "up" ? "green" : "red" }));
      setTimeout(
        () => setScoreAnimate((prev) => ({ ...prev, [figureId]: null })),
        520,
      );

      const fig = initialFigures.find((f) => f.id === figureId);
      setActivity((prev) =>
        [
          {
            figureName: fig?.name ?? "Someone",
            direction,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 10),
      );

      addToast(
        direction === "up" ? "✦ Aura boosted +100" : "✦ Aura drained -100",
        direction === "up" ? "green" : "red",
      );
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div
      className="mx-auto flex w-full max-w-[720px] flex-col gap-10 px-4 pb-24 pt-10"
      style={{ color: "var(--text-primary)" }}
    >
      {/* ── Header ── */}
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2">
          <span
            className="pulse-dot h-2 w-2 rounded-full"
            style={{ background: "var(--accent-green)" }}
          />
          <span
            className="text-xs font-bold uppercase tracking-[0.25em]"
            style={{ color: "var(--accent-green)" }}
          >
            LIVE
          </span>
        </div>
        <h1
          className="text-5xl font-black uppercase tracking-[0.15em] sm:text-6xl"
          style={{ color: "var(--accent-green)" }}
        >
          AURA FARMER
        </h1>
        <p className="text-base" style={{ color: "var(--text-secondary)" }}>
          The internet decides who has aura.
        </p>
      </header>

      {/* ── Tabs ── */}
      <div
        className="flex items-center gap-2 rounded-full p-1"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
      >
        {(
          [
            ["all", "All"],
            ["rising", "Rising"],
            ["falling", "Falling"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className="flex-1 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-150"
            style={
              tab === key
                ? {
                    background: "var(--accent-green)",
                    color: "#0a0a0a",
                  }
                : {
                    color: "var(--text-secondary)",
                  }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Leaderboard ── */}
      <ul className="flex flex-col gap-3">
        {filtered.map((figure) => {
          const rank = figures.indexOf(figure) + 1;
          const score = figure.score;
          const alreadyVoted = votedIds.has(figure.id);
          const isBusy = busyId === figure.id;
          const widthPct = Math.min(
            100,
            Math.round((Math.abs(score) / maxScore) * 100),
          );
          const scoreIsPositive = score >= 0;
          const initials =
            figure.avatar_initials?.trim().slice(0, 4) ??
            figure.name
              .split(/\s+/)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase() ?? "")
              .join("");
          const avatarBg = figure.avatar_color ?? "#1a1a1a";
          const anim = scoreAnimate[figure.id];

          return (
            <li
              key={figure.id}
              className="group rounded-2xl p-4 transition-all duration-150"
              style={{
                background: "var(--card)",
                border: "1px solid var(--card-border)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 0 0 1px #00ff8744, 0 4px 24px #00ff8718";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div
                  className={`w-7 shrink-0 text-center text-lg font-black ${rankColor(rank)}`}
                >
                  {rank}
                </div>

                {/* Avatar */}
                <div
                  className="flex size-[52px] shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: avatarBg }}
                >
                  {initials || "?"}
                </div>

                {/* Name + bar */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold" style={{ color: "var(--text-primary)" }}>
                    {figure.name}
                  </p>
                  {figure.description && (
                    <p className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
                      {figure.description}
                    </p>
                  )}
                  <div
                    className="mt-2 h-1 w-full overflow-hidden rounded-full"
                    style={{ background: "#1f1f1f" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${widthPct}%`,
                        background: scoreIsPositive
                          ? "var(--accent-green)"
                          : "var(--accent-red)",
                        transition: "width 400ms cubic-bezier(.4,.14,.3,1)",
                      }}
                    />
                  </div>
                </div>

                {/* Score */}
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span
                    className={`text-xl font-black tabular-nums ${
                      anim === "green"
                        ? "score-pop-green"
                        : anim === "red"
                          ? "score-pop-red"
                          : ""
                    }`}
                    style={{
                      color: scoreIsPositive
                        ? "var(--accent-green)"
                        : "var(--accent-red)",
                    }}
                  >
                    {score >= 0 ? "+" : ""}
                    {score.toLocaleString()}
                  </span>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isBusy || alreadyVoted}
                      onClick={() => void vote(figure.id, "up")}
                      title={alreadyVoted ? "Already voted this session" : "Boost aura +100"}
                      className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all duration-150 disabled:pointer-events-none disabled:opacity-40"
                      style={
                        alreadyVoted && optimisticVoted.includes(figure.id)
                          ? {
                              background: "var(--accent-green)",
                              color: "#0a0a0a",
                              border: "1px solid var(--accent-green)",
                            }
                          : {
                              background: "transparent",
                              color: "var(--accent-green)",
                              border: "1px solid var(--accent-green)",
                            }
                      }
                      onMouseEnter={(e) => {
                        if (!alreadyVoted && !isBusy) {
                          (e.currentTarget as HTMLElement).style.background =
                            "var(--accent-green)";
                          (e.currentTarget as HTMLElement).style.color = "#0a0a0a";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!alreadyVoted && !isBusy) {
                          (e.currentTarget as HTMLElement).style.background =
                            "transparent";
                          (e.currentTarget as HTMLElement).style.color =
                            "var(--accent-green)";
                        }
                      }}
                    >
                      {alreadyVoted ? "🔒" : "+"} Boost
                    </button>
                    <button
                      type="button"
                      disabled={isBusy || alreadyVoted}
                      onClick={() => void vote(figure.id, "down")}
                      title={alreadyVoted ? "Already voted this session" : "Drain aura -100"}
                      className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all duration-150 disabled:pointer-events-none disabled:opacity-40"
                      style={{
                        background: "transparent",
                        color: "var(--accent-red)",
                        border: "1px solid var(--accent-red)",
                      }}
                      onMouseEnter={(e) => {
                        if (!alreadyVoted && !isBusy) {
                          (e.currentTarget as HTMLElement).style.background =
                            "var(--accent-red)";
                          (e.currentTarget as HTMLElement).style.color = "#0a0a0a";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!alreadyVoted && !isBusy) {
                          (e.currentTarget as HTMLElement).style.background =
                            "transparent";
                          (e.currentTarget as HTMLElement).style.color =
                            "var(--accent-red)";
                        }
                      }}
                    >
                      − Drain
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {!filtered.length && (
        <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
          No one here — try another tab.
        </p>
      )}

      {/* ── Activity Feed ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span
            className="pulse-dot h-2 w-2 rounded-full"
            style={{ background: "var(--accent-green)" }}
          />
          <h2
            className="text-xs font-black uppercase tracking-[0.25em]"
            style={{ color: "var(--text-secondary)" }}
          >
            LIVE FEED
          </h2>
        </div>
        <ul
          className="divide-y rounded-xl"
          style={{
            background: "var(--card)",
            border: "1px solid var(--card-border)",
          }}
        >
          {activity.slice(0, 10).map((row, i) => (
            <li
              key={`${row.createdAt}-${i}`}
              className="feed-item-enter flex items-center gap-2 px-4 py-3 text-sm"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{
                  background:
                    row.direction === "up"
                      ? "var(--accent-green)"
                      : "var(--accent-red)",
                }}
              />
              <span style={{ color: "var(--text-primary)" }}>{row.figureName}</span>
              <span
                style={{
                  color:
                    row.direction === "up"
                      ? "var(--accent-green)"
                      : "var(--accent-red)",
                }}
              >
                aura {row.direction === "up" ? "boosted +100" : "drained -100"}
              </span>
              <span className="ml-auto shrink-0" style={{ color: "var(--text-secondary)" }}>
                {relativeTimeShort(row.createdAt)}
              </span>
            </li>
          ))}
          {!activity.length && (
            <li className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
              No votes yet — be the first.
            </li>
          )}
        </ul>
        <p className="text-center text-[11px]" style={{ color: "#444" }}>
          New here?{" "}
          <Link
            href="/about"
            className="underline-offset-2 hover:underline"
            style={{ color: "var(--accent-green)" }}
          >
            Learn how it works
          </Link>
        </p>
      </section>

      {/* ── Toasts ── */}
      <div className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={`rounded-full px-4 py-2 text-sm font-semibold shadow-xl backdrop-blur ${
              t.exiting ? "toast-exit" : "toast-enter"
            }`}
            style={{
              background: "#181818",
              border: `1px solid ${
                t.type === "green"
                  ? "var(--accent-green)"
                  : t.type === "red"
                    ? "var(--accent-red)"
                    : "#444"
              }`,
              color:
                t.type === "green"
                  ? "var(--accent-green)"
                  : t.type === "red"
                    ? "var(--accent-red)"
                    : "var(--text-secondary)",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
