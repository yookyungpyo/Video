import { useEffect, useState } from "react";
import {
  Easing,
  interpolate,
  interpolateColors,
  random,
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
const RAIN = "#8FA3BC";
const DOT = "#E9EEF5";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });

export const TOTAL = 1200;
const MX = 100;

// ---------- Timeline ----------
// S1 rain 0–165 · S2 my umbrella 165–450 · S3 shrinking team 450–660
// S4 declaration 660–820 · S5 widen 820–1080 · S6 closing 1080–1200
const OPEN = [165, 192] as const;
const WIDEN = [830, 900] as const;

const GROUND = 1060;
const RAIN_TOP = 430;
const ME = { x: 210, y: 1000 };
const TEAM_X = [400, 560, 720, 880];
const TEAM_Y = 1004;
const TEAM_CX = 640;

const rainAt = (f: number) =>
  interpolate(f, [0, 40, 150, 830, 1050, 1180], [0, 0.6, 1, 1, 0.6, 0.15], clamp);

// Umbrella geometry: a small canopy over "me", later wide and held out over the team
type Umb = { open: number; cx: number; w: number; h: number; base: number; hx: number; hy: number };
const umbAt = (f: number): Umb => {
  const open = interpolate(f, [OPEN[0], OPEN[1]], [0, 1], { ...clamp, easing: easeOut });
  const t = interpolate(f, [WIDEN[0], WIDEN[1]], [0, 1], { ...clamp, easing: easeInOut });
  const lerp = (a: number, b: number) => a + (b - a) * t;
  return {
    open,
    cx: lerp(ME.x, 650),
    w: lerp(180, 640) * (0.15 + 0.85 * open),
    h: lerp(62, 150) * (0.2 + 0.8 * open),
    base: lerp(905, 860),
    hx: lerp(ME.x, ME.x + 24),
    hy: lerp(978, 972),
  };
};
const surfaceY = (u: Umb, x: number) => {
  const k = (x - u.cx) / (u.w / 2);
  if (u.open < 0.6 || Math.abs(k) > 1) return Infinity;
  return u.base - u.h * Math.sqrt(1 - k * k);
};
const coveredAt = (x: number, f: number) => {
  const u = umbAt(f);
  return u.open >= 0.9 && Math.abs(x - u.cx) <= u.w / 2 - 14;
};

// Condition of each teammate: drops while exposed in the rain, recovers once covered
const COND: number[][] = (() => {
  const c = TEAM_X.map(() => [1]);
  for (let f = 1; f <= TOTAL; f++) {
    TEAM_X.forEach((x, i) => {
      const prev = c[i][f - 1];
      const cov = coveredAt(x, f);
      const next = cov ? prev + 0.014 : prev - 0.003 * rainAt(f) * (f > OPEN[0] ? 1 : 0.25);
      c[i].push(Math.max(0.28, Math.min(1.05, next)));
    });
  }
  return c;
})();
const exposedCount = (f: number) => TEAM_X.filter((x) => !coveredAt(x, f)).length;

// Rain drops (deterministic)
const DROPS = Array.from({ length: 78 }, (_, j) => ({
  x0: 120 + random(`dx${j}`) * 860,
  speed: 21 + random(`ds${j}`) * 9,
  off: random(`do${j}`),
  len: 22 + random(`dl${j}`) * 14,
  order: random(`dr${j}`),
}));
const SPAN = GROUND - RAIN_TOP + 80;

// Falling words: the pressures that come with the rain
const WORDS = [
  { at: 30, x: 300, t: "급한 일정 변경" },
  { at: 58, x: 640, t: "윗선의 질책" },
  { at: 86, x: 470, t: "책임 소재" },
  { at: 114, x: 790, t: "무리한 요청" },
  { at: 250, x: 560, t: "윗선의 질책" },
  { at: 320, x: 860, t: "급한 일정 변경" },
  { at: 390, x: 410, t: "무리한 요청" },
  { at: 470, x: 720, t: "책임 소재" },
  { at: 905, x: 520, t: "급한 일정 변경" },
  { at: 945, x: 760, t: "윗선의 질책" },
];

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
type Cap = { from: number; to: number; lines: { at: number; segs: Seg[] }[]; big?: boolean };

const Captions: React.FC<{ f: number; caps: Cap[] }> = ({ f, caps }) => {
  const c = caps.find((x) => f >= x.from && f < x.to);
  if (!c) return null;
  const out = clamp01((c.to - f) / 10);
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: 1200, opacity: out }}>
      {!c.big && <div style={{ width: 2, height: 22, background: HAIR, marginBottom: 18 }} />}
      {c.lines.map((l, i) =>
        f >= l.at ? (
          <Line key={i} f={f} at={l.at} style={{
            fontSize: c.big ? 66 : 42, fontWeight: c.big ? 700 : 400, lineHeight: c.big ? 1.25 : 1.5,
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
  { from: 40, to: 165, lines: [{ at: 40, segs: [{ t: "일을 하다 보면, " }, { t: "비는 늘 내린다", c: INK }] }] },
  { from: 182, to: 300, lines: [{ at: 182, segs: [{ t: "몸을 사리면, 우산은 " }, { t: "내 머리 위에만", c: INK }, { t: " 있다" }] }] },
  { from: 300, to: 452, lines: [{ at: 300, segs: [{ t: "그 비는 고스란히 " }, { t: "팀원들이", c: INK }, { t: " 맞는다" }] }] },
  { from: 462, to: 652, lines: [
    { at: 462, segs: [{ t: "팀원들은 움츠러들고," }] },
    { at: 502, segs: [{ t: "아무도 먼저 나서지 않는다" }] },
  ] },
  { from: 666, to: 818, big: true, lines: [
    { at: 666, segs: [{ t: "자기 보신을 위해" }] },
    { at: 674, segs: [{ t: "살지 말자." }] },
  ] },
  { from: 842, to: 962, lines: [{ at: 842, segs: [{ t: "내가 " }, { t: "조금 젖더라도,", c: INK }] }] },
  { from: 962, to: 1080, lines: [{ at: 962, segs: [{ t: "팀원들이 " }, { t: "마음 놓고", c: AMBER }, { t: " 일할 수 있게" }] }] },
  { from: 1086, to: TOTAL + 10, big: true, lines: [
    { at: 1086, segs: [{ t: "나보다," }] },
    { at: 1094, segs: [{ t: "팀원들을 위해.", c: AMBER }] },
  ] },
];

// ---------- Scene pieces ----------

const Umbrella: React.FC<{ u: Umb }> = ({ u }) => {
  if (u.open <= 0) return null;
  const L = u.cx - u.w / 2, R = u.cx + u.w / 2, apexY = u.base - u.h;
  const n = 6, seg = u.w / n, sag = Math.min(14, u.h * 0.16);
  let d = `M ${L} ${u.base} A ${u.w / 2} ${u.h} 0 0 1 ${R} ${u.base}`;
  for (let k = 1; k <= n; k++) d += ` A ${seg / 2} ${sag} 0 0 0 ${R - seg * k} ${u.base}`;
  return (
    <g opacity={clamp01(u.open * 1.4)}>
      <line x1={u.hx} y1={u.hy} x2={u.cx} y2={u.base - 4} stroke={LINE} strokeWidth={2.5} strokeLinecap="round" />
      <path d={`M ${u.hx} ${u.hy} q 0 16 -12 16 q -10 0 -10 -10`} stroke={LINE} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <path d={d} fill="rgba(242,180,92,0.10)" stroke={AMBER} strokeWidth={2.5} strokeLinejoin="round" />
      {Array.from({ length: n - 1 }).map((_, k) => (
        <line key={k} x1={u.cx} y1={apexY} x2={L + seg * (k + 1)} y2={u.base} stroke={AMBER} strokeWidth={1.2} opacity={0.45} />
      ))}
      <line x1={u.cx} y1={apexY} x2={u.cx} y2={apexY - 14} stroke={AMBER} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
};

const Rain: React.FC<{ f: number; u: Umb }> = ({ f, u }) => {
  const intensity = rainAt(f);
  const els: JSX.Element[] = [];
  DROPS.forEach((d, j) => {
    if (d.order > intensity) return;
    const y = RAIN_TOP + ((f * d.speed + d.off * SPAN) % SPAN);
    const x = d.x0 + (y - RAIN_TOP) * 0.1;
    const stop = Math.min(surfaceY(u, x), GROUND);
    if (y - d.len > stop) return;
    const yEnd = Math.min(y, stop);
    const yStart = Math.max(RAIN_TOP, y - d.len);
    if (yEnd <= yStart) return;
    els.push(
      <line key={j} x1={x - (yEnd - yStart) * 0.1} y1={yStart} x2={x} y2={yEnd}
        stroke={RAIN} strokeWidth={1.6} strokeLinecap="round" opacity={0.55} />,
    );
    // tiny splash where a drop meets the canopy or the ground
    if (y >= stop && y - stop < d.speed) {
      els.push(
        <g key={`s${j}`} opacity={0.5}>
          <line x1={x - 6} y1={stop - 4} x2={x - 10} y2={stop - 9} stroke={RAIN} strokeWidth={1.2} />
          <line x1={x + 6} y1={stop - 4} x2={x + 10} y2={stop - 9} stroke={RAIN} strokeWidth={1.2} />
        </g>,
      );
    }
  });
  // runoff from the canopy edges once it is wide
  const wide = interpolate(f, [WIDEN[1] - 10, WIDEN[1] + 10], [0, 1], clamp) * intensity;
  if (wide > 0) {
    [u.cx - u.w / 2 + 4, u.cx + u.w / 2 - 4].forEach((ex, side) => {
      for (let k = 0; k < 3; k++) {
        const y = u.base + (((f + k * 7 + side * 3) * 18) % (GROUND - u.base));
        els.push(
          <line key={`r${side}${k}`} x1={ex} y1={y} x2={ex} y2={Math.min(GROUND, y + 18)}
            stroke={RAIN} strokeWidth={1.8} strokeLinecap="round" opacity={0.6 * wide} />,
        );
      }
    });
  }
  return <>{els}</>;
};

const FallingWords: React.FC<{ f: number; u: Umb }> = ({ f, u }) => (
  <>
    {WORDS.map((w, k) => {
      if (f < w.at) return null;
      const y = 470 + (f - w.at) * 3.4;
      const stop = Math.min(surfaceY(u, w.x) - 24, 950);
      const landed = y >= stop;
      const landF = w.at + (stop - 470) / 3.4;
      const fade = landed ? clamp01(1 - (f - landF) / 14) : prog(f, w.at, 10);
      if (fade <= 0) return null;
      return (
        <div key={k} style={{
          position: "absolute", left: w.x, top: Math.min(y, stop), transform: "translateX(-50%)",
          fontSize: 24, fontWeight: 700, color: "#A7B4C6", letterSpacing: 1, whiteSpace: "nowrap", opacity: fade * 0.9,
        }}>{w.t}</div>
      );
    })}
  </>
);

const Person: React.FC<{ x: number; y: number; r: number; glow: number; core: string; id: string }> =
  ({ x, y, r, glow, core, id }) => (
    <>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={core} stopOpacity={0.4 * glow} />
          <stop offset="1" stopColor={core} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r * 3.2} fill={`url(#${id})`} />
      <circle cx={x} cy={y} r={r} fill={core} opacity={0.35 + 0.65 * glow} />
    </>
  );

const WetShoulder: React.FC<{ f: number }> = ({ f }) => (
  <>
    {[[-28, -14], [-12, -32], [-34, 8], [-2, -40], [-26, -36]].map(([dx, dy], k) => {
      const p = prog(f, 905 + k * 14, 12) * interpolate(f, [1150, 1190], [1, 0.5], clamp);
      if (p <= 0) return null;
      return (
        <path key={k} d={`M ${ME.x + dx} ${ME.y + dy - 8} q 7 8 0 13 q -7 -5 0 -13 z`} fill="#B5C6DA" opacity={0.9 * p} />
      );
    })}
  </>
);

const Metric: React.FC<{ f: number }> = ({ f }) => {
  const op = prog(f, 178, 16) * interpolate(f, [1176, 1194], [1, 0], clamp);
  if (op <= 0) return null;
  const n = exposedCount(f);
  return (
    <div style={{ position: "absolute", left: MX + 40, top: 1110, display: "flex", alignItems: "baseline", gap: 14, opacity: op }}>
      <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4, color: SUB }}>비를 맞는 팀원</span>
      <span style={{ fontSize: 46, fontWeight: 700, color: n === 0 ? AMBER : INK, fontVariantNumeric: "tabular-nums" }}>{n}</span>
      <span style={{ fontSize: 26, fontWeight: 400, color: SUB }}>/ 4명</span>
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

export const TeamUmbrella: React.FC = () => {
  const f = useCurrentFrame();
  const u = umbAt(f);
  const endFade = interpolate(f, [TOTAL - 18, TOTAL], [1, 0], clamp);
  const stageIn = prog(f, 4, 24);
  const overP = prog(f, 6, 22);
  const free = clamp01((f - 900) / 60);
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
      <div style={{ position: "absolute", inset: 0, transform: "translateY(60px)" }}>
        <div style={{ position: "absolute", left: MX, top: 360, display: "flex", alignItems: "center", gap: 18, opacity: overP }}>
          <div style={{ width: 36 * overP, height: 2, background: AMBER }} />
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color: AMBER }}>LEADERSHIP</span>
          <span style={{ fontSize: 24, fontWeight: 400, color: SUB }}>우산은 누구의 머리 위에 있나</span>
        </div>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: stageIn }}>
          <line x1={120} y1={GROUND} x2={960} y2={GROUND} stroke={HAIR} strokeWidth={2} />
          <Rain f={f} u={u} />
          <Umbrella u={u} />
          {TEAM_X.map((x0, i) => {
            const c = COND[i][f];
            const spread = (x0 - TEAM_CX) * 0.2 * clamp01((1 - c) / 0.7);
            const bobAmp = 1.5 + 6 * clamp01((c - 0.6) / 0.4);
            const x = x0 + spread + Math.sin(f * 0.05 + i * 2.1) * 12 * free;
            const y = TEAM_Y + Math.sin(f * 0.08 + i * 1.3) * bobAmp - 10 * free * clamp01(c - 0.9) * 10;
            return (
              <Person key={i} id={`tm${i}`} x={x} y={y} r={8 + 7 * c} glow={clamp01(c)}
                core={interpolateColors(clamp01(c), [0.28, 1], ["#5C6573", DOT])} />
            );
          })}
          <Person id="me" x={ME.x} y={ME.y + Math.sin(f * 0.07) * 2} r={17} glow={1} core="#FFF1D6" />
          <WetShoulder f={f} />
          <line x1={TEAM_X[0] - 20} y1={GROUND + 26} x2={TEAM_X[3] + 20} y2={GROUND + 26} stroke={HAIR} strokeWidth={1.5} />
        </svg>
        <div style={{ position: "absolute", left: ME.x, top: GROUND + 12, transform: "translateX(-50%)", fontSize: 24, fontWeight: 700, color: AMBER, opacity: stageIn }}>나</div>
        <div style={{ position: "absolute", left: TEAM_CX, top: GROUND + 36, transform: "translateX(-50%)", fontSize: 22, fontWeight: 400, letterSpacing: 4, color: SUB, opacity: stageIn }}>팀원</div>
        <FallingWords f={f} u={u} />
        <Metric f={f} />
        <Captions f={f} caps={CAPTIONS} />
      </div>
      <Grain f={f} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.45) 100%)",
      }} />
    </div>
  );
};
