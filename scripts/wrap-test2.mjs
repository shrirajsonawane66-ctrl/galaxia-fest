// Which .type-small letter-spacing / time width makes the schedule title fit?
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
  ["type-small ls 0.02em", ".type-small{letter-spacing:0.02em !important}"],
  ["type-small ls 0.03em", ".type-small{letter-spacing:0.03em !important}"],
  ["type-small ls 0.015em", ".type-small{letter-spacing:0.015em !important}"],
  ["type-small ls 0", ".type-small{letter-spacing:0 !important}"],
  ["sm:gap-4 -> gap-3 (12px)", "#schedule .flex{gap:12px !important}"],
  ["sm:gap-4 -> gap-2 (8px)", "#schedule .flex{gap:8px !important}"],
  ["sm:gap-4 -> gap-6 (24px)", "#schedule .flex{gap:24px !important}"],
];

const measure = () =>
  page.evaluate(() => {
    const cards = [...document.querySelectorAll("#schedule .type-h3")];
    const out = cards.map((el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        t: el.textContent.slice(0, 14),
        w: +r.width.toFixed(2),
        lines: Math.round(r.height / parseFloat(s.lineHeight)),
      };
    });
    const time = document.querySelector("#schedule .type-small");
    return { out, timeW: +time.getBoundingClientRect().width.toFixed(2), ls: getComputedStyle(time).letterSpacing };
  });

for (const [label, css] of variants) {
  await page.addStyleTag({ content: css || "/* noop */" });
  await page.waitForTimeout(120);
  const m = await measure();
  console.log(
    label.padEnd(28),
    "timeW=" + String(m.timeW).padStart(7),
    "ls=" + String(m.ls).padStart(8),
    m.out.map((o) => `${o.t}:${o.w}/${o.lines}L`).join("  ")
  );
}
await browser.close();
