// Prints the y-offset + height of each major section at a given viewport width.
import { chromium } from "@playwright/test";

const base = process.argv[2] || "http://localhost:3000";
const browser = await chromium.launch();
for (const width of [1280, 1440]) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
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
  await page.waitForTimeout(500);
  const data = await page.evaluate(() => {
    const rows = [];
    const walk = (el, depth) => {
      const r = el.getBoundingClientRect();
      const top = Math.round(r.top + window.scrollY);
      rows.push({
        depth,
        tag: el.tagName.toLowerCase(),
        id: el.id || "",
        cls: String(el.className || "").slice(0, 46),
        top,
        h: Math.round(r.height),
      });
      for (const child of el.children) {
        if (child.id || child.tagName === "SECTION" || child.tagName === "FOOTER") walk(child, depth + 1);
      }
    };
    for (const el of document.querySelectorAll("main > *")) {
      if (el.tagName === "SECTION" || el.tagName === "FOOTER" || el.id) walk(el, 1);
    }
    return { docH: document.body.scrollHeight, rows };
  });
  console.log(`\n=== ${width}px  docH=${data.docH} ===`);
  for (const r of data.rows) {
    console.log(
      `${String(r.top).padStart(5)} +${String(r.h).padStart(4)}  ${"  ".repeat(r.depth)}${r.tag}${r.id ? "#" + r.id : ""}  ${r.cls}`
    );
  }
  await context.close();
}
await browser.close();
