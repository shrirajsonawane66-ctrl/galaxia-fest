/**
 * One-off video transcode for the Galaxia site.
 *
 * The 720×1280 intro is fine on a desktop monitor but ~730 KB is a lot to push
 * to a phone before the site can be used. This writes a 480p variant that the
 * player picks with matchMedia, so mobile visitors download roughly half.
 *
 * Originals live in /_originals and are never overwritten.
 *
 * Run: node scripts/optimize-video.mjs
 */
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();

const jobs = [
  {
    from: "_originals/videos/intro.mp4",
    to: "public/videos/intro-480.mp4",
    // 480px tall, even width for yuv420p.
    filter: "scale=-2:480",
    crf: 32,
    audioBitrate: "64k",
  },
];

for (const job of jobs) {
  const input = path.join(root, job.from);
  const output = path.join(root, job.to);

  try {
    await fs.access(input);
  } catch {
    // Fall back to the current public file if the original was not archived.
    const fallback = path.join(root, job.to.replace("-480", ""));
    console.log(`using ${path.relative(root, fallback)} as source`);
    job.from = path.relative(root, fallback);
  }

  const args = [
    "-y",
    "-i",
    path.join(root, job.from),
    "-vf",
    job.filter,
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    String(job.crf),
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    job.audioBitrate,
    "-movflags",
    "+faststart",
    output,
  ];

  console.log("ffmpeg", args.join(" "));
  const result = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (result.status !== 0) {
    console.error("ffmpeg failed for", job.to);
    process.exitCode = 1;
    continue;
  }

  const before = (await fs.stat(path.join(root, job.from))).size;
  const after = (await fs.stat(output)).size;
  console.log(
    `${job.to}: ${(before / 1024).toFixed(0)} KB → ${(after / 1024).toFixed(0)} KB`
  );
}
