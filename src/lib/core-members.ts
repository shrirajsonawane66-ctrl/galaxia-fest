export type CoreMemberSocials = {
  instagram?: string;
  linkedin?: string;
};

export type CoreMember = {
  slug: string;
  name: string;
  role: string;
  bio: string;
  /** Public path to the portrait, e.g. /images/core/abdul-hannan-hanwari.webp */
  image: string;
  /** CSS object-position used when the portrait is cropped by the card. */
  focalPoint?: string;
  /** Head Boy and Head Girl are rendered in the featured row. */
  featured?: boolean;
  socials?: CoreMemberSocials;
};

/**
 * Source of truth: core/Galaxia core member - Google Docs (1).pdf.
 * Bios are verbatim from the PDF, with only these edits:
 *   - Samiksha Sawant: added the missing final full stop.
 *   - Aditya Nikam: "specials" -> "special." and "Galaxia i Fest" -> "Galaxia i-Fest".
 */
export const coreMembers: CoreMember[] = [
  {
    slug: "abdul-hannan-hanwari",
    name: "Abdul Hannan Hanwari",
    role: "Head Boy",
    bio: "Being the Head of Galaxia i-Fest is honestly a big responsibility and an exciting experience at the same time. It's not just about organising a fest, but about bringing people together, managing a team, handling challenges, and making sure everyone's efforts turn into something memorable. There’s a lot that happens behind the scenes, but that's what makes the journey special. For me, Galaxia i-Fest is not just an event; it's about teamwork, leadership, and creating something that everyone can be proud of.",
    image: "/images/core/abdul-hannan-hanwari.webp",
    focalPoint: "50% 20%",
    featured: true,
  },
  {
    slug: "samiksha-sawant",
    name: "Samiksha Sawant",
    role: "Head Girl",
    bio: "Being the Head of Galaxia i-Fest 2026–27 is both an honour and a responsibility. It’s about turning ideas into reality, bringing people together, and leading a team towards something extraordinary. For me, Galaxia i-Fest is not just a fest; it’s a journey of growth, teamwork, and creating memories that last a lifetime.",
    image: "/images/core/samiksha-sawant.webp",
    focalPoint: "50% 15%",
    featured: true,
  },
  {
    slug: "avantika-vishwakarma",
    name: "Avantika Vishwakarma",
    role: "Decoration Head",
    bio: "Galaxia i-Fest is not just a fest; it’s an emotion, a journey, and a collection of unforgettable memories. Being a part of Galaxia i-Fest has taught me the value of teamwork, creativity, leadership, and dedication. From planning to execution, every moment has been a new experience, and every challenge has brought us closer as a team. Proud to be a part of something that brings so much energy, talent, and life together. Galaxia i-Fest — Where possibilities never end!",
    image: "/images/core/avantika-vishwakarma.webp",
    focalPoint: "50% 20%",
  },
  {
    slug: "suman-choudhary",
    name: "Suman Choudhary",
    role: "Hospitality Head",
    bio: "Galaxia i-Fest is more than just a fest; it’s the people, the energy, and the little moments that make it unforgettable. As the Head of Hospitality, I’m here to make sure the experience feels just as special behind the scenes as it does in the spotlight.",
    image: "/images/core/suman-choudhary.webp",
    focalPoint: "50% 15%",
  },
  {
    slug: "bharti-sikakolu",
    name: "Bharti Sikakolu",
    role: "Finance Head",
    bio: "My experience at Galaxia i-Fest was truly memorable and enriching. It allowed me to learn new things, take on responsibilities, work with a team, and improve my skills. Every challenge taught me something valuable and helped me grow in confidence. The teamwork, dedication, and unforgettable moments made this journey special. I am grateful to have been a part of Galaxia i-Fest, and it will always remain a valuable and beautiful memory of my college life.",
    image: "/images/core/bharti-sikakolu.webp",
    focalPoint: "50% 20%",
  },
  {
    slug: "chinmay-sawant",
    name: "Chinmay Sawant",
    role: "Marketing & Sales Head",
    bio: "Being the Head of Marketing and Sales for Galaxia i-Fest is all about building connections, bringing in opportunities, and making sure our fest reaches the right audience. From approaching brands and sponsors to promoting our events, every step plays an important role in making Galaxia i-Fest a success. It's not just about marketing or sales, but about communication, strategy, and teamwork. We aim to make Galaxia bigger, better, and an unforgettable experience for everyone.",
    image: "/images/core/chinmay-sawant.webp",
    focalPoint: "50% 15%",
  },
  {
    slug: "swastik-jadhav",
    name: "Swastik Jadhav",
    role: "Media & Logistics Head",
    // TODO(content): replace with a personal bio
    bio: "Galaxia i-Fest is a vibrant college festival organized by WCCBM, IIBM & DMTIMS. Sanpada, Navi Mumbai. The event brings together students to showcase their talents, creativity, and competitive spirit through exciting activities, gaming tournaments, cultural performances, fashion shows, music, dance, and entertainment. Galaxia i-Fest aims to provide a dynamic platform for students to express themselves, connect with others, and create unforgettable college memories.",
    image: "/images/core/swastik-jadhav.webp",
    focalPoint: "50% 20%",
  },
  {
    slug: "kundan-kinkar",
    name: "Kundan Kinkar",
    role: "Sponsorship Head",
    bio: "Being a part of Galaxia i-Fest 2026–27 is an incredible journey of creativity, teamwork, and growth. It’s about turning ideas into experiences, bringing people together, and creating something that goes beyond just a college fest. For me, Galaxia i-Fest is about the memories we make, the challenges we overcome, and the legacy we leave behind.",
    image: "/images/core/kundan-kinkar.webp",
    focalPoint: "50% 20%",
  },
  {
    slug: "mayuresh-m-parab",
    name: "Mayuresh M Parab",
    role: "Event Head",
    bio: "Being the Event Head of Galaxia i-Fest is all about turning ideas into reality. From planning events to coordinating with different teams and handling last-minute challenges, a lot happens behind the scenes. It's a journey that teaches you teamwork, patience, and leadership. Our goal is to make sure every event is not just well-organised but also an experience that people remember. Galaxia i-Fest is all about creating memories, and I'm excited to be a part of this journey.",
    image: "/images/core/mayuresh-m-parab.webp",
    focalPoint: "50% 20%",
  },
  {
    slug: "aditya-nikam",
    name: "Aditya Nikam",
    role: "Creative & Design Head",
    bio: "For me, Galaxia i-Fest has always been more than just a fest. It’s a place where ideas turn into reality, creativity has no limits, and people come together to create something bigger than themselves. Being a part of the team, working on content, social media, and production, has given me a whole new perspective on how much thought, effort, and passion go into making everything come together. What people see on the final day is just a small part of the work that happens behind the scenes, and being a part of that journey is something I genuinely value. Galaxia i-Fest is not just about the event itself, but the people, the memories, and the experiences that make it special.",
    image: "/images/core/aditya-nikam.webp",
    focalPoint: "50% 20%",
  },
  {
    slug: "kanishk-gaokar",
    name: "Kanishk Gaokar",
    role: "Creative & Design Head",
    bio: "Galaxia i-Fest was a whole different experience! Being the creative and design head gave me the chance to experiment with ideas, take on new challenges, and see everything come together during the fest. There was a lot happening behind the scenes, but seeing all the efforts turn into something this big made it worth it. Definitely an experience I'll look back on with a lot of good memories!",
    image: "/images/core/kanishk-gaokar.webp",
    focalPoint: "50% 20%",
  },
  {
    slug: "yash-gawand",
    name: "Yash Gawand",
    role: "Student Co-ordinator",
    bio: "Being a part of Galaxia i-Fest has been a truly rewarding experience. Last year, I got the opportunity to introduce and host 5 new events with my team, which made the experience even more special for us. Seeing those ideas come to life and being part of making them happen is something we will always be proud of. This year, I’m excited to build on that experience, continue those events, and create even more memorable moments with the team. Looking forward to another great year with the Galaxia team!",
    image: "/images/core/yash-gawand.webp",
    focalPoint: "50% 20%",
  },
];

export const featuredCoreMembers = coreMembers.filter((member) => member.featured);
export const remainingCoreMembers = coreMembers.filter((member) => !member.featured);
