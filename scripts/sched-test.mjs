// Which CSS tweak restores the original schedule-card height at desktop?
import { chromium } from "@playwright/test";

const base = process.argv[2] || "http://localhost:3000";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await context.addInitScript(() => sessionStorage.setItem("intro-video-seen", "1"));
const page = await context.newPage();
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

const variants = [
  ["baseline", ""],
  ["desc lh 1.65", "#schedule .type-body{line-height:1.65 !important}"],
  ["desc lh 25px", "#schedule .type-body{line-height:25px !important}"],
  ["desc lh 1.7", "#schedule .type-body{line-height:1.7 !important}"],
  ["h3 lh 1.2", "#schedule .type-h3{line-height:1.2 !important}"],
  ["card p-24->p-25", "#schedule .rounded-2xl{padding:25px !important}"],
];

const measure = () =>
  page.evaluate(() => {
    const grid = document.querySelector("#schedule .mt-10");
    const sec = document.querySelector("#schedule");
    return {
      docH: document.body.scrollHeight,
      secH: +sec.getBoundingClientRect().height.toFixed(3),
      gridH: +grid.getBoundingClientRect().height.toFixed(3),
      card1: +grid.children[0].firstElementChild.getBoundingClientRect().height.toFixed(3),
      card3: +grid.children[2].firstElementChild.getBoundingClientRect().height.toFixed(3),
      descLH: getComputedStyle(document.querySelector("#schedule .type-body")).lineHeight,
    };
  });

for (const [label, css] of variants) {
  await page.addStyleTag({ content: css || "/* noop */" });
  await page.waitForTimeout(100);
  console.log(label.padEnd(20), JSON.stringify(await measure()));
}
await browser.close();
