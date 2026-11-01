// CALM RESPONSE — "three responses of people who don't get shaken".
// Beats measured from the ElevenLabs voiceover (silencedetect), with 0.8s of extra silence
// inserted after the silence chapter, plus a 0.3s lead-in.
export const FPS = 30;
export const DURATION = 1200; // 40s
const s = (sec: number) => Math.round((sec + 0.3) * FPS);
export type P = [number, number];

export const V = {
  intro: [s(0), s(2.84)],
  c1: { num: s(3.51), title: [s(4.37), s(6.94)], reason: [s(7.56), s(10.69)], silence: [s(10.69), s(12.09)] },
  c2: { num: s(12.09), title: [s(12.96), s(15.19)], reason: [s(15.74), s(19.6)], release: [s(15.74), s(18.1)] },
  c3: { num: s(20.16), title: [s(20.93), s(23.11)], reason: [s(23.55), s(28.3)] },
  end: [s(28.8), s(31.49), s(34.25)] as number[],
  card: s(37.3),
} as const;

export const CARD = { x: 90, y: 360, w: 900, h: 820, r: 26 };
export const CY = 1460; // motif baseline
const X0 = 150, X1 = 930;

// ---------- motifs (all polylines with N points so they can morph) ----------
const N = 400;
const lin = (i: number) => X0 + ((X1 - X0) * i) / (N - 1);
export const STRAIGHT: P[] = Array.from({ length: N }, (_, i) => [lin(i), CY]);

// 1) chatter that calms down to a flat line
export const WAVE: P[] = Array.from({ length: N }, (_, i) => {
  const t = i / (N - 1);
  const env = Math.max(0, 1 - t / 0.72) ** 1.6;
  return [lin(i), CY - 95 * env * Math.sin(t * 46) * (0.7 + 0.3 * Math.sin(t * 9))];
});

// 2) a real knot (trefoil) tied into the middle of the line
export const KNOT: P[] = Array.from({ length: N }, (_, i) => {
  const t = i / (N - 1);
  const mid = 540;
  if (t < 0.3) return [X0 + (mid - X0) * (t / 0.3), CY];
  if (t > 0.7) return [mid + (X1 - mid) * ((t - 0.7) / 0.3), CY];
  const a = Math.PI + ((t - 0.3) / 0.4) * Math.PI * 2;
  const X = Math.sin(a) + 2 * Math.sin(2 * a), Y = Math.cos(a) - 2 * Math.cos(2 * a);
  return [mid + 52 * X, CY - 52 * (Y + 3)];
});

// 3) smile
export const SMILE: P[] = Array.from({ length: N }, (_, i) => {
  const t = i / (N - 1);
  const x = lin(i);
  if (t < 0.2 || t > 0.8) return [x, CY - 70];
  const u = (t - 0.2) / 0.6;
  return [x, CY - 70 + 140 * (0.5 - 0.5 * Math.cos(2 * Math.PI * u))];
});
export const EYES: P[] = [[455, CY - 128], [625, CY - 128]];

// conclusion: three small symbols side by side
export const MINI = (() => {
  const w = 220, gap = 50, x0 = 540 - (3 * w + 2 * gap) / 2, y = CY - 20;
  const mk = (k: number, f: (t: number) => number): P[] =>
    Array.from({ length: 120 }, (_, i) => { const t = i / 119; return [x0 + k * (w + gap) + t * w, y - f(t)]; });
  return [
    mk(0, (t) => (t < 0.55 ? 55 * (1 - t / 0.55) ** 1.4 * Math.sin(t * 55) : 0)),          // calmed wave
    mk(1, (t) => 18 * Math.sin(t * Math.PI * 2) * (1 - t)),           // released, a soft curl
    mk(2, (t) => -70 * (0.5 - 0.5 * Math.cos(2 * Math.PI * t)) + 30),                                   // smile
  ];
})();
export const MINI_LABELS = ["답할 필요 없다", "붙잡을 필요 없다", "이길 필요 없다"];

// ---------- helpers ----------
export const lerpPts = (a: P[], b: P[], k: number): P[] => a.map((p, i) => [p[0] + (b[i][0] - p[0]) * k, p[1] + (b[i][1] - p[1]) * k]);
export const toD = (pts: P[]) => "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L");
export const io = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)));

export const PHOTOS: [number, string, number][] = [
  [0, "sunrise", 0],
  [V.c1.num - 6, "think", 10],
  [V.c2.num - 4, "breathe", 10],
  [V.c3.num - 4, "smile", 10],
  [V.end[0] - 6, "coffee", 12],
];

export const CAPTIONS: { f0: number; f1: number; kicker: string; lines: string[] }[] = [
  { f0: 4, f1: V.c1.num - 8, kicker: "THREE RESPONSES", lines: ["흔들리지 않는 사람의", "3가지 대응"] },
  { f0: V.c1.num, f1: V.c2.num - 8, kicker: "01 · 침묵", lines: ["침묵은 때로", "가장 좋은 대답이다"] },
  { f0: V.c2.num, f1: V.c3.num - 8, kicker: "02 · 용서", lines: ["용서는 나를", "자유롭게 만든다"] },
  { f0: V.c3.num, f1: V.end[0] - 8, kicker: "03 · 미소", lines: ["미소는", "가장 강한 대응이다"] },
];
export const REASONS: { f0: number; f1: number; text: string }[] = [
  { f0: V.c1.reason[0], f1: V.c2.num - 8, text: "모든 일에 일일이 설명할 필요는 없다" },
  { f0: V.c2.reason[0], f1: V.c3.num - 8, text: "붙잡기보다 놓아주는 것이 나를 치유한다" },
  { f0: V.c3.reason[0], f1: V.end[0] - 8, text: "옳음을 증명하기보다 평온을 지키는 것이 더 강하다" },
];
export const END_LINES = ["모든 질문에 답할 필요는 없고,", "모든 상처를 붙잡을 필요도 없으며,", "모든 논쟁에서 이길 필요도 없다."];

export const SFX = {
  duration: DURATION,
  pop: 6,
  dots: [44, 54, 64],
  swaps: PHOTOS.slice(1).map((p) => p[0]),
  blips: Array.from({ length: 9 }, (_, i) => V.c1.title[0] + i * 16),
  silence: V.c1.silence,
  knot: V.c2.title[0],
  release: V.c2.release,
  smile: V.c3.title[0] + 20,
  eyes: [V.c3.title[1] - 4, V.c3.title[1] + 2],
  ends: V.end,
  card: V.card,
};
