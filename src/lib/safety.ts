export type Category = "checkpoint" | "presence" | "detention" | "courthouse" | "workplace" | "other";

export type Report = {
  id: string;
  lat: number;
  lng: number;
  category: Category;
  note: string;
  created_at: string;
  expires_at: string;
  confirmations: number;
};

export const EXPIRY_HOURS = 4;
export const NOTE_MAX = 240;

export const categories: { key: Category; label: string; tone: "bad" | "warn" | "accent" | "muted" }[] = [
  { key: "presence", label: "Agents or marked vehicles present", tone: "accent" },
  { key: "checkpoint", label: "Checkpoint or roadblock", tone: "warn" },
  { key: "detention", label: "Detention or arrest observed", tone: "bad" },
  { key: "courthouse", label: "Courthouse activity", tone: "warn" },
  { key: "workplace", label: "Workplace or business visit", tone: "warn" },
  { key: "other", label: "Other", tone: "muted" },
];

export const categoryColor: Record<Category, string> = {
  presence: "#8785ff",
  checkpoint: "#e9c46a",
  detention: "#f28c8c",
  courthouse: "#e9c46a",
  workplace: "#e9c46a",
  other: "#8c8c99",
};

export function categoryLabel(c: Category) {
  return categories.find((x) => x.key === c)?.label ?? "Other";
}

export function isCategory(v: unknown): v is Category {
  return typeof v === "string" && categories.some((c) => c.key === v);
}

/** Round to ~100 m so we never store a precise position. */
export function roundCoord(n: number) {
  return Math.round(n * 1000) / 1000;
}

const PLATE = /\b(?=[A-Z0-9-]{5,9}\b)(?=[A-Z0-9-]*\d)(?=[A-Z0-9-]*[A-Z])[A-Z0-9-]+\b/;
const PHONE = /(\+?\d[\d\s().-]{7,}\d)/;
const EMAIL = /\S+@\S+\.\S+/;
const URL = /(https?:\/\/|www\.)\S+/i;
const HANDLE = /(^|\s)@\w{2,}/;

/** Returns an error message when the note likely identifies a person or vehicle, else null. */
export function noteProblem(note: string): string | null {
  const t = note.trim();
  if (t.length > NOTE_MAX) return `Keep the note under ${NOTE_MAX} characters.`;
  if (PLATE.test(t.toUpperCase())) return "That looks like a license plate. Describe the vehicle, not the plate.";
  if (PHONE.test(t)) return "Leave phone numbers out of the note.";
  if (EMAIL.test(t) || URL.test(t) || HANDLE.test(t)) return "Leave emails, links, and handles out of the note.";
  return null;
}

export type Metro = { name: string; lat: number; lng: number };

export const metros: Metro[] = [
  { name: "New York, NY", lat: 40.7128, lng: -74.006 },
  { name: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
  { name: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
  { name: "Houston, TX", lat: 29.7604, lng: -95.3698 },
  { name: "Phoenix, AZ", lat: 33.4484, lng: -112.074 },
  { name: "Philadelphia, PA", lat: 39.9526, lng: -75.1652 },
  { name: "San Antonio, TX", lat: 29.4241, lng: -98.4936 },
  { name: "San Diego, CA", lat: 32.7157, lng: -117.1611 },
  { name: "Dallas, TX", lat: 32.7767, lng: -96.797 },
  { name: "San Jose, CA", lat: 37.3382, lng: -121.8863 },
  { name: "Austin, TX", lat: 30.2672, lng: -97.7431 },
  { name: "Jacksonville, FL", lat: 30.3322, lng: -81.6557 },
  { name: "Fort Worth, TX", lat: 32.7555, lng: -97.3308 },
  { name: "Columbus, OH", lat: 39.9612, lng: -82.9988 },
  { name: "Charlotte, NC", lat: 35.2271, lng: -80.8431 },
  { name: "San Francisco, CA", lat: 37.7749, lng: -122.4194 },
  { name: "Indianapolis, IN", lat: 39.7684, lng: -86.1581 },
  { name: "Seattle, WA", lat: 47.6062, lng: -122.3321 },
  { name: "Denver, CO", lat: 39.7392, lng: -104.9903 },
  { name: "Washington, DC", lat: 38.9072, lng: -77.0369 },
  { name: "Boston, MA", lat: 42.3601, lng: -71.0589 },
  { name: "El Paso, TX", lat: 31.7619, lng: -106.485 },
  { name: "Nashville, TN", lat: 36.1627, lng: -86.7816 },
  { name: "Detroit, MI", lat: 42.3314, lng: -83.0458 },
  { name: "Oklahoma City, OK", lat: 35.4676, lng: -97.5164 },
  { name: "Portland, OR", lat: 45.5152, lng: -122.6784 },
  { name: "Las Vegas, NV", lat: 36.1699, lng: -115.1398 },
  { name: "Memphis, TN", lat: 35.1495, lng: -90.049 },
  { name: "Louisville, KY", lat: 38.2527, lng: -85.7585 },
  { name: "Baltimore, MD", lat: 39.2904, lng: -76.6122 },
  { name: "Milwaukee, WI", lat: 43.0389, lng: -87.9065 },
  { name: "Albuquerque, NM", lat: 35.0844, lng: -106.6504 },
  { name: "Tucson, AZ", lat: 32.2226, lng: -110.9747 },
  { name: "Fresno, CA", lat: 36.7378, lng: -119.7871 },
  { name: "Sacramento, CA", lat: 38.5816, lng: -121.4944 },
  { name: "Kansas City, MO", lat: 39.0997, lng: -94.5786 },
  { name: "Atlanta, GA", lat: 33.749, lng: -84.388 },
  { name: "Miami, FL", lat: 25.7617, lng: -80.1918 },
  { name: "Raleigh, NC", lat: 35.7796, lng: -78.6382 },
  { name: "Omaha, NE", lat: 41.2565, lng: -95.9345 },
  { name: "Minneapolis, MN", lat: 44.9778, lng: -93.265 },
  { name: "Tampa, FL", lat: 27.9506, lng: -82.4572 },
  { name: "Orlando, FL", lat: 28.5383, lng: -81.3792 },
  { name: "New Orleans, LA", lat: 29.9511, lng: -90.0715 },
  { name: "Cleveland, OH", lat: 41.4993, lng: -81.6944 },
  { name: "Pittsburgh, PA", lat: 40.4406, lng: -79.9959 },
  { name: "St. Louis, MO", lat: 38.627, lng: -90.1994 },
  { name: "Salt Lake City, UT", lat: 40.7608, lng: -111.891 },
  { name: "Cincinnati, OH", lat: 39.1031, lng: -84.512 },
  { name: "Oakland, CA", lat: 37.8044, lng: -122.2712 },
  { name: "Newark, NJ", lat: 40.7357, lng: -74.1724 },
  { name: "Providence, RI", lat: 41.824, lng: -71.4128 },
  { name: "Richmond, VA", lat: 37.5407, lng: -77.436 },
  { name: "Buffalo, NY", lat: 42.8864, lng: -78.8784 },
  { name: "Honolulu, HI", lat: 21.3069, lng: -157.8583 },
  { name: "Anchorage, AK", lat: 61.2181, lng: -149.9003 },
  { name: "Boise, ID", lat: 43.615, lng: -116.2023 },
  { name: "Des Moines, IA", lat: 41.5868, lng: -93.625 },
  { name: "Birmingham, AL", lat: 33.5186, lng: -86.8104 },
  { name: "Hartford, CT", lat: 41.7658, lng: -72.6734 },
  { name: "McAllen, TX", lat: 26.2034, lng: -98.23 },
  { name: "Laredo, TX", lat: 27.5306, lng: -99.4803 },
  { name: "Bakersfield, CA", lat: 35.3733, lng: -119.0187 },
  { name: "Riverside, CA", lat: 33.9806, lng: -117.3755 },
  { name: "Charleston, SC", lat: 32.7765, lng: -79.9311 },
  { name: "Greensboro, NC", lat: 36.0726, lng: -79.792 },
  { name: "Spokane, WA", lat: 47.6588, lng: -117.426 },
  { name: "Reno, NV", lat: 39.5296, lng: -119.8138 },
  { name: "Little Rock, AR", lat: 34.7465, lng: -92.2896 },
  { name: "Jackson, MS", lat: 32.2988, lng: -90.1848 },
];

export function nearestMetro(lat: number, lng: number): { metro: Metro; km: number } {
  let best = metros[0];
  let bestD = Infinity;
  for (const m of metros) {
    const d = haversine(lat, lng, m.lat, m.lng);
    if (d < bestD) {
      bestD = d;
      best = m;
    }
  }
  return { metro: best, km: bestD };
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function placeLabel(lat: number, lng: number) {
  const { metro, km } = nearestMetro(lat, lng);
  if (km < 25) return `Near ${metro.name}`;
  if (km < 120) return `${Math.round(km)} km from ${metro.name}`;
  return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
}
