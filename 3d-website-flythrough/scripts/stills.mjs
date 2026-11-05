// Render representative frames to PNG (bundles once, reuses one browser).
// usage: node scripts/stills.mjs [outDir] [frame,frame,...]
// env:   GL=swangle (default "angle"), BROWSER=/path/to/chrome (optional)
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const outDir = path.resolve(process.argv[2] ?? "screenshots");
const frames = (process.argv[3] ?? "75,150,240,345,435").split(",").map(Number);
const names = process.env.COMP === "FlythroughHF" ? { 75: "01-intro", 150: "02-expansion", 270: "03-flythrough", 355: "04-overview", 435: "05-ending" } : { 75: "01-intro", 150: "02-expansion", 240: "03-flythrough", 345: "04-overview", 435: "05-ending" };
const gl = process.env.GL ?? "angle";
const compId = process.env.COMP ?? "Flythrough";
fs.mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", {
  browserExecutable: process.env.BROWSER ?? null,
  chromiumOptions: { gl },
});
const composition = await selectComposition({ serveUrl, id: compId, puppeteerInstance: browser, chromiumOptions: { gl } });
for (const f of frames) {
  const file = path.join(outDir, `${names[f] ?? "frame"}-f${String(f).padStart(3, "0")}.png`);
  await renderStill({ composition, serveUrl, frame: f, output: file, puppeteerInstance: browser, chromiumOptions: { gl } });
  console.log("wrote", file);
}
await browser.close({ silent: true });
