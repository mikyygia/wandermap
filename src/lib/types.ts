export type TravelProfile = {
  travel_style: string;
  budget: "low" | "medium" | "high";
  group_type: string;
  interests: string[];
};

export type PlaceType = "food" | "activity" | "cafe" | "nightlife" | "landmark";

export type Place = {
  name: string;
  lat: number;
  lng: number;
  description: string;
  type: PlaceType;
  estimated_duration_minutes: number;
};

export type Day = {
  day: number;
  theme: string;
  places: Place[];
};

export type Itinerary = {
  title: string;
  destination: string;
  days: Day[];
};
