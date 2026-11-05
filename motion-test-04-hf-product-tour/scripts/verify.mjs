// Verify the rendered MP4: format checks + single-frame flicker detection.
// A "flicker" = frame whose luma change vs. previous is a spike that the next
// frame immediately reverses (A→B→A pattern), which smooth motion never produces.
import { execFileSync } from "node:child_process";

const file = process.argv[2] ?? "output/hf-product-tour.mp4";
const probe = JSON.parse(
  execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries",
    "stream=codec_name,width,height,r_frame_rate,nb_read_frames", "-of", "json", file]).toString(),
).streams[0];
console.log("video:", probe);
const ok = probe.codec_name === "h264" && probe.width === 1920 && probe.height === 1080 && probe.r_frame_rate === "30/1" && Number(probe.nb_read_frames) === 600;
console.log(ok ? "format OK (h264 1920x1080 30fps 600 frames)" : "FORMAT MISMATCH");

const out = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-vf", "scale=480:-1,signalstats,metadata=print:key=lavfi.signalstats.YDIF:file=-", "-f", "null", "-"], { maxBuffer: 64e6 }).toString();
const ydif = [...out.matchAll(/YDIF=([\d.]+)/g)].map((m) => Number(m[1]));
const flick = [];
for (let i = 1; i < ydif.length - 1; i++) {
  const a = ydif[i], b = ydif[i + 1], base = (ydif[i - 1] + (ydif[i + 2] ?? ydif[i - 1])) / 2;
  if (a > 6 && b > 6 && a > base * 4 && b > base * 4) flick.push(i);
}
const max = ydif.reduce((m, v, i) => (v > m.v ? { v, i } : m), { v: 0, i: 0 });
console.log(`frames analysed: ${ydif.length}, max YDIF ${max.v.toFixed(2)} at frame ${max.i}`);
console.log(flick.length ? `possible flicker at frames: ${flick.join(", ")}` : "no single-frame flicker detected");
process.exit(ok && !flick.length ? 0 : 1);
