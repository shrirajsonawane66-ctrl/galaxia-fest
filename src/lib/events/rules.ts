export const UNANNOUNCED_RULES_MESSAGE = "Event rules will be announced soon.";

export interface EventRulesEntry {
  id: string;
  slug: string;
  eventName: string;
  subtitle: string;
  day: "Day 1" | "Day 2";
  rules: string[];
}

export const EVENT_RULES: EventRulesEntry[] = [
  {
    id: "day-1-elocution",
    slug: "2026-12-17-elocution",
    eventName: "Elocution",
    subtitle: "Speak to the Stars",
    day: "Day 1",
    rules: [
      "Individual participation only. No group entries.",
      "Each participant must speak about the theme.",
      "Content must be original, meaningful and relevant.",
      "Vulgar, abusive, offensive, political or discriminatory content is prohibited.",
      "Plagiarism or reading directly from a script will result in disqualification.",
      "Memorization is required. No reading or prompting allowed.",
      "Formal/decent attire is mandatory.",
      "Report 20 minutes before the event starts.",
      "Participants must register before the deadline.",
      "No objections or appeals will be entertained.",
      "Maintain decorum. Cheering or disturbance during speeches is not allowed.",
    ],
  },
  {
    id: "day-1-ff",
    slug: "2026-12-17-ff-final-zone-arena",
    eventName: "FF (Final Zone Arena)",
    subtitle: "Final Zone Arena",
    day: "Day 1",
    rules: [
      "Each team must have 4+1 players.",
      "Each team must have a team name.",
      "Teaming up with students from other departments is strictly prohibited.",
      "Teams/squads must sit together.",
      "Only mobile phones are allowed. iPads, tablets and emulators are prohibited.",
      "Three matches will be played.",
      "Room ID and password will be provided before the match.",
      "Abusive language during the game is prohibited.",
      "Any player found cheating will result in team disqualification.",
      "At least two members must record their POV. Screenshots (SS) are mandatory.",
      "Point system: 1st — 12 points, 2nd — 9 points, 3rd — 8 points, 4th — 7 points, 5th — 6 points, 6th — 5 points, 7th — 4 points, 8th — 3 points.",
      "Per kill: 1 point.",
    ],
  },
  {
    id: "day-1-mehndi",
    slug: "2026-12-17-mehndi-starlit-hands",
    eventName: "Mehndi (Starlit Hands)",
    subtitle: "Starlit Hands",
    day: "Day 1",
    rules: [
      "Participants must usually bring their own natural mehndi cones/materials.",
      "Chemical colours, glitter, stickers and stencils are often prohibited.",
      "Designs must typically cover one hand, including the palm and back of the hand up to the elbow.",
      "Designs should be original and creative.",
      "Participants cannot refer to printed materials, phones or other references once the competition begins.",
      "Participants can apply mehndi on their own hand or on a model they bring.",
      "Breaking rules, using prohibited materials or excessive tardiness may lead to disqualification.",
      "Note: The original document uses words such as \"usually\", \"often\" and \"typically\". Confirm these conditions with the coordinator.",
    ],
  },
  {
    id: "day-1-dance-solo",
    slug: "2026-12-17-dance-solo",
    eventName: "Dance – Solo",
    subtitle: "Cosmic Choreography",
    day: "Day 1",
    rules: [
      "Participants must register before the deadline.",
      "Maximum performance time: 3 minutes.",
      "A buzzer will be given in the last 20 seconds.",
      "Audio quality must be 320 kbps or 256 kbps only.",
      "Audio format must be MP3.",
      "Audio must be submitted at least 3 days before the event.",
      "Last-minute audio changes are prohibited.",
      "Props are allowed but must be handled by the participant.",
      "Dangerous moves involving fire, glass, flips, etc. are strictly prohibited.",
    ],
  },
  {
    id: "day-1-dance-group",
    slug: "2026-12-17-dance-group",
    eventName: "Dance – Group",
    subtitle: "Cosmic Choreography",
    day: "Day 1",
    rules: [
      "Each team must consist of 4–6 members.",
      "Maximum performance time: 5 minutes.",
      "A buzzer will be given in the last 20 seconds.",
      "Audio quality must be 320 kbps or 256 kbps only.",
      "Audio format must be MP3.",
      "Audio must be submitted at least 3 days before the event.",
      "Last-minute audio changes are prohibited.",
      "Props are allowed but must be handled by participants.",
      "Dangerous moves involving fire, glass, flips, etc. are strictly prohibited.",
    ],
  },
  {
    id: "day-1-ramp-walk",
    slug: "2026-12-17-ramp-walk-face-of-galaxia",
    eventName: "Ramp Walk (Face of Galaxia)",
    subtitle: "Face of Galaxia",
    day: "Day 1",
    rules: [
      "Open to college teams of 8–10 members.",
      "Performance duration: 3 minutes.",
      "Teams are free to choose their own concept or style.",
      "Teams must bring their own MP3 music track.",
      "Costumes, choreography and presentation must be original and decent.",
      "Obscene gestures or inappropriate costumes will lead to disqualification.",
      "Props are allowed except hazardous items such as fire, water or glitter bombs.",
      "Teams must report 30 minutes before the event for registration and sound check.",
    ],
  },
  {
    id: "day-1-box-cricket",
    slug: "2026-12-17-box-cricket-boundary-breakers",
    eventName: "Box Cricket (Boundary Breakers)",
    subtitle: "Boundary Breakers",
    day: "Day 1",
    rules: [
      "Usually 7+1 players per side.",
      "Each innings consists of 4 overs (3–4 overs depending on time).",
      "No bowler can bowl more than one over.",
      "Batsmen retire upon scoring 20 runs.",
      "Retired batsmen can return only if all other batsmen are out.",
      "A soft tennis ball is used.",
      "Enclosed walls/nets are used for scoring.",
      "Specific back-wall boundaries count as 4s/6s.",
      "Standard underarm bowling is allowed.",
      "No-balls and wides award extra runs.",
      "Caught, bowled and run-out dismissals apply.",
      "LBW is usually not used.",
    ],
  },
  {
    id: "day-1-carrom",
    slug: "2026-12-17-carrom-orbit-strike",
    eventName: "Carrom (Orbit Strike)",
    subtitle: "Orbit Strike",
    day: "Day 1",
    rules: [
      "Objective is to pocket all your pieces and the queen first.",
      "Players continue striking as long as they legally pocket their own pieces.",
      "The turn passes on a miss or foul.",
      "The player with white pieces breaks first.",
      "Pieces are reset if none are pocketed on the first three attempts.",
      "The queen must be pocketed and covered by pocketing another piece in the next shot of the same turn.",
      "The queen must be covered before the last carrom man is pocketed.",
      "Use a finger flick while keeping your hand within your baseline.",
      "Pushing the striker is prohibited.",
      "Pocketing the striker, striking an opponent's last piece before covering the queen, or a piece leaving the board results in a foul.",
      "The opponent returns one of your pocketed pieces to the board.",
      "The player who legally pockets all their pieces first wins the board.",
      "Games are played to a set point total, such as 25, over multiple boards.",
      "Only one hand may be used.",
    ],
  },
  {
    id: "day-1-body-posing",
    slug: "2026-12-17-body-posing",
    eventName: "Body Posing",
    subtitle: "Titans of Anantara or Galaxia",
    day: "Day 1",
    rules: [
      "Participants must register before the deadline.",
      "Inappropriate behaviour or language on stage is prohibited.",
      "Use of performance-enhancing drugs or supplements against event policy leads to disqualification.",
      "Logos or distracting accessories are not allowed.",
    ],
  },
  {
    id: "day-1-stalk-the-stock",
    slug: "2026-12-17-stalk-the-stock",
    eventName: "Stalk the Stock",
    subtitle: "",
    day: "Day 1",
    rules: [UNANNOUNCED_RULES_MESSAGE],
  },
  {
    id: "day-1-case-toh-banta-hai",
    slug: "2026-12-17-case-toh-banta-hai",
    eventName: "Case Toh Banta Hai",
    subtitle: "",
    day: "Day 1",
    rules: [UNANNOUNCED_RULES_MESSAGE],
  },
  {
    id: "day-2-debate",
    slug: "2026-12-18-debate-clash-of-minds",
    eventName: "Debate (Clash of Minds)",
    subtitle: "Clash of Minds",
    day: "Day 2",
    rules: [
      "Teams are assigned as Proposition (for) or Opposition (against) a specific topic.",
      "Each speaker has a fixed time limit, for example 5–8 minutes.",
      "A timekeeper enforces the time limit.",
      "Speakers alternate between teams.",
      "Arguments must be logical, relevant and supported by evidence.",
      "Opposing teams can offer brief questions during main speeches.",
      "Speakers may accept or decline questions.",
      "Formal and respectful language must be maintained.",
      "Personal attacks are prohibited.",
      "Final reply speeches must summarize the debate and must not introduce new arguments.",
    ],
  },
  {
    id: "day-2-party-makeup",
    slug: "2026-12-18-party-makeup-infinite-glam",
    eventName: "Party Makeup (Infinite Glam)",
    subtitle: "Infinite Glam",
    day: "Day 2",
    rules: [
      "Participants must report at the venue at least 20 minutes before the event.",
      "The painting must adhere to the given theme.",
      "Originality and creativity are highly encouraged.",
      "Plagiarism or copying designs may lead to disqualification.",
      "Participants must bring their own makeup tools, products and materials, including brushes, dotting tools, glitters, stickers and rhinestones.",
    ],
  },
  {
    id: "day-2-singing",
    slug: "2026-12-18-singing-echo-of-orbit",
    eventName: "Singing (Echo of Orbit)",
    subtitle: "Echo of Orbit",
    day: "Day 2",
    rules: [
      "Participants must register before the deadline.",
      "Performance duration: 2–3 minutes.",
      "A buzzer will be given in the last 20 seconds.",
      "Audio quality must be 320 kbps or 256 kbps only, if audio is used.",
      "Prior notice is required for using instruments such as guitar, tabla, dhol or keyboard.",
      "Audio must be submitted at least 3 days before the event.",
      "Last-minute audio changes are prohibited.",
    ],
  },
  {
    id: "day-2-rap",
    slug: "2026-12-18-rap-cosmic-cypher",
    eventName: "Rap (Cosmic Cypher)",
    subtitle: "Cosmic Cypher",
    day: "Day 2",
    rules: [
      "Participants must register before the deadline.",
      "Performance duration: 2–3 minutes.",
      "A buzzer will be given in the last 20 seconds.",
      "Audio quality must be 320 kbps or 256 kbps only, if audio is used.",
      "Participants may perform with a pre-recorded instrumental/beat or a cappella (without background music).",
      "Audio must be submitted at least 3 days before the event.",
      "Last-minute audio changes are prohibited.",
    ],
  },
  {
    id: "day-2-treasure-hunt",
    slug: "2026-12-18-treasure-hunt-unlock-the-infinity",
    eventName: "Treasure Hunt (Unlock the Infinity)",
    subtitle: "Unlock the Infinity",
    day: "Day 2",
    rules: [UNANNOUNCED_RULES_MESSAGE],
  },
  {
    id: "day-2-volleyball-male",
    slug: "2026-12-18-volleyball-male",
    eventName: "Volleyball (Male)",
    subtitle: "Gravity Smash",
    day: "Day 2",
    rules: [UNANNOUNCED_RULES_MESSAGE],
  },
  {
    id: "day-2-volleyball-female",
    slug: "2026-12-18-volleyball-female",
    eventName: "Volleyball (Female)",
    subtitle: "Gravity Smash",
    day: "Day 2",
    rules: [UNANNOUNCED_RULES_MESSAGE],
  },
  {
    id: "day-2-bgmi",
    slug: "2026-12-18-bgmi-space-battle",
    eventName: "BGMI (Space Battle)",
    subtitle: "Space Battle",
    day: "Day 2",
    rules: [
      "Each team must have 4+1 players.",
      "Each team must have a team name.",
      "Teaming up with students from other departments is strictly prohibited.",
      "Teams/squads must sit together.",
      "Only mobile phones are allowed. iPads, tablets and emulators are prohibited.",
      "Three matches will be played.",
      "Room ID and password will be provided before the match.",
      "Abusive language during the game is prohibited.",
      "Any player found cheating will result in team disqualification.",
      "At least two members must record their POV. Screenshots are mandatory.",
      "Point system: 1st — 12 points, 2nd — 9 points, 3rd — 8 points, 4th — 7 points, 5th — 6 points, 6th — 5 points, 7th — 4 points, 8th — 3 points.",
      "Per kill: 1 point.",
    ],
  },
  {
    id: "day-2-into-the-adverse",
    slug: "2026-12-18-into-the-adverse",
    eventName: "Into the Adverse",
    subtitle: "",
    day: "Day 2",
    rules: [UNANNOUNCED_RULES_MESSAGE],
  },
  {
    id: "day-2-bizz-war",
    slug: "2026-12-18-bizz-war",
    eventName: "Bizz-War",
    subtitle: "",
    day: "Day 2",
    rules: [UNANNOUNCED_RULES_MESSAGE],
  },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const rulesBySlug = new Map(EVENT_RULES.map((entry) => [entry.slug, entry]));
const rulesByName = new Map(
  EVENT_RULES.flatMap((entry) => [
    [normalize(entry.eventName), entry] as const,
    [normalize(`${entry.eventName} ${entry.subtitle}`), entry] as const,
  ])
);

export function findEventRules(event: {
  slug?: string;
  eventName?: string;
}): EventRulesEntry | undefined {
  if (event.slug) {
    const bySlug = rulesBySlug.get(event.slug);
    if (bySlug) return bySlug;
  }
  if (!event.eventName) return undefined;
  return rulesByName.get(normalize(event.eventName));
}
