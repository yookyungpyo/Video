// Pure, deterministic heart signal shared by the component and the soundtrack
// dump script (no imports, so plain node can load it).

export const FPS = 30;
export const TOTAL = 1250;
export const SUB = 6; // signal samples per frame (1 sample = 1px of trace)
export const PX = 6; // trace scroll speed, px per frame

// Story beats
export const WAKE_AT = 440; // the trip-day morning: the heart jumps
export const WEEK_FROM = 760; // week view replaces the live monitor
export const WEEK_TO = 1040;
export const WEEK_DRAW = [775, 895];

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const c01 = (v: number) => Math.max(0, Math.min(1, v));

export const bpmAt = (t: number) => {
  if (t < WAKE_AT) return 64;
  if (t < 700) return 64 + 34 * ease((t - WAKE_AT) / (700 - WAKE_AT));
  if (t < 890) return 98;
  if (t < 930) return 98 - 6 * ease((t - 890) / 40);
  return 92;
};

const AMP_KEYS: [number, number][] = [[0, 0.5], [150, 0.5], [190, 0.3], [370, 0.3], [385, 0.38], [WAKE_AT, 0.38], [WAKE_AT + 12, 1.0]];
export const ampAt = (t: number) => {
  if (t <= AMP_KEYS[0][0]) return AMP_KEYS[0][1];
  for (let i = 1; i < AMP_KEYS.length; i++) {
    const [t1, v1] = AMP_KEYS[i];
    if (t <= t1) {
      const [t0, v0] = AMP_KEYS[i - 1];
      return v0 + (v1 - v0) * ((t - t0) / (t1 - t0));
    }
  }
  return AMP_KEYS[AMP_KEYS.length - 1][1];
};
export const exciteAt = (t: number) => c01((ampAt(t) - 0.45) / 0.4);

// Integrated phase (in beats), precomputed at sample resolution so a changing
// heart rate never makes the trace jump.
const N = (TOTAL + 4) * SUB;
const PH = new Float64Array(N + 1);
for (let n = 1; n <= N; n++) PH[n] = PH[n - 1] + bpmAt((n - 1) / SUB) / 60 / FPS / SUB;
export const phaseAt = (t: number) => {
  if (t <= 0) return (t * 64) / 60 / FPS;
  const x = Math.min(t * SUB, N);
  const i = Math.floor(x);
  const fr = x - i;
  return fr === 0 ? PH[i] : PH[i] + (PH[Math.min(i + 1, N)] - PH[i]) * fr;
};

const g = (u: number, c: number, s: number) => Math.exp(-(((u - c) / s) ** 2) / 2);
export const R_AT = 0.32; // where the tall spike sits inside a beat
export const ecg = (u: number) =>
  0.12 * g(u, 0.17, 0.03) - 0.14 * g(u, R_AT - 0.03, 0.012) + 1.0 * g(u, R_AT, 0.018)
  - 0.26 * g(u, R_AT + 0.035, 0.014) + 0.26 * g(u, 0.56, 0.05);

export const valueAt = (t: number) => {
  const p = phaseAt(t);
  return ampAt(t) * ecg(p - Math.floor(p));
};

// Frames where an R spike happens (for the soundtrack)
export const rPeaks = (from: number, to: number) => {
  const out: { f: number; amp: number }[] = [];
  for (let n = Math.max(1, from * SUB); n < to * SUB; n++) {
    const a = PH[n - 1] - R_AT, b = PH[n] - R_AT;
    if (Math.floor(a) !== Math.floor(b)) out.push({ f: n / SUB, amp: ampAt(n / SUB) });
  }
  return out;
};

// ---------- Week view (static trace, Mon–Fri) ----------
export const WK = { x0: 100, x1: 980, base: 930, amp: 200 };
export const DAY_W = (WK.x1 - WK.x0) / 5;
const WEEK_PERIOD = 30; // px per calm beat
// one spark per day: [centre as fraction of the day, strength]
export const SPARKS: [number, number][] = [[0.52, 1.0], [0.38, 0.6], [0.6, 1.0], [0.42, 0.62], [0.5, 1.0]];
// snap each spark onto an R spike so the tallest beat is centred on it
export const SPARK_X = SPARKS.map(([fr], d) => {
  const want = WK.x0 + d * DAY_W + fr * DAY_W;
  const k = Math.round((want - WK.x0) / WEEK_PERIOD - R_AT);
  return WK.x0 + (k + R_AT) * WEEK_PERIOD;
});
export const weekValue = (x: number) => {
  let amp = 0.2;
  SPARK_X.forEach((cx, d) => { amp += (SPARKS[d][1] - 0.15) * Math.exp(-(((x - cx) / 26) ** 2)); });
  const p = (x - WK.x0) / WEEK_PERIOD;
  return amp * ecg(p - Math.floor(p));
};
export const weekHeadX = (f: number) =>
  WK.x0 + (WK.x1 - WK.x0) * c01((f - WEEK_DRAW[0]) / (WEEK_DRAW[1] - WEEK_DRAW[0]));
export const weekCross = (x: number) => WEEK_DRAW[0] + ((x - WK.x0) / (WK.x1 - WK.x0)) * (WEEK_DRAW[1] - WEEK_DRAW[0]);

// first big spike after waking (the ripple and the chime land on it)
export const FIRST_BIG = rPeaks(WAKE_AT, WAKE_AT + 60)[0].f;
