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
const SERIF = "Noto Serif KR";
const BG = "#F6F4EF";
const INK = "#1B1E24";
const SUB = "#7C818A";
const BODY = "#3D424B";
const HAIR = "rgba(27,30,36,0.12)";
const LINE = "#2B2F36";
const TRACE = "#B9BDC4";
const AMBER = "#DE8A1E";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
const progIO = (f: number, at: number, dur: number) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeInOut });

export const TOTAL = 1260;
const MX = 100;

// ---------- Timeline ----------
// S1 an anxious time 0–180 · S2 "AI will replace jobs" — the wave hits 180–360
// S3 back along the line: the same words before 360–790 · S4 the whole line, next day too 790–960
// S5 keep doing what you do, as always 960–1260
export const SURGE_AT = 180;
export const PAST_AT = 360;
export const WHOLE_AT = 790;
export const END_AT = 960;
export const ALWAYS_AT = END_AT + 150; // "늘 그랬듯이."

// ---------- World: one line that never changes speed ----------
const LINE_Y = 880;
const LINE_START = -2600;
const TIP0 = 240;
const V = 1.0; // world px per frame — the same pace from first frame to last
export const tipX = (f: number) => TIP0 + V * f;
const AI_X = 520; // where this wave meets the line
const MARKS = [
  { x: -500, short: "스마트폰", long: "스마트폰이 나왔을 때" },
  { x: -1300, short: "인터넷", long: "인터넷이 들어왔을 때" },
  { x: -2100, short: "컴퓨터", long: "사무실에 컴퓨터가 들어왔을 때" },
];
const TICK = 48;

// camera: world x at screen centre + zoom, eased between holds
const OUT_CX = -700;
const OUT_Z = 0.215;
const KEYS: [number, number, number][] = [
  [0, 540, 1],
  [PAST_AT + 20, 540, 1],
  [PAST_AT + 90, MARKS[0].x, 1],
  [PAST_AT + 160, MARKS[0].x, 1],
  [PAST_AT + 230, MARKS[1].x, 1],
  [PAST_AT + 300, MARKS[1].x, 1],
  [PAST_AT + 370, MARKS[2].x, 1],
  [WHOLE_AT, MARKS[2].x, 1],
  [WHOLE_AT + 70, OUT_CX, OUT_Z],
  [END_AT - 10, OUT_CX, OUT_Z],
];
const FOLLOW = 170; // in S5 the camera rides with the tip, tip sits right of centre
const camAt = (f: number) => {
  if (f >= END_AT - 10) {
    const p = progIO(f, END_AT - 10, 70);
    return { cx: lerp(OUT_CX, tipX(f) - FOLLOW, p), z: OUT_Z * Math.pow(1 / OUT_Z, p) };
  }
  for (let i = 1; i < KEYS.length; i++) {
    const [f1, x1, z1] = KEYS[i];
    if (f <= f1) {
      const [f0, x0, z0] = KEYS[i - 1];
      const p = progIO(f, f0, f1 - f0);
      return { cx: lerp(x0, x1, p), z: z0 * Math.pow(z1 / z0, p) };
    }
  }
  const last = KEYS[KEYS.length - 1];
  return { cx: last[1], z: last[2] };
};

// ---------- Noise around the present ----------
const NOISE = [
  { t: "AI가 대체할 직업", dx: -230, dy: -250, s: 30 },
  { t: "일자리 감소", dx: 250, dy: -170, s: 34 },
  { t: "지금 안 배우면 늦는다", dx: -220, dy: 170, s: 28 },
  { t: "곧 사라질 일들", dx: 260, dy: 250, s: 30 },
  { t: "자동화", dx: 30, dy: -320, s: 32 },
  { t: "AI 쓰는 사람만 남는다", dx: 10, dy: 300, s: 26 },
  { t: "대체 1순위", dx: 330, dy: -60, s: 28 },
];

// ---------- Fonts & text ----------

const fontCss = `
@font-face { font-family: '${SANS}'; font-weight: 400; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-400-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${SANS}'; font-weight: 700; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2'); }
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
      (document as any).fonts.load(`400 64px "${SANS}"`, "가"),
      (document as any).fonts.load(`700 64px "${SANS}"`, "가"),
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
    const p = prog(f, at, 20);
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
const CAP_TOP = 1200;

const Captions: React.FC<{ f: number; caps: Cap[] }> = ({ f, caps }) => {
  const c = caps.find((x) => f >= x.from && f < x.to);
  if (!c) return null;
  const out = clamp01((c.to - f) / 10);
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP, opacity: out, fontFamily: `'${SERIF}', serif` }}>
      <div style={{ width: 2, height: 22, background: HAIR, marginBottom: 18 }} />
      {c.lines.map((l, i) =>
        f >= l.at ? (
          <Line key={i} f={f} at={l.at} style={{ fontSize: 44, fontWeight: 400, lineHeight: 1.5, color: BODY, letterSpacing: -0.5 }}>
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
  { from: 20, to: SURGE_AT - 4, lines: [
    { at: 20, segs: [{ t: "AI 시대, " }, { t: "막막하죠.", c: INK }] },
  ] },
  { from: SURGE_AT + 10, to: PAST_AT - 4, lines: [
    { at: SURGE_AT + 10, segs: [{ t: "AI가 일자리를 " }, { t: "대체", c: INK }, { t: "한다고 합니다." }] },
  ] },
  { from: PAST_AT + 40, to: WHOLE_AT - 4, lines: [
    { at: PAST_AT + 40, segs: [{ t: "그때도 " }, { t: "같은 말", c: INK }, { t: "이 있었습니다." }] },
  ] },
  { from: WHOLE_AT + 10, to: END_AT - 4, lines: [
    { at: WHOLE_AT + 10, segs: [{ t: "그리고 우리는," }] },
    { at: WHOLE_AT + 50, segs: [{ t: "다음 날도 출근했습니다.", c: INK }] },
  ] },
];

// ---------- Pieces ----------

const Overline: React.FC<{ f: number; from: number; to: number; tag: string; text: string; color: string }> =
  ({ f, from, to, tag, text, color }) => {
    if (f < from || f >= to) return null;
    const p = prog(f, from, 20) * clamp01((to - f) / 10);
    return (
      <div style={{ position: "absolute", left: MX, top: 380, display: "flex", alignItems: "center", gap: 18, opacity: p }}>
        <div style={{ width: 36 * p, height: 2, background: color }} />
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color }}>{tag}</span>
        <span style={{ fontSize: 24, fontWeight: 400, color: SUB }}>{text}</span>
      </div>
    );
  };

// rings left on the line where a wave once passed
const Ripple: React.FC<{ sx: number; z: number; color: string; op: number; spread?: number }> =
  ({ sx, z, color, op, spread = 1 }) => {
    const s = Math.max(z, 0.32);
    return (
      <g opacity={op}>
        {[1, 2, 3, 4].map((k) => (
          <ellipse key={k} cx={sx} cy={LINE_Y} rx={34 * k * s * spread} ry={66 * k * s * spread}
            fill="none" stroke={color} strokeWidth={1.6} opacity={1 - k * 0.2} />
        ))}
      </g>
    );
  };

const World: React.FC<{ f: number }> = ({ f }) => {
  const { cx, z } = camAt(f);
  const sx = (wx: number) => (wx - cx) * z + 540;
  const tip = tipX(f);
  const lineIn = prog(f, 0, 20);
  const tickOp = clamp01((z - 0.45) / 0.35);
  const ticks: number[] = [];
  const firstTick = Math.ceil(Math.max(LINE_START, cx - 540 / z - TICK) / TICK) * TICK;
  for (let x = firstTick; x <= Math.min(tip, cx + 540 / z + TICK); x += TICK) ticks.push(x);

  // the AI wave: rings pulse outward while the noise surges, then settle into a trace like the others
  const surge = prog(f, SURGE_AT, 40) * (1 - prog(f, PAST_AT - 30, 40));
  const aiTrace = prog(f, PAST_AT - 20, 40);
  const pulse = (f - SURGE_AT) / 60;
  const glow = prog(f, ALWAYS_AT - 20, 50);
  const tipS = sx(tip);

  const labelAt = (x: number) => clamp01(1 - Math.abs(sx(x) - 540) / 240) * clamp01((z - 0.7) / 0.3);
  const shortOp = clamp01((0.55 - z) / 0.25);

  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="sl-glow">
            <stop offset="0%" stopColor={AMBER} stopOpacity={0.45} />
            <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="sl-fade" x1="0" x2="1">
            <stop offset="0%" stopColor={LINE} stopOpacity={0} />
            <stop offset="100%" stopColor={LINE} stopOpacity={1} />
          </linearGradient>
        </defs>

        {/* traces of past waves */}
        {MARKS.map((m, i) => (
          <Ripple key={i} sx={sx(m.x)} z={z} color={TRACE} op={1} />
        ))}
        {/* this wave */}
        {surge > 0 && [0, 1, 2].map((k) => {
          const ph = (pulse + k / 3) % 1;
          return (
            <ellipse key={k} cx={sx(AI_X)} cy={LINE_Y} rx={(20 + 150 * ph) * z} ry={(40 + 290 * ph) * z}
              fill="none" stroke={SUB} strokeWidth={1.8} opacity={surge * (1 - ph) * 0.8} />
          );
        })}
        <Ripple sx={sx(AI_X)} z={z} color={TRACE} op={aiTrace} />

        {/* the line: a faded start far in the past, then solid up to today */}
        <g opacity={lineIn}>
          <line x1={sx(LINE_START)} y1={LINE_Y} x2={sx(LINE_START + 300)} y2={LINE_Y} stroke="url(#sl-fade)" strokeWidth={3} />
          <line x1={sx(LINE_START + 300)} y1={LINE_Y} x2={tipS} y2={LINE_Y} stroke={LINE} strokeWidth={3} strokeLinecap="round" />
          {tickOp > 0 && ticks.map((x) => (
            <line key={x} x1={sx(x)} y1={LINE_Y + 10} x2={sx(x)} y2={LINE_Y + 22} stroke={TRACE} strokeWidth={1.5} opacity={tickOp} />
          ))}
        </g>

        {/* today */}
        {glow > 0 && <circle cx={tipS} cy={LINE_Y} r={60 + 140 * glow} fill="url(#sl-glow)" opacity={glow} />}
        <circle cx={tipS} cy={LINE_Y} r={26} fill={AMBER} opacity={0.18 * lineIn} />
        <circle cx={tipS} cy={LINE_Y} r={10} fill={AMBER} opacity={lineIn} />
      </svg>

      {/* close-up labels above each past wave */}
      {MARKS.map((m, i) => {
        const op = labelAt(m.x);
        if (op <= 0) return null;
        return (
          <div key={i} style={{
            position: "absolute", left: sx(m.x), top: LINE_Y - 380, transform: "translateX(-50%)",
            textAlign: "center", opacity: op, whiteSpace: "nowrap",
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4, color: SUB }}>THEN</div>
            <div style={{ fontSize: 40, fontWeight: 700, color: INK, marginTop: 8, letterSpacing: -1 }}>{m.long}</div>
          </div>
        );
      })}

      {/* zoomed-out names under every wave, today in amber */}
      {shortOp > 0 && [...MARKS, { x: AI_X, short: "AI" }].map((m, i) => (
        <div key={i} style={{
          position: "absolute", left: sx(m.x), top: LINE_Y + 150, transform: "translateX(-50%)",
          fontSize: 28, fontWeight: 700, color: i === 3 ? AMBER : BODY, opacity: shortOp, whiteSpace: "nowrap",
        }}>{m.short}</div>
      ))}
      {shortOp > 0 && (
        <div style={{
          position: "absolute", left: tipS, top: LINE_Y - 70, transform: "translateX(-50%)",
          fontSize: 22, fontWeight: 700, letterSpacing: 4, color: AMBER, opacity: shortOp,
        }}>TODAY</div>
      )}

      {/* noise: phrases gather, surge onto the line, then drift off with the present */}
      {NOISE.map((n, i) => {
        const a = prog(f, 30 + i * 16, 24);
        if (a <= 0) return null;
        const sg = progIO(f, SURGE_AT + i * 4, 60);
        const pass = progIO(f, SURGE_AT + 100 + i * 4, 70);
        const wx = AI_X + n.dx * lerp(1, 0.85, sg) + pass * (n.dx > 0 ? 260 : -260);
        const wy = n.dy * lerp(1, 0.55, sg) * (1 - pass) + n.dy * 1.3 * pass;
        const drift = Math.sin(f / 40 + i * 1.7) * 8;
        const op = a * lerp(0.55, 0.9, sg) * (1 - pass * 0.85) * (1 - prog(f, PAST_AT + 40, 40));
        if (op <= 0.01) return null;
        return (
          <div key={i} style={{
            position: "absolute", left: sx(wx), top: LINE_Y + wy * Math.max(z, 0.3) + drift,
            transform: `translate(-50%, -50%) scale(${Math.max(z, 0.3)})`,
            fontSize: n.s, fontWeight: 700, color: SUB, opacity: op, whiteSpace: "nowrap",
            filter: `blur(${(1 - a) * 4}px)`,
          }}>{n.t}</div>
        );
      })}
    </>
  );
};

const Ending: React.FC<{ f: number }> = ({ f }) => {
  if (f < END_AT) return null;
  const lead: React.CSSProperties = { fontSize: 44, color: BODY, lineHeight: 1.5, letterSpacing: -0.5 };
  const big: React.CSSProperties = { fontSize: 66, fontWeight: 700, color: AMBER, letterSpacing: -1.5, lineHeight: 1.3 };
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP - 10, fontFamily: `'${SERIF}', serif` }}>
      <Line f={f} at={END_AT + 40} style={lead}>그냥 하시던 일,</Line>
      <Line f={f} at={END_AT + 76} style={lead}>그대로 <span style={{ color: INK, fontWeight: 700 }}>꾸준히</span> 하면 됩니다.</Line>
      <div style={{ height: 14 }} />
      <Line f={f} at={ALWAYS_AT} style={big}>늘 그랬듯이.</Line>
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

export const SameLine: React.FC = () => {
  const f = useCurrentFrame();
  const endFade = interpolate(f, [TOTAL - 18, TOTAL], [1, 0], clamp);
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
        <Overline f={f} from={6} to={PAST_AT - 4} tag="AI ERA" text="막막한 시기" color={INK} />
        <Overline f={f} from={PAST_AT + 4} to={WHOLE_AT - 4} tag="AS ALWAYS" text="늘 그랬듯이" color={AMBER} />
        <Overline f={f} from={WHOLE_AT + 4} to={END_AT - 4} tag="AND THEN" text="그다음 날" color={INK} />
        <Overline f={f} from={END_AT + 4} to={TOTAL + 10} tag="KEEP GOING" text="하던 일 그대로" color={AMBER} />
        <World f={f} />
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
