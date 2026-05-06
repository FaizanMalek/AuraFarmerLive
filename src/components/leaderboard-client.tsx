"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

// ── Activity message flavour ─────────────────────────────────────────────────

const UP_MSGS = [
  (n: string) => `${n}'s aura was farmed`,
  (n: string) => `${n} went off`,
  (n: string) => `${n} secured the aura`,
  (n: string) => `${n} ate and left no crumbs`,
  (n: string) => `${n} is living in people's heads`,
  (n: string) => `${n} just levelled up`,
  (n: string) => `${n} said no cap and delivered`,
  (n: string) => `${n} got a massive W`,
];

const DOWN_MSGS = [
  (n: string) => `${n} took a massive L`,
  (n: string) => `${n}'s aura got cooked`,
  (n: string) => `${n} fumbled the bag`,
  (n: string) => `${n} is not surviving this`,
  (n: string) => `${n} fell off, no debate`,
  (n: string) => `${n} got ratio'd`,
  (n: string) => `${n}'s aura is in the drain`,
  (n: string) => `${n} was cooked and served`,
];

function activityMsg(name: string, direction: "up" | "down", seed: number): string {
  const list = direction === "up" ? UP_MSGS : DOWN_MSGS;
  return list[seed % list.length]!(name);
}

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

function ChevronUp() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path d="M2.5 8.5L6.5 4.5L10.5 8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path d="M2.5 4.5L6.5 8.5L10.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden className="shrink-0">
      <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 10L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4" />
      <line x1="8" y1="1" x2="8" y2="3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="8" y1="13" x2="8" y2="15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="1" y1="8" x2="3" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="13" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="2.93" y1="2.93" x2="4.34" y2="4.34" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="11.66" y1="11.66" x2="13.07" y2="13.07" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="11.66" y1="4.34" x2="13.07" y2="2.93" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="2.93" y1="13.07" x2="4.34" y2="11.66" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <path d="M12 9.5A6 6 0 1 1 5.5 3a4.5 4.5 0 0 0 6.5 6.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
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
  const [search, setSearch] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestName, setSuggestName] = useState("");
  const [suggestCategory, setSuggestCategory] = useState("Celebrity");
  const [suggestNotes, setSuggestNotes] = useState("");
  const [suggestState, setSuggestState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync dark mode state from DOM after hydration
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("af-theme", next ? "dark" : "light"); } catch { /* */ }
  }

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
    let list = figures;
    if (tab === "rising")  list = list.filter((f) => f.score > 2000);
    if (tab === "falling") list = list.filter((f) => f.score < 1000);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }
    return list;
  }, [figures, tab, search]);

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

      const confirmed = typeof body.score === "number" ? body.score : prevScore + delta;
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

  async function submitSuggestion(e: React.FormEvent) {
    e.preventDefault();
    if (!suggestName.trim() || suggestState === "loading") return;
    setSuggestState("loading");
    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: suggestName.trim(), category: suggestCategory, notes: suggestNotes.trim() }),
      });
      setSuggestState(res.ok ? "done" : "error");
    } catch {
      setSuggestState("error");
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
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => { setSuggestOpen(true); setSuggestState("idle"); }}
            className="rounded-full border border-edge bg-card px-3 py-1 text-[12px] font-medium text-ink-2 transition-colors hover:border-ink-2 hover:text-ink"
          >
            + Suggest
          </button>
          <button
            type="button"
            aria-label="Toggle dark mode"
            onClick={toggleTheme}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-edge bg-card text-ink-2 transition-colors hover:border-ink-2 hover:text-ink"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <span className="pulse-dot h-2 w-2 rounded-full bg-up" />
          <span className="text-[12px] text-ink-2">live</span>
        </div>
      </header>

      {/* ── Search ── */}
      <div className="relative mt-5">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-3">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setVisibleCount(12); }}
          placeholder="Search figures…"
          aria-label="Search figures"
          className="w-full rounded-lg border border-edge bg-card py-2 pl-9 pr-4 text-[14px] text-ink placeholder:text-ink-3 focus:border-ink-2 focus:outline-none"
        />
        {search && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setSearch("")}
            className="absolute inset-y-0 right-3 flex items-center text-ink-3 hover:text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <nav className="mt-5 flex items-baseline gap-6" aria-label="Filter leaderboard">
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
            onClick={() => { setTab(key); setVisibleCount(12); setSearch(""); }}
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
          const voteDir = voteDirections[figure.id];
          const initials =
            figure.avatar_initials?.trim().slice(0, 4) ??
            figure.name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");

          return (
            <li
              key={figure.id}
              className="flex items-center gap-0 rounded-[10px] border border-edge bg-card px-4 py-3.5 transition-shadow duration-150 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)]"
            >
              {/* Rank */}
              <div className="w-8 shrink-0 text-right text-[13px] font-medium text-ink-3">
                {rank === 1 ? "★" : rank}
              </div>

              <div className="w-3 shrink-0" />

              {/* Avatar — links to profile */}
              <Link href={`/figure/${figure.slug}`} tabIndex={-1} aria-hidden>
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[14px] font-medium text-white transition-opacity hover:opacity-80"
                  style={{ backgroundColor: figure.avatar_color ?? "#888580" }}
                >
                  {initials || "?"}
                </div>
              </Link>

              <div className="w-3.5 shrink-0" />

              {/* Info block */}
              <div className="min-w-0 flex-1">
                <Link
                  href={`/figure/${figure.slug}`}
                  className="block truncate text-[15px] font-medium text-ink underline-offset-2 hover:underline"
                >
                  {figure.name}
                </Link>
                {figure.description && (
                  <p className="truncate text-[12px] text-ink-2">{figure.description}</p>
                )}
                <div className="mt-2 h-[3px] w-full overflow-hidden rounded-sm bg-bar-track">
                  <div
                    className={`h-full rounded-sm ${positive ? "bg-up" : "bg-down"}`}
                    style={{ width: `${pct}%`, transition: "width 400ms ease" }}
                  />
                </div>
              </div>

              <div className="w-4 shrink-0" />

              {/* Score */}
              <div
                className={`w-20 shrink-0 text-right text-[20px] font-semibold tabular-nums ${
                  positive ? "text-up" : "text-down"
                } ${scoreAnimating === figure.id ? "score-pop" : ""}`}
              >
                {positive ? "+" : ""}{score.toLocaleString()}
              </div>

              <div className="w-3 shrink-0" />

              {/* Vote buttons */}
              <div className="flex shrink-0 flex-col items-center gap-1">
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
                  ].filter(Boolean).join(" ")}
                >
                  <ChevronUp />
                </button>

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
                  ].filter(Boolean).join(" ")}
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
          {search ? `No results for "${search}"` : "Nothing here — try a different filter."}
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
              <span>{activityMsg(row.figureName, row.direction, i)}</span>
              <span className="ml-auto shrink-0 text-ink-3">{relTime(row.createdAt)}</span>
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
        <Link href="/about" className="underline-offset-4 transition-colors hover:text-ink-2 hover:underline">
          About
        </Link>
      </footer>

      {/* ── Suggest a figure modal ── */}
      {suggestOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 px-4 pb-4 backdrop-blur-[2px] sm:items-center sm:pb-0"
          onClick={(e) => { if (e.target === e.currentTarget) setSuggestOpen(false); }}
        >
          <div className="w-full max-w-[420px] rounded-2xl border border-edge bg-card shadow-xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-edge px-5 py-4">
              <h2 className="text-[15px] font-semibold text-ink">Suggest a figure</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setSuggestOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-edge hover:text-ink"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="px-5 py-5">
              {suggestState === "done" ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <span className="text-[32px]">🙏</span>
                  <p className="text-[15px] font-medium text-ink">Request sent!</p>
                  <p className="text-[13px] text-ink-2">
                    We&apos;ll review and add them to the leaderboard soon.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSuggestOpen(false)}
                    className="mt-2 rounded-full border border-edge bg-card px-5 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-edge"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => void submitSuggestion(e)} className="flex flex-col gap-4">
                  <div>
                    <label className="mb-1.5 block text-[12px] font-medium text-ink-2" htmlFor="suggest-name">
                      Name <span className="text-down">*</span>
                    </label>
                    <input
                      id="suggest-name"
                      type="text"
                      required
                      maxLength={100}
                      value={suggestName}
                      onChange={(e) => setSuggestName(e.target.value)}
                      placeholder="e.g. Gojo Satoru"
                      className="w-full rounded-lg border border-edge bg-paper px-3 py-2 text-[14px] text-ink placeholder:text-ink-3 focus:border-ink-2 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[12px] font-medium text-ink-2" htmlFor="suggest-category">
                      Category
                    </label>
                    <select
                      id="suggest-category"
                      value={suggestCategory}
                      onChange={(e) => setSuggestCategory(e.target.value)}
                      className="w-full rounded-lg border border-edge bg-paper px-3 py-2 text-[14px] text-ink focus:border-ink-2 focus:outline-none"
                    >
                      {["Celebrity", "Streamer", "Athlete", "Anime character", "Musician", "Politician", "Other"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[12px] font-medium text-ink-2" htmlFor="suggest-notes">
                      Why should they be on the list? <span className="text-ink-3">(optional)</span>
                    </label>
                    <textarea
                      id="suggest-notes"
                      rows={2}
                      maxLength={300}
                      value={suggestNotes}
                      onChange={(e) => setSuggestNotes(e.target.value)}
                      placeholder="They have massive aura because…"
                      className="w-full resize-none rounded-lg border border-edge bg-paper px-3 py-2 text-[14px] text-ink placeholder:text-ink-3 focus:border-ink-2 focus:outline-none"
                    />
                  </div>

                  {suggestState === "error" && (
                    <p className="text-[12px] text-down">Something went wrong — try again.</p>
                  )}

                  <button
                    type="submit"
                    disabled={suggestState === "loading" || !suggestName.trim()}
                    className="w-full rounded-full bg-ink py-2.5 text-[14px] font-semibold text-paper transition-opacity disabled:opacity-40"
                  >
                    {suggestState === "loading" ? "Sending…" : "Submit request"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

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
                toast.type === "up" ? "bg-up" : toast.type === "down" ? "bg-down" : "bg-ink-3"
              }`}
            />
            <span className="text-[13px] text-ink">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
