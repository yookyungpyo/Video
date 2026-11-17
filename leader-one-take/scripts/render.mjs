// Final render: output/leader-one-take.mp4 (H.264, 1080x1920, 30 fps, 1650 frames).
// Scans public/ first, so only files that exist are referenced. With no audio files the film gets a silent
// audio track (some players and upload forms reject an MP4 without one).
// Extra arguments go to `remotion render`, e.g.  npm run render -- --concurrency=4
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";

const run = (cmd, args) => execFileSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
run("node", ["scripts/scan-assets.mjs"]);
const { audio } = JSON.parse(readFileSync("src/generated/assets.json", "utf8"));
const hasAudio = audio.narration || audio.bgm || Object.keys(audio.sceneNarration).length > 0;
mkdirSync("output", { recursive: true });
const OUT = "output/leader-one-take.mp4";
run("npx", ["remotion", "render", "src/index.ts", "LeaderOneTake", OUT, "--codec=h264", "--crf=18", "--pixel-format=yuv420p",
  ...(hasAudio ? [] : ["--enforce-audio-track"]), ...process.argv.slice(2)]);
console.log(`\n✔ ${OUT}${hasAudio ? "" : "  (no audio files found → silent)"}   check it with: npm run verify`);
