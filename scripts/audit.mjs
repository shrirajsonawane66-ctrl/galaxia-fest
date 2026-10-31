// Mobile audit: full-page screenshots + overflow report + console problems.
// usage: node scripts/audit.mjs before|after [baseUrl]
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const phase = process.argv[2] || "before";
const base = process.argv[3] || "http://localhost:3000";
const routes = process.env.AUDIT_ROUTES
  ? process.env.AUDIT_ROUTES.split(",")
  : ["/", "/events", "/booking/success", "/admin/login"];

const viewports = [
  { width: 320, height: 640 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
];

const overflowCheck = () => {
  const w = document.documentElement.clientWidth;
  return [...document.querySelectorAll("body *")]
    .filter((el) => {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (style.position === "fixed" || style.visibility === "hidden") return false;
      return r.width > 0 && (r.right > w + 1 || r.left < -1);
    })
    .slice(0, 40)
    .map((el) => {
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        cls: String(el.className).slice(0, 90),
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
        text: (el.textContent || "").trim().slice(0, 40),
      };
    });
};

const outDir = path.resolve("mobile-audit", phase);
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const results = [];

for (const vp of viewports) {
  const context = await browser.newContext({
    viewport: vp,
    deviceScaleFactor: 1,
    isMobile: vp.width < 768,
    hasTouch: vp.width < 768,
    reducedMotion: "no-preference",
  });
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem("intro-video-seen", "1");
    } catch {}
  });

  for (const route of routes) {
    const page = await context.newPage();
    const problems = [];
    page.on("console", (msg) => {
      if (["error", "warning"].includes(msg.type())) problems.push(`${msg.type()}: ${msg.text()}`);
    });
    page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
    page.on("response", (res) => {
      if (res.status() >= 400) problems.push(`http ${res.status()}: ${res.url()}`);
    });

    await page.goto(base + route, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(700);
    // walk the page so lazy sections mount, then return to the top
    await page.evaluate(async () => {
      const step = Math.round(window.innerHeight * 0.8);
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 250));
    });

    const name = (route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-")) + `-${vp.width}`;
    await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });

    let overflow = [];
    if ([320, 360, 390].includes(vp.width)) {
      overflow = await page.evaluate(overflowCheck);
    }

    const docWidth = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      height: document.documentElement.scrollHeight,
    }));

    results.push({ route, width: vp.width, name, overflow, docWidth, problems });
    console.log(
      `${vp.width} ${route} scrollW=${docWidth.scrollWidth}/${docWidth.clientWidth} overflow=${overflow.length} problems=${problems.length}`,
    );
    await page.close();
  }
  await context.close();
}

await writeFile(
  path.join(outDir, "report.json"),
  JSON.stringify(results, null, 2),
  "utf8",
);
await browser.close();
console.log("wrote", path.join(outDir, "report.json"));
