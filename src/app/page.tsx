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
export const fetchCache = "force-no-store";

function coerceScore(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  if (typeof value === "number") return value;
  return 0;
}

async function fetchActivity(supabase: SupabaseClient): Promise<ActivityItem[]> {
  const { data: voteRows } = await supabase
    .from("votes")
    .select("direction, created_at, figure_id")
    .order("created_at", { ascending: false })
    .limit(10);

  if (!voteRows?.length) return [];

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
    direction: v.direction === "down" ? ("down" as const) : ("up" as const),
    createdAt: String(v.created_at),
  }));
}

export default async function Home() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!configured) {
    return (
      <div
        className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center"
        style={{ color: "#f0f0f0" }}
      >
        <span
          className="rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
          style={{ borderColor: "#ffd700", color: "#ffd700" }}
        >
          Setup required
        </span>
        <h1 className="text-3xl font-black uppercase tracking-wide">
          Wire the database
        </h1>
        <p style={{ color: "#888" }}>
          Copy{" "}
          <code className="rounded px-1 py-0.5 text-xs" style={{ background: "#1f1f1f" }}>
            .env.local.example
          </code>{" "}
          to{" "}
          <code className="rounded px-1 py-0.5 text-xs" style={{ background: "#1f1f1f" }}>
            .env.local
          </code>
          , add Supabase keys, run{" "}
          <code className="rounded px-1 py-0.5 text-xs" style={{ background: "#1f1f1f" }}>
            SUPABASE_SETUP.sql
          </code>{" "}
          in the SQL editor, then restart{" "}
          <code className="rounded px-1 py-0.5 text-xs" style={{ background: "#1f1f1f" }}>
            npm run dev
          </code>
          .
        </p>
        <Link
          href="/about"
          className="text-sm underline-offset-4 hover:underline"
          style={{ color: "#00ff87" }}
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
      <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-xl font-bold" style={{ color: "#ff3b3b" }}>
          Cannot load leaderboard
        </h1>
        <p style={{ color: "#888" }}>{error.message}</p>
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
    votedFigureIds = parseVotedFigureIds(jar.get(VOTE_SESSION_COOKIE)?.value);
  } catch {
    votedFigureIds = [];
  }

  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      style={{ background: "var(--bg)" }}
    >
      <LeaderboardClient
        initialFigures={normalized}
        initialActivity={activity}
        initialVotedFigureIds={votedFigureIds}
      />
    </div>
  );
}
