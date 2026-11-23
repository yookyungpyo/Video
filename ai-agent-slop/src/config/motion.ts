// Per-scene motion settings: the camera of every scene and how it comes in. Edit here.
//   z      zoom, 1 = the whole picture across the full width
//   x, y   the point of the picture (0–1) that sits in the middle of the window
// A key is [frame, pose, easing?]; the easing belongs to the move that ENDS at that key (default: sine in-out).
// Frames come from the narration (src/data/timing.json), so the moves follow the voice.
// Light, focus and other per-scene looks are in src/config/effects.tsx.
import { Key, Pose } from "../components/Stage";
import { SCENE_T, SceneTiming, cue } from "../data";
import { easeInOut, easeOut } from "../theme";

export type EnterKind =
  | "lights-on"   // 01: the stage lights come on
  | "flash"       // spotlight flash: the picture burns out to white and the next one comes out of the light
  | "hard"        // hard cut
  | "whip"        // whip pan: both pictures rush sideways
  | "curtain"     // a red curtain (drawn in code) closes over the picture and opens on the next
  | "lights-out"  // the lights are switched off, the next picture comes up in cold light
  | "match"       // match cut on paper: push into the paper stacks, come out of the report
  | "dip"         // short dip to dark
  | "crash";      // hard cut with a jolt: the stage has come down
export type SceneMotion = {
  n: number;
  name: string;
  move: string;                                   // what the camera does, in words (also used in the README)
  enter: { kind: EnterKind; frames: number };     // length of the change, centred on the scene boundary
  keys: (t: SceneTiming) => Key[];
  pivotIn?: [number, number];                     // where the "match" move comes out of / goes into
  pivotOut?: [number, number];
};
const P = (z: number, x: number, y: number): Pose => ({ z, x, y });

export const MOTION: SceneMotion[] = [
  { n: 1, name: "AI 회사의 탄생", move: "빠른 Push In: 무대 전체 → 발표자 (1.00→1.16, 1.1초), 이후 아주 느리게 계속, 질문 끝에 정지",
    enter: { kind: "lights-on", frames: 0 },
    keys: (t) => [[t.from, P(1.0, 0.5, 0.5)], [t.from + 34, P(1.16, 0.42, 0.52), easeOut], [t.voiceEnd, P(1.2, 0.42, 0.52)]] },

  { n: 2, name: "100개의 에이전트", move: "Crane Up 모사 + Pull Out: 아래 무대(1.35) → 전체 층(1.00), 앞사람에 Parallax",
    enter: { kind: "flash", frames: 10 },
    keys: (t) => [[t.from - 5, P(1.35, 0.5, 0.66)], [t.to + 4, P(1.0, 0.5, 0.5)]] },

  { n: 3, name: "그래서 뭘 끝냈는데?", move: "얼굴로 Push In (1.04→1.16 빠르게, 이후 1.24까지 느리게)",
    enter: { kind: "hard", frames: 0 },
    keys: (t) => [[t.from, P(1.04, 0.5, 0.45)], [t.from + 16, P(1.16, 0.47, 0.42), easeOut], [t.to, P(1.24, 0.47, 0.41)]] },

  { n: 4, name: "일하는 척하는 조직", move: "좌 → 우 Pan (스케일 1.18 고정), 회의실을 천천히 훑음",
    enter: { kind: "whip", frames: 10 },
    keys: (t) => [[t.from - 5, P(1.18, 0.425, 0.5)], [t.to + 8, P(1.18, 0.575, 0.5)]] },

  { n: 5, name: "무대 뒤의 실체", move: "커튼을 따라 빠른 Pan (왼쪽 → 오른쪽) 후 Pull Out (1.30→1.00)으로 허술한 구조 공개",
    enter: { kind: "curtain", frames: 22 },
    keys: (t) => [[t.from, P(1.3, 0.385, 0.46)], [t.from + 34, P(1.3, 0.615, 0.5), easeInOut], [t.to + 6, P(1.0, 0.5, 0.5)]] },

  { n: 6, name: "실제 업무의 현실", move: "느린 Push In (1.00→1.15) + 약한 Handheld, 앞쪽 서류 더미에 Parallax",
    enter: { kind: "lights-out", frames: 12 },
    keys: (t) => [[t.from - 4, P(1.0, 0.5, 0.5)], [t.to + 4, P(1.15, 0.6, 0.45)]],
    pivotOut: [0.5, 0.92] },

  { n: 7, name: "결국 사람이 검증한다", move: "보고서 → 인물로 시선 이동 + Slow Push In (1.10→1.20)",
    enter: { kind: "match", frames: 12 },
    keys: (t) => [[t.from - 6, P(1.1, 0.6, 0.54)], [cue(7, 1), P(1.12, 0.6, 0.53)], [cue(7, 3, 0.4), P(1.18, 0.44, 0.5)], [t.to + 6, P(1.2, 0.44, 0.5)]],
    pivotIn: [0.62, 0.6] },

  { n: 8, name: "100개보다 중요한 1개", move: "배경 로봇들 → 전경 로봇으로 Push In (1.12→1.28) + 초점 이동",
    enter: { kind: "dip", frames: 14 },
    keys: (t) => [[t.from - 7, P(1.12, 0.5, 0.42)], [cue(8, 2) + 14, P(1.2, 0.5, 0.52)], [t.to, P(1.28, 0.5, 0.55)]] },

  { n: 9, name: "결국 SLOP", move: "무너진 무대로 느린 Push In (1.00→1.14), SLOP 등장 이후 완전 정지",
    enter: { kind: "crash", frames: 0 },
    keys: (t) => [[t.from, P(1.0, 0.5, 0.5)], [cue(9, 5), P(1.14, 0.5, 0.5)]] },
];
export const motionOf = (n: number) => MOTION.find((m) => m.n === n)!;
/** camera keys of a scene, resolved against the timing */
export const keysOf = (n: number) => motionOf(n).keys(SCENE_T[n]);
