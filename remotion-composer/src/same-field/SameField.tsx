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
const BG = "#F6F4EF";
const INK = "#1B1E24";
const SUB = "#7C818A";
const BODY = "#3D424B";
const HAIR = "rgba(27,30,36,0.12)";
const GRASS = "#DCE7D3";
const GRASS2 = "#D2DFC8";
const CHALK = "#FFFFFF";
const BALL_EDGE = "#59606C";
const AMBER = "#DE8A1E";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
const progIO = (f: number, at: number, dur: number) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeInOut });

export const TOTAL = 1800;
const MX = 100;

// ---------- Timeline ----------
// S1 full time 0:2 0–150 · S2 the excuses 150–390 · S3 the same field 390–600 · S4 why? 600–780
// S5 the winners slipped too 780–1080 · S6 complaining vs eyes on goal 1080–1380
// S7 at work: "그럼에도 불구하고" 1380–1620 · S8 the responsible don't blame the tools 1620–1800
export const EXCUSE_AT = 150;
export const SAME_AT = 390;
export const ASK_AT = 600;
export const WIN_AT = 780;
export const GAP_AT = 1080;
export const WORK_AT = 1380;
export const END_AT = 1620;

// ---------- Full pitch (horizontal; our half on the left) ----------
const P = { x: 100, y: 520, w: 880, h: 570 };
const PCX = P.x + P.w / 2;
const PCY = P.y + P.h / 2;
const ZOOM_O = { x: 320, y: PCY }; // zoom into our half

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

type Seg = { t: string; c?: string; w?: number };
type Cap = { from: number; to: number; lines: { at: number; segs: Seg[] }[] };
const CAP_TOP = 1220;

const Captions: React.FC<{ f: number; caps: Cap[] }> = ({ f, caps }) => {
  const c = caps.find((x) => f >= x.from && f < x.to);
  if (!c) return null;
  const out = clamp01((c.to - f) / 10);
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP, opacity: out }}>
      <div style={{ width: 2, height: 22, background: HAIR, marginBottom: 18 }} />
      {c.lines.map((l, i) =>
        f >= l.at ? (
          <Line key={i} f={f} at={l.at} style={{ fontSize: 44, fontWeight: 400, lineHeight: 1.5, color: BODY }}>
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
  { from: 30, to: EXCUSE_AT - 4, lines: [
    { at: 30, segs: [{ t: "경기에 " }, { t: "졌습니다.", c: INK }] },
  ] },
  { from: EXCUSE_AT + 14, to: SAME_AT - 4, lines: [
    { at: EXCUSE_AT + 16, segs: [{ t: "진 이유는," }] },
    { at: EXCUSE_AT + 120, segs: [{ t: "잔디와 공", c: INK }, { t: "에 있다고 합니다." }] },
  ] },
  { from: SAME_AT + 6, to: ASK_AT - 4, lines: [
    { at: SAME_AT + 8, segs: [{ t: "그런데 상대 팀도," }] },
    { at: SAME_AT + 60, segs: [{ t: "같은 잔디, 같은 공", c: INK }, { t: "이었습니다." }] },
  ] },
  { from: ASK_AT + 6, to: WIN_AT - 4, lines: [
    { at: ASK_AT + 8, segs: [{ t: "같은 환경인데, 결과는 달랐습니다." }] },
    { at: ASK_AT + 56, segs: [{ t: "이유는?", c: AMBER }] },
  ] },
  { from: WIN_AT + 6, to: WIN_AT + 150, lines: [
    { at: WIN_AT + 8, segs: [{ t: "이긴 팀도 미끄러졌고," }] },
    { at: WIN_AT + 44, segs: [{ t: "공도 튀었습니다." }] },
  ] },
  { from: WIN_AT + 156, to: GAP_AT - 4, lines: [
    { at: WIN_AT + 158, segs: [{ t: "그래도" }] },
    { at: WIN_AT + 186, segs: [{ t: "핑계를 찾지 않았습니다.", c: INK }] },
  ] },
  { from: GAP_AT + 6, to: WORK_AT - 4, lines: [
    { at: GAP_AT + 8, segs: [{ t: "불평할 시간에," }] },
    { at: GAP_AT + 110, segs: [{ t: "그냥 " }, { t: "골대만", c: AMBER }, { t: " 봤습니다.", c: INK }] },
  ] },
  { from: WORK_AT + 6, to: END_AT - 4, lines: [
    { at: WORK_AT + 8, segs: [{ t: "회사도 같습니다." }] },
    { at: WORK_AT + 70, segs: [{ t: "결과를 바꾸는 건 불평이 아니라," }] },
    { at: WORK_AT + 110, segs: [{ t: "‘그럼에도 불구하고’ 정신", c: AMBER }, { t: "입니다." }] },
  ] },
];

const Overline: React.FC<{ f: number; from: number; to: number; tag: string; text: string; color: string }> =
  ({ f, from, to, tag, text, color }) => {
    if (f < from || f >= to) return null;
    const p = prog(f, from, 20) * clamp01((to - f) / 10);
    return (
      <div style={{ position: "absolute", left: MX, top: 340, display: "flex", alignItems: "center", gap: 18, opacity: p }}>
        <div style={{ width: 36 * p, height: 2, background: color }} />
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color }}>{tag}</span>
        <span style={{ fontSize: 24, fontWeight: 400, color: SUB }}>{text}</span>
      </div>
    );
  };

// ---------- Drawing pieces ----------

const Ball: React.FC<{ x: number; y: number; r?: number; hop?: number; op?: number }> = ({ x, y, r = 15, hop = 0, op = 1 }) => (
  <g opacity={op}>
    <ellipse cx={x + hop * 0.4} cy={y + r * 0.7} rx={r * (1 - hop * 0.012)} ry={r * 0.35} fill="rgba(60,80,60,0.22)" />
    <g transform={`translate(${x} ${y - hop})`}>
      <circle r={r} fill="#FFFFFF" stroke={BALL_EDGE} strokeWidth={2.5} />
      <polygon points={[0, 1, 2, 3, 4].map((k) => `${Math.sin((k * 2 * Math.PI) / 5) * r * 0.38},${-Math.cos((k * 2 * Math.PI) / 5) * r * 0.38}`).join(" ")}
        fill={BALL_EDGE} />
    </g>
  </g>
);

// a smear in the grass where the ball slid
const Skid: React.FC<{ x1: number; y1: number; x2: number; y2: number; p: number; op?: number }> = ({ x1, y1, x2, y2, p, op = 1 }) =>
  p > 0 ? (
    <line x1={x1} y1={y1} x2={lerp(x1, x2, p)} y2={lerp(y1, y2, p)} stroke="rgba(120,140,100,0.45)" strokeWidth={14} strokeLinecap="round" opacity={op} />
  ) : null;

const FullPitch: React.FC = () => {
  const stripes = 10;
  const sw = P.w / stripes;
  const pen = { d: P.w * 0.157, h: P.h * 0.59 };
  const box = { d: P.w * 0.052, h: P.h * 0.27 };
  const goal = { d: 18, h: P.h * 0.11 };
  const chalk = { stroke: CHALK, strokeWidth: 4, fill: "none" } as const;
  return (
    <g>
      <rect x={P.x - 20} y={P.y - 20} width={P.w + 40} height={P.h + 40} rx={14} fill={GRASS} />
      {Array.from({ length: stripes }, (_, i) => (i % 2 ? <rect key={i} x={P.x + i * sw} y={P.y - 20} width={sw} height={P.h + 40} fill={GRASS2} /> : null))}
      <rect x={P.x} y={P.y} width={P.w} height={P.h} {...chalk} />
      <line x1={PCX} y1={P.y} x2={PCX} y2={P.y + P.h} {...chalk} />
      <circle cx={PCX} cy={PCY} r={P.h * 0.16} {...chalk} />
      <circle cx={PCX} cy={PCY} r={5} fill={CHALK} />
      {[0, 1].map((s) => {
        const x0 = s ? P.x + P.w : P.x;
        const dir = s ? -1 : 1;
        return (
          <g key={s}>
            <rect x={Math.min(x0, x0 + dir * pen.d)} y={PCY - pen.h / 2} width={pen.d} height={pen.h} {...chalk} />
            <rect x={Math.min(x0, x0 + dir * box.d)} y={PCY - box.h / 2} width={box.d} height={box.h} {...chalk} />
            <rect x={Math.min(x0, x0 - dir * goal.d)} y={PCY - goal.h / 2} width={goal.d} height={goal.h} {...chalk} strokeWidth={3} />
          </g>
        );
      })}
    </g>
  );
};

// vertical half pitch, goal at the top
const HALF = { w: 400, h: 540, top: 600 };
const HalfPitch: React.FC<{ cx: number; glow?: number }> = ({ cx, glow = 0 }) => {
  const x0 = cx - HALF.w / 2;
  const y0 = HALF.top;
  const chalk = { stroke: CHALK, strokeWidth: 4, fill: "none" } as const;
  const stripes = 6;
  const sh = HALF.h / stripes;
  return (
    <g>
      <rect x={x0 - 16} y={y0 - 16} width={HALF.w + 32} height={HALF.h + 32} rx={14} fill={GRASS} />
      {Array.from({ length: stripes }, (_, i) => (i % 2 ? <rect key={i} x={x0 - 16} y={y0 + i * sh} width={HALF.w + 32} height={sh} fill={GRASS2} /> : null))}
      <rect x={x0} y={y0} width={HALF.w} height={HALF.h} {...chalk} />
      <rect x={cx - HALF.w * 0.3} y={y0} width={HALF.w * 0.6} height={130} {...chalk} />
      <rect x={cx - HALF.w * 0.14} y={y0} width={HALF.w * 0.28} height={46} {...chalk} />
      <path d={`M ${cx - 64} ${y0 + HALF.h} A 64 64 0 0 1 ${cx + 64} ${y0 + HALF.h}`} {...chalk} />
      {glow > 0 && <rect x={cx - 60} y={y0 - 30} width={120} height={36} rx={6} fill={AMBER} opacity={0.35 * glow} />}
      <rect x={cx - 40} y={y0 - 22} width={80} height={22} {...chalk} strokeWidth={3} />
    </g>
  );
};

// the winners' attacks: short passes up the pitch into the goal
type Attack = { at: number; pts: [number, number][]; slip?: boolean };
const RIGHT_CX = 780;
const LEFT_CX = 300;
const atk = (dx: number[]): [number, number][] => [
  [RIGHT_CX + dx[0], HALF.top + HALF.h - 50],
  [RIGHT_CX + dx[1], HALF.top + HALF.h - 190],
  [RIGHT_CX + dx[2], HALF.top + HALF.h - 320],
  [RIGHT_CX + dx[3], HALF.top + 160],
  [RIGHT_CX + dx[4], HALF.top - 10],
];
const ATTACKS: Attack[] = [
  { at: WIN_AT + 30, pts: atk([0, -80, 60, -30, 0]), slip: true },
  { at: GAP_AT + 30, pts: atk([40, 110, 10, 70, 12]) },
  { at: GAP_AT + 170, pts: atk([-50, -120, -40, -90, -14]) },
];
const LEG = 26; // frames per pass
const SLIP = 40; // the first touch slips and bounces before play goes on

const attackState = (a: Attack, f: number) => {
  const start = a.at + (a.slip ? SLIP : 0);
  const n = a.pts.length - 1;
  const t = (f - start) / LEG;
  const leg = Math.max(0, Math.min(n - 1, Math.floor(t)));
  const within = clamp01(t - leg);
  const e = easeInOut(within);
  const [x1, y1] = a.pts[leg];
  const [x2, y2] = a.pts[leg + 1];
  const done = t >= n;
  return { t, leg, within, x: done ? a.pts[n][0] : lerp(x1, x2, e), y: done ? a.pts[n][1] : lerp(y1, y2, e), done, scoredAt: start + n * LEG };
};

const COMPLAINTS = [
  { t: "미끄러워", x: -110, y: 70, r: -6 },
  { t: "공이 왜 이래", x: 50, y: 150, r: 4 },
  { t: "또 튀네", x: -90, y: 240, r: 3 },
  { t: "잔디 왜 이래", x: 60, y: 320, r: -5 },
  { t: "오늘 운이 없네", x: -40, y: 400, r: 2 },
  { t: "이건 못 이겨", x: 70, y: 470, r: -3 },
];

const Panels: React.FC<{ f: number }> = ({ f }) => {
  const leftDim = 1 - 0.6 * progIO(f, WIN_AT, 20) * (1 - progIO(f, GAP_AT, 30));
  const goals = ATTACKS.map((a) => attackState(a, f));
  const glow = Math.max(0, ...goals.map((g) => (f >= g.scoredAt ? 1 - clamp01((f - g.scoredAt) / 50) : 0)));
  const ballR = ATTACKS.reduce<{ x: number; y: number; hop: number } | null>((cur, a, i) => {
    const s = goals[i];
    if (f < a.at) return cur;
    const next = ATTACKS[i + 1];
    if (next && f >= next.at) return cur;
    // first attack: the ball skids sideways and bounces before the first pass
    if (a.slip && f < a.at + SLIP) {
      const p = progIO(f, a.at, SLIP);
      const [x0, y0] = a.pts[0];
      return { x: x0 + 34 * Math.sin(p * Math.PI), y: y0 + 6 * p, hop: 22 * Math.abs(Math.sin(p * Math.PI * 2)) * (1 - p) };
    }
    if (s.done && f > s.scoredAt + 40) return null;
    return { x: s.x, y: s.y, hop: 0 };
  }, null);
  const leftBall = { x: LEFT_CX, y: HALF.top + HALF.h - 50 };
  const firstSlip = ATTACKS[0];

  return (
    <g>
      <g opacity={leftDim}>
        <HalfPitch cx={LEFT_CX} />
        <Ball x={leftBall.x} y={leftBall.y} />
      </g>
      <HalfPitch cx={RIGHT_CX} glow={glow} />
      <Skid x1={firstSlip.pts[0][0]} y1={firstSlip.pts[0][1] + 6} x2={firstSlip.pts[0][0] + 40} y2={firstSlip.pts[0][1] + 10}
        p={prog(f, firstSlip.at, 20)} op={1 - prog(f, GAP_AT + 60, 40) * 0.6} />
      {/* every pass leaves a line pointing at the goal */}
      {ATTACKS.map((a, i) => {
        const s = goals[i];
        if (s.t <= 0) return null;
        const fade = i < ATTACKS.length - 1 && f > ATTACKS[i + 1].at ? 0.4 : 1;
        return (
          <g key={i} opacity={fade}>
            {a.pts.slice(0, -1).map((pt, k) => {
              const p = k < s.leg ? 1 : k === s.leg ? (s.done ? 1 : s.within) : 0;
              if (p <= 0) return null;
              const [x2, y2] = a.pts[k + 1];
              const ex = lerp(pt[0], x2, p);
              const ey = lerp(pt[1], y2, p);
              const ang = Math.atan2(y2 - pt[1], x2 - pt[0]);
              return (
                <g key={k}>
                  <line x1={pt[0]} y1={pt[1]} x2={ex} y2={ey} stroke={AMBER} strokeWidth={4} strokeLinecap="round" strokeDasharray="2 12" />
                  {p > 0.95 && (
                    <path d={`M ${x2 - 16 * Math.cos(ang - 0.45)} ${y2 - 16 * Math.sin(ang - 0.45)} L ${x2} ${y2} L ${x2 - 16 * Math.cos(ang + 0.45)} ${y2 - 16 * Math.sin(ang + 0.45)}`}
                      fill="none" stroke={AMBER} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
      {ballR && <Ball x={ballR.x} y={ballR.y} hop={ballR.hop} />}
    </g>
  );
};

const Complaints: React.FC<{ f: number }> = ({ f }) => (
  <>
    {COMPLAINTS.map((c, i) => {
      const a = prog(f, GAP_AT + 24 + i * 34, 16);
      if (a <= 0) return null;
      return (
        <div key={i} style={{
          position: "absolute", left: LEFT_CX + c.x, top: HALF.top + c.y, transform: `translate(-50%, -50%) rotate(${c.r}deg) scale(${0.9 + 0.1 * a})`,
          padding: "8px 18px", borderRadius: 22, background: "rgba(255,255,255,0.92)", border: `1.5px solid ${HAIR}`,
          fontSize: 26, fontWeight: 700, color: SUB, opacity: a, whiteSpace: "nowrap",
        }}>“{c.t}”</div>
      );
    })}
  </>
);

// small speech-free tags pointing at grass and ball
const Tag: React.FC<{ x: number; y: number; ax: number; ay: number; text: string; op: number; color?: string }> =
  ({ x, y, ax, ay, text, op, color = SUB }) =>
    op > 0 ? (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: op }}>
          <line x1={x} y1={y} x2={ax} y2={ay} stroke={color} strokeWidth={2} strokeDasharray="4 6" />
          <circle cx={ax} cy={ay} r={5} fill={color} />
        </svg>
        <div style={{
          position: "absolute", left: x, top: y, transform: "translate(-50%, -100%)", opacity: op,
          padding: "8px 18px", borderRadius: 22, background: "#FFFFFF", border: `1.5px solid ${HAIR}`,
          fontSize: 28, fontWeight: 700, color, whiteSpace: "nowrap", boxShadow: "0 6px 18px rgba(40,50,40,0.08)",
        }}>{text}</div>
      </>
    ) : null;

const Scoreboard: React.FC<{ f: number }> = ({ f }) => {
  const a = prog(f, 14, 20);
  const big = progIO(f, ASK_AT, 30) * (1 - progIO(f, WIN_AT - 20, 24));
  const out = 1 - prog(f, WIN_AT - 10, 20);
  if (a * out <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: 540, top: 440, transform: `translate(-50%, -50%) scale(${1 + 0.35 * big})`,
      display: "flex", alignItems: "center", gap: 26, padding: "14px 34px", borderRadius: 40,
      background: "#FFFFFF", boxShadow: "0 8px 24px rgba(40,50,40,0.10)", opacity: a * out, whiteSpace: "nowrap",
    }}>
      <span style={{ fontSize: 26, fontWeight: 700, color: SUB }}>우리 팀</span>
      <span style={{ fontSize: 46, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums", letterSpacing: 2 }}>0 : 2</span>
      <span style={{ fontSize: 26, fontWeight: 700, color: SUB }}>상대 팀</span>
    </div>
  );
};

const Ending: React.FC<{ f: number }> = ({ f }) => {
  if (f < END_AT) return null;
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP - 10 }}>
      <Line f={f} at={END_AT + 16} style={{ fontSize: 46, color: BODY, lineHeight: 1.45 }}>책임자는,</Line>
      <div style={{ height: 6 }} />
      <Line f={f} at={END_AT + 52} style={{ fontSize: 66, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.3 }}>
        도구 <span style={{ color: AMBER }}>탓</span>을 하지 않는다.
      </Line>
    </div>
  );
};

const Grain: React.FC<{ f: number }> = ({ f }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.05, mixBlendMode: "soft-light", pointerEvents: "none" }}>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={(Math.floor(f / 2) % 4) + 1} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)" />
  </svg>
);

// ---------- Root ----------

export const SameField: React.FC = () => {
  const f = useCurrentFrame();
  const endFade = interpolate(f, [TOTAL - 18, TOTAL], [1, 0], clamp);

  // full pitch: S1–S4, then again for the closing
  const fullOp = f < END_AT ? prog(f, 0, 24) * (1 - progIO(f, WIN_AT - 16, 24)) : 0.6 * progIO(f, END_AT, 30);
  const zoom = 1 + 0.55 * progIO(f, EXCUSE_AT + 20, 44) * (1 - progIO(f, SAME_AT, 44));
  const proj = (x: number, y: number) => ({ x: (x - ZOOM_O.x) * zoom + ZOOM_O.x, y: (y - ZOOM_O.y) * zoom + ZOOM_O.y });

  // our ball: kicked, skids, hops — the moment that becomes the excuse
  const kick = progIO(f, EXCUSE_AT + 40, 50);
  const ourBall = { x: lerp(230, 400, kick), y: lerp(880, 760, kick), hop: 26 * Math.abs(Math.sin(prog(f, EXCUSE_AT + 90, 40) * Math.PI * 2)) * (1 - prog(f, EXCUSE_AT + 90, 40)) };
  const theirBall = { x: PCX + (PCX - ourBall.x), y: ourBall.y };
  const theirIn = prog(f, SAME_AT + 30, 24);
  const tag1 = prog(f, EXCUSE_AT + 60, 18) * (1 - prog(f, SAME_AT - 10, 16));
  const tag2 = prog(f, EXCUSE_AT + 110, 18) * (1 - prog(f, SAME_AT - 10, 16));
  const sameTags = prog(f, SAME_AT + 60, 20) * (1 - prog(f, WIN_AT - 20, 16));
  const skidA = proj(255, 885);
  const ballS = proj(ourBall.x, ourBall.y);

  // closing: one line from kick-off to their goal
  const finalLine = progIO(f, END_AT + 30, 60);

  const panelsOp = progIO(f, WIN_AT - 4, 26) * (1 - 0.75 * progIO(f, WORK_AT, 30)) * (1 - progIO(f, END_AT - 10, 24));
  const work = ["같은 시스템", "같은 예산", "같은 시장"];

  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      background: BG, fontFamily: `'${SANS}', sans-serif`,
    }}>
      <FontLoader />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 80% 55% at 50% 46%, #FFFFFF 0%, rgba(246,244,239,0) 70%)",
      }} />
      <div style={{ position: "absolute", inset: 0, opacity: endFade }}>
        <Overline f={f} from={6} to={SAME_AT - 4} tag="FULL TIME" text="경기 종료" color={INK} />
        <Overline f={f} from={SAME_AT + 4} to={WIN_AT - 4} tag="SAME FIELD" text="같은 운동장" color={INK} />
        <Overline f={f} from={WIN_AT + 4} to={WORK_AT - 4} tag="THE DIFFERENCE" text="이긴 팀의 차이" color={AMBER} />
        <Overline f={f} from={WORK_AT + 4} to={END_AT - 4} tag="AT WORK" text="회사에서도" color={INK} />
        <Overline f={f} from={END_AT + 4} to={TOTAL + 10} tag="RESPONSIBILITY" text="책임자" color={AMBER} />

        {fullOp > 0 && (
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: fullOp }}>
            <defs>
              <clipPath id="sf-view"><rect x={P.x - 20} y={P.y - 20} width={P.w + 40} height={P.h + 40} rx={14} /></clipPath>
            </defs>
            <g clipPath="url(#sf-view)">
            <g transform={`translate(${ZOOM_O.x} ${ZOOM_O.y}) scale(${zoom}) translate(${-ZOOM_O.x} ${-ZOOM_O.y})`}>
              <FullPitch />
              {f < END_AT && (
                <>
                  <Skid x1={255} y1={885} x2={330} y2={830} p={prog(f, EXCUSE_AT + 50, 30)} />
                  <Ball x={ourBall.x} y={ourBall.y} hop={ourBall.hop} />
                  {theirIn > 0 && (
                    <>
                      <Skid x1={PCX + (PCX - 255)} y1={885} x2={PCX + (PCX - 330)} y2={830} p={theirIn} />
                      <Ball x={theirBall.x} y={theirBall.y} op={theirIn} />
                    </>
                  )}
                </>
              )}
              {f >= END_AT && (
                <>
                  <line x1={PCX} y1={PCY} x2={lerp(PCX, P.x + P.w + 10, finalLine)} y2={PCY} stroke={AMBER} strokeWidth={5} strokeLinecap="round" strokeDasharray="2 14" />
                  <Ball x={lerp(PCX, P.x + P.w + 6, finalLine)} y={PCY} />
                </>
              )}
            </g>
            </g>
          </svg>
        )}
        {f < SAME_AT && (
          <>
            <Tag x={skidA.x + 20} y={skidA.y - 150} ax={skidA.x + 40} ay={skidA.y - 20} text="“잔디가 미끄러워서.”" op={tag1} />
            <Tag x={Math.min(ballS.x + 150, 840)} y={ballS.y - 120} ax={ballS.x + 12} ay={ballS.y - 22} text="“공이 가벼워서.”" op={tag2} />
          </>
        )}
        {sameTags > 0 && (
          <>
            {[0, 1].map((s) => (
              <div key={s} style={{
                position: "absolute", left: s ? PCX + 220 : PCX - 220, top: P.y + 60, transform: "translateX(-50%)",
                fontSize: 26, fontWeight: 700, color: BODY, opacity: sameTags, whiteSpace: "nowrap",
                padding: "6px 16px", borderRadius: 20, background: "rgba(255,255,255,0.9)",
              }}>{s ? "상대 팀" : "우리 팀"} · 잔디 · 공</div>
            ))}
            <div style={{
              position: "absolute", left: PCX, top: P.y + 58, transform: "translateX(-50%)",
              fontSize: 40, fontWeight: 700, color: AMBER, opacity: sameTags,
            }}>=</div>
          </>
        )}

        {panelsOp > 0 && (
          <div style={{ position: "absolute", inset: 0, opacity: panelsOp }}>
            {[0, 1].map((s) => (
              <div key={s} style={{
                position: "absolute", left: s ? RIGHT_CX : LEFT_CX, top: HALF.top - 90, transform: "translateX(-50%)",
                fontSize: 30, fontWeight: 700, color: s ? AMBER : SUB, whiteSpace: "nowrap",
                opacity: s ? 1 : 1 - 0.6 * progIO(f, WIN_AT, 20) * (1 - progIO(f, GAP_AT, 30)),
              }}>{s ? "이긴 팀" : "우리 팀"}</div>
            ))}
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
              <Panels f={f} />
            </svg>
            <Complaints f={f} />
          </div>
        )}
        {f >= WORK_AT && f < END_AT && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 690, textAlign: "center", opacity: 1 - prog(f, END_AT - 16, 14) }}>
            {work.map((w, i) => (
              <div key={i} style={{ opacity: prog(f, WORK_AT + 16 + i * 18, 20), transform: `translateY(${(1 - prog(f, WORK_AT + 16 + i * 18, 20)) * 20}px)`,
                fontSize: 54, fontWeight: 700, color: INK, lineHeight: 1.7, letterSpacing: -1 }}>{w}</div>
            ))}
          </div>
        )}

        <Scoreboard f={f} />
        <Captions f={f} caps={CAPTIONS} />
        <Ending f={f} />
      </div>
      <Grain f={f} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 62%, rgba(120,108,88,0.14) 100%)",
      }} />
    </div>
  );
};
