// Check output/webtoon-test.mp4: 1080×1920, 30 fps, frame count = timing.json (set by the panel holds in panels.json), H.264 + AAC,
// and save one frame from the middle of every scene to output/stills/ for a visual check.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";

const OUT = "output/webtoon-test.mp4";
const timing = JSON.parse(readFileSync("src/data/timing.json", "utf8"));
const run = (args) => execFileSync("npx", args, { encoding: "utf8", shell: process.platform === "win32" });
const probe = JSON.parse(run(["remotion", "ffprobe", "-v", "error", "-count_frames", "-show_entries",
  "stream=codec_type,codec_name,width,height,r_frame_rate,nb_read_frames,sample_rate,channels:format=duration", "-of", "json", OUT]));
const v = probe.streams.find((s) => s.codec_type === "video");
const a = probe.streams.find((s) => s.codec_type === "audio");
const checks = [
  ["resolution 1080×1920", v.width === 1080 && v.height === 1920, `${v.width}×${v.height}`],
  ["30 fps", v.r_frame_rate === "30/1", v.r_frame_rate],
  [`frames = ${timing.totalFrames}`, Number(v.nb_read_frames) === timing.totalFrames, v.nb_read_frames],
  ["video codec H.264", v.codec_name === "h264", v.codec_name],
  ["audio AAC", !!a && a.codec_name === "aac", a ? `${a.codec_name} ${a.sample_rate} Hz ${a.channels}ch` : "none"],
  ["duration", Math.abs(Number(probe.format.duration) - timing.totalFrames / 30) < 0.05, `${Number(probe.format.duration).toFixed(3)} s`],
];
let ok = true;
for (const [name, pass, got] of checks) {
  console.log(`${pass ? "✔" : "✘"} ${name.padEnd(22)} ${got}`);
  ok &&= pass;
}
mkdirSync("output/stills", { recursive: true });
for (const [i, s] of timing.items.entries()) {
  const t = ((s.arrive + s.leave) / 2 / 30).toFixed(3);
  run(["remotion", "ffmpeg", "-loglevel", "error", "-y", "-ss", t, "-i", OUT, "-frames:v", "1", `output/stills/item-${String(i).padStart(2, "0")}.png`]);
}
console.log(`stills → output/stills/item-00.png … item-${String(timing.items.length - 1).padStart(2, "0")}.png`);
process.exit(ok ? 0 : 1);
