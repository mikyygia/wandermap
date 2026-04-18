import { z } from "zod";

export const placeTypeSchema = z.enum([
  "food",
  "activity",
  "cafe",
  "nightlife",
  "landmark",
]);

export const placeSchema = z.object({
  name: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  description: z.string().min(1),
  type: placeTypeSchema,
  estimated_duration_minutes: z.number().int().min(15).max(12 * 60),
});

export const daySchema = z.object({
  day: z.number().int().min(1).max(3),
  theme: z.string().min(1),
  places: z.array(placeSchema).min(1).max(5),
});

export const itinerarySchema = z.object({
  title: z.string().min(1),
  destination: z.string().min(1),
  days: z.array(daySchema).min(1).max(3),
});

export type ItinerarySchema = z.infer<typeof itinerarySchema>;

