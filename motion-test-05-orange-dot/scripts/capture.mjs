// Frame-accurate capture of index.html → PNG stills and/or MP4.
//
//   node scripts/capture.mjs                 # full MP4 → output/the-orange-dot.mp4 (needs ffmpeg)
//   node scripts/capture.mjs --stills        # representative frames → screenshots/
//   node scripts/capture.mjs --frames 0,90,600 --out tmp/   # specific frames as PNG
//   node scripts/capture.mjs --determinism   # render frames twice, out of order, compare
//
// Each frame is drawn by window.renderAt(frame / 60) — never by wall-clock playback —
// so the capture is exact and repeatable regardless of machine speed.
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.error("Playwright not found. Install it with:  npm i -D playwright  &&  npx playwright install chromium");
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);

const FPS = 60;
const TOTAL = 1200;
const STILLS = {
  90: "01-the-dot",
  285: "02-the-toggle",
  540: "03-the-data",
  760: "04-the-system",
  880: "05-the-transformation",
  1188: "06-the-ending",
};

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(root, "index.html")).href + "?capture=1");
await page.evaluate(() => window.ready);
const canvas = await page.$("canvas");

async function grab(frame, type = "png") {
  await page.evaluate((f) => window.renderFrame(f), frame);
  return canvas.screenshot({ type, ...(type === "jpeg" ? { quality: 95 } : {}) });
}

if (flag("--determinism")) {
  const frames = [0, 137, 300, 611, 777, 905, 1100, 1199];
  const hash = (b) => createHash("sha1").update(b).digest("hex").slice(0, 12);
  const first = {};
  for (const f of frames) first[f] = hash(await grab(f));
  let ok = true;
  for (const f of [...frames].reverse()) {
    const h = hash(await grab(f));
    console.log(`frame ${String(f).padStart(4)}  ${first[f]}  ${h}  ${h === first[f] ? "same" : "DIFFERENT"}`);
    ok &&= h === first[f];
  }
  console.log(ok ? "deterministic: identical pixels in forward and reverse order" : "NOT deterministic");
  await browser.close();
  process.exit(ok ? 0 : 1);
}

if (flag("--stills") || flag("--frames")) {
  const outDir = path.resolve(root, opt("--out", "screenshots"));
  fs.mkdirSync(outDir, { recursive: true });
  const list = flag("--frames") ? opt("--frames").split(",").map(Number) : Object.keys(STILLS).map(Number);
  for (const f of list) {
    const name = `${STILLS[f] ?? "frame"}-f${String(f).padStart(4, "0")}.png`;
    fs.writeFileSync(path.join(outDir, name), await grab(f));
    console.log("wrote", path.relative(root, path.join(outDir, name)));
  }
  await browser.close();
  process.exit(0);
}

// ── MP4: stream JPEG frames into ffmpeg ──────────────────────────────────
const out = path.resolve(root, opt("--mp4", "output/the-orange-dot.mp4"));
fs.mkdirSync(path.dirname(out), { recursive: true });
const ff = spawn(
  "ffmpeg",
  ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-r", String(FPS), "-movflags", "+faststart", out],
  { stdio: ["pipe", "inherit", "inherit"] },
);
ff.on("error", () => {
  console.error("ffmpeg not found on PATH. Install it (winget install ffmpeg) or use --frames to export PNGs.");
  process.exit(1);
});
const t0 = Date.now();
for (let f = 0; f < TOTAL; f++) {
  const buf = await grab(f, "jpeg");
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  if (f % 120 === 0) console.log(`frame ${f}/${TOTAL}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));
await browser.close();
console.log(`done → ${path.relative(root, out)} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
