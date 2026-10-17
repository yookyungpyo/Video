// Pure timing for the two clocks (no imports, so the soundtrack script can load it too)

export const FPS = 30;
export const TOTAL = 1290;

// story beats
export const SPLIT_AT = 150; // one clock becomes two
export const COIN_DROP = 470; // the coin starts falling onto the loved work
export const COIN_LAND = 492;
export const FOCUS_AT = 720; // the cold clock leaves, the loved one takes the centre
export const GILD = [760, 840]; // cold gold creeps over the face
export const LIFT_AT = 930; // the coin lifts away
export const CLOSE_AT = 1120;

const FAST = 0.8; // clock minutes per frame — time flies (20:00 → about 02:00 by the time the coin lands)
const SLOW = 0.04; // time crawls
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const seg = (f: number, a: number, b: number, from: number, to: number) => from + (to - from) * ease(Math.min(1, Math.max(0, (f - a) / (b - a))));

export const speedLeft = (f: number) => {
  if (f < COIN_LAND) return FAST;
  if (f < 600) return seg(f, COIN_LAND, 600, FAST, SLOW);
  if (f < LIFT_AT) return SLOW;
  if (f < 1010) return seg(f, LIFT_AT, 1010, SLOW, FAST);
  return seg(f, CLOSE_AT, CLOSE_AT + 60, FAST, 0.5);
};
export const speedRight = (_f: number) => SLOW;
// 0 = crawling, 1 = flying (used for glow, second hand, music density)
export const fastness = (f: number) => (speedLeft(f) - SLOW) / (FAST - SLOW);

// clock time in minutes since midnight, integrated so speed changes never jump
const L = new Float64Array(TOTAL + 2);
const R = new Float64Array(TOTAL + 2);
L[0] = 20 * 60; // 20:00 — the evening you sit down with the thing you love
R[0] = 14 * 60; // 14:00 — an afternoon of work done only for the money
for (let f = 1; f <= TOTAL + 1; f++) {
  L[f] = L[f - 1] + speedLeft(f - 1);
  R[f] = R[f - 1] + speedRight(f - 1);
}
export const minutesLeft = (f: number) => L[Math.max(0, Math.min(TOTAL + 1, Math.floor(f)))];
export const minutesRight = (f: number) => R[Math.max(0, Math.min(TOTAL + 1, Math.floor(f)))];
export const hhmm = (m: number) => {
  const t = ((Math.floor(m) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

// every glance at the clock (the counter under each clock)
export const GLANCES_RIGHT = [190, 205, 222, 240, 262, 280, 300, 318, 340, 358, 378, 396, 415, 432];
export const GLANCES_LEFT = [560, 590, 615, 640, 668, 700];
export const glanceCount = (f: number, list: number[]) => list.filter((g) => f >= g).length;

// the second hand only ticks while time crawls
export const TICK_EVERY = 15;
