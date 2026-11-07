// PROPOSAL PRINCIPLES — text-only cut (no voice). Timing is set for comfortable reading.
export const FPS = 30;
export const DURATION = 960; // 32s
export type P = [number, number];

// Beats are timed to the ElevenLabs voiceover (sentence starts via silencedetect, +0.3s lead-in).
const v = (sec: number) => Math.round((sec + 0.3) * FPS);
export const T = {
  intro: [0, v(2.82)] as const,
  split: [v(2.82), v(6.94)] as const,
  q1: [v(6.94), v(15.69)] as const, q1Answer: v(11.93), tilt: v(11.93),
  q2: [v(15.69), v(24.56)] as const, q2Answer: v(20.19), release: [v(20.19), v(20.19) + 45] as const,
  end: [v(24.56), v(27.0)] as const,
  card: v(27.0),
};
export const END_REVEAL = [v(27.0), v(27.0) + 8, v(27.39)];
export const VO_OFFSET_SEC = 0.3;

export const CARD = { x: 90, y: 360, w: 900, h: 820, r: 26 };
export const CY = 1460;

export const PHOTOS: [number, string, number][] = [
  [0, "handover", 0],
  [T.split[0] - 4, "thinking", 10],
  [T.q1[0] - 4, "value", 10],
  [T.q2[0] - 4, "listening", 10],
  [T.end[0] - 4, "handshake", 12],
];

export const CAPTIONS: { f0: number; f1: number; kicker: string; lines: string[] }[] = [
  { f0: 4, f1: T.split[0] - 6, kicker: "PRINCIPLES OF PROPOSAL", lines: ["제안의 원칙"] },
  { f0: T.split[0], f1: T.q1[0] - 6, kicker: "THE CLIENT ASKS", lines: ["고객이 속으로", "묻는 두 가지"] },
  { f0: T.q1[0], f1: T.q2[0] - 6, kicker: "01 · 가치", lines: ["내가 낸 비용만큼", "가치를 얻을 수 있을까?"] },
  { f0: T.q2[0], f1: T.end[0] - 6, kicker: "02 · 해결", lines: ["지금 내 고민을", "어떻게 해결해 줄까?"] },
  { f0: T.end[0], f1: T.card - 4, kicker: "결론", lines: ["좋은 제안은", "두 질문에 대한 답이다"] },
];
export const SUBS: { f0: number; f1: number; text: string; strong?: boolean }[] = [
  { f0: 30, f1: T.split[0] - 6, text: "좋은 제안에는 원칙이 있다" },
  { f0: T.split[0] + 10, f1: T.q1[0] - 6, text: "제안서를 받은 고객은 속으로 묻는다" },
  { f0: T.q1Answer, f1: T.q2[0] - 6, text: "가격이 아니라, 얻게 될 가치로 말하라", strong: true },
  { f0: T.q2Answer, f1: T.end[0] - 6, text: "회사 소개가 아니라, 고객의 고민에서 시작하라", strong: true },
];
export const END_LINES = ["좋은 제안은", "내가 하고 싶은 말이 아니라", "고객의 두 질문에 대한 답이다"];

// ---------- motifs ----------
// document outline with folded corner
export const DOC = "M450 1345 H600 L630 1375 V1580 H450 Z M600 1345 V1375 H630";
// question marks / checks
export const Q_POS: P[] = [[420, CY], [660, CY]];
export const CHECK = (x: number, y: number) => `M${x - 45} ${y + 5} L${x - 12} ${y + 40} L${x + 50} ${y - 40}`;

// tangle -> straight arrow into a target
const N = 300;
export const TARGET: P = [820, CY];
const AX0 = 170, AX1 = TARGET[0] - 10;
export const ARROW_STRAIGHT: P[] = Array.from({ length: N }, (_, i) => [AX0 + ((AX1 - AX0) * i) / (N - 1), CY]);
export const TANGLE: P[] = Array.from({ length: N }, (_, i) => {
  const t = i / (N - 1);
  const x = AX0 + (AX1 - AX0) * t;
  if (t < 0.15 || t > 0.8) return [x, CY];
  const u = (t - 0.15) / 0.65;
  const ang = u * Math.PI * 2 * 3.2;
  const r = 62 * Math.sin(Math.PI * u) * (0.75 + 0.25 * Math.sin(u * 17));
  return [x - 90 * Math.sin(Math.PI * u) + r * Math.sin(ang) * 1.1, CY - r * (1 - Math.cos(ang)) * 0.9 + 20 * Math.sin(u * 9)];
});
export const lerpPts = (a: P[], b: P[], k: number): P[] => a.map((p, i) => [p[0] + (b[i][0] - p[0]) * k, p[1] + (b[i][1] - p[1]) * k]);
export const toD = (pts: P[]) => "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L");
export const io = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)));

export const SFX = {
  duration: DURATION,
  pop: 6,
  doc: [10, 50],
  qmark: 58,
  split: [T.split[0] + 8, T.split[0] + 16],
  swaps: PHOTOS.slice(1).map((p) => p[0]),
  scale: T.q1[0] + 10,
  wobble: T.q1[0] + 60,
  tilt: T.tilt,
  tangle: T.q2[0] + 12,
  release: T.release,
  hit: T.release[1] + 4,
  checks: [T.end[0] + 20, T.end[0] + 32],
  card: T.card,
};
