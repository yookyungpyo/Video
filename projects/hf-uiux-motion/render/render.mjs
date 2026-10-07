// Usage: node render/render.mjs stills 40 86 150 230   |   node render/render.mjs full
import { createRequire } from "module";
import http from "http"; import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require("/opt/node-tools/node_modules/playwright")); }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".otf": "font/otf" };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;

const [mode, ...args] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
page.on("pageerror", e => console.error("[page]", e.message));
await page.goto(url);
await page.evaluate(() => window.__ready);
const status = await page.evaluate(() => window.__status);
console.log("status", JSON.stringify(status));
if (!status.fontOK) { console.error("FONT FALLBACK — aborting"); process.exit(1); }

const shoot = async (f, file) => {
  await page.evaluate(fr => window.seekFrame(fr), f);
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 1080, height: 1080 }, type: "png" });
};
if (mode === "stills") {
  const out = path.join(ROOT, "render", "stills"); fs.mkdirSync(out, { recursive: true });
  for (const a of args) { const f = parseFloat(a); await shoot(f, path.join(out, `f${a}.png`)); console.log("still", a); }
} else {
  // 59.94 fps master: evaluate f0, f0.5, f1 … through the same timeline (no frame duplication)
  const out = path.join(ROOT, "render", "frames"); fs.mkdirSync(out, { recursive: true });
  const N = Math.round(12.075 * 60000 / 1001);
  for (let i = 0; i < N; i++) {
    await shoot(i / 2, path.join(out, `${String(i).padStart(5, "0")}.png`));
    if (i % 60 === 0) console.log(`frame ${i}/${N} (f${i / 2})`);
  }
}
await browser.close(); server.close();
