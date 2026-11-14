// Scene data — everything a scene needs, in one typed list.
//   text (dialogue, punchline)  ← script.json   (also read by scripts/build_audio.py)
//   durations / cue frames      ← timing.json   (built from the real voice lengths — do not edit by hand)
//   image size                  ← cells.json    (written by scripts/split-storyboard.mjs)
//   camera, transition, graphic ← defined here
import script from "./script.json";
import timing from "./timing.json";
import cells from "./cells.json";

/** A moment inside a scene, resolved to a frame with `at()` below. */
export type Anchor =
  | ["start", number?]            // scene start (+ frames)
  | ["line", number, number?]     // start of dialogue line i (+ frames)
  | ["lineEnd", number, number?]  // end of dialogue line i (+ frames)
  | ["caption", number?]          // punchline appears (+ frames)
  | ["end", number?];             // scene end (+ frames)

/** Camera pose: zoom (1 = whole image) and view centre in image coordinates (0–1). */
export type CameraKey = { at: Anchor; z: number; x: number; y: number };
export type CameraMotion = { keys: CameraKey[]; shakeAtCaption?: number };
export type TransitionKind = "cut" | "fade" | "push" | "wipe";
export type Graphic = "none" | "taskPile" | "clockOut" | "thinking" | "confidence" | "subscriptions" | "improve" | "robotWork" | "awkward";

export type DialogueLine = { who: string; voice: "hero" | "boss" | "peer"; text: string; small?: boolean; start: number; end: number };

export type SceneData = {
  sceneId: number;
  title: string;
  image: string;
  aspect: number;
  dialogue: DialogueLine[];
  caption: string;
  duration: number; // frames (from timing.json)
  from: number;
  to: number;
  captionAt: number;
  cameraMotion: CameraMotion;
  transition: TransitionKind; // how this scene comes in
  graphic: Graphic;
  audio: { voices: string[]; lineFiles: string[] }; // which takes/lines this scene uses (mixed into public/audio/track.mp4)
};

const VISUAL: Record<number, { cameraMotion: CameraMotion; transition: TransitionKind; graphic: Graphic }> = {
  // 1 라떼는 부장형 — slow push to the boss's face; on the second line the camera moves to the employee
  1: { transition: "cut", graphic: "none", cameraMotion: { keys: [
    { at: ["start"], z: 1.0, x: 0.5, y: 0.5 },
    { at: ["lineEnd", 0], z: 1.3, x: 0.27, y: 0.27 },
    { at: ["line", 1, 4], z: 1.3, x: 0.27, y: 0.27 },
    { at: ["line", 1, 30], z: 1.12, x: 0.62, y: 0.46 }, // toward the employee — the boss stays in frame
    { at: ["lineEnd", 1], z: 1.13, x: 0.62, y: 0.46 },
    { at: ["caption", 10], z: 1.04, x: 0.5, y: 0.5 },
    { at: ["end"], z: 1.06, x: 0.5, y: 0.5 },
  ] } },
  // 2 일복 터진 에이스형 — fast zoom to the laptop, back out as the work piles up, small shake on the punchline
  2: { transition: "push", graphic: "taskPile", cameraMotion: { shakeAtCaption: 9, keys: [
    { at: ["start"], z: 1.0, x: 0.5, y: 0.5 },
    { at: ["line", 0, 2], z: 1.0, x: 0.5, y: 0.5 },
    { at: ["line", 0, 16], z: 1.22, x: 0.42, y: 0.57 }, // laptop-centred, face still in frame
    { at: ["lineEnd", 0], z: 1.25, x: 0.42, y: 0.57 },
    { at: ["line", 1, 26], z: 1.06, x: 0.55, y: 0.5 },
    { at: ["end"], z: 1.0, x: 0.5, y: 0.5 },
  ] } },
  // 3 조용한 칼퇴 고수형 — starts on the relaxed face, slow zoom-out for the whole scene
  3: { transition: "wipe", graphic: "clockOut", cameraMotion: { keys: [
    { at: ["start"], z: 1.42, x: 0.5, y: 0.26 },
    { at: ["caption"], z: 1.1, x: 0.5, y: 0.4 },
    { at: ["end"], z: 1.0, x: 0.5, y: 0.5 },
  ] } },
  // 4 생각도 외주 준 대리형 — wide for the question, a beat of nothing, then in on the head while it "loads"
  4: { transition: "cut", graphic: "thinking", cameraMotion: { keys: [
    { at: ["start"], z: 1.04, x: 0.45, y: 0.5 },
    { at: ["lineEnd", 0], z: 1.08, x: 0.45, y: 0.5 },
    { at: ["line", 1, -4], z: 1.08, x: 0.45, y: 0.5 },
    { at: ["lineEnd", 1, 14], z: 1.26, x: 0.68, y: 0.36 },
    { at: ["end"], z: 1.3, x: 0.68, y: 0.36 },
  ] } },
  // 5 자신감만 만렙 과장형 — confident push in; freezes on "근거는?"; drifts back out, smaller
  5: { transition: "push", graphic: "confidence", cameraMotion: { keys: [
    { at: ["start"], z: 1.0, x: 0.5, y: 0.5 },
    { at: ["lineEnd", 0], z: 1.3, x: 0.5, y: 0.42 },
    { at: ["line", 2], z: 1.3, x: 0.5, y: 0.42 },
    { at: ["caption"], z: 1.08, x: 0.5, y: 0.48 },
    { at: ["end"], z: 1.04, x: 0.5, y: 0.5 },
  ] } },
  // 6 구독료 부자형 — lively drift while the tools pile up, then everything stops dead
  6: { transition: "fade", graphic: "subscriptions", cameraMotion: { keys: [
    { at: ["start"], z: 1.0, x: 0.5, y: 0.5 },
    { at: ["lineEnd", 0], z: 1.14, x: 0.5, y: 0.4 },
    { at: ["lineEnd", 2], z: 1.2, x: 0.5, y: 0.38 },
    { at: ["end"], z: 1.2, x: 0.5, y: 0.38 },
  ] } },
  // 7 몰래 성장하는 실속형 — the calmest move in the film: one steady, slow push
  7: { transition: "fade", graphic: "improve", cameraMotion: { keys: [
    { at: ["start"], z: 1.0, x: 0.5, y: 0.5 },
    { at: ["end"], z: 1.14, x: 0.52, y: 0.44 },
  ] } },
  // 8 AI 부하직원 둔 팀장형 — team leader, then across to the AI robot when he says who the order is for
  8: { transition: "push", graphic: "robotWork", cameraMotion: { keys: [
    { at: ["start"], z: 1.24, x: 0.7, y: 0.38 },
    { at: ["lineEnd", 1], z: 1.28, x: 0.7, y: 0.38 },
    { at: ["line", 2, 4], z: 1.28, x: 0.7, y: 0.38 },
    { at: ["lineEnd", 2, 8], z: 1.3, x: 0.3, y: 0.52 },
    { at: ["caption", 14], z: 1.04, x: 0.5, y: 0.5 },
    { at: ["end"], z: 1.0, x: 0.5, y: 0.5 },
  ] } },
  // 9 입만 AI 전문가형 — the longer he talks the closer we get; then back out to the silent room
  9: { transition: "cut", graphic: "awkward", cameraMotion: { keys: [
    { at: ["start"], z: 1.0, x: 0.5, y: 0.5 },
    { at: ["lineEnd", 2], z: 1.42, x: 0.5, y: 0.44 },
    { at: ["lineEnd", 2, 6], z: 1.42, x: 0.5, y: 0.44 },
    { at: ["lineEnd", 2, 20], z: 1.0, x: 0.5, y: 0.5 },
    { at: ["end"], z: 1.03, x: 0.5, y: 0.55 },
  ] } },
};

export const TIMING = timing;
export const SCRIPT = script;

export const SCENES: SceneData[] = script.scenes.map((s, i) => {
  const t = timing.scenes[i];
  const cell = cells.cells[i];
  return {
    sceneId: s.n,
    title: s.title,
    image: cell.file,
    aspect: cell.aspect,
    dialogue: s.lines.map((l, j) => ({ who: l.who, voice: l.voice as DialogueLine["voice"], text: l.text, small: (l as { small?: boolean }).small, start: t.lines[j].start, end: t.lines[j].end })),
    caption: s.caption,
    duration: t.to - t.from,
    from: t.from,
    to: t.to,
    captionAt: t.captionAt,
    ...VISUAL[s.n],
    audio: {
      voices: [...new Set(s.lines.map((l) => (script.voices as Record<string, { take: string }>)[l.voice].take))],
      lineFiles: s.lines.map((_, j) => `assets/narration/lines/s${String(s.n).padStart(2, "0")}-l${j + 1}.wav`),
    },
  };
});

/** Resolve an anchor to a global frame. */
export const at = (s: SceneData, a: Anchor): number => {
  switch (a[0]) {
    case "start": return s.from + (a[1] ?? 0);
    case "line": return s.dialogue[a[1]].start + (a[2] ?? 0);
    case "lineEnd": return s.dialogue[a[1]].end + (a[2] ?? 0);
    case "caption": return s.captionAt + (a[1] ?? 0);
    case "end": return s.to + (a[1] ?? 0);
  }
};
