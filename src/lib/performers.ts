export interface Performer {
  id: string;
  name: string;
  year: number; // Galaxia edition year
  role: string; // e.g. "Headliner", "DJ", "Band", "Comedian"
  image: string; // path like /images/performers/firstname-lastname.jpg ("" shows an initials placeholder)
}

// TODO: replace with real performers
export const seedPerformers: Performer[] = Array.from({ length: 12 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return {
    id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    name: `Performer ${n}`,
    year: 2025,
    role: "Artist",
    image: "",
  };
});
