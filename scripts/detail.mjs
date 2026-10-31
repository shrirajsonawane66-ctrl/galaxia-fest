// Targeted detail screenshots for visual review.
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const base = process.argv[2] || "http://localhost:3000";
const outDir = path.resolve("mobile-audit", process.argv[3] || "before");
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
await context.addInitScript(() => {
  try { sessionStorage.setItem("intro-video-seen", "1"); } catch {}
});

const page = await context.newPage();
const shots = [
  ["home", "/", [["header", "nav"], ["section:nth-of-type(1)", "hero"], ["#stats", "stats"], ["#performers", "performers"], ["#passes", "passes"], ["#faq", "faq"], ["footer", "footer"]]],
  ["events", "/events", [["header", "nav"], ["main", "main"], ["[role=tablist]", "tabs"]]],
  ["success", "/booking/success", [["main", "main"]]],
  ["admin-login", "/admin/login", [["body", "body"]]],
];

for (const [name, route, targets] of shots) {
  await page.goto(base + route, { waitUntil: "networkidle", timeout: 60000 });
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);
  for (const [selector, label] of targets) {
    const el = page.locator(selector).first();
    if (!(await el.count())) {
      console.log("missing", name, selector);
      continue;
    }
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await el.screenshot({ path: path.join(outDir, `detail-${name}-${label}.png`) }).catch((e) => console.log("shot fail", name, label, e.message));
  }
}
await browser.close();
console.log("detail shots done");
