// STEP GROWTH — "growth is a staircase, not a ramp".
// Pure data module shared by the React composition and the soundtrack script.
export const FPS = 30;
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
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const progress = (segs: Seg[], total: number, f: number) => {
  for (const s of segs) {
    if (f < s.f0) return s.l0;
    if (f <= s.f1) return s.l0 + (s.l1 - s.l0) * EASE[s.ease]((f - s.f0) / (s.f1 - s.f0));
  }
  return total;
};

export type Beat = {
  duration: number;
  pop: number; ghost: [number, number];
  plateau1: [number, number]; jump1: [number, number];
  plateau2: [number, number]; jump2: [number, number];
  plateau3: [number, number]; zoomOut: [number, number];
  endFade: [number, number]; title: [number, number]; tag0: number; tagStep: number; cap: number;
  icons: [number, number][];
  captions: [number, number][];
  photos: [number, string, number][]; // frame, photo, fade
  // camera stops in "plan" form: [frame, focus-name]
  cam: [number, "all" | "p1" | "p1in" | "j1" | "p2" | "p2in" | "j2" | "p3" | "p3in" | "allEnd"][];
};

// original 20s cut (no voice)
const SHORT: Beat = {
  duration: 600, pop: 6, ghost: [12, 78],
  plateau1: [112, 228], jump1: [242, 249], plateau2: [282, 386], jump2: [398, 405],
  plateau3: [438, 466], zoomOut: [472, 512], endFade: [528, 548], title: [540, 566], tag0: 552, tagStep: 1.3, cap: 588,
  icons: [[120, 162], [290, 318], [300, 328], [452, 484]],
  captions: [[14, 96], [122, 236], [244, 290], [296, 394], [400, 446], [478, 528]],
  photos: [[0, "hang", 0], [112, "mid", 8], [150, "strain_a", 8], [190, "strain_b", 8], [232, "hang", 6], [249, "top_b", 0],
    [282, "drop", 8], [335, "mid", 8], [390, "hang", 6], [405, "top_a", 0]],
  cam: [[0, "all"], [88, "all"], [118, "p1"], [236, "p1in"], [250, "j1"], [282, "p2"], [392, "p2in"], [406, "j2"],
    [438, "p3"], [472, "p3in"], [512, "all"], [600, "allEnd"]],
};

// 26s cut timed to the ElevenLabs voiceover (sentence starts measured with silencedetect)
const VO: Beat = {
  duration: 780, pop: 3, ghost: [10, 104],
  plateau1: [135, 306], jump1: [336, 343], plateau2: [375, 466], jump2: [480, 487],
  plateau3: [498, 526], zoomOut: [522, 566], endFade: [588, 606], title: [600, 628], tag0: 616, tagStep: 2.6, cap: 732,
  icons: [[142, 190], [382, 412], [392, 422], [505, 540]],
  captions: [[12, 118], [138, 326], [337, 380], [382, 476], [480, 518], [522, 594]],
  photos: [[0, "hang", 0], [135, "mid", 8], [200, "strain_a", 8], [255, "strain_b", 8], [310, "hang", 6], [343, "top_b", 0],
    [375, "drop", 8], [425, "mid", 8], [470, "hang", 6], [487, "top_a", 0]],
  cam: [[0, "all"], [108, "all"], [135, "p1"], [330, "p1in"], [344, "j1"], [375, "p2"], [474, "p2in"], [488, "j2"],
    [498, "p3"], [522, "p3in"], [566, "all"], [780, "allEnd"]],
};
export const BEATS = { short: SHORT, vo: VO };
export type BeatName = keyof typeof BEATS;

export const timeline = (b: Beat) => {
  const segs = mk(MAIN, [
    [b.plateau1[0], b.plateau1[1], "p1", "lin"],
    [b.jump1[0], b.jump1[1], "j1", "snap"],
    [b.plateau2[0], b.plateau2[1], "p2", "lin"],
    [b.jump2[0], b.jump2[1], "j2", "snap"],
    [b.plateau3[0], b.plateau3[1], "end", "io"],
  ]);
  const mainLen = (f: number) => progress(segs, MAIN.total, f);
  const ghostLen = (f: number) => GHOST.total * EASE.io(clamp01((f - b.ghost[0]) / (b.ghost[1] - b.ghost[0])));
  const iconLen = (i: number, f: number) => ICON_POLYS[i].total * EASE.io(clamp01((f - b.icons[i][0]) / (b.icons[i][1] - b.icons[i][0])));
  const frameForMain = (len: number) => {
    for (let q = 0; q <= b.duration * 4; q++) if (mainLen(q / 4) >= len - 0.5) return q / 4;
    return b.duration;
  };
  const H = [[42, 74, 128, 58], [50, 104, 66]];
  const tries = (k: number, n: number) => Array.from({ length: n }, (_, i) => ({ peak: frameForMain(MAIN.marks[`t${k}_${i}`]), h: H[k - 1][i] }));
  const events = {
    duration: b.duration,
    pop: b.pop, glide: b.ghost,
    tries: [...tries(1, 4), ...tries(2, 3)],
    draws: [b.plateau1, b.plateau2, b.plateau3],
    jumps: [b.jump1[0], b.jump2[0]],
    icons: b.icons,
    zoomOut: b.zoomOut,
    corners: [b.zoomOut[0] + 14, b.zoomOut[0] + 22, b.zoomOut[0] + 30],
    title: b.title,
    type: Array.from(TAGLINE).map((c, i) => (c === " " ? -1 : b.tag0 + i * b.tagStep)).filter((x) => x >= 0),
    cap: b.cap,
  };
  return { b, mainLen, ghostLen, iconLen, events, shakes: [b.jump1[1], b.jump2[1]] };
};

export const ICON_POLYS = [book, dumbbell, dumbbellL, flag];

// camera focus points per layout: centre + zoom
export type Focus = Record<Beat["cam"][number][1], { c: P; z: number }>;
export const FOCUS: Record<"landscape" | "portrait", Focus> = {
  landscape: {
    all: { c: [960, 580], z: 1.0 }, allEnd: { c: [960, 580], z: 0.98 },
    p1: { c: [540, 780], z: 1.65 }, p1in: { c: [560, 770], z: 1.7 }, j1: { c: [600, 740], z: 1.62 },
    p2: { c: [1080, 560], z: 1.65 }, p2in: { c: [1100, 550], z: 1.7 }, j2: { c: [1140, 520], z: 1.62 },
    p3: { c: [1500, 330], z: 1.6 }, p3in: { c: [1510, 320], z: 1.62 },
  },
  portrait: {
    all: { c: [970, 590], z: 0.68 }, allEnd: { c: [970, 590], z: 0.665 },
    p1: { c: [530, 770], z: 1.45 }, p1in: { c: [540, 765], z: 1.52 }, j1: { c: [620, 720], z: 1.4 },
    p2: { c: [1080, 545], z: 1.45 }, p2in: { c: [1100, 540], z: 1.52 }, j2: { c: [1160, 500], z: 1.4 },
    p3: { c: [1520, 300], z: 1.45 }, p3in: { c: [1530, 295], z: 1.48 },
  },
};

export const CAPTION_TEXT = [
  "우리가 기대하는 성장",
  "될 것 같은데… 안 된다",
  "어느 날, 갑자기",
  "그리고 또, 제자리",
  "그러다 또, 갑자기",
  "직선이 아니라, 계단으로",
];
export const TITLE = "성장은 계단이다";
export const TAGLINE = "평평한 지금이, 다음 계단 바로 앞일지도.";
export const TAGLINE_LINES = ["평평한 지금이,", "다음 계단 바로 앞일지도."];
