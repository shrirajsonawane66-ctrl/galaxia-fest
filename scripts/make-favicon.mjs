// Rebuilds `src/app/favicon.ico` from `src/app/icon.png`.
//
//   node scripts/make-favicon.mjs
//
// The shipped .ico used to carry four 32-bit BMP frames (16/32/48/256) and
// weighed ~26 kB. It is requested at *high* priority next to the hero image, so
// every kilobyte of it delays LCP. PNG-compressed 16/32/48 frames render
// identically in every current browser and land at a few kB.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SIZES = [16, 32, 48];
const root = process.cwd();
const source = path.join(root, "src", "app", "icon.png");
const target = path.join(root, "src", "app", "favicon.ico");

const pngs = [];
for (const size of SIZES) {
  pngs.push({
    size,
    data: await sharp(source)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, palette: true, quality: 90 })
      .toBuffer(),
  });
}

// ICONDIR (6 bytes) + ICONDIRENTRY (16 bytes each) + PNG payloads.
const header = Buffer.alloc(6 + pngs.length * 16);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(pngs.length, 4); // image count

let offset = header.length;
pngs.forEach(({ size, data }, index) => {
  const entry = 6 + index * 16;
  header.writeUInt8(size >= 256 ? 0 : size, entry); // width
  header.writeUInt8(size >= 256 ? 0 : size, entry + 1); // height
  header.writeUInt8(0, entry + 2); // palette colours
  header.writeUInt8(0, entry + 3); // reserved
  header.writeUInt16LE(1, entry + 4); // colour planes
  header.writeUInt16LE(32, entry + 6); // bits per pixel
  header.writeUInt32LE(data.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += data.length;
});

const ico = Buffer.concat([header, ...pngs.map((p) => p.data)]);
await writeFile(target, ico);
console.log(
  `favicon.ico  ${(ico.length / 1024).toFixed(1)} kB ` +
    `(${pngs.map((p) => `${p.size}px ${(p.data.length / 1024).toFixed(1)}kB`).join(", ")})`
);

// Keep a build-time sanity check: the file is served straight from /public.
const check = await readFile(target);
if (check.readUInt16LE(2) !== 1) throw new Error("favicon.ico is not a valid ICO");
