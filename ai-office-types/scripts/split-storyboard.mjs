// Split the 3×3 storyboard into nine scene images (left→right, top→bottom).
//   node scripts/split-storyboard.mjs [path/to/storyboard.png]      (or: npm run split)
// Default source: assets/storyboard.png — or, if that is missing, the largest image found in assets/ or the
// project root. The white gutters between the cells are detected from the pixels; each cell is cropped a few
// pixels inside its gutter (no border, no neighbouring scene) and saved untouched to
// public/scenes/scene-01.png … scene-09.png. Nothing is regenerated, resized or stretched.
// Also writes src/data/cells.json (source size, cell boxes) so the video knows each image's aspect.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const COLS = 3, ROWS = 3, INSET = 4, WHITE = 232;

async function findSource() {
  if (process.argv[2]) return process.argv[2];
  if (existsSync("assets/storyboard.png")) return "assets/storyboard.png";
  let best = null;
  for (const dir of ["assets", "."]) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!/\.(png|jpe?g|webp)$/i.test(f)) continue;
      const p = path.join(dir, f);
      const m = await sharp(p).metadata();
      if (!best || m.width * m.height > best.px) best = { p, px: m.width * m.height };
    }
  }
  if (!best) throw new Error("no storyboard image found (put it at assets/storyboard.png)");
  return best.p;
}

/** runs of rows/columns that are almost entirely white → the gutters; returns the n content spans */
function spans(frac, n, length) {
  const runs = [];
  for (let i = 0; i < length; ) {
    if (frac[i] > 0.9) {
      let j = i;
      while (j < length && frac[j] > 0.9) j++;
      runs.push([i, j]);
      i = j;
    } else i++;
  }
  const inner = runs.filter(([a, b]) => a > length * 0.05 && b < length * 0.95);
  if (inner.length === n - 1) {
    const out = [];
    let s = runs.length && runs[0][0] === 0 ? runs[0][1] : 0; // outer white border, if any
    for (const [a, b] of inner) {
      out.push([s, a]);
      s = b;
    }
    const last = runs[runs.length - 1];
    out.push([s, last && last[1] === length && last[0] > length * 0.95 ? last[0] : length]);
    return { spans: out, detected: true };
  }
  const step = length / n;
  return { spans: Array.from({ length: n }, (_, i) => [Math.round(i * step), Math.round((i + 1) * step)]), detected: false };
}

const src = await findSource();
const img = sharp(src);
const { width, height } = await img.metadata();
const { data, info } = await img.clone().removeAlpha().raw().toBuffer({ resolveWithObject: true });
const ch = info.channels;
const colWhite = new Float64Array(width), rowWhite = new Float64Array(height);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * ch;
    if (Math.min(data[i], data[i + 1], data[i + 2]) > WHITE) {
      colWhite[x] += 1 / height;
      rowWhite[y] += 1 / width;
    }
  }
}
const xs = spans(colWhite, COLS, width);
const ys = spans(rowWhite, ROWS, height);
console.log(`storyboard ${src}  ${width}×${height}`);
console.log(`  columns ${JSON.stringify(xs.spans)}${xs.detected ? "" : "  (equal split — gutters not found)"}`);
console.log(`  rows    ${JSON.stringify(ys.spans)}${ys.detected ? "" : "  (equal split — gutters not found)"}`);

mkdirSync("public/scenes", { recursive: true });
const cells = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const n = r * COLS + c + 1;
    const [x0, x1] = xs.spans[c];
    const [y0, y1] = ys.spans[r];
    const box = { left: x0 + INSET, top: y0 + INSET, width: x1 - x0 - 2 * INSET, height: y1 - y0 - 2 * INSET };
    const file = `scenes/scene-${String(n).padStart(2, "0")}.png`;
    await sharp(src).extract(box).png().toFile(path.join("public", file));
    cells.push({ n, file, ...box, aspect: +(box.width / box.height).toFixed(4) });
    console.log(`scene-${String(n).padStart(2, "0")}.png  ${box.width}×${box.height}  at (${box.left}, ${box.top})`);
  }
}
writeFileSync("src/data/cells.json", JSON.stringify({ source: src, width, height, cells }, null, 1) + "\n");
