// Cut the combined storyboard (assets/*.png, 2 columns x 4 rows) into eight scenes with sharp.
//
//   npm run split
//
// Writes  scenes/scene_01.png … scene_08.png      the eight scenes, original pixels (left to right, top to bottom)
//         public/scenes/scene_01.jpg … _08.jpg     working copies for the film, enlarged 2x (Lanczos)
//         src/data/scenes.json                      sizes
//
// The white lines between the scenes are found in the pixels, so the cuts follow the real grid and no white
// line is left on an edge. Nothing inside a scene is redrawn; every scene keeps its own aspect ratio.
// A replacement picture for one scene can be put in assets/scenes-hires/scene_0X.png.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const COLS = 2, ROWS = 4, UPSCALE = 2, INSET = 2, SCREEN_W = 1080;
const pngs = readdirSync("assets").filter((f) => /\.png$/i.test(f));
if (!pngs.length) throw new Error("no PNG found in assets/");

// the storyboard is the PNG whose shape is closest to a 2 x 4 sheet of landscape scenes
const metas = await Promise.all(pngs.map(async (f) => ({ f, ...(await sharp(join("assets", f)).metadata()) })));
const board = metas.sort((a, b) => b.width * b.height - a.width * a.height)[0];
const src = join("assets", board.f);
const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

/** share of near-white pixels in every column (axis 0) or row (axis 1) */
const whiteness = (axis) => {
  const n = axis === 0 ? W : H, m = axis === 0 ? H : W;
  return Array.from({ length: n }, (_, i) => {
    let white = 0;
    for (let j = 0; j < m; j++) {
      const p = ((axis === 0 ? j : i) * W + (axis === 0 ? i : j)) * C;
      if (Math.min(data[p], data[p + 1], data[p + 2]) > 238) white++;
    }
    return white / m;
  });
};
/** runs of white lines = gutters; returns the `count` content spans between them */
const spans = (profile, count) => {
  const gutters = [];
  let start = -1;
  profile.forEach((v, i) => {
    if (v > 0.9 && start < 0) start = i;
    if (v <= 0.9 && start >= 0) { gutters.push([start, i - 1]); start = -1; }
  });
  if (start >= 0) gutters.push([start, profile.length - 1]);
  const inner = gutters.filter(([a, b]) => a > 4 && b < profile.length - 5);
  if (inner.length !== count - 1) {                     // no clear gutters: fall back to an even grid
    return Array.from({ length: count }, (_, i) => [Math.round((i * profile.length) / count), Math.round(((i + 1) * profile.length) / count) - 1]);
  }
  const edges = [gutters[0]?.[0] === 0 ? gutters[0][1] + 1 : 0, ...inner.flatMap(([a, b]) => [a - 1, b + 1]),
    gutters.at(-1)?.[1] === profile.length - 1 && gutters.length > inner.length ? gutters.at(-1)[0] - 1 : profile.length - 1];
  return Array.from({ length: count }, (_, i) => [edges[2 * i], edges[2 * i + 1]]);
};

const xs = spans(whiteness(0), COLS);
const ys = spans(whiteness(1), ROWS);
mkdirSync("scenes", { recursive: true });
mkdirSync("public/scenes", { recursive: true });
console.log(`storyboard: ${src}  ${W}x${H}  →  ${COLS} x ${ROWS}`);
const scenes = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const n = r * COLS + c + 1;
    const id = `scene_${String(n).padStart(2, "0")}`;
    const box = { left: xs[c][0] + INSET, top: ys[r][0] + INSET, width: xs[c][1] - xs[c][0] + 1 - 2 * INSET, height: ys[r][1] - ys[r][0] + 1 - 2 * INSET };
    await sharp(src).extract(box).png().toFile(`scenes/${id}.png`);
    const hires = `assets/scenes-hires/${id}.png`;
    const from = existsSync(hires) ? hires : `scenes/${id}.png`;
    const meta = await sharp(from).metadata();
    const pipe = existsSync(hires) ? sharp(from) : sharp(from).resize({ width: meta.width * UPSCALE, kernel: "lanczos3" }).sharpen({ sigma: 0.8, m1: 0.6, m2: 0.6 });
    await pipe.jpeg({ quality: 93 }).toFile(`public/scenes/${id}.jpg`);
    scenes.push({ n, file: `scenes/${id}.jpg`, srcW: meta.width, srcH: meta.height, aspect: +(meta.width / meta.height).toFixed(4),
      source: existsSync(hires) ? "scenes-hires" : "storyboard", magnification: +(SCREEN_W / meta.width).toFixed(2) });
    console.log(`${id}  x ${box.left}–${box.left + box.width - 1}  y ${box.top}–${box.top + box.height - 1}  →  ${box.width}x${box.height}  (on screen x${(SCREEN_W / meta.width).toFixed(2)})`);
  }
}
writeFileSync("src/data/scenes.json", JSON.stringify({ storyboard: src.replace(/\\/g, "/"), scenes }, null, 1) + "\n");
