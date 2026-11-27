// Break the wrap change down to text-wrap-style.
import { chromium } from "@playwright/test";

const base = process.argv[2] || "http://localhost:3000";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
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
    return {
      label,
      mode: cs.textWrapMode,
      style: cs.textWrapStyle,
      lines: Math.round(r.height / parseFloat(cs.lineHeight)),
      widths: rects.join(","),
    };
  };
  const out = [snap("baseline")];
  el.style.textWrapStyle = "auto";
  out.push(snap("style=auto"));
  el.style.textWrapStyle = "balance";
  out.push(snap("style=balance"));
  el.style.textWrapStyle = "";
  // now simulate no rule at all
  el.classList.remove("type-h3");
  el.style.font = "700 25.6px 'Bricolage Grotesque', sans-serif";
  out.push(snap("no type-h3 class"));
  return out;
});
for (const r of result) {
  console.log(`${r.label.padEnd(20)} mode=${String(r.mode).padEnd(6)} style=${String(r.style).padEnd(8)} lines=${r.lines} widths=${r.widths}`);
}
await browser.close();
