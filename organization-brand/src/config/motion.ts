// Per-scene motion settings: the camera of every scene and how it comes in. Edit here.
//   z      zoom, 1 = the whole picture across the full width
//   x, y   the point of the picture (0–1) that sits in the middle of the window
// A key is [frame, pose, easing?]; the easing belongs to the move that ENDS at that key (default: sine in-out).
// Frames come from the narration (src/data/timing.json), so the moves follow the voice.
// Game graphics, light and focus of each scene are in src/config/game.tsx.
import { Key, Pose } from "../components/Stage";
import { SCENE_T, SceneTiming, cue } from "../data";
import { easeOut } from "../theme";

export type EnterKind =
  | "start"    // 01: fade in from the dark page
  | "blocks"   // the picture is covered by pixel blocks, diagonal by diagonal, and uncovered on the next one
  | "whip"     // both pictures rush sideways
  | "push"     // the new picture comes down from above, the old one leaves below — walking on
  | "iris"     // the next picture opens in a growing circle, like a spotlight wipe in an old game
  | "flash";   // the picture burns out to light and the next one comes out of it
export type SceneMotion = {
  n: number;
  name: string;
  move: string;                                   // what the camera does, in words (also used in the README)
  enter: { kind: EnterKind; frames: number };     // length of the change, centred on the scene boundary
  keys: (t: SceneTiming) => Key[];
};
const P = (z: number, x: number, y: number): Pose => ({ z, x, y });

// 08: the faces the camera visits, in order (picture coords: x0, y0, x1, y1) and the class shown in the party HUD
export const PARTY: { box: [number, number, number, number]; role: string }[] = [
  { box: [0.27, 0.09, 0.55, 0.31], role: "ENGINEER" },
  { box: [0.59, 0.2, 0.89, 0.41], role: "PLANNER" },
  { box: [0.44, 0.35, 0.77, 0.56], role: "DEVELOPER" },
  { box: [0.01, 0.24, 0.3, 0.44], role: "DESIGNER" },
  { box: [0.09, 0.43, 0.5, 0.72], role: "SUPPORT" },
  { box: [0.55, 0.62, 0.96, 0.86], role: "SALES" },
];
/** frame at which the party cursor jumps to face i (i = PARTY.length: all selected) */
export const focusAt = (i: number) => {
  const t = SCENE_T[8];
  const a = t.from + 8;
  return Math.round(a + (Math.min(i, PARTY.length) * (cue(8, 2) - a)) / PARTY.length);
};

export const MOTION: SceneMotion[] = [
  { n: 1, name: "질문", move: "탑뷰에서 빠른 Push In (1.00→1.30, 1.3초) → 질문이 뜬 순간 화면 정지 → 느리게 계속",
    enter: { kind: "start", frames: 0 },
    keys: (t) => [[t.from, P(1.0, 0.5, 0.5)], [t.from + 40, P(1.3, 0.5, 0.52), easeOut], [cue(1, 1), P(1.3, 0.5, 0.52)], [t.to + 6, P(1.4, 0.5, 0.52)]] },

  { n: 2, name: "조직도 브랜드", move: "로우앵글 인물로 천천히 전진 (1.00→1.14), 가운데 인물에 Parallax",
    enter: { kind: "blocks", frames: 14 },
    keys: (t) => [[t.from - 7, P(1.0, 0.5, 0.45)], [t.to + 7, P(1.14, 0.5, 0.43)]] },

  { n: 3, name: "고객 경험", move: "좌 → 우 수평 이동 (1.14 고정), 앞쪽 고객이 더 크게 움직이는 Parallax",
    enter: { kind: "whip", frames: 10 },
    keys: (t) => [[t.from - 5, P(1.14, 0.44, 0.5)], [t.to + 6, P(1.14, 0.56, 0.5)]] },

  { n: 4, name: "목표점", move: "인물 뒷모습(1.28)에서 위로 Tilt → 산 정상의 깃발(1.08)",
    enter: { kind: "iris", frames: 16 },
    keys: (t) => [[t.from - 4, P(1.28, 0.4, 0.66)], [cue(4, 1) + 6, P(1.08, 0.55, 0.38)], [t.to + 6, P(1.12, 0.58, 0.36)]] },

  { n: 5, name: "방향성", move: "빛나는 길을 따라 앞으로 이동 (1.00→1.26, 길 위쪽으로)",
    enter: { kind: "push", frames: 12 },
    keys: (t) => [[t.from - 6, P(1.0, 0.5, 0.55)], [t.to + 6, P(1.26, 0.62, 0.42)]] },

  { n: 6, name: "내비게이션", move: "지도(1.12) → 나침반(1.24)으로 이동하며 초점 이동 → 바늘이 멈추면 가리키는 손끝으로 Tilt Up(1.18)",
    enter: { kind: "blocks", frames: 14 },
    keys: (t) => [[t.from - 7, P(1.12, 0.42, 0.42)], [cue(6, 1), P(1.24, 0.62, 0.64)], [cue(6, 2) + 4, P(1.24, 0.62, 0.64)], [cue(6, 2) + 26, P(1.18, 0.6, 0.38)]] },

  { n: 7, name: "비전·전략·리더십", move: "아이콘 화면으로 아주 느린 Push In (1.00→1.06)",
    enter: { kind: "flash", frames: 10 },
    keys: (t) => [[t.from - 5, P(1.0, 0.5, 0.5)], [t.to + 5, P(1.06, 0.5, 0.42)]] },

  { n: 8, name: "다른 역할, 하나의 가치", move: "캐릭터 여섯 명을 차례로 포커스 (1.26) → 팀 전체로 Pull Out (1.00)",
    enter: { kind: "whip", frames: 10 },
    keys: (t) => {
      const keys: Key[] = [[t.from - 5, P(1.26, 0.41, 0.2)]];
      PARTY.forEach((m, i) => { keys.push([focusAt(i) + 9, P(1.26, (m.box[0] + m.box[2]) / 2, (m.box[1] + m.box[3]) / 2)]); if (i < PARTY.length - 1) keys.push([focusAt(i + 1) - 2, P(1.26, (m.box[0] + m.box[2]) / 2, (m.box[1] + m.box[3]) / 2)]); });
      keys.push([cue(8, 2) + 4, keys[keys.length - 1][1]], [cue(8, 3) + 10, P(1.0, 0.5, 0.5)]);
      return keys;
    } },

  { n: 9, name: "행동으로 증명", move: "아래에서 위로 Crane Up (1.30→1.02): 오르는 사람들 → 정상의 깃발",
    enter: { kind: "push", frames: 12 },
    keys: (t) => [[t.from - 6, P(1.3, 0.4, 0.72)], [cue(9, 3) + 10, P(1.02, 0.5, 0.5)]] },

  { n: 10, name: "마지막 질문", move: "느린 Pull Out (1.28→1.00), 마지막 말 이후 정지",
    enter: { kind: "flash", frames: 18 },
    keys: (t) => [[t.from - 9, P(1.28, 0.5, 0.56)], [t.voiceEnd, P(1.0, 0.5, 0.5)]] },
];
export const motionOf = (n: number) => MOTION.find((m) => m.n === n)!;
/** camera keys of a scene, resolved against the timing */
export const keysOf = (n: number) => motionOf(n).keys(SCENE_T[n]);
