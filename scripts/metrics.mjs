// Mobile metrics probe: stat fit, tap targets, minimum font size, line counts.
import { chromium } from "@playwright/test";

const base = process.argv[2] || "http://localhost:3000";
const browser = await chromium.launch();

for (const width of [320, 360, 390, 412]) {
  for (const route of ["/", "/events"]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      isMobile: width < 768,
      hasTouch: width < 768,
    });
    await context.addInitScript(() => sessionStorage.setItem("intro-video-seen", "1"));
    const page = await context.newPage();
    try {
    await page.goto(base + route, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      const step = Math.round(window.innerHeight * 0.75);
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(400);

    const report = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;

      const stats = [...document.querySelectorAll(".type-stat")].map((el) => {
        const card = el.closest("div.rounded-2xl");
        return {
          text: el.textContent.trim(),
          font: getComputedStyle(el).fontSize,
          scrollW: el.scrollWidth,
          clientW: el.clientWidth,
          overflow: el.scrollWidth > el.clientWidth + 1,
          cardW: card ? Math.round(card.getBoundingClientRect().width) : null,
        };
      });

      // smallest text size actually rendered (excluding sr-only)
      let smallest = 99;
      let smallestText = "";
      for (const el of document.querySelectorAll("body *")) {
        if (!el.childNodes.length) continue;
        const hasText = [...el.childNodes].some(
          (n) => n.nodeType === 3 && n.textContent.trim().length > 2
        );
        if (!hasText) continue;
        const s = getComputedStyle(el);
        if (s.visibility === "hidden" || s.display === "none") continue;
        if (el.className && String(el.className).includes("sr-only")) continue;
        const size = parseFloat(s.fontSize);
        if (size < smallest) {
          smallest = size;
          smallestText = el.textContent.trim().slice(0, 30);
        }
      }

      // interactive elements under 44px in the smallest dimension
      const small = [];
      for (const el of document.querySelectorAll(
        "a[href], button, [role=button], input:not([type=hidden]), select, textarea, summary"
      )) {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        if (r.width === 0 || r.height === 0) continue;
        if (s.visibility === "hidden") continue;
        if (el.closest(".sr-only")) continue;
        // account for pseudo-element hit areas
        const after = getComputedStyle(el, "::after");
        const grow = after && after.content !== "none" && after.position === "absolute";
        if (r.height < 44 - 0.5 || r.width < 44 - 0.5) {
          if (grow) continue;
          small.push({
            tag: el.tagName.toLowerCase(),
            label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 34),
            w: Math.round(r.width),
            h: Math.round(r.height),
          });
        }
      }

      // headings: line count
      const headings = [...document.querySelectorAll(".type-h1, .type-h2, .type-h3")].map((el) => {
        const lh = parseFloat(getComputedStyle(el).lineHeight) || 1;
        return {
          text: el.textContent.trim().slice(0, 40),
          lines: Math.round(el.getBoundingClientRect().height / lh),
        };
      });

      return { vw, stats, smallest, smallestText, small, headings };
    });

    console.log(`\n=== ${width}px ${route} ===`);
    for (const s of report.stats) {
      console.log(
        `  stat "${s.text}" font=${s.font} card=${s.cardW}w text=${s.scrollW}/${s.clientW} ${s.overflow ? "OVERFLOW" : "ok"}`
      );
    }
    console.log(`  smallest font: ${report.smallest}px "${report.smallestText}"`);
    console.log(`  tap targets <44px: ${report.small.length}`);
    for (const t of report.small.slice(0, 12)) {
      console.log(`    ${t.tag} ${t.w}x${t.h} "${t.label}"`);
    }
    const tall = report.headings.filter((h) => h.lines > 3);
    if (tall.length) console.log("  headings >3 lines:", JSON.stringify(tall));
    } catch (error) {
      console.log(`\n=== ${width}px ${route} === FAILED: ${error.message}`);
    } finally {
      await page.close();
      await context.close();
    }
  }
}
await browser.close();
