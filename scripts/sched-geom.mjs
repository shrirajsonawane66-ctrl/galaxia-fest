// Prints schedule card geometry at desktop widths.
import { chromium } from "@playwright/test";

const base = process.argv[2] || "http://localhost:3000";
const browser = await chromium.launch();
for (const width of [1280, 1440]) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  await context.addInitScript(() => sessionStorage.setItem("intro-video-seen", "1"));
  const page = await context.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  const data = await page.evaluate(() => {
    const grid = document.querySelector("#schedule .mt-10");
    const cards = [...grid.children].map((reveal) => {
      const card = reveal.firstElementChild;
      const r = card.getBoundingClientRect();
      const title = card.querySelector(".type-h3");
      const desc = card.querySelector(".type-body");
      const venue = card.querySelector(".type-small");
      const info = (el) => {
        if (!el) return null;
        const b = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return {
          top: +(b.top + scrollY).toFixed(3),
          h: +b.height.toFixed(3),
          fs: s.fontSize,
          lh: s.lineHeight,
          mt: s.marginTop,
          text: el.textContent.trim().slice(0, 22),
        };
      };
      return {
        top: +(r.top + scrollY).toFixed(3),
        h: +r.height.toFixed(3),
        pad: getComputedStyle(card).paddingTop,
        title: info(title),
        desc: info(desc),
        venue: info(venue),
      };
    });
    const cs = (sel) => {
      const el = document.querySelector(sel);
      const s = getComputedStyle(el);
      return `${sel}: fs=${s.fontSize} lh=${s.lineHeight} mt=${s.marginTop}`;
    };
    return {
      gridH: +grid.getBoundingClientRect().height.toFixed(3),
      sectionH: +document.querySelector("#schedule").getBoundingClientRect().height.toFixed(3),
      docH: document.body.scrollHeight,
      cards,
      styles: [cs("#schedule .type-h3"), cs("#schedule .type-body"), cs("#schedule .type-small")],
    };
  });
  console.log(`\n=== ${width} docH=${data.docH} sectionH=${data.sectionH} gridH=${data.gridH} ===`);
  console.log(data.styles.join("  |  "));
  for (const c of data.cards) {
    console.log(
      `card top=${c.top} h=${c.h} pad=${c.pad}\n   title top=${c.title.top} h=${c.title.h} lh=${c.title.lh} "${c.title.text}"\n   desc  top=${c.desc.top} h=${c.desc.h} lh=${c.desc.lh}\n   venue top=${c.venue.top} h=${c.venue.h} lh=${c.venue.lh}`
    );
  }
  await context.close();
}
await browser.close();
