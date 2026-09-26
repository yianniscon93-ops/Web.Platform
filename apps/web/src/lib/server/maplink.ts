/**
 * Signed map links (docs/MAP_LINKS.md). The Noesis MCP connector hands out
 * `<dashboard>/m/<token>`; this module signs and verifies the token.
 *
 * Token = `<base64url(json)>.<base64url(hmac_sha256(secret, json_bytes))>`,
 * base64url without padding. The HMAC covers the exact JSON bytes that were
 * sent, so the signer's key order / whitespace doesn't matter here.
 * Server-only (node:crypto).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export type MapLinkMarket = "cyprus" | "athens";

export interface MapLinkPayload {
  v: 1;
  m: MapLinkMarket;
  /** dim_areas.area_id */
  a: string;
  /** Connector period name (last_30d, last_90d, last_12m, peak, …) or null. */
  p: string | null;
  /** Expiry, unix seconds. */
  exp: number;
}

const B64URL = /^[A-Za-z0-9_-]+$/;

function b64url(buf: Buffer): string {
  return buf.toString("base64url"); // Node emits no padding
}

function hmac(secret: string, data: Buffer): Buffer {
  return createHmac("sha256", secret).update(data).digest();
}

export function signMapToken(payload: MapLinkPayload, secret: string): string {
  const json = Buffer.from(JSON.stringify(payload), "utf8");
  return `${b64url(json)}.${b64url(hmac(secret, json))}`;
}

function isPayload(x: unknown): x is MapLinkPayload {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    o.v === 1 &&
    (o.m === "cyprus" || o.m === "athens") &&
    typeof o.a === "string" &&
    o.a.length > 0 &&
    (o.p === null || typeof o.p === "string") &&
    typeof o.exp === "number" &&
    Number.isFinite(o.exp)
  );
}

/** The payload when the signature matches and `exp` is in the future, else null. */
export function verifyMapToken(
  token: string,
  secret: string,
  now: number = Date.now()
): MapLinkPayload | null {
  if (!secret || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!B64URL.test(body) || !B64URL.test(sig)) return null;

  const json = Buffer.from(body, "base64url");
  const given = Buffer.from(sig, "base64url");
  const expected = hmac(secret, json);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(json.toString("utf8"));
  } catch {
    return null;
  }
  if (!isPayload(payload)) return null;
  if (payload.exp * 1000 <= now) return null;
  return payload;
}
