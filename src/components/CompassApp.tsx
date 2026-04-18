"use client";

import { useEffect, useMemo, useState } from "react";
import type { Itinerary, Place, TravelProfile } from "@/lib/types";
import { SidebarChat, type ChatMessage } from "@/components/SidebarChat";
import { MapView } from "@/components/MapView";
import { ItineraryPanel } from "@/components/ItineraryPanel";
import { OnboardingFlow } from "@/components/OnboardingFlow";

const PROFILE_KEY = "compass.travelProfile.v1";
const ACCOUNT_KEY = "compass.account.v1";
const ONBOARDING_KEY = "compass.onboardingComplete.v1";

function defaultProfile(): TravelProfile {
  return {
    travel_style: "relaxed",
    budget: "medium",
    group_type: "solo",
    interests: ["food", "cafes"],
  };
}

function defaultAccount() {
  return {
    name: "",
    email: "",
  };
}

export function CompassApp() {
  const [travelProfile, setTravelProfile] = useState<TravelProfile | null>(null);
  const [account, setAccount] = useState(defaultAccount());
  const [isReady, setIsReady] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      kind: "text",
      content:
        "Tell me where you're going and what vibe you want. I’ll turn it into a 1–3 day plan with pins.",
    },
  ]);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [selectedPlaceKey, setSelectedPlaceKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      const storedAccount = localStorage.getItem(ACCOUNT_KEY);
      const done = localStorage.getItem(ONBOARDING_KEY) === "true";

      if (raw) setTravelProfile(JSON.parse(raw) as TravelProfile);
      else setTravelProfile(defaultProfile());

      if (storedAccount) {
        setAccount(JSON.parse(storedAccount) as ReturnType<typeof defaultAccount>);
      }

      setIsOnboarded(done);
    } catch {
      setTravelProfile(defaultProfile());
      setAccount(defaultAccount());
      setIsOnboarded(false);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!travelProfile) return;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(travelProfile));
  }, [travelProfile]);

  useEffect(() => {
    if (!isReady) return;
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    localStorage.setItem(ONBOARDING_KEY, String(isOnboarded));
  }, [account, isOnboarded, isReady]);

  const allPlaces = useMemo(() => {
    const places: Array<Place & { day: number }> = [];
    for (const d of itinerary?.days ?? []) {
      for (const p of d.places) places.push({ ...p, day: d.day });
    }
    return places;
  }, [itinerary]);

  if (!isReady || !travelProfile) {
    return null;
  }

  if (!isOnboarded) {
    return (
      <OnboardingFlow
        initialAccount={account}
        initialProfile={travelProfile}
        onComplete={({ account: nextAccount, profile }) => {
          setAccount(nextAccount);
          setTravelProfile(profile);
          setIsOnboarded(true);
        }}
      />
    );
  }

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[color:var(--color-paper)] text-[color:var(--color-ink)]">
      <div className="pointer-events-none absolute left-8 top-6 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-sand)]/50">
        Wandermap · Design System v0.1
      </div>
      <div className="pointer-events-none absolute bottom-6 right-8 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-sand)]/50">
        April 2026
      </div>

      <main className="relative h-[100dvh] w-full">
        <MapView
          itinerary={itinerary}
          places={allPlaces}
          selectedPlaceKey={selectedPlaceKey}
          onSelectPlaceKey={setSelectedPlaceKey}
          accountName={account.name}
        />

        <aside
          className={[
            "absolute inset-y-0 left-0 z-30 w-[320px] border-r border-[color:rgba(122,85,68,0.2)] bg-[color:#c9b59f] shadow-[18px_0_60px_rgba(61,43,31,0.12)] transition-transform duration-300",
            isSidebarOpen ? "translate-x-0" : "-translate-x-[288px]",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="absolute right-3 top-16 z-40 grid h-10 w-10 place-items-center rounded-full border border-[color:rgba(61,43,31,0.24)] bg-[color:rgba(250,247,242,0.9)] text-[20px] text-[color:var(--color-coffee)] shadow-sm"
          >
            {isSidebarOpen ? "‹" : "›"}
          </button>

          <SidebarChat
            accountName={account.name}
            travelProfile={travelProfile}
            messages={messages}
            setMessages={setMessages}
            onItinerary={setItinerary}
            onSelectPlaceKey={setSelectedPlaceKey}
            onResetOnboarding={() => setIsOnboarded(false)}
          />
        </aside>

        {!isSidebarOpen && (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="absolute left-4 top-20 z-20 grid h-11 w-11 place-items-center rounded-full border border-[color:rgba(122,85,68,0.28)] bg-[color:rgba(250,247,242,0.92)] text-[22px] text-[color:var(--color-coffee)] shadow-[0_10px_30px_rgba(61,43,31,0.12)]"
            aria-label="Open chat sidebar"
          >
            ›
          </button>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-5 z-20 flex justify-center px-6">
          <div className="pointer-events-auto flex gap-2 rounded-[18px] bg-[color:rgba(250,247,242,0.82)] p-2 shadow-[0_12px_30px_rgba(61,43,31,0.12)] backdrop-blur-sm">
            {(itinerary?.days ?? [{ day: 1 }, { day: 2 }]).slice(0, 3).map((d) => (
              <div
                key={d.day}
                className="rounded-[14px] bg-[color:var(--color-olive)] px-6 py-2 font-mono text-[13px] uppercase tracking-[0.12em] text-[color:var(--color-cream)]"
              >
                Day {d.day}
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-6 right-6 z-20 w-[370px] max-w-[calc(100vw-2rem)]">
          <ItineraryPanel
            itinerary={itinerary}
            selectedPlaceKey={selectedPlaceKey}
            onSelectPlaceKey={setSelectedPlaceKey}
          />
        </div>
      </main>
    </div>
  );
}

