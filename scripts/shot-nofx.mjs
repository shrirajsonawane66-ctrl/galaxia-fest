// Diagnostic: shoot home at 1280 with all transitions/transforms neutralised.
import { chromium } from "@playwright/test";

const base = process.argv[2] || "http://localhost:3000";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
await context.addInitScript(() => sessionStorage.setItem("intro-video-seen", "1"));
const page = await context.newPage();
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.evaluate(async () => {
  const step = Math.round(window.innerHeight * 0.75);
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 40));
  }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(1500);
await page.addStyleTag({
  content: `*,*::before,*::after{transition:none!important;transform:none!important;opacity:1!important}`,
});
await page.waitForTimeout(400);
await page.screenshot({ path: "mobile-audit/after/home-1280-nofx.png", fullPage: true });
console.log("docH=" + (await page.evaluate(() => document.body.scrollHeight)));
await browser.close();
