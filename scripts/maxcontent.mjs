// True max-content width of the schedule titles (clone with white-space:nowrap).
import { chromium } from "@playwright/test";

const base = process.argv[2] || "http://localhost:3000";
const browser = await chromium.launch();
for (const width of [1280, 1440]) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  await context.addInitScript(() => sessionStorage.setItem("intro-video-seen", "1"));
  const page = await context.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const data = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("#schedule .type-h3")) {
      const cs = getComputedStyle(el);
      const clone = el.cloneNode(true);
      clone.style.cssText = `position:absolute;left:-9999px;top:0;white-space:nowrap;visibility:hidden;font:${cs.font};letter-spacing:${cs.letterSpacing};font-weight:${cs.fontWeight};font-family:${cs.fontFamily}`;
      document.body.appendChild(clone);
      const maxContent = clone.getBoundingClientRect().width;
      clone.remove();
      const r = el.getBoundingClientRect();
      const parent = el.parentElement.getBoundingClientRect();
      out.push({
        text: el.textContent.trim(),
        maxContent: +maxContent.toFixed(2),
        boxW: +r.width.toFixed(2),
        parentW: +parent.width.toFixed(2),
        lines: Math.round(r.height / parseFloat(cs.lineHeight)),
      });
    }
    return out;
  });
  console.log(`\n=== ${width} ===`);
  for (const d of data) {
    console.log(
      `max=${String(d.maxContent).padStart(7)} box=${String(d.boxW).padStart(7)} parent=${String(d.parentW).padStart(7)} lines=${d.lines}  "${d.text}"`
    );
  }
  await context.close();
}
await browser.close();
