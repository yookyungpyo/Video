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
const LINE_RGB = [150, 158, 171];
const AMBER = "#F2B45C";
const AMBER_RGB = [242, 180, 92];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
const progIO = (f: number, at: number, dur: number) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeInOut });
const mix = (e: number) => `rgb(${LINE_RGB.map((c, i) => Math.round(c + (AMBER_RGB[i] - c) * e)).join(",")})`;

export const TOTAL = 1350;
const MX = 100;

// ---------- Timeline ----------
// S1 hook 0–150 · S2 the case 150–420 · S3 diagnosis 420–570
// S4 three rings 570–990 · S5 result 990–1150 · S6 closing 1150–1350
export const STACK = [200, 290]; // pages pile up 1 → 30
export const GHOST_AT = 312; // what was actually needed
const RINGS_AT = 440;
export const TURNS = [585, 725, 865]; // WHY, WHEN, WHO
const TURN_DUR = 40;
const RESULT_AT = 1000;
const CLOSE_AT = 1165;

// ---------- Stage geometry ----------
const CX = 540;
const CY = 820;
const RINGS = [
  { r: 230, en: "WHY", ko: "목적" },
  { r: 275, en: "WHEN", ko: "기간" },
  { r: 320, en: "WHO", ko: "관련자" },
];
const PAGE_W = 200;
const PAGE_H = 260;
const PAGE_CY = CY - 34; // page sits a little above the ring centre so its label clears the inner ring

// page count: piles up to 30, then each ring turn trims it (30 → 12 → 5 → 1)
export const pageCountF = (f: number) => {
  if (f < TURNS[0] + 6) {
    if (f < STACK[0]) return 1;
    const t = clamp01((f - STACK[0]) / (STACK[1] - STACK[0]));
    return 1 + 29 * t * t;
  }
  const trim = (i: number, from: number, to: number) =>
    interpolate(f, [TURNS[i] + 6, TURNS[i] + TURN_DUR + 6], [from, to], { ...clamp, easing: easeInOut });
  if (f < TURNS[1] + 6) return trim(0, 30, 12);
  if (f < TURNS[2] + 6) return trim(1, 12, 5);
  return trim(2, 5, 1);
};
const blurAt = (f: number) =>
  interpolate(f, [RINGS_AT, RINGS_AT + 40, TURNS[0] + 6, TURNS[0] + 46, TURNS[1] + 6, TURNS[1] + 46, TURNS[2] + 6, TURNS[2] + 46],
    [0, 6, 6, 4, 4, 2, 2, 0], clamp);
const turnP = (f: number, i: number) => progIO(f, TURNS[i], TURN_DUR);

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
const CAP_TOP = 1200;

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
              <span key={j} style={{ color: s.c ?? undefined, fontWeight: s.w ?? (s.c ? 700 : undefined) }}>{s.t}</span>
            ))}
          </Line>
        ) : null,
      )}
    </div>
  );
};

const CAPTIONS: Cap[] = [
  { from: 20, to: 150, lines: [
    { at: 20, segs: [{ t: "열심히 했는데," }] },
    { at: 36, segs: [{ t: "'이게 아닌데'", c: INK }, { t: "라는 말을 들어본 적 있나요?" }] },
  ] },
  { from: 168, to: 292, lines: [
    { at: 168, segs: [{ t: "'실적 좀 정리해 줘'", c: INK }, { t: " 한마디에," }] },
    { at: 196, segs: [{ t: "3일 동안 " }, { t: "30장", c: INK }, { t: "을 만들었다" }] },
  ] },
  { from: 300, to: 420, lines: [
    { at: 300, segs: [{ t: "그런데 필요한 건," }] },
    { at: 326, segs: [{ t: "내일 아침 회의에서 볼 " }, { t: "한 장", c: AMBER }, { t: "이었다" }] },
  ] },
  { from: 432, to: 570, lines: [
    { at: 432, segs: [{ t: "실력의 문제가 아니라," }] },
    { at: 458, segs: [{ t: "세 가지를 묻지 않았을 뿐", c: INK }, { t: "이다" }] },
  ] },
  { from: 578, to: 712, lines: [
    { at: 578, segs: [{ t: "목적", c: AMBER }, { t: ": 왜 필요한가?" }] },
    { at: 606, segs: [{ t: "→ 결정에 필요한 숫자만 남긴다", c: INK, w: 400 }] },
  ] },
  { from: 718, to: 852, lines: [
    { at: 718, segs: [{ t: "기간", c: AMBER }, { t: ": 언제까지 필요한가?" }] },
    { at: 746, segs: [{ t: "→ 시간에 맞게 범위를 정한다", c: INK, w: 400 }] },
  ] },
  { from: 858, to: 992, lines: [
    { at: 858, segs: [{ t: "관련자", c: AMBER }, { t: ": 누가 보고, 누가 쓰는가?" }] },
    { at: 886, segs: [{ t: "→ 읽는 사람에 맞춰 만든다", c: INK, w: 400 }] },
  ] },
  { from: 1000, to: 1148, lines: [
    { at: 1000, segs: [{ t: "같은 시간을 써도," }] },
    { at: 1026, segs: [{ t: "방향이 맞아야", c: AMBER }, { t: " 일이 된다" }] },
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

const RequestCard: React.FC<{ f: number }> = ({ f }) => {
  const op = interpolate(f, [150, 168, 425, 440], [0, 1, 1, 0], clamp);
  if (op <= 0) return null;
  const p = prog(f, 152, 22);
  return (
    <div style={{ position: "absolute", left: MX, top: 452, opacity: op, transform: `translateY(${(1 - p) * 20}px)` }}>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 6, color: SUB }}>REQUEST</div>
      <div style={{ fontSize: 46, fontWeight: 700, color: INK, letterSpacing: -1, marginTop: 10 }}>"실적 좀 정리해 줘"</div>
    </div>
  );
};

// One page of the report: hairline "text" lines; the key number appears once the purpose is clear
const PageFace: React.FC<{ f: number; top: boolean }> = ({ f, top }) => {
  const why = top ? turnP(f, 0) : 0;
  const who = top ? turnP(f, 2) : 0;
  const dense = Math.round(8 - 5 * who);
  return (
    <div style={{ position: "absolute", inset: 0, padding: "26px 24px" }}>
      <div style={{ width: 96, height: 8, borderRadius: 4, background: "rgba(242,244,247,0.55)" }} />
      <div style={{ height: 44 * why, overflow: "hidden", marginTop: 14 * why }}>
        <div style={{ fontSize: 40, fontWeight: 700, color: AMBER, lineHeight: 1, letterSpacing: -1, opacity: why }}>+12%</div>
      </div>
      <div style={{ marginTop: 16 }}>
        {Array.from({ length: dense }, (_, i) => (
          <div key={i} style={{ width: `${[100, 88, 94, 70, 96, 82, 90, 60][i]}%`, height: 5, borderRadius: 3, marginTop: 11, background: "rgba(242,244,247,0.18)" }} />
        ))}
      </div>
    </div>
  );
};

const Stack: React.FC<{ f: number }> = ({ f }) => {
  const op = prog(f, 4, 20);
  const n = pageCountF(f);
  const cx = interpolate(f, [GHOST_AT - 10, GHOST_AT + 20, RINGS_AT - 10, RINGS_AT + 20], [CX, 400, 400, CX], { ...clamp, easing: easeInOut });
  const blur = blurAt(f);
  const lit = clamp01(turnP(f, 2) * 0.6 + prog(f, RESULT_AT, 30) * 0.4);
  const layers = 9;
  return (
    <div style={{ position: "absolute", left: cx - PAGE_W / 2, top: PAGE_CY - PAGE_H / 2, width: PAGE_W, height: PAGE_H, opacity: op }}>
      <div style={{ position: "absolute", inset: 0, filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined, opacity: 1 - blur * 0.05 }}>
        {Array.from({ length: layers }, (_, k) => {
          const i = layers - k; // draw back to front
          const vis = clamp01(n - 1 - (i - 1) * (29 / layers));
          if (vis <= 0) return null;
          return (
            <div key={i} style={{
              position: "absolute", left: i * 5, top: -i * 5, width: PAGE_W, height: PAGE_H, opacity: vis * (1 - i * 0.07),
              border: "1.5px solid rgba(201,206,214,0.32)", borderRadius: 6, background: "#141922",
            }} />
          );
        })}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 6, background: "#161C26",
          border: `1.5px solid ${mix(lit)}`, boxShadow: lit > 0 ? `0 0 ${40 * lit}px rgba(242,180,92,${0.25 * lit})` : undefined,
        }}>
          <PageFace f={f} top />
        </div>
      </div>
    </div>
  );
};

const Counter: React.FC<{ f: number }> = ({ f }) => {
  const op = prog(f, STACK[0], 14) * (1 - prog(f, RESULT_AT - 14, 12));
  const cx = interpolate(f, [GHOST_AT - 10, GHOST_AT + 20, RINGS_AT - 10, RINGS_AT + 20], [CX, 400, 400, CX], { ...clamp, easing: easeInOut });
  const n = Math.round(pageCountF(f));
  const days = f < TURNS[0] ? (n <= 10 ? 1 : n <= 20 ? 2 : 3) : 0;
  const res = prog(f, RESULT_AT, 20);
  return (
    <>
      {op > 0 && (
        <div style={{
          position: "absolute", left: cx - 150, width: 300, top: PAGE_CY + PAGE_H / 2 + 22, textAlign: "center", opacity: op,
          fontSize: 30, fontWeight: 700, color: f < TURNS[0] ? INK : mix(turnP(f, 2)), fontVariantNumeric: "tabular-nums",
        }}>
          {n}장{days ? <span style={{ color: SUB, fontWeight: 400 }}> · {days}일</span> : null}
        </div>
      )}
      {res > 0 && (
        <div style={{ position: "absolute", left: CX - 200, width: 400, top: PAGE_CY + PAGE_H / 2 + 16, textAlign: "center", opacity: res }}>
          <div style={{ fontSize: 24, color: SUB, textDecoration: "line-through", textDecorationColor: "rgba(138,147,163,0.8)" }}>30장 · 3일</div>
          <div style={{ fontSize: 34, fontWeight: 700, color: AMBER, marginTop: 4 }}>1장 · 반나절</div>
        </div>
      )}
    </>
  );
};

const Ghost: React.FC<{ f: number }> = ({ f }) => {
  const op = prog(f, GHOST_AT + 8, 20) * (1 - prog(f, RINGS_AT - 14, 14));
  if (op <= 0) return null;
  const x = 700;
  return (
    <div style={{ position: "absolute", left: x, top: PAGE_CY - PAGE_H / 2, opacity: op }}>
      <svg width={PAGE_W} height={PAGE_H} style={{ position: "absolute", left: 0, top: 0 }}>
        <rect x={1} y={1} width={PAGE_W - 2} height={PAGE_H - 2} rx={6} fill="rgba(242,180,92,0.05)"
          stroke={AMBER} strokeWidth={2} strokeDasharray="8 7" />
      </svg>
      <div style={{ position: "absolute", left: 0, width: PAGE_W, top: PAGE_H + 22, textAlign: "center", whiteSpace: "nowrap" }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 3, color: SUB }}>필요했던 것</div>
        <div style={{ fontSize: 30, fontWeight: 700, color: AMBER, marginTop: 4 }}>1장 · 내일 09:00</div>
      </div>
    </div>
  );
};

const Rings: React.FC<{ f: number }> = ({ f }) => {
  if (f < RINGS_AT) return null;
  const settle = interpolate(f, [CLOSE_AT, CLOSE_AT + 60], [0, 1], clamp);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <filter id="ring-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      {RINGS.map((rg, i) => {
        const draw = progIO(f, RINGS_AT + i * 12, 40);
        const tp = turnP(f, i);
        const circ = 2 * Math.PI * rg.r;
        const col = mix(tp);
        const rot = -90 + 40 * tp + 4 * settle * Math.sin(f * 0.02 + i);
        const ticks = 72;
        return (
          <g key={i}>
            {tp > 0 && (
              <circle cx={CX} cy={CY} r={rg.r} fill="none" stroke={AMBER} strokeWidth={6} opacity={0.35 * tp} filter="url(#ring-glow)" />
            )}
            <circle cx={CX} cy={CY} r={rg.r} fill="none" stroke={col} strokeOpacity={0.45 + 0.45 * tp} strokeWidth={2}
              strokeDasharray={`${circ * draw} ${circ}`} transform={`rotate(-90 ${CX} ${CY})`} />
            <g transform={`rotate(${rot} ${CX} ${CY})`} opacity={prog(f, RINGS_AT + 20 + i * 12, 24)}>
              {Array.from({ length: ticks }, (_, k) => {
                const a = (k / ticks) * Math.PI * 2;
                const long = k % 6 === 0;
                const r0 = rg.r - (long ? 12 : 7);
                return (
                  <line key={k} x1={CX + Math.cos(a) * r0} y1={CY + Math.sin(a) * r0} x2={CX + Math.cos(a) * rg.r} y2={CY + Math.sin(a) * rg.r}
                    stroke={col} strokeOpacity={long ? 0.55 + 0.4 * tp : 0.25 + 0.3 * tp} strokeWidth={long ? 2 : 1.4} />
                );
              })}
            </g>
          </g>
        );
      })}
    </svg>
  );
};

const RingLabels: React.FC<{ f: number }> = ({ f }) => (
  <>
    {RINGS.map((rg, i) => {
      const op = prog(f, RINGS_AT + 30 + i * 12, 20);
      if (op <= 0) return null;
      const tp = turnP(f, i);
      return (
        <div key={i} style={{
          position: "absolute", left: CX, top: CY - rg.r, transform: "translate(-50%, -50%)", opacity: op,
          display: "flex", alignItems: "center", gap: 10, padding: "5px 16px", borderRadius: 20,
          background: BG, border: `1.5px solid ${mix(tp)}`, whiteSpace: "nowrap",
        }}>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: 4, color: mix(tp) }}>{rg.en}</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: tp > 0.5 ? INK : BODY }}>{rg.ko}</span>
        </div>
      );
    })}
  </>
);

const Closing: React.FC<{ f: number }> = ({ f }) => {
  if (f < CLOSE_AT) return null;
  const big: React.CSSProperties = { fontSize: 66, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.28 };
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP - 6 }}>
      <Line f={f} at={CLOSE_AT} style={big}>일하기 전에 묻자.</Line>
      <Line f={f} at={CLOSE_AT + 30} style={big}>
        <span style={{ color: AMBER }}>왜</span>, <span style={{ color: AMBER }}>언제까지</span>, <span style={{ color: AMBER }}>누구를 위해</span>.
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

export const WorkFocus: React.FC = () => {
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
      <div style={{ position: "absolute", inset: 0, transform: "translateY(40px)" }}>
        <Overline f={f} from={6} to={420} tag="CASE" text="흔한 장면" color={INK} />
        <Overline f={f} from={428} to={992} tag="FOCUS" text="일의 초점 세 가지" color={AMBER} />
        <Overline f={f} from={998} to={1150} tag="RESULT" text="같은 시간, 다른 결과" color={AMBER} />
        <Overline f={f} from={1158} to={TOTAL + 10} tag="BEFORE YOU START" text="일하기 전에" color={AMBER} />
        <RequestCard f={f} />
        <Rings f={f} />
        <Stack f={f} />
        <Counter f={f} />
        <Ghost f={f} />
        <RingLabels f={f} />
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
