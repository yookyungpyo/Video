// POSITIONING — "the same 1,000-won water costs more depending on where it's sold".
// All beats are frames @30fps, measured from the ElevenLabs voiceover with silencedetect (+VO_OFFSET).
export const FPS = 30;
export const VO_OFFSET = 9; // voice starts 0.3s in
export const DURATION = 750; // 25s
const s = (sec: number) => Math.round(sec * FPS) + VO_OFFSET;

export const PLACES = [
  { key: "store", name: "편의점", price: 1000, speak: s(5.5), lock: s(6.5) },
  { key: "gym", name: "헬스장", price: 2000, speak: s(7.27), lock: s(8.36) },
  { key: "hotel", name: "호텔", price: 3000, speak: s(9.28), lock: s(10.2) },
  { key: "plane", name: "비행기", price: 5000, speak: s(11.33), lock: s(12.3) },
] as const;

export const T = {
  intro: [0, s(1.55)] as const,              // 천 원짜리 물 한 병
  teaser: [s(2.19), s(4.88)] as const,       // 어디에서 파느냐에 따라, 가격이 달라집니다
  same: [s(13.46), s(14.6)] as const,        // 똑같은 물인데도요
  value: [s(15.15), s(18.78)] as const,      // 당신의 가치도, 어디에 있느냐에 따라…
  position: [s(19.34), s(21.91)] as const,   // 자신을, 최적의 위치에 포지셔닝하세요
};

// ---------- layout (1080x1920) ----------
export const CARD = { x: 90, y: 360, w: 900, h: 820, r: 26 };
export const CHART = { x0: 120, seg: 210, base: 1520, maxH: 290 };
export const levelY = (price: number) => CHART.base - (price / 5000) * CHART.maxH;

// ---------- the one line: price staircase, then a rise into the last photo ending in a ring ----------
export type P = [number, number];
const pts: P[] = [];
const cum: number[] = [];
const marks: Record<string, number> = {};
let total = 0;
const push = (p: P) => {
  if (pts.length) { const q = pts[pts.length - 1]; total += Math.hypot(p[0] - q[0], p[1] - q[1]); }
  pts.push(p); cum.push(total);
};
const lineTo = (p: P) => {
  const q = pts[pts.length - 1];
  const n = Math.max(2, Math.ceil(Math.hypot(p[0] - q[0], p[1] - q[1]) / 6));
  for (let i = 1; i <= n; i++) push([q[0] + ((p[0] - q[0]) * i) / n, q[1] + ((p[1] - q[1]) * i) / n]);
};
const cubicTo = (b: P, c: P, d: P, n = 70) => {
  const a = pts[pts.length - 1];
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t;
    push([
      u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
      u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
    ]);
  }
};

push([CHART.x0, CHART.base]);
PLACES.forEach((pl, i) => {
  const y = levelY(pl.price), x1 = CHART.x0 + CHART.seg * (i + 1);
  lineTo([CHART.x0 + CHART.seg * i, y]);
  marks[`rise${i}`] = total;
  lineTo([x1, y]);
  marks[`step${i}`] = total;
});
// rise from the top step into the summit photo, then a "you are here" ring around the hiker
export const RING = { c: [392, 800] as P, r: 118 };
cubicTo([1010, 1120], [1000, 760], [RING.c[0] + RING.r, RING.c[1]], 90);
marks.reach = total;
for (let i = 1; i <= 120; i++) {
  const th = (i / 120) * Math.PI * 2;
  push([RING.c[0] + RING.r * Math.cos(th), RING.c[1] - RING.r * Math.sin(th)]);
}
marks.ring = total;

export const LINE = { pts, cum, total, marks, d: "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L") };
export const pointAt = (len: number): P => {
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] < len) lo = m; else hi = m; }
  const sg = cum[hi] - cum[lo] || 1, t = Math.min(1, Math.max(0, (len - cum[lo]) / sg));
  return [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * t, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * t];
};

// draw schedule: [f0, f1, toMark]
const SEGS: [number, number, string][] = [
  ...PLACES.flatMap((pl, i) => [
    [pl.speak - 4, pl.lock, `rise${i}`] as [number, number, string],
    [pl.lock, pl.lock + 16, `step${i}`] as [number, number, string],
  ]),
  [T.value[0] + 6, T.value[0] + 62, "reach"],
  [T.value[0] + 62, T.value[0] + 92, "ring"],
];
const io = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)));
export const drawn = (f: number) => {
  let prev = 0;
  for (const [f0, f1, m] of SEGS) {
    const l1 = marks[m];
    if (f < f0) return prev;
    if (f <= f1) return prev + (l1 - prev) * io((f - f0) / (f1 - f0));
    prev = l1;
  }
  return total;
};

// photo schedule: [frame, key, fade]
export const PHOTOS: [number, string, number][] = [
  [0, "store", 0],
  [T.teaser[0] + 6, "gym", 0], [T.teaser[0] + 24, "hotel", 0], [T.teaser[0] + 42, "plane", 0], [T.teaser[0] + 60, "store", 0],
  [PLACES[1].speak, "gym", 8], [PLACES[2].speak, "hotel", 8], [PLACES[3].speak, "plane", 8],
  [T.same[0], "quad", 8],
  [T.value[0], "peak", 10],
];

export const CAPTIONS: { f0: number; f1: number; kicker: string; text: string }[] = [
  { f0: 4, f1: T.teaser[0] - 2, kicker: "SAME WATER", text: "천 원짜리 물 한 병" },
  { f0: T.teaser[0], f1: PLACES[0].speak - 2, kicker: "WHERE IT'S SOLD", text: "어디서 파느냐에 따라" },
  ...PLACES.map((pl, i) => ({
    f0: pl.speak, f1: (i < 3 ? PLACES[i + 1].speak : T.same[0]) - 2,
    kicker: `0${i + 1} / 04`, text: pl.name,
  })),
  { f0: T.same[0], f1: T.value[0] - 2, kicker: "SAME WATER", text: "똑같은 물인데도" },
  { f0: T.value[0], f1: T.position[0] - 4, kicker: "AND YOU", text: "당신의 가치도, 위치에 따라" },
];

export const SFX = {
  duration: DURATION,
  pop: 6,
  labels: PLACES.map((_, i) => T.teaser[0] + 6 + i * 18),
  swaps: [...[1, 2, 3].map((i) => PLACES[i].speak), T.same[0], T.value[0]],
  locks: PLACES.map((p) => p.lock),
  rise: [T.value[0] + 6, T.value[0] + 62],
  ring: T.value[0] + 92,
  title: T.position[0],
  vo_offset: VO_OFFSET / FPS,
};
