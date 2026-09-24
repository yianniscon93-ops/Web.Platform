"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { AreaBoundary, AreaInfo, OccWindow, PointRow, PolygonCoords } from "@/lib/dashboard/types";
import { occupancyColor } from "@/lib/dashboard/format";

const CYPRUS_CENTER: [number, number] = [34.98, 33.25];
const CYPRUS_ZOOM = 9;

/** Below this zoom, pins are decorative and named-area markers carry the
 * interaction (zoom-gated pins — product decision 11 Jul 2026). */
const PIN_ZOOM = 11;

function radiusForZoom(z: number): number {
  return z >= 13 ? 7 : z >= 11 ? 5 : 3.5;
}

function effOcc(p: PointRow, window_: OccWindow): number | null {
  return window_ === "todate" ? p.effOccTodate : p.effOccFwd60;
}

/**
 * All listings as canvas-rendered dots (up to ~15k). Imperative Leaflet
 * layer — a React element per dot would be far too slow. Dots are only
 * interactive once zoomed past PIN_ZOOM; at island zoom they are texture.
 */
function PointsLayer({
  points,
  window_,
  drawing,
  interactive,
  onHover,
  onPick,
}: {
  points: PointRow[];
  window_: OccWindow;
  drawing: boolean;
  interactive: boolean;
  onHover: (id: string | null) => void;
  onPick: (id: string) => void;
}) {
  const map = useMap();
  const drawingRef = useRef(drawing);
  drawingRef.current = drawing;
  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;

  useEffect(() => {
    const renderer = L.canvas({ padding: 0.3 });
    const group = L.layerGroup();
    const markers: L.CircleMarker[] = [];
    const baseRadius = radiusForZoom(map.getZoom());

    for (const p of points) {
      const m = L.circleMarker([p.lat, p.lng], {
        renderer,
        radius: baseRadius,
        weight: 1.5,
        color: "#FFFFFF",
        fillColor: occupancyColor(effOcc(p, window_)),
        fillOpacity: 0.9,
      });
      m.on("mouseover", () => {
        if (drawingRef.current || !interactiveRef.current) return;
        m.setStyle({ weight: 3, color: "#1F2A16" });
        m.setRadius(baseRadius + 2);
        onHover(p.id);
      });
      m.on("mouseout", () => {
        m.setStyle({ weight: 1.5, color: "#FFFFFF" });
        m.setRadius(baseRadius);
        onHover(null);
      });
      m.on("click", (e) => {
        if (drawingRef.current || !interactiveRef.current) return;
        L.DomEvent.stopPropagation(e);
        onPick(p.id);
      });
      group.addLayer(m);
      markers.push(m);
    }

    const onZoom = () => {
      const r = radiusForZoom(map.getZoom());
      for (const m of markers) m.setRadius(r);
    };
    map.on("zoomend", onZoom);
    group.addTo(map);
    return () => {
      map.off("zoomend", onZoom);
      group.remove();
    };
  }, [map, points, window_, onHover, onPick]);

  return null;
}

/**
 * Named-area markers shown at island zoom: districts when zoomed far out,
 * towns/resorts as you get closer. Clicking one selects the area.
 */
function AreaMarkersLayer({
  areas,
  zoom,
  drawing,
  onAreaPick,
}: {
  areas: AreaInfo[];
  zoom: number;
  drawing: boolean;
  onAreaPick: (a: AreaInfo) => void;
}) {
  const map = useMap();
  const drawingRef = useRef(drawing);
  drawingRef.current = drawing;

  useEffect(() => {
    if (zoom >= PIN_ZOOM || drawing) return;
    const wanted: AreaInfo[] =
      zoom < 10
        ? areas.filter((a) => a.areaType === "district")
        : areas.filter(
            (a) =>
              (a.areaType === "municipality" || a.areaType === "tourist_area") &&
              a.listingCount >= 30
          );

    const group = L.layerGroup();
    for (const a of wanted) {
      if (a.lat == null || a.lng == null) continue;
      const icon = L.divIcon({
        className: "",
        html: `<span class="ps-area-pill">${a.nameEn}<b>${a.listingCount.toLocaleString("en-GB")}</b></span>`,
        iconSize: undefined,
      });
      const m = L.marker([a.lat, a.lng], { icon, riseOnHover: true });
      m.on("click", (e) => {
        if (drawingRef.current) return;
        L.DomEvent.stopPropagation(e);
        onAreaPick(a);
      });
      group.addLayer(m);
    }
    group.addTo(map);
    return () => {
      group.remove();
    };
  }, [map, areas, zoom, drawing, onAreaPick]);

  return null;
}

/** GeoJSON [lng, lat] rings → Leaflet [lat, lng] positions (polygon or
 * multi-polygon, holes kept). */
function boundaryLatLngs(b: AreaBoundary): [number, number][][][] {
  const polys = b.type === "Polygon" ? [b.coordinates] : b.coordinates;
  return polys.map((rings) => rings.map((ring) => ring.map(([lng, lat]) => [lat, lng] as [number, number])));
}

function boundaryBounds(b: AreaBoundary): L.LatLngBounds {
  return L.latLngBounds(boundaryLatLngs(b).flat(2).map(([lat, lng]) => L.latLng(lat, lng)));
}

function AreaOutline({ outline }: { outline: MapAreaOutline }) {
  const positions = useMemo(() => boundaryLatLngs(outline.boundary), [outline.boundary]);
  const pathOptions = useMemo(
    () => ({ color: outline.color, weight: 2.5, fillColor: outline.color, fillOpacity: 0.1 }),
    [outline.color]
  );
  return <Polygon positions={positions} interactive={false} pathOptions={pathOptions} />;
}

function ZoomTracker({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMapEvents({
    zoomend() {
      onZoom(map.getZoom());
    },
  });
  return null;
}

/** Click-to-add-vertex polygon drawing, styled like the hero draw overlay. */
function DrawLayer({
  onComplete,
  onCancel,
}: {
  onComplete: (poly: PolygonCoords) => void;
  onCancel: () => void;
}) {
  const [verts, setVerts] = useState<PolygonCoords>([]);
  const vertsRef = useRef(verts);
  vertsRef.current = verts;

  const map = useMapEvents({
    click(e) {
      setVerts((v) => [...v, [e.latlng.lat, e.latlng.lng]]);
    },
    dblclick(e) {
      L.DomEvent.stop(e.originalEvent);
      if (vertsRef.current.length >= 3) onComplete(vertsRef.current);
    },
  });

  useEffect(() => {
    map.getContainer().classList.add("ps-drawing");
    map.doubleClickZoom.disable();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter" && vertsRef.current.length >= 3) onComplete(vertsRef.current);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      map.getContainer().classList.remove("ps-drawing");
      map.doubleClickZoom.enable();
      window.removeEventListener("keydown", onKey);
    };
  }, [map, onCancel, onComplete]);

  return (
    <>
      {verts.length >= 2 && (
        <Polyline
          positions={verts}
          pathOptions={{ color: "#1F2A16", weight: 2.5, dashArray: "6 4" }}
        />
      )}
      {verts.map(([lat, lng], i) => (
        <CircleMarker
          key={i}
          center={[lat, lng]}
          radius={i === 0 ? 6 : 4}
          pathOptions={{ color: "#4A5E3A", weight: 2, fillColor: "#FFFFFF", fillOpacity: 1 }}
          eventHandlers={
            i === 0
              ? {
                  click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    if (vertsRef.current.length >= 3) onComplete(vertsRef.current);
                  },
                }
              : undefined
          }
        />
      ))}
    </>
  );
}

function FitPolygon({
  polygon,
  boundary,
  hold,
  focus,
}: {
  polygon: PolygonCoords | null;
  /** A selected named area's boundary — fitted when there is no polygon. */
  boundary: AreaBoundary | null;
  /** Boundary still loading: keep the camera where it is. */
  hold: boolean;
  focus: { lat: number; lng: number; zoom: number } | null;
}) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  // One effect for all camera moves — polygon fit beats boundary fit beats
  // focus beats reset — so a polygon target can't race a stale focus fly-to
  // (or vice versa). The boundary is keyed by identity, not serialised.
  const boundaryId = boundaryKey(boundary);
  const key = JSON.stringify({ polygon, focus, hold, boundaryId });
  useEffect(() => {
    if (hold) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (polygon) {
      map.fitBounds(L.latLngBounds(polygon.map(([a, b]) => L.latLng(a, b))), {
        padding: [60, 60],
        maxZoom: 14,
        animate: !reduce,
      });
      return;
    }
    if (boundary) {
      const bounds = boundaryBounds(boundary);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: !reduce });
        return;
      }
    }
    const target: [number, number] = focus ? [focus.lat, focus.lng] : CYPRUS_CENTER;
    const zoom = focus ? focus.zoom : CYPRUS_ZOOM;
    if (reduce) map.setView(target, zoom, { animate: false });
    else map.flyTo(target, zoom, { duration: 1.1, easeLinearity: 0.25 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

/** Stable small id per boundary object, so the camera key changes only when
 * a different boundary is passed (serialising one can be ~35 KB). */
const boundaryIds = new WeakMap<object, number>();
let boundarySeq = 0;
function boundaryKey(b: AreaBoundary | null): number | null {
  if (!b) return null;
  let id = boundaryIds.get(b);
  if (id == null) boundaryIds.set(b, (id = ++boundarySeq));
  return id;
}

/** One drawn selection rendered on the map, in its comparison-slot colour. */
export interface MapShape {
  coords: PolygonCoords;
  color: string;
}

/** Ring marking a named-area selection's centre, in its slot colour —
 * used only for areas without a boundary (parishes, tourist areas). */
export interface MapAreaMark {
  lat: number;
  lng: number;
  color: string;
}

/** A named-area selection's boundary, in its slot colour. */
export interface MapAreaOutline {
  boundary: AreaBoundary;
  color: string;
}

export default function MarketMap({
  points,
  areas,
  window_,
  drawing,
  shapes,
  areaMarks,
  areaOutlines,
  fitTo,
  fitBoundary,
  holdCamera,
  focus,
  onHover,
  onPick,
  onAreaPick,
  onPolygonComplete,
  onDrawCancel,
}: {
  points: PointRow[];
  areas: AreaInfo[];
  window_: OccWindow;
  drawing: boolean;
  shapes: MapShape[];
  areaMarks: MapAreaMark[];
  areaOutlines: MapAreaOutline[];
  /** Polygon to fit the viewport to (the most recently added drawn area). */
  fitTo: PolygonCoords | null;
  /** Boundary of the most recently picked named area, once loaded. */
  fitBoundary: AreaBoundary | null;
  /** The picked area's boundary is still loading — don't move yet. */
  holdCamera: boolean;
  focus: { lat: number; lng: number; zoom: number } | null;
  onHover: (id: string | null) => void;
  onPick: (id: string) => void;
  onAreaPick: (a: AreaInfo) => void;
  onPolygonComplete: (poly: PolygonCoords) => void;
  onDrawCancel: () => void;
}) {
  const [zoom, setZoom] = useState(CYPRUS_ZOOM);

  return (
    <MapContainer
      center={CYPRUS_CENTER}
      zoom={CYPRUS_ZOOM}
      zoomControl={false}
      attributionControl={true}
      scrollWheelZoom={true}
      style={{ width: "100%", height: "100%", background: "#E8EDE3" }}
    >
      {/* Light basemap only — dashboard chrome is dark, the map stays light. */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution="&copy; OpenStreetMap &copy; CARTO"
        subdomains="abcd"
      />

      <ZoomTracker onZoom={setZoom} />

      <PointsLayer
        points={points}
        window_={window_}
        drawing={drawing}
        interactive={zoom >= PIN_ZOOM}
        onHover={onHover}
        onPick={onPick}
      />

      <AreaMarkersLayer areas={areas} zoom={zoom} drawing={drawing} onAreaPick={onAreaPick} />

      {shapes.map((s, i) => (
        <Polygon
          key={`shape-${i}`}
          positions={s.coords}
          pathOptions={{
            color: "#1F2A16",
            weight: 2.5,
            fillColor: s.color,
            fillOpacity: 0.16,
          }}
        />
      ))}

      {/* Named selections with a dim_areas boundary: the outline in the slot
          colour. Non-interactive so pins underneath stay clickable. */}
      {areaOutlines.map((o, i) => (
        <AreaOutline key={`outline-${i}-${o.color}`} outline={o} />
      ))}

      {/* Areas without a boundary (parishes, tourist areas, demo data): a
          slot-coloured ring around the area centre instead. */}
      {areaMarks.map((m, i) => (
        <CircleMarker
          key={`mark-${i}`}
          center={[m.lat, m.lng]}
          radius={14}
          pathOptions={{
            color: m.color,
            weight: 3,
            fillColor: m.color,
            fillOpacity: 0.15,
          }}
        />
      ))}

      {drawing && <DrawLayer onComplete={onPolygonComplete} onCancel={onDrawCancel} />}
      <FitPolygon polygon={fitTo} boundary={fitBoundary} hold={holdCamera} focus={focus} />
    </MapContainer>
  );
}
