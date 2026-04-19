"use client";

import { useMemo, useState } from "react";
import type { Itinerary, PlaceType } from "@/lib/types";
import { CornerMarks } from "@/components/ui/CornerMarks";
import { DiamondRule } from "@/components/ui/DiamondRule";
import { SectionLabel } from "@/components/ui/SectionLabel";

function dot(type: PlaceType) {
  if (type === "food" || type === "cafe") return "bg-[color:var(--color-coffee)]";
  if (type === "landmark") return "bg-[color:var(--color-sky)]";
  if (type === "activity") return "bg-[color:var(--color-olive)]";
  return "bg-[color:var(--color-sand)]";
}

function label(type: PlaceType) {
  if (type === "food") return "Street food";
  if (type === "cafe") return "Cafe";
  if (type === "nightlife") return "Night";
  if (type === "landmark") return "Landmark";
  return "Activity";
}

function minutesToStamp(totalMin: number) {
  // Hackathon-friendly: roughly map durations into a plausible timeline.
  // Start at 09:00, add duration + 25 min transit buffer.
  const base = 9 * 60;
  const m = base + totalMin;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}:${mm.toString().padStart(2, "0")}`;
}

export function ItineraryPanel({
  itinerary,
  selectedPlaceKey,
  onSelectPlaceKey,
}: {
  itinerary: Itinerary | null;
  selectedPlaceKey: string | null;
  onSelectPlaceKey: (k: string | null) => void;
}) {
  const [activeDay, setActiveDay] = useState<number>(1);

  const days = itinerary?.days ?? [];
  const safeActiveDay = useMemo(() => {
    if (days.length === 0) return 1;
    const existing = days.find((d) => d.day === activeDay);
    return existing?.day ?? days[0]!.day;
  }, [days, activeDay]);

  const active = days.find((d) => d.day === safeActiveDay) ?? null;

  return (
    <div className="relative flex h-full flex-col p-6 text-[color:var(--color-ink)]">
      <CornerMarks />
      
      <header className="mb-6 flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:rgba(61,43,31,0.5)]">
          ITINERARY LEDGER
        </div>
        <button type="button" className="flex h-7 w-7 items-center justify-center rounded border border-[color:rgba(122,85,68,0.2)] text-[color:rgba(61,43,31,0.6)] hover:bg-[color:rgba(122,85,68,0.05)]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </header>

      <div className="mb-6 text-[22px] font-medium leading-tight text-[color:var(--color-ink)]">
        {itinerary?.title ?? "Waiting for route"}
      </div>

      <div className="mb-6 flex items-center justify-between rounded-lg border border-[color:rgba(122,85,68,0.15)] bg-[color:rgba(122,85,68,0.04)] px-4 py-3">
        <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-[color:rgba(61,43,31,0.7)]">
          {itinerary?.destination ?? "NO DESTINATION"}
        </div>
        <button type="button" className="flex items-center gap-1.5 rounded bg-transparent px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[color:rgba(61,43,31,0.6)] hover:bg-[color:rgba(122,85,68,0.08)] border border-[color:rgba(122,85,68,0.2)]">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          COPY
        </button>
      </div>

      {!active ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-[color:rgba(122,85,68,0.25)] py-12 text-center">
          <div className="max-w-[200px] font-mono text-[10px] uppercase leading-relaxed tracking-[0.15em] text-[color:rgba(61,43,31,0.5)]">
            DAY TABS APPEAR AFTER FIRST ITINERARY GENERATION.
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mb-4 flex gap-2">
            {days.map((d) => (
              <button
                key={d.day}
                onClick={() => setActiveDay(d.day)}
                className={[
                  "rounded px-4 py-2 font-mono text-[11px] uppercase tracking-[0.1em]",
                  safeActiveDay === d.day
                    ? "bg-[color:var(--color-coffee)] text-[color:var(--color-cream)]"
                    : "bg-[color:rgba(122,85,68,0.05)] text-[color:rgba(61,43,31,0.6)] hover:bg-[color:rgba(122,85,68,0.1)]",
                ].join(" ")}
                type="button"
              >
                Day {d.day}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <div className="rounded-[20px] border border-[color:rgba(122,85,68,0.15)] bg-white p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:rgba(61,43,31,0.58)]">
                Day {active.day}
              </div>
              <div className="mt-2 text-[18px] font-medium text-[color:var(--color-ink)]">
                {active.theme}
              </div>
            </div>

            <div className="mt-4 rounded-[20px] border border-[color:rgba(122,85,68,0.15)] bg-white px-5 py-3">
              {active.places.map((p, idx) => {
                const key = `${active.day}::${p.name}`;
                const isSel = selectedPlaceKey === key;
                const cumulative =
                  active.places
                    .slice(0, idx)
                    .reduce((acc, x) => acc + x.estimated_duration_minutes + 25, 0) || 0;
                const stamp = minutesToStamp(cumulative);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onSelectPlaceKey(key)}
                    className={[
                      "w-full text-left py-3",
                      idx === active.places.length - 1
                        ? ""
                        : "border-b border-[color:rgba(122,85,68,0.12)]",
                      isSel ? "bg-[color:rgba(122,85,68,0.08)]" : "hover:bg-[color:rgba(122,85,68,0.03)]",
                      "-mx-5 px-5 transition-colors",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-[10px]">
                      <div className="w-[52px] shrink-0 font-mono text-[10px] text-[color:rgba(61,43,31,0.56)]">
                        {stamp}
                      </div>
                      <div
                        className={[
                          "mt-[3px] h-[7px] w-[7px] shrink-0 rounded-full",
                          dot(p.type),
                        ].join(" ")}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-medium text-[color:var(--color-ink)]">
                          {p.name}
                        </div>
                        <div className="mt-1 text-[12px] text-[color:rgba(61,43,31,0.6)]">
                          {label(p.type)} · {p.estimated_duration_minutes} min
                        </div>
                        <div className="mt-2 text-[13px] leading-[1.55] text-[color:rgba(61,43,31,0.88)]">
                          {p.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

