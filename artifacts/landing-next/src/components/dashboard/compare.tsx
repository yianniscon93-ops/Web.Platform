"use client";

import { X } from "lucide-react";
import type { CompareSlot, Selection, SlotView } from "@/lib/dashboard/types";
import type { ExplainerId } from "@/lib/dashboard/explain";
import { UI } from "./tokens";
import Explain from "./Explain";

/**
 * Comparison slot palette — validated with the dataviz gate on the dark
 * surface (normal-vision ΔE 18.6, CVD ΔE 7.0). CVD sits in the 6–8 floor
 * band, which is only legal with a non-colour cue — hence every slot also
 * carries a dash pattern and every comparison surface names its slots.
 */
export const SLOT_COLORS = ["#8FCC80", "#64803C", "#D98B6A"] as const;
export const SLOT_DASH: Array<string | undefined> = [undefined, "7 4", "2 3"];
export const MAX_SLOTS = 3;

/** Human label for a slot's selection; drawn areas are numbered. */
export function selectionLabel(sel: Selection, slotIndex: number): string {
  if (sel.kind === "all") return "All of Cyprus";
  if (sel.kind === "area") return sel.area.nameEn;
  return `Drawn area ${slotIndex + 1}`;
}

/** True when two selections describe the same scope (blocks duplicate slots). */
export function sameSelection(a: Selection, b: Selection): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "all") return true;
  if (a.kind === "area" && b.kind === "area") return a.area.areaId === b.area.areaId;
  if (a.kind === "polygon" && b.kind === "polygon")
    return JSON.stringify(a.coords) === JSON.stringify(b.coords);
  return false;
}

/** First colour/dash not used by the given slots — keeps identity stable. */
export function nextSlotStyle(slots: CompareSlot[]): { color: string; dash?: string } {
  const used = new Set(slots.map((s) => s.color));
  const i = SLOT_COLORS.findIndex((c) => !used.has(c));
  const idx = i === -1 ? slots.length % SLOT_COLORS.length : i;
  return { color: SLOT_COLORS[idx], dash: SLOT_DASH[idx] };
}

/** Colored dot + name — the identity unit used in chips, legends, headers. */
export function SlotDot({ color, dash }: { color: string; dash?: string }) {
  return (
    <svg width="14" height="8" className="shrink-0" aria-hidden>
      <line
        x1="0"
        y1="4"
        x2="14"
        y2="4"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={dash}
      />
    </svg>
  );
}

/** Removable chip for one comparison slot (context bar). */
export function SlotChip({
  label,
  color,
  dash,
  count,
  onRemove,
}: {
  label: string;
  color: string;
  dash?: string;
  count?: number | null;
  onRemove?: () => void;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full pl-3 pr-2 py-1.5 text-xs glass-card"
      style={{ border: `1px solid ${color}55` }}
    >
      <SlotDot color={color} dash={dash} />
      <span className="font-semibold" style={{ color: UI.text }}>
        {label}
      </span>
      {count != null && (
        <span style={{ color: UI.muted }}>{count.toLocaleString("en-GB")}</span>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          className="p-0.5 rounded-full hover:bg-white/10 transition-colors"
          aria-label={`Remove ${label} from comparison`}
        >
          <X size={11} style={{ color: UI.muted }} />
        </button>
      )}
    </span>
  );
}

/** Legend row naming every slot — sits above comparison charts. */
export function CompareLegend({ slots }: { slots: Array<Pick<SlotView, "label" | "color" | "dash">> }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {slots.map((s) => (
        <span key={s.label} className="flex items-center gap-1.5 text-[12px]" style={{ color: UI.muted }}>
          <SlotDot color={s.color} dash={s.dash} />
          {s.label}
        </span>
      ))}
    </div>
  );
}

export interface CompareRow {
  label: string;
  explain?: ExplainerId;
  /** Pre-formatted value per slot (aligned with the slots array). */
  values: Array<string | null>;
  /** Small second line under each value. */
  hints?: Array<string | null>;
  /** Column index to emphasise as the strongest, or null for neutral rows. */
  best?: number | null;
}

/**
 * Metric × area matrix — the comparison replacement for KPI card rows.
 * The strongest cell per row gets a green emphasis (green = good is a
 * status colour here, distinct from the slot identity colours).
 */
export function CompareTable({
  slots,
  rows,
}: {
  slots: Array<Pick<SlotView, "label" | "color" | "dash">>;
  rows: CompareRow[];
}) {
  return (
    <div className="overflow-x-auto ps-scroll">
      <table className="w-full text-left" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
        <thead>
          <tr>
            <th
              className="text-[11px] uppercase tracking-wider font-semibold py-2 pr-4"
              style={{ color: UI.faint, borderBottom: `1px solid ${UI.border}` }}
            >
              Metric
            </th>
            {slots.map((s) => (
              <th
                key={s.label}
                className="text-[13px] font-bold py-2 pr-4 whitespace-nowrap"
                style={{ color: UI.text, borderBottom: `1px solid ${UI.border}` }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <SlotDot color={s.color} dash={s.dash} />
                  {s.label}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td
                className="py-2.5 pr-4 text-[13px] font-medium whitespace-nowrap"
                style={{ color: UI.muted, borderBottom: `1px solid ${UI.border}` }}
              >
                <span className="inline-flex items-center gap-1.5">
                  {r.label}
                  {r.explain && <Explain id={r.explain} align="left" />}
                </span>
              </td>
              {slots.map((s, i) => {
                const isBest = r.best === i;
                return (
                  <td
                    key={s.label}
                    className="py-2.5 pr-4 whitespace-nowrap"
                    style={{ borderBottom: `1px solid ${UI.border}` }}
                  >
                    <span
                      className={`text-[14.5px] ${isBest ? "font-bold" : "font-medium"} inline-flex items-center gap-1.5 rounded-md ${isBest ? "px-1.5 py-0.5" : ""}`}
                      style={{
                        color: UI.text,
                        background: isBest ? "rgba(143,204,128,0.12)" : undefined,
                      }}
                    >
                      {r.values[i] ?? "—"}
                      {isBest && (
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: UI.green }}>
                          best
                        </span>
                      )}
                    </span>
                    {r.hints?.[i] && (
                      <span className="block text-[11.5px] mt-0.5" style={{ color: UI.faint }}>
                        {r.hints[i]}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Index of the max (or min) non-null value — for CompareRow.best. */
export function bestIndex(
  values: Array<number | null | undefined>,
  dir: "max" | "min" = "max"
): number | null {
  let best: number | null = null;
  values.forEach((v, i) => {
    if (v == null) return;
    if (best === null) best = i;
    else {
      const bv = values[best]!;
      if (dir === "max" ? v > bv : v < bv) best = i;
    }
  });
  // A single populated column has no meaningful "best".
  const populated = values.filter((v) => v != null).length;
  return populated >= 2 ? best : null;
}
