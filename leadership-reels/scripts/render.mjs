// Render output/leadership-reels.mp4 (H.264 + AAC).
// Video is rendered muted, then the premixed track (public/audio/track.mp4) is copied in with ffmpeg,
// so the audio is not re-encoded a second time (keeps it in sync and at full level).
// Extra args are passed to `remotion render`, e.g.  npm run render -- --concurrency=4
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";

const ENTRY = "src/index.ts";
const COMP = "LeadershipReel";
const OUT = "output/leadership-reels.mp4";
const TMP = "output/.video-muted.mp4";
const TRACK = "public/audio/track.mp4";

const npx = (args) => execFileSync("npx", args, { stdio: "inherit", shell: process.platform === "win32" });

if (!existsSync(TRACK)) {
  console.error(`${TRACK} is missing — run: npm run audio`);
  process.exit(1);
}
mkdirSync("output", { recursive: true });
npx(["remotion", "render", ENTRY, COMP, TMP, "--codec=h264", "--crf=18", "--pixel-format=yuv420p", "--muted", ...process.argv.slice(2)]);
npx(["remotion", "ffmpeg", "-loglevel", "error", "-y", "-i", TMP, "-i", TRACK, "-map", "0:v:0", "-map", "1:a:0",
  "-c", "copy", "-shortest", "-movflags", "+faststart", OUT]);
rmSync(TMP, { force: true });
console.log(`\n✔ ${OUT}`);
