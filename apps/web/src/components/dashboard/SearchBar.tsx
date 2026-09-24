"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import type { AreaInfo, AreaType } from "@/lib/dashboard/types";
import { UI } from "./tokens";

const TYPE_LABEL: Record<AreaType, string> = {
  country: "Country",
  district: "District",
  municipality: "Municipality",
  community: "Community",
  quarter: "Quarter",
  parish: "Parish",
  tourist_area: "Tourist area",
};

const LEVEL_HEADING: Record<AreaType, string> = {
  country: "Country",
  district: "District",
  municipality: "Municipalities",
  community: "Communities",
  quarter: "Quarters",
  parish: "Parishes",
  tourist_area: "Tourist areas",
};

/** Order of levels inside a district group. */
const LEVEL_ORDER: AreaType[] = [
  "district",
  "municipality",
  "tourist_area",
  "community",
  "quarter",
  "parish",
  "country",
];

/** Rows shown with no query / with a query (552 Cyprus rows in total). */
const TOP_N = 12;
const MAX_RESULTS = 60;

interface Row {
  area: AreaInfo;
  /** Parent area's name, shown after the level ("Quarter · Lefkosia"). */
  parentName: string | null;
  /** Name occurs more than once in dim_areas → this parent (district
   * included) is shown inline: "Agios Ioannis (Lefkosia)". */
  dupParent: string | null;
}

interface Group {
  key: string;
  label: string;
  levels: Array<{ type: AreaType; rows: Row[] }>;
}

/** Breadcrumb under a result: "Quarter · Lefkosia" (district is the group). */
function crumb(r: Row): string | null {
  const a = r.area;
  if (a.areaType === "country" || a.areaType === "district") return null;
  return r.parentName ? `${TYPE_LABEL[a.areaType]} · ${r.parentName}` : TYPE_LABEL[a.areaType];
}

/**
 * Area search over dim_areas (all levels — 552 Cyprus rows since the OSM
 * hierarchy of 24 Sep 2026). Substring match on English + Greek names,
 * district and parent name; the best matches by listing count (product
 * decision 11 Jul 2026) are grouped by district, then level. Names that
 * occur more than once (e.g. "Agios Ioannis" quarter of Lefkosia vs the
 * Nicosia community) carry their parent's name. Zero-listing areas are
 * hidden.
 *
 * Comparison-aware: the label summarises the active selection(s); when the
 * user armed "+ Compare", the placeholder flips and areas already in the
 * comparison are hidden from results.
 */
export default function SearchBar({
  areas,
  label,
  armed,
  excludeAreaIds,
  onPick,
  onClear,
}: {
  areas: AreaInfo[] | null;
  /** Summary of the active selection ("Kato Paphos", "Comparing 2 areas") or null. */
  label: string | null;
  /** Add-to-comparison mode — next pick appends instead of replacing. */
  armed: boolean;
  /** Areas already in the comparison — hidden from results. */
  excludeAreaIds: Set<string>;
  onPick: (a: AreaInfo) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Arming "+ Compare" drops the user straight into the search input.
  useEffect(() => {
    if (armed) {
      setOpen(true);
      // The input mounts on the next frame when a label was showing.
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [armed]);

  // Lookups over the full list: parent names, duplicate names, district
  // display names ("Nicosia" → "Nicosia District").
  const index = useMemo(() => {
    const byId = new Map<string, AreaInfo>();
    const nameCount = new Map<string, number>();
    const districtName = new Map<string, string>();
    for (const a of areas ?? []) {
      byId.set(a.areaId, a);
      const k = a.nameEn.toLowerCase();
      nameCount.set(k, (nameCount.get(k) ?? 0) + 1);
      if (a.areaType === "district" && a.district) districtName.set(a.district, a.nameEn);
    }
    return { byId, nameCount, districtName };
  }, [areas]);

  const groups = useMemo<Group[]>(() => {
    if (!areas) return [];
    const rows: Row[] = [];
    for (const a of areas) {
      if (a.listingCount <= 0 || a.areaType === "country" || excludeAreaIds.has(a.areaId)) continue;
      const parent = a.parentId ? index.byId.get(a.parentId) : undefined;
      rows.push({
        area: a,
        parentName:
          parent && parent.areaType !== "country" && parent.areaType !== "district"
            ? parent.nameEn
            : null,
        dupParent:
          (index.nameCount.get(a.nameEn.toLowerCase()) ?? 0) > 1 &&
          parent &&
          parent.areaType !== "country"
            ? parent.nameEn
            : null,
      });
    }
    const q = query.trim().toLowerCase();
    const matched = q
      ? rows.filter(
          (r) =>
            r.area.nameEn.toLowerCase().includes(q) ||
            (r.area.nameEl ?? "").toLowerCase().includes(q) ||
            (r.area.district ?? "").toLowerCase().includes(q) ||
            (r.parentName ?? "").toLowerCase().includes(q)
        )
      : rows;
    const top = [...matched]
      .sort((a, b) => b.area.listingCount - a.area.listingCount)
      .slice(0, q ? MAX_RESULTS : TOP_N);

    // District groups ordered by their best match; levels in LEVEL_ORDER.
    const byDistrict = new Map<string, Row[]>();
    for (const r of top) {
      const k = r.area.district ?? "";
      const list = byDistrict.get(k) ?? [];
      list.push(r);
      byDistrict.set(k, list);
    }
    return [...byDistrict.entries()].map(([k, list]) => ({
      key: k || "_other",
      label: k ? (index.districtName.get(k) ?? k) : "Other",
      levels: LEVEL_ORDER.map((type) => ({
        type,
        rows: list.filter((r) => r.area.areaType === type),
      })).filter((l) => l.rows.length),
    }));
  }, [areas, index, query, excludeAreaIds]);

  const results = useMemo(
    () => groups.flatMap((g) => g.levels.flatMap((l) => l.rows.map((r) => r.area))),
    [groups]
  );

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const pick = (a: AreaInfo) => {
    onPick(a);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative w-[340px] max-w-[calc(100vw-120px)]">
      <div
        className="glass-dark rounded-xl flex items-center gap-2.5 px-3.5 h-11"
        style={armed ? { boxShadow: `0 0 0 1.5px ${UI.green}66` } : undefined}
      >
        <Search size={15} style={{ color: UI.green }} className="shrink-0" />
        {label && !open ? (
          <button
            className="flex-1 flex items-center justify-between gap-2 text-left"
            onClick={() => setOpen(true)}
          >
            <span className="text-sm font-semibold truncate" style={{ color: UI.text }}>
              {label}
            </span>
          </button>
        ) : (
          <input
            ref={inputRef}
            value={query}
            autoFocus={open && !!label}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results.length) pick(results[0]);
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder={
              armed
                ? "Add an area to compare…"
                : "Search any area — town, resort, district…"
            }
            className="flex-1 bg-transparent outline-none text-sm font-medium"
            style={{ color: UI.text }}
          />
        )}
        {(label || query) && (
          <button
            onClick={() => {
              onClear();
              setQuery("");
              setOpen(false);
            }}
            className="shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Clear selection"
          >
            <X size={13} style={{ color: UI.muted }} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-12 left-0 right-0 glass-dark rounded-xl overflow-hidden py-1.5 max-h-[420px] overflow-y-auto ps-scroll">
          {armed && (
            <p className="px-3.5 pt-1 pb-1.5 text-[12px] font-semibold" style={{ color: UI.green }}>
              Adding to comparison
            </p>
          )}
          {groups.map((g) => (
            <div key={g.key} role="group" aria-label={g.label}>
              <p
                className="px-3.5 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wide"
                style={{ color: UI.muted }}
              >
                {g.label}
              </p>
              {g.levels.map((l) => (
                <div key={l.type}>
                  {l.type !== "district" && (
                    <p className="px-3.5 pt-1 text-[11px] font-semibold" style={{ color: UI.faint }}>
                      {LEVEL_HEADING[l.type]}
                    </p>
                  )}
                  {l.rows.map((r) => {
                    const a = r.area;
                    const sub = crumb(r);
                    return (
                      <button
                        key={a.areaId}
                        onClick={() => pick(a)}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left hover:bg-white/[0.07] transition-colors"
                      >
                        <MapPin
                          size={13}
                          style={{ color: a.areaType === "district" ? UI.green : UI.oliveLight }}
                          className="shrink-0"
                        />
                        <span className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block" style={{ color: UI.text }}>
                            {a.nameEn}
                            {r.dupParent && (
                              <span style={{ color: UI.muted }}> ({r.dupParent})</span>
                            )}
                          </span>
                          {sub && (
                            <span className="text-[12px] block" style={{ color: UI.faint }}>
                              {sub}
                            </span>
                          )}
                        </span>
                        <span className="text-[13px] shrink-0" style={{ color: UI.faint }}>
                          {a.listingCount.toLocaleString("en-GB")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
