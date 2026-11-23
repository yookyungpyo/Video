// Cut the combined storyboard (assets/ai-agent-slop-storyboard.png, 3 columns x 3 rows) into nine panels with sharp.
//
//   npm run split
//
// Writes  assets/scenes/scene-01.png … scene-09.png   the nine panels, original pixels (left to right, top to bottom)
//         public/scenes/scene-01.jpg … -09.jpg         working copies for the film, enlarged 4x (Lanczos)
//         src/data/scenes.json                          sizes
//
// The panels are separated by thin lines of uniform colour (a white gap with a grey rule beside it). Those lines
// are found in the pixels — rows and columns in which every pixel has nearly the same brightness — and each
// panel is cut a few pixels inside them, so no rule is left on an edge. The rows of this storyboard are not
// equally tall; every panel keeps its own aspect ratio. Nothing inside a panel is redrawn.
// A replacement picture for one scene can be put in assets/scenes-hires/scene-0X.png.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const SRC = "assets/ai-agent-slop-storyboard.png";
const COLS = 3, ROWS = 3, UPSCALE = 4, PANEL_W = 1080;
const CLEAR = 5;   // px cut away on both sides of a separator (covers the grey rule next to the white gap)
const { data, info } = await sharp(SRC).removeAlpha().greyscale().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;

/** standard deviation of brightness of every column (axis 0) or row (axis 1) */
const spread = (axis) => {
  const n = axis === 0 ? W : H, m = axis === 0 ? H : W;
  return Array.from({ length: n }, (_, i) => {
    let s = 0, s2 = 0;
    for (let j = 0; j < m; j++) { const v = data[axis === 0 ? j * W + i : i * W + j]; s += v; s2 += v * v; }
    return Math.sqrt(Math.max(0, s2 / m - (s / m) ** 2));
  });
};
/** the `count` content spans between the separators */
const spans = (profile, count) => {
  const lines = profile.map((v, i) => (v < 22 ? i : -1)).filter((i) => i > 8 && i < profile.length - 9);
  const groups = [];
  for (const i of lines) (groups.length && i - groups.at(-1)[1] <= 8 ? (groups.at(-1)[1] = i) : groups.push([i, i]));
  if (groups.length !== count - 1) {
    console.log(`! found ${groups.length} separators instead of ${count - 1} — using an even grid`);
    return Array.from({ length: count }, (_, i) => [Math.round((i * profile.length) / count) + CLEAR, Math.round(((i + 1) * profile.length) / count) - 1 - CLEAR]);
  }
  const edges = [CLEAR - 1, ...groups.flatMap(([a, b]) => [a - CLEAR - 1, b + CLEAR + 1]), profile.length - CLEAR];
  return Array.from({ length: count }, (_, i) => [edges[2 * i], edges[2 * i + 1]]);
};

const xs = spans(spread(0), COLS);
const ys = spans(spread(1), ROWS);
mkdirSync("assets/scenes", { recursive: true });
mkdirSync("public/scenes", { recursive: true });
console.log(`storyboard: ${SRC}  ${W}x${H}  →  ${COLS} x ${ROWS}`);
const scenes = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const n = r * COLS + c + 1;
    const id = `scene-${String(n).padStart(2, "0")}`;
    const box = { left: xs[c][0], top: ys[r][0], width: xs[c][1] - xs[c][0] + 1, height: ys[r][1] - ys[r][0] + 1 };
    await sharp(SRC).extract(box).png().toFile(`assets/scenes/${id}.png`);
    const hires = `assets/scenes-hires/${id}.png`;
    const from = existsSync(hires) ? hires : `assets/scenes/${id}.png`;
    const meta = await sharp(from).metadata();
    const pipe = existsSync(hires) ? sharp(from) : sharp(from).resize({ width: meta.width * UPSCALE, kernel: "lanczos3" }).sharpen({ sigma: 0.7, m1: 0.5, m2: 0.5 });
    await pipe.jpeg({ quality: 94 }).toFile(`public/scenes/${id}.jpg`);
    scenes.push({ n, file: `scenes/${id}.jpg`, srcW: meta.width, srcH: meta.height, aspect: +(meta.width / meta.height).toFixed(4),
      source: existsSync(hires) ? "scenes-hires" : "storyboard", magnification: +(PANEL_W / meta.width).toFixed(2) });
    console.log(`${id}  x ${box.left}–${box.left + box.width - 1}  y ${box.top}–${box.top + box.height - 1}  →  ${box.width}x${box.height}  (on screen x${(PANEL_W / meta.width).toFixed(2)})`);
  }
}
writeFileSync("src/data/scenes.json", JSON.stringify({ storyboard: SRC, scenes }, null, 1) + "\n");
