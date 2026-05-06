import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";
import LeaderboardClient from "@/components/leaderboard-client";
import NewsSidebar from "@/components/news-sidebar";
import type { ActivityItem, FigurePublic } from "@/components/leaderboard-client";
import { createSupabaseClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseVotedFigureIds, VOTE_SESSION_COOKIE } from "@/lib/vote-session";

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
    .limit(8);

  if (!voteRows?.length) return [];

  const ids = [...new Set(voteRows.map((v) => v.figure_id).filter(Boolean))];
  const { data: figs } = await supabase
    .from("figures")
    .select("id, name")
    .in("id", ids);

  const nameMap = Object.fromEntries((figs ?? []).map((f) => [f.id, f.name]));

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
      <div className="mx-auto flex max-w-[680px] flex-1 flex-col items-center justify-center gap-5 px-5 py-24 text-center">
        <p className="text-[12px] font-medium text-ink-2">Setup required</p>
        <h1 className="text-[24px] font-semibold text-ink">
          Wire the database
        </h1>
        <p className="text-[14px] text-ink-2">
          Copy{" "}
          <code className="rounded border border-edge bg-card px-1.5 py-0.5 text-xs">
            .env.local.example
          </code>{" "}
          to{" "}
          <code className="rounded border border-edge bg-card px-1.5 py-0.5 text-xs">
            .env.local
          </code>
          , add Supabase keys, run{" "}
          <code className="rounded border border-edge bg-card px-1.5 py-0.5 text-xs">
            SUPABASE_SETUP.sql
          </code>{" "}
          in the SQL editor, then restart.
        </p>
        <Link
          href="/about"
          className="text-[14px] text-ink-2 underline-offset-4 hover:text-ink hover:underline"
        >
          Learn what Aura Farmer is
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
      <div className="mx-auto flex max-w-[680px] flex-1 flex-col items-center justify-center gap-3 px-5 py-24 text-center">
        <h1 className="text-[18px] font-semibold text-down">
          Cannot load leaderboard
        </h1>
        <p className="text-[14px] text-ink-2">{error.message}</p>
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
    <div className="min-h-full flex-1 bg-paper">
      {/* Two-column on xl screens, single column otherwise */}
      <div className="mx-auto flex max-w-[1200px] items-start gap-8 px-5">
        {/* Leaderboard — constrained to 680px max, fills available space */}
        <div className="min-w-0 flex-1 xl:max-w-[680px]">
          <LeaderboardClient
            initialFigures={normalized}
            initialActivity={activity}
            initialVotedFigureIds={votedFigureIds}
          />
        </div>
        {/* News sidebar — only visible on xl+ */}
        <div className="hidden w-[300px] shrink-0 pt-10 xl:block">
          <Suspense
            fallback={
              <div className="text-[13px] text-ink-3">Loading news…</div>
            }
          >
            <NewsSidebar />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
