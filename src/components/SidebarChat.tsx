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
  "2 days in Paris: museums + cafes, medium budget",
  "Weekend in NYC: landmarks and nightlife",
];

function bubbleClass(role: "user" | "assistant") {
  if (role === "user") {
    return "max-w-[92%] self-end rounded-[18px] border border-[color:rgba(122,85,68,0.22)] bg-[color:#fffdf9] px-4 py-3 text-[14px] leading-[1.6] text-[color:var(--color-ink)] shadow-[0_10px_24px_rgba(61,43,31,0.05)]";
  }
  return "max-w-[92%] self-start rounded-[18px] border border-[color:rgba(122,85,68,0.22)] bg-[color:#fffdf9] px-4 py-3 text-[14px] leading-[1.65] text-[color:var(--color-ink)] shadow-[0_10px_24px_rgba(61,43,31,0.05)]";
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
  isOpen,
  onToggle,
}: {
  accountName: string;
  travelProfile: TravelProfile | null;
  messages: ChatMessage[];
  setMessages: (fn: (prev: ChatMessage[]) => ChatMessage[]) => void;
  onItinerary: (it: Itinerary) => void;
  onSelectPlaceKey: (key: string | null) => void;
  onResetOnboarding: () => void;
  isOpen: boolean;
  onToggle: () => void;
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
          kind: "text",
          content:
            "Here is your itinerary. Pins are live on the map, and the day tabs are ready for you to browse.",
        },
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

  if (!isOpen) {
    return (
      <div className="relative flex h-[100dvh] flex-col items-center pt-8 text-[color:var(--color-ink)]">
        <button type="button" onClick={onToggle} className="flex h-7 w-7 items-center justify-center rounded border border-[color:rgba(122,85,68,0.2)] text-[color:rgba(61,43,31,0.6)] hover:bg-[color:rgba(122,85,68,0.05)] bg-[color:#fffdf9] shadow-sm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
        <div className="mt-8 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:rgba(61,43,31,0.5)] [writing-mode:vertical-lr] rotate-180">
          TRAVEL DESK
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-[100dvh] flex-col">
      <CornerMarks />

      <header className="px-6 pb-5 pt-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[color:rgba(61,43,31,0.72)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>
              <span>Travel Desk</span>
            </div>

            <div className="mt-3 text-[28px] leading-[1.05] font-light tracking-[-0.03em] text-[color:var(--color-ink)]">
              guide for{accountName ? ` ${accountName}` : ""}
            </div>

            <button
              type="button"
              onClick={onResetOnboarding}
              className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-[color:var(--color-coffee)] hover:text-[color:var(--color-ink)] transition-colors underline decoration-[color:rgba(122,85,68,0.25)] underline-offset-[3px]"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              <span>edit profile</span>
            </button>
            <div className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-[color:rgba(61,43,31,0.65)]">
              {profileSummary}
            </div>
          </div>

          <button type="button" onClick={onToggle} className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-[color:rgba(122,85,68,0.2)] text-[color:rgba(61,43,31,0.6)] hover:cursor-pointer shadow-sm mt-1 p-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        </div>
        <DiamondRule className="mt-5 mb-0" />
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[26px] border border-[color:rgba(122,85,68,0.22)] bg-[color:#fffdf9] shadow-[0_18px_55px_rgba(61,43,31,0.10)]">
          <div className="min-h-0 flex-1 overflow-auto px-5 py-5">
            <div className="flex flex-col items-stretch gap-3">
              {messages.map((m) => {
                if (m.kind === "itinerary") {
                  return (
                    <div key={m.id} className={bubbleClass("assistant")}>
                      <div className="text-[15px] font-medium">
                        {m.itinerary.title}
                      </div>
                      <div className="mt-1 text-[13px] text-[color:rgba(61,43,31,0.72)]">
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

          <div className="border-t border-[color:rgba(122,85,68,0.14)] bg-[color:rgba(250,247,242,0.65)] px-4 py-4">
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 pb-3">
                {presetPrompts.map((p) => (
                  <button
                    key={p}
                    className="rounded-lg border border-[color:rgba(122,85,68,0.22)] bg-[color:#fffdf9] px-3 py-2 text-[12px] leading-[1.3] text-[color:var(--color-ink)] hover:bg-[color:rgba(122,85,68,0.06)]"
                    onClick={() => send(p)}
                    disabled={isSending || !travelProfile}
                    type="button"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!canSend) return;
                void send(draft);
              }}
              className="flex items-stretch gap-3"
            >
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Message</span>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="what should we do?"
                  rows={2}
                  className="min-h-[56px] w-full resize-none rounded-[18px] border border-[color:rgba(122,85,68,0.22)] bg-white px-4 py-3 pr-12 text-[15px] leading-[1.45] text-[color:var(--color-ink)] outline-none focus:border-[color:var(--color-coffee)] focus:ring-4 focus:ring-[color:rgba(122,85,68,0.12)] placeholder:text-[color:rgba(61,43,31,0.45)]"
                />
                <div className="pointer-events-none absolute bottom-3 right-3 font-mono text-[12px] text-[color:rgba(61,43,31,0.42)]">
                  ↵
                </div>
              </label>

              <button
                type="submit"
                disabled={!canSend}
                aria-label={isSending ? "Sending" : "Send message"}
                className="grid h-[56px] w-[56px] shrink-0 place-items-center rounded-[16px] bg-[color:var(--color-coffee)] text-[color:var(--color-cream)] shadow-[0_12px_30px_rgba(61,43,31,0.14)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-coffee),black_10%)] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isSending ? (
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em]">
                    …
                  </span>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 11.5L21 3L12.5 21L10.5 13.5L3 11.5Z"
                      fill="currentColor"
                    />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

