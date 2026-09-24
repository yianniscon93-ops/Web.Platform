import { NextResponse, type NextRequest } from "next/server";
import { getAreaBoundaries, getAreas, MAX_BOUNDARY_IDS } from "@/lib/server/marketData";

export const dynamic = "force-dynamic";

/** dim_areas ids: 'CY', 'D5', 'M5030', 'T6000A', 'CYC-15022726', demo slugs. */
const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;

/**
 * GET /api/dashboard/areas → every named area, without boundaries.
 * GET /api/dashboard/areas?ids=D1,CYC-15022726 → those areas with their
 * simplified boundary as GeoJSON (null where none) — fetched on selection.
 */
export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids");
  if (idsParam != null) {
    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter((s) => ID_RE.test(s));
    if (!ids.length || ids.length > MAX_BOUNDARY_IDS) {
      return NextResponse.json(
        { error: `ids must list 1–${MAX_BOUNDARY_IDS} area ids` },
        { status: 400 }
      );
    }
    const areas = await getAreaBoundaries(ids);
    return NextResponse.json(areas, {
      headers: { "Cache-Control": "private, max-age=3600" },
    });
  }
  const areas = await getAreas();
  return NextResponse.json(areas, {
    headers: { "Cache-Control": "private, max-age=3600" },
  });
}
