"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Itinerary, Place, TravelProfile } from "@/lib/types";
import { SidebarChat, type ChatMessage } from "@/components/SidebarChat";
import { MapView } from "@/components/MapView";
import { ItineraryPanel } from "@/components/ItineraryPanel";
import { OnboardingFlow } from "@/components/OnboardingFlow";

const PROFILE_KEY = "compass.travelProfile.v1";
const ACCOUNT_KEY = "compass.account.v1";
const ONBOARDING_KEY = "compass.onboardingComplete.v1";
const SIDEBAR_WIDTH_KEY = "compass.sidebarWidth.v1";
const SIDEBAR_OPEN_KEY = "compass.sidebarOpen.v1";

const SIDEBAR_WIDTH_DEFAULT = 340;
const SIDEBAR_WIDTH_MIN = 280;
const SIDEBAR_WIDTH_MAX = 520;

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
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_WIDTH_DEFAULT);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startWidth: number;
    target: HTMLElement;
  } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      kind: "text",
      content:
        // "Share your travel profile to start. I will turn your chat requests into a mapped day-by-day itinerary.",
        "Ask for a plan anytime, for example: “Plan me a 3-day relaxed food trip in Tokyo.”"
    },
  ]);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [selectedPlaceKey, setSelectedPlaceKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      const storedAccount = localStorage.getItem(ACCOUNT_KEY);
      const done = localStorage.getItem(ONBOARDING_KEY) === "true";
      const storedWidth = localStorage.getItem(SIDEBAR_WIDTH_KEY);
      const storedOpen = localStorage.getItem(SIDEBAR_OPEN_KEY);

      if (raw) setTravelProfile(JSON.parse(raw) as TravelProfile);
      else setTravelProfile(defaultProfile());

      if (storedAccount) {
        setAccount(JSON.parse(storedAccount) as ReturnType<typeof defaultAccount>);
      }

      setIsOnboarded(done);

      if (storedWidth) {
        const parsed = Number(storedWidth);
        if (!Number.isNaN(parsed)) {
          setSidebarWidth(
            Math.min(
              SIDEBAR_WIDTH_MAX,
              Math.max(SIDEBAR_WIDTH_MIN, parsed),
            ),
          );
        }
      }

      if (storedOpen === "true" || storedOpen === "false") {
        setIsSidebarOpen(storedOpen === "true");
      }
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

  useEffect(() => {
    if (!isReady) return;
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
    localStorage.setItem(SIDEBAR_OPEN_KEY, String(isSidebarOpen));
  }, [isReady, isSidebarOpen, sidebarWidth]);

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;
      const delta = e.clientX - drag.startX;
      const next = Math.min(
        SIDEBAR_WIDTH_MAX,
        Math.max(SIDEBAR_WIDTH_MIN, drag.startWidth + delta),
      );
      setSidebarWidth(next);
    }

    function onPointerUp(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;
      dragRef.current = null;
      try {
        drag.target.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

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


      <main 
        className="relative flex h-[100dvh] w-full gap-4 p-4 transition-all duration-300 ease-out"
        style={{ paddingLeft: `calc(${isSidebarOpen ? sidebarWidth : 60}px + 1rem)` }}
      >
        <div className="relative flex-1 overflow-hidden rounded-[24px] border border-[color:rgba(122,85,68,0.25)] shadow-sm bg-white">
          <MapView
            itinerary={itinerary}
            places={allPlaces}
            selectedPlaceKey={selectedPlaceKey}
            onSelectPlaceKey={setSelectedPlaceKey}
            accountName={account.name}
          />
        </div>

        <aside
          style={{ width: isSidebarOpen ? sidebarWidth : 60 }}
          className="absolute inset-y-0 left-0 z-30 border-r border-[color:rgba(122,85,68,0.2)] bg-[color:#c9b59f] shadow-[18px_0_60px_rgba(61,43,31,0.12)] transition-all duration-300 ease-out overflow-hidden"
        >

          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize chat sidebar"
            onPointerDown={(e) => {
              if (!isSidebarOpen) return;
              e.preventDefault();
              const target = e.currentTarget as HTMLDivElement;
              dragRef.current = {
                pointerId: e.pointerId,
                startX: e.clientX,
                startWidth: sidebarWidth,
                target,
              };
              target.setPointerCapture(e.pointerId);
            }}
            className={[
              "absolute inset-y-0 right-0 z-50 w-2 cursor-col-resize select-none",
              isSidebarOpen ? "" : "pointer-events-none opacity-0",
            ].join(" ")}
          >
            <div className="absolute inset-y-0 right-1 w-px bg-[color:rgba(61,43,31,0.18)]" />
            <div className="absolute inset-y-8 right-0 w-2 rounded-full bg-[color:rgba(250,247,242,0.0)]" />
          </div>

          <SidebarChat
            accountName={account.name}
            travelProfile={travelProfile}
            messages={messages}
            setMessages={setMessages}
            onItinerary={setItinerary}
            onSelectPlaceKey={setSelectedPlaceKey}
            onResetOnboarding={() => setIsOnboarded(false)}
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        </aside>

        <div className={`shrink-0 transition-all duration-300 ease-out ${isLedgerOpen ? "w-[360px]" : "w-[60px]"}`}>
          <ItineraryPanel
            itinerary={itinerary}
            selectedPlaceKey={selectedPlaceKey}
            onSelectPlaceKey={setSelectedPlaceKey}
            isOpen={isLedgerOpen}
            onToggle={() => setIsLedgerOpen(!isLedgerOpen)}
          />
        </div>
      </main>
      <div className="pointer-events-none absolute bottom-4 right-6 font-mono text-[10px] tracking-[0.18em] text-[color:rgba(61,43,31,0.35)] z-10">
        APRIL 2026
      </div>
    </div>
  );
}

