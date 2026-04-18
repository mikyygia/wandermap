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

  const headerMeta = useMemo(() => {
    if (!itinerary) return null;
    const stops = itinerary.days.reduce((acc, d) => acc + d.places.length, 0);
    return `Day tabs · ${itinerary.days.length} day${
      itinerary.days.length === 1 ? "" : "s"
    } · ${stops} stops`;
  }, [itinerary]);

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-[color:rgba(122,85,68,0.22)] bg-[color:rgba(250,247,242,0.96)] shadow-[0_24px_70px_rgba(61,43,31,0.16)] backdrop-blur-sm">
      <CornerMarks />

      <header className="px-5 pb-4 pt-5">
        <SectionLabel>ITINERARY</SectionLabel>
        <div className="mt-4 rounded-[22px] border border-[color:rgba(122,85,68,0.18)] bg-[color:#fffdf9] p-4">
          <div className="text-[16px] font-medium leading-[1.35] text-[color:var(--color-ink)]">
            {itinerary?.title ?? "Generate an itinerary to begin"}
          </div>
          <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[color:rgba(61,43,31,0.62)]">
            {itinerary?.destination ?? "—"} {headerMeta ? `· ${headerMeta}` : ""}
          </div>
          <DiamondRule className="mt-4" />

          <div className="mt-4 flex gap-0">
            {[1, 2, 3].map((d) => {
              const exists = days.some((x) => x.day === d);
              const isActive = safeActiveDay === d;
              return (
                <button
                  key={d}
                  disabled={!exists}
                  onClick={() => setActiveDay(d)}
                  className={[
                    "px-[16px] py-[8px] font-mono text-[11px] uppercase tracking-[0.1em] border border-[color:rgba(122,85,68,0.24)]",
                    d === 1 ? "rounded-l-[4px]" : "",
                    d === 3 ? "rounded-r-[4px]" : "",
                    isActive
                      ? "bg-[color:var(--color-coffee)] text-[color:var(--color-cream)] border-[color:var(--color-coffee)]"
                      : "bg-transparent text-[color:rgba(61,43,31,0.62)]",
                    !exists ? "opacity-40 cursor-not-allowed" : "hover:bg-[color:rgba(122,85,68,0.08)]",
                  ].join(" ")}
                  type="button"
                >
                  Day {d}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="max-h-[46vh] min-h-0 overflow-auto px-5 pb-5">
        {!active ? (
          <div className="rounded-[22px] border border-[color:rgba(122,85,68,0.18)] bg-[color:#fffdf9] p-5 text-[14px] leading-[1.7] text-[color:rgba(61,43,31,0.86)]">
            Use the chat to generate a 1–3 day plan. As soon as the AI returns,
            you’ll get day tabs here and pins on the map.
          </div>
        ) : (
          <div>
            <div className="rounded-[22px] border border-[color:rgba(122,85,68,0.18)] bg-[color:#fffdf9] p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:rgba(61,43,31,0.58)]">
                Day {active.day}
              </div>
              <div className="mt-2 text-[18px] font-medium text-[color:var(--color-ink)]">
                {active.theme}
              </div>
            </div>

            <div className="mt-4 rounded-[22px] border border-[color:rgba(122,85,68,0.18)] bg-[color:#fffdf9] px-5 py-3">
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
                      isSel ? "bg-[color:rgba(122,85,68,0.08)]" : "hover:bg-[color:rgba(122,85,68,0.05)]",
                      "-mx-5 px-5",
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
                        <div className="mt-2 font-mono text-[10px] tracking-[0.04em] text-[color:rgba(61,43,31,0.56)]">
                          {p.lat.toFixed(4)}° N, {p.lng.toFixed(4)}° E
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

