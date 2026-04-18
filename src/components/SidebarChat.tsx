"use client";

import { useMemo, useState } from "react";
import type { Itinerary, TravelProfile } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { CornerMarks } from "@/components/ui/CornerMarks";
import { DiamondRule } from "@/components/ui/DiamondRule";
import { SectionLabel } from "@/components/ui/SectionLabel";

export type ChatMessage =
  | {
      id: string;
      role: "user" | "assistant";
      kind: "text";
      content: string;
    }
  | {
      id: string;
      role: "assistant";
      kind: "itinerary";
      itinerary: Itinerary;
    };

const presetPrompts = [
  "Plan me a 3-day relaxed food trip in Tokyo",
  "2 days in Paris: museums + cafes, medium budget",
  "Weekend in NYC: landmarks and nightlife",
];

function bubbleClass(role: "user" | "assistant") {
  if (role === "user") {
    return "ml-auto max-w-[84%] rounded-[20px] rounded-br-[6px] bg-[color:var(--color-coffee)] px-4 py-3 text-[14px] leading-[1.55] text-[color:var(--color-cream)] shadow-[0_10px_24px_rgba(61,43,31,0.08)]";
  }
  return "mr-auto max-w-[88%] rounded-[20px] rounded-bl-[6px] border border-[color:rgba(122,85,68,0.2)] bg-[color:rgba(250,247,242,0.94)] px-4 py-3 text-[14px] leading-[1.6] text-[color:var(--color-ink)] shadow-[0_10px_24px_rgba(61,43,31,0.05)]";
}

function tagStyle(label: string) {
  const l = label.toLowerCase();
  if (l.includes("food") || l.includes("cafe")) {
    return "bg-[#F2EAE4] text-[color:var(--color-coffee)] border-[#C2A090]";
  }
  if (l.includes("culture") || l.includes("museum") || l.includes("history")) {
    return "bg-[#F0EFE4] text-[#7A7440] border-[#C2BD8E]";
  }
  if (l.includes("water") || l.includes("sky")) {
    return "bg-[#E8F4F8] text-[#4A8FA3] border-[color:var(--color-sky)]";
  }
  if (l.includes("nature") || l.includes("park")) {
    return "bg-[#EDF4EE] text-[#4E8055] border-[color:var(--color-sage)]";
  }
  return "bg-[color:var(--color-cream)] text-[color:var(--color-ink)] border-[color:var(--color-sand)]";
}

export function SidebarChat({
  accountName,
  travelProfile,
  messages,
  setMessages,
  onItinerary,
  onSelectPlaceKey,
  onResetOnboarding,
}: {
  accountName: string;
  travelProfile: TravelProfile | null;
  messages: ChatMessage[];
  setMessages: (fn: (prev: ChatMessage[]) => ChatMessage[]) => void;
  onItinerary: (it: Itinerary) => void;
  onSelectPlaceKey: (key: string | null) => void;
  onResetOnboarding: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  const canSend = draft.trim().length > 0 && !isSending && !!travelProfile;

  const profileSummary = useMemo(() => {
    if (!travelProfile) return "LOADING…";
    return `${travelProfile.travel_style} trip · ${travelProfile.budget} budget · ${travelProfile.group_type}`;
  }, [travelProfile]);

  async function send(message: string) {
    if (!travelProfile) return;
    const text = message.trim();
    if (!text) return;

    setIsSending(true);
    onSelectPlaceKey(null);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      kind: "text",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setDraft("");

    try {
      const chatHistory = [...messages, userMsg]
        .filter((m) => m.kind === "text")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          travelProfile,
          chatHistory,
          latestMessage: text,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Request failed");
      }

      const data = (await res.json()) as Itinerary;

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          kind: "itinerary",
          itinerary: data,
        },
      ]);
      onItinerary(data);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : "Something went wrong generating your itinerary.";
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          kind: "text",
          content:
            "I couldn’t generate that plan. Check your API keys and try again.",
        },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          kind: "text",
          content: `Error: ${msg}`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="relative flex h-[100dvh] flex-col">
      <CornerMarks />

      <header className="px-6 pb-5 pt-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:rgba(61,43,31,0.72)]">
              Travel Desk
            </div>
            <div className="mt-3 text-[28px] leading-[1.05] font-light tracking-[-0.03em] text-[color:var(--color-ink)]">
              Welcome{accountName ? `, ${accountName}` : ""}.
            </div>
            <div className="mt-2 max-w-[24ch] text-[15px] leading-[1.55] text-[color:rgba(61,43,31,0.78)]">
              Ask for a route, a vibe, or a specific destination and the map
              will fill in live.
            </div>
            <div className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-[color:rgba(61,43,31,0.65)]">
              {profileSummary}
            </div>
          </div>
          <Button variant="mono" onClick={onResetOnboarding}>
            Edit setup
          </Button>
        </div>
        <DiamondRule className="mt-5 mb-0" />
      </header>

      {travelProfile && (
        <div className="px-6 pb-5">
          <SectionLabel>PROFILE SNAPSHOT</SectionLabel>

          <div className="mt-4 rounded-[22px] border border-[color:rgba(122,85,68,0.22)] bg-[color:rgba(250,247,242,0.88)] p-4 shadow-[0_18px_50px_rgba(61,43,31,0.08)]">
            <div className="grid gap-4">
              <div>
                <div className="text-[13px] font-medium text-[color:rgba(61,43,31,0.7)]">
                  Style
                </div>
                <div className="mt-1 text-[17px] capitalize text-[color:var(--color-ink)]">
                  {travelProfile.travel_style}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[13px] font-medium text-[color:rgba(61,43,31,0.7)]">
                    Budget
                  </div>
                  <div className="mt-1 text-[17px] capitalize">{travelProfile.budget}</div>
                </div>
                <div>
                  <div className="text-[13px] font-medium text-[color:rgba(61,43,31,0.7)]">
                    Group
                  </div>
                  <div className="mt-1 text-[17px] capitalize">
                    {travelProfile.group_type}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[13px] font-medium text-[color:rgba(61,43,31,0.7)]">
                  Interests
                </div>
                <div className="mt-3 flex flex-wrap gap-[8px]">
                  {travelProfile.interests.map((it) => (
                    <div
                      key={it}
                      className={`rounded-[999px] border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.08em] ${tagStyle(
                        it,
                      )}`}
                    >
                      {it}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 pb-3">
        <SectionLabel>CHAT</SectionLabel>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 pb-6">
        <div className="flex flex-col gap-3">
          {messages.map((m) => {
            if (m.kind === "itinerary") {
              return (
                <div key={m.id} className={bubbleClass("assistant")}>
                  <div className="font-medium">{m.itinerary.title}</div>
                  <div className="mt-1 text-[color:rgba(61,43,31,0.68)]">
                    {m.itinerary.destination} · {m.itinerary.days.length} day
                    {m.itinerary.days.length === 1 ? "" : "s"}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const first =
                          m.itinerary.days[0]?.places?.[0]?.name ?? null;
                        if (!first) return;
                        onSelectPlaceKey(`1::${first}`);
                      }}
                    >
                      Jump to first stop
                    </Button>
                    <Button
                      variant="mono"
                      size="sm"
                      onClick={() => {
                        setDraft("More cafes, fewer landmarks.");
                      }}
                    >
                      refine
                    </Button>
                  </div>
                </div>
              );
            }
            return (
              <div key={m.id} className={bubbleClass(m.role)}>
                {m.content}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-6 pb-5">
        <div className="flex flex-wrap gap-2 pb-3">
          {presetPrompts.map((p) => (
            <button
              key={p}
              className="rounded-[999px] border border-[color:rgba(122,85,68,0.25)] bg-[color:rgba(250,247,242,0.62)] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[color:var(--color-coffee)] hover:bg-[color:rgba(122,85,68,0.08)]"
              onClick={() => send(p)}
              disabled={isSending || !travelProfile}
              type="button"
            >
              {p}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSend) return;
            void send(draft);
          }}
          className="flex items-end gap-2"
        >
          <div className="flex-1">
            <div className="relative">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask for a trip plan…"
                className="min-h-[54px] w-full resize-none rounded-[18px] border border-[color:rgba(122,85,68,0.28)] bg-[color:var(--color-cream)] px-4 py-3 pr-10 text-[15px] leading-[1.45] outline-none focus:border-[color:var(--color-coffee)] focus:ring-4 focus:ring-[color:rgba(122,85,68,0.12)] placeholder:text-[color:rgba(61,43,31,0.45)]"
              />
              <div className="pointer-events-none absolute bottom-4 right-3 font-mono text-[11px] text-[color:rgba(61,43,31,0.45)]">
                ↵
              </div>
            </div>
          </div>
          <Button type="submit" disabled={!canSend} className="h-[54px] rounded-[18px] px-5 text-[13px]">
            {isSending ? "Generating…" : "Generate"}
          </Button>
        </form>
      </div>
    </div>
  );
}

