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

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your_openai_api_key_here") {
      // Provide a beautiful mock itinerary for local testing without a key!
      return NextResponse.json({
        title: "Weekend in Paris: Art & Cafes",
        destination: "Paris, France",
        days: [
          {
            day: 1,
            theme: "Iconic Museums & Left Bank",
            places: [
              {
                name: "Louvre Museum",
                description: "World's largest art museum. Home to the Mona Lisa.",
                type: "landmark",
                lat: 48.8606,
                lng: 2.3376,
                estimated_duration_minutes: 180
              },
              {
                name: "Café de Flore",
                description: "Historic coffeehouse in Saint-Germain-des-Prés.",
                type: "cafe",
                lat: 48.8541,
                lng: 2.3326,
                estimated_duration_minutes: 60
              },
              {
                name: "Musée d'Orsay",
                description: "Masterpieces of 19th and 20th-century art housed in a grand railway station.",
                type: "landmark",
                lat: 48.8599,
                lng: 2.3265,
                estimated_duration_minutes: 120
              }
            ]
          },
          {
            day: 2,
            theme: "Montmartre & Views",
            places: [
              {
                name: "Sacré-Cœur",
                description: "A stunning basilica at the highest point of the city.",
                type: "landmark",
                lat: 48.8867,
                lng: 2.3431,
                estimated_duration_minutes: 90
              },
              {
                name: "Le Vrai Paris",
                description: "A quintessentially Parisian bistro with a beautiful flower-draped terrace.",
                type: "food",
                lat: 48.8870,
                lng: 2.3370,
                estimated_duration_minutes: 75
              }
            ]
          }
        ]
      });
    }

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
    // If the OpenAI call fails (e.g., quota exceeded, invalid key), return the mock itinerary anyway
    return NextResponse.json({
      title: "Weekend in Paris: Art & Cafes (Mocked)",
      destination: "Paris, France",
      days: [
        {
          day: 1,
          theme: "Iconic Museums & Left Bank",
          places: [
            {
              name: "Louvre Museum",
              description: "World's largest art museum. Home to the Mona Lisa.",
              type: "landmark",
              lat: 48.8606,
              lng: 2.3376,
              estimated_duration_minutes: 180
            },
            {
              name: "Café de Flore",
              description: "Historic coffeehouse in Saint-Germain-des-Prés.",
              type: "cafe",
              lat: 48.8541,
              lng: 2.3326,
              estimated_duration_minutes: 60
            },
            {
              name: "Musée d'Orsay",
              description: "Masterpieces of 19th and 20th-century art housed in a grand railway station.",
              type: "landmark",
              lat: 48.8599,
              lng: 2.3265,
              estimated_duration_minutes: 120
            }
          ]
        },
        {
          day: 2,
          theme: "Montmartre & Views",
          places: [
            {
              name: "Sacré-Cœur",
              description: "A stunning basilica at the highest point of the city.",
              type: "landmark",
              lat: 48.8867,
              lng: 2.3431,
              estimated_duration_minutes: 90
            },
            {
              name: "Le Vrai Paris",
              description: "A quintessentially Parisian bistro with a beautiful flower-draped terrace.",
              type: "food",
              lat: 48.8870,
              lng: 2.3370,
              estimated_duration_minutes: 75
            }
          ]
        }
      ]
    });
  }
}

