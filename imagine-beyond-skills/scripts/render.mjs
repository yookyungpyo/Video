// Render output/imagine-beyond-skills.mp4 (H.264 + AAC, 1080×1920, 30 fps).
// The video is rendered muted, then the premixed track (public/audio/track.mp4) is copied in unchanged.
// Extra args go to `remotion render`, e.g.  npm run render -- --concurrency=4
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";

const ENTRY = "src/index.ts";
const COMP = "ImagineBeyondSkills";
const OUT = "output/imagine-beyond-skills.mp4";
const TMP = "output/.video-muted.mp4";
const TRACK = "public/audio/track.mp4";
const npx = (args) => execFileSync("npx", args, { stdio: "inherit", shell: process.platform === "win32" });

if (!existsSync("public/scenes") || readdirSync("public/scenes").length < 8) {
  console.log("public/scenes is empty — splitting the storyboard first");
  execFileSync(process.platform === "win32" ? "python" : "python3", ["scripts/split_storyboard.py"], { stdio: "inherit" });
}
if (!existsSync(TRACK)) {
  console.error(`${TRACK} is missing — run: npm run audio`);
  process.exit(1);
}
mkdirSync("output", { recursive: true });
npx(["remotion", "render", ENTRY, COMP, TMP, "--codec=h264", "--crf=18", "--muted", ...process.argv.slice(2)]);
npx(["remotion", "ffmpeg", "-loglevel", "error", "-y", "-i", TMP, "-i", TRACK, "-map", "0:v:0", "-map", "1:a:0",
  "-c", "copy", "-movflags", "+faststart", OUT]); // no -shortest: the track is built to the exact length, and -shortest can drop the last video frame
rmSync(TMP, { force: true });
console.log(`\n✔ ${OUT}   (check it with: npm run verify)`);
