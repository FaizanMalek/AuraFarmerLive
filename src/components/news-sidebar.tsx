import type { ReactNode } from "react";

type Article = {
  id: string;
  title: string;
  url: string;
  section: string;
  publishedAt: string;
  excerpt: string | null;
  figureTag: string | null; // which leaderboard figure this is about
};

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/** Find which figure name is mentioned in a string (case-insensitive). */
function detectFigure(text: string, names: string[]): string | null {
  const lower = text.toLowerCase();
  for (const name of names) {
    // Match any part of the name (first OR last) to catch "Swift" → "Taylor Swift"
    const parts = name.split(/\s+/);
    const isMatch = parts.some((p) => p.length > 3 && lower.includes(p.toLowerCase()));
    if (isMatch) return name;
  }
  return null;
}

type GuardianResult = {
  id: string;
  webTitle: string;
  webUrl: string;
  sectionName: string;
  webPublicationDate: string;
  fields?: { headline?: string; trailText?: string };
};

async function fetchNews(figureNames: string[]): Promise<Article[]> {
  const key = process.env.GUARDIAN_API_KEY ?? "test";

  // Build OR query from figure names — quoted for exact phrase matching
  // Guardian supports: "Taylor Swift" OR "Elon Musk" OR ...
  const orQuery = figureNames
    .map((n) => `"${n}"`)
    .join(" OR ");

  const url =
    `https://content.guardianapis.com/search` +
    `?q=${encodeURIComponent(orQuery)}` +
    `&show-fields=headline,trailText` +
    `&page-size=10` +
    `&order-by=newest` +
    `&api-key=${key}`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];

    const json = (await res.json()) as {
      response?: { results?: GuardianResult[] };
    };

    return (json.response?.results ?? []).map((r) => {
      const title = r.fields?.headline ?? r.webTitle;
      const excerpt = r.fields?.trailText ?? null;
      const figureTag =
        detectFigure(title, figureNames) ??
        (excerpt ? detectFigure(excerpt, figureNames) : null);
      return {
        id: r.id,
        title,
        url: r.webUrl,
        section: r.sectionName,
        publishedAt: r.webPublicationDate,
        excerpt,
        figureTag,
      };
    });
  } catch {
    return [];
  }
}

function SidebarShell({ children }: { children: ReactNode }) {
  return (
    <aside className="flex flex-col gap-3 pt-10">
      <h2 className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">
        In the news
      </h2>
      {children}
    </aside>
  );
}

export default async function NewsSidebar({
  figureNames = [],
}: {
  figureNames?: string[];
}) {
  const articles = await fetchNews(
    figureNames.length ? figureNames : ["celebrities", "sports", "music", "film"],
  );

  if (!articles.length) {
    return (
      <SidebarShell>
        <p className="text-[13px] text-ink-3">
          News unavailable — add a{" "}
          <code className="rounded border border-edge bg-card px-1 py-0.5 text-[11px]">
            GUARDIAN_API_KEY
          </code>{" "}
          env var for live headlines.
        </p>
      </SidebarShell>
    );
  }

  return (
    <SidebarShell>
      {articles.map((a) => (
        <a
          key={a.id}
          href={a.url}
          target="_blank"
          rel="noreferrer noopener"
          className="group block rounded-lg border border-edge bg-card p-3 transition-shadow duration-150 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
        >
          {/* Meta row */}
          <div className="mb-1.5 flex items-center gap-1.5 flex-wrap">
            {a.figureTag && (
              <span className="rounded-full border border-edge bg-paper px-2 py-0.5 text-[10px] font-semibold text-ink">
                {a.figureTag}
              </span>
            )}
            <span className="text-[10px] text-ink-3">
              {a.section} · {timeAgo(a.publishedAt)}
            </span>
          </div>

          {/* Headline */}
          <p className="text-[13px] font-medium leading-snug text-ink group-hover:underline group-hover:underline-offset-2">
            {a.title}
          </p>

          {/* Excerpt */}
          {a.excerpt && (
            <p
              className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-ink-2"
              dangerouslySetInnerHTML={{ __html: a.excerpt }}
            />
          )}
        </a>
      ))}

      <p className="text-[11px] text-ink-3">
        Headlines from{" "}
        <a
          href="https://www.theguardian.com"
          target="_blank"
          rel="noreferrer noopener"
          className="underline underline-offset-2"
        >
          The Guardian
        </a>
      </p>
    </SidebarShell>
  );
}
