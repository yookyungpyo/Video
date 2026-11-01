// STEP GROWTH — "growth is a staircase, not a ramp".
// Pure data module shared by the React composition and the soundtrack script.
export const FPS = 30;
export const DURATION = 600; // 20s
export type P = [number, number];

const cubic = (a: P, b: P, c: P, d: P, n = 36): P[] => {
  const o: P[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t;
    o.push([
      u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
      u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
    ]);
  }
  return o;
};
const line = (a: P, b: P): P[] => {
  const n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 8));
  return Array.from({ length: n }, (_, i) => [a[0] + ((b[0] - a[0]) * (i + 1)) / n, a[1] + ((b[1] - a[1]) * (i + 1)) / n] as P);
};

// ---------- polyline helper ----------
export class Poly {
  pts: P[]; cum: number[]; total: number; marks: Record<string, number> = {};
  constructor(start: P) { this.pts = [start]; this.cum = [0]; this.total = 0; }
  push(ps: P[]) {
    for (const p of ps) {
      const q = this.pts[this.pts.length - 1];
      this.total += Math.hypot(p[0] - q[0], p[1] - q[1]);
      this.pts.push(p); this.cum.push(this.total);
    }
    return this;
  }
  get end(): P { return this.pts[this.pts.length - 1]; }
  mark(name: string) { this.marks[name] = this.total; return this; }
  L(p: P) { return this.push(line(this.end, p)); }
  C(b: P, c: P, d: P, n = 36) { return this.push(cubic(this.end, b, c, d, n)); }
  get d() { return "M" + this.pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L"); }
  at(len: number): P {
    let lo = 0, hi = this.cum.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (this.cum[m] < len) lo = m; else hi = m; }
    const s = this.cum[hi] - this.cum[lo] || 1, t = Math.min(1, Math.max(0, (len - this.cum[lo]) / s));
    const a = this.pts[lo], b = this.pts[hi];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }
}

// ---------- the staircase ----------
export const S: P = [240, 860];
export const Y1 = 860, Y2 = 620, Y3 = 360;
export const X_J1 = 820, X_J2 = 1340, X_END = 1700;

// a "try": slow hopeful rise, sudden drop back to the plateau
const attempt = (p: Poly, w: number, h: number, name: string) => {
  const [x, y] = p.end;
  p.L([x + w * 0.18, y]);
  p.C([x + w * 0.4, y], [x + w * 0.5, y - h], [x + w * 0.62, y - h]);
  p.mark(name);
  p.C([x + w * 0.68, y - h], [x + w * 0.7, y], [x + w * 0.8, y], 18);
  p.L([x + w, y]);
};

export const MAIN = new Poly(S);
// plateau 1 — four tries, the third nearly makes it
[42, 74, 128, 58].forEach((h, i) => attempt(MAIN, 125, h, `t1_${i}`));
MAIN.L([X_J1, Y1]).mark("p1");
MAIN.L([X_J1, Y2]).mark("j1");
// plateau 2 — three tries
[50, 104, 66].forEach((h, i) => attempt(MAIN, 150, h, `t2_${i}`));
MAIN.L([X_J2, Y2]).mark("p2");
MAIN.L([X_J2, Y3]).mark("j2");
MAIN.L([X_END, Y3]).mark("p3");

// expectation: dashed straight ramp
export const GHOST = new Poly(S).L([X_END, 300]);

// ---------- icons (thin secondary strokes) ----------
// open book above plateau 1
const book = (() => {
  const cx = 520, by = 712, w = 92, h = 58;
  const p = new Poly([cx, by]);
  p.C([cx - 30, by - 14], [cx - w + 14, by - 12], [cx - w, by]);       // left page bottom
  p.L([cx - w, by - h]);
  p.C([cx - w + 14, by - h - 12], [cx - 30, by - h - 14], [cx, by - h]); // left page top
  p.L([cx, by]);                                                          // spine
  p.C([cx + 30, by - 14], [cx + w - 14, by - 12], [cx + w, by]);
  p.L([cx + w, by - h]);
  p.C([cx + w - 14, by - h - 12], [cx + 30, by - h - 14], [cx, by - h]);
  return p;
})();
// dumbbell above plateau 2
const dumbbell = (() => {
  const cx = 1100, cy = 448, bar = 70;
  const p = new Poly([cx - bar, cy]);
  p.L([cx + bar, cy]);
  // right plates
  p.L([cx + bar, cy - 30]).L([cx + bar + 22, cy - 30]).L([cx + bar + 22, cy + 30]).L([cx + bar, cy + 30]).L([cx + bar, cy]);
  p.L([cx + bar + 22, cy]).L([cx + bar + 22, cy - 18]).L([cx + bar + 38, cy - 18]).L([cx + bar + 38, cy + 18]).L([cx + bar + 22, cy + 18]);
  // jump back across? keep separate stroke for left side
  return p;
})();
const dumbbellL = (() => {
  const cx = 1100, cy = 448, bar = 70;
  const p = new Poly([cx - bar, cy]);
  p.L([cx - bar, cy - 30]).L([cx - bar - 22, cy - 30]).L([cx - bar - 22, cy + 30]).L([cx - bar, cy + 30]).L([cx - bar, cy]);
  p.L([cx - bar - 22, cy]).L([cx - bar - 22, cy - 18]).L([cx - bar - 38, cy - 18]).L([cx - bar - 38, cy + 18]).L([cx - bar - 22, cy + 18]);
  return p;
})();
// flag at the top
const flag = (() => {
  const x = 1660, y = Y3;
  const p = new Poly([x, y]);
  p.L([x, y - 150]);
  p.C([x + 30, y - 162], [x + 55, y - 130], [x + 90, y - 140], 24);
  p.L([x + 90, y - 92]);
  p.C([x + 55, y - 82], [x + 30, y - 114], [x, y - 102], 24);
  return p;
})();

// ---------- timeline ----------
type Seg = { f0: number; f1: number; l0: number; l1: number; ease: "io" | "lin" | "snap" };
const mk = (p: Poly, specs: [number, number, string, Seg["ease"]][]): Seg[] => {
  let prev = 0;
  return specs.map(([f0, f1, mark, ease]) => {
    const l1 = mark === "end" ? p.total : p.marks[mark];
    const s = { f0, f1, l0: prev, l1, ease };
    prev = l1;
    return s;
  });
};
const EASE = {
  io: (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t),
  lin: (t: number) => t,
  snap: (t: number) => 1 - Math.pow(1 - t, 3),
};
const progress = (segs: Seg[], total: number, f: number) => {
  for (const s of segs) {
    if (f < s.f0) return s.l0;
    if (f <= s.f1) return s.l0 + (s.l1 - s.l0) * EASE[s.ease]((f - s.f0) / (s.f1 - s.f0));
  }
  return total;
};

export const T = {
  pop: 6, ghost: [12, 78] as const, focus1: [88, 118] as const,
  plateau1: [112, 228] as const, jump1: [242, 249] as const,
  plateau2: [282, 386] as const, jump2: [398, 405] as const,
  plateau3: [438, 466] as const, zoomOut: [472, 512] as const,
  endFade: [528, 548] as const, title: [540, 566] as const, tag0: 552, tagStep: 1.3, cap: 588,
};

const MAIN_SEGS = mk(MAIN, [
  [T.plateau1[0], T.plateau1[1], "p1", "lin"],
  [T.jump1[0], T.jump1[1], "j1", "snap"],
  [T.plateau2[0], T.plateau2[1], "p2", "lin"],
  [T.jump2[0], T.jump2[1], "j2", "snap"],
  [T.plateau3[0], T.plateau3[1], "end", "io"],
]);
export const mainLen = (f: number) => progress(MAIN_SEGS, MAIN.total, f);
export const ghostLen = (f: number) => GHOST.total * EASE.io(Math.min(1, Math.max(0, (f - T.ghost[0]) / (T.ghost[1] - T.ghost[0]))));

export const ICONS: { poly: Poly; f0: number; f1: number }[] = [
  { poly: book, f0: 120, f1: 162 },
  { poly: dumbbell, f0: 290, f1: 318 },
  { poly: dumbbellL, f0: 300, f1: 328 },
  { poly: flag, f0: 452, f1: 484 },
];
export const iconLen = (i: number, f: number) => {
  const ic = ICONS[i];
  return ic.poly.total * EASE.io(Math.min(1, Math.max(0, (f - ic.f0) / (ic.f1 - ic.f0))));
};

export const frameForMain = (len: number) => {
  for (let q = 0; q <= DURATION * 4; q++) if (mainLen(q / 4) >= len - 0.5) return q / 4;
  return DURATION;
};

// ---------- camera ----------
export const CAM: { f: number; c: P; z: number }[] = [
  { f: 0, c: [960, 580], z: 1.0 },
  { f: 88, c: [960, 580], z: 1.0 },
  { f: 118, c: [540, 780], z: 1.65 },
  { f: 236, c: [560, 770], z: 1.7 },   // slow creep-in during the stall
  { f: 250, c: [600, 740], z: 1.62 },
  { f: 282, c: [1080, 560], z: 1.65 },
  { f: 392, c: [1100, 550], z: 1.7 },
  { f: 406, c: [1140, 520], z: 1.62 },
  { f: 438, c: [1500, 330], z: 1.6 },
  { f: 472, c: [1510, 320], z: 1.62 },
  { f: 512, c: [960, 580], z: 1.0 },
  { f: 600, c: [960, 580], z: 0.98 },
];
export const SHAKES = [T.jump1[1], T.jump2[1]];

// ---------- captions (screen space) ----------
export const CAPTIONS: { f0: number; f1: number; text: string }[] = [
  { f0: 14, f1: 96, text: "우리가 기대하는 성장" },
  { f0: 122, f1: 236, text: "될 것 같은데… 안 된다" },
  { f0: 244, f1: 290, text: "어느 날, 갑자기" },
  { f0: 296, f1: 394, text: "그리고 또, 제자리" },
  { f0: 400, f1: 446, text: "그러다 또, 갑자기" },
  { f0: 478, f1: 528, text: "직선이 아니라, 계단으로" },
];
export const TITLE = "성장은 계단이다";
export const TAGLINE = "평평한 지금이, 다음 계단 바로 앞일지도.";

// ---------- sound events ----------
const tries = (k: number, n: number) => Array.from({ length: n }, (_, i) => {
  const peak = MAIN.marks[`t${k}_${i}`];
  return { peak: frameForMain(peak), h: [[42, 74, 128, 58], [50, 104, 66]][k - 1][i] };
});
export const EVENTS = {
  pop: T.pop,
  glide: T.ghost,
  tries: [...tries(1, 4), ...tries(2, 3)],
  draws: [T.plateau1, T.plateau2, T.plateau3],
  jumps: [T.jump1[0], T.jump2[0]],
  icons: ICONS.map((i) => [i.f0, i.f1]),
  zoomOut: T.zoomOut,
  corners: [T.zoomOut[0] + 14, T.zoomOut[0] + 22, T.zoomOut[0] + 30],
  title: T.title,
  type: Array.from(TAGLINE).map((c, i) => (c === " " ? -1 : T.tag0 + i * T.tagStep)).filter((x) => x >= 0),
  cap: T.cap,
};
