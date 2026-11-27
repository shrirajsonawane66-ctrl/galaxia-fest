// Prints fractional geometry of the hero children at desktop widths.
import { chromium } from "@playwright/test";

const base = process.argv[2] || "http://localhost:3000";
const browser = await chromium.launch();
for (const [width, height] of [[1280, 800], [1440, 900]]) {
  const context = await browser.newContext({ viewport: { width, height } });
  await context.addInitScript(() => sessionStorage.setItem("intro-video-seen", "1"));
  const page = await context.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);
  const data = await page.evaluate(() => {
    const hero = document.querySelector("main > section");
    const stack = hero.querySelector(":scope > div.relative");
    const out = [];
    const push = (label, el) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      out.push({
        label,
        top: +r.top.toFixed(3),
        bottom: +r.bottom.toFixed(3),
        h: +r.height.toFixed(3),
        w: +r.width.toFixed(3),
        mt: s.marginTop,
        lh: s.lineHeight,
        fs: s.fontSize,
        maxW: s.maxWidth,
        gap: s.gap,
      });
    };
    push("hero", hero);
    push("stack", stack);
    const kids = [...stack.children];
    kids.forEach((k, i) => push(`child${i}:${k.tagName.toLowerCase()}`, k));
    const desc = kids.find((k) => k.className.includes("type-lead"));
    push("desc", desc);
    const btns = kids.find((k) => k.className.includes("md:mt-8"));
    push("btns", btns);
    return { out, heroH: hero.getBoundingClientRect().height, stackTop: stack.getBoundingClientRect().top };
  });
  console.log(`\n=== ${width}x${height} heroH=${data.heroH} ===`);
  for (const r of data.out) {
    console.log(
      `${r.label.padEnd(22)} top=${String(r.top).padStart(8)} h=${String(r.h).padStart(8)} w=${String(r.w).padStart(7)} mt=${r.mt.padEnd(6)} lh=${r.lh.padEnd(7)} fs=${r.fs.padEnd(7)} maxW=${r.maxW}`
    );
  }
  await context.close();
}
await browser.close();
