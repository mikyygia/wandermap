"use client";

import { useMemo, useState } from "react";
import type { TravelProfile } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { CornerMarks } from "@/components/ui/CornerMarks";
import { DiamondRule } from "@/components/ui/DiamondRule";
import { SectionLabel } from "@/components/ui/SectionLabel";

type Account = {
  name: string;
  email: string;
};

const interestOptions = [
  "food",
  "cafes",
  "museums",
  "shopping",
  "nightlife",
  "nature",
  "markets",
  "architecture",
];

const styleOptions = ["relaxed", "balanced", "packed"];
const groupOptions = ["solo", "couple", "friends", "family"];
const budgetOptions: Array<TravelProfile["budget"]> = ["low", "medium", "high"];

function chip(active: boolean) {
  return active
    ? "border-[color:var(--color-coffee)] bg-[color:var(--color-coffee)] text-[color:var(--color-cream)]"
    : "border-[color:rgba(122,85,68,0.35)] bg-[color:var(--color-cream)] text-[color:var(--color-ink)] hover:bg-[color:rgba(122,85,68,0.08)]";
}

export function OnboardingFlow({
  initialAccount,
  initialProfile,
  onComplete,
}: {
  initialAccount: Account;
  initialProfile: TravelProfile;
  onComplete: (payload: { account: Account; profile: TravelProfile }) => void;
}) {
  const [step, setStep] = useState<"signup" | "survey">("signup");
  const [account, setAccount] = useState<Account>(initialAccount);
  const [profile, setProfile] = useState<TravelProfile>(initialProfile);
  const [destinationHint, setDestinationHint] = useState("Tokyo");

  const canContinue =
    account.name.trim().length > 1 && account.email.includes("@");

  const canFinish = useMemo(() => {
    return (
      profile.travel_style.trim().length > 0 &&
      profile.group_type.trim().length > 0 &&
      profile.interests.length > 0
    );
  }, [profile]);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[color:var(--color-paper)] px-6 py-8 text-[color:var(--color-ink)]">
      <CornerMarks />

      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-[1280px] overflow-hidden rounded-[28px] border border-[color:rgba(122,85,68,0.32)] bg-[color:#d5c3af] shadow-[0_28px_90px_rgba(61,43,31,0.16)]">
        <div className="flex w-[36%] min-w-[320px] flex-col justify-between bg-[color:#c8b39c] px-10 py-10">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:rgba(61,43,31,0.7)]">
              Compass
            </div>
            <h1 className="mt-4 max-w-[10ch] text-[46px] font-light leading-[0.98] tracking-[-0.04em] text-[color:var(--color-ink)]">
              Plan your next{" "}
              <span className="italic text-[color:var(--color-coffee)]">
                escape
              </span>
            </h1>
            <p className="mt-5 max-w-sm text-[17px] leading-[1.7] text-[color:rgba(61,43,31,0.86)]">
              Start with a quick sign up, answer a lightweight travel survey,
              then drop into a live map workspace where chat, pins, and your
              itinerary stay in sync.
            </p>
          </div>

          <div className="rounded-[20px] border border-[color:rgba(122,85,68,0.3)] bg-[color:rgba(250,247,242,0.72)] p-5">
            <SectionLabel>FLOW</SectionLabel>
            <div className="mt-5 space-y-3">
              {[
                "1. Sign up with your basics",
                "2. Tune your travel preferences",
                "3. Generate and refine on the map",
              ].map((line, index) => (
                <div
                  key={line}
                  className="flex items-center gap-3 rounded-[14px] bg-[color:rgba(255,255,255,0.36)] px-4 py-3"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-coffee)] text-[12px] font-medium text-[color:var(--color-cream)]">
                    {index + 1}
                  </div>
                  <div className="text-[15px] text-[color:var(--color-ink)]">
                    {line}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center bg-[color:var(--color-cream)] px-8 py-8">
          <div className="w-full max-w-[560px] rounded-[28px] border border-[color:rgba(122,85,68,0.2)] bg-[color:#fffdf9] p-8 shadow-[0_24px_70px_rgba(61,43,31,0.08)]">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--color-coffee)]">
              {step === "signup" ? "Step 1 · Sign Up" : "Step 2 · Survey"}
            </div>
            <div className="mt-3 text-[34px] font-light leading-[1.05] tracking-[-0.03em]">
              {step === "signup"
                ? "Create your traveler profile"
                : "Tell Compass how you like to travel"}
            </div>
            <p className="mt-3 max-w-[44ch] text-[16px] leading-[1.65] text-[color:rgba(61,43,31,0.82)]">
              {step === "signup"
                ? "Mock auth is enough for hackathon mode. We just need enough context to personalize the experience."
                : "These choices shape the itinerary prompt before you ever reach the map."}
            </p>

            <DiamondRule className="mt-6" />

            {step === "signup" ? (
              <div className="mt-6 space-y-5">
                <label className="block">
                  <div className="mb-2 text-[14px] font-medium text-[color:var(--color-ink)]">
                    Full name
                  </div>
                  <input
                    value={account.name}
                    onChange={(e) =>
                      setAccount((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Nhi Nguyen"
                    className="w-full rounded-[16px] border border-[color:rgba(122,85,68,0.28)] bg-[color:var(--color-cream)] px-4 py-4 text-[16px] text-[color:var(--color-ink)] outline-none ring-0 placeholder:text-[color:rgba(61,43,31,0.48)] focus:border-[color:var(--color-coffee)] focus:ring-4 focus:ring-[color:rgba(122,85,68,0.12)]"
                  />
                </label>

                <label className="block">
                  <div className="mb-2 text-[14px] font-medium text-[color:var(--color-ink)]">
                    Email
                  </div>
                  <input
                    value={account.email}
                    onChange={(e) =>
                      setAccount((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="you@example.com"
                    className="w-full rounded-[16px] border border-[color:rgba(122,85,68,0.28)] bg-[color:var(--color-cream)] px-4 py-4 text-[16px] text-[color:var(--color-ink)] outline-none ring-0 placeholder:text-[color:rgba(61,43,31,0.48)] focus:border-[color:var(--color-coffee)] focus:ring-4 focus:ring-[color:rgba(122,85,68,0.12)]"
                  />
                </label>

                <div className="rounded-[18px] bg-[color:rgba(122,85,68,0.06)] px-4 py-4 text-[14px] leading-[1.6] text-[color:rgba(61,43,31,0.82)]">
                  We are not building real auth here. This step exists to make
                  the demo feel intentional and to stage users into the survey.
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setStep("survey")}
                    disabled={!canContinue}
                    className="h-12 rounded-[14px] px-6 text-[13px]"
                  >
                    Continue to survey
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <div>
                  <div className="mb-3 text-[14px] font-medium">Travel style</div>
                  <div className="flex flex-wrap gap-3">
                    {styleOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setProfile((prev) => ({ ...prev, travel_style: option }))
                        }
                        className={`rounded-[999px] border px-4 py-3 text-[15px] capitalize transition-colors ${chip(
                          profile.travel_style === option,
                        )}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-3 text-[14px] font-medium">Budget</div>
                  <div className="grid grid-cols-3 gap-3">
                    {budgetOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setProfile((prev) => ({ ...prev, budget: option }))
                        }
                        className={`rounded-[16px] border px-4 py-4 text-[15px] capitalize transition-colors ${chip(
                          profile.budget === option,
                        )}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-3 text-[14px] font-medium">Who are you traveling with?</div>
                  <div className="flex flex-wrap gap-3">
                    {groupOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setProfile((prev) => ({ ...prev, group_type: option }))
                        }
                        className={`rounded-[999px] border px-4 py-3 text-[15px] capitalize transition-colors ${chip(
                          profile.group_type === option,
                        )}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-3 text-[14px] font-medium">Interests</div>
                  <div className="flex flex-wrap gap-3">
                    {interestOptions.map((interest) => {
                      const active = profile.interests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() =>
                            setProfile((prev) => ({
                              ...prev,
                              interests: active
                                ? prev.interests.filter((item) => item !== interest)
                                : [...prev.interests, interest].slice(0, 6),
                            }))
                          }
                          className={`rounded-[999px] border px-4 py-3 text-[15px] capitalize transition-colors ${chip(
                            active,
                          )}`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="block">
                  <div className="mb-2 text-[14px] font-medium">
                    Dream destination to try first
                  </div>
                  <input
                    value={destinationHint}
                    onChange={(e) => setDestinationHint(e.target.value)}
                    placeholder="Tokyo"
                    className="w-full rounded-[16px] border border-[color:rgba(122,85,68,0.28)] bg-[color:var(--color-cream)] px-4 py-4 text-[16px] text-[color:var(--color-ink)] outline-none placeholder:text-[color:rgba(61,43,31,0.48)] focus:border-[color:var(--color-coffee)] focus:ring-4 focus:ring-[color:rgba(122,85,68,0.12)]"
                  />
                </label>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep("signup")}
                    className="h-12 rounded-[14px] px-6 text-[13px]"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => onComplete({ account, profile })}
                    disabled={!canFinish}
                    className="h-12 rounded-[14px] px-6 text-[13px]"
                  >
                    Enter map workspace
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

