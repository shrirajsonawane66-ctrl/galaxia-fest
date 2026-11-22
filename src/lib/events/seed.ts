import { slugify, type EventRecord } from "./types";

type SeedItem = [name: string, tagline: string, category: string];

const DAY_ONE = "2025-12-19";
const DAY_TWO = "2025-12-20";

const dayOne: SeedItem[] = [
  ["Elocution", "", "Cultural"],
  ["FF (Final Zone Arena)", "Final Zone Arena", "Gaming"],
  ["Mehndi (Starlit Hands)", "Starlit Hands", "Cultural"],
  ["Dance – Solo", "", "Dance"],
  ["Dance – Group", "", "Dance"],
  ["Ramp Walk (Face of Galaxia)", "Face of Galaxia", "Cultural"],
  ["Box Cricket (Boundary Breakers)", "Boundary Breakers", "Sports"],
  ["Carrom (Orbit Strike)", "Orbit Strike", "Sports"],
  ["Body Posing", "", "Cultural"],
  ["Stalk the Stock", "", "Tech"],
  ["Case Toh Banta Hai", "", "Tech"],
];

const dayTwo: SeedItem[] = [
  ["Debate (Clash of Minds)", "Clash of Minds", "Cultural"],
  ["Party Makeup (Infinite Glam)", "Infinite Glam", "Cultural"],
  ["Singing (Echo of Orbit)", "Echo of Orbit", "Music"],
  ["Rap (Cosmic Cypher)", "Cosmic Cypher", "Music"],
  ["Treasure Hunt (Unlock the Infinity)", "Unlock the Infinity", "Adventure"],
  ["Volleyball (Male)", "Male", "Sports"],
  ["Volleyball (Female)", "Female", "Sports"],
  ["BGMI (Space Battle)", "Space Battle", "Gaming"],
  ["Into the Adverse", "", "Adventure"],
  ["Bizz-War", "", "Tech"],
];

const now = "2025-11-01T00:00:00.000Z";

function makeEvents(items: SeedItem[], date: string, day: 1 | 2, firstId: number): EventRecord[] {
  return items.map(([name, tagline, category], index) => ({
    id: `00000000-0000-4000-8000-${String(firstId + index).padStart(12, "0")}`,
    slug: `${date}-${slugify(name)}`,
    heading: `Day ${day}`,
    description: tagline
      ? `${tagline}.`
      : `Part of Day ${day} at Galaxia i-Fest.`,
    date,
    startTime: "00:00",
    dateTbd: true,
    eventName: name,
    location: "Venue to be announced",
    category,
    actionType: "none",
    status: "published",
    featured: false,
    sortOrder: index + 1,
    createdAt: now,
    updatedAt: now,
  }));
}

export const sampleEvents: EventRecord[] = [
  ...makeEvents(dayOne, DAY_ONE, 1, 1),
  ...makeEvents(dayTwo, DAY_TWO, 2, 101),
];
