/**
 * One-off image optimisation for the Galaxia site.
 *
 * Originals are copied to /_originals (outside /public) before the optimised
 * files are written back to their existing paths, so no component reference
 * has to change. Safe to re-run: it always reads from /_originals when present.
 *
 * Run: node scripts/optimize-images.mjs
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const originals = path.join(root, "_originals");

const jobs = [
  {
    // Hero wordmark. Displayed at max 380 CSS px → 828 px covers 2x DPR
    // without asking the optimiser to upscale the source.
    from: "public/brand/galaxia-logo.png",
    width: 828,
    png: { compressionLevel: 9, palette: true, quality: 85, effort: 8 },
  },
  {
    // Nav/footer/auth/admin logo. Displayed at 40 px tall (~56 px wide).
    from: "public/images/logo-trim.png",
    width: 320,
    png: { compressionLevel: 9, palette: true, quality: 90, effort: 8 },
  },
  {
    // Poster for the intro video.
    from: "public/videos/intro-poster.jpg",
    width: 720,
    jpeg: { quality: 65, mozjpeg: true },
  },
];

// Responsive hero wordmark variants. Serving pre-encoded AVIF/WebP straight
// from /public skips the on-demand image optimiser on the critical path and lets
// the document preload the exact file the browser will use.
const heroVariants = {
  from: "_originals/brand/galaxia-logo.png",
  outDir: "public/brand",
  widths: [480, 640, 760, 1140],
};

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function buildHeroVariants() {
  const source = path.join(root, heroVariants.from);
  if (!(await exists(source))) {
    console.log("skip hero variants: missing", heroVariants.from);
    return;
  }

  for (const width of heroVariants.widths) {
    const base = path.join(root, heroVariants.outDir, `galaxia-logo-${width}`);
    const resized = sharp(source).rotate().resize({ width, withoutEnlargement: true });

    for (const [format, options] of [
      ["avif", { quality: 48, effort: 6 }],
      ["webp", { quality: 75, effort: 6 }],
    ]) {
      const file = `${base}.${format}`;
      const buffer = await resized.clone()[format](options).toBuffer();
      await fs.writeFile(file, buffer);
      console.log(
        `${path.relative(root, file)}: ${(buffer.length / 1024).toFixed(0)} KB`
      );
    }
  }
}

async function main() {
  let saved = 0;

  for (const job of jobs) {
    const source = path.join(root, job.from);
    const backup = path.join(originals, job.from.replace(/^public[\\/]/, ""));

    if (!(await exists(backup))) {
      await fs.mkdir(path.dirname(backup), { recursive: true });
      await fs.copyFile(source, backup);
      console.log("backed up", job.from, "→", path.relative(root, backup));
    }

    const input = (await exists(backup)) ? backup : source;
    const before = (await fs.stat(input)).size;

    let pipeline = sharp(input).rotate().resize({
      width: job.width,
      withoutEnlargement: true,
    });

    if (job.png) pipeline = pipeline.png(job.png);
    if (job.jpeg) pipeline = pipeline.jpeg(job.jpeg);

    const buffer = await pipeline.toBuffer();
    await fs.writeFile(source, buffer);

    const after = buffer.length;
    saved += before - after;
    console.log(
      `${job.from}: ${(before / 1024).toFixed(0)} KB → ${(after / 1024).toFixed(0)} KB`
    );
  }

  // Sources that the current UI does not reference: keep them out of /public so
  // they are not copied into the deployment, but preserve them for future use.
  for (const unused of ["public/logo.png", "public/images/galaxia-logo.png"]) {
    const source = path.join(root, unused);
    if (!(await exists(source))) continue;
    const backup = path.join(originals, unused.replace(/^public[\\/]/, ""));
    await fs.mkdir(path.dirname(backup), { recursive: true });
    if (!(await exists(backup))) await fs.copyFile(source, backup);
    await fs.unlink(source);
    console.log("moved unused", unused, "→", path.relative(root, backup));
  }

  console.log(`total saved in /public: ${(saved / 1024).toFixed(0)} KB`);

  // Small inline logos for the nav bar and footer. Displayed at 45–56 CSS px
  // wide, so 128/192 px covers 2x and 3x DPR without the next/image runtime.
  for (const width of [128, 192]) {
    const file = path.join(root, `public/images/logo-trim-${width}.png`);
    const buffer = await sharp(path.join(originals, "images/logo-trim.png"))
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .png({ compressionLevel: 9, palette: true, quality: 90, effort: 8 })
      .toBuffer();
    await fs.writeFile(file, buffer);
    console.log(`${path.relative(root, file)}: ${(buffer.length / 1024).toFixed(0)} KB`);
  }

  await buildHeroVariants();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
