"use client";

import mapboxgl, { LngLatBounds } from "mapbox-gl";
import { useEffect, useMemo, useRef } from "react";
import type { Itinerary, Place, PlaceType } from "@/lib/types";
import { CornerMarks } from "@/components/ui/CornerMarks";
import { SectionLabel } from "@/components/ui/SectionLabel";

type PlaceWithDay = Place & { day: number };

function dotColor(type: PlaceType) {
  if (type === "food" || type === "cafe") return "var(--color-coffee)";
  if (type === "landmark") return "var(--color-sky)";
  if (type === "activity") return "var(--color-olive)";
  return "var(--color-sand)";
}

function pinEl(place: PlaceWithDay) {
  const el = document.createElement("button");
  el.type = "button";
  el.className =
    "group flex items-center gap-2 rounded-[20px] border bg-[color:var(--color-cream)] px-3 py-2 text-left shadow-[0_14px_40px_rgba(61,43,31,0.12)] border-[color:var(--color-sand)]";
  el.style.borderWidth = "0.5px";

  const dot = document.createElement("span");
  dot.className = "inline-block h-[10px] w-[10px] rounded-full";
  dot.style.background = dotColor(place.type);
  dot.style.marginTop = "2px";

  const label = document.createElement("span");
  label.className = "text-[11.5px] text-[color:var(--color-ink)]";
  label.textContent = place.name;

  el.appendChild(dot);
  el.appendChild(label);
  return el;
}

export function MapView({
  itinerary,
  places,
  selectedPlaceKey,
  onSelectPlaceKey,
  accountName,
}: {
  itinerary: Itinerary | null;
  places: PlaceWithDay[];
  selectedPlaceKey: string | null;
  onSelectPlaceKey: (k: string | null) => void;
  accountName: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const initialCenter = useMemo(() => {
    const first = places[0];
    if (first) return [first.lng, first.lat] as [number, number];
    return [139.6503, 35.6762] as [number, number]; // Tokyo fallback
  }, [places]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    if (!mapboxToken) {
      // Intentionally leave map blank with instructions overlay.
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: initialCenter,
      zoom: 11.5,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    if (places.length === 0) return;

    const bounds = new LngLatBounds();

    for (const p of places) {
      bounds.extend([p.lng, p.lat]);
      const el = pinEl(p);
      const key = `${p.day}::${p.name}`;
      el.onclick = () => onSelectPlaceKey(key);

      const popup = new mapboxgl.Popup({ offset: 18 }).setHTML(
        `<div style="font-family: var(--font-sans);">
          <div style="font-weight:500; font-size:12px; color: var(--color-ink)">${p.name}</div>
          <div style="margin-top:4px; font-size:11px; color: var(--color-sand)">${p.type} · ${p.estimated_duration_minutes} min</div>
          <div style="margin-top:8px; font-size:12px; color: var(--color-ink); line-height:1.45">${p.description}</div>
          <div style="margin-top:10px; font-family: var(--font-mono); font-size:10px; color: var(--color-sand); letter-spacing:0.12em; text-transform:uppercase">
            DAY ${p.day}
          </div>
        </div>`,
      );

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([p.lng, p.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    }

    map.fitBounds(bounds, { padding: 80, duration: 900, maxZoom: 13.5 });
  }, [places, onSelectPlaceKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!selectedPlaceKey) return;

    const [dayStr, name] = selectedPlaceKey.split("::");
    const day = Number(dayStr);
    const p = places.find((x) => x.day === day && x.name === name);
    if (!p) return;

    map.easeTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 12.5) });

    // Try to open the popup for the matching marker.
    for (const m of markersRef.current) {
      const ll = m.getLngLat();
      if (Math.abs(ll.lng - p.lng) < 1e-6 && Math.abs(ll.lat - p.lat) < 1e-6) {
        m.togglePopup();
        break;
      }
    }
  }, [selectedPlaceKey, places]);

  return (
    <div className="relative h-full w-full">
      {mapboxToken && (
        <div className="absolute left-4 top-4 z-20 w-[200px] overflow-hidden rounded border border-[color:rgba(122,85,68,0.2)] bg-[color:rgba(250,247,242,0.85)] shadow-sm backdrop-blur-md">
          <div className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[color:#E87E04]">
            MAP CANVAS
          </div>
          <div className="border-t border-[color:rgba(122,85,68,0.1)] px-3 py-2 text-[13px] text-[color:rgba(61,43,31,0.8)]">
            {places.length === 0 ? "No destination yet" : itinerary?.destination}
          </div>
        </div>
      )}
      {places.length === 0 && mapboxToken && (
        <div className="pointer-events-none absolute bottom-8 inset-x-0 flex justify-center z-20">
          <div className="rounded border border-[color:rgba(122,85,68,0.25)] bg-[color:rgba(250,247,242,0.65)] px-6 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[color:rgba(61,43,31,0.65)] backdrop-blur-md">
            PINS APPEAR HERE AFTER ITINERARY GENERATION
          </div>
        </div>
      )}

      <div ref={containerRef} className="h-full w-full" />

      {!mapboxToken && (
        <div className="absolute inset-0 grid place-items-center bg-[color:rgba(232,227,218,0.92)]">
          <div className="max-w-md rounded-[var(--radius-card)] border border-[color:var(--color-sand)] bg-[color:var(--color-cream)] p-6 text-center shadow-[0_18px_55px_rgba(61,43,31,0.12)]">
            <div className="text-[16px] font-medium">
              Add your Mapbox token
            </div>
            <div className="mt-2 text-[13px] leading-[1.6] text-[color:var(--color-ink)]">
              Set{" "}
              <span className="font-mono text-[12px] tracking-[0.04em]">
                NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
              </span>{" "}
              in <span className="font-mono text-[12px]">.env.local</span>.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

