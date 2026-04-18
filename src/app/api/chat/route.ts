import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { itinerarySchema } from "@/lib/itinerarySchema";

export const runtime = "nodejs";

const requestSchema = z.object({
  travelProfile: z.object({
    travel_style: z.string(),
    budget: z.enum(["low", "medium", "high"]),
    group_type: z.string(),
    interests: z.array(z.string()).default([]),
  }),
  chatHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .default([]),
  latestMessage: z.string(),
});

const SYSTEM_PROMPT = `You are Wayfarer, an expert travel planning assistant.

You generate structured travel itineraries based on user preferences.

STRICT RULES:
- Output ONLY valid JSON
- No explanations or extra text
- Always include lat and lng
- Max 3 days
- Max 5 places per day
- Ensure geographic consistency`;

function coerceJsonOnly(raw: string) {
  // Hackathon robustness: some models may wrap JSON in whitespace or stray text.
  // We still enforce "JSON only" by extracting the first {...} block if needed.
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
}

export async function POST(req: Request) {
  try {
    const body = requestSchema.parse(await req.json());

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const userPrompt = `Travel Profile:
${JSON.stringify(body.travelProfile, null, 2)}

Chat History:
${body.chatHistory.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}

User Request:
${body.latestMessage}

Return a structured itinerary JSON.`;

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      temperature: 0.6,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const jsonText = coerceJsonOnly(raw);
    const parsed = JSON.parse(jsonText);
    const itinerary = itinerarySchema.parse(parsed);

    // Enforce day uniqueness + max constraints defensively.
    const uniqueDays = new Set(itinerary.days.map((d) => d.day));
    if (uniqueDays.size !== itinerary.days.length) {
      return NextResponse.json(
        { error: "Invalid itinerary: duplicate day numbers." },
        { status: 422 },
      );
    }

    return NextResponse.json(itinerary);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Unknown error generating itinerary.";
    return new NextResponse(message, { status: 500 });
  }
}

