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
const DOWN = "#9098A4";
const AMBER = "#DE8A1E";
const AMBER_SOFT = "#F7E3C6";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
const progIO = (f: number, at: number, dur: number) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeInOut });

export const TOTAL = 1110;
const MX = 100;

// ---------- Narration (frames where each sentence is spoken; from layout_vo.py) ----------
// 0 같은 AI가… K자로 갈립니다 · 1 갈림길은… 첫 대응입니다 · 2 A의 첫마디 + quote
// 3 B의 첫마디 + quote · 4 처음엔 작은 차이… 벌어집니다 · 5 차이를 만든 건… · 6 AI는 모두에게… 첫 대응입니다
export const VO = [19, 161, 304, 453, 595, 760, 894];
const A_QUOTE = 347;
const B_QUOTE = 494;
const WIDEN = 662; // "시간이 지날수록, 벌어집니다"
const LAST = 964; // "갈리는 건, 첫 대응입니다"

// ---------- Chart ----------
const P = { x: 400, y: 880 }; // the fork: first response
const X0 = 130;
const X1 = 960;
const BASE_Y = 1130;
const u = (x: number) => clamp01((x - P.x) / (X1 - P.x));
const upY = (x: number) => P.y - 380 * Math.pow(u(x), 1.7);
const downY = (x: number) => P.y + 200 * Math.pow(u(x), 1.7);
const preY = (x: number) => lerp(905, P.y, (x - X0) / (P.x - X0));
const STUB = P.x + 90;
const TICKS = [
  { x: STUB, label: "한 달", at: VO[4] + 10 },
  { x: P.x + 330, label: "6개월", at: VO[4] + 50 },
  { x: X1, label: "1년", at: WIDEN + 20 },
];

const pathTo = (fy: (x: number) => number, xa: number, xb: number) => {
  if (xb <= xa + 0.5) return "";
  const n = 40;
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = lerp(xa, xb, i / n);
    return `${i ? "L" : "M"} ${x.toFixed(1)} ${fy(x).toFixed(1)}`;
  }).join(" ");
};

// how far each branch is drawn (x of its tip)
const branchEnd = (f: number, which: "up" | "down") => {
  const preview = progIO(f, 62, 56) * (1 - progIO(f, VO[1] + 4, 36)); // S1 shows the whole K, S2 rewinds it
  const stubAt = which === "down" ? VO[2] + 6 : VO[3] + 6;
  const stub = progIO(f, stubAt, 30);
  const grow = progIO(f, VO[4] + 6, 120);
  const story = lerp(P.x, STUB, stub) + (X1 - STUB) * grow;
  return Math.max(lerp(P.x, X1, preview), f >= stubAt ? story : P.x);
};

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
    const p = prog(f, at, 16);
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
const CAP_TOP = 1230;

const Captions: React.FC<{ f: number; caps: Cap[] }> = ({ f, caps }) => {
  const c = caps.find((x) => f >= x.from && f < x.to);
  if (!c) return null;
  const out = clamp01((c.to - f) / 8);
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
  { from: VO[0] - 4, to: VO[1] - 6, lines: [
    { at: VO[0] - 4, segs: [{ t: "같은 AI가 주어졌는데," }] },
    { at: VO[0] + 44, segs: [{ t: "결과는 " }, { t: "K자로 갈립니다.", c: INK }] },
  ] },
  { from: VO[1] - 4, to: VO[2] - 6, lines: [
    { at: VO[1] - 4, segs: [{ t: "갈림길은, AI를 처음 만났을 때의" }] },
    { at: VO[1] + 56, segs: [{ t: "첫 대응", c: AMBER }, { t: "입니다." }] },
  ] },
  { from: VO[2] - 4, to: VO[3] - 6, lines: [
    { at: VO[2] - 4, segs: [{ t: "A의 첫마디." }] },
    { at: A_QUOTE - 2, segs: [{ t: "“뭐야, 이거 안 되네. 못 쓰겠네.”", c: INK }] },
  ] },
  { from: VO[3] - 4, to: VO[4] - 6, lines: [
    { at: VO[3] - 4, segs: [{ t: "B의 첫마디." }] },
    { at: B_QUOTE - 2, segs: [{ t: "“안 되네? 어떻게 물어보면 되지?”", c: AMBER }] },
  ] },
  { from: VO[4] - 4, to: VO[5] - 6, lines: [
    { at: VO[4] - 4, segs: [{ t: "처음엔 작은 차이였습니다." }] },
    { at: WIDEN - 2, segs: [{ t: "시간이 지날수록, " }, { t: "벌어집니다.", c: INK }] },
  ] },
  { from: VO[5] - 4, to: VO[6] - 6, lines: [
    { at: VO[5] - 4, segs: [{ t: "차이를 만든 건 실력이 아니라," }] },
    { at: VO[5] + 52, segs: [{ t: "첫 대응", c: AMBER }, { t: "이었습니다.", c: INK }] },
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

const Chart: React.FC<{ f: number }> = ({ f }) => {
  const axis = prog(f, 6, 24);
  const pre = progIO(f, 20, 44);
  const preX = lerp(X0, P.x, pre);
  const upX = branchEnd(f, "up");
  const downX = branchEnd(f, "down");
  const fork = prog(f, VO[1] + 30, 20);
  const focusAgain = prog(f, VO[5] + 4, 20);
  const pulse = 0.5 - 0.5 * Math.cos((f - VO[1]) / 9);
  const glow = prog(f, LAST, 40);
  const tipLabels = prog(f, VO[4] + 20, 20);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="ks-glow">
          <stop offset="0%" stopColor={AMBER} stopOpacity={0.45} />
          <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* axis */}
      <g opacity={axis}>
        <line x1={MX} y1={BASE_Y} x2={1080 - MX} y2={BASE_Y} stroke={HAIR} strokeWidth={2} />
        <line x1={P.x} y1={480} x2={P.x} y2={BASE_Y} stroke={HAIR} strokeWidth={2} strokeDasharray="6 10" />
        <text x={P.x} y={BASE_Y + 44} fontSize={24} fontWeight={700} fill={SUB} textAnchor="middle" fontFamily={`'${SANS}', sans-serif`}>AI 등장</text>
      </g>
      {/* time ticks and the gap between the branches */}
      {TICKS.map((t, i) => {
        const a = prog(f, t.at, 18);
        if (a <= 0) return null;
        const hi = i === 2 ? focusAgain : 0;
        return (
          <g key={i} opacity={a}>
            <line x1={t.x} y1={BASE_Y - 10} x2={t.x} y2={BASE_Y + 10} stroke={SUB} strokeWidth={2} />
            <text x={t.x} y={BASE_Y + 44} fontSize={24} fontWeight={700} fill={i === 2 ? INK : SUB} textAnchor={i === 2 ? "end" : "middle"}
              fontFamily={`'${SANS}', sans-serif`}>{t.label}</text>
            <line x1={t.x - (i === 2 ? 28 : 0)} y1={upY(t.x) + 14} x2={t.x - (i === 2 ? 28 : 0)} y2={downY(t.x) - 14}
              stroke={hi > 0 ? AMBER : SUB} strokeWidth={3} strokeDasharray="3 7" strokeLinecap="round" />
            {[upY(t.x) + 14, downY(t.x) - 14].map((y, k) => (
              <line key={k} x1={t.x - (i === 2 ? 40 : 12)} y1={y} x2={t.x - (i === 2 ? 16 : -12)} y2={y} stroke={hi > 0 ? AMBER : SUB} strokeWidth={3} strokeLinecap="round" />
            ))}
          </g>
        );
      })}
      {/* the line before AI, then the two branches */}
      <path d={pathTo(preY, X0, preX)} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <path d={pathTo(downY, P.x, downX)} fill="none" stroke={DOWN} strokeWidth={6} strokeLinecap="round" />
      <path d={pathTo(upY, P.x, upX)} fill="none" stroke={AMBER} strokeWidth={6} strokeLinecap="round" />
      {glow > 0 && <circle cx={X1} cy={upY(X1)} r={60 + 80 * glow} fill="url(#ks-glow)" opacity={glow} />}
      {upX > P.x + 4 && <circle cx={upX} cy={upY(upX)} r={9} fill={AMBER} />}
      {downX > P.x + 4 && <circle cx={downX} cy={downY(downX)} r={9} fill={DOWN} />}
      {/* the fork */}
      {pre > 0.98 && (
        <g>
          {(fork > 0 || focusAgain > 0) && (
            <circle cx={P.x} cy={P.y} r={22 + 10 * pulse} fill="none" stroke={AMBER} strokeWidth={3}
              opacity={Math.max(fork * (1 - prog(f, VO[2] - 10, 16)), focusAgain) * (0.5 + 0.5 * pulse)} />
          )}
          <circle cx={P.x} cy={P.y} r={11} fill={INK} />
        </g>
      )}
      {/* tip names */}
      {tipLabels > 0 && (
        <g opacity={tipLabels} fontFamily={`'${SANS}', sans-serif`} fontWeight={700} fontSize={30}>
          <text x={Math.min(upX + 18, X1 + 18)} y={upY(upX) + 11} fill={AMBER}>B</text>
          <text x={Math.min(downX + 18, X1 + 18)} y={downY(downX) + 11} fill={DOWN}>A</text>
        </g>
      )}
    </svg>
  );
};

// pills on the chart: the fork's name and each person's first words
const Pill: React.FC<{ x: number; y: number; op: number; color: string; bg: string; children: React.ReactNode; size?: number; anchor?: "left" | "center" }> =
  ({ x, y, op, color, bg, children, size = 28, anchor = "left" }) =>
    op > 0 ? (
      <div style={{
        position: "absolute", left: x, top: y, transform: `translate(${anchor === "center" ? "-50%" : "0"}, -50%) scale(${0.94 + 0.06 * op})`,
        transformOrigin: "left center", opacity: op, padding: "10px 22px", borderRadius: 26, background: bg,
        fontSize: size, fontWeight: 700, color, whiteSpace: "nowrap", boxShadow: "0 6px 18px rgba(40,40,40,0.06)",
      }}>{children}</div>
    ) : null;

const Labels: React.FC<{ f: number }> = ({ f }) => {
  const forkTag = prog(f, VO[1] + 56, 16) * (1 - prog(f, VO[2] - 10, 14)) + prog(f, VO[5] + 52, 16) * (1 - prog(f, LAST - 10, 14));
  const aTag = prog(f, VO[2] + 2, 14) * (1 - prog(f, VO[4] - 10, 14));
  const aQuote = prog(f, A_QUOTE, 14) * (1 - prog(f, VO[4] - 10, 14));
  const bTag = prog(f, VO[3] + 2, 14) * (1 - prog(f, VO[4] - 10, 14));
  const bQuote = prog(f, B_QUOTE, 14) * (1 - prog(f, VO[4] - 10, 14));
  return (
    <>
      <Pill x={P.x} y={P.y + 70} op={clamp01(forkTag)} color={AMBER} bg={AMBER_SOFT} anchor="center">첫 대응</Pill>
      <Pill x={STUB + 30} y={downY(STUB) + 72} op={aTag} color={BODY} bg="#EEF0F3" size={26}>A</Pill>
      <Pill x={STUB + 30} y={downY(STUB) + 140} op={aQuote} color={BODY} bg="#FFFFFF" size={30}>“뭐야, 이거 안 되네. 못 쓰겠네.”</Pill>
      <Pill x={STUB + 30} y={upY(STUB) - 150} op={bTag} color={AMBER} bg={AMBER_SOFT} size={26}>B</Pill>
      <Pill x={STUB + 30} y={upY(STUB) - 82} op={bQuote} color={INK} bg="#FFFFFF" size={30}>“안 되네? 어떻게 물어보면 되지?”</Pill>
    </>
  );
};

const Ending: React.FC<{ f: number }> = ({ f }) => {
  if (f < VO[6] - 4) return null;
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP - 10 }}>
      <Line f={f} at={VO[6] - 4} style={{ fontSize: 46, color: BODY, lineHeight: 1.45 }}>AI는 모두에게 같습니다.</Line>
      <div style={{ height: 6 }} />
      <Line f={f} at={LAST - 2} style={{ fontSize: 62, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.3 }}>
        갈리는 건, <span style={{ color: AMBER }}>첫 대응</span>입니다.
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

export const KSplit: React.FC = () => {
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
        <Overline f={f} from={6} to={VO[2] - 6} tag="K-SHAPED" text="AI 시대의 K자 분화" color={INK} />
        <Overline f={f} from={VO[2] - 2} to={VO[4] - 6} tag="FIRST RESPONSE" text="첫 대응" color={AMBER} />
        <Overline f={f} from={VO[4] - 2} to={VO[5] - 6} tag="OVER TIME" text="시간이 지나면" color={INK} />
        <Overline f={f} from={VO[5] - 2} to={VO[6] - 6} tag="WHY" text="갈린 이유" color={INK} />
        <Overline f={f} from={VO[6] - 2} to={TOTAL + 10} tag="SAME AI" text="같은 AI" color={AMBER} />
        <Chart f={f} />
        <Labels f={f} />
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
