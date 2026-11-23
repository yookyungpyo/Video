// Write caption-timeline.json: every on-screen line with the time it appears and leaves, resolved from
// src/data/captions.json (what is shown, where) and src/data/timing.json (when the narration says it).
//   npm run timeline
import { readFileSync, writeFileSync } from "node:fs";

const timing = JSON.parse(readFileSync("src/data/timing.json", "utf8"));
const { blocks } = JSON.parse(readFileSync("src/data/captions.json", "utf8"));
const FPS = timing.fps;
const scene = Object.fromEntries(timing.scenes.map((s) => [s.n, s]));
const last = timing.scenes.at(-1).n;
// length (frames) of the change INTO each scene — keep in step with src/config/motion.ts; captions leave half of it before the cut
const ENTER = { 2: 10, 3: 0, 4: 10, 5: 22, 6: 12, 7: 12, 8: 14, 9: 0 };
const lead = (n) => (n === last ? 0 : Math.max(2, Math.round((ENTER[n + 1] ?? 0) / 2)));
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
    const end = l.out ? cue(b.scene, l.out[0], l.out[1] ?? 0) : scene[b.scene].to - lead(b.scene);
    lines.push({ scene: b.scene, text: l.parts.map((p) => p.t).join(""), emphasis: l.parts.filter((p) => p.c === "coral" || p.c === "red").map((p) => p.t.trim()), animation: l.anim ?? "rise",
      position: b.place, start: sec(start), end: sec(end), startFrame: start, endFrame: end });
  }
}
lines.sort((a, b) => a.startFrame - b.startFrame);
const out = {
  title: "AI 에이전트 100개? 결국 SLOP이다.", fps: FPS, totalFrames: timing.totalFrames, totalSeconds: sec(timing.totalFrames),
  scenes: timing.scenes.map((s) => ({ scene: s.n, start: sec(s.from), end: sec(s.to), voiceEnd: sec(s.voiceEnd),
    narration: s.chunks.map((c) => ({ start: sec(c.start), text: c.text })) })),
  captions: lines,
};
writeFileSync("caption-timeline.json", JSON.stringify(out, null, 1) + "\n");
console.log(`caption-timeline.json: ${lines.length} lines, ${timing.scenes.length} scenes, ${out.totalSeconds}s`);
