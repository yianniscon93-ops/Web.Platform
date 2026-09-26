# Signed map links (`/m/<token>`)

Roadmap Workstream E. The Noesis MCP connector (Data.Insights) puts
`map_url = <NOESIS_DASHBOARD_URL>/m/<token>` in its answers; this app
verifies the token and opens the dashboard on that area.

## Token

`<base64url(json)>.<base64url(hmac_sha256(secret, json_bytes))>` —
base64url **without padding**. The HMAC is over the exact JSON bytes in the
first part (key order / whitespace are the signer's business).

```json
{"v":1,"m":"cyprus"|"athens","a":"<area_id>","p":"<period>"|null,"exp":<unix seconds>}
```

Valid when the HMAC matches (constant-time compare), `exp` is in the future
and the payload has that shape. Code: `apps/web/src/lib/server/maplink.ts`
(`verifyMapToken`, `signMapToken`); self-check:
`npx -y tsx scripts/check-maplink.ts` (includes a token produced by Python's
`hmac`/`base64.urlsafe_b64encode` as a cross-language fixture).

## Env

| Var | Where | Meaning |
|---|---|---|
| `MAP_LINK_SECRET` | this app + the connector (same value) | HMAC key. Unset here → `/m/*` answers 404 (feature off). |
| `NOESIS_DASHBOARD_URL` | the connector | This app's public origin. There is none yet — it arrives with the Vercel deploy (ROADMAP §2); until then leave it unset on the connector. |

## Route (`apps/web/app/m/[token]/route.ts`)

- secret unset → **404**
- bad signature / expired / malformed → **400** plain page "This map link is
  invalid or has expired."
- valid → **302** to `/dashboard?market=<m>&area=<a>[&period=<p>]&via=link`
  (relative `Location`, no-store).

## Dashboard side (`DashboardClient.tsx`)

Reads the params once on mount; nothing is synced back to the URL.

- `area` → preselected through the normal selection path (fly-to +
  boundary). Unknown id → the default whole-market view.
- `period` → `last_30d` / `last_90d` / `last_12m` set the date range to the
  trailing N days ending yesterday (Cyprus time). `peak` / `shoulder` / `off`
  have no single range here and are ignored.
- `market` → ignored: the dashboard is Cyprus-only today. An Athens link
  lands on the Cyprus view with no area selected.
- `via=link` → a small "Opened from Claude · read-only view" banner. Nothing
  is hidden yet; it is the hook for a later token-gated mode.
