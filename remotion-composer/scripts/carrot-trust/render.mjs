// carrot-trust-reel — full render (Windows / macOS / Linux). Extra args go to `remotion render`.
// 1) copy assets → public  2) render picture (H.264, muted)  3) attach the track by stream copy
// 4) write review stills to output/stills  5) copy carrot-trust.srt to output/
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const win = process.platform === "win32";
const npx = (args) => execFileSync("npx", args, { stdio: "inherit", shell: win });
execFileSync("node", ["scripts/carrot-trust/prepare.mjs"], { stdio: "inherit" });
mkdirSync(join("output", "stills"), { recursive: true });
const TMP = join("output", "_carrot-video.mp4");
const OUT = join("output", "carrot-trust-final.mp4");
npx(["remotion", "render", "src/carrot-trust-reel/index.tsx", "CarrotTrust", TMP, "--codec=h264", "--crf=18", "--muted", ...process.argv.slice(2)]);
npx(["remotion", "ffmpeg", "-loglevel", "error", "-y", "-i", TMP, "-i", join("..", "assets", "carrot-trust", "audio", "track.mp4"),
  "-map", "0:v:0", "-map", "1:a:0", "-c", "copy", "-shortest", "-movflags", "+faststart", OUT]);
rmSync(TMP, { force: true });
// review stills: one frame inside each key sentence
const timing = JSON.parse(readFileSync("src/carrot-trust-reel/timing.json", "utf8"));
const pick = ["hook", "post", "chips", "surround", "thought1", "reshoot", "samePrice", "diffImpression", "thought2", "guess", "clue",
  "firstMeet", "docs", "onTime", "thought3", "prepare", "organize", "notProve", "skill", "trust"];
const sents = timing.sections.flatMap((s) => s.sentences);
pick.forEach((id, i) => {
  const s = sents.find((x) => x.id === id);
  const fr = id === "trust" ? s.end + 30 : Math.round((s.start + s.end) / 2);
  npx(["remotion", "ffmpeg", "-loglevel", "error", "-y", "-ss", ((fr + 0.5) / 30).toFixed(3), "-i", OUT, "-frames:v", "1",
    join("output", "stills", `${String(i + 1).padStart(2, "0")}_${id}.png`)]);
});
copyFileSync(join("..", "assets", "carrot-trust", "narration", "carrot-trust.srt"), join("output", "carrot-trust.srt"));
console.log(`Done: ${OUT}, output/carrot-trust.srt, output/stills/`);
