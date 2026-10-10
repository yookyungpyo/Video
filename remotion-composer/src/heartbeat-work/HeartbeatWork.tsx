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
  PX, TOTAL, WAKE_AT, FIRST_BIG, WEEK_FROM, WEEK_TO, WEEK_DRAW, WK, DAY_W, SPARKS, SPARK_X,
  bpmAt, exciteAt, valueAt, weekValue, weekHeadX, weekCross,
} from "./signal";

const SANS = "Noto Sans KR";
const BG = "#0D1015";
const INK = "#F2F4F7";
const SUB = "#8A93A3";
const BODY = "#D5DAE1";
const HAIR = "rgba(255,255,255,0.10)";
const CALM = [124, 133, 148]; // resting trace (gray)
const AMBER = "#F2B45C";
const AMBER_RGB = [242, 180, 92];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = Easing.out(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
const mix = (e: number) =>
  `rgb(${CALM.map((c, i) => Math.round(c + (AMBER_RGB[i] - c) * e)).join(",")})`;

const MX = 100;
const TRACE_L = 100;
const HEAD_X = 820;
const BASE = 900;
const AMP_PX = 230;

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
const CAP_TOP = 1170;

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
    { at: 20, segs: [{ t: "요즘, 마지막으로" }] },
    { at: 36, segs: [{ t: "가슴이 뛴 게", c: INK }, { t: " 언제인가요?" }] },
  ] },
  { from: 168, to: 372, lines: [
    { at: 168, segs: [{ t: "하루 종일 " }, { t: "바빴는데,", c: INK }] },
    { at: 215, segs: [{ t: "가슴은 한 번도 뛰지 않은 날" }] },
  ] },
  { from: 390, to: 548, lines: [
    { at: 390, segs: [{ t: "그런데 " }, { t: "여행 가는 날", c: INK }, { t: "은," }] },
    { at: 418, segs: [{ t: "알람보다 먼저", c: AMBER }, { t: " 눈이 떠진다" }] },
  ] },
  { from: 562, to: 752, lines: [
    { at: 562, segs: [{ t: "누가 " }, { t: "시키지 않아도,", c: INK }] },
    { at: 592, segs: [{ t: "가슴이 먼저", c: AMBER }, { t: " 반응한다" }] },
  ] },
  { from: 782, to: 1032, lines: [
    { at: 782, segs: [{ t: "일 전부를 바꿀 순 없어도," }] },
    { at: 818, segs: [{ t: "그 안에 " }, { t: "가슴 뛰는 한 가지", c: AMBER }, { t: "는 만들 수 있다" }] },
  ] },
];

// ---------- Pieces ----------

const Overline: React.FC<{ f: number; from: number; to: number; tag: string; text: string; color: string }> =
  ({ f, from, to, tag, text, color }) => {
    if (f < from || f >= to) return null;
    const p = prog(f, from, 20) * clamp01((to - f) / 10);
    return (
      <div style={{ position: "absolute", left: MX, top: 360, display: "flex", alignItems: "center", gap: 18, opacity: p }}>
        <div style={{ width: 36 * p, height: 2, background: color }} />
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color }}>{tag}</span>
        <span style={{ fontSize: 24, fontWeight: 400, color: SUB }}>{text}</span>
      </div>
    );
  };

const monitorOpacity = (f: number) =>
  interpolate(f, [0, 16, WEEK_FROM - 12, WEEK_FROM, WEEK_TO - 6, WEEK_TO + 10], [0, 1, 1, 0, 0, 1], clamp);

const Monitor: React.FC<{ f: number }> = ({ f }) => {
  const op = monitorOpacity(f);
  if (op <= 0) return null;
  const n = HEAD_X - TRACE_L;
  const pts: string[] = [];
  for (let k = n; k >= 0; k--) {
    const t = f - k / PX;
    pts.push(`${HEAD_X - k} ${(BASE - valueAt(t) * AMP_PX).toFixed(1)}`);
  }
  const d = `M ${pts.join(" L ")}`;
  const stops: React.ReactNode[] = [];
  const glowStops: React.ReactNode[] = [];
  for (let x = TRACE_L; x <= HEAD_X; x += 20) {
    const e = exciteAt(f - (HEAD_X - x) / PX);
    const fade = clamp01((x - TRACE_L) / 180);
    const off = (x - TRACE_L) / n;
    stops.push(<stop key={x} offset={off} stopColor={mix(e)} stopOpacity={fade * (0.75 + 0.25 * e)} />);
    glowStops.push(<stop key={x} offset={off} stopColor={AMBER} stopOpacity={fade * e * 0.22} />);
  }
  const eh = exciteAt(f);
  const hy = BASE - valueAt(f) * AMP_PX;
  const rip = f - FIRST_BIG;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: op }}>
      <defs>
        <linearGradient id="trace" gradientUnits="userSpaceOnUse" x1={TRACE_L} y1={0} x2={HEAD_X} y2={0}>{stops}</linearGradient>
        <linearGradient id="trace-glow" gradientUnits="userSpaceOnUse" x1={TRACE_L} y1={0} x2={HEAD_X} y2={0}>{glowStops}</linearGradient>
        <radialGradient id="head-halo">
          <stop offset="0" stopColor={mix(eh)} stopOpacity={0.6} />
          <stop offset="1" stopColor={mix(eh)} stopOpacity={0} />
        </radialGradient>
      </defs>
      <line x1={TRACE_L} y1={BASE} x2={980} y2={BASE} stroke="rgba(255,255,255,0.05)" strokeWidth={1.5} />
      <path d={d} stroke="url(#trace-glow)" strokeWidth={12} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} stroke="url(#trace)" strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {rip >= 0 && rip < 60 && [0, 14].map((delay) => {
        const r = rip - delay;
        if (r < 0) return null;
        const p = clamp01(r / 46);
        return <circle key={delay} cx={HEAD_X} cy={hy} r={10 + 130 * easeOut(p)} fill="none" stroke={AMBER} strokeWidth={2} opacity={0.6 * (1 - p)} />;
      })}
      <circle cx={HEAD_X} cy={hy} r={28} fill="url(#head-halo)" />
      <circle cx={HEAD_X} cy={hy} r={6} fill={mix(eh)} />
    </svg>
  );
};

// Routine schedule pinned to moments on the trace; they scroll away with it
const SCHEDULE: [number, string, string][] = [[175, "09:00", "메일 확인"], [235, "11:00", "정기 회의"], [295, "16:00", "보고서 수정"]];

const Schedule: React.FC<{ f: number }> = ({ f }) => (
  <>
    {SCHEDULE.map(([ta, time, task]) => {
      if (f < ta) return null;
      const x = HEAD_X - (f - ta) * PX;
      const op = prog(f, ta, 12) * clamp01((x - 230) / 130) * (1 - prog(f, 372, 10));
      if (op <= 0) return null;
      return (
        <div key={ta} style={{ position: "absolute", inset: 0, opacity: op }}>
          <div style={{ position: "absolute", left: x - 1, top: 788, width: 2, height: 60, background: "rgba(255,255,255,0.18)" }} />
          <div style={{ position: "absolute", right: 1080 - x + 14, top: 712, textAlign: "right", whiteSpace: "nowrap" }}>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2, color: SUB, fontVariantNumeric: "tabular-nums" }}>{time}</div>
            <div style={{ fontSize: 30, fontWeight: 400, color: BODY, marginTop: 2 }}>{task}</div>
          </div>
        </div>
      );
    })}
  </>
);

const Bpm: React.FC<{ f: number }> = ({ f }) => {
  const op = monitorOpacity(f) * prog(f, 10, 20);
  if (op <= 0) return null;
  const e = exciteAt(f);
  const big = interpolate(f, [560, 590, 740, 760], [1, 1.45, 1.45, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <div style={{
      position: "absolute", right: MX, top: 470, opacity: op, textAlign: "right",
      transform: `scale(${big})`, transformOrigin: "100% 0%",
    }}>
      <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1, letterSpacing: -2, color: mix(e), fontVariantNumeric: "tabular-nums" }}>
        {Math.round(bpmAt(f))}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 6, color: SUB, marginTop: 8 }}>BPM</div>
    </div>
  );
};

const Clock: React.FC<{ f: number }> = ({ f }) => {
  const op = prog(f, 386, 20) * (1 - prog(f, 540, 12));
  if (op <= 0) return null;
  return (
    <div style={{ position: "absolute", left: MX - 4, top: 452, opacity: op, transform: `translateY(${(1 - prog(f, 386, 20)) * 20}px)` }}>
      <div style={{ fontSize: 124, fontWeight: 700, lineHeight: 1, letterSpacing: -3, color: INK, fontVariantNumeric: "tabular-nums" }}>05:52</div>
      <div style={{ fontSize: 28, fontWeight: 400, color: SUB, marginTop: 16, marginLeft: 6 }}>
        알람 <span style={{ fontVariantNumeric: "tabular-nums" }}>06:00</span>
      </div>
    </div>
  );
};

const WEEK_DAYS = ["월", "화", "수", "목", "금"];
const SPARK_LABELS: Record<number, string> = { 0: "처음 해보는 시도", 2: "내가 낸 아이디어", 4: "고맙다는 말" };

const WEEK_D = (() => {
  const pts: string[] = [];
  for (let x = WK.x0; x <= WK.x1; x++) pts.push(`${x} ${(WK.base - weekValue(x) * WK.amp).toFixed(1)}`);
  return `M ${pts.join(" L ")}`;
})();
const SPARK_D = SPARK_X.map((cx) => {
  const pts: string[] = [];
  for (let x = Math.round(cx - 48); x <= Math.round(cx + 48); x++) pts.push(`${x} ${(WK.base - weekValue(x) * WK.amp).toFixed(1)}`);
  return `M ${pts.join(" L ")}`;
});

const Week: React.FC<{ f: number }> = ({ f }) => {
  const op = interpolate(f, [WEEK_FROM, WEEK_FROM + 16, WEEK_TO - 12, WEEK_TO], [0, 1, 1, 0], clamp);
  if (op <= 0) return null;
  const hx = weekHeadX(f);
  const drawing = f < WEEK_DRAW[1] + 2;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <clipPath id="week-draw"><rect x={0} y={0} width={hx} height={1920} /></clipPath>
          <radialGradient id="week-head">
            <stop offset="0" stopColor={INK} stopOpacity={0.5} />
            <stop offset="1" stopColor={INK} stopOpacity={0} />
          </radialGradient>
        </defs>
        <line x1={WK.x0} y1={WK.base} x2={WK.x1} y2={WK.base} stroke="rgba(255,255,255,0.05)" strokeWidth={1.5} />
        {[1, 2, 3, 4].map((d) => (
          <line key={d} x1={WK.x0 + d * DAY_W} y1={WK.base - 230} x2={WK.x0 + d * DAY_W} y2={WK.base + 60}
            stroke="rgba(255,255,255,0.06)" strokeWidth={1.5} />
        ))}
        <g clipPath="url(#week-draw)">
          <path d={WEEK_D} stroke="rgb(124,133,148)" strokeOpacity={0.8} strokeWidth={3} fill="none" strokeLinejoin="round" />
          {SPARK_D.map((d, i) => (
            <g key={i}>
              <path d={d} stroke={AMBER} strokeOpacity={0.22 * SPARKS[i][1]} strokeWidth={12} fill="none" strokeLinejoin="round" strokeLinecap="round" />
              <path d={d} stroke={AMBER} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          ))}
        </g>
        {drawing && f >= WEEK_DRAW[0] && (
          <g>
            <circle cx={hx} cy={WK.base - weekValue(hx) * WK.amp} r={24} fill="url(#week-head)" />
            <circle cx={hx} cy={WK.base - weekValue(hx) * WK.amp} r={5} fill={INK} />
          </g>
        )}
      </svg>
      {WEEK_DAYS.map((d, i) => (
        <div key={d} style={{
          position: "absolute", left: WK.x0 + i * DAY_W, width: DAY_W, top: WK.base + 70, textAlign: "center",
          fontSize: 26, fontWeight: 700, color: SUB, opacity: prog(f, WEEK_FROM + 6 + i * 4, 16),
        }}>{d}</div>
      ))}
      {Object.entries(SPARK_LABELS).map(([k, label]) => {
        const i = Number(k);
        const cx = SPARK_X[i];
        const p = prog(f, weekCross(cx) + 3, 16);
        if (p <= 0) return null;
        const peak = WK.base - weekValue(cx) * WK.amp;
        const align = i === 0 ? "left" : i === 4 ? "right" : "center";
        const pos: React.CSSProperties =
          align === "left" ? { left: cx - 30 } : align === "right" ? { right: 1080 - cx - 30 } : { left: cx, transform: "translateX(-50%)" };
        return (
          <div key={k} style={{ position: "absolute", inset: 0, opacity: p }}>
            <div style={{ position: "absolute", left: cx - 1, top: peak - 44, width: 2, height: 30 * p, background: "rgba(242,180,92,0.6)" }} />
            <div style={{
              position: "absolute", top: peak - 92 + (1 - p) * 10, whiteSpace: "nowrap", ...pos,
              fontSize: 28, fontWeight: 700, color: INK,
            }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
};

const Statement: React.FC<{ f: number }> = ({ f }) => {
  const at = WEEK_TO + 24;
  if (f < at) return null;
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP }}>
      <Line f={f} at={at} style={{ fontSize: 76, fontWeight: 700, color: INK, letterSpacing: -2, lineHeight: 1.25 }}>
        <span style={{ color: AMBER }}>가슴 뛰는</span> 일을 하자.
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

export const HeartbeatWork: React.FC = () => {
  const f = useCurrentFrame();
  const endFade = interpolate(f, [TOTAL - 18, TOTAL], [1, 0], clamp);
  // a faint warm wash once the heart is racing (ramped, never pulsed)
  const warm = interpolate(f, [WAKE_AT, WAKE_AT + 60, WEEK_FROM, WEEK_FROM + 20, WEEK_TO, WEEK_TO + 40], [0, 1, 1, 0.4, 0.4, 1], clamp);
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
      <div style={{
        position: "absolute", inset: 0, opacity: warm * 0.5,
        background: "radial-gradient(ellipse 70% 40% at 60% 45%, rgba(242,180,92,0.10) 0%, rgba(242,180,92,0) 70%)",
      }} />
      <div style={{ position: "absolute", inset: 0, transform: "translateY(80px)" }}>
        <Overline f={f} from={6} to={372} tag="HEART RATE" text="요즘의 나" color={INK} />
        <Overline f={f} from={382} to={752} tag="THAT MORNING" text="여행 가는 날" color={AMBER} />
        <Overline f={f} from={762} to={WEEK_TO} tag="EVERY WEEK" text="일 속의 한 가지" color={AMBER} />
        <Overline f={f} from={WEEK_TO + 8} to={TOTAL + 10} tag="HEARTBEAT" text="가슴 뛰는 일" color={AMBER} />
        <Monitor f={f} />
        <Schedule f={f} />
        <Bpm f={f} />
        <Clock f={f} />
        <Week f={f} />
        <Captions f={f} caps={CAPTIONS} />
        <Statement f={f} />
      </div>
      <Grain f={f} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.45) 100%)",
      }} />
    </div>
  );
};
