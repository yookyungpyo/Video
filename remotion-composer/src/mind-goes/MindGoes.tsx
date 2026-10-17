import { useEffect, useState } from "react";
import {
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  continueRender,
  delayRender,
} from "remotion";
import {
  TOTAL, SPLIT_AT, COIN_DROP, COIN_LAND, FOCUS_AT, GILD, LIFT_AT, CLOSE_AT, TICK_EVERY,
  fastness, minutesLeft, minutesRight, hhmm, GLANCES_LEFT, GLANCES_RIGHT, glanceCount,
} from "./clocks";

export { TOTAL };

const SERIF = "Noto Serif KR";
const BG = "#0E1220";
const INK = "#F3EFE8";
const BODY = "#D9D3C8";
const SUB = "#8E93A3";
const WARM = "#F2B45C";
const COOL = "#9FB4D2";
const GOLD = "#C9A44A";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
const progIO = (f: number, at: number, dur: number) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeInOut });
const MX = 100;
const CY = 760;

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
const CAP_TOP = 1190;

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
  { from: 16, to: 150, lines: [
    { at: 16, segs: [{ t: "새벽 2시까지,", c: INK }] },
    { at: 40, segs: [{ t: "시간 가는 줄 몰랐던 일 있나요?" }] },
  ] },
  { from: 168, to: 446, lines: [
    { at: 168, segs: [{ t: "좋아서", c: WARM }, { t: " 하는 일은 시간이 사라지고," }] },
    { at: 226, segs: [{ t: "돈 때문에", c: COOL }, { t: " 하는 일은 시계만 보게 된다" }] },
  ] },
  { from: COIN_DROP, to: 716, lines: [
    { at: COIN_DROP, segs: [{ t: "그런데 좋아하던 일도," }] },
    { at: COIN_DROP + 38, segs: [{ t: "돈이 이유", c: GOLD }, { t: "가 되는 순간 시계를 보게 된다" }] },
  ] },
  { from: 732, to: 926, lines: [
    { at: 732, segs: [{ t: "마음이 가서 하던 일은," }] },
    { at: 764, segs: [{ t: "이유가 바뀌면 " }, { t: "마음이 떠난다", c: INK }] },
  ] },
  { from: LIFT_AT + 12, to: 1106, lines: [
    { at: LIFT_AT + 12, segs: [{ t: "좋아서", c: WARM }, { t: " 할 때," }] },
    { at: LIFT_AT + 42, segs: [{ t: "그 일은 " }, { t: "끝까지 간다", c: INK }] },
  ] },
];

// ---------- Clock ----------

type ClockProps = {
  f: number; cx: number; cy: number; r: number; minutes: number; tone: "warm" | "cool";
  fast: number; gild?: number; pulse?: number; opacity?: number;
};

const Clock: React.FC<ClockProps> = ({ f, cx, cy, r, minutes, tone, fast, gild = 0, pulse = 0, opacity = 1 }) => {
  const hourA = ((minutes / 60) % 12) * 30 - 90;
  const minA = (minutes % 60) * 6 - 90;
  const secA = Math.floor(f / TICK_EVERY) * 6 - 90;
  const accent = tone === "warm" ? WARM : COOL;
  const rim = gild > 0 ? GOLD : tone === "warm" ? "#E8D9BE" : "#B9C3D3";
  const hand = (a: number, len: number, w: number, col: string, op = 1) => {
    const rad = (a * Math.PI) / 180;
    return <line x1={cx - Math.cos(rad) * len * 0.12} y1={cy - Math.sin(rad) * len * 0.12} x2={cx + Math.cos(rad) * len} y2={cy + Math.sin(rad) * len}
      stroke={col} strokeWidth={w} strokeLinecap="round" opacity={op} />;
  };
  return (
    <g opacity={opacity}>
      <circle cx={cx} cy={cy} r={r} fill={`url(#face-${tone})`} />
      {gild > 0 && <circle cx={cx} cy={cy} r={r} fill="url(#gild)" opacity={0.75 * gild} />}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={rim} strokeWidth={2 + 2 * pulse} strokeOpacity={0.6 + 0.4 * pulse} />
      {Array.from({ length: 60 }, (_, k) => {
        const a = (k * 6 * Math.PI) / 180;
        const major = k % 5 === 0;
        const r0 = r - (major ? 16 : 7);
        return <line key={k} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * (r - 4)} y2={cy + Math.sin(a) * (r - 4)}
          stroke={rim} strokeWidth={major ? 2.5 : 1.2} strokeOpacity={major ? 0.75 : 0.32} />;
      })}
      {hand(hourA, r * 0.5, 6, INK)}
      {hand(minA, r * 0.74, 4, INK)}
      {/* the second hand only shows while time crawls — spinning it fast would strobe */}
      {hand(secA, r * 0.84, 2, accent, 1 - fast)}
      <circle cx={cx} cy={cy} r={7} fill={accent} />
    </g>
  );
};

const Coin: React.FC<{ f: number; cx: number; cy: number }> = ({ f, cx, cy }) => {
  if (f < COIN_DROP) return null;
  const fall = progIO(f, COIN_DROP, COIN_LAND - COIN_DROP);
  const bounce = f > COIN_LAND ? Math.max(0, Math.sin((f - COIN_LAND) * 0.35) * 14 * Math.exp(-(f - COIN_LAND) * 0.12)) : 0;
  const lift = progIO(f, LIFT_AT, 40);
  const x = cx + 92;
  const y = lerp(300, cy - 118, fall * fall) - bounce - lift * 360;
  const op = Math.min(1, fall * 3) * (1 - lift);
  if (op <= 0) return null;
  return (
    <g opacity={op} transform={`translate(${x} ${y}) rotate(${(1 - fall) * 40 - lift * 30})`}>
      <ellipse cx={4} cy={8} rx={44} ry={44} fill="rgba(0,0,0,0.35)" />
      <circle r={44} fill="url(#coin)" stroke="#8C6F2A" strokeWidth={2} />
      <circle r={33} fill="none" stroke="#F3DB97" strokeWidth={1.5} opacity={0.7} />
      <text y={14} textAnchor="middle" fontSize={38} fontWeight={700} fill="#7A5E1F" fontFamily={`'${SERIF}', serif`}>₩</text>
    </g>
  );
};

const Scene: React.FC<{ f: number }> = ({ f }) => {
  const split = progIO(f, SPLIT_AT, 36);
  const focus = progIO(f, FOCUS_AT, 44);
  const fast = fastness(f);
  // left clock: centre → left half → back to centre
  const lx = lerp(lerp(540, 300, split), 540, focus);
  const lr = lerp(lerp(180, 140, split), 175, focus);
  const rx = lerp(540, 780, split);
  const rOp = split * (1 - progIO(f, FOCUS_AT, 30));
  const gild = interpolate(f, [GILD[0], GILD[1], LIFT_AT, LIFT_AT + 50], [0, 1, 1, 0], { ...clamp, easing: easeInOut });
  const pulseOf = (list: number[]) => list.reduce((m, g) => Math.max(m, interpolate(f, [g, g + 4, g + 18], [0, 1, 0], clamp)), 0);
  const warmth = fast * (1 - 0.6 * gild);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="face-warm"><stop offset="0" stopColor="#1D2232" /><stop offset="1" stopColor="#131826" /></radialGradient>
        <radialGradient id="face-cool"><stop offset="0" stopColor="#192030" /><stop offset="1" stopColor="#111623" /></radialGradient>
        <radialGradient id="lamp"><stop offset="0" stopColor={WARM} stopOpacity={0.42} /><stop offset="0.5" stopColor={WARM} stopOpacity={0.12} /><stop offset="1" stopColor={WARM} stopOpacity={0} /></radialGradient>
        <radialGradient id="chill"><stop offset="0" stopColor={COOL} stopOpacity={0.22} /><stop offset="1" stopColor={COOL} stopOpacity={0} /></radialGradient>
        <radialGradient id="gild"><stop offset="0" stopColor="#E8C877" stopOpacity={0.55} /><stop offset="1" stopColor="#9C7A2E" stopOpacity={0.85} /></radialGradient>
        <radialGradient id="coin" cx="0.35" cy="0.35"><stop offset="0" stopColor="#F6E2A2" /><stop offset="1" stopColor="#C29A3E" /></radialGradient>
      </defs>
      {/* lamp light behind the loved work; it dims as the reason turns to money */}
      <circle cx={lx} cy={CY} r={lr * 2.4} fill="url(#lamp)" opacity={prog(f, 0, 30) * (0.25 + 0.75 * warmth)} />
      {rOp > 0 && <circle cx={rx} cy={CY} r={300} fill="url(#chill)" opacity={rOp} />}
      {rOp > 0 && (
        <Clock f={f} cx={rx} cy={CY} r={140} minutes={minutesRight(f)} tone="cool" fast={0} pulse={pulseOf(GLANCES_RIGHT)} opacity={rOp} />
      )}
      <Clock f={f} cx={lx} cy={CY} r={lr} minutes={minutesLeft(f)} tone="warm" fast={fast} gild={gild} pulse={pulseOf(GLANCES_LEFT)} opacity={prog(f, 0, 24)} />
      <Coin f={f} cx={lx} cy={CY} />
    </svg>
  );
};

const Labels: React.FC<{ f: number }> = ({ f }) => {
  const split = progIO(f, SPLIT_AT, 36);
  const focus = progIO(f, FOCUS_AT, 44);
  const two = prog(f, SPLIT_AT + 20, 20) * (1 - progIO(f, FOCUS_AT, 24));
  const lx = lerp(lerp(540, 300, split), 540, focus);
  const rx = lerp(540, 780, split);
  const leftCount = glanceCount(f, GLANCES_LEFT);
  const rightCount = glanceCount(f, GLANCES_RIGHT);
  const readout = (x: number, time: string, color: string, count: number | null, op: number) => (
    <div style={{ position: "absolute", left: x - 200, width: 400, top: CY + 168, textAlign: "center", opacity: op }}>
      <div style={{ fontSize: 40, fontWeight: 700, color, letterSpacing: 1, fontVariantNumeric: "tabular-nums" }}>{time}</div>
      {count !== null && (
        <div style={{ fontSize: 22, color: SUB, marginTop: 8 }}>
          시계 본 횟수 <span style={{ color: INK, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{count}</span>번
        </div>
      )}
    </div>
  );
  const thought = interpolate(f, [COIN_LAND + 6, COIN_LAND + 24, 620, 640], [0, 1, 1, 0], clamp);
  return (
    <>
      {two > 0 && (
        <>
          <div style={{ position: "absolute", left: lx - 200, width: 400, top: CY - 220, textAlign: "center", fontSize: 30, fontWeight: 700, color: WARM, opacity: two }}>좋아서 하는 일</div>
          <div style={{ position: "absolute", left: rx - 200, width: 400, top: CY - 220, textAlign: "center", fontSize: 30, fontWeight: 700, color: COOL, opacity: two }}>돈 때문에 하는 일</div>
          {readout(rx, hhmm(minutesRight(f)), COOL, rightCount, two * prog(f, SPLIT_AT + 30, 20))}
        </>
      )}
      {readout(lx, hhmm(minutesLeft(f)), f > COIN_LAND + 60 && f < LIFT_AT + 40 ? "#D8C08A" : WARM, f >= GLANCES_LEFT[0] && f < LIFT_AT + 20 ? leftCount : null,
        prog(f, 20, 20) * (1 - prog(f, CLOSE_AT - 14, 14)))}
      {thought > 0 && (
        <div style={{ position: "absolute", left: lx + 20, top: CY - 300, fontSize: 30, fontWeight: 700, color: "#E8D29A", opacity: thought, whiteSpace: "nowrap" }}>
          "이걸로 돈 벌어볼까?"
        </div>
      )}
    </>
  );
};

const Closing: React.FC<{ f: number }> = ({ f }) => {
  if (f < CLOSE_AT) return null;
  const big: React.CSSProperties = { fontSize: 58, fontWeight: 700, color: INK, letterSpacing: -1, lineHeight: 1.38 };
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP - 30 }}>
      <Line f={f} at={CLOSE_AT + 4} style={big}>세상엔 그냥</Line>
      <Line f={f} at={CLOSE_AT + 22} style={big}><span style={{ color: WARM }}>마음이 가는 일</span>이 있다.</Line>
      <div style={{ height: 18 }} />
      <Line f={f} at={CLOSE_AT + 58} style={{ ...big, fontSize: 52, color: BODY }}>돈 때문에 하면, 못 한다.</Line>
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

export const MindGoes: React.FC = () => {
  const f = useCurrentFrame();
  const endFade = interpolate(f, [TOTAL - 18, TOTAL], [1, 0], clamp);
  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      background: BG, fontFamily: `'${SERIF}', serif`, opacity: endFade,
    }}>
      <FontLoader />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 80% 55% at 50% 42%, #18203A 0%, rgba(14,18,32,0) 70%)",
      }} />
      <div style={{ position: "absolute", inset: 0, transform: "translateY(40px)" }}>
        <Scene f={f} />
        <Labels f={f} />
        <Captions f={f} caps={CAPTIONS} />
        <Closing f={f} />
      </div>
      <Grain f={f} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 58%, rgba(0,0,0,0.5) 100%)",
      }} />
    </div>
  );
};
