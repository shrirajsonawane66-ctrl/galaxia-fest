// Mobile performance probe: homepage at 390x844 with 4x CPU throttling.
// Reports long tasks, frame timing during a scripted scroll, and hydration time.
// usage: node scripts/cpu-throttle.mjs [baseUrl]
import { chromium } from "@playwright/test";

const base = process.argv[2] || "http://localhost:3000";
const RATE = 4;

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  reducedMotion: "no-preference",
});
await context.addInitScript(() => {
  try {
    sessionStorage.setItem("intro-video-seen", "1");
  } catch {}
  window.__longTasks = [];
  window.__lcp = 0;
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        window.__longTasks.push(Math.round(entry.duration));
    }).observe({ type: "longtask", buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      window.__lcp = Math.round(entries[entries.length - 1].startTime);
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch {}
});
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: RATE });

const started = Date.now();
await page.goto(base + "/", { waitUntil: "load" });
const loadMs = Date.now() - started;
// Give React time to hydrate + entrance animations to settle.
await page.waitForTimeout(2500);
const hydratedMs = Date.now() - started;

// Scripted scroll, sampled frame by frame.
const scrollStats = await page.evaluate(async () => {
  const frames = [];
  let last = performance.now();
  let running = true;
  const tick = (now) => {
    frames.push(now - last);
    last = now;
    if (running) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  const step = window.innerHeight * 0.9;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  for (let y = 0; y <= max; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 260));
  }
  await new Promise((r) => setTimeout(r, 400));
  running = false;

  const deltas = frames.slice(1).sort((a, b) => a - b);
  const pct = (p) => Math.round(deltas[Math.min(deltas.length - 1, Math.floor(deltas.length * p))] * 10) / 10;
  return {
    frames: deltas.length,
    median: pct(0.5),
    p95: pct(0.95),
    worst: Math.round(deltas[deltas.length - 1] * 10) / 10,
    over32ms: deltas.filter((d) => d > 32).length,
    over50ms: deltas.filter((d) => d > 50).length,
  };
});

const longTasks = await page.evaluate(() => window.__longTasks || []);
const lcp = await page.evaluate(() => window.__lcp || 0);
const totals = await page.evaluate(() => {
  const nav = performance.getEntriesByType("navigation")[0];
  return {
    domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
    load: Math.round(nav.loadEventEnd),
  };
});

console.log(`4x CPU throttle | / @390x844 | dpr2`);
console.log(`load event: ${loadMs} ms (nav ${totals.load} ms, dcl ${totals.domContentLoaded} ms)`);
console.log(`settled after: ${hydratedMs} ms`);
console.log(`LCP: ${lcp} ms`);
console.log(
  `scroll frames: ${scrollStats.frames} | median ${scrollStats.median} ms | p95 ${scrollStats.p95} ms | worst ${scrollStats.worst} ms`
);
console.log(
  `frames >32ms: ${scrollStats.over32ms} | >50ms: ${scrollStats.over50ms}`
);
console.log(`long tasks: ${longTasks.length} ${JSON.stringify(longTasks.slice(0, 12))}`);

await browser.close();
