// Confirm text-wrap:balance is what changes the schedule title break point.
import { chromium } from "@playwright/test";

const base = process.argv[2] || "http://localhost:3000";
const browser = await chromium.launch();
for (const width of [1280, 1440]) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  await context.addInitScript(() => sessionStorage.setItem("intro-video-seen", "1"));
  const page = await context.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  const result = await page.evaluate(() => {
    const els = [...document.querySelectorAll("#schedule .type-h3")];
    const el = els.find((e) => e.textContent.includes("Shreya"));
    const snap = (label) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(el);
      const rects = [...range.getClientRects()].map((x) => Math.round(x.width));
      return { label, textWrap: cs.textWrap, lines: Math.round(r.height / parseFloat(cs.lineHeight)), lineWidths: rects };
    };
    const out = [snap("baseline")];
    el.style.textWrap = "normal";
    out.push(snap("inline text-wrap:normal"));
    el.style.textWrap = "balance";
    out.push(snap("inline balance"));
    el.style.textWrap = "pretty";
    out.push(snap("inline pretty"));
    el.style.textWrap = "";
    return out;
  });
  console.log(`\n=== ${width} ===`);
  for (const r of result) console.log(`${r.label.padEnd(24)} textWrap=${String(r.textWrap).padEnd(8)} lines=${r.lines} widths=${r.lineWidths.join(",")}`);
  await context.close();
}
await browser.close();
