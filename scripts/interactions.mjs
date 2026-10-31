// Interaction checks: mobile sheet, FAQ accordion, hero fit, events filters.
import { chromium } from "@playwright/test";
import path from "node:path";
import { mkdir } from "node:fs/promises";

const base = process.argv[2] || "http://localhost:3000";
const outDir = path.resolve("mobile-audit", "after");
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const results = [];
const record = (name, pass, detail = "") => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
};

async function fresh(width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile: width < 768,
    hasTouch: width < 768,
    deviceScaleFactor: 2,
  });
  await context.addInitScript(() => sessionStorage.setItem("intro-video-seen", "1"));
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  return { context, page, errors };
}

// ── 1. Mobile sheet ────────────────────────────────────────────────────────
{
  const { context, page, errors } = await fresh(390, 844);
  await page.goto(base + "/", { waitUntil: "networkidle" });

  const trigger = page.getByRole("button", { name: "Open menu" }).first();
  const box = await trigger.boundingBox();
  record("hamburger 44x44", box.width >= 44 && box.height >= 44, `${box.width}x${box.height}`);

  await trigger.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible" });
  await page.waitForTimeout(400);

  const panel = await dialog.boundingBox();
  const vw = 390;
  record(
    "sheet width 88vw/max-w-sm",
    Math.abs(panel.width - Math.min(vw * 0.88, 384)) < 2,
    `${panel.width}px`
  );
  record("sheet hugs right edge", Math.abs(panel.x + panel.width - vw) < 1, `x=${panel.x}`);

  const rows = await page.locator('[role="dialog"] nav a').evaluateAll((els) =>
    els
      .filter((el) => el.getBoundingClientRect().height > 0)
      .map((el) => ({
        text: el.textContent.trim(),
        h: Math.round(el.getBoundingClientRect().height),
      }))
  );
  record(
    "sheet link rows >=56px",
    rows.every((r) => r.h >= 56),
    rows.map((r) => `${r.text}:${r.h}`).join(", ")
  );

  const order = rows.map((r) => r.text);
  record(
    "sheet link order",
    JSON.stringify(order) ===
      JSON.stringify(["Events", "About", "Stats", "Performers", "Passes", "FAQ"]),
    order.join(" / ")
  );

  const lockState = await page.evaluate(() => ({
    bodyOverflow: getComputedStyle(document.body).overflow,
    htmlOverflow: getComputedStyle(document.documentElement).overflow,
    before: window.scrollY,
  }));
  await page.mouse.move(195, 500);
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(300);
  const afterWheel = await page.evaluate(() => window.scrollY);
  const afterProgrammatic = await page.evaluate(() => {
    window.scrollTo(0, 400);
    return window.scrollY;
  });
  record(
    "body scroll locked",
    lockState.bodyOverflow === "hidden" ||
      (afterWheel === lockState.before && afterProgrammatic === lockState.before),
    `overflow=${lockState.bodyOverflow} html=${lockState.htmlOverflow} y=${lockState.before}->${afterWheel}/${afterProgrammatic}`
  );

  const focusInDialog = await page.evaluate(() =>
    document.querySelector('[role="dialog"]')?.contains(document.activeElement)
  );
  record("focus moved into sheet", Boolean(focusInDialog));

  await page.screenshot({ path: path.join(outDir, "interaction-sheet-open.png") });

  // Escape closes
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  record("Escape closes sheet", (await page.getByRole("dialog").count()) === 0);

  // re-open and follow a link
  await trigger.click();
  await page.waitForTimeout(400);
  await page.getByRole("dialog").getByRole("link", { name: "Performers" }).click();
  await page.waitForTimeout(1200);
  const closedAfterNav = (await page.getByRole("dialog").count()) === 0;
  const scrolled = await page.evaluate(() => window.scrollY);
  record("link closes sheet + scrolls to section", closedAfterNav && scrolled > 200, `scrollY=${scrolled}`);

  record("no console errors on home+sheet", errors.length === 0, errors.slice(0, 3).join(" | "));
  await context.close();
}

// ── 2. Hero fit at the smallest phones ────────────────────────────────────
for (const [w, h] of [
  [320, 640],
  [360, 640],
  [360, 800],
  [390, 844],
]) {
  const { context, page } = await fresh(w, h);
  await page.goto(base + "/", { waitUntil: "networkidle" });
  const hero = await page.evaluate(() => {
    const section = document.querySelector("section");
    const rect = section.getBoundingClientRect();
    const buttons = [...section.querySelectorAll("a,button")].filter(
      (el) => el.getBoundingClientRect().height > 40
    );
    const lastBottom = buttons.length
      ? Math.max(...buttons.map((b) => b.getBoundingClientRect().bottom))
      : 0;
    const nav = document.querySelector("header").getBoundingClientRect();
    return {
      heroHeight: Math.round(rect.height),
      lastButtonBottom: Math.round(lastBottom),
      navBottom: Math.round(nav.bottom),
      viewport: window.innerHeight,
      docScrollW: document.documentElement.scrollWidth,
    };
  });
  record(
    `hero fits ${w}x${h}`,
    hero.lastButtonBottom <= h && hero.heroHeight >= h - 1 && hero.docScrollW === w,
    JSON.stringify(hero)
  );
  if (w === 360 && h === 640) {
    await page.screenshot({ path: path.join(outDir, "interaction-hero-360x640.png") });
  }
  await context.close();
}

// ── 3. FAQ accordion tap sizes + toggle ───────────────────────────────────
{
  const { context, page } = await fresh(360, 800);
  await page.goto(base + "/#faq", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const buttons = page.locator("#faq button");
  const heights = await buttons.evaluateAll((els) =>
    els.map((el) => Math.round(el.getBoundingClientRect().height))
  );
  record("FAQ triggers >=56px", heights.every((x) => x >= 56), heights.join(","));
  const first = buttons.first();
  await first.click();
  await page.waitForTimeout(300);
  const expanded = await first.getAttribute("aria-expanded");
  record("FAQ opens", expanded === "true", `aria-expanded=${expanded}`);
  await page.screenshot({ path: path.join(outDir, "interaction-faq-open.png") });
  await context.close();
}

// ── 4. Events page: scroll rows, no page scroll, card action ──────────────
{
  const { context, page, errors } = await fresh(360, 800);
  await page.goto(base + "/events", { waitUntil: "networkidle" });
  const tabs = await page.evaluate(() => {
    const row = document.querySelector('[role="tablist"]');
    const chips = [...row.querySelectorAll("button")];
    return {
      rowScrollW: row.scrollWidth,
      rowClientW: row.clientWidth,
      overflowX: getComputedStyle(row).overflowX,
      heights: chips.map((c) => Math.round(c.getBoundingClientRect().height)),
      widths: chips.map((c) => Math.round(c.getBoundingClientRect().width)),
      docScrollW: document.documentElement.scrollWidth,
    };
  });
  record("day tabs scroll horizontally", tabs.overflowX === "auto" && tabs.rowScrollW > tabs.rowClientW, `${tabs.rowScrollW}/${tabs.rowClientW}`);
  record("day tabs >=44px tall", tabs.heights.every((h) => h >= 44), tabs.heights.join(","));
  record("events page no h-scroll", tabs.docScrollW === 360, `scrollW=${tabs.docScrollW}`);
  const cards = await page.locator("main button").evaluateAll((els) =>
    els.filter((el) => /calendar|register|details|open/i.test(el.textContent || ""))
      .map((el) => Math.round(el.getBoundingClientRect().height))
  );
  if (cards.length) record("event card action >=44px", cards.every((h) => h >= 44), cards.join(","));
  record("no console errors on /events", errors.length === 0, errors.slice(0, 3).join(" | "));
  await page.screenshot({ path: path.join(outDir, "interaction-events-360.png"), fullPage: false });
  await context.close();
}

// ── 5. Reduced motion: no entrance animation / no band spin ───────────────
{
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  await context.addInitScript(() => sessionStorage.setItem("intro-video-seen", "1"));
  const page = await context.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  const motion = await page.evaluate(() => {
    const hero = document.querySelector(".hero-reveal");
    const panel = document.querySelector(".sheet-panel");
    return {
      heroAnimation: hero ? getComputedStyle(hero).animationName : "none",
      heroOpacity: hero ? getComputedStyle(hero).opacity : "1",
    };
  });
  record("reduced motion disables hero entrance", motion.heroAnimation === "none" && motion.heroOpacity === "1", JSON.stringify(motion));
  await context.close();
}

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) console.log("FAILED:", failed.map((f) => f.name).join(", "));
