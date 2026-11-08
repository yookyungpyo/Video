// Copies the source assets (repo/assets/trends) into Remotion's public/ folder.
// public/* is git-ignored in this repo, so this runs before preview and render.
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const SRC = join("..", "assets", "trends");
const IMAGES = ["01_ennui.png", "02_life-roi.png", "03_form-factor.png", "04_have-a-go.png", "05_archive.png",
  "06_vibe-working.png", "07_retention.png", "08_human-edge.png", "09_half-signal.png", "10_taste.png"];
const missing = IMAGES.filter((f) => !existsSync(join(SRC, f)));
if (!existsSync(join(SRC, "audio", "track.mp4"))) missing.push("audio/track.mp4 (run: python scripts/alpha-sheep/build_audio.py)");
if (missing.length) {
  console.error("Missing in assets/trends/:\n  " + missing.join("\n  "));
  process.exit(1);
}
mkdirSync(join("public", "trends"), { recursive: true });
mkdirSync(join("public", "alpha-sheep"), { recursive: true });
for (const f of IMAGES) copyFileSync(join(SRC, f), join("public", "trends", f));
copyFileSync(join(SRC, "audio", "track.mp4"), join("public", "alpha-sheep", "track.mp4"));
console.log(`prepared ${IMAGES.length} images + track → public/`);
