/**
 * Curated event thumbnails already present in /public. Every seeded event has
 * a title-appropriate image; admin can override it on the edit form.
 */
export const EVENT_THUMBNAILS = [
  { src: "/Elocution.jpg", label: "Elocution" },
  { src: "/ff%20zone%20arena.jpg", label: "Final Zone Arena" },
  { src: "/menhindi.jpg", label: "Mehndi" },
  { src: "/solo%20dance.jpg", label: "Solo dance" },
  { src: "/group%20dance.jpg", label: "Group dance" },
  { src: "/ramp%20walk.jpg", label: "Ramp walk" },
  { src: "/box%20cricket.jpg", label: "Box cricket" },
  { src: "/carrom.jpg", label: "Carrom" },
  { src: "/vollyball%20male.jpg", label: "Team sport" },
  { src: "/vollyball%20femail.jpg", label: "Volleyball (women)" },
  { src: "/body%20posing.jpg", label: "Body posing" },
  { src: "/stock%20the%20shock.jpg", label: "Stalk the Stock" },
  { src: "/case%20tho%20banta%20hai.jpg", label: "Case / pitch" },
  { src: "/into%20the%20advise.jpg", label: "Into the Adverse" },
  { src: "/debate.jpg", label: "Debate" },
  { src: "/party%20make%20up.jpg", label: "Party makeup" },
  { src: "/singing.jpg", label: "Singing" },
  { src: "/Rap.jpg", label: "Rap" },
  { src: "/treasure%20hunt.jpg", label: "Treasure hunt" },
  { src: "/bgmi.jpg", label: "BGMI" },
  { src: "/bizz%20words.jpg", label: "Business battle" },
] as const;

/** Best available thumbnail for a title that has no stored image yet. */
export function thumbnailForTitle(title: string): string {
  const value = title.toLowerCase();
  if (value.includes("elocution")) return "/Elocution.jpg";
  if (value.includes("ff") || value.includes("final zone")) return "/ff%20zone%20arena.jpg";
  if (value.includes("mehndi")) return "/menhindi.jpg";
  if (value.includes("dance") && value.includes("group")) return "/group%20dance.jpg";
  if (value.includes("dance")) return "/solo%20dance.jpg";
  if (value.includes("ramp")) return "/ramp%20walk.jpg";
  if (value.includes("cricket")) return "/box%20cricket.jpg";
  if (value.includes("carrom") || value.includes("chess")) return "/carrom.jpg";
  if (value.includes("football") || value.includes("volleyball")) return "/vollyball%20male.jpg";
  if (value.includes("posing") || value.includes("physique")) return "/body%20posing.jpg";
  if (value.includes("stock")) return "/stock%20the%20shock.jpg";
  if (value.includes("case") || value.includes("sale star")) return "/case%20tho%20banta%20hai.jpg";
  if (value.includes("adverse")) return "/into%20the%20advise.jpg";
  if (value.includes("debate")) return "/debate.jpg";
  if (value.includes("makeup") || value.includes("make up")) return "/party%20make%20up.jpg";
  if (value.includes("sing")) return "/singing.jpg";
  if (value.includes("rap")) return "/Rap.jpg";
  if (value.includes("treasure")) return "/treasure%20hunt.jpg";
  if (value.includes("bgmi")) return "/bgmi.jpg";
  if (value.includes("brand") || value.includes("bizz")) return "/bizz%20words.jpg";
  return "/images/logo-trim.png";
}
