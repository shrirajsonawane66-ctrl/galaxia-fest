// Re-shoots only the home page at desktop widths for fast parity checks.
import { chromium } from "@playwright/test";

const base = process.argv[2] || "http://localhost:3000";
const browser = await chromium.launch();
for (const [width, height] of [[1280, 800], [1440, 900]]) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
  await context.addInitScript(() => sessionStorage.setItem("intro-video-seen", "1"));
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text()}`);
  });
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.75);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `mobile-audit/after/home-${width}.png`, fullPage: true });
  const h = await page.evaluate(() => document.body.scrollHeight);
  console.log(`${width}x${height} docH=${h} errors=${errors.length}`);
  for (const e of errors.slice(0, 5)) console.log("  " + e);
  await context.close();
}
await browser.close();
