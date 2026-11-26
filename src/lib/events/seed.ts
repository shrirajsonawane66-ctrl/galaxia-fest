import { slugify, type EventRecord } from "./types";

type SeedItem = [
  name: string,
  tagline: string,
  category: string,
  imageUrl?: string,
  imageAlt?: string,
];

const DAY_ONE = "2026-12-17";
const DAY_TWO = "2026-12-18";

const dayOne: SeedItem[] = [
  ["Elocution", "", "Cultural"],
  ["FF (Final Zone Arena)", "Final Zone Arena", "Gaming"],
  ["Mehndi (Starlit Hands)", "Starlit Hands", "Cultural"],
  ["Dance – Solo", "", "Dance", "/solo%20dance.jpg", "Solo dance performance"],
  ["Dance – Group", "", "Dance", "/group%20dance.jpg", "Group dance performance"],
  ["Ramp Walk (Face of Galaxia)", "Face of Galaxia", "Cultural", "/ramp%20walk.jpg", "Ramp walk contestants"],
  ["Box Cricket (Boundary Breakers)", "Boundary Breakers", "Sports", "/box%20cricket.jpg", "Box cricket match"],
  ["Carrom (Orbit Strike)", "Orbit Strike", "Sports", "/carrom.jpg", "Carrom board"],
  ["Body Posing", "", "Cultural", "/body%20posing.jpg", "Body posing performance"],
  ["Stalk the Stock", "", "Tech", "/stock%20the%20shock.jpg", "Stock market challenge"],
  ["Case Toh Banta Hai", "", "Tech", "/case%20tho%20banta%20hai.jpg", "Case competition"],
];

const dayTwo: SeedItem[] = [
  ["Debate (Clash of Minds)", "Clash of Minds", "Cultural", "/debate.jpg", "Debate competition"],
  ["Party Makeup (Infinite Glam)", "Infinite Glam", "Cultural", "/party%20make%20up.jpg", "Party makeup artists"],
  ["Singing (Echo of Orbit)", "Echo of Orbit", "Music", "/singing.jpg", "Singing performance"],
  ["Rap (Cosmic Cypher)", "Cosmic Cypher", "Music", "/Rap.jpg", "Rap performance"],
  ["Treasure Hunt (Unlock the Infinity)", "Unlock the Infinity", "Adventure"],
  ["Volleyball (Male)", "Male", "Sports", "/vollyball%20male.jpg", "Men's volleyball match"],
  ["Volleyball (Female)", "Female", "Sports", "/vollyball%20femail.jpg", "Women's volleyball match"],
  ["BGMI (Space Battle)", "Space Battle", "Gaming", "/bgmi.jpg", "BGMI gaming tournament"],
  ["Into the Adverse", "", "Adventure", "/into%20the%20advise.jpg", "Adventure challenge"],
  ["Bizz-War", "", "Tech", "/bizz%20words.jpg", "Business war competition"],
];

const now = "2026-01-01T00:00:00.000Z";

function makeEvents(items: SeedItem[], date: string, day: 1 | 2, firstId: number): EventRecord[] {
  return items.map(([name, tagline, category, imageUrl, imageAlt], index) => ({
    id: `00000000-0000-4000-8000-${String(firstId + index).padStart(12, "0")}`,
    slug: `${date}-${slugify(name)}`,
    heading: `Day ${day}`,
    description: tagline
      ? `${tagline}.`
      : `Part of Day ${day} at Galaxia i-Fest.`,
    date,
    startTime: "00:00",
    dateTbd: true,
    imageUrl,
    imageAlt: imageAlt || name,
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
