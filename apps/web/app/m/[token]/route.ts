import { verifyMapToken } from "@/lib/server/maplink";

// Signed map link from the MCP connector (docs/MAP_LINKS.md).
export const dynamic = "force-dynamic";

const INVALID_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Invalid map link</title>
<meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family:system-ui,sans-serif;padding:2rem;max-width:40rem;margin:auto">
<p>This map link is invalid or has expired.</p>
<p><a href="/dashboard">Open the dashboard</a></p>
</body></html>`;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const secret = process.env.MAP_LINK_SECRET;
  // Feature off: behave as if the route did not exist.
  if (!secret) return new Response("Not found", { status: 404 });

  const { token } = await params;
  const payload = verifyMapToken(token, secret);
  if (!payload) {
    return new Response(INVALID_HTML, {
      status: 400,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const q = new URLSearchParams({ market: payload.m, area: payload.a });
  if (payload.p) q.set("period", payload.p);
  q.set("via", "link");
  // Relative Location (RFC 7231) — no reliance on the proxied Host header.
  return new Response(null, {
    status: 302,
    headers: { location: `/dashboard?${q.toString()}`, "cache-control": "no-store" },
  });
}
