// Renders no-persuade-clay and attaches the ORIGINAL audio track untouched.
//
//   npm run clay:render                    (extra args go to `remotion render`)
//
// Step 1: Remotion renders the picture (H.264, muted).
// Step 2: Remotion's bundled ffmpeg attaches the audio track of
//         public/no-persuade-clay/original.mp4 as stereo AAC (the mono voice on
//         both channels, same level, same timing — stereo plays everywhere).
// Letting Remotion mix the audio shifted it ~43 ms late and lowered it 3 dB;
// this path keeps it in sync with the original video (verified lag 0).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";

const ENTRY = "src/no-persuade-clay/index.tsx";
const COMP = "NoPersuadeClay";
const AUDIO_SRC = "public/no-persuade-clay/original.mp4";
const TMP = "output/_no-persuade-clay-video.mp4";
const OUT = "output/no-persuade-clay-final.mp4";

const need = ["public/no-persuade-clay/01_persuasion.png", "public/no-persuade-clay/02_exhausted.png",
  "public/no-persuade-clay/03_action.png", "public/no-persuade-clay/04_open_door.png",
  "public/no-persuade-clay/05_no_change.png", AUDIO_SRC];
const missing = need.filter((p) => !existsSync(p));
if (missing.length) {
  console.error("Missing required files:\n  " + missing.join("\n  "));
  process.exit(1);
}
mkdirSync("output", { recursive: true });

const run = (args) => execFileSync("npx", args, { stdio: "inherit", shell: process.platform === "win32" });
run(["remotion", "render", ENTRY, COMP, TMP, "--codec=h264", "--muted", ...process.argv.slice(2)]);
run(["remotion", "ffmpeg", "-loglevel", "error", "-y", "-i", TMP, "-i", AUDIO_SRC,
  "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
  "-af", "pan=stereo|c0=c0|c1=c0", // mono narration on both channels, full level
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", OUT]);
rmSync(TMP, { force: true });
console.log(`Done: ${OUT}`);
