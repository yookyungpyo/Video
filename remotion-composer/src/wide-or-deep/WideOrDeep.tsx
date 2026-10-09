import { useEffect, useState } from "react";
import {
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  continueRender,
  delayRender,
} from "remotion";

const SANS = "Noto Sans KR";
const BG = "#0D1015";
const INK = "#F2F4F7";
const SUB = "#8A93A3";
const BODY = "#D5DAE1";
const HAIR = "rgba(255,255,255,0.10)";
const WIDE = "#8EA2FF"; // breadth (generalist) — periwinkle
const DEEP = "#F2B45C"; // depth (specialist) — amber
const WATER_LABEL = "#B8C4D4";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
const progIO = (f: number, at: number, dur: number) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeInOut });

export const TOTAL = 1330;
const MX = 100;

// ---------- Timeline ----------
// S1 era 0–150 · S2 two paths 150–300 · S3 the level rises 300–550
// S4 the deep field floods 550–712 · S5 stand on it 712–1070 · S6 closing 1070–1330
const CONVERGE = 150;
const BARS_AT = 186;
const RISE1 = [305, 400];
const SWELL_T = [555, 640, 712, 748];
const MORPH = 735;
const SPEC_MOVE = 785;
const RISE2 = [845, 930];
const CLOSE_AT = 1076;

// ---------- Stage geometry ----------
const STAGE_L = 100;
const STAGE_R = 980;
const FLOOR = 1130;
const GW = 48;
const GX0 = 150;
const GSTEP = 70;
const G_HEIGHTS = [110, 140, 95, 150, 120, 100];
const SX = 770;
const SW = 96;
const D = 390; // depth of the specialist bar
const SX2 = 540 - SW / 2;
const LV1 = 945; // water level once AI has raised it
const LV2 = 880; // level after the second rise
const SWELL = 189; // local surge over the specialist's field
const SCX = SX + SW / 2;
const SSIG = 150;
const PX0 = 170;
const PX1 = 910;
const SEG = (PX1 - PX0) / G_HEIGHTS.length;
const PLANK = 16;

const levelAt = (f: number) =>
  f < 700
    ? interpolate(f, RISE1, [FLOOR, LV1], { ...clamp, easing: easeInOut })
    : interpolate(f, RISE2, [LV1, LV2], { ...clamp, easing: easeInOut });
const swellAt = (f: number) => interpolate(f, SWELL_T, [0, SWELL, SWELL, 0], { ...clamp, easing: easeInOut });
const surfaceY = (x: number, f: number) => {
  const sw = swellAt(f);
  const amp = 1 + 1.5 * (sw / SWELL);
  return levelAt(f) - sw * Math.exp(-(((x - SCX) / SSIG) ** 2))
    + amp * (3 * Math.sin(x * 0.02 + f * 0.08) + 2 * Math.sin(x * 0.045 - f * 0.05));
};
// once things float, they bob gently with the water
const bob = (f: number) => 2.5 * Math.sin((f - 830) * 0.06) * interpolate(f, [830, 860], [0, 1], clamp);
const plankTop = (f: number) => levelAt(f) - 10 + bob(f);

// ---------- Particles (the bright, restless opening) ----------
const mulberry32 = (a: number) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rnd = mulberry32(17);
type Part = {
  x0: number; y0: number; ax: number; ay: number; wx: number; wy: number; px: number; py: number;
  r: number; tw: number; ph: number; delay: number; tx: number; ty: number; color: string;
};
const PARTS: Part[] = Array.from({ length: 66 }, (_, i) => {
  const toSpec = i % 9 >= 6; // about a third gather into the deep bar
  let tx: number, ty: number;
  if (toSpec) {
    tx = SX + 12 + rnd() * (SW - 24);
    ty = FLOOR - D + 20 + rnd() * (D - 40);
  } else {
    const g = i % 6;
    tx = GX0 + g * GSTEP + 8 + rnd() * (GW - 16);
    ty = FLOOR - G_HEIGHTS[g] + 12 + rnd() * (G_HEIGHTS[g] - 24);
  }
  const white = rnd() < 0.45;
  return {
    x0: 150 + rnd() * 780, y0: 500 + rnd() * 620,
    ax: 40 + rnd() * 90, ay: 30 + rnd() * 80,
    wx: 0.012 + rnd() * 0.022, wy: 0.01 + rnd() * 0.02,
    px: rnd() * 6.28, py: rnd() * 6.28,
    r: 2 + rnd() * 3.2, tw: 0.05 + rnd() * 0.07, ph: rnd() * 6.28,
    delay: rnd() * 16, tx, ty,
    color: white ? "#E6EAF2" : toSpec ? DEEP : WIDE,
  };
});

// ---------- Fonts & text ----------

const fontCss = `
@font-face { font-family: '${SANS}'; font-weight: 400; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-400-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${SANS}'; font-weight: 700; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2'); }
`;

const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender("load-fonts"));
  useEffect(() => {
    const done = () => continueRender(handle);
    Promise.all([
      (document as any).fonts.load(`400 64px "${SANS}"`, "가"),
      (document as any).fonts.load(`700 64px "${SANS}"`, "가"),
    ])
      .then(() => (document as any).fonts.ready)
      .then(done)
      .catch(done);
  }, [handle]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

const Line: React.FC<{ f: number; at: number; style?: React.CSSProperties; children: React.ReactNode }> =
  ({ f, at, style, children }) => {
    const p = prog(f, at, 20);
    return (
      <div style={{ overflow: "hidden", paddingBottom: "0.12em" }}>
        <div style={{ transform: `translateY(${(1 - p) * 110}%)`, opacity: 0.3 + 0.7 * p, whiteSpace: "nowrap", ...style }}>
          {children}
        </div>
      </div>
    );
  };

type Seg = { t: string; c?: string };
type Cap = { from: number; to: number; lines: { at: number; segs: Seg[] }[] };
const CAP_TOP = 1250;

const Captions: React.FC<{ f: number; caps: Cap[] }> = ({ f, caps }) => {
  const c = caps.find((x) => f >= x.from && f < x.to);
  if (!c) return null;
  const out = clamp01((c.to - f) / 10);
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP, opacity: out }}>
      <div style={{ width: 2, height: 22, background: HAIR, marginBottom: 18 }} />
      {c.lines.map((l, i) =>
        f >= l.at ? (
          <Line key={i} f={f} at={l.at} style={{ fontSize: 42, fontWeight: 400, lineHeight: 1.5, color: BODY }}>
            {l.segs.map((s, j) => (
              <span key={j} style={{ color: s.c ?? undefined, fontWeight: s.c ? 700 : undefined }}>{s.t}</span>
            ))}
          </Line>
        ) : null,
      )}
    </div>
  );
};

const CAPTIONS: Cap[] = [
  { from: 20, to: 150, lines: [
    { at: 20, segs: [{ t: "지금은 " }, { t: "찬란", c: INK }, { t: "하지만," }] },
    { at: 36, segs: [{ t: "혼란", c: INK }, { t: "한 시기임이 분명하다" }] },
  ] },
  { from: 168, to: 300, lines: [
    { at: 168, segs: [{ t: "제너럴리스트", c: WIDE }, { t: "로 가야 하나," }] },
    { at: 196, segs: [{ t: "스페셜리스트", c: DEEP }, { t: "로 가야 하나?" }] },
  ] },
  { from: 318, to: 428, lines: [
    { at: 318, segs: [{ t: "AI가 " }, { t: "'누구나 할 수 있는 수준'", c: INK }, { t: "을" }] },
    { at: 334, segs: [{ t: "끌어올리고 있다" }] },
  ] },
  { from: 436, to: 548, lines: [
    { at: 436, segs: [{ t: "넓게", c: WIDE }, { t: " 아는 것만으로는," }] },
    { at: 452, segs: [{ t: "잘 드러나지 않는다" }] },
  ] },
  { from: 560, to: 712, lines: [
    { at: 560, segs: [{ t: "한 분야만 " }, { t: "깊게", c: DEEP }, { t: " 파도," }] },
    { at: 590, segs: [{ t: "그 분야가 먼저 잠길 수 있다" }] },
  ] },
  { from: 722, to: 930, lines: [
    { at: 722, segs: [{ t: "AI를 " }, { t: "딛고 서면,", c: INK }] },
    { at: 828, segs: [{ t: "물이 차오를수록 " }, { t: "함께 올라간다", c: INK }] },
  ] },
  { from: 938, to: 1066, lines: [
    { at: 938, segs: [{ t: "넓은 건", c: WIDE }, { t: " AI와 함께," }] },
    { at: 966, segs: [{ t: "깊은 건", c: DEEP }, { t: " 하나, 나만의 것으로" }] },
  ] },
];

// ---------- Pieces ----------

const Overline: React.FC<{ f: number; from: number; to: number; tag: string; text: string; color: string }> =
  ({ f, from, to, tag, text, color }) => {
    if (f < from || f >= to) return null;
    const p = prog(f, from, 20) * clamp01((to - f) / 10);
    return (
      <div style={{ position: "absolute", left: MX, top: 350, display: "flex", alignItems: "center", gap: 18, opacity: p }}>
        <div style={{ width: 36 * p, height: 2, background: color }} />
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color }}>{tag}</span>
        <span style={{ fontSize: 24, fontWeight: 400, color: SUB }}>{text}</span>
      </div>
    );
  };

const Particles: React.FC<{ f: number }> = ({ f }) => {
  if (f > 230) return null;
  const gone = 1 - prog(f, 196, 20);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        {[["w", "#E6EAF2"], ["a", WIDE], ["b", DEEP]].map(([k, c]) => (
          <radialGradient key={k} id={`halo-${k}`}>
            <stop offset="0" stopColor={c} stopOpacity={0.55} />
            <stop offset="1" stopColor={c} stopOpacity={0} />
          </radialGradient>
        ))}
      </defs>
      {PARTS.map((p, i) => {
        const cx = p.x0 + p.ax * Math.sin(f * p.wx + p.px) + 0.4 * p.ax * Math.sin(f * p.wx * 2.3 + p.py);
        const cy = p.y0 + p.ay * Math.sin(f * p.wy + p.py) + 0.4 * p.ay * Math.cos(f * p.wy * 1.7 + p.px);
        const k = progIO(f, CONVERGE + p.delay, 42);
        const x = lerp(cx, p.tx, k);
        const y = lerp(cy, p.ty, k);
        const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(f * p.tw + p.ph));
        const a = prog(f, p.delay * 1.5, 30) * lerp(tw, 1, k) * gone;
        const hk = p.color === DEEP ? "b" : p.color === WIDE ? "a" : "w";
        return (
          <g key={i} opacity={a}>
            <circle cx={x} cy={y} r={p.r * 4.2} fill={`url(#halo-${hk})`} />
            <circle cx={x} cy={y} r={p.r} fill={p.color} />
          </g>
        );
      })}
    </svg>
  );
};

type Rect = { x: number; y: number; w: number; h: number };

const barRects = (f: number) => {
  const gens: (Rect & { k: number })[] = G_HEIGHTS.map((h, i) => {
    const grow = prog(f, BARS_AT + i * 3, 26);
    // surface first (rise), then spread into one plank
    const kr = progIO(f, MORPH + i * 2, 24);
    const ks = progIO(f, MORPH + 20 + i * 2, 28);
    const src = { x: GX0 + i * GSTEP, y: FLOOR - h * grow, w: GW, h: h * grow };
    const top = plankTop(f);
    const dst = { x: PX0 + i * SEG + 1, y: top, w: SEG - 2, h: PLANK };
    return { x: lerp(src.x, dst.x, ks), y: lerp(src.y, dst.y, kr), w: lerp(src.w, dst.w, ks), h: lerp(src.h, dst.h, kr), k: kr };
  });
  const sg = prog(f, BARS_AT + 10, 34);
  const k = progIO(f, SPEC_MOVE, 45);
  const bottom = lerp(FLOOR, plankTop(f), k);
  const spec = { x: lerp(SX, SX2, k), y: bottom - D * sg, w: SW, h: D * sg, k };
  return { gens, spec };
};

// how far under the surface a bar's top is (0 = dry, 1 = clearly submerged)
const sunk = (r: Rect, f: number) => clamp01((r.y - surfaceY(r.x + r.w / 2, f)) / 30);

const BarShape: React.FC<{ r: Rect; color: string; fill: number; dim: number; opacity: number }> =
  ({ r, color, fill, dim, opacity }) => (
    <rect x={r.x} y={r.y} width={r.w} height={Math.max(0, r.h)} rx={3}
      fill={color} fillOpacity={fill * (1 - 0.45 * dim)}
      stroke={color} strokeOpacity={1 - 0.55 * dim} strokeWidth={2} opacity={opacity} />
  );

const Bars: React.FC<{ f: number; layer: "under" | "over" }> = ({ f, layer }) => {
  if (f < BARS_AT) return null;
  const { gens, spec } = barRects(f);
  const closing = interpolate(f, [CLOSE_AT, CLOSE_AT + 40], [0, 1], clamp);
  return (
    <g>
      {gens.map((r, i) => {
        const op = layer === "under" ? 1 - r.k : r.k;
        if (op <= 0) return null;
        return (
          <BarShape key={i} r={r} color={WIDE} fill={lerp(0.18, 0.42, r.k)} dim={layer === "under" ? sunk(r, f) : 0.35 * closing}
            opacity={op} />
        );
      })}
      {(() => {
        const op = layer === "under" ? 1 - spec.k : spec.k;
        if (op <= 0) return null;
        return <BarShape r={spec} color={DEEP} fill={0.22 + 0.1 * closing} dim={layer === "under" ? sunk(spec, f) : 0} opacity={op} />;
      })()}
    </g>
  );
};

const Water: React.FC<{ f: number }> = ({ f }) => {
  const show = prog(f, RISE1[0] - 2, 12);
  if (show <= 0) return null;
  const pts: string[] = [];
  for (let x = STAGE_L; x <= STAGE_R; x += 8) pts.push(`${x} ${surfaceY(x, f).toFixed(1)}`);
  const surface = `M ${pts.join(" L ")}`;
  const body = `${surface} L ${STAGE_R} ${FLOOR} L ${STAGE_L} ${FLOOR} Z`;
  const dimEnd = interpolate(f, [CLOSE_AT, CLOSE_AT + 40], [1, 0.7], clamp);
  return (
    <g opacity={show * dimEnd}>
      <path d={body} fill="url(#water)" />
      <path d={surface} stroke="rgba(201,214,230,0.75)" strokeWidth={2} fill="none" />
    </g>
  );
};

const SpecGlow: React.FC<{ f: number }> = ({ f }) => {
  const g = prog(f, 840, 30) * (0.6 + 0.4 * interpolate(f, [CLOSE_AT, CLOSE_AT + 60], [0, 1], clamp));
  if (g <= 0) return null;
  const { spec } = barRects(f);
  const breathe = 1 + 0.06 * Math.sin(f * 0.05);
  return (
    <ellipse cx={spec.x + spec.w / 2} cy={spec.y} rx={130 * breathe} ry={86 * breathe} fill="url(#glow-deep)" opacity={g} />
  );
};

const Stage: React.FC<{ f: number }> = ({ f }) => {
  const floorOp = prog(f, BARS_AT - 6, 20);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9DB4D2" stopOpacity={0.22} />
          <stop offset="1" stopColor="#9DB4D2" stopOpacity={0.07} />
        </linearGradient>
        <radialGradient id="glow-deep">
          <stop offset="0" stopColor={DEEP} stopOpacity={0.35} />
          <stop offset="1" stopColor={DEEP} stopOpacity={0} />
        </radialGradient>
      </defs>
      <line x1={STAGE_L} y1={FLOOR} x2={STAGE_L + (STAGE_R - STAGE_L) * floorOp} y2={FLOOR} stroke={HAIR} strokeWidth={2} />
      <SpecGlow f={f} />
      <Bars f={f} layer="under" />
      <Water f={f} />
      <Bars f={f} layer="over" />
    </svg>
  );
};

const Labels: React.FC<{ f: number }> = ({ f }) => {
  const { spec } = barRects(f);
  const groupOp = prog(f, 206, 18) * (1 - prog(f, 735, 12));
  const waterOp = prog(f, 392, 20) * (1 - prog(f, 735, 12));
  const after = prog(f, 840, 20) * interpolate(f, [CLOSE_AT, CLOSE_AT + 40], [1, 0.75], clamp);
  const tag = (en: string, ko: string, color: string): React.ReactNode => (
    <>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 5, color }}>{en}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: INK, marginTop: 2 }}>{ko}</div>
    </>
  );
  return (
    <>
      {groupOp > 0 && (
        <>
          <div style={{ position: "absolute", left: GX0, top: FLOOR + 18, opacity: groupOp }}>{tag("GENERALIST", "넓게", WIDE)}</div>
          <div style={{ position: "absolute", left: SX, top: FLOOR + 18, opacity: groupOp }}>{tag("SPECIALIST", "깊게", DEEP)}</div>
        </>
      )}
      {waterOp > 0 && (
        <div style={{
          position: "absolute", left: GX0, top: levelAt(f) - 50, opacity: waterOp,
          fontSize: 26, fontWeight: 700, color: WATER_LABEL, whiteSpace: "nowrap",
        }}>AI로 누구나 할 수 있는 수준</div>
      )}
      {after > 0 && (
        <>
          <div style={{ position: "absolute", left: spec.x + spec.w + 26, top: spec.y + 6, opacity: after }}>
            {tag("DEPTH", "나만의 깊이", DEEP)}
          </div>
          <div style={{
            position: "absolute", right: 1080 - PX1, top: plankTop(f) + PLANK + 22, opacity: after, textAlign: "right",
          }}>
            {tag("BREADTH", "AI와 함께 넓게", WIDE)}
          </div>
        </>
      )}
    </>
  );
};

const Closing: React.FC<{ f: number }> = ({ f }) => {
  if (f < CLOSE_AT) return null;
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP - 10 }}>
      <Line f={f} at={CLOSE_AT} style={{ fontSize: 38, color: SUB, lineHeight: 1.5 }}>
        제너럴리스트냐, 스페셜리스트냐가 아니라
      </Line>
      <div style={{ height: 14 }} />
      <Line f={f} at={CLOSE_AT + 50} style={{ fontSize: 66, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.28 }}>
        넓이 위에,
      </Line>
      <Line f={f} at={CLOSE_AT + 74} style={{ fontSize: 66, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.28 }}>
        나만의 <span style={{ color: DEEP }}>깊이 하나.</span>
      </Line>
    </div>
  );
};

const Grain: React.FC<{ f: number }> = ({ f }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.06, mixBlendMode: "soft-light", pointerEvents: "none" }}>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={(Math.floor(f / 2) % 4) + 1} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)" />
  </svg>
);

// ---------- Root ----------

export const WideOrDeep: React.FC = () => {
  const f = useCurrentFrame();
  const endFade = interpolate(f, [TOTAL - 18, TOTAL], [1, 0], clamp);
  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      background: BG, fontFamily: `'${SANS}', sans-serif`, opacity: endFade,
    }}>
      <FontLoader />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 80% 55% at 50% 44%, #18202B 0%, rgba(13,16,21,0) 70%)",
      }} />
      <div style={{ position: "absolute", inset: 0, transform: "translateY(30px)" }}>
        <Overline f={f} from={6} to={300} tag="THE QUESTION" text="넓게, 혹은 깊게" color={INK} />
        <Overline f={f} from={308} to={712} tag="RISING LEVEL" text="차오르는 수준" color={WATER_LABEL} />
        <Overline f={f} from={720} to={TOTAL + 10} tag="THE ANSWER" text="넓이와 깊이" color={DEEP} />
        <Particles f={f} />
        <Stage f={f} />
        <Labels f={f} />
        <Captions f={f} caps={CAPTIONS} />
        <Closing f={f} />
      </div>
      <Grain f={f} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.45) 100%)",
      }} />
    </div>
  );
};
