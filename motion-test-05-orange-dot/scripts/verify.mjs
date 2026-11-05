// Verify output/the-orange-dot.mp4: format + single-frame flicker detection.
import { execFileSync } from "node:child_process";
const file = process.argv[2] ?? "output/the-orange-dot.mp4";
const s = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries",
  "stream=codec_name,width,height,r_frame_rate,nb_read_frames,pix_fmt", "-of", "json", file]).toString()).streams[0];
console.log(s);
const ok = s.codec_name === "h264" && s.width === 1920 && s.height === 1080 && s.r_frame_rate === "60/1" && Number(s.nb_read_frames) === 1200;
console.log(ok ? "format OK (h264 1920x1080 60fps 1200 frames)" : "FORMAT MISMATCH");
const out = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-vf", "scale=480:-1,signalstats,metadata=print:key=lavfi.signalstats.YDIF:file=-", "-f", "null", "-"], { maxBuffer: 64e6 }).toString();
const y = [...out.matchAll(/YDIF=([\d.]+)/g)].map((m) => Number(m[1]));
const flick = [];
for (let i = 1; i < y.length - 1; i++) {
  const base = (y[i - 1] + (y[i + 2] ?? y[i - 1])) / 2;
  if (y[i] > 6 && y[i + 1] > 6 && y[i] > base * 4 && y[i + 1] > base * 4) flick.push(i);
}
const max = y.reduce((m, v, i) => (v > m.v ? { v, i } : m), { v: 0, i: 0 });
console.log(`frames: ${y.length}, max YDIF ${max.v.toFixed(2)} at frame ${max.i} (${(max.i / 60).toFixed(2)}s)`);
console.log(flick.length ? `possible flicker at: ${flick.join(", ")}` : "no single-frame flicker detected");
process.exit(ok && !flick.length ? 0 : 1);
