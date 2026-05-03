import { createHmac, timingSafeEqual } from "node:crypto";

/** HttpOnly cookie: signed list of figure UUIDs already voted this session (browser session). */
export const VOTE_SESSION_COOKIE = "af_voted_figures";

function getSecret(): string {
  const s = process.env.VOTE_COOKIE_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "development") {
    return "dev-only-vote-secret-min-16-chars";
  }
  throw new Error("VOTE_COOKIE_SECRET must be set (min 16 chars) in production");
}

function signPayload(payloadB64: string): string {
  const mac = createHmac("sha256", getSecret())
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${mac}`;
}

function verifyAndParse(raw: string | undefined): string[] {
  if (!raw) return [];
  const parts = raw.split(".");
  if (parts.length !== 2) return [];
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return [];
  const expected = createHmac("sha256", getSecret())
    .update(payloadB64)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return [];
  try {
    const json = Buffer.from(payloadB64, "base64url").toString("utf8");
    const data = JSON.parse(json) as unknown;
    if (!data || typeof data !== "object" || !("ids" in data)) return [];
    const ids = (data as { ids: unknown }).ids;
    if (!Array.isArray(ids)) return [];
    return ids.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function parseVotedFigureIds(rawCookieValue: string | undefined): string[] {
  return verifyAndParse(rawCookieValue);
}

export function encodeVotedFigureIds(ids: string[]): string {
  const unique = [...new Set(ids)];
  const payloadB64 = Buffer.from(JSON.stringify({ ids: unique }), "utf8").toString(
    "base64url",
  );
  return signPayload(payloadB64);
}
