type EventLinkSeed = {
  whatsappUrl: string;
  formUrl: string;
  replaces?: string[];
  rules?: string[];
};

const form = (id: number) =>
  `https://ves-admin.learnqoch.com/eventform/${btoa(
    JSON.stringify({ formId: id, tenantId: 3 })
  )}`;

const wa = (code: string) =>
  `https://chat.whatsapp.com/${code}?s=qt&p=i&mlu=4&ilr=4&iam=2`;

const eventLinks: Record<string, EventLinkSeed> = {
  elocution: {
    whatsappUrl: wa("KbhQpRF3wFNClJWFu9KPZl"),
    formUrl: form(26),
  },
  "ff-final-zone-arena": {
    whatsappUrl: wa("JvUiz9gX6E5EAoFA3G9mfi"),
    formUrl: form(27),
    replaces: ["https://chat.whatsapp.com/JvUiz9gX6E5EAoFA3G9mfi"],
  },
  mehndi: {
    whatsappUrl: wa("KZFyGt6qKCNJK2cy19Go41"),
    formUrl: form(28),
    replaces: ["https://chat.whatsapp.com/KZFyGt6qKCNJK2cy19Go41"],
  },
  "dance-solo": {
    whatsappUrl: wa("KULDg4U0Lqp2Jr5S16cbTh"),
    formUrl: form(29),
    replaces: ["https://chat.whatsapp.com/KULDg4U0Lqp2Jr5S16cbTh"],
  },
  "dance-group": {
    whatsappUrl: wa("CxHt2lJT8Yr3iPE5B2w6tq"),
    formUrl: form(30),
    replaces: ["https://chat.whatsapp.com/CxHt2lJT8Yr3iPE5B2w6tq"],
  },
  "box-cricket": {
    whatsappUrl: wa("GoWj1wgz5YJEWgpPaNb2an"),
    formUrl: form(31),
    replaces: ["https://chat.whatsapp.com/GoWj1wgz5YJEWgpPaNb2an"],
  },
  carrom: {
    whatsappUrl: wa("LWdjh6gWPD57ZhARxiuo7C"),
    formUrl: form(32),
    replaces: ["https://chat.whatsapp.com/LWdjh6gWPD57ZhARxiuo7C"],
  },
  "into-the-adverse": {
    whatsappUrl: wa("IP0fNXq97q1HxwvZZfBepk"),
    formUrl: form(41),
    replaces: ["https://chat.whatsapp.com/IP0fNXq97q1HxwvZZfBepk"],
  },
  "stalk-the-stock": {
    whatsappUrl: wa("J3cN9CFQCjXLHajFg9bvII"),
    formUrl: form(43),
  },
  "case-toh-banta-hai": {
    whatsappUrl: wa("CwUoMqlgLRPAp8cIbs789E"),
    formUrl: form(44),
    replaces: ["https://chat.whatsapp.com/CwUoMqlgLRPAp8cIbs789E"],
  },
  football: {
    whatsappUrl: wa("DaUtVlm7PCFEfH7nAyUEfg"),
    formUrl: form(49),
    rules: [
      "A team must have 11 players, including a goalkeeper.",
      "Matches are played as per the tournament bracket decided by the organisers.",
      "Only bonafide college students with a valid ID card are allowed.",
      "The referee's decision is final. Arguing with the referee may lead to disqualification.",
      "Bring your own kit. The venue and match schedule will be shared in the WhatsApp group.",
    ],
  },
  debate: {
    whatsappUrl: wa("DB9hmaW77sSJKNXxsJeYjY"),
    formUrl: form(33),
  },
  "party-makeup": {
    whatsappUrl: wa("Ech2uSiCQzDJpPqYxVKxjY"),
    formUrl: form(34),
    replaces: ["https://chat.whatsapp.com/Ech2uSiCQzDJpPqYxVKxjY"],
  },
  singing: {
    whatsappUrl: wa("KFQ1LdHAcHh23DN78WwjT3"),
    formUrl: form(35),
    replaces: ["https://chat.whatsapp.com/KFQ1LdHAcHh23DN78WwjT3"],
  },
  rap: {
    whatsappUrl: wa("D8oBzPb5gnTBl25Pp6Xm8Y"),
    formUrl: form(36),
    replaces: ["https://chat.whatsapp.com/D8oBzPb5gnTBl25Pp6Xm8Y"],
  },
  "treasure-hunt": {
    whatsappUrl: wa("LBK0Q6i6dbQ17yeTabpW3v"),
    formUrl: form(37),
    rules: [
      "Each team must have 4 to 6 members.",
      "The hunt takes place across the campus. Teams must stay within campus boundaries.",
      "Clues must be solved in the given order, and each clue leads to the next location.",
      "Teams must report to the finishing point before the deadline announced at the venue.",
      "Any unsafe behaviour, misuse of campus property, or rule violation may lead to disqualification.",
    ],
  },
  "bgmi": {
    whatsappUrl: wa("FwBRyZgTjowAyDwFCIuajn"),
    formUrl: form(38),
    replaces: ["https://chat.whatsapp.com/FwBRyZgTjowAyDwFCIuajn"],
  },
  "ramp-walk": {
    whatsappUrl: wa("Hj9KpfJbwU8IzNFHI4SHjk"),
    formUrl: form(39),
  },
  "body-posing": {
    whatsappUrl: wa("LJukQmm5exR7XZb1eDLsO6"),
    formUrl: form(40),
    replaces: ["https://chat.whatsapp.com/LJukQmm5exR7XZb1eDLsO6"],
  },
  "bizz-war": {
    whatsappUrl: wa("LlDgpiBb9BNL7Fcz8tmTpe"),
    formUrl: form(45),
    replaces: ["https://chat.whatsapp.com/LlDgpiBb9BNL7Fcz8tmTpe"],
  },
  "brand-battle": {
    whatsappUrl: wa("Cgyxax9Gmh3K78X7zyKz5P"),
    formUrl: form(46),
  },
  "sale-star": {
    whatsappUrl: wa("K1uasTNzlyj795o96wgu3e"),
    formUrl: form(42),
  },
  volleyball: {
    whatsappUrl: wa("I1qMuZRzFumK2p22SkEfhV"),
    formUrl: form(48),
    replaces: ["https://chat.whatsapp.com/DjFOJkSEfDFJHKeT4ld8sX"],
  },
  chess: {
    whatsappUrl: wa("BxTboS0mi8c42xpTDQfAf2"),
    formUrl: form(47),
    rules: [
      "Knockout format.",
      "When time is over, the winner is decided by points.",
      "Players must move a piece after touching it.",
      "Boys and girls play separately.",
      "Changes in rules, schedule, or draws are at the discretion of the WCCBM sports committee.",
    ],
  },
};

const aliases: Record<string, string> = {
  "mehndi-starlit-hands": "mehndi",
  "ff-final-zone-arena": "ff-final-zone-arena",
  "box-cricket-boundary-breakers": "box-cricket",
  "carrom-orbit-strike": "carrom",
  "ramp-walk-face-of-galaxia": "ramp-walk",
  "body-posing-titans-of-anantara-or-galaxia": "body-posing",
  "football-astro-legends": "football",
  "debate-clash-of-minds": "debate",
  "party-makeup-infinite-glam": "party-makeup",
  "singing-echo-of-orbit": "singing",
  "rap-cosmic-cypher": "rap",
  "treasure-hunt-unlock-the-infinity": "treasure-hunt",
  "treasure-hunt-unlock-the-infinity-chess": "treasure-hunt",
  "bgmi-space-battle": "bgmi",
  "volleyball-male": "volleyball",
  "volleyball-female": "volleyball",
  "volleyball-cosmic-smashes": "volleyball",
  "chess-mind-master": "chess",
};

export function normalizeEventTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function linkKeyForTitle(title: string): string | null {
  const key = normalizeEventTitle(title);
  const resolved = aliases[key] ?? key;
  return eventLinks[resolved] ? resolved : null;
}

/**
 * Backfills the authoritative 2026 WhatsApp and registration links on records
 * that predate them. Custom links set later in admin are left untouched.
 */
export function apply2026Links<
  T extends {
    title: string;
    eventName?: string;
    whatsappUrl: string | null;
    formUrl?: string | null;
    rules: string[];
  },
>(event: T): T {
  const key = linkKeyForTitle(event.title || event.eventName || "");
  if (!key) return event;

  const seed = eventLinks[key];
  const currentWhatsapp = event.whatsappUrl;
  const whatsappUrl =
    !currentWhatsapp || seed.replaces?.includes(currentWhatsapp)
      ? seed.whatsappUrl
      : currentWhatsapp;

  return {
    ...event,
    whatsappUrl,
    formUrl: event.formUrl || seed.formUrl,
    rules: event.rules.length > 0 ? event.rules : (seed.rules ?? []),
  };
}
