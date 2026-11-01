// Vercel builds on Linux, where file paths are case-sensitive. Windows hid any
// import whose casing doesn't match the real file. This walks every source file,
// resolves every relative and "@/..." import, and reports mismatches.
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";

const root = process.cwd();
const exts = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css", ".svg", ".png", ".woff2"];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".git" || entry.startsWith(".next")) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function exactExists(abs) {
  // Verifies every path segment matches the on-disk casing.
  const rel = relative(root, abs);
  if (rel.startsWith("..")) return { ok: false, reason: "outside repo" };
  let cur = root;
  for (const seg of rel.split(/[\\/]/)) {
    let entries;
    try {
      entries = readdirSync(cur);
    } catch {
      return { ok: false, reason: "missing dir" };
    }
    if (!entries.includes(seg)) {
      const near = entries.find((e) => e.toLowerCase() === seg.toLowerCase());
      return { ok: false, reason: near ? `case differs: "${seg}" should be "${near}"` : `no such entry "${seg}"` };
    }
    cur = join(cur, seg);
  }
  return { ok: true };
}

const files = walk(join(root, "src")).concat(
  ["next.config.ts", "tailwind.config.js", "postcss.config.js", "tsconfig.json"].map((f) => join(root, f)).filter((f) => {
    try { statSync(f); return true; } catch { return false; }
  })
);

const re = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)["']([^"']+)["']/g;
const problems = [];

for (const file of files) {
  if (!/\.(tsx?|jsx?|mjs|cjs)$/.test(file)) continue;
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(re)) {
    const spec = m[1];
    let base;
    if (spec.startsWith("@/")) base = join(root, "src", spec.slice(2));
    else if (spec.startsWith(".")) base = resolve(dirname(file), spec);
    else continue;
    const candidates = [base, ...exts.map((e) => base + e), ...exts.map((e) => join(base, "index" + e))];
    let found = false;
    for (const c of candidates) {
      let st;
      try { st = statSync(c); } catch { continue; }
      if (!st.isFile()) continue;
      const r = exactExists(c);
      if (r.ok) { found = true; break; }
      problems.push(`${relative(root, file)} -> ${spec} :: ${r.reason}`);
      found = true;
      break;
    }
    if (!found) problems.push(`${relative(root, file)} -> ${spec} :: unresolved on any casing`);
  }
}

console.log(`scanned ${files.length} files`);
if (problems.length === 0) {
  console.log("OK: every local import matches on-disk casing");
} else {
  for (const p of [...new Set(problems)]) console.log("PROBLEM " + p);
  process.exitCode = 1;
}
