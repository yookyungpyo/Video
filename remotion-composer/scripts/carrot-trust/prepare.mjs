// Copies originals (repo/assets/carrot-trust) into public/images (working copies) + the audio track.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SRC = join("..", "assets", "carrot-trust");
const IMAGES = ["01_messy_listing.png", "02_buyer_hesitates.png", "03_clean_listing.png", "04_buyer_interested.png", "05_neat_appearance.png",
  "06_prepared_documents.png", "07_ready_for_meeting.png", "08_attentive_listening.png", "09_opportunity_to_explain.png"];
const missing = IMAGES.filter((f) => !existsSync(join(SRC, f)));
if (missing.length) {
  console.error("Missing images in assets/carrot-trust/ (no substitutes are used):\n  " + missing.join("\n  "));
  process.exit(1);
}
const track = join(SRC, "audio", "track.mp4");
if (!existsSync(track)) {
  console.error("Missing assets/carrot-trust/audio/track.mp4 — run: npm run carrot:audio");
  process.exit(1);
}
mkdirSync(join("public", "images"), { recursive: true });
mkdirSync(join("public", "audio"), { recursive: true });
for (const f of IMAGES) copyFileSync(join(SRC, f), join("public", "images", f));
copyFileSync(track, join("public", "audio", "carrot-trust-track.mp4"));
console.log(`prepared ${IMAGES.length} images + track → public/`);
