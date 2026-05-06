type WikiPage = {
  thumbnail?: { source: string; width: number; height: number };
};

type WikiResponse = {
  query?: { pages?: Record<string, WikiPage> };
};

export async function getWikipediaThumb(
  name: string,
  size = 200,
): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(name);
    const url =
      `https://en.wikipedia.org/w/api.php?action=query` +
      `&titles=${encoded}&prop=pageimages&format=json&pithumbsize=${size}&origin=*`;

    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;

    const json = (await res.json()) as WikiResponse;
    const pages = json.query?.pages ?? {};
    const page = Object.values(pages)[0];
    return page?.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}
