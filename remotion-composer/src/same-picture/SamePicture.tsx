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
const TEXTLINE = "#D5D8DD";
const AMBER = "#DE8A1E";
const AMBER_SOFT = "#F7E3C6";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
const progIO = (f: number, at: number, dur: number) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeInOut });

export const TOTAL = 1560;
const MX = 100;

// ---------- Timeline ----------
// S1 the same words 0–180 · S2 two different pictures 180–480 · S3 redo 480–720
// S4 "빨리", "간단히" too 720–930 · S5 set the criteria: the pictures converge 930–1260
// S6 one picture, right first time 1260–1410 · S7 conclusion 1410–1560
export const PICT_AT = 180;
export const REDO_AT = 480;
export const MORE_AT = 720;
export const CRIT_AT = 930;
export const ONE_AT = 1260;
export const END_AT = 1410;
const CRIT = [
  { k: "분량", v: "1장", at: CRIT_AT + 40 },
  { k: "순서", v: "결론 먼저", at: CRIT_AT + 110 },
  { k: "마감", v: "오늘 오후 3시", at: CRIT_AT + 180 },
];

// ---------- Frames ----------
const FR = { y: 680, w: 410, h: 460 };
const LEFT_CX = 100 + FR.w / 2;
const RIGHT_CX = 1080 - 100 - FR.w / 2;
const PAGE = { w: 210, h: 280 };

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
  { from: PICT_AT + 10, to: REDO_AT - 4, lines: [
    { at: PICT_AT + 12, segs: [{ t: "같은 말을 들었는데," }] },
    { at: PICT_AT + 120, segs: [{ t: "떠올린 그림이 다릅니다.", c: INK }] },
  ] },
  { from: REDO_AT + 6, to: MORE_AT - 4, lines: [
    { at: REDO_AT + 8, segs: [{ t: "누구도 틀리지 않았는데," }] },
    { at: REDO_AT + 80, segs: [{ t: "다시 해야 합니다.", c: INK }] },
  ] },
  { from: MORE_AT + 6, to: CRIT_AT - 4, lines: [
    { at: MORE_AT + 8, segs: [{ t: "‘빨리’, ‘간단히’도" }] },
    { at: MORE_AT + 40, segs: [{ t: "마찬가지입니다.", c: INK }] },
  ] },
  { from: CRIT_AT + 6, to: ONE_AT - 4, lines: [
    { at: CRIT_AT + 8, segs: [{ t: "그럴 땐, " }, { t: "상의 기준", c: AMBER }, { t: "을 정해야 합니다." }] },
    { at: CRIT_AT + 200, segs: [{ t: "분량, 순서, 마감. " }, { t: "숫자로, 예시로.", c: INK }] },
  ] },
  { from: ONE_AT + 6, to: END_AT - 4, lines: [
    { at: ONE_AT + 8, segs: [{ t: "같은 그림을 보면," }] },
    { at: ONE_AT + 40, segs: [{ t: "한 번에 맞습니다.", c: INK }] },
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

// ---------- Documents ----------

// the one-page summary the leader pictured: conclusion first, one table
const SummaryPage: React.FC<{ x: number; y: number; op?: number }> = ({ x, y, op = 1 }) => (
  <g transform={`translate(${x - PAGE.w / 2} ${y - PAGE.h / 2})`} opacity={op}>
    <rect width={PAGE.w} height={PAGE.h} rx={8} fill="#FFFFFF" stroke={HAIR} strokeWidth={2} />
    <rect x={18} y={20} width={PAGE.w - 36} height={46} rx={6} fill={AMBER_SOFT} />
    <text x={32} y={51} fontSize={20} fontWeight={700} fill={AMBER} fontFamily={`'${SANS}', sans-serif`}>결론</text>
    <rect x={84} y={38} width={96} height={10} rx={5} fill={AMBER} opacity={0.55} />
    {[0, 1, 2, 3].map((r) => (
      <line key={`r${r}`} x1={18} y1={92 + r * 34} x2={PAGE.w - 18} y2={92 + r * 34} stroke={TEXTLINE} strokeWidth={2} />
    ))}
    {[0, 1, 2, 3].map((c) => (
      <line key={`c${c}`} x1={18 + c * ((PAGE.w - 36) / 3)} y1={92} x2={18 + c * ((PAGE.w - 36) / 3)} y2={194} stroke={TEXTLINE} strokeWidth={2} />
    ))}
    <rect x={18} y={218} width={150} height={9} rx={4.5} fill={TEXTLINE} />
    <rect x={18} y={240} width={110} height={9} rx={4.5} fill={TEXTLINE} />
  </g>
);

// the thorough pages the employee pictured: dense text, a chart, conclusion at the end
const DensePage: React.FC<{ x: number; y: number; op?: number }> = ({ x, y, op = 1 }) => (
  <g transform={`translate(${x - PAGE.w / 2} ${y - PAGE.h / 2})`} opacity={op}>
    <rect width={PAGE.w} height={PAGE.h} rx={8} fill="#FFFFFF" stroke={HAIR} strokeWidth={2} />
    <rect x={18} y={20} width={120} height={12} rx={6} fill="#B9BEC6" />
    {Array.from({ length: 9 }, (_, i) => (
      <rect key={i} x={18} y={46 + i * 15} width={[170, 160, 174, 150, 168, 172, 140, 166, 120][i]} height={7} rx={3.5} fill={TEXTLINE} />
    ))}
    {[0, 1, 2, 3, 4].map((i) => (
      <rect key={`b${i}`} x={24 + i * 34} y={230 - [30, 48, 22, 40, 56][i]} width={20} height={[30, 48, 22, 40, 56][i]} rx={3} fill="#C7CCD3" />
    ))}
    <line x1={18} y1={232} x2={PAGE.w - 18} y2={232} stroke={TEXTLINE} strokeWidth={2} />
    <rect x={18} y={248} width={90} height={8} rx={4} fill={TEXTLINE} />
  </g>
);

// a stack: n pages fanned behind the top page
const Stack: React.FC<{ x: number; y: number; n: number; top: React.ReactNode; op?: number }> = ({ x, y, n, top, op = 1 }) => {
  const full = Math.floor(n);
  const frac = n - full;
  return (
    <g opacity={op}>
      {Array.from({ length: full + (frac > 0 ? 1 : 0) }, (_, i) => {
        const k = full + (frac > 0 ? 1 : 0) - i; // draw farthest first
        const o = k === full + 1 ? frac : 1;
        return (
          <rect key={i} x={x - PAGE.w / 2 + k * 7} y={y - PAGE.h / 2 - k * 7} width={PAGE.w} height={PAGE.h} rx={8}
            fill="#FFFFFF" stroke={HAIR} strokeWidth={2} opacity={o} />
        );
      })}
      {top}
    </g>
  );
};

const Frame: React.FC<{ cx: number; label: string; color: string; op: number; children: React.ReactNode; badge?: React.ReactNode; label2?: string; mix?: number }> =
  ({ cx, label, color, op, children, badge, label2, mix = 0 }) => (
    <g opacity={op}>
      <rect x={cx - FR.w / 2} y={FR.y} width={FR.w} height={FR.h} rx={22} fill="#FFFFFF" fillOpacity={0.55} stroke={HAIR} strokeWidth={2} />
      <text x={cx - FR.w / 2 + 24} y={FR.y + 42} fontSize={24} fontWeight={700} fill={color} opacity={1 - mix} fontFamily={`'${SANS}', sans-serif`}>{label}</text>
      {label2 && mix > 0 && (
        <text x={cx - FR.w / 2 + 24} y={FR.y + 42} fontSize={24} fontWeight={700} fill={AMBER} opacity={mix} fontFamily={`'${SANS}', sans-serif`}>{label2}</text>
      )}
      {children}
      {badge}
    </g>
  );

const Pill: React.FC<{ x: number; y: number; text: string; color: string; bg: string; op: number; size?: number }> =
  ({ x, y, text, color, bg, op, size = 22 }) =>
    op > 0 ? (
      <g opacity={op}>
        <rect x={x - (text.length * size * 0.62 + 30) / 2} y={y - size} width={text.length * size * 0.62 + 30} height={size * 2} rx={size} fill={bg} />
        <text x={x} y={y + size * 0.36} fontSize={size} fontWeight={700} fill={color} textAnchor="middle" fontFamily={`'${SANS}', sans-serif`}>{text}</text>
      </g>
    ) : null;

const Pictures: React.FC<{ f: number }> = ({ f }) => {
  const vis = prog(f, PICT_AT, 20) * (1 - progIO(f, MORE_AT - 10, 24)) + progIO(f, CRIT_AT, 24);
  if (vis <= 0) return null;
  const leftIn = prog(f, PICT_AT + 20, 24);
  const rightIn = prog(f, PICT_AT + 60, 24);
  const pages = interpolate(f, [PICT_AT + 70, PICT_AT + 150], [0, 9], clamp); // the stack builds up
  // criteria pull the employee's picture into the leader's
  const less = progIO(f, CRIT[0].at + 10, 50);
  const order = progIO(f, CRIT[1].at + 10, 50);
  const due = prog(f, CRIT[2].at + 10, 24);
  const merge = progIO(f, ONE_AT + 10, 50);
  const check = prog(f, ONE_AT + 60, 20);
  const n = f < CRIT_AT ? pages : lerp(9, 0, less);
  const redo = prog(f, REDO_AT + 70, 18) * (1 - prog(f, MORE_AT - 20, 16));
  const neq = prog(f, REDO_AT + 20, 20) * (1 - prog(f, MORE_AT - 20, 16));
  const pageY = FR.y + FR.h / 2 + 28;
  const lx = lerp(LEFT_CX, 540, merge);
  const rx = lerp(RIGHT_CX, 540, merge);
  const frameFade = 1 - merge;
  return (
    <g opacity={Math.min(1, vis)}>
      {/* frames slide together into one */}
      <Frame cx={lx} label="리더의 머릿속" color={AMBER} op={leftIn} label2="같은 그림" mix={prog(f, ONE_AT + 50, 20)}>
        <SummaryPage x={lx} y={pageY} />
      </Frame>
      <Frame cx={rx} label="직원의 머릿속" color={SUB} op={rightIn * frameFade + 0.0}
        badge={
          <>
            {f < CRIT_AT && <Pill x={rx + 130} y={FR.y + 34} text={`${Math.max(1, Math.round(pages) + 1)}장`} color={BODY} bg="#EEF0F3" op={prog(f, PICT_AT + 80, 16)} />}
            <Pill x={rx + 120} y={FR.y + FR.h - 40} text="↺ 다시" color="#B4563F" bg="#F6E1DB" op={redo} />
          </>
        }>
        <Stack x={rx} y={pageY} n={n} top={
          <>
            <DensePage x={rx} y={pageY} op={1 - order} />
            <SummaryPage x={rx} y={pageY} op={order} />
          </>
        } />
      </Frame>
      {/* deadline tag lands on both */}
      {[lx, rx].map((x, i) => (
        <Pill key={i} x={x} y={FR.y + FR.h - 24} text="오늘 15:00" color={AMBER} bg={AMBER_SOFT} op={due * (i === 1 ? frameFade : 1)} size={20} />
      ))}
      {neq > 0 && (
        <text x={540} y={pageY + 18} fontSize={64} fontWeight={700} fill="#B4563F" opacity={neq} textAnchor="middle"
          fontFamily={`'${SANS}', sans-serif`}>≠</text>
      )}
      {check > 0 && (
        <g opacity={check} transform={`translate(${540 + PAGE.w / 2 + 30} ${pageY - PAGE.h / 2 - 10}) scale(${0.7 + 0.3 * check})`}>
          <circle r={36} fill={AMBER} />
          <path d="M -15 1 L -4 12 L 17 -11" fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
};

// S1: the leader's words; they shrink to sit above the pictures until S4
const Quote: React.FC<{ f: number }> = ({ f }) => {
  const a = prog(f, 14, 24);
  const up = progIO(f, PICT_AT - 10, 40);
  const out = 1 - prog(f, MORE_AT - 16, 16);
  if (a * out <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: 540, top: lerp(860, 520, up), transform: `translate(-50%, -50%) scale(${lerp(1.25, 0.8, up)})`,
      opacity: a * out, textAlign: "center", whiteSpace: "nowrap",
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 5, color: AMBER, marginBottom: 14 }}>리더의 말</div>
      <div style={{ fontSize: 52, fontWeight: 700, color: INK, letterSpacing: -1.5 }}>“보고서, 깔끔하게 정리해 줘요.”</div>
    </div>
  );
};

// S4: other words, other pictures
const MORE = [
  { w: "빨리", l: "오늘 오후 3시", r: "이번 주 안" },
  { w: "간단히", l: "세 줄", r: "세 장" },
];
const More: React.FC<{ f: number }> = ({ f }) => {
  if (f < MORE_AT || f >= CRIT_AT) return null;
  const out = 1 - prog(f, CRIT_AT - 18, 16);
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: 560, opacity: out }}>
      {MORE.map((m, i) => {
        const at = MORE_AT + 16 + i * 60;
        const a = prog(f, at, 20);
        const b = prog(f, at + 20, 20);
        return (
          <div key={i} style={{ marginBottom: 70, opacity: a, transform: `translateY(${(1 - a) * 20}px)` }}>
            <div style={{ fontSize: 60, fontWeight: 700, color: INK, letterSpacing: -1.5, marginBottom: 22 }}>“{m.w}”</div>
            <div style={{ display: "flex", gap: 20, opacity: b }}>
              <div style={{ flex: 1, padding: "18px 24px", borderRadius: 18, background: AMBER_SOFT }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: AMBER }}>리더</div>
                <div style={{ fontSize: 38, fontWeight: 700, color: INK, marginTop: 6 }}>{m.l}</div>
              </div>
              <div style={{ flex: 1, padding: "18px 24px", borderRadius: 18, background: "#EEF0F3" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: SUB }}>직원</div>
                <div style={{ fontSize: 38, fontWeight: 700, color: INK, marginTop: 6 }}>{m.r}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// S5: the criteria card above the pictures
const Criteria: React.FC<{ f: number }> = ({ f }) => {
  const a = prog(f, CRIT_AT + 10, 24) * (1 - prog(f, END_AT - 16, 16));
  if (a <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: MX, right: MX, top: 430, opacity: a, transform: `translateY(${(1 - a) * 20}px)`,
      padding: "22px 28px", borderRadius: 22, background: "#FFFFFF", border: `2px solid ${AMBER}`,
      boxShadow: "0 10px 30px rgba(222,138,30,0.10)",
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 5, color: AMBER, marginBottom: 14 }}>상의 기준</div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {CRIT.map((c, i) => {
          const p = prog(f, c.at, 20);
          return (
            <div key={i} style={{ opacity: 0.25 + 0.75 * p }}>
              <div style={{ fontSize: 22, color: SUB, fontWeight: 700 }}>{c.k}</div>
              <div style={{ fontSize: 34, fontWeight: 700, color: p > 0.5 ? INK : TEXTLINE, marginTop: 4, whiteSpace: "nowrap" }}>{p > 0.05 ? c.v : "—"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Ending: React.FC<{ f: number }> = ({ f }) => {
  if (f < END_AT) return null;
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP - 10 }}>
      <Line f={f} at={END_AT + 14} style={{ fontSize: 46, color: BODY, lineHeight: 1.45 }}>같은 생각을 하려면,</Line>
      <div style={{ height: 6 }} />
      <Line f={f} at={END_AT + 50} style={{ fontSize: 60, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.3 }}>
        <span style={{ color: AMBER }}>상의 기준</span>부터 정해야 합니다.
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

export const SamePicture: React.FC = () => {
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
        <Overline f={f} from={6} to={MORE_AT - 4} tag="SAME WORDS" text="같은 말, 다른 그림" color={INK} />
        <Overline f={f} from={MORE_AT + 4} to={CRIT_AT - 4} tag="MORE WORDS" text="다른 말도" color={INK} />
        <Overline f={f} from={CRIT_AT + 4} to={END_AT - 4} tag="THE CRITERIA" text="상의 기준" color={AMBER} />
        <Overline f={f} from={END_AT + 4} to={TOTAL + 10} tag="SAME PICTURE" text="같은 생각" color={AMBER} />
        <Quote f={f} />
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <Pictures f={f} />
        </svg>
        <More f={f} />
        <Criteria f={f} />
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
