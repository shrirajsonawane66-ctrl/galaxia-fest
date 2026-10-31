// Finds schedule card title positions at 1280 for image comparison.
import { chromium } from "@playwright/test";

const base = process.argv[2] || "http://localhost:3000";
const browser = await chromium.launch();
for (const [width, height] of [[1280, 800], [1440, 900]]) {
  const context = await browser.newContext({ viewport: { width, height } });
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
  await page.waitForTimeout(800);
  const rows = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("#schedule h3, #schedule .type-h3, #schedule p")) {
      const r = el.getBoundingClientRect();
      if (!r.height) continue;
      const s = getComputedStyle(el);
      out.push({
        text: el.textContent.trim().slice(0, 44),
        x: +r.left.toFixed(2),
        y: +(r.top + window.scrollY).toFixed(2),
        w: +r.width.toFixed(2),
        h: +r.height.toFixed(2),
        fs: s.fontSize,
        lh: s.lineHeight,
        ls: s.letterSpacing,
        fw: s.fontWeight,
        ff: s.fontFamily.split(",")[0],
        cls: String(el.className).slice(0, 40),
      });
    }
    return out;
  });
  console.log(`\n=== ${width} ===`);
  for (const r of rows.slice(0, 12)) {
    console.log(
      `${String(r.y).padStart(8)} x${String(r.x).padStart(7)} w${String(r.w).padStart(7)} h${String(r.h).padStart(7)} fs=${r.fs} lh=${r.lh} ls=${r.ls} fw=${r.fw} ff=${r.ff}\n         "${r.text}"`
    );
  }
  await context.close();
}
await browser.close();
