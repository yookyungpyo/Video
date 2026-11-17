// Looks at public/ and writes src/generated/assets.json: which pictures, layers, extra views and audio files
// really exist, and how large the pictures are. The film only ever references files listed there, so a missing
// file can never break a render — a missing picture becomes a placeholder, missing audio means a silent film.
// Runs automatically before `npm run preview` and `npm run render`. Run `npm run assets` after adding files
// while the preview is open.
import { closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, readSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUB = join(ROOT, "public");
const IMG_EXT = ["png", "jpg", "jpeg", "webp"];
const AUDIO_EXT = ["mp3", "wav", "m4a", "aac"];
const SCENES = Array.from({ length: 8 }, (_, i) => `scene-${String(i + 1).padStart(2, "0")}`);
const AUX = ["scene-02-alt", "scene-05-top", "scene-08-top"];

/** Width and height from the file header (PNG, JPEG, WebP) — no image library needed. */
function imageSize(file) {
  const fd = openSync(file, "r");
  try {
    const b = Buffer.alloc(256 * 1024);
    const n = readSync(fd, b, 0, b.length, 0);
    if (b.toString("ascii", 1, 4) === "PNG") return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
    if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
      const kind = b.toString("ascii", 12, 16);
      if (kind === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
      if (kind === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
      if (kind === "VP8L") { const v = b.readUInt32LE(21); return { width: 1 + (v & 0x3fff), height: 1 + ((v >> 14) & 0x3fff) }; }
    }
    if (b[0] === 0xff && b[1] === 0xd8) {
      let p = 2;
      while (p + 9 < n) {
        if (b[p] !== 0xff) { p++; continue; }
        const m = b[p + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { width: b.readUInt16BE(p + 7), height: b.readUInt16BE(p + 5) };
        p += 2 + b.readUInt16BE(p + 2);
      }
    }
  } finally {
    closeSync(fd);
  }
  throw new Error(`cannot read the size of ${file} (use PNG, JPEG or WebP)`);
}

const find = (dir, stem, exts) => {
  for (const e of exts) if (existsSync(join(PUB, dir, `${stem}.${e}`))) return `${dir}/${stem}.${e}`;
  return null;
};
const picture = (src, kind) => (src ? { src, kind, ...imageSize(join(PUB, src)) } : null);

const assets = { images: {}, layers: {}, aux: {}, audio: { narration: null, bgm: null, sceneNarration: {}, lineTiming: {} } };
for (const id of SCENES) {
  assets.images[id] = picture(find("images", id, IMG_EXT), "final") ?? picture(find("images/draft", id, IMG_EXT), "draft");
  const layers = Object.fromEntries(["bg", "mid", "fg"].map((l) => [l, picture(find("images/layers", `${id}-${l}`, IMG_EXT), "layer")]));
  assets.layers[id] = layers.bg ? layers : null;        // layers only count when the background layer exists
  const line = find("audio/narration", id, AUDIO_EXT);
  if (line) assets.audio.sceneNarration[id] = line;
}
for (const key of AUX) assets.aux[key] = picture(find("images", key, IMG_EXT), "final");
// where each subtitle line is spoken inside its scene clip (written by scripts/split_narration.py); optional
const timingFile = join(PUB, "audio", "narration", "timing.json");
if (existsSync(timingFile)) {
  const timing = JSON.parse(readFileSync(timingFile, "utf8")).scenes ?? {};
  for (const id of Object.keys(assets.audio.sceneNarration)) {
    if (timing[id]) assets.audio.lineTiming[id] = { duration: timing[id].duration, lines: timing[id].lines.map(({ start, end }) => ({ start, end })) };
  }
}
assets.audio.narration = find("audio", "narration", AUDIO_EXT);
assets.audio.bgm = find("audio", "bgm", AUDIO_EXT);

mkdirSync(join(ROOT, "src", "generated"), { recursive: true });
writeFileSync(join(ROOT, "src", "generated", "assets.json"), JSON.stringify(assets, null, 2) + "\n");

const kinds = SCENES.map((id) => assets.images[id]?.kind ?? "placeholder");
const count = (k) => kinds.filter((x) => x === k).length;
console.log(`pictures: ${count("final")} final, ${count("draft")} draft, ${count("placeholder")} placeholder`
  + `   layers: ${SCENES.filter((id) => assets.layers[id]).length}/8   extra views: ${AUX.filter((k) => assets.aux[k]).length}/3`
  + `   audio: narration ${assets.audio.narration || Object.keys(assets.audio.sceneNarration).length ? "yes" : "none"}, bgm ${assets.audio.bgm ? "yes" : "none"}`);
if (existsSync(join(PUB, "images"))) {
  const stray = readdirSync(join(PUB, "images")).filter((f) => /\.(png|jpe?g|webp)$/i.test(f) && ![...SCENES, ...AUX].includes(f.replace(/\.[^.]+$/, "")));
  if (stray.length) console.log(`not used (name does not match scene-0X / scene-02-alt / scene-05-top / scene-08-top): ${stray.join(", ")}`);
}
