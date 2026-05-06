import type { ReactNode } from "react";

type Article = {
  id: string;
  title: string;
  url: string;
  section: string;
  publishedAt: string;
  excerpt: string | null;
};

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

async function fetchNews(): Promise<Article[]> {
  const key = process.env.GUARDIAN_API_KEY ?? "test";
  const query = encodeURIComponent("celebrity viral trending culture");
  const url =
    `https://content.guardianapis.com/search?q=${query}` +
    `&section=culture|film|music|sport|technology` +
    `&show-fields=headline,trailText` +
    `&page-size=8` +
    `&order-by=newest` +
    `&api-key=${key}`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      response?: {
        results?: {
          id: string;
          webTitle: string;
          webUrl: string;
          sectionName: string;
          webPublicationDate: string;
          fields?: { headline?: string; trailText?: string };
        }[];
      };
    };
    return (json.response?.results ?? []).map((r) => ({
      id: r.id,
      title: r.fields?.headline ?? r.webTitle,
      url: r.webUrl,
      section: r.sectionName,
      publishedAt: r.webPublicationDate,
      excerpt: r.fields?.trailText ?? null,
    }));
  } catch {
    return [];
  }
}

function SidebarShell({ children }: { children: ReactNode }) {
  return (
    <aside className="flex flex-col gap-4">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">
        In the news
      </h2>
      {children}
    </aside>
  );
}

export default async function NewsSidebar() {
  const articles = await fetchNews();

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
          className="group block rounded-lg border border-edge bg-card p-3.5 transition-shadow duration-150 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
        >
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-ink-3">
            {a.section} · {timeAgo(a.publishedAt)}
          </p>
          <p className="text-[13px] font-medium leading-snug text-ink group-hover:underline group-hover:underline-offset-2">
            {a.title}
          </p>
          {a.excerpt && (
            <p
              className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-ink-2"
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
