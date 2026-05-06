/**
 * Photo resolution strategy:
 *  - Anime/fictional characters → Jikan (MyAnimeList) API
 *  - Everyone else             → Wikipedia batch thumbnails API
 *  Both fetches are cached 24 h by Next.js fetch caching.
 */

// ── Anime character slug → best MAL search term ─────────────────────────────

const ANIME_QUERY: Record<string, string> = {
  "gojo-satoru":    "Gojo Satoru",
  "toji-fushiguro": "Toji Fushiguro",
  "itadori-yuji":   "Yuji Itadori",
  "sukuna":         "Ryomen Sukuna",
  "zoro-roronoa":   "Roronoa Zoro",
  "luffy":          "Monkey D. Luffy",
  "levi-ackermann": "Levi",
  "naruto-uzumaki": "Naruto Uzumaki",
  "goku":           "Son Goku",
  "vegeta":         "Vegeta",
};

// ── Jikan (MAL) single character ────────────────────────────────────────────

type JikanResponse = {
  data?: { images?: { jpg?: { image_url?: string } } }[];
};

async function getJikanPhoto(query: string): Promise<string | null> {
  try {
    const url = `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const json = (await res.json()) as JikanResponse;
    return json.data?.[0]?.images?.jpg?.image_url ?? null;
  } catch {
    return null;
  }
}

// ── Wikipedia batch thumbnails ───────────────────────────────────────────────

type WikiBatchResponse = {
  query?: {
    normalized?: { from: string; to: string }[];
    pages?: Record<string, { title?: string; thumbnail?: { source: string } }>;
  };
};

async function batchWikipediaPhotos(
  names: string[],
  size: number,
): Promise<Record<string, string | null>> {
  if (!names.length) return {};

  // Wikipedia accepts up to ~50 titles per request
  const CHUNK = 50;
  const result: Record<string, string | null> = {};

  for (let i = 0; i < names.length; i += CHUNK) {
    const chunk = names.slice(i, i + CHUNK);
    try {
      const titles = chunk.map((n) => encodeURIComponent(n.replace(/ /g, "_"))).join("|");
      const url =
        `https://en.wikipedia.org/w/api.php?action=query` +
        `&titles=${titles}&prop=pageimages&format=json&pithumbsize=${size}&origin=*`;

      const res = await fetch(url, { next: { revalidate: 86400 } });
      if (!res.ok) continue;

      const json = (await res.json()) as WikiBatchResponse;
      const pages = json.query?.pages ?? {};

      // Build normalized-title → thumbnail map
      const thumbMap: Record<string, string> = {};
      for (const page of Object.values(pages)) {
        if (page.title && page.thumbnail?.source) {
          thumbMap[page.title] = page.thumbnail.source;
        }
      }

      // Wikipedia normalises titles (e.g. spaces→underscores fixed, capital letters).
      // Also build a map from normalized-from to normalized-to for lookups.
      const normMap: Record<string, string> = {};
      for (const n of json.query?.normalized ?? []) {
        normMap[n.from.replace(/_/g, " ")] = n.to;
      }

      for (const name of chunk) {
        const normalised = normMap[name] ?? name;
        result[name] = thumbMap[normalised] ?? null;
      }
    } catch {
      for (const name of chunk) result[name] = null;
    }
  }

  return result;
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Get a photo URL for a single figure (used on profile pages). */
export async function getFigurePhoto(
  slug: string,
  name: string,
  size = 300,
): Promise<string | null> {
  const animeQuery = ANIME_QUERY[slug];
  if (animeQuery) return getJikanPhoto(animeQuery);
  const results = await batchWikipediaPhotos([name], size);
  return results[name] ?? null;
}

/** Get photo URLs for all figures at once (used on the home page). */
export async function getAllFigurePhotos(
  figures: { id: string; slug: string; name: string }[],
  size = 120,
): Promise<Record<string, string | null>> {
  const anime = figures.filter((f) => ANIME_QUERY[f.slug]);
  const real  = figures.filter((f) => !ANIME_QUERY[f.slug]);

  // Fire anime (Jikan) and Wikipedia batch concurrently
  const [animeResults, wikiResults] = await Promise.all([
    Promise.all(
      anime.map(async (f) => {
        const photo = await getJikanPhoto(ANIME_QUERY[f.slug]!);
        return [f.id, photo] as [string, string | null];
      }),
    ),
    batchWikipediaPhotos(real.map((f) => f.name), size).then((map) =>
      real.map((f) => [f.id, map[f.name] ?? null] as [string, string | null]),
    ),
  ]);

  return Object.fromEntries([...animeResults, ...wikiResults]);
}
