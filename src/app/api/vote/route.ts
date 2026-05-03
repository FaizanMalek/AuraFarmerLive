import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseClient } from "@/lib/supabase";
import {
  encodeVotedFigureIds,
  parseVotedFigureIds,
  VOTE_SESSION_COOKIE,
} from "@/lib/vote-session";

function isUuid(id: unknown): id is string {
  if (typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  );
}

export async function POST(request: Request) {
  let supabase;
  try {
    supabase = createSupabaseClient();
  } catch {
    return NextResponse.json({ error: "missing supabase env" }, { status: 503 });
  }

  try {
    const raw = await request.json();
    const figureId = raw.figureId ?? raw.figure_id;
    const direction = raw.direction;

    if (!isUuid(figureId) || (direction !== "up" && direction !== "down")) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const priorRaw = cookieStore.get(VOTE_SESSION_COOKIE)?.value;
    let voted: string[];
    try {
      voted = parseVotedFigureIds(priorRaw);
    } catch {
      return NextResponse.json(
        { error: "vote session misconfigured" },
        { status: 503 },
      );
    }

    if (voted.includes(figureId)) {
      return NextResponse.json(
        { error: "already_voted", code: "already_voted" },
        { status: 403 },
      );
    }

    const { data, error } = await supabase.rpc("submit_vote", {
      p_figure_id: figureId,
      p_direction: direction,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const score =
      typeof data === "number"
        ? data
        : typeof data === "string"
          ? Number(data)
          : Number(data ?? 0);

    const nextVoted = [...voted, figureId];
    let cookieValue: string;
    try {
      cookieValue = encodeVotedFigureIds(nextVoted);
    } catch {
      return NextResponse.json(
        { error: "vote session misconfigured" },
        { status: 503 },
      );
    }

    revalidatePath("/");

    const res = NextResponse.json({ score });
    res.cookies.set(VOTE_SESSION_COOKIE, cookieValue, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}
