// Write caption-timeline.json: every on-screen line with the time it appears and leaves, resolved from
// src/data/captions.json (what is shown, where) and src/data/timing.json (when the narration says it).
//   npm run timeline
import { readFileSync, writeFileSync } from "node:fs";

const timing = JSON.parse(readFileSync("src/data/timing.json", "utf8"));
const { blocks } = JSON.parse(readFileSync("src/data/captions.json", "utf8"));
const FPS = timing.fps;
const scene = Object.fromEntries(timing.scenes.map((s) => [s.n, s]));
const last = timing.scenes.at(-1).n;
const cue = (n, i, part = 0) => {
  const t = scene[n];
  const a = t.chunks[i].start;
  const b = i + 1 < t.chunks.length ? t.chunks[i + 1].start : t.voiceEnd;
  return Math.round(a + (b - a) * part);
};
const sec = (f) => +(f / FPS).toFixed(2);
const lines = [];
for (const b of blocks) {
  for (const l of b.lines) {
    const start = cue(b.scene, l.at[0], l.at[1] ?? 0);
    const end = l.out ? cue(b.scene, l.out[0], l.out[1] ?? 0) : scene[b.scene].to - (b.scene === last ? 0 : 2);
    lines.push({ scene: b.scene, text: l.parts.map((p) => p.t).join(""), emphasis: l.parts.filter((p) => p.k === "bold").map((p) => p.t),
      position: b.place, start: sec(start), end: sec(end), startFrame: start, endFrame: end });
  }
}
lines.sort((a, b) => a.startFrame - b.startFrame);
const out = {
  title: "리더는 그 중간 어디쯤", fps: FPS, totalFrames: timing.totalFrames, totalSeconds: sec(timing.totalFrames),
  scenes: timing.scenes.map((s) => ({ scene: s.n, start: sec(s.from), end: sec(s.to), voiceEnd: sec(s.voiceEnd),
    narration: s.chunks.map((c) => ({ start: sec(c.start), text: c.text })) })),
  captions: lines,
};
writeFileSync("caption-timeline.json", JSON.stringify(out, null, 1) + "\n");
console.log(`caption-timeline.json: ${lines.length} lines, ${timing.scenes.length} scenes, ${out.totalSeconds}s`);
