// Verify the production server serves fresh HTML + all chunks, and that the
// client hydrates without mismatches.
// usage: node scripts/verify-prod.mjs [baseUrl]
import { chromium } from "@playwright/test";

const base = process.argv[2] || "http://localhost:3000";
const routes = ["/", "/events", "/booking/success", "/admin/login"];
const targets = [
  ...routes.map((route) => ({ route, width: 390, height: 844 })),
  { route: "/", width: 1280, height: 800 },
];

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.log(`FAIL ${msg}`);
};

// 1. Raw HTML: make sure the new markup is what the server sends, and that
// every referenced static asset actually resolves.
for (const route of routes) {
  const res = await fetch(base + route);
  const html = await res.text();
  const assets = [
    ...new Set(
      [...html.matchAll(/\/_next\/static\/[^"'\\\s>)]+/g)].map((m) => m[0].replace(/\\+$/, ""))
    ),
  ];
  let bad = 0;
  for (const asset of assets) {
    const ares = await fetch(base + asset);
    const type = ares.headers.get("content-type") || "";
    if (ares.status !== 200 || type.includes("text/html")) {
      bad += 1;
      if (bad <= 3) fail(`${route} asset ${ares.status} ${type} ${asset.slice(0, 90)}`);
    }
  }
  const markers = {
    "min-h-[100svh]": html.includes("min-h-[100svh]"),
    "text-[var(--text-body)]": html.includes("text-[var(--text-body)]"),
    "h-[calc(64px+env(safe-area-inset-top))]": html.includes(
      "h-[calc(64px+env(safe-area-inset-top))]"
    ),
  };
  // Only the home page renders SiteNav/HomePage; the others just need clean assets.
  const expected = route === "/" ? Object.keys(markers) : [];
  for (const key of expected) {
    if (!markers[key]) fail(`${route} server HTML missing ${key}`);
  }
  console.log(
    `${route}: ${res.status} assets=${assets.length} bad=${bad}${
      route === "/" ? ` markers=${JSON.stringify(markers)}` : ""
    }`
  );
}

// 2. Browser: hydrate and listen for React errors/warnings.
const browser = await chromium.launch();
for (const target of targets) {
  const context = await browser.newContext({
    viewport: { width: target.width, height: target.height },
    deviceScaleFactor: 1,
    isMobile: target.width < 768,
    hasTouch: target.width < 768,
    reducedMotion: "no-preference",
  });
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem("intro-video-seen", "1");
    } catch {}
  });
  const page = await context.newPage();
  const problems = [];
  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error") problems.push(`error: ${text.slice(0, 200)}`);
    else if (/hydrat|did not match|server rendered/i.test(text))
      problems.push(`${msg.type()}: ${text.slice(0, 200)}`);
  });
  page.on("pageerror", (err) => problems.push(`pageerror: ${String(err).slice(0, 200)}`));

  await page.goto(base + target.route, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  const state = await page.evaluate(() => {
    const main = document.querySelector("main");
    return {
      mainClass: main ? main.className : null,
      headerClass: document.querySelector("header")?.className ?? null,
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      hydrated: Boolean(document.querySelector("[data-reactroot], main, header")),
    };
  });

  const unhydrated = await page.evaluate(
    () =>
      [...document.querySelectorAll("body *")].filter(
        (el) => el.nodeType === 1 && el.hasAttribute("data-reactroot")
      ).length
  );
  void unhydrated;

  console.log(
    `${target.route} @${target.width}: problems=${problems.length} scroll=${state.scrollW}/${state.clientW}`
  );
  for (const p of problems) fail(`${target.route} @${target.width} ${p}`);
  if (target.route === "/" && state.mainClass && !state.mainClass.includes("min-h-[100svh]"))
    fail(`/ client mainClass not updated: ${state.mainClass.slice(0, 120)}`);
  if (state.scrollW !== state.clientW) fail(`${target.route} horizontal overflow`);

  await context.close();
}

await browser.close();
console.log(failures === 0 ? "OK: production build verified" : `${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
