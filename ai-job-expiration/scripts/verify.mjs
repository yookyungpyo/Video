// Check ai_job_expiration_final.mp4: 1080×1920, 30 fps, frame count = timeline.json, H.264 yuv420p + AAC, faststart,
// and save one frame per answer to output/stills/ for a visual check.
import { execFileSync } from "node:child_process";
import { closeSync, mkdirSync, openSync, readFileSync, readSync } from "node:fs";

const OUT = "ai_job_expiration_final.mp4";
const timing = JSON.parse(readFileSync("src/data/timeline.json", "utf8"));
const run = (args) => execFileSync("npx", args, { encoding: "utf8", shell: process.platform === "win32" });
const probe = JSON.parse(run(["remotion", "ffprobe", "-v", "error", "-count_frames", "-show_entries",
  "stream=codec_type,codec_name,profile,pix_fmt,width,height,r_frame_rate,nb_read_frames,sample_rate,channels:format=duration", "-of", "json", OUT]));
const v = probe.streams.find((s) => s.codec_type === "video");
const a = probe.streams.find((s) => s.codec_type === "audio");
/** MP4 faststart: the index (moov) is stored before the media data (mdat), so playback can start while loading */
function faststart() {
  const fd = openSync(OUT, "r");
  const head = Buffer.alloc(1 << 20);
  readSync(fd, head, 0, head.length, 0);
  closeSync(fd);
  const moov = head.indexOf("moov"), mdat = head.indexOf("mdat");
  return moov > 0 && (mdat < 0 || moov < mdat);
}
const checks = [
  ["resolution 1080×1920", v.width === 1080 && v.height === 1920, `${v.width}×${v.height}`],
  ["30 fps", v.r_frame_rate === "30/1", v.r_frame_rate],
  [`frames = ${timing.totalFrames}`, Number(v.nb_read_frames) === timing.totalFrames, v.nb_read_frames],
  ["video codec H.264", v.codec_name === "h264", `${v.codec_name} (${v.profile})`],
  ["pixel format yuv420p", v.pix_fmt === "yuv420p", v.pix_fmt],
  ["faststart (moov first)", faststart(), faststart() ? "moov before mdat" : "moov after mdat"],
  ["audio AAC", !!a && a.codec_name === "aac", a ? `${a.codec_name} ${a.sample_rate} Hz ${a.channels}ch` : "none"],
  ["duration", Math.abs(Number(probe.format.duration) - timing.totalFrames / 30) < 0.05, `${Number(probe.format.duration).toFixed(3)} s`],
];
let ok = true;
for (const [name, pass, got] of checks) {
  console.log(`${pass ? "✔" : "✘"} ${name.padEnd(22)} ${got}`);
  ok &&= pass;
}
// one frame per answer (taken when it is complete), the silence and the last frame — for a visual check
mkdirSync("output/stills", { recursive: true });
const shots = [...timing.messages.filter((m) => m.role === "ai").map((m) => [m.id, m.done + 12]), ["silence", timing.fade.from - 5], ["ending", timing.totalFrames - 10]];
for (const [name, f] of shots) {
  run(["remotion", "ffmpeg", "-loglevel", "error", "-y", "-ss", (f / 30).toFixed(3), "-i", OUT, "-frames:v", "1", `output/stills/${name}.png`]);
}
console.log(`stills → output/stills/ (${shots.map((x) => x[0]).join(", ")})`);
process.exit(ok ? 0 : 1);
