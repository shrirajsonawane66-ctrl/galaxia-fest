// Live experiment: which rule makes the schedule title wrap at 1280?
import { chromium } from "@playwright/test";

const base = process.argv[2] || "http://localhost:3000";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await context.addInitScript(() => sessionStorage.setItem("intro-video-seen", "1"));
const page = await context.newPage();
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);

const variants = [
  ["baseline", ""],
  ["text-wrap:normal on h3", ".type-h3{text-wrap:normal !important}"],
  ["overflow-wrap:normal on h3", ".type-h3{overflow-wrap:normal !important}"],
  ["both normal", ".type-h3{text-wrap:normal !important;overflow-wrap:normal !important}"],
  ["h3 line-height 1.2", ".type-h3{line-height:1.2 !important}"],
  ["h3 font-size 25.6px", ".type-h3{font-size:25.6px !important}"],
  ["h3 letter-spacing -0.03em", ".type-h3{letter-spacing:-0.03em !important}"],
  ["h3 letter-spacing -0.025em", ".type-h3{letter-spacing:-0.025em !important}"],
];

const measure = () =>
  page.evaluate(() => {
    const el = [...document.querySelectorAll("#schedule .type-h3")].find((e) =>
      e.textContent.includes("Shreya")
    );
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    const parent = el.parentElement.getBoundingClientRect();
    return {
      w: +r.width.toFixed(2),
      h: +r.height.toFixed(2),
      lines: Math.round(r.height / parseFloat(s.lineHeight)),
      parentW: +parent.width.toFixed(2),
      fs: s.fontSize,
      ls: s.letterSpacing,
      tw: s.textWrap || s.textWrapMode,
      ow: s.overflowWrap,
      scrollW: el.scrollWidth,
    };
  });

for (const [label, css] of variants) {
  await page.addStyleTag({ content: css || "/* noop */" });
  await page.waitForTimeout(120);
  console.log(label.padEnd(32), JSON.stringify(await measure()));
}
await browser.close();
