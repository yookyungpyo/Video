// ONE LINE — a single continuous pen stroke laid out in world space.
// Pure data module (no React) so the soundtrack script can reuse the exact timings.
export const FPS = 30;
export const DURATION = 450; // 15s
export type P = [number, number];

const cubic = (a: P, b: P, c: P, d: P, n = 40): P[] => {
  const out: P[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([
      u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
      u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
    ]);
  }
  return out;
};
const line = (a: P, b: P): P[] => {
  const n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 12));
  return Array.from({ length: n }, (_, i) => {
    const t = (i + 1) / n;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] as P;
  });
};
const connector = (a: P, b: P): P[] =>
  cubic(a, [a[0] + 420, a[1]], [b[0] - 420, b[1]], b, 60);

// ---------- segments ----------
const DOT: P = [330, 540];

const wave = (): P[] => {
  const pts: P[] = [];
  const x0 = DOT[0], x1 = 1620;
  for (let x = x0 + 3; x <= x1; x += 3) {
    const t = (x - x0) / (x1 - x0);
    const env = Math.exp(-Math.pow((t - 0.48) / 0.15, 2));
    const a = 210 * env + 18 * Math.sin(Math.PI * t);
    pts.push([x, 540 - a * Math.sin(t * 40)]);
  }
  return pts;
};

const CHART_START: P = [2230, 830];
const chart = () => {
  const pts: P[] = [];
  const peaks: P[] = [];
  let cur: P = CHART_START;
  for (let i = 0; i < 9; i++) {
    const up: P = [cur[0] + 112, cur[1] - 100];
    pts.push(...line(cur, up));
    peaks.push(up);
    const dn: P = [up[0] + 58, up[1] + 46];
    pts.push(...line(up, dn));
    cur = dn;
  }
  const end: P = [cur[0] + 90, cur[1] - 70];
  pts.push(...line(cur, end));
  return { pts, peaks, end };
};

// bulb: designed in a 640x360 sketch space, mapped into world
const BX = 5000, BY = 770, BS = 2.7;
const bm = (x: number, y: number): P => [BX + (x - 320) * BS, BY + (y - 290) * BS];
const bulb = () => {
  const pts: P[] = [];
  let cur = bm(40, 290);
  const L = (x: number, y: number) => { const n = bm(x, y); pts.push(...line(cur, n)); cur = n; };
  const C = (a: P, b: P, c: P) => { const n = bm(...c); pts.push(...cubic(cur, bm(...a), bm(...b), n, 30)); cur = n; };
  const start = cur;
  L(285, 290); L(285, 258);
  C([285, 242], [268, 232], [264.8, 221.3]);
  // globe arc, centre (320,175) r=72, θ 140°→400°
  for (let i = 1; i <= 90; i++) {
    const th = ((140 + (260 * i) / 90) * Math.PI) / 180;
    const n = bm(320 + 72 * Math.cos(th), 175 + 72 * Math.sin(th));
    pts.push(n); cur = n;
  }
  C([372, 232], [355, 242], [355, 258]);
  L(355, 290); L(340, 290); L(340, 215);
  L(330, 198); L(320, 215); L(310, 198); L(300, 215);
  const filamentEndIdx = () => pts.length; // marker taken after next line
  L(300, 290);
  const fil = filamentEndIdx();
  L(600, 290);
  return { pts, start, end: cur, filamentIdx: fil };
};

// coil loops (sketch space mapped)
const CX0 = 6250, CS = 3;
const cm = (x: number, y: number): P => [CX0 + (x - 60) * CS, 540 + (y - 190) * CS];
const coil = () => {
  const pts: P[] = [];
  const loopTops: number[] = [];
  let cur = cm(60, 220);
  const start = cur;
  for (let i = 0; i < 6; i++) {
    const cx = 150 + i * 62;
    const a = cm(cx + 10, 140);
    pts.push(...cubic(cur, cm(cx, 220), cm(cx + 40, 140), a, 30));
    loopTops.push(pts.length - 1);
    const b = cm(cx + 40, 225);
    pts.push(...cubic(a, cm(cx - 25, 140), cm(cx - 5, 230), b, 30));
    cur = b;
  }
  const end = cm(590, 222);
  pts.push(...line(cur, end));
  return { pts, start, end, loopTops };
};

const UL_START: P = [8380, 700], UL_END: P = [9620, 700];

// ---------- assemble one polyline ----------
const w = wave();
const ch = chart();
const bu = bulb();
const co = coil();

type Mark = { name: string; idx: number };
const ALL: P[] = [DOT];
const marks: Mark[] = [];
const add = (name: string, pts: P[]) => { ALL.push(...pts); marks.push({ name, idx: ALL.length - 1 }); };

add("wave", w);
add("c1", connector(w[w.length - 1], CHART_START));
const chartBase = ALL.length;
add("chart", ch.pts);
add("c2", connector(ch.end, bu.start));
const bulbBase = ALL.length;
add("bulb", bu.pts);
add("c3", connector(bu.end, co.start));
const coilBase = ALL.length;
add("coil", co.pts);
add("c4", connector(co.end, UL_START));
add("underline", line(UL_START, UL_END));

export const POINTS = ALL;
export const CUM: number[] = (() => {
  const c = [0];
  for (let i = 1; i < ALL.length; i++)
    c.push(c[i - 1] + Math.hypot(ALL[i][0] - ALL[i - 1][0], ALL[i][1] - ALL[i - 1][1]));
  return c;
})();
export const TOTAL = CUM[CUM.length - 1];
const lenAt = (name: string) => CUM[marks.find((m) => m.name === name)!.idx];
export const PATH_D =
  "M" + ALL.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L");

// ---------- timeline: [startFrame, endFrame, toLength] ----------
export type Phase = { name: string; f0: number; f1: number; l0: number; l1: number };
const seq: [string, number, number][] = [
  ["wave", 45, 118],
  ["c1", 122, 150],
  ["chart", 152, 208],
  ["c2", 212, 240],
  ["bulb", 242, 300],
  ["c3", 302, 330],
  ["coil", 332, 374],
  ["c4", 377, 405],
  ["underline", 407, 432],
];
export const PHASES: Phase[] = (() => {
  let prev = 0;
  return seq.map(([name, f0, f1]) => {
    const l1 = lenAt(name);
    const p = { name, f0, f1, l0: prev, l1 };
    prev = l1;
    return p;
  });
})();

const easeInOut = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);
const easeConn = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export const drawnLength = (f: number): number => {
  for (const p of PHASES) {
    if (f < p.f0) return p.l0;
    if (f <= p.f1) {
      const t = (f - p.f0) / (p.f1 - p.f0);
      const e = /^c\d$/.test(p.name) ? easeConn(t) : easeInOut(t);
      return p.l0 + (p.l1 - p.l0) * e;
    }
  }
  return TOTAL;
};

export const pointAt = (len: number): P => {
  let lo = 0, hi = CUM.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (CUM[m] < len) lo = m; else hi = m; }
  const seg = CUM[hi] - CUM[lo] || 1;
  const t = Math.min(1, Math.max(0, (len - CUM[lo]) / seg));
  return [POINTS[lo][0] + (POINTS[hi][0] - POINTS[lo][0]) * t, POINTS[lo][1] + (POINTS[hi][1] - POINTS[lo][1]) * t];
};

// frame at which the pen first reaches a given length
export const frameForLength = (len: number): number => {
  for (let f = 0; f <= DURATION * 4; f++) if (drawnLength(f / 4) >= len - 0.5) return f / 4;
  return DURATION;
};

// ---------- camera keyframes (world centre) ----------
export const CAM: { f: number; c: P; z: number }[] = [
  { f: 0, c: [960, 540], z: 1.12 },
  { f: 45, c: [960, 540], z: 1.0 },
  { f: 120, c: [960, 540], z: 1.0 },
  { f: 152, c: [3020, 560], z: 1.0 },
  { f: 210, c: [3020, 560], z: 1.0 },
  { f: 242, c: [5000, 540], z: 1.0 },
  { f: 300, c: [5000, 540], z: 1.0 },
  { f: 332, c: [7045, 540], z: 1.0 },
  { f: 375, c: [7045, 540], z: 1.0 },
  { f: 407, c: [9000, 560], z: 1.0 },
  { f: 450, c: [9000, 560], z: 0.97 },
];

// ---------- extras & sound events ----------
export const CHART_PEAKS = ch.peaks;
export const TICKS_X = ch.peaks.map((p) => p[0]);
export const CHART_BASE_Y = 900;
export const BULB_GLOBE = { c: bm(320, 175), r: 72 * BS };
export const UL = { start: UL_START, end: UL_END };
export const TAGLINE = "ONE LINE. ONE STORY.";
export const TAG_F0 = 420; // typewriter start
export const TAG_STEP = 1.1; // frames per char

export const EVENTS = (() => {
  // chart peaks: find index of each peak point in ALL
  const peakIdx: number[] = [];
  ch.peaks.forEach((pk) => {
    for (let i = chartBase; i < chartBase + ch.pts.length; i++)
      if (ALL[i][0] === pk[0] && ALL[i][1] === pk[1]) { peakIdx.push(i); break; }
  });
  const waveMid = Math.round(w.length * 0.48);
  return {
    pop: 10,
    wavePeak: frameForLength(CUM[1 + waveMid]),
    ticks: peakIdx.map((i) => frameForLength(CUM[i])),
    ding: frameForLength(CUM[bulbBase + bu.filamentIdx - 1]),
    loops: co.loopTops.map((i) => frameForLength(CUM[coilBase + i])),
    moves: [122, 212, 302, 377],
    draws: PHASES.filter((p) => !/^c\d$/.test(p.name)).map((p) => [p.f0, p.f1]),
    conns: PHASES.filter((p) => /^c\d$/.test(p.name)).map((p) => [p.f0, p.f1]),
    type: Array.from(TAGLINE).map((ch, i) => (ch === " " ? -1 : TAG_F0 + i * TAG_STEP)).filter((x) => x >= 0),
    cap: 444,
  };
})();
