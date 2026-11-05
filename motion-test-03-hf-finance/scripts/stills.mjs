// Render representative frames to PNG (bundles once, reuses one browser).
// usage: node scripts/stills.mjs [outDir] [frame,frame,...]
// env:   BROWSER=/path/to/chrome (optional)
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";

const NAMES = { 100: "01-hf-digital-experience", 284: "02-bogeumjari", 462: "03-jeonse-on", 640: "04-housing-pension", 880: "05-brand-ending" };
const outDir = path.resolve(process.argv[2] ?? "screenshots");
const frames = (process.argv[3] ?? Object.keys(NAMES).join(",")).split(",").map(Number);
fs.mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable: process.env.BROWSER ?? null });
const composition = await selectComposition({ serveUrl, id: "HFFinanceFilm", puppeteerInstance: browser });
for (const f of frames) {
  const file = path.join(outDir, `${NAMES[f] ?? "frame"}-f${String(f).padStart(3, "0")}.png`);
  await renderStill({ composition, serveUrl, frame: f, output: file, puppeteerInstance: browser });
  console.log("wrote", path.relative(process.cwd(), file));
}
await browser.close({ silent: true });
