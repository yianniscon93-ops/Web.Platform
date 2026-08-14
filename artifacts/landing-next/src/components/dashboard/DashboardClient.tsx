"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Building2,
  Calculator,
  Hexagon,
  LineChart,
  PenLine,
  Plus,
  SlidersHorizontal,
  Timer,
  X,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import type {
  AreaHealth,
  AreaInfo,
  CompareSlot,
  DashboardSummary,
  InvestStats,
  ListingDetail,
  MarketResponse,
  OccWindow,
  PaceData,
  PointRow,
  PolygonCoords,
  PricingData,
  RentalStats,
  Selection,
  SlotView,
} from "@/lib/dashboard/types";
import { DEFAULT_FILTERS, encodeFilters, type Filters } from "@/lib/dashboard/filters";
import { fmtDate, fmtInt } from "@/lib/dashboard/format";
import { FIRST_WEEK, clampRange, mondayOf, sundayOf } from "@/lib/dashboard/weeks";
import { UI } from "./tokens";
import {
  MAX_SLOTS,
  SLOT_COLORS,
  SLOT_DASH,
  SlotChip,
  nextSlotStyle,
  sameSelection,
} from "./compare";
import FilterPanel from "./FilterPanel";
import SearchBar from "./SearchBar";
import MarketTab from "./MarketTab";
import PricingTab from "./PricingTab";
import PaceTab from "./PaceTab";
import BuyRentTab from "./BuyRentTab";
import CalculatorTab from "./CalculatorTab";
import HoverCard from "./HoverCard";
import DateRangeCalendar from "./DateRangeCalendar";
import Explain from "./Explain";

const MarketMap = dynamic(() => import("./MarketMap"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full flex items-center justify-center text-sm"
      style={{ background: "#E8EDE3", color: "#697264" }}
    >
      Loading map…
    </div>
  ),
});

type TabId = "market" | "pricing" | "pace" | "buyrent" | "calc";

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg p-0.5 gap-0.5 glass-card">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className="px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap"
            style={
              active
                ? { background: UI.olive, color: "#FFFFFF" }
                : { background: "transparent", color: UI.muted }
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Fly-to zoom from a dim_areas search radius. */
function zoomForRadius(km: number | null): number {
  if (km == null) return 12;
  return Math.max(9, Math.min(14, Math.round(13.5 - Math.log2(Math.max(1, km)))));
}

/** Stable cache key for a selection's data scope. */
function selKeyOf(sel: Selection): string {
  if (sel.kind === "all") return "all";
  if (sel.kind === "area") return `a:${sel.area.areaId}`;
  return `p:${JSON.stringify(sel.coords)}`;
}

/** Session-scoped response cache so toggling comparisons never refetches. */
function cachePut<T>(map: Map<string, T>, key: string, value: T) {
  if (map.size > 60) map.clear();
  map.set(key, value);
}

type SlotRecord<T> = Record<string, T | null>;

export default function DashboardClient() {
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS });
  const [window_, setWindow] = useState<OccWindow>("todate");
  const [drawing, setDrawing] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [tab, setTab] = useState<TabId>("market");

  // --- Comparison slots -----------------------------------------------------
  // One slot = today's single-selection behaviour. "+ Compare" arms add-mode:
  // the next searched or drawn area appends a slot (up to MAX_SLOTS), and all
  // tabs flip to side-by-side comparison.
  const slotSeq = useRef(1);
  const [slots, setSlots] = useState<CompareSlot[]>([
    { id: "s1", color: SLOT_COLORS[0], dash: SLOT_DASH[0], selection: { kind: "all" } },
  ]);
  const [armed, setArmed] = useState(false);
  const compare = slots.length > 1;

  // Camera target — set explicitly on selection changes so removals never
  // yank the map around.
  const [mapCam, setMapCam] = useState<{
    focus: { lat: number; lng: number; zoom: number } | null;
    fit: PolygonCoords | null;
  }>({ focus: null, fit: null });

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [areas, setAreas] = useState<AreaInfo[] | null>(null);
  const [points, setPoints] = useState<PointRow[] | null>(null);
  const [health, setHealth] = useState<AreaHealth | null>(null);

  const [markets, setMarkets] = useState<SlotRecord<MarketResponse>>({});
  const [pricings, setPricings] = useState<SlotRecord<PricingData>>({});
  const [invests, setInvests] = useState<SlotRecord<InvestStats>>({});
  const [rentalss, setRentalss] = useState<SlotRecord<RentalStats>>({});
  const [paces, setPaces] = useState<SlotRecord<PaceData>>({});

  const marketCache = useRef(new Map<string, MarketResponse>());
  const pricingCache = useRef(new Map<string, PricingData>());
  const investCache = useRef(new Map<string, InvestStats>());
  const rentalsCache = useRef(new Map<string, RentalStats>());
  const paceCache = useRef(new Map<string, PaceData>());

  const [hoverId, setHoverId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ListingDetail | null>(null);
  const detailCache = useRef(new Map<string, ListingDetail>());

  // Date range picked at day level (Airbnb-style calendar); the data
  // aggregates by whole ISO weeks (Cyprus time) underneath. Bounds come
  // from sync_meta: first covered Monday → Sunday of the last forward week.
  const maxWeek = summary?.fwdEnd ? mondayOf(summary.fwdEnd) : FIRST_WEEK;
  const maxDay = sundayOf(maxWeek);
  const [dayRange, setDayRange] = useState<[string, string] | null>(null);
  const effectiveDays = useMemo<[string, string]>(() => {
    const r = dayRange ?? [FIRST_WEEK, maxDay];
    let [from, to] = r;
    if (from < FIRST_WEEK) from = FIRST_WEEK;
    if (to > maxDay) to = maxDay;
    if (to < from) to = from;
    return [from, to];
  }, [dayRange, maxDay]);
  const effectiveRange = useMemo<[string, string]>(
    () => clampRange(effectiveDays[0], effectiveDays[1], FIRST_WEEK, maxWeek),
    [effectiveDays, maxWeek]
  );

  const filtersKey = useMemo(() => encodeFilters(filters), [filters]);
  const debouncedFilters = useDebounced(filtersKey, 300);

  // --- Selection handling ---------------------------------------------------

  const pickSelection = useCallback(
    (sel: Selection) => {
      setSlots((prev) => {
        if (prev.some((s) => sameSelection(s.selection, sel))) return prev;
        // Single mode without add-mode: replace, exactly like before.
        if (prev.length === 1 && !armed) return [{ ...prev[0], selection: sel }];
        // Add-mode or already comparing: append; at capacity, swap the last.
        if (prev.length >= MAX_SLOTS) {
          const last = prev[prev.length - 1];
          return [
            ...prev.slice(0, -1),
            { id: `s${++slotSeq.current}`, color: last.color, dash: last.dash, selection: sel },
          ];
        }
        const style = nextSlotStyle(prev);
        return [...prev, { id: `s${++slotSeq.current}`, ...style, selection: sel }];
      });
      setArmed(false);
      if (sel.kind === "area" && sel.area.lat != null && sel.area.lng != null) {
        setMapCam({
          focus: { lat: sel.area.lat, lng: sel.area.lng, zoom: zoomForRadius(sel.area.radiusKm) },
          fit: null,
        });
      } else if (sel.kind === "polygon") {
        setMapCam({ focus: null, fit: sel.coords });
      }
    },
    [armed]
  );

  const removeSlot = useCallback((id: string) => {
    setSlots((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length) return next;
      return [
        { id: `s${++slotSeq.current}`, color: SLOT_COLORS[0], dash: SLOT_DASH[0], selection: { kind: "all" } },
      ];
    });
  }, []);

  const clearAll = useCallback(() => {
    setSlots([
      { id: `s${++slotSeq.current}`, color: SLOT_COLORS[0], dash: SLOT_DASH[0], selection: { kind: "all" } },
    ]);
    setArmed(false);
    setMapCam({ focus: null, fit: null });
  }, []);

  // --- Shared fetches (selection-independent) -------------------------------

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((r) => r.json())
      .then(setSummary)
      .catch(console.error);
    fetch("/api/dashboard/areas")
      .then((r) => r.json())
      .then(setAreas)
      .catch(console.error);
    // Area health is island-wide and selection-independent — one fetch.
    fetch("/api/dashboard/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(console.error);
  }, []);

  // Map dots: attribute filters only — the selections are drawn on top.
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/dashboard/points?${debouncedFilters}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then(setPoints)
      .catch((e: Error) => e.name !== "AbortError" && console.error(e));
    return () => ctrl.abort();
  }, [debouncedFilters]);

  // --- Per-slot fetches -----------------------------------------------------

  const filterParams = useMemo(
    () => Object.fromEntries(new URLSearchParams(debouncedFilters)),
    [debouncedFilters]
  );

  // Market payload drives Market overview + Pricing tabs — fetched per slot.
  // Stale data stays visible while a slot refetches (matches v4 behaviour).
  useEffect(() => {
    const ctrl = new AbortController();
    for (const slot of slots) {
      const key = `${selKeyOf(slot.selection)}|${debouncedFilters}|${effectiveRange[0]}|${effectiveRange[1]}`;
      const cached = marketCache.current.get(key);
      if (cached) {
        setMarkets((m) => (m[slot.id] === cached ? m : { ...m, [slot.id]: cached }));
        continue;
      }
      const selectionPayload =
        slot.selection.kind === "area"
          ? { kind: "area" as const, areaId: slot.selection.area.areaId }
          : slot.selection.kind === "polygon"
            ? { kind: "polygon" as const, coords: slot.selection.coords }
            : { kind: "all" as const };
      fetch("/api/dashboard/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selection: selectionPayload,
          filters: filterParams,
          weekStart: effectiveRange[0],
          weekEnd: effectiveRange[1],
        }),
        signal: ctrl.signal,
      })
        .then((r) => r.json())
        .then((d: MarketResponse) => {
          cachePut(marketCache.current, key, d);
          setMarkets((m) => ({ ...m, [slot.id]: d }));
        })
        .catch((e: Error) => e.name !== "AbortError" && console.error(e));
    }
    return () => ctrl.abort();
  }, [slots, debouncedFilters, filterParams, effectiveRange]);

  // Lazy tabs: fetch once their tab first opens, then follow scope changes.
  const [pricingWanted, setPricingWanted] = useState(false);
  const [investWanted, setInvestWanted] = useState(false);
  const [rentalsWanted, setRentalsWanted] = useState(false);
  const [paceWanted, setPaceWanted] = useState(false);
  useEffect(() => {
    if (tab === "pricing") setPricingWanted(true);
    if (tab === "buyrent" || tab === "calc") setInvestWanted(true);
    if (tab === "buyrent") setRentalsWanted(true);
    if (tab === "pace") setPaceWanted(true);
  }, [tab]);

  /** Per-slot POST for the scope-shaped endpoints (pricing/pace/invest/rentals). */
  function useScopedFetch<T>(
    wanted: boolean,
    url: string,
    cache: React.MutableRefObject<Map<string, T>>,
    setRecord: React.Dispatch<React.SetStateAction<SlotRecord<T>>>
  ) {
    useEffect(() => {
      if (!wanted) return;
      const ctrl = new AbortController();
      for (const slot of slots) {
        const key = `${selKeyOf(slot.selection)}|${debouncedFilters}`;
        const cached = cache.current.get(key);
        if (cached) {
          setRecord((m) => (m[slot.id] === cached ? m : { ...m, [slot.id]: cached }));
          continue;
        }
        setRecord((m) => ({ ...m, [slot.id]: null }));
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            polygon: slot.selection.kind === "polygon" ? slot.selection.coords : null,
            areaId: slot.selection.kind === "area" ? slot.selection.area.areaId : null,
            filters: filterParams,
          }),
          signal: ctrl.signal,
        })
          .then((r) => r.json())
          .then((d: T) => {
            cachePut(cache.current, key, d);
            setRecord((m) => ({ ...m, [slot.id]: d }));
          })
          .catch((e: Error) => e.name !== "AbortError" && console.error(e));
      }
      return () => ctrl.abort();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wanted, slots, debouncedFilters, filterParams]);
  }

  useScopedFetch(pricingWanted, "/api/dashboard/pricing", pricingCache, setPricings);
  useScopedFetch(paceWanted, "/api/dashboard/pace", paceCache, setPaces);
  useScopedFetch(investWanted, "/api/dashboard/invest", investCache, setInvests);
  useScopedFetch(rentalsWanted, "/api/dashboard/rentals", rentalsCache, setRentalss);

  // Hovered/pinned listing detail (with a small cache).
  const activeId = pinnedId ?? hoverId;
  useEffect(() => {
    if (!activeId) {
      setDetail(null);
      return;
    }
    const cached = detailCache.current.get(activeId);
    if (cached) {
      setDetail(cached);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/dashboard/listing/${activeId}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: ListingDetail | null) => {
          if (d) {
            detailCache.current.set(d.id, d);
            setDetail(d);
          }
        })
        .catch((e: Error) => e.name !== "AbortError" && console.error(e));
    }, 120);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [activeId]);

  // Stable callbacks — PointsLayer rebuilds its canvas when these change.
  const handleHover = useCallback((id: string | null) => setHoverId(id), []);
  const handlePick = useCallback((id: string) => setPinnedId((p) => (p === id ? null : id)), []);
  const handleAreaPick = useCallback(
    (a: AreaInfo) => pickSelection({ kind: "area", area: a }),
    [pickSelection]
  );
  const handlePolygonComplete = useCallback(
    (poly: PolygonCoords) => {
      pickSelection({ kind: "polygon", coords: poly });
      setDrawing(false);
    },
    [pickSelection]
  );
  const handleDrawCancel = useCallback(() => setDrawing(false), []);

  // --- Slot views for the tabs ---------------------------------------------

  const slotViews: SlotView[] = useMemo(() => {
    let polyN = 0;
    return slots.map((s) => {
      const label =
        s.selection.kind === "all"
          ? "All of Cyprus"
          : s.selection.kind === "area"
            ? s.selection.area.nameEn
            : `Drawn area ${++polyN}`;
      return {
        id: s.id,
        color: s.color,
        dash: s.dash,
        label,
        selection: s.selection,
        market: markets[s.id] ?? null,
        pricing: pricings[s.id] ?? null,
        invest: invests[s.id] ?? null,
        rentals: rentalss[s.id] ?? null,
        pace: paces[s.id] ?? null,
      };
    });
  }, [slots, markets, pricings, invests, rentalss, paces]);

  const shapes = useMemo(
    () =>
      slots
        .filter((s): s is CompareSlot & { selection: { kind: "polygon"; coords: PolygonCoords } } =>
          s.selection.kind === "polygon"
        )
        .map((s) => ({ coords: s.selection.coords, color: s.color })),
    [slots]
  );

  const areaMarks = useMemo(
    () =>
      compare
        ? slots
            .filter((s) => s.selection.kind === "area")
            .map((s) => {
              const a = (s.selection as Extract<Selection, { kind: "area" }>).area;
              return a.lat != null && a.lng != null
                ? { lat: a.lat, lng: a.lng, color: s.color }
                : null;
            })
            .filter((m): m is { lat: number; lng: number; color: string } => m != null)
        : [],
    [slots, compare]
  );

  const single = slots[0];
  const singleLabel =
    single.selection.kind === "all"
      ? "All of Cyprus"
      : single.selection.kind === "area"
        ? single.selection.area.nameEn
        : "Drawn area";

  const slotCount = (v: SlotView): number | null =>
    v.market?.snapshot?.listings ??
    v.market?.weekly.at(-1)?.listings ??
    (v.selection.kind === "area" ? v.selection.area.listingCount : null);

  const searchLabel = compare
    ? `Comparing ${slots.length} areas`
    : single.selection.kind === "all"
      ? null
      : singleLabel;

  const excludeAreaIds = useMemo(
    () =>
      new Set(
        slots
          .filter((s) => s.selection.kind === "area")
          .map((s) => (s.selection as Extract<Selection, { kind: "area" }>).area.areaId)
      ),
    [slots]
  );

  const canAdd = slots.length < MAX_SLOTS;

  const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
    { id: "market", label: "Market overview", icon: <BarChart3 size={14} /> },
    { id: "pricing", label: "Pricing", icon: <LineChart size={14} /> },
    { id: "pace", label: "Booking pace", icon: <Timer size={14} /> },
    { id: "buyrent", label: "Buy & Rent", icon: <Building2 size={14} /> },
    { id: "calc", label: "Revenue calculator", icon: <Calculator size={14} /> },
  ];

  return (
    <div className="min-h-screen dash-bg" style={{ color: UI.text }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 md:px-6 glass-dark"
        style={{ borderRadius: 0, borderLeft: "none", borderRight: "none", borderTop: "none" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #4A5E3A, #6B7B4F)" }}
            >
              <span className="text-white font-display text-sm font-bold">P</span>
            </div>
            <span className="font-display text-lg font-bold tracking-tight uppercase hidden sm:inline">
              <span style={{ color: UI.text }}>{BRAND.namePart1}</span>
              <span style={{ color: UI.oliveMid }}>{BRAND.namePart2}</span>
            </span>
          </Link>
          <span className="w-px h-5" style={{ background: UI.border }} />
          <span className="text-sm font-medium truncate" style={{ color: UI.muted }}>
            Market Dashboard · Cyprus
          </span>
        </div>

        <div className="flex items-center gap-3">
          {summary && (
            <span className="text-xs hidden md:flex items-center gap-1.5" style={{ color: UI.muted }}>
              Calendars through {fmtDate(summary.todateEnd)}
              {summary.bookingsThrough && <> · bookings to {fmtDate(summary.bookingsThrough)}</>}
              <Explain id="freshness" align="right" />
            </span>
          )}
          {summary && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide"
              style={
                summary.source === "live"
                  ? { background: "rgba(143,204,128,0.12)", color: UI.green }
                  : { background: "rgba(168,194,144,0.1)", color: UI.oliveLight, border: `1px solid ${UI.border}` }
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${summary.source === "live" ? "animate-pulse" : ""}`}
                style={{ background: summary.source === "live" ? UI.green : UI.oliveLight }}
              />
              {summary.source === "live" ? "LIVE" : "DEMO DATA"}
            </span>
          )}
        </div>
      </header>

      {/* Map hero */}
      <section
        className="relative m-3 md:m-4 mb-0 rounded-3xl overflow-hidden"
        style={{
          height: "min(64vh, 720px)",
          minHeight: 440,
          border: `1px solid ${UI.border}`,
          isolation: "isolate",
        }}
      >
        <MarketMap
          points={points ?? []}
          areas={areas ?? []}
          window_={window_}
          drawing={drawing}
          shapes={shapes}
          areaMarks={areaMarks}
          fitTo={mapCam.fit}
          focus={mapCam.focus}
          onHover={handleHover}
          onPick={handlePick}
          onAreaPick={handleAreaPick}
          onPolygonComplete={handlePolygonComplete}
          onDrawCancel={handleDrawCancel}
        />

        {/* Search + draw toolbar (top-centre) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-3 z-[950] flex items-center gap-2">
          <SearchBar
            areas={areas}
            label={searchLabel}
            armed={armed}
            excludeAreaIds={excludeAreaIds}
            onPick={(a) => pickSelection({ kind: "area", area: a })}
            onClear={clearAll}
          />
          {!drawing ? (
            <button
              onClick={() => {
                setDrawing(true);
                setPinnedId(null);
              }}
              className="glass-dark rounded-xl px-4 h-11 flex items-center gap-2 text-sm font-semibold transition-transform hover:scale-[1.03] active:scale-95 whitespace-nowrap"
              style={{ color: UI.text }}
            >
              <PenLine size={14} style={{ color: UI.green }} />
              {compare || armed
                ? "Draw to compare"
                : single.selection.kind === "polygon"
                  ? "Redraw"
                  : "Draw area"}
            </button>
          ) : (
            <button
              onClick={handleDrawCancel}
              className="glass-dark rounded-xl px-4 h-11 flex items-center gap-2 text-sm font-semibold whitespace-nowrap"
              style={{ color: UI.oliveLight }}
            >
              <X size={14} /> Cancel
            </button>
          )}
          {canAdd && !drawing && (
            <button
              onClick={() => setArmed((a) => !a)}
              className="hidden sm:flex glass-dark rounded-xl px-4 h-11 items-center gap-2 text-sm font-semibold transition-transform hover:scale-[1.03] active:scale-95 whitespace-nowrap"
              style={armed ? { color: UI.green, boxShadow: `0 0 0 1.5px ${UI.green}66` } : { color: UI.text }}
              aria-pressed={armed}
            >
              <Plus size={14} style={{ color: UI.green }} />
              Compare
            </button>
          )}
        </div>
        {drawing && (
          <div className="absolute left-1/2 -translate-x-1/2 top-16 z-[940]">
            <span className="glass-dark rounded-xl px-3.5 py-2 text-xs font-medium whitespace-nowrap" style={{ color: UI.text }}>
              Click to add points · double-click or ⏎ to finish · Esc to cancel
            </span>
          </div>
        )}
        {armed && !drawing && (
          <div className="absolute left-1/2 -translate-x-1/2 top-16 z-[940]">
            <span className="glass-dark rounded-xl px-3.5 py-2 text-xs font-medium whitespace-nowrap" style={{ color: UI.text }}>
              Search an area or draw one — it&apos;ll be added to the comparison
            </span>
          </div>
        )}

        {/* Floating filter panel (desktop) — hugs content, scrolls when tall */}
        <div className="hidden lg:block absolute left-3 top-3 w-[280px] max-h-[calc(100%-1.5rem)] z-[900] glass-dark rounded-2xl overflow-y-auto ps-scroll">
          <FilterPanel filters={filters} onChange={setFilters} resultCount={points?.length ?? null} />
        </div>

        {/* Mobile filter toggle + drawer */}
        <button
          onClick={() => setMobileFilters(true)}
          className="lg:hidden absolute left-3 top-3 z-[900] glass-dark rounded-xl px-3 h-11 flex items-center gap-2 text-xs font-semibold"
          style={{ color: UI.text }}
        >
          <SlidersHorizontal size={14} style={{ color: UI.green }} />
          Filters
        </button>
        {mobileFilters && (
          <div className="lg:hidden fixed inset-0 z-[1100] flex">
            <div
              className="absolute inset-0"
              style={{ background: "rgba(6,9,4,0.55)" }}
              onClick={() => setMobileFilters(false)}
            />
            <div className="relative glass-dark w-[300px] max-w-[85vw] h-full overflow-y-auto ps-scroll rounded-r-2xl">
              <button
                onClick={() => setMobileFilters(false)}
                className="absolute right-3 top-3 z-10 p-1"
                aria-label="Close filters"
              >
                <X size={16} style={{ color: UI.muted }} />
              </button>
              <FilterPanel filters={filters} onChange={setFilters} resultCount={points?.length ?? null} />
            </div>
          </div>
        )}

        {/* Listing hover/pin card */}
        <div className="absolute right-3 top-16 z-[930] pointer-events-none">
          <AnimatePresence>
            {detail && (
              <HoverCard
                key={detail.id}
                listing={detail}
                pinned={pinnedId != null}
                window_={window_}
                onClose={() => setPinnedId(null)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Occupancy legend + map-colour window toggle */}
        <div className="absolute left-3 lg:left-[304px] bottom-3 z-[900] glass-light rounded-lg px-3 py-2">
          <p className="text-[10px] font-semibold mb-1" style={{ color: "#4C5546" }}>
            Occupancy · {window_ === "todate" ? "season to date" : "next 60 days"}
          </p>
          <div
            className="w-28 h-2 rounded-full"
            style={{ background: "linear-gradient(90deg,#D8DECB,#8FA36B,#4A5E3A,#26331C)" }}
          />
          <div className="flex justify-between mt-0.5">
            <span className="text-[9px]" style={{ color: "#69725F" }}>40%</span>
            <span className="text-[9px]" style={{ color: "#69725F" }}>95%</span>
          </div>
        </div>
      </section>

      {/* Context bar + tabs stick together once the map scrolls away, so the
          scope and tab switcher stay reachable on long tabs. */}
      <div
        className="sticky top-0 z-[950] pt-3 pb-0"
        style={{ background: "rgba(12,16,10,0.9)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
      >
      {/* Context bar: selection(s) + week range + map window */}
      <div className="px-3 md:px-4 flex flex-wrap items-center gap-2.5">
        {compare ? (
          <>
            <span className="flex items-center gap-2">
              <Hexagon size={15} style={{ color: UI.green }} />
              <h2 className="font-display font-bold text-xl uppercase tracking-wide" style={{ color: UI.text }}>
                Comparing
              </h2>
              <Explain id="compare" align="left" />
            </span>
            {slotViews.map((v) => (
              <SlotChip
                key={v.id}
                label={v.label}
                color={v.color}
                dash={v.dash}
                count={slotCount(v)}
                onRemove={() => removeSlot(v.id)}
              />
            ))}
            {canAdd && (
              <button
                onClick={() => setArmed((a) => !a)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-colors hover:bg-white/10"
                style={
                  armed
                    ? { color: UI.green, border: `1px solid ${UI.green}66` }
                    : { color: UI.muted, border: `1px dashed ${UI.border}` }
                }
              >
                <Plus size={11} /> Add area
              </button>
            )}
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors hover:bg-white/10"
              style={{ color: UI.muted, border: `1px solid ${UI.border}` }}
            >
              <X size={11} /> Clear all
            </button>
          </>
        ) : (
          <>
            <span className="flex items-center gap-2">
              <Hexagon size={15} style={{ color: UI.green }} />
              <h2 className="font-display font-bold text-xl uppercase tracking-wide" style={{ color: UI.text }}>
                {singleLabel}
              </h2>
            </span>
            {slotCount(slotViews[0]) != null && (
              <span className="text-sm" style={{ color: UI.muted }}>
                {fmtInt(slotCount(slotViews[0]))} listings
              </span>
            )}
            {single.selection.kind !== "all" && (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors hover:bg-white/10"
                style={{ color: UI.muted, border: `1px solid ${UI.border}` }}
              >
                <X size={11} /> Clear selection
              </button>
            )}
            <button
              onClick={() => setArmed((a) => !a)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors hover:bg-white/10 sm:hidden"
              style={
                armed
                  ? { color: UI.green, border: `1px solid ${UI.green}66` }
                  : { color: UI.muted, border: `1px dashed ${UI.border}` }
              }
            >
              <Plus size={11} /> Compare
            </button>
          </>
        )}
        <div className="flex-1" />
        <DateRangeCalendar min={FIRST_WEEK} max={maxDay} value={effectiveDays} onChange={setDayRange} />
        <Segmented
          value={window_}
          onChange={setWindow}
          options={[
            { value: "todate", label: "Map: season" },
            { value: "fwd60", label: "Map: next 60d" },
          ]}
        />
      </div>

      {/* Tabs */}
      <div className="px-3 md:px-4 mt-3">
        <div className="flex items-center gap-1.5 border-b overflow-x-auto" style={{ borderColor: UI.border }}>
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap"
                style={
                  active
                    ? {
                        color: UI.text,
                        background: "rgba(255,255,255,0.05)",
                        borderBottom: `2px solid ${UI.green}`,
                        marginBottom: -1,
                      }
                    : { color: UI.muted, borderBottom: "2px solid transparent", marginBottom: -1 }
                }
              >
                <span style={{ color: active ? UI.green : UI.faint }}>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      </div>

      {/* Tab content */}
      <div className="px-3 md:px-4 py-4 pb-12">
        {tab === "market" && <MarketTab slots={slotViews} health={health} />}
        {tab === "pricing" && <PricingTab slots={slotViews} />}
        {tab === "pace" && <PaceTab slots={slotViews} />}
        {tab === "buyrent" && <BuyRentTab slots={slotViews} />}
        {tab === "calc" && <CalculatorTab slots={slotViews} />}
      </div>
    </div>
  );
}
