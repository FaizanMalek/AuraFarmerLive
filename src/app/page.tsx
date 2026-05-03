import Link from "next/link";
import { cookies } from "next/headers";
import LeaderboardClient from "@/components/leaderboard-client";
import type { ActivityItem, FigurePublic } from "@/components/leaderboard-client";
import { createSupabaseClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseVotedFigureIds,
  VOTE_SESSION_COOKIE,
} from "@/lib/vote-session";

export const dynamic = "force-dynamic";

function coerceScore(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  if (typeof value === "number") return value;
  return 0;
}

async function fetchActivity(supabase: SupabaseClient) {
  const { data: voteRows } = await supabase
    .from("votes")
    .select("direction, created_at, figure_id")
    .order("created_at", { ascending: false })
    .limit(10);

  if (!voteRows?.length) return [] satisfies ActivityItem[];

  const ids = [...new Set(voteRows.map((v) => v.figure_id).filter(Boolean))];
  const { data: figures } = await supabase
    .from("figures")
    .select("id, name")
    .in("id", ids);

  const nameMap = Object.fromEntries(
    (figures ?? []).map((f) => [f.id, f.name]),
  );

  return voteRows.map((v) => ({
    figureName: nameMap[v.figure_id as string] ?? "Unknown",
    direction:
      v.direction === "down" ? ("down" as const) : ("up" as const),
    createdAt: String(v.created_at),
  }));
}

export default async function Home() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!configured) {
    return (
      <div className="mx-auto flex min-h-full flex-1 max-w-xl flex-col items-center justify-center gap-6 px-6 py-24 text-center text-zinc-100">
        <p className="rounded-full border border-amber-500/40 bg-amber-950/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">
          Supabase missing
        </p>
        <h1 className="text-balance text-3xl font-semibold">Wire the database</h1>
        <p className="text-pretty text-zinc-400">
          Copy <span className="font-mono text-zinc-200">.env.local.example</span>{" "}
          to <span className="font-mono text-zinc-200">.env.local</span>, add your
          project URL &amp; anon key, run{" "}
          <span className="font-mono text-zinc-200">SUPABASE_SETUP.sql</span> in
          Supabase SQL editor, then restart{" "}
          <span className="font-mono text-zinc-200">npm run dev</span>.
        </p>
        <Link
          href="/about"
          className="text-sm text-emerald-400 underline-offset-4 hover:underline"
        >
          Learn what Aura Farmer is →
        </Link>
      </div>
    );
  }

  const supabase = createSupabaseClient();
  const { data: figures, error } = await supabase
    .from("figures")
    .select("*")
    .order("score", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto flex min-h-full flex-1 max-w-xl flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-xl font-semibold text-red-400">Cannot load leaderboard</h1>
        <p className="text-zinc-500">{error.message}</p>
      </div>
    );
  }

  const normalized: FigurePublic[] = (figures ?? []).map((row) => ({
    id: String(row.id),
    name: row.name ?? "",
    slug: row.slug ?? "",
    description: row.description,
    avatar_initials: row.avatar_initials,
    avatar_color: row.avatar_color,
    score: coerceScore(row.score),
  }));

  normalized.sort((a, b) => b.score - a.score);

  const activity = await fetchActivity(supabase);

  const jar = await cookies();
  let votedFigureIds: string[] = [];
  try {
    votedFigureIds = parseVotedFigureIds(
      jar.get(VOTE_SESSION_COOKIE)?.value,
    );
  } catch {
    votedFigureIds = [];
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-950 px-4 pb-20 pt-10 text-zinc-50">
      <LeaderboardClient
        initialFigures={normalized}
        initialActivity={activity}
        initialVotedFigureIds={votedFigureIds}
      />
    </div>
  );
}
