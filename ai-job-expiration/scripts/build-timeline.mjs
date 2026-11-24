// Turn src/config/chat.json (what is said, speeds, pauses, holds) into src/data/timeline.json: the exact frame of
// every typed character, every send, every streamed piece of an answer, every zoom and every sound cue.
// Both the film (Remotion) and the sound track (scripts/build_audio.py) read that one file, so they cannot drift.
//
//   npm run timeline
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const cfg = JSON.parse(readFileSync("src/config/chat.json", "utf8"));
const seg = new Intl.Segmenter("ko", { granularity: "grapheme" });
/** whole characters: a Hangul syllable or an emoji is one unit — nothing is ever split into jamo */
const chars = (s) => [...seg.segment(s)].map((x) => x.segment);
let seed = cfg.seed >>> 0;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

let f = cfg.startDelay;                 // the running clock, in frames (fractions are kept, frames are rounded on output)
const messages = [];                    // everything that becomes a bubble
const keys = [], sends = [], pieces = [], thinks = [], zooms = [], hits = [], music = [];
let heartbeat = null, fade = null, ending = null, lastUser = null, pendingZoomOut = null;
const scenes = {};
const mark = (n) => { if (n && scenes[n] === undefined) scenes[n] = Math.round(f); };

for (const s of cfg.steps) {
  mark(s.scene);
  if (s.type === "user") {
    f += s.before ?? 0;
    if (pendingZoomOut) { pendingZoomOut.out = Math.round(f); pendingZoomOut = null; }     // the camera returns when the next question starts
    if (s.music === "low-in") music.push({ kind: "low", from: Math.round(f) });
    const typeFrom = Math.round(f);
    const typed = [];                   // [{ line, count, frame }]: after `frame`, `count` characters of `line` are in the input field
    s.lines.forEach((line, li) => {
      if (li > 0) { f += cfg.user.lineBreakPause; keys.push({ f: Math.round(f), kind: "enter" }); }
      chars(line).forEach((ch, ci) => {
        const j = s.even ? 1 : 1 - cfg.user.jitter / 2 + cfg.user.jitter * rnd();            // uneven, like real typing
        f += s.perChar * j * (ch === " " ? 0.8 : 1);
        typed.push({ line: li, count: ci + 1, f: Math.round(f) });
        keys.push({ f: Math.round(f), kind: ch === " " ? "space" : "key" });
        if (!s.even && /[.,?!]/.test(ch)) f += cfg.user.punctuationPause * (0.6 + 0.8 * rnd());
      });
    });
    f += cfg.user.afterTyping;
    const press = Math.round(f);
    f += cfg.user.pressFrames;
    const sent = Math.round(f);
    sends.push({ f: press, sent });
    if (s.music === "stop-on-send") music.push({ kind: "stop", at: press });
    lastUser = { id: s.id, role: "user", scene: s.scene, lines: s.lines.map((t) => ({ text: t, chars: chars(t).length })), typeFrom, typed, press, appear: sent };
    messages.push(lastUser);
  } else if (s.type === "ai") {
    f += cfg.ai.replyDelay;
    const thinkFrom = Math.round(f);
    f += s.think;
    const thinkTo = Math.round(f);
    thinks.push({ from: thinkFrom, to: thinkTo, silent: !!s.silent, label: s.thinkLabel ?? null });
    const m = { id: s.id, role: "ai", scene: s.scene, thinkFrom, thinkTo, thinkLabel: s.thinkLabel ?? null, appear: s.thinkLabel ? thinkTo : thinkFrom, lines: [] };
    s.lines.forEach((l, li) => {
      f += l.before ?? 0;
      const cs = chars(l.text);
      const steps = [];                 // [{ count, f }]: after `f`, `count` characters of the line are shown
      const from = Math.round(f);
      if (l.mode === "char") {
        cs.forEach((ch, i) => { if (ch !== " ") { f += l.perChar; steps.push({ count: i + 1, f: Math.round(f) }); } });
      } else {
        // streaming: word by word; longer words arrive in two or three pieces
        let i = 0;
        while (i < cs.length) {
          let j = i;
          while (j < cs.length && cs[j] !== " ") j++;
          let len = j - i;
          while (len > 0) {
            const take = len <= 3 ? len : Math.min(len, 2 + Math.floor(rnd() * 2));
            i += take; len -= take;
            f += l.perChar * take * (0.8 + 0.4 * rnd());
            steps.push({ count: i + (len === 0 && i < cs.length ? 1 : 0), f: Math.round(f) });
          }
          i = j + 1;
        }
      }
      steps.forEach((st) => pieces.push({ f: st.f, id: s.id, tone: l.tone ?? "white", silent: !!s.silent }));
      m.lines.push({ text: l.text, chars: cs.length, tone: l.tone ?? "white", from, steps, to: Math.round(f) });
      if (s.zoom && s.zoom.line === li) { pendingZoomOut = { id: s.id, line: li, scale: s.zoom.scale, from, in: from + s.zoom.frames, out: null }; zooms.push(pendingZoomOut); }
      (s.sfx ?? []).filter((x) => x.line === li).forEach((x) => hits.push({ f: Math.round(from + (f - from) * x.at), kind: x.kind }));
      if (s.heartbeat && li === 1) heartbeat = { from };
    });
    m.done = Math.round(f);
    m.cursorOff = m.done + cfg.ai.cursorOff;
    if (s.music === "stop-on-done") music.push({ kind: "stop", at: m.done });
    f += s.hold;
    if (s.heartbeat && heartbeat) heartbeat.to = Math.round(f);
    messages.push(m);
  } else if (s.type === "silence") {
    f += s.frames;
  } else if (s.type === "fade") {
    if (pendingZoomOut) { pendingZoomOut.out = Math.round(f); pendingZoomOut = null; }
    fade = { from: Math.round(f), to: Math.round(f + s.frames) };
    f += s.frames;
  } else if (s.type === "ending") {
    f += s.before ?? 0;
    const lines = [];
    s.lines.forEach((l) => {
      f += l.before ?? 0;
      const from = Math.round(f);
      const steps = [];
      chars(l.text).forEach((ch, i) => { f += l.perChar * (ch === " " ? 0.6 : 1); steps.push({ count: i + 1, f: Math.round(f) }); if (ch !== " ") keys.push({ f: Math.round(f), kind: "ending" }); });
      lines.push({ text: l.text, tone: l.tone, from, steps, to: Math.round(f) });
    });
    hits.push({ f: lines.at(-1).to, kind: "final" });
    ending = { from: lines[0].from - (s.before ?? 0), lines, caption: s.caption, captionAt: lines.at(-1).to + 12 };
    f += s.hold;
  }
}
const heartbeatEnd = music.find((m) => m.kind === "stop")?.at;
if (heartbeat) heartbeat.to = heartbeatEnd ?? heartbeat.to;      // it keeps beating until the music is cut
const totalFrames = Math.round(f);
const out = { fps: cfg.fps, totalFrames, totalSeconds: +(totalFrames / cfg.fps).toFixed(2), scenes, messages, sends, keys, pieces, thinks, zooms, hits, heartbeat, music, fade, ending };
mkdirSync("src/data", { recursive: true });
writeFileSync("src/data/timeline.json", JSON.stringify(out) + "\n");
const sec = (x) => (x / cfg.fps).toFixed(2).padStart(6);
console.log(`timeline: ${totalFrames} frames = ${out.totalSeconds}s`);
for (const m of messages) console.log(m.role === "user" ? `  ${m.id}  type ${sec(m.typeFrom)}s  send ${sec(m.appear)}s   ${m.lines.map((l) => l.text).join(" / ")}` : `  ${m.id}  think ${sec(m.thinkFrom)}s  text ${sec(m.lines[0].from)}–${sec(m.done)}s   ${m.lines.map((l) => l.text).join(" / ")}`);
console.log(`  fade ${sec(fade.from)}–${sec(fade.to)}s   ending ${ending.lines.map((l) => `${sec(l.from)}–${sec(l.to)}s`).join("  ")}   end ${sec(totalFrames)}s`);
