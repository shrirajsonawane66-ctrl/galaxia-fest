// Rebuilds the self-hosted font subsets in `src/fonts/`.
//
//   node scripts/subset-fonts.mjs
//
// `*.source.woff2` are the unmodified latin subsets downloaded from Google
// Fonts (OFL); the generated `*.woff2` files keep only the characters this site
// can actually render. Keep the two lists in sync when adding new copy or
// glyphs — anything missing falls back to the metric-adjusted Arial face, so a
// miss looks slightly off rather than showing tofu.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import subsetFont from "subset-font";

const FONTS = ["bricolage-latin", "outfit-latin"];

// ASCII + Latin-1 letters (so admin-entered names keep their accents) + the
// punctuation/marks the layout uses.
const LATIN = Array.from({ length: 0xff - 0x20 + 1 }, (_, i) => 0x20 + i);
const EXTRA = [
  0x0131, // dotless i
  0x0152, 0x0153, // OE oe
  0x2013, 0x2014, // en/em dash
  0x2018, 0x2019, 0x201a, 0x201c, 0x201d, 0x201e, // quotes
  0x2022, 0x2026, // bullet, ellipsis
  0x20b9, 0x20ac, // rupee, euro
  0x2122, 0x00a9, // tm, copyright
  0x2190, 0x2192, 0x2191, 0x2193, // arrows
  0x00b7, // middot
];
const text = String.fromCodePoint(...LATIN, ...EXTRA);

const dir = path.join(process.cwd(), "src", "fonts");
for (const name of FONTS) {
  const input = await readFile(path.join(dir, `${name}.source.woff2`));
  const output = await subsetFont(input, text, { targetFormat: "woff2" });
  await writeFile(path.join(dir, `${name}.woff2`), output);
  console.log(`${name}.woff2  ${(output.length / 1024).toFixed(1)} kB`);
}
