"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AttributionControl,
  CircleMarker,
  MapContainer,
  Marker,
  Pane,
  Polygon,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { AreaBoundary, AreaInfo, OccWindow, PointRow, PolygonCoords } from "@/lib/dashboard/types";
import { occupancyColor } from "@/lib/dashboard/format";
import { createBasemapLayer } from "./basemap";
import { plotCorners } from "./areaHand";
import { HAND, MAP } from "./mapStyle";

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

/** The basemap: OpenFreeMap's vector tiles painted in the landing's map colours (basemap.ts). */
function Basemap() {
  const map = useMap();
  useEffect(() => {
    const layer = createBasemapLayer().addTo(map);
    return () => {
      layer.remove();
    };
  }, [map]);
  return null;
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

/* The picked place in the brand mark's hand (areaHand.ts). The tint and the white edge lie under the listings, in
   the pane "ps-area-under"; the ink line and the corner dots lie over them, in "ps-area-over" (both set up in
   MarketMap below). None of it takes the pointer, so the listings stay clickable. */
const HAND_EDGE = {
  color: HAND.paper,
  weight: 5,
  lineJoin: "round" as const,
  fillColor: HAND.olive,
  fillOpacity: 0.12,
};
const HAND_LINE = { color: HAND.ink, weight: 2, lineJoin: "round" as const, fill: false };
/* A corner: the olive dot with its white edge, 14px across as the landing stage's are, and outside that a 1px ink
   edge, because here it sits among listing dots of much the same green (as a card pinned on the landing's busy map
   takes one). The edge is a white disc with an ink rim; the dot lies on it. */
const HAND_CORNER_EDGE = { color: HAND.ink, weight: 1, fillColor: HAND.paper, fillOpacity: 1 };
const HAND_CORNER = { stroke: false, fillColor: HAND.olive, fillOpacity: 1 };

function HandTint({ boundary }: { boundary: AreaBoundary }) {
  const positions = useMemo(() => boundaryLatLngs(boundary), [boundary]);
  return <Polygon positions={positions} interactive={false} pathOptions={HAND_EDGE} />;
}

function HandLine({ boundary }: { boundary: AreaBoundary }) {
  const positions = useMemo(() => boundaryLatLngs(boundary), [boundary]);
  const corners = useMemo(() => plotCorners(boundary), [boundary]);
  return (
    <>
      <Polygon positions={positions} interactive={false} pathOptions={HAND_LINE} />
      {corners.map((c, i) => (
        <CircleMarker key={`e${i}`} center={c} radius={7.5} interactive={false} pathOptions={HAND_CORNER_EDGE} />
      ))}
      {corners.map((c, i) => (
        <CircleMarker key={`d${i}`} center={c} radius={5} interactive={false} pathOptions={HAND_CORNER} />
      ))}
    </>
  );
}

/* A picked place with no boundary on record (parishes, tourist areas, and every place in the demo data): its name,
   set at its centre in the page's type over one olive corner dot. No line is drawn, because none is known. */
const escapeHtml = (t: string) =>
  t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

function PlaceMark({ place }: { place: MapPlaceMark }) {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "pg-place",
        html: `<i></i><b>${escapeHtml(place.name)}</b>`,
        iconSize: [0, 0],
      }),
    [place.name]
  );
  return <Marker position={[place.lat, place.lng]} icon={icon} interactive={false} keyboard={false} />;
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

/** What the camera keeps clear when it fits a place: the search bar along the top (two rows on a phone), the filter
 * panel down the left from 1024px, and the key and the credit along the foot. */
function fitPadding(map: L.Map): Pick<L.FitBoundsOptions, "paddingTopLeft" | "paddingBottomRight"> {
  const w = map.getSize().x;
  const wide = typeof window !== "undefined" && window.matchMedia?.("(min-width: 1024px)").matches;
  return {
    paddingTopLeft: [wide ? 312 : 24, w < 640 ? 132 : 76],
    paddingBottomRight: [24, w < 640 ? 84 : 52],
  };
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
  focus: MapFocus | null;
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
    const fit = (bounds: L.LatLngBounds, maxZoom: number) => {
      const options = { ...fitPadding(map), maxZoom };
      if (reduce) map.fitBounds(bounds, { ...options, animate: false });
      else map.flyToBounds(bounds, { ...options, duration: 1.1, easeLinearity: 0.25 });
    };
    if (polygon) {
      fit(L.latLngBounds(polygon.map(([a, b]) => L.latLng(a, b))), 14);
      return;
    }
    if (boundary) {
      const bounds = boundaryBounds(boundary);
      if (bounds.isValid()) {
        fit(bounds, 15);
        return;
      }
    }
    // A place with no boundary: its search radius, so it fits a phone as it fits a desktop.
    if (focus?.radiusKm) {
      fit(L.latLng(focus.lat, focus.lng).toBounds(focus.radiusKm * 2000), 15);
      return;
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

/** A named-area selection's boundary, in its slot colour. `hand` draws it in
 * the brand mark's hand instead (a single place, not a comparison). */
export interface MapAreaOutline {
  boundary: AreaBoundary;
  color: string;
  hand?: boolean;
}

/** A single picked place with no boundary on record: named at its centre. */
export interface MapPlaceMark {
  lat: number;
  lng: number;
  name: string;
}

/** Where the camera goes for a picked place; `radiusKm` fits its search radius. */
export interface MapFocus {
  lat: number;
  lng: number;
  zoom: number;
  radiusKm?: number | null;
}

export default function MarketMap({
  points,
  areas,
  window_,
  drawing,
  shapes,
  areaMarks,
  areaOutlines,
  placeMark,
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
  /** A single picked place with no boundary on record. */
  placeMark: MapPlaceMark | null;
  /** Polygon to fit the viewport to (the most recently added drawn area). */
  fitTo: PolygonCoords | null;
  /** Boundary of the most recently picked named area, once loaded. */
  fitBoundary: AreaBoundary | null;
  /** The picked area's boundary is still loading — don't move yet. */
  holdCamera: boolean;
  focus: MapFocus | null;
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
      maxZoom={18}
      zoomControl={false}
      attributionControl={false}
      scrollWheelZoom={true}
      className="pg-map"
      style={{ width: "100%", height: "100%", background: MAP.land }}
    >
      {/* The landing's map, painted from open vector tiles; the credit is the map's only text. */}
      <Basemap />
      <AttributionControl position="bottomright" prefix={false} />

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

      {/* Two panes round the listings. The dots' canvas is made afresh whenever the listings or the filters change,
          which puts it over anything else in the overlay pane, so what must show over the dots has a pane of its
          own above it (450, under the markers' 600), and a picked place's tint one below it (390). Neither pane
          takes the pointer: the dots under them stay hoverable and clickable. */}
      <Pane name="ps-area-under" style={{ zIndex: 390, pointerEvents: "none" }}>
        {areaOutlines.map((o, i) => (o.hand ? <HandTint key={`tint-${i}`} boundary={o.boundary} /> : null))}
      </Pane>

      <Pane name="ps-area-over" style={{ zIndex: 450, pointerEvents: "none" }}>
        {shapes.map((s, i) => (
          <Polygon
            key={`shape-${i}`}
            positions={s.coords}
            interactive={false}
            pathOptions={{
              color: "#1F2A16",
              weight: 2.5,
              fillColor: s.color,
              fillOpacity: 0.16,
            }}
          />
        ))}

        {/* Named selections with a dim_areas boundary: a single place in the
            brand mark's hand, compared places in their slot colours. */}
        {areaOutlines.map((o, i) =>
          o.hand ? (
            <HandLine key={`hand-${i}`} boundary={o.boundary} />
          ) : (
            <AreaOutline key={`outline-${i}-${o.color}`} outline={o} />
          )
        )}

        {/* Areas without a boundary (parishes, tourist areas, demo data): a
            slot-coloured ring around the area centre instead. */}
        {areaMarks.map((m, i) => (
          <CircleMarker
            key={`mark-${i}`}
            center={[m.lat, m.lng]}
            radius={14}
            interactive={false}
            pathOptions={{
              color: m.color,
              weight: 3,
              fillColor: m.color,
              fillOpacity: 0.15,
            }}
          />
        ))}
      </Pane>

      {placeMark && <PlaceMark place={placeMark} />}

      {drawing && <DrawLayer onComplete={onPolygonComplete} onCancel={onDrawCancel} />}
      <FitPolygon polygon={fitTo} boundary={fitBoundary} hold={holdCamera} focus={focus} />
    </MapContainer>
  );
}
