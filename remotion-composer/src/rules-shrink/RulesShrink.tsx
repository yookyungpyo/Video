import { useEffect, useState } from "react";
import {
  Easing,
  interpolate,
  interpolateColors,
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
const LINE = "#C9CED6";
const AMBER = "#F2B45C";
const DOT = "#E9EEF5";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });

export const TOTAL = 1170;
const MX = 100;

// ---------- Timeline ----------
// S1 free 0–150 · S2 rules 150–510 · S3 stillness 510–675 · S4 declaration 675–870
// S5 direction 870–1060 · S6 closing 1060–1170
const RULE_AT = [170, 230, 290, 350, 410];
const CRACK_AT = [776, 762, 748, 734, 720]; // walls give way in reverse order
const EXPAND = [770, 840] as const;
const STILL_AT = 510;
const LIGHT_AT = 875;
const MOVE = [900, 1030] as const;

type R = [number, number, number, number];
const REG: R[] = [
  [140, 480, 940, 1180],
  [140, 480, 760, 1180],
  [140, 650, 760, 1180],
  [140, 650, 580, 1180],
  [140, 810, 580, 1180],
  [140, 810, 420, 1180],
];
const RULES = [
  { text: "보고는\n3단계로", w: [760, 480, 760, 1180], lx: 780, ly: 506 },
  { text: "결재 전\n진행 금지", w: [140, 650, 760, 650], lx: 160, ly: 506 },
  { text: "정해진\n양식만", w: [580, 650, 580, 1180], lx: 598, ly: 676 },
  { text: "예외\n없음", w: [140, 810, 580, 810], lx: 160, ly: 668 },
  { text: "실수하면\n경위서", w: [420, 810, 420, 1180], lx: 438, ly: 836 },
];
const LIGHT = [860, 560] as const;

const area = (r: R) => (r[2] - r[0]) * (r[3] - r[1]);
const lerpR = (a: R, b: R, t: number): R => a.map((v, i) => v + (b[i] - v) * t) as R;

const regionAt = (f: number): R => {
  if (f >= EXPAND[0]) return lerpR(REG[5], REG[0], easeInOut(clamp01((f - EXPAND[0]) / (EXPAND[1] - EXPAND[0]))));
  let r = REG[0];
  for (let k = 0; k < 5; k++) {
    const t = clamp01((f - (RULE_AT[k] + 8)) / 22);
    if (t <= 0) break;
    r = lerpR(REG[k], REG[k + 1], easeInOut(t));
  }
  return r;
};

// 0 → 1 as the five rules land
const restrictAt = (f: number) =>
  RULE_AT.reduce((s, t) => s + clamp01((f - t - 8) / 22), 0) / RULE_AT.length;
const stillAt = (f: number) => (f < MOVE[0] ? interpolate(f, [STILL_AT, STILL_AT + 50], [0, 1], { ...clamp, easing: easeInOut }) : 0);

const ampAt = (f: number) => {
  const base = 0.85 - 0.45 * restrictAt(f);
  return base + (0.1 - base) * stillAt(f);
};
const speedAt = (f: number) => {
  const base = 1 - 0.55 * restrictAt(f);
  return base + (0.1 - base) * stillAt(f);
};
const sizeAt = (f: number) => {
  if (f >= LIGHT_AT) return interpolate(f, [LIGHT_AT + 5, LIGHT_AT + 40], [9, 22], { ...clamp, easing: easeOut });
  const base = 20 - 10 * restrictAt(f);
  return base + (9 - base) * stillAt(f);
};

const PHASE: number[] = (() => {
  const p = [0];
  for (let f = 1; f <= TOTAL; f++) p.push(p[f - 1] + 0.055 * speedAt(f));
  return p;
})();

type P = [number, number];
const bez = (a: P, b: P, c: P, d: P, t: number): P => {
  const u = 1 - t;
  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  ];
};

const wanderAt = (f: number): P => {
  const r = f < 760 ? regionAt(f) : REG[5];
  const m = sizeAt(f) + 18;
  const cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2;
  const hw = (r[2] - r[0]) / 2 - m, hh = (r[3] - r[1]) / 2 - m;
  const a = ampAt(f), ph = PHASE[Math.max(0, Math.min(TOTAL, f))];
  return [cx + Math.sin(ph + 0.3) * hw * a, cy + Math.sin(ph * 1.37) * hh * a];
};

const START = wanderAt(MOVE[0] - 1);
const posAt = (f: number): P => {
  if (f < MOVE[0]) return wanderAt(f);
  if (f < MOVE[1]) {
    const t = easeInOut((f - MOVE[0]) / (MOVE[1] - MOVE[0]));
    return bez(START, [260, 640], [620, 1110], [LIGHT[0], LIGHT[1]], t);
  }
  const d = f - MOVE[1];
  const rad = 30 * clamp01(d / 30);
  return [LIGHT[0] + Math.sin(d * 0.05) * rad, LIGHT[1] - (1 - Math.cos(d * 0.05)) * rad * 0.6];
};

const COMPANIONS = [
  { at: 935, s: [200, 1110] as P, c1: [420, 1160] as P, c2: [560, 700] as P, ang: 2.5, r: 12 },
  { at: 950, s: [520, 1150] as P, c1: [900, 1150] as P, c2: [990, 820] as P, ang: 1.1, r: 13 },
  { at: 965, s: [170, 720] as P, c1: [300, 470] as P, c2: [600, 470] as P, ang: 3.7, r: 11 },
];
const compAt = (i: number, f: number): P | null => {
  const c = COMPANIONS[i];
  if (f < c.at) return null;
  const end: P = [LIGHT[0] + Math.cos(c.ang) * 82, LIGHT[1] + Math.sin(c.ang) * 82];
  const t = clamp01((f - c.at) / 110);
  if (t < 1) return bez(c.s, c.c1, c.c2, end, easeInOut(t));
  const d = f - c.at - 110;
  const a = c.ang + d * 0.012;
  return [LIGHT[0] + Math.cos(a) * 82, LIGHT[1] + Math.sin(a) * 82];
};

// ---------- Fonts ----------

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

// ---------- Text primitives ----------

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
type Cap = { from: number; to: number; lines: { at: number; segs: Seg[] }[]; big?: boolean };

const Captions: React.FC<{ f: number; caps: Cap[] }> = ({ f, caps }) => {
  const c = caps.find((x) => f >= x.from && f < x.to);
  if (!c) return null;
  const out = clamp01((c.to - f) / 10);
  const size = c.big ? 66 : 42;
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: 1320, opacity: out }}>
      {!c.big && <div style={{ width: 2, height: 22, background: HAIR, marginBottom: 18 }} />}
      {c.lines.map((l, i) =>
        f >= l.at ? (
          <Line key={i} f={f} at={l.at} style={{
            fontSize: size, fontWeight: c.big ? 700 : 400, lineHeight: c.big ? 1.25 : 1.5,
            color: c.big ? INK : BODY, letterSpacing: c.big ? -1.5 : 0,
          }}>
            {l.segs.map((s, j) => (
              <span key={j} style={{ color: s.c ?? undefined, fontWeight: s.c && !c.big ? 700 : undefined }}>{s.t}</span>
            ))}
          </Line>
        ) : null,
      )}
    </div>
  );
};

const CAPTIONS: Cap[] = [
  { from: 30, to: 150, lines: [{ at: 30, segs: [{ t: "처음엔, 누구나 " }, { t: "자유롭게", c: INK }, { t: " 움직인다" }] }] },
  { from: 168, to: 505, lines: [
    { at: 168, segs: [{ t: "규칙이 하나 늘 때마다," }] },
    { at: 330, segs: [{ t: "행동은 조금씩 " }, { t: "움츠러든다", c: INK }] },
  ] },
  { from: 520, to: 672, lines: [
    { at: 520, segs: [{ t: "결국 아무도 먼저 움직이지 않는다." }] },
    { at: 560, segs: [{ t: "시키는 것만 한다." }] },
  ] },
  { from: 688, to: 868, big: true, lines: [
    { at: 688, segs: [{ t: "난 규칙을" }] },
    { at: 696, segs: [{ t: "만들지 않는다." }] },
  ] },
  { from: 885, to: 972, lines: [{ at: 885, segs: [{ t: "대신, " }, { t: "방향", c: AMBER }, { t: "을 공유한다" }] }] },
  { from: 972, to: 1058, lines: [
    { at: 972, segs: [{ t: "방향이 분명하면," }] },
    { at: 980, segs: [{ t: "규칙 없이도 움직인다" }] },
  ] },
  { from: 1062, to: TOTAL + 10, big: true, lines: [
    { at: 1062, segs: [{ t: "규칙이 줄면," }] },
    { at: 1070, segs: [{ t: "행동이 커진다.", c: AMBER }] },
  ] },
];

// ---------- Arena ----------

const Walls: React.FC<{ f: number }> = ({ f }) => (
  <>
    {RULES.map((r, k) => {
      const at = RULE_AT[k];
      if (f < at) return null;
      const draw = prog(f, at, 18);
      const crack = clamp01((f - CRACK_AT[k]) / 18);
      if (crack >= 1) return null;
      const [x1, y1, x2, y2] = r.w;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const gap = crack * 0.5; // fraction of each half that falls away from the middle
      const segA = [x1, y1, mx + (x1 - mx) * gap, my + (y1 - my) * gap];
      const segB = [mx + (x2 - mx) * gap, my + (y2 - my) * gap, x2, y2];
      const op = 1 - crack;
      if (crack <= 0) {
        return (
          <line key={k} x1={x1} y1={y1} x2={x1 + (x2 - x1) * draw} y2={y1 + (y2 - y1) * draw}
            stroke={LINE} strokeWidth={2.5} strokeLinecap="round" />
        );
      }
      return (
        <g key={k} opacity={op}>
          <line x1={segA[0]} y1={segA[1]} x2={segA[2]} y2={segA[3]} stroke={LINE} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={segB[0]} y1={segB[1]} x2={segB[2]} y2={segB[3]} stroke={LINE} strokeWidth={2.5} strokeLinecap="round" />
        </g>
      );
    })}
  </>
);

const RuleLabels: React.FC<{ f: number }> = ({ f }) => (
  <>
    {RULES.map((r, k) => {
      const p = prog(f, RULE_AT[k] + 10, 18);
      const crack = clamp01((f - CRACK_AT[k]) / 16);
      if (f < RULE_AT[k] || crack >= 1) return null;
      return (
        <div key={k} style={{
          position: "absolute", left: r.lx, top: r.ly, opacity: p * (1 - crack),
          transform: `translateY(${(1 - p) * 10}px)`,
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 4, color: "#6B7383" }}>RULE 0{k + 1}</div>
          <div style={{
            fontSize: 26, fontWeight: 700, color: "#AEB5C0", lineHeight: 1.3, marginTop: 6, whiteSpace: "pre-line",
            textDecoration: crack > 0 ? "line-through" : "none",
          }}>{r.text}</div>
        </div>
      );
    })}
  </>
);

const Trail: React.FC<{ pts: (P | null)[]; color: string; width: number }> = ({ pts, color, width }) => {
  const segs: JSX.Element[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (!a || !b) continue;
    const t = i / (pts.length - 1);
    segs.push(
      <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color}
        strokeWidth={width * (1 - t * 0.8)} strokeLinecap="round" opacity={0.55 * (1 - t)} />,
    );
  }
  return <>{segs}</>;
};

const Glow: React.FC<{ x: number; y: number; r: number; color: string; core: string; halo?: number }> =
  ({ x, y, r, color, core, halo = 1 }) => (
    <>
      <circle cx={x} cy={y} r={r * 3.2} fill={`url(#glow-${color.slice(1)})`} opacity={halo} />
      <circle cx={x} cy={y} r={r} fill={core} />
    </>
  );

const Metrics: React.FC<{ f: number }> = ({ f }) => {
  const op = prog(f, 158, 18) * interpolate(f, [858, 880], [1, 0], clamp);
  if (op <= 0) return null;
  const landed = RULE_AT.filter((t) => f >= t + 8).length;
  const cracked = CRACK_AT.filter((t) => f >= t).length;
  const pct = Math.round((100 * area(regionAt(f))) / area(REG[0]));
  return (
    <div style={{ position: "absolute", left: MX + 40, right: MX + 40, top: 1206, display: "flex", justifyContent: "space-between", opacity: op }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4, color: SUB }}>규칙</span>
        <span style={{ fontSize: 46, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>{landed - cracked}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4, color: SUB }}>행동 반경</span>
        <div style={{ width: 180, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
          <div style={{ width: `${pct}%`, height: 3, background: interpolateColors(pct, [18, 100], ["#F07A7A", DOT]), borderRadius: 2 }} />
        </div>
        <span style={{ fontSize: 46, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums", width: 110, textAlign: "right" }}>{pct}%</span>
      </div>
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

export const RulesShrink: React.FC = () => {
  const f = useCurrentFrame();
  const region = regionAt(f);
  const arenaOp = interpolate(f, [0, 20, 858, 892], [0, 1, 1, 0], clamp);
  const hatchOp = Math.min(clamp01(restrictAt(f) * 3), interpolate(f, [740, 830], [1, 0], clamp));
  const lightP = prog(f, LIGHT_AT, 30);
  const pulse = 1 + 0.08 * Math.sin(f * 0.08);
  const overP = prog(f, 6, 22);
  const endFade = interpolate(f, [TOTAL - 18, TOTAL], [1, 0], clamp);

  const pos = posAt(f);
  const r = sizeAt(f);
  const near = f >= MOVE[0] ? clamp01((f - MOVE[0]) / (MOVE[1] - MOVE[0])) : 0;
  const dotColor = interpolateColors(near, [0, 1], [DOT, "#FFE3B0"]);
  const trailLen = 36;
  const trail: (P | null)[] = Array.from({ length: trailLen }, (_, k) => (f - k >= 0 ? posAt(f - k) : null));

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
      <div style={{ position: "absolute", left: MX, top: 400, display: "flex", alignItems: "center", gap: 18, opacity: overP }}>
        <div style={{ width: 36 * overP, height: 2, background: AMBER }} />
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color: AMBER }}>TEAM CULTURE</span>
        <span style={{ fontSize: 24, fontWeight: 400, color: SUB }}>규칙과 행동</span>
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id="hatch" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="16" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
          </pattern>
          <radialGradient id={`glow-${DOT.slice(1)}`}>
            <stop offset="0" stopColor={DOT} stopOpacity={0.35} />
            <stop offset="1" stopColor={DOT} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="glow-FFE3B0">
            <stop offset="0" stopColor="#FFE3B0" stopOpacity={0.4} />
            <stop offset="1" stopColor="#FFE3B0" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="glow-light">
            <stop offset="0" stopColor={AMBER} stopOpacity={0.55} />
            <stop offset="0.35" stopColor={AMBER} stopOpacity={0.16} />
            <stop offset="1" stopColor={AMBER} stopOpacity={0} />
          </radialGradient>
        </defs>
        <g opacity={arenaOp}>
          <rect x={REG[0][0]} y={REG[0][1]} width={800} height={700} fill="url(#hatch)" opacity={hatchOp} />
          <rect x={region[0]} y={region[1]} width={region[2] - region[0]} height={region[3] - region[1]} fill="#12161D" />
          <rect x={REG[0][0]} y={REG[0][1]} width={800} height={700} fill="none" stroke={HAIR} strokeWidth={2} />
          <Walls f={f} />
        </g>
        {lightP > 0 && (
          <g opacity={lightP}>
            <circle cx={LIGHT[0]} cy={LIGHT[1]} r={260 * pulse * lightP} fill="url(#glow-light)" />
            {Array.from({ length: 10 }).map((_, i) => {
              const a = (i / 10) * Math.PI * 2 + f * 0.004;
              return (
                <line key={i}
                  x1={LIGHT[0] + Math.cos(a) * 26} y1={LIGHT[1] + Math.sin(a) * 26}
                  x2={LIGHT[0] + Math.cos(a) * (60 + 14 * Math.sin(f * 0.05 + i))} y2={LIGHT[1] + Math.sin(a) * (60 + 14 * Math.sin(f * 0.05 + i))}
                  stroke={AMBER} strokeWidth={1.5} strokeLinecap="round" opacity={0.45} />
              );
            })}
            <circle cx={LIGHT[0]} cy={LIGHT[1]} r={9} fill={AMBER} />
          </g>
        )}
        {COMPANIONS.map((c, i) => {
          const p = compAt(i, f);
          if (!p) return null;
          const tr = Array.from({ length: 30 }, (_, k) => compAt(i, f - k));
          const op = prog(f, c.at, 14);
          return (
            <g key={i} opacity={op}>
              <Trail pts={tr} color="#FFE3B0" width={2} />
              <Glow x={p[0]} y={p[1]} r={c.r} color="#FFE3B0" core="#FFF1D6" halo={0.7} />
            </g>
          );
        })}
        <Trail pts={trail} color={dotColor} width={3} />
        <Glow x={pos[0]} y={pos[1]} r={r} color={near > 0.5 ? "#FFE3B0" : DOT} core={dotColor} />
      </svg>
      <div style={{ position: "absolute", inset: 0, opacity: arenaOp }}>
        <RuleLabels f={f} />
      </div>
      <Metrics f={f} />
      <Captions f={f} caps={CAPTIONS} />
      <Grain f={f} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.45) 100%)",
      }} />
    </div>
  );
};
