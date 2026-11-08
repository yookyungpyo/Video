// ALPHA SHEEP — full render pipeline (Windows / macOS / Linux).
//   npm run as:render            → output/alpha-sheep-story.mp4 + output/scenes/*.mp4 + srt + script
//   extra args are passed to `remotion render` (e.g. --concurrency=4)
// 1) copy assets/trends → public/   2) render picture (H.264, muted)
// 3) attach assets/trends/audio/track.mp4 by stream copy (keeps narration sync exact)
// 4) cut the 10 trend scenes (frame-exact re-encode) from the master
// 5) copy subtitles.srt + narration-script.md to output/
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const timing = JSON.parse(readFileSync("src/alpha-sheep/timing.json", "utf8"));
const SLUG = { "01": "ennui", "02": "life-roi", "03": "form-factor", "04": "have-a-go", "05": "archive",
  "06": "vibe-working", "07": "retention", "08": "human-edge", "09": "half-signal", "10": "taste" };
const win = process.platform === "win32";
const npx = (args) => execFileSync("npx", args, { stdio: "inherit", shell: win });

execFileSync("node", ["scripts/alpha-sheep/prepare.mjs"], { stdio: "inherit" });
mkdirSync(join("output", "scenes"), { recursive: true });
const TMP = join("output", "_alpha-sheep-video.mp4");
const OUT = join("output", "alpha-sheep-story.mp4");
npx(["remotion", "render", "src/alpha-sheep/index.tsx", "AlphaSheepStory", TMP, "--codec=h264", "--crf=18", "--muted", ...process.argv.slice(2)]);
npx(["remotion", "ffmpeg", "-loglevel", "error", "-y", "-i", TMP, "-i", join("..", "assets", "trends", "audio", "track.mp4"),
  "-map", "0:v:0", "-map", "1:a:0", "-c", "copy", "-shortest", "-movflags", "+faststart", OUT]);
rmSync(TMP, { force: true });
for (const s of timing.sections.filter((x) => /^\d+$/.test(x.id))) {
  const out = join("output", "scenes", `${s.id}-${SLUG[s.id]}.mp4`);
  npx(["remotion", "ffmpeg", "-loglevel", "error", "-y", "-ss", (s.start / 30).toFixed(4), "-i", OUT, "-t", (s.frames / 30).toFixed(4),
    "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out]);
}
for (const f of ["subtitles.srt", "narration-script.md"]) copyFileSync(join("..", "assets", "trends", "narration", f), join("output", f));
console.log(`Done: ${OUT}, output/scenes/ (10), output/subtitles.srt, output/narration-script.md`);
