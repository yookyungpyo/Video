import { useEffect, useState } from "react";
import {
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  continueRender,
  delayRender,
} from "remotion";

const SERIF = "Noto Serif KR";
const WALL = "#EEE6D9";
const INK = "#3A332C";
const BODY = "#5A5148";
const MUTED = "#8A7D6F";
const ACCENT = "#A86A32";
const WOOD = "#8C7461";
const WOOD_DARK = "#6F5B4B";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });

export const TOTAL = 1290;
const MX = 100;

// ---------- Timeline ----------
// S1 hook 0–120 · S2 the neighbour's laundry 120–420 · S3 a clean morning 420–660
// S4 it was my window 660–870 · S5 the user's lines 870–1110 · S6 closing 1110–1290
const DAYS: [number, string][] = [[120, "1일째"], [300, "2일째"], [345, "3일째"], [385, "7일째"]];
export const MORNING = 410; // light floods in, the glass is clean
export const WIPE = [548, 625]; // the cloth finishes the last dirty corner
export const COMPARE = [690, 740, 800, 840]; // dirt slides back over the left half, then away
const CLOSE_AT = 1120;

// ---------- Window geometry ----------
const O = { x0: 150, x1: 930, y0: 440, y1: 1100 }; // outer frame
const FR = 24;
const G = { x0: O.x0 + FR, x1: O.x1 - FR, y0: O.y0 + FR, y1: O.y1 - FR }; // glass
const MID_X = 540;
const MID_Y = 760;
const LINE_Y = 640;
const lineY = (x: number) => LINE_Y + 28 * (1 - ((x - 540) / 330) ** 2);
const CORNER = { cx: 300, cy: 985, rx: 150, ry: 105 };

// how dirty the glass looks
const globalDirt = (f: number) => interpolate(f, [MORNING + 12, MORNING + 26], [1, 0], clamp);
const cornerDirt = (f: number) =>
  f < MORNING + 12 ? 0 : interpolate(f, [MORNING + 12, MORNING + 26, WIPE[0] + 8, WIPE[1] - 8], [0, 1, 1, 0], clamp);
const compareW = (f: number) =>
  interpolate(f, COMPARE, [0, MID_X - G.x0, MID_X - G.x0, 0], { ...clamp, easing: easeInOut });
const morningAt = (f: number) => interpolate(f, [MORNING - 4, MORNING + 40], [0, 1], clamp);

// ---------- Fonts & text ----------

const fontCss = `
@font-face { font-family: '${SERIF}'; font-weight: 400; font-style: normal;
  src: url('${staticFile("fonts/noto-serif-kr-korean-400-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${SERIF}'; font-weight: 700; font-style: normal;
  src: url('${staticFile("fonts/noto-serif-kr-korean-700-normal.woff2")}') format('woff2'); }
`;

const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender("load-fonts"));
  useEffect(() => {
    const done = () => continueRender(handle);
    Promise.all([
      (document as any).fonts.load(`400 64px "${SERIF}"`, "가"),
      (document as any).fonts.load(`700 64px "${SERIF}"`, "가"),
    ])
      .then(() => (document as any).fonts.ready)
      .then(done)
      .catch(done);
  }, [handle]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

const Line: React.FC<{ f: number; at: number; style?: React.CSSProperties; children: React.ReactNode }> =
  ({ f, at, style, children }) => {
    const p = prog(f, at, 22);
    return (
      <div style={{ overflow: "hidden", paddingBottom: "0.14em" }}>
        <div style={{ transform: `translateY(${(1 - p) * 110}%)`, opacity: 0.3 + 0.7 * p, whiteSpace: "nowrap", ...style }}>
          {children}
        </div>
      </div>
    );
  };

type Seg = { t: string; c?: string; w?: number };
type Cap = { from: number; to: number; lines: { at: number; segs: Seg[] }[] };
const CAP_TOP = 1170;

const Captions: React.FC<{ f: number; caps: Cap[] }> = ({ f, caps }) => {
  const c = caps.find((x) => f >= x.from && f < x.to);
  if (!c) return null;
  const out = clamp01((c.to - f) / 10);
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP, opacity: out }}>
      {c.lines.map((l, i) =>
        f >= l.at ? (
          <Line key={i} f={f} at={l.at} style={{ fontSize: 42, fontWeight: 400, lineHeight: 1.55, color: BODY }}>
            {l.segs.map((s, j) => (
              <span key={j} style={{ color: s.c ?? undefined, fontWeight: s.w ?? (s.c ? 700 : undefined) }}>{s.t}</span>
            ))}
          </Line>
        ) : null,
      )}
    </div>
  );
};

const CAPTIONS: Cap[] = [
  { from: 10, to: 120, lines: [
    { at: 10, segs: [{ t: "늘 더러워 보이던 이웃집 빨래," }] },
    { at: 34, segs: [{ t: "진짜 더러웠던 건 " }, { t: "따로 있었다", c: INK }] },
  ] },
  { from: 132, to: 272, lines: [
    { at: 132, segs: [{ t: "이사 온 첫 아침," }] },
    { at: 158, segs: [{ t: "창밖으로 " }, { t: "이웃집 빨래", c: INK }, { t: "가 보였다" }] },
  ] },
  { from: 280, to: 412, lines: [
    { at: 280, segs: [{ t: "'빨래를 왜 저렇게 대충 할까?'", c: INK }] },
    { at: 318, segs: [{ t: "다음 날도, 그다음 날도" }] },
  ] },
  { from: 432, to: 545, lines: [
    { at: 432, segs: [{ t: "어느 날, 빨래가 " }, { t: "하얗게", c: INK }, { t: " 보였다." }] },
    { at: 460, segs: [{ t: "'이제야 제대로 빨았네'" }] },
  ] },
  { from: 553, to: 662, lines: [
    { at: 553, segs: [{ t: "사실은 그날 아침," }] },
    { at: 578, segs: [{ t: "내가 " }, { t: "창문을 닦았을 뿐", c: ACCENT }, { t: "이었다" }] },
  ] },
  { from: 672, to: 862, lines: [
    { at: 672, segs: [{ t: "더러웠던 건 빨래가 아니라," }] },
    { at: 706, segs: [{ t: "내 창문", c: ACCENT }, { t: "이었다" }] },
  ] },
  { from: 880, to: 990, lines: [
    { at: 880, segs: [{ t: "누군가 " }, { t: "못마땅해", c: INK }, { t: " 보인다면," }] },
  ] },
  { from: 998, to: 1112, lines: [
    { at: 998, segs: [{ t: "내가 부족해서,", c: INK }] },
    { at: 1026, segs: [{ t: "내 마음이 넓지 못해서", c: ACCENT }, { t: "이다" }] },
  ] },
];

// ---------- The view: sky, buildings, clothesline, laundry ----------

type Item = { kind: "sheet" | "towel" | "shirt" | "cloth"; x: number };
const SETS: Item[][] = [
  [{ kind: "sheet", x: 300 }, { kind: "towel", x: 455 }, { kind: "shirt", x: 625 }, { kind: "towel", x: 770 }],
  [{ kind: "shirt", x: 290 }, { kind: "shirt", x: 425 }, { kind: "sheet", x: 610 }, { kind: "cloth", x: 775 }],
  [{ kind: "towel", x: 280 }, { kind: "sheet", x: 425 }, { kind: "towel", x: 600 }, { kind: "shirt", x: 750 }],
  [{ kind: "sheet", x: 310 }, { kind: "shirt", x: 470 }, { kind: "towel", x: 625 }, { kind: "shirt", x: 765 }],
];
const dayIndex = (f: number) => {
  let i = 0;
  DAYS.forEach(([at], k) => { if (f >= at) i = k; });
  return i;
};

const Garment: React.FC<{ it: Item; f: number; seed: number }> = ({ it, f, seed }) => {
  const top = lineY(it.x) - 4;
  const rot = 1.6 * Math.sin(f * 0.045 + seed * 1.7);
  const sk = 2.2 * Math.sin(f * 0.06 + seed * 2.3);
  const pin = (dx: number) => <rect x={dx - 3} y={-10} width={6} height={18} rx={2} fill="#C8B79F" />;
  let body: React.ReactNode;
  if (it.kind === "sheet") {
    const w = 150, h = 230;
    const wave = 6 * Math.sin(f * 0.07 + seed);
    body = (
      <>
        <path d={`M ${-w / 2} 0 L ${w / 2} 0 L ${w / 2} ${h + wave} Q 0 ${h - 10 - wave} ${-w / 2} ${h - wave} Z`} fill="#FBFAF6" stroke="#E3DDD2" strokeWidth={1.5} />
        {pin(-w / 2 + 16)}{pin(w / 2 - 16)}
      </>
    );
  } else if (it.kind === "towel") {
    const w = 92, h = 150;
    body = (
      <>
        <rect x={-w / 2} y={0} width={w} height={h} rx={3} fill="#F6EFE2" stroke="#E2D8C6" strokeWidth={1.5} />
        <rect x={-w / 2} y={h - 30} width={w} height={8} fill="#BFD1E2" />
        {pin(-w / 2 + 12)}{pin(w / 2 - 12)}
      </>
    );
  } else if (it.kind === "shirt") {
    body = (
      <>
        <path d="M -60 0 L -22 0 Q 0 16 22 0 L 60 0 L 76 38 L 50 48 L 46 140 L -46 140 L -50 48 L -76 38 Z" fill="#E3ECF4" stroke="#CCD8E3" strokeWidth={1.5} strokeLinejoin="round" />
        {pin(-48)}{pin(48)}
      </>
    );
  } else {
    body = (
      <>
        <rect x={-36} y={0} width={72} height={84} rx={3} fill="#FBFAF6" stroke="#E3DDD2" strokeWidth={1.5} />
        {pin(0)}
      </>
    );
  }
  return (
    <g transform={`translate(${it.x} ${top}) rotate(${rot}) skewX(${sk})`}>{body}</g>
  );
};

const View: React.FC<{ f: number }> = ({ f }) => {
  const m = morningAt(f);
  const di = f >= MORNING + 12 ? 3 : dayIndex(f);
  // crossfade laundry sets on each new day
  const sets: { i: number; op: number }[] = [];
  DAYS.forEach(([at], k) => {
    const nextAt = DAYS[k + 1]?.[0];
    const fadeIn = k === 0 ? 1 : prog(f, at - 6, 12);
    const fadeOut = nextAt !== undefined && f < MORNING + 12 ? 1 - prog(f, nextAt - 6, 12) : 1;
    const op = fadeIn * fadeOut;
    if (op > 0 && (f < MORNING + 12 ? true : k === di)) sets.push({ i: k, op });
  });
  return (
    <g>
      <rect x={G.x0} y={G.y0} width={G.x1 - G.x0} height={G.y1 - G.y0} fill="url(#sky)" />
      <circle cx={830} cy={520} r={320} fill="url(#sun)" opacity={0.35 + 0.65 * m} />
      {/* distant buildings */}
      <rect x={G.x0} y={900} width={200} height={G.y1 - 900} fill="#D9CDBE" />
      <rect x={G.x0 + 210} y={950} width={170} height={G.y1 - 950} fill="#E1D6C8" />
      <rect x={600} y={860} width={G.x1 - 600} height={G.y1 - 860} fill="#D3C6B6" />
      {[0, 1, 2, 3].map((k) => (
        <rect key={k} x={630 + k * 68} y={890} width={34} height={46} fill="#C4B6A5" />
      ))}
      {/* poles + line */}
      <line x1={210} y1={600} x2={210} y2={G.y1} stroke="#9A8B7C" strokeWidth={6} />
      <line x1={870} y1={600} x2={870} y2={G.y1} stroke="#9A8B7C" strokeWidth={6} />
      <path d={`M 210 ${LINE_Y} Q 540 ${LINE_Y + 56} 870 ${LINE_Y}`} stroke="#8C7D6E" strokeWidth={2.5} fill="none" />
      {sets.map(({ i, op }) => (
        <g key={i} opacity={op}>
          {SETS[i].map((it, k) => <Garment key={k} it={it} f={f} seed={k + i * 4} />)}
        </g>
      ))}
    </g>
  );
};

// Grime on the glass: a fixed (never animated) mottled film, stains, streaks and dust
const SPOTS: [number, number, number, number][] = [
  [300, 760, 70, 0.5], [470, 715, 55, 0.45], [625, 735, 60, 0.5], [760, 760, 50, 0.4], [420, 560, 80, 0.3],
  [780, 980, 90, 0.35], [250, 600, 60, 0.3], [560, 930, 70, 0.3], [690, 620, 45, 0.35],
];
const SPECKS = Array.from({ length: 70 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453;
  const b = Math.sin(i * 78.233) * 12345.6789;
  const fr = (v: number) => v - Math.floor(v);
  return [G.x0 + fr(a) * (G.x1 - G.x0), G.y0 + fr(b) * (G.y1 - G.y0), 1 + fr(a * 3) * 2.2] as [number, number, number];
});

const Grime: React.FC = () => (
  <g>
    <rect x={G.x0} y={G.y0} width={G.x1 - G.x0} height={G.y1 - G.y0} fill="#8E7F69" opacity={0.22} />
    <rect x={G.x0} y={G.y0} width={G.x1 - G.x0} height={G.y1 - G.y0} filter="url(#grime)" />
    {SPOTS.map(([x, y, r, o], i) => (
      <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.8} fill="url(#stain)" opacity={o} />
    ))}
    {[[200, 900, 420, 600], [520, 1040, 800, 690], [640, 1000, 880, 760]].map(([x1, y1, x2, y2], i) => (
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(110,92,72,0.22)" strokeWidth={14} strokeLinecap="round" />
    ))}
    {SPECKS.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="rgba(90,74,58,0.45)" />)}
  </g>
);

const Cloth: React.FC<{ f: number }> = ({ f }) => {
  const inP = prog(f, WIPE[0] - 10, 16);
  const outP = prog(f, WIPE[1] - 4, 18);
  if (inP <= 0 || outP >= 1) return null;
  const t = clamp01((f - WIPE[0]) / (WIPE[1] - WIPE[0]));
  const ang = t * Math.PI * 4.5;
  const r = 46 * (1 - 0.4 * t);
  const cx = CORNER.cx + Math.cos(ang) * r * 1.6;
  const cy = CORNER.cy + Math.sin(ang) * r * 0.8;
  const x = cx + (1 - inP) * -220 + outP * -240;
  const y = cy + (1 - inP) * 200 + outP * 240;
  return (
    <g transform={`translate(${x} ${y}) rotate(${-14 + 8 * Math.sin(ang)})`} opacity={inP * (1 - outP)}>
      <rect x={-62} y={-44} width={124} height={88} rx={14} fill="rgba(60,48,36,0.18)" transform="translate(6 8)" />
      <rect x={-62} y={-44} width={124} height={88} rx={14} fill="#C9D3DC" />
      <path d="M -62 -8 Q 0 6 62 -12" stroke="#B3BFCA" strokeWidth={3} fill="none" />
      <path d="M -40 30 Q 0 22 46 32" stroke="#B3BFCA" strokeWidth={2} fill="none" opacity={0.7} />
    </g>
  );
};

const WindowScene: React.FC<{ f: number }> = ({ f }) => {
  const cw = compareW(f);
  const gd = globalDirt(f);
  const cd = cornerDirt(f);
  const m = morningAt(f);
  const labels = interpolate(f, [COMPARE[1] - 6, COMPARE[1] + 10, COMPARE[2] - 6, COMPARE[2] + 6], [0, 1, 1, 0], clamp);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CFE1EE" />
          <stop offset="1" stopColor="#EEF3F2" />
        </linearGradient>
        <radialGradient id="sun">
          <stop offset="0" stopColor="#FFF6E0" stopOpacity={0.9} />
          <stop offset="1" stopColor="#FFF6E0" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="stain">
          <stop offset="0" stopColor="#6E5A44" stopOpacity={0.9} />
          <stop offset="0.6" stopColor="#7A6650" stopOpacity={0.45} />
          <stop offset="1" stopColor="#7A6650" stopOpacity={0} />
        </radialGradient>
        <filter id="grime" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves={3} seed={7} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.44  0 0 0 0 0.37  0 0 0 0 0.28  0 0 0 1.5 -0.6" />
        </filter>
        <clipPath id="glass"><rect x={G.x0} y={G.y0} width={G.x1 - G.x0} height={G.y1 - G.y0} /></clipPath>
        <mask id="dirt-mask" maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
          <rect x={G.x0} y={G.y0} width={G.x1 - G.x0} height={G.y1 - G.y0} fill="white" opacity={gd} />
          {cd > 0 && <ellipse cx={CORNER.cx} cy={CORNER.cy} rx={CORNER.rx * (0.4 + 0.6 * cd)} ry={CORNER.ry * (0.4 + 0.6 * cd)} fill="url(#soft)" opacity={0.75 * cd} />}
          {cw > 0 && <rect x={G.x0} y={G.y0} width={cw} height={G.y1 - G.y0} fill="white" />}
        </mask>
        <radialGradient id="soft">
          <stop offset="0" stopColor="white" stopOpacity={1} />
          <stop offset="0.55" stopColor="white" stopOpacity={0.8} />
          <stop offset="1" stopColor="white" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="beam" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF3D6" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FFF3D6" stopOpacity={0} />
        </linearGradient>
      </defs>
      <g clipPath="url(#glass)">
        <View f={f} />
        <g mask="url(#dirt-mask)"><Grime /></g>
        {/* a faint reflection on the glass */}
        <path d={`M ${G.x0} ${G.y0 + 120} L ${G.x0 + 160} ${G.y0} L ${G.x0 + 230} ${G.y0} L ${G.x0} ${G.y0 + 190} Z`} fill="white" opacity={0.08 + 0.1 * m} />
        {cw > 0 && <line x1={G.x0 + cw} y1={G.y0} x2={G.x0 + cw} y2={G.y1} stroke="rgba(255,255,255,0.7)" strokeWidth={2} />}
      </g>
      {/* frame */}
      <rect x={O.x0} y={O.y0} width={O.x1 - O.x0} height={O.y1 - O.y0} fill="none" stroke={WOOD} strokeWidth={FR * 2} />
      <rect x={O.x0 - FR} y={O.y0 - FR} width={O.x1 - O.x0 + FR * 2} height={O.y1 - O.y0 + FR * 2} fill="none" stroke={WOOD_DARK} strokeWidth={2} />
      <rect x={G.x0} y={G.y0} width={G.x1 - G.x0} height={G.y1 - G.y0} fill="none" stroke={WOOD_DARK} strokeWidth={2} />
      <rect x={MID_X - 7} y={G.y0} width={14} height={G.y1 - G.y0} fill={WOOD} />
      <rect x={G.x0} y={MID_Y - 7} width={G.x1 - G.x0} height={14} fill={WOOD} />
      {/* sill */}
      <rect x={O.x0 - 50} y={O.y1 + FR - 4} width={O.x1 - O.x0 + 100} height={22} rx={4} fill={WOOD_DARK} />
      {/* morning light falling across the room */}
      <path d="M 1080 300 L 1080 760 L 300 1500 L -80 1500 Z" fill="url(#beam)" opacity={0.55 * m} />
      <Cloth f={f} />
      {labels > 0 && (
        <g opacity={labels} fontFamily={`'${SERIF}', serif`} fontSize={30} fontWeight={700}>
          <text x={(G.x0 + MID_X) / 2} y={G.y0 + 60} textAnchor="middle" fill={INK} stroke="rgba(255,255,255,0.85)" strokeWidth={8} paintOrder="stroke">닦기 전</text>
          <text x={(MID_X + G.x1) / 2} y={G.y0 + 60} textAnchor="middle" fill={INK} stroke="rgba(255,255,255,0.85)" strokeWidth={8} paintOrder="stroke">닦은 후</text>
        </g>
      )}
    </svg>
  );
};

const TopLabel: React.FC<{ f: number }> = ({ f }) => {
  const a = prog(f, 120, 20) * (1 - prog(f, 862, 12));
  const b = prog(f, 880, 20);
  const day = DAYS[dayIndex(f)][1];
  const dayOp = prog(f, 126, 16) * (1 - prog(f, MORNING, 12));
  return (
    <>
      {a > 0 && <div style={{ position: "absolute", left: MX, top: 360, fontSize: 26, color: MUTED, opacity: a }}>— 창문 너머</div>}
      {b > 0 && <div style={{ position: "absolute", left: MX, top: 360, fontSize: 26, color: MUTED, opacity: b }}>— 마음의 창</div>}
      {dayOp > 0 && (
        <div style={{ position: "absolute", right: 1080 - O.x1, top: 356, fontSize: 30, fontWeight: 700, color: MUTED, opacity: dayOp }}>
          {DAYS.map(([at, label], k) => {
            const nextAt = DAYS[k + 1]?.[0] ?? 99999;
            const op = (k === 0 ? 1 : prog(f, at - 6, 12)) * (1 - prog(f, nextAt - 6, 12));
            return op > 0 ? <span key={label} style={{ position: "absolute", right: 0, opacity: op, whiteSpace: "nowrap" }}>{label}</span> : null;
          })}
          <span style={{ visibility: "hidden" }}>{day}</span>
        </div>
      )}
    </>
  );
};

const Closing: React.FC<{ f: number }> = ({ f }) => {
  if (f < CLOSE_AT) return null;
  const big: React.CSSProperties = { fontSize: 74, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.3 };
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP - 8 }}>
      <Line f={f} at={CLOSE_AT} style={big}>내 <span style={{ color: ACCENT }}>마음의 창문</span>부터</Line>
      <Line f={f} at={CLOSE_AT + 26} style={big}>닦아라.</Line>
    </div>
  );
};

const Paper: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.07, mixBlendMode: "multiply", pointerEvents: "none" }}>
    <filter id="paper" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={2} seed={3} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#paper)" />
  </svg>
);

// ---------- Root ----------

export const MindWindow: React.FC = () => {
  const f = useCurrentFrame();
  // light piece: never cut to black — the picture fades out onto the cream wall instead
  const endFade = interpolate(f, [TOTAL - 30, TOTAL], [1, 0], clamp);
  // the "next morning" light bloom — ramped, low, never a flash
  const bloom = interpolate(f, [MORNING - 6, MORNING + 14, MORNING + 50], [0, 0.32, 0], clamp);
  const zoom = interpolate(f, [0, 140, 680, 780, 1000, 1290], [1.07, 1.0, 1.0, 0.95, 0.95, 0.92], { ...clamp, easing: easeInOut });
  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      background: WALL, fontFamily: `'${SERIF}', serif`,
    }}>
      <FontLoader />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 85% 60% at 50% 40%, #F6F0E6 0%, rgba(238,230,217,0) 70%)",
      }} />
      <div style={{ position: "absolute", inset: 0, transform: "translateY(130px)", opacity: endFade }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "540px 770px" }}>
          <WindowScene f={f} />
        </div>
        <TopLabel f={f} />
        <Captions f={f} caps={CAPTIONS} />
        <Closing f={f} />
      </div>
      <div style={{ position: "absolute", inset: 0, background: "#FFF8EA", opacity: bloom, pointerEvents: "none" }} />
      <Paper />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 62%, rgba(90,70,50,0.22) 100%)",
      }} />
    </div>
  );
};
