/**
 * Self-check for signed map links (no test runner in this repo).
 * Run: npx -y tsx scripts/check-maplink.ts   (exits 1 on any failure)
 */
import { createHmac } from "node:crypto";
import {
  signMapToken,
  verifyMapToken,
  type MapLinkPayload,
} from "../apps/web/src/lib/server/maplink";

const SECRET = "test-secret-do-not-use";
const NOW = Date.UTC(2026, 8, 26); // 2026-09-26
const payload: MapLinkPayload = { v: 1, m: "cyprus", a: "M5030", p: "last_90d", exp: 1893456000 };

let failed = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failed++;
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// Expected token built directly from the primitives.
const json = Buffer.from(JSON.stringify(payload), "utf8");
const expected = `${json.toString("base64url")}.${createHmac("sha256", SECRET).update(json).digest("base64url")}`;
const token = signMapToken(payload, SECRET);
check("sign matches hand-built token", token === expected);
check("no base64 padding", !token.includes("="));

// Same token produced independently by Python (json.dumps compact + hmac + urlsafe_b64encode).
const PY_TOKEN =
  "eyJ2IjoxLCJtIjoiY3lwcnVzIiwiYSI6Ik01MDMwIiwicCI6Imxhc3RfOTBkIiwiZXhwIjoxODkzNDU2MDAwfQ.6Mb39Ilk0w6U0u0djRuufgwFurKun0R6WozQOpkxDWQ";
check("matches Python reference token", token === PY_TOKEN);

check("valid token verifies", same(verifyMapToken(token, SECRET, NOW), payload));
check("wrong secret fails", verifyMapToken(token, "other-secret", NOW) === null);
check("empty secret fails", verifyMapToken(token, "", NOW) === null);

// Tampered payload: swap the area, keep the old signature.
const [, sig] = token.split(".");
const forged = Buffer.from(JSON.stringify({ ...payload, a: "D5" })).toString("base64url");
check("tampered payload fails", verifyMapToken(`${forged}.${sig}`, SECRET, NOW) === null);
check("tampered signature fails", verifyMapToken(`${token.slice(0, -2)}AA`, SECRET, NOW) === null);
check("truncated signature fails", verifyMapToken(token.slice(0, -4), SECRET, NOW) === null);

// Expiry: signature fine, exp in the past / exactly now.
const expired = signMapToken({ ...payload, exp: Math.floor(NOW / 1000) - 1 }, SECRET);
check("expired token fails", verifyMapToken(expired, SECRET, NOW) === null);
const edge = signMapToken({ ...payload, exp: Math.floor(NOW / 1000) }, SECRET);
check("exp == now fails", verifyMapToken(edge, SECRET, NOW) === null);

// Shape checks (signed, but not a valid payload).
const badMarket = signMapToken({ ...payload, m: "paris" } as unknown as MapLinkPayload, SECRET);
check("unknown market fails", verifyMapToken(badMarket, SECRET, NOW) === null);
const nullPeriod = signMapToken({ ...payload, p: null }, SECRET);
check("null period verifies", verifyMapToken(nullPeriod, SECRET, NOW)?.p === null);
check("garbage fails", verifyMapToken("not-a-token", SECRET, NOW) === null);
check("three parts fail", verifyMapToken(`${token}.x`, SECRET, NOW) === null);

console.log(failed ? `\n${failed} check(s) failed` : "\nall checks passed");
process.exit(failed ? 1 : 0);
