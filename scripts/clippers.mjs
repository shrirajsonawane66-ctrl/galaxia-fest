// Verifies that every element sticking out past the viewport is clipped by a
// local overflow-hidden/clip ancestor, not only by the global html/body net.
import { chromium } from "@playwright/test";

const base = process.argv[2] || "http://localhost:3000";
const routes = ["/", "/events", "/booking/success", "/admin/login"];
const widths = [320, 360, 390];

const probe = () => {
  const w = document.documentElement.clientWidth;
  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    if (style.position === "fixed" || style.visibility === "hidden") continue;
    if (!(r.width > 0 && (r.right > w + 1 || r.left < -1))) continue;
    // find the nearest ancestor that clips
    let node = el.parentElement;
    let clipper = null;
    while (node && node !== document.body) {
      const s = getComputedStyle(node);
      if (/(hidden|clip|auto|scroll)/.test(s.overflowX)) {
        clipper = node;
        break;
      }
      node = node.parentElement;
    }
    out.push({
      tag: el.tagName.toLowerCase(),
      cls: String(el.className).slice(0, 70),
      right: Math.round(r.right),
      clipper: clipper
        ? `${clipper.tagName.toLowerCase()}.${String(clipper.className).slice(0, 50)}`
        : "NONE (global net only)",
    });
  }
  return out;
};

const browser = await chromium.launch();
let unclipped = 0;
for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    isMobile: width < 768,
    hasTouch: width < 768,
  });
  await context.addInitScript(() => {
    sessionStorage.setItem("intro-video-seen", "1");
  });
  for (const route of routes) {
    const page = await context.newPage();
    await page.goto(base + route, { waitUntil: "networkidle" });
    const items = await page.evaluate(probe);
    const bad = items.filter((i) => i.clipper.startsWith("NONE"));
    unclipped += bad.length;
    console.log(
      `${width} ${route.padEnd(16)} overflow=${items.length} unclipped=${bad.length}`
    );
    for (const item of bad.slice(0, 8)) {
      console.log("   ", JSON.stringify(item));
    }
    await page.close();
  }
  await context.close();
}
await browser.close();
console.log(unclipped === 0 ? "OK: all overflow is locally clipped" : `FAIL: ${unclipped} unclipped`);
