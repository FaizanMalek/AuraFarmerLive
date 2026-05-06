import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase";
import { getWikipediaThumb } from "@/lib/wikipedia";

type TrendItem = {
  figureId: string;
  name: string;
  slug: string;
  delta: number;
  currentScore: number;
  photo: string | null;
  initials: string;
  color: string;
};

async function fetchTrending(): Promise<{
  gainers: TrendItem[];
  losers: TrendItem[];
}> {
  let supabase;
  try {
    supabase = createSupabaseClient();
  } catch {
    return { gainers: [], losers: [] };
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: votes }, { data: allFigures }] = await Promise.all([
    supabase
      .from("votes")
      .select("figure_id, direction")
      .gte("created_at", since),
    supabase.from("figures").select("id, name, slug, score, avatar_initials, avatar_color"),
  ]);

  if (!votes?.length || !allFigures?.length) return { gainers: [], losers: [] };

  const deltas: Record<string, number> = {};
  for (const v of votes) {
    if (!v.figure_id) continue;
    deltas[String(v.figure_id)] =
      (deltas[String(v.figure_id)] ?? 0) + (v.direction === "up" ? 100 : -100);
  }

  const figMap = Object.fromEntries(allFigures.map((f) => [String(f.id), f]));

  const items: TrendItem[] = Object.entries(deltas)
    .filter(([id]) => figMap[id])
    .map(([id, delta]) => {
      const f = figMap[id];
      const name = String(f.name ?? "");
      const initials =
        String(f.avatar_initials ?? "")
          .trim()
          .slice(0, 4) ||
        name
          .split(/\s+/)
          .slice(0, 2)
          .map((p: string) => p[0]?.toUpperCase() ?? "")
          .join("");
      return {
        figureId: id,
        name,
        slug: String(f.slug ?? ""),
        delta,
        currentScore: Number(f.score ?? 0),
        photo: null,
        initials,
        color: String(f.avatar_color ?? "#888580"),
      };
    });

  const sorted = [...items].sort((a, b) => b.delta - a.delta);
  const gainers = sorted.filter((i) => i.delta > 0).slice(0, 3);
  const losers = sorted.filter((i) => i.delta < 0).reverse().slice(0, 3);

  // Fetch Wikipedia photos in parallel
  const addPhotos = (list: TrendItem[]) =>
    Promise.all(list.map(async (item) => ({ ...item, photo: await getWikipediaThumb(item.name, 80) })));

  const [gainersWithPhotos, losersWithPhotos] = await Promise.all([
    addPhotos(gainers),
    addPhotos(losers),
  ]);

  return { gainers: gainersWithPhotos, losers: losersWithPhotos };
}

function TrendCard({ item, positive }: { item: TrendItem; positive: boolean }) {
  return (
    <Link
      href={`/figure/${item.slug}`}
      className="group flex items-center gap-2.5 rounded-lg border border-edge bg-card p-2.5 transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)]"
    >
      {/* Avatar / photo */}
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
        {item.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.photo}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-[12px] font-medium text-white"
            style={{ backgroundColor: item.color }}
          >
            {item.initials || "?"}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-medium text-ink group-hover:underline group-hover:underline-offset-2">
          {item.name}
        </p>
        <p
          className={`text-[11px] font-semibold tabular-nums ${
            positive ? "text-up" : "text-down"
          }`}
        >
          {positive ? "+" : ""}
          {item.delta.toLocaleString()} this week
        </p>
      </div>
    </Link>
  );
}

export default async function TrendingSidebar() {
  const { gainers, losers } = await fetchTrending();

  if (!gainers.length && !losers.length) {
    return (
      <aside className="flex flex-col gap-4 pt-10">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">
          Trending
        </h2>
        <p className="text-[12px] text-ink-3">Not enough votes yet this week.</p>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col gap-5 pt-10">
      {gainers.length > 0 && (
        <section>
          <h2 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">
            <span className="text-up">↑</span> Rising this week
          </h2>
          <div className="flex flex-col gap-2">
            {gainers.map((item) => (
              <TrendCard key={item.figureId} item={item} positive />
            ))}
          </div>
        </section>
      )}

      {losers.length > 0 && (
        <section>
          <h2 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">
            <span className="text-down">↓</span> Biggest losers
          </h2>
          <div className="flex flex-col gap-2">
            {losers.map((item) => (
              <TrendCard key={item.figureId} item={item} positive={false} />
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
