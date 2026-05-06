import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { getFigurePhoto } from "@/lib/figure-photos";

export const dynamic = "force-dynamic";

// ── Types ───────────────────────────────────────────────────────────────────

type DayPoint = { date: string; delta: number; cumulative: number };

// ── Helpers ─────────────────────────────────────────────────────────────────

function toDateKey(iso: string): string {
  return iso.slice(0, 10); // "YYYY-MM-DD"
}

function buildChartData(
  votes: { direction: string; created_at: string }[],
): DayPoint[] {
  if (!votes.length) return [];

  // aggregate deltas by day
  const byDay: Record<string, number> = {};
  for (const v of votes) {
    const day = toDateKey(String(v.created_at));
    byDay[day] = (byDay[day] ?? 0) + (v.direction === "up" ? 100 : -100);
  }

  // fill all days from first vote to today
  const days = Object.keys(byDay).sort();
  const first = new Date(days[0]!);
  const today = new Date();
  const filled: DayPoint[] = [];
  let cumulative = 0;

  for (let d = new Date(first); d <= today; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const delta = byDay[key] ?? 0;
    cumulative += delta;
    filled.push({ date: key, delta, cumulative });
  }

  return filled;
}

// ── SVG sparkline ────────────────────────────────────────────────────────────

function AuraChart({ data }: { data: DayPoint[] }) {
  if (data.length < 2) {
    return (
      <p className="text-[13px] text-ink-3">
        Not enough data for a chart yet.
      </p>
    );
  }

  const W = 600;
  const H = 120;
  const PAD = { top: 8, right: 4, bottom: 24, left: 4 };
  const inner = { w: W - PAD.left - PAD.right, h: H - PAD.top - PAD.bottom };

  const values = data.map((d) => d.cumulative);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const toX = (i: number) => PAD.left + (i / (data.length - 1)) * inner.w;
  const toY = (v: number) =>
    PAD.top + (1 - (v - minV) / range) * inner.h;

  const linePts = data.map((d, i) => `${toX(i)},${toY(d.cumulative)}`).join(" L ");
  const pathD = `M ${linePts}`;

  // area fill
  const areaD = `M ${toX(0)},${toY(data[0]!.cumulative)} L ${linePts} L ${toX(data.length - 1)},${H - PAD.bottom} L ${toX(0)},${H - PAD.bottom} Z`;

  // x-axis label every ~7 data points
  const step = Math.max(1, Math.ceil(data.length / 6));
  const labels = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  const isPositive = values[values.length - 1]! >= values[0]!;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      aria-label="Aura over time"
      role="img"
    >
      <defs>
        <linearGradient id="aura-grad" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={isPositive ? "#4ade80" : "#f87171"}
            stopOpacity="0.25"
          />
          <stop
            offset="100%"
            stopColor={isPositive ? "#4ade80" : "#f87171"}
            stopOpacity="0"
          />
        </linearGradient>
      </defs>

      {/* Zero line */}
      {minV < 0 && maxV > 0 && (
        <line
          x1={PAD.left}
          y1={toY(0)}
          x2={W - PAD.right}
          y2={toY(0)}
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      )}

      {/* Area fill */}
      <path d={areaD} fill="url(#aura-grad)" />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={isPositive ? "#4ade80" : "#f87171"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* End dot */}
      <circle
        cx={toX(data.length - 1)}
        cy={toY(values[values.length - 1]!)}
        r="3"
        fill={isPositive ? "#4ade80" : "#f87171"}
      />

      {/* X-axis labels */}
      {labels.map((d) => {
        const i = data.indexOf(d);
        return (
          <text
            key={d.date}
            x={toX(i)}
            y={H - 4}
            textAnchor="middle"
            fontSize="9"
            fill="currentColor"
            opacity="0.45"
          >
            {d.date.slice(5)} {/* MM-DD */}
          </text>
        );
      })}
    </svg>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let supabase;
  try { supabase = createSupabaseClient(); } catch { return {}; }
  const { data } = await supabase.from("figures").select("name, description").eq("slug", slug).single();
  if (!data) return {};
  return {
    title: data.name,
    description: data.description ?? `Aura score for ${data.name} on Aura Farmer.`,
  };
}

export default async function FigurePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let supabase;
  try {
    supabase = createSupabaseClient();
  } catch {
    notFound();
  }

  const { data: figure } = await supabase!
    .from("figures")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!figure) notFound();

  const name = String(figure.name ?? "");
  const score = Number(figure.score ?? 0);
  const positive = score >= 0;
  const initials =
    String(figure.avatar_initials ?? "")
      .trim()
      .slice(0, 4) ||
    name.split(/\s+/).slice(0, 2).map((p: string) => p[0]?.toUpperCase() ?? "").join("");

  // Fetch votes for chart (all time, ordered ascending)
  const { data: voteRows } = await supabase!
    .from("votes")
    .select("direction, created_at")
    .eq("figure_id", figure.id)
    .order("created_at", { ascending: true });

  const chartData = buildChartData(voteRows ?? []);

  // Stats
  const totalVotes = voteRows?.length ?? 0;
  const upVotes = voteRows?.filter((v) => v.direction === "up").length ?? 0;
  const downVotes = totalVotes - upVotes;

  // Photo: Jikan for anime chars, Wikipedia for everyone else
  const photo = await getFigurePhoto(slug, name, 300);

  // Rank among all figures
  const { data: allFigures } = await supabase!
    .from("figures")
    .select("id, score")
    .order("score", { ascending: false });
  const rank = (allFigures ?? []).findIndex((f) => f.id === figure.id) + 1;

  return (
    <div className="mx-auto w-full max-w-[680px] px-5 pb-20 pt-10">

      {/* Back link */}
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-ink-2 transition-colors hover:text-ink"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Leaderboard
      </Link>

      {/* Hero */}
      <div className="flex items-start gap-5">
        {/* Photo / avatar */}
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-edge shadow-sm">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={name} className="h-full w-full object-cover object-top" />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-[28px] font-semibold text-white"
              style={{ backgroundColor: String(figure.avatar_color ?? "#888580") }}
            >
              {initials || "?"}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[26px] font-semibold leading-tight text-ink">{name}</h1>
            {rank > 0 && (
              <span className="rounded-full border border-edge bg-card px-2.5 py-0.5 text-[12px] font-medium text-ink-2">
                #{rank}
              </span>
            )}
          </div>
          {figure.description && (
            <p className="mt-1 text-[14px] text-ink-2">{figure.description}</p>
          )}
          <div className="mt-3 flex items-center gap-1">
            <span
              className={`text-[28px] font-bold tabular-nums leading-none ${
                positive ? "text-up" : "text-down"
              }`}
            >
              {positive ? "+" : ""}{score.toLocaleString()}
            </span>
            <span className="ml-1 text-[13px] text-ink-3">aura</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-6 grid grid-cols-3 divide-x divide-edge rounded-xl border border-edge bg-card">
        {[
          { label: "Total Votes", value: totalVotes.toLocaleString() },
          { label: "Boosts", value: upVotes.toLocaleString(), color: "text-up" },
          { label: "Drains", value: downVotes.toLocaleString(), color: "text-down" },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex flex-col items-center py-4">
            <span className={`text-[22px] font-semibold tabular-nums ${color ?? "text-ink"}`}>
              {value}
            </span>
            <span className="mt-0.5 text-[11px] text-ink-3">{label}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <section className="mt-8">
        <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">
          Aura over time
        </h2>
        <div className="overflow-hidden rounded-xl border border-edge bg-card p-4 text-ink-3">
          <AuraChart data={chartData} />
        </div>
      </section>

      {/* Recent votes */}
      {voteRows && voteRows.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">
            Recent Votes
          </h2>
          <ul className="flex flex-col gap-2">
            {[...voteRows].reverse().slice(0, 10).map((v, i) => {
              const dt = new Date(String(v.created_at));
              const label = dt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <li
                  key={i}
                  className="flex items-center gap-2 text-[12px] text-ink-2"
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      v.direction === "up" ? "bg-up" : "bg-down"
                    }`}
                  />
                  <span>
                    {v.direction === "up" ? "Aura boosted +100" : "Aura drained −100"}
                  </span>
                  <span className="ml-auto text-ink-3">{label}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Footer */}
      <div className="mt-12 border-t border-edge pt-6 text-center text-[12px] text-ink-3">
        <Link href="/" className="underline-offset-4 hover:text-ink-2 hover:underline">
          ← Back to leaderboard
        </Link>
      </div>
    </div>
  );
}
