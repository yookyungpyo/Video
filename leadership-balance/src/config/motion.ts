// Per-scene motion settings: the camera of every scene and how it comes in. Edit here.
//   z      zoom, 1 = the whole picture across the full width
//   x, y   the point of the picture (0–1) that sits in the middle of the window
//   r      a small 2D rotation in degrees (scene 06 only)
// A key is [frame, pose, easing?]; the easing belongs to the move that ENDS at that key (default: sine in-out).
// Frames come from the narration (src/data/timing.json), so the moves follow the voice.
import { Depth, Key, Pose } from "../components/Stage";
import { SCENE_T, SceneTiming, cue } from "../data";
import { easeOut } from "../theme";

export type EnterKind =
  | "cut"
  | "ink"      // the picture bleeds in like ink on wet paper
  | "paper"    // dissolve, with the paper grain coming up while the two pictures mix
  | "brush"    // one broad brush stroke slashes the frame and the cut opens onto the next picture
  | "scale"    // 05 → 06: the picture tips over like the scale's beam and the tilted scale comes out of that turn
  | "bridge";  // 08 → 09: push into the bridge timber, come out of the timber of the next picture
export type SceneMotion = {
  n: number;
  name: string;
  move: string;                                   // what the camera does, in words (also used in the README)
  enter: { kind: EnterKind; frames: number };     // length of the change, centred on the scene boundary
  keys: (t: SceneTiming) => Key[];
  depth?: Depth;                                  // slight parallax: this region zooms a few per cent more
  rotateAt?: [number, number];                    // pivot of `r`
  pivotIn?: [number, number];                     // pivot of the incoming "scale"/"bridge" move
  pivotOut?: [number, number];                    // pivot of the outgoing one
};
const P = (z: number, x: number, y: number, r = 0): Pose => ({ z, x, y, r });

export const MOTION: SceneMotion[] = [
  { n: 1, name: "후킹", move: "Push In: 전체 구도 → 주인공 클로즈업 (1.00→1.28), Ease Out, 첫 프레임부터 이동",
    enter: { kind: "cut", frames: 0 },
    keys: (t) => [[t.from, P(1.0, 0.5, 0.5)], [t.to + 6, P(1.28, 0.58, 0.56), easeOut]] },

  { n: 2, name: "현실", move: "Low-angle 느낌의 Push In (1.10→1.26): 건물 쪽에서 시작해 위로 올라가며 인물로 이동",
    enter: { kind: "ink", frames: 16 },
    keys: (t) => [[t.from - 8, P(1.1, 0.56, 0.47)], [t.to + 8, P(1.26, 0.44, 0.42)]],
    depth: { cx: 0.33, cy: 0.66, rx: 0.42, ry: 0.5, k: 0.1 } },

  { n: 3, name: "갈등", move: "느린 Pan: 리더 → 구성원, 미세한 Push In (1.14→1.20)",
    enter: { kind: "paper", frames: 14 },
    keys: (t) => [[t.from - 7, P(1.14, 0.44, 0.5)], [t.to + 8, P(1.2, 0.58, 0.58)]] },

  { n: 4, name: "반대편", move: "느린 Pull Out (1.20→1.00): 리더에서 구성원 전체로",
    enter: { kind: "brush", frames: 18 },
    keys: (t) => [[t.from - 4, P(1.2, 0.52, 0.42)], [t.to + 8, P(1.0, 0.5, 0.5)]],
    depth: { cx: 0.5, cy: 1.02, rx: 0.85, ry: 0.42, k: 0.12 } },

  { n: 5, name: "고민", move: "Crane Up 모사: 리더 얼굴(1.30) → 저울 전체(1.00), 이후 정지",
    enter: { kind: "ink", frames: 16 },
    keys: (t) => [[t.from - 8, P(1.3, 0.5, 0.62)], [cue(5, 2, 0.35), P(1.0, 0.5, 0.5)]],
    pivotOut: [0.5, 0.16] },

  { n: 6, name: "깨달음", move: "느린 Tilt Up + 저울이 더 기우는 듯한 2D 회전 (+1.2°→−2.2°), 3D Orbit 없음",
    enter: { kind: "scale", frames: 16 },
    keys: (t) => [[t.from - 8, P(1.13, 0.5, 0.5, 1.2)], [t.to + 7, P(1.13, 0.5, 0.446, -2.2)]],
    rotateAt: [0.47, 0.3], pivotIn: [0.47, 0.3] },

  { n: 7, name: "통찰", move: "좌우 Tracking 모사 Pan: 조직(왼쪽) 쪽으로 이동 → 멈춤 → 사람(오른쪽) 쪽으로 전환",
    enter: { kind: "paper", frames: 14 },
    keys: (t) => [[t.from - 7, P(1.16, 0.5, 0.56)], [cue(7, 0, 0.5), P(1.16, 0.431, 0.56)], [cue(7, 1) - 4, P(1.16, 0.431, 0.56)],
      [cue(7, 1, 0.5), P(1.16, 0.569, 0.56)], [t.to + 7, P(1.18, 0.569, 0.56)]] },

  { n: 8, name: "철학", move: "느린 Push In (1.00→1.12): 손과 다리 난간 쪽으로",
    enter: { kind: "ink", frames: 16 },
    keys: (t) => [[t.from - 8, P(1.0, 0.5, 0.5)], [t.to - 2, P(1.12, 0.5, 0.554)]],
    depth: { cx: 0.5, cy: 0.94, rx: 0.9, ry: 0.3, k: 0.12 }, pivotOut: [0.5, 0.78] },

  { n: 9, name: "결론", move: "느린 Pull Out (1.30→1.00): 인물은 작아지고 풍경이 넓어짐, 마지막 말 뒤 정지",
    enter: { kind: "bridge", frames: 12 },
    keys: (t) => [[t.from - 6, P(1.3, 0.49, 0.56)], [t.voiceEnd + 6, P(1.0, 0.5, 0.5)]],
    pivotIn: [0.5, 0.9] },
];
export const motionOf = (n: number) => MOTION.find((m) => m.n === n)!;
/** camera keys of a scene, resolved against the timing */
export const keysOf = (n: number) => motionOf(n).keys(SCENE_T[n]);
