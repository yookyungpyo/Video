// Storyboard — one entry per scene. Images are used as-is (public/images/scene-XX.png, never edited).
// Coordinates are normalized to the source image (x: 0–1 of width, y: 0–1 of height).
// Timings come from timing.json (built by scripts/build_audio.py from the narration takes).
import script from "./script.json";
import timing from "./timing.json";

export type Box = [number, number, number, number]; // x0, y0, x1, y1
export type Cam = { z: number; x: number; y: number }; // zoom + view centre (cover) / zoom origin (fit)

export type CaptionSpec = {
  line: string; // starts with this line (or one of its cues)
  cue?: number;
  text: string; // "\n" = line break (max 2 lines), "{word}" = yellow keyword
  label?: "나" | "팀장님";
  pos: "bottom" | "top";
  align?: "center" | "right" | "left";
  size?: number;
};

export type SceneSpec = {
  n: number;
  image: string;
  size: [number, number];
  mode: "cover" | "fit"; // cover: fills 9:16 (crop only where nobody is); fit: whole 3:4 image, blurred fill
  from: Cam;
  to: Cam;
  ease?: "inOut" | "out";
  pan?: { line: string; endLine: string }; // S3: move from protagonist to leader between these lines
  bumps?: { line: string; amp: number }; // S5: a small push-in on every cue of this line
  shake?: number; // px, S7
  grade: { filter?: string; tint?: string; tintOpacity?: number; vignette?: number; brighten?: [number, number] };
  highlights?: { line: string; cue: number; delay?: number; box: Box; radius?: number }[];
  captions: CaptionSpec[];
  chips?: { line: string; title: string; items: string[] }; // S11
  transitionIn: "fadeBlack" | "dissolve" | "zoom";
};

export const SCENES: SceneSpec[] = [
  {
    n: 1, image: "images/scene-01.png", size: [941, 1671], mode: "cover",
    from: { z: 1.0, x: 0.48, y: 0.4 }, to: { z: 1.06, x: 0.5, y: 0.38 },
    grade: { filter: "saturate(1.06) brightness(1.03)", tint: "#FFB060", tintOpacity: 0.1 },
    captions: [{ line: "s01", text: "우리 팀장님은\n정말 {착합니다}.", pos: "bottom" }],
    transitionIn: "fadeBlack",
  },
  {
    n: 2, image: "images/scene-02.png", size: [941, 1671], mode: "cover",
    from: { z: 1.02, x: 0.6, y: 0.36 }, to: { z: 1.08, x: 0.62, y: 0.34 },
    grade: { filter: "saturate(0.82) brightness(0.92)", tint: "#3A6BC8", tintOpacity: 0.14, vignette: 0.35 },
    captions: [{ line: "s02", text: "그런데…\n{같이 일하기는} 힘듭니다.", pos: "bottom" }],
    transitionIn: "dissolve",
  },
  {
    n: 3, image: "images/scene-03.png", size: [941, 1670], mode: "cover",
    from: { z: 1.05, x: 0.0, y: 0.45 }, to: { z: 1.05, x: 1.0, y: 0.45 },
    pan: { line: "s03q", endLine: "s03a" },
    grade: { filter: "saturate(0.95)" },
    captions: [
      { line: "s03q", label: "나", text: "가장 중요한 게 뭔가요?", pos: "bottom", align: "right", size: 50 },
      { line: "s03a", label: "팀장님", text: "{다} 중요하니까\n잘 챙겨봅시다.", pos: "bottom", align: "right", size: 54 },
    ],
    transitionIn: "dissolve",
  },
  {
    n: 4, image: "images/scene-04.png", size: [941, 1671], mode: "cover",
    from: { z: 1.0, x: 0.3, y: 0.55 }, to: { z: 1.06, x: 0.28, y: 0.6 },
    grade: { filter: "saturate(0.92)" },
    captions: [
      { line: "s04q", label: "나", text: "일정이 부족한데, 뭘 빼죠?", pos: "bottom", size: 48 },
      { line: "s04a", label: "팀장님", text: "가능하면 {다} 해보죠.", pos: "bottom", size: 56 },
    ],
    transitionIn: "dissolve",
  },
  {
    n: 5, image: "images/scene-05.png", size: [941, 1670], mode: "cover",
    from: { z: 1.0, x: 0.6, y: 0.3 }, to: { z: 1.0, x: 0.6, y: 0.3 },
    bumps: { line: "s05", amp: 0.018 },
    grade: { filter: "saturate(0.85) brightness(0.96)", tint: "#4A5A78", tintOpacity: 0.08 },
    highlights: [
      { line: "s05", cue: 0, box: [0.655, 0.035, 0.965, 0.148] },
      { line: "s05", cue: 1, box: [0.655, 0.152, 0.97, 0.265] },
      { line: "s05", cue: 2, box: [0.67, 0.268, 0.985, 0.38] },
      { line: "s05", cue: 3, box: [0.71, 0.405, 0.998, 0.518] },
    ],
    captions: [{ line: "s05", text: "열심히 하는데,\n{끝나지 않는 일}.", pos: "bottom" }],
    transitionIn: "dissolve",
  },
  {
    n: 6, image: "images/scene-06.png", size: [1086, 1448], mode: "cover",
    from: { z: 1.0, x: 0.6, y: 0.4 }, to: { z: 1.07, x: 0.6, y: 0.3 },
    grade: { filter: "saturate(0.9) brightness(0.95)", vignette: 0.55 },
    captions: [{ line: "s06", text: "문제는 친절함이 아니라\n{결정의 부재}.", pos: "bottom" }],
    transitionIn: "dissolve",
  },
  {
    n: 7, image: "images/scene-07.png", size: [1086, 1448], mode: "cover",
    from: { z: 1.02, x: 0.385, y: 0.45 }, to: { z: 1.05, x: 0.385, y: 0.42 },
    shake: 4,
    grade: { filter: "saturate(0.8) brightness(0.93)", tint: "#3A6BC8", tintOpacity: 0.1, vignette: 0.4 },
    captions: [{ line: "s07", text: "달리고 있지만,\n{앞으로 가지 못한다}.", pos: "bottom" }],
    transitionIn: "dissolve",
  },
  {
    n: 8, image: "images/scene-08.png", size: [1086, 1448], mode: "fit",
    from: { z: 1.0, x: 0.85, y: 0.25 }, to: { z: 1.06, x: 0.85, y: 0.25 },
    grade: { filter: "saturate(1.05)", brighten: [0.82, 1.05], tint: "#FFC070", tintOpacity: 0.06 },
    captions: [{ line: "s08", text: "그런데 어느 날,\n{달라졌습니다}.", pos: "bottom" }],
    transitionIn: "zoom",
  },
  {
    n: 9, image: "images/scene-09.png", size: [1086, 1448], mode: "fit",
    from: { z: 1.0, x: 0.75, y: 0.35 }, to: { z: 1.035, x: 0.75, y: 0.35 },
    grade: { filter: "saturate(1.05) brightness(1.04)" },
    captions: [{ line: "s09", text: "우리가 이루려는\n{목표}는 이것입니다.", pos: "bottom" }],
    transitionIn: "dissolve",
  },
  {
    n: 10, image: "images/scene-10.png", size: [1086, 1448], mode: "fit",
    from: { z: 1.04, x: 0.6, y: 0.6 }, to: { z: 1.0, x: 0.6, y: 0.6 },
    grade: { filter: "saturate(1.05) brightness(1.04)" },
    highlights: [
      { line: "s10", cue: 0, delay: 30, box: [0.817, 0.601, 0.988, 0.737], radius: 12 },
      { line: "s10", cue: 1, box: [0.077, 0.763, 0.289, 0.873], radius: 12 },
    ],
    captions: [{ line: "s10", text: "{무엇을 하지 않을지}도\n결정한다.", pos: "bottom" }],
    transitionIn: "dissolve",
  },
  {
    n: 11, image: "images/scene-11.png", size: [1086, 1448], mode: "fit",
    from: { z: 1.0, x: 0.8, y: 0.25 }, to: { z: 1.04, x: 0.8, y: 0.25 },
    grade: { filter: "saturate(1.06) brightness(1.04)", tint: "#FFC070", tintOpacity: 0.05 },
    highlights: [
      { line: "s11", cue: 1, box: [0.625, 0.08, 0.986, 0.197], radius: 18 },
      { line: "s11", cue: 2, box: [0.625, 0.203, 0.986, 0.309], radius: 18 },
      { line: "s11", cue: 3, box: [0.645, 0.327, 0.986, 0.436], radius: 18 },
    ],
    chips: { line: "s11", title: "좋은 리더가 명확히 하는 {세 가지}", items: ["목표", "우선순위", "하지 않을 일"] },
    captions: [],
    transitionIn: "dissolve",
  },
  {
    n: 12, image: "images/scene-12.png", size: [1086, 1448], mode: "fit",
    from: { z: 1.07, x: 0.6, y: 0.4 }, to: { z: 1.0, x: 0.6, y: 0.4 },
    grade: { filter: "saturate(1.08) brightness(1.04)", tint: "#FFB060", tintOpacity: 0.1 },
    captions: [{ line: "s12", text: "좋은 리더는\n{방향}을 보여준다.", pos: "bottom", size: 66 }],
    transitionIn: "dissolve",
  },
];

export type LineTiming = (typeof timing.lines)[number];
export const TIMING = timing;
export const SCRIPT = script;
export const LINES: Record<string, LineTiming> = Object.fromEntries(timing.lines.map((l) => [l.id, l]));
export const SCENE_TIMES = timing.scenes; // { scene, from, to } in frames
