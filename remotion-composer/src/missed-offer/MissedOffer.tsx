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
const GRAYLINE = "#7C8594";
const AMBER = "#F2B45C";
const FAIL = "#F07A7A";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });

export const TOTAL = 1080;
const MX = 100;

// ---------- Timeline ----------
// S1 2000 0–150 · S2 offer & rejection 150–330 · S3 ten years 330–630
// S4 pivot 630–790 · S5 the line 790–940 · S6 closing 940–1080
const STAMP_AT = 232;
const BANKRUPT_AT = 455;
const SLAM1 = 822;
const SLAM2 = 848;

// Chart: x maps 2000→140, 2010→540, now→940
const CH = { x0: 140, x1: 940, y0: 600, y1: 1080 };
const yearX = (y: number) => (y <= 2010 ? CH.x0 + ((y - 2000) / 10) * 400 : 540 + ((y - 2010) / 15) * 400);
const valY = (v: number) => CH.y1 - v * (CH.y1 - CH.y0);
// Illustrative shapes only (no y-axis values are shown)
const BLOCKBUSTER: [number, number][] = [[2000, 0.8], [2002, 0.85], [2004, 0.88], [2006, 0.68], [2008, 0.38], [2010, 0.02]];
const NETFLIX: [number, number][] = [[2000, 0.03], [2004, 0.07], [2008, 0.13], [2010, 0.2], [2013, 0.32], [2016, 0.5], [2019, 0.74], [2022, 0.94], [2025, 1.2]];
const path = (pts: [number, number][]) =>
  pts.map(([y, v], i) => `${i ? "L" : "M"} ${yearX(y).toFixed(1)} ${valY(v).toFixed(1)}`).join(" ");

// Reveal edge of the chart (x position) over time, and the year shown
const revealX = (f: number) =>
  f < 480
    ? interpolate(f, [335, 450], [CH.x0, 540], { ...clamp, easing: easeInOut })
    : interpolate(f, [480, 565], [540, CH.x1 + 40], { ...clamp, easing: Easing.in(Easing.quad) });
const yearLabel = (f: number) => {
  if (f < 480) return String(Math.round(interpolate(f, [335, 450], [2000, 2010], clamp)));
  if (f < 560) return String(Math.round(interpolate(f, [480, 560], [2010, 2025], clamp)));
  return "현재";
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
type Cap = { from: number; to: number; lines: { at: number; segs: Seg[] }[]; size?: number; weight?: number; top?: number };

const Captions: React.FC<{ f: number; caps: Cap[] }> = ({ f, caps }) => {
  const c = caps.find((x) => f >= x.from && f < x.to);
  if (!c) return null;
  const out = clamp01((c.to - f) / 10);
  const strong = (c.weight ?? 400) >= 700;
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: c.top ?? 1180, opacity: out }}>
      {!strong && <div style={{ width: 2, height: 22, background: HAIR, marginBottom: 18 }} />}
      {c.lines.map((l, i) =>
        f >= l.at ? (
          <Line key={i} f={f} at={l.at} style={{
            fontSize: c.size ?? 42, fontWeight: c.weight ?? 400, lineHeight: strong ? 1.3 : 1.5,
            color: strong ? INK : BODY, letterSpacing: strong ? -1.2 : 0,
          }}>
            {l.segs.map((s, j) => (
              <span key={j} style={{ color: s.c ?? undefined, fontWeight: s.c && !strong ? 700 : undefined }}>{s.t}</span>
            ))}
          </Line>
        ) : null,
      )}
    </div>
  );
};

const CAPTIONS: Cap[] = [
  { from: 22, to: 150, lines: [
    { at: 22, segs: [{ t: "2000년, " }, { t: "작은 회사 하나가", c: INK }] },
    { at: 32, segs: [{ t: "제안을 했다" }] },
  ] },
  { from: 172, to: 330, lines: [
    { at: 172, segs: [{ t: "업계 1위 " }, { t: "블록버스터", c: INK }, { t: "는," }] },
    { at: 200, segs: [{ t: "웃어넘겼다" }] },
  ] },
  { from: 345, to: 484, lines: [{ at: 345, segs: [{ t: "10년 뒤, 블록버스터는 " }, { t: "파산", c: FAIL }, { t: "했다" }] }] },
  { from: 492, to: 630, lines: [
    { at: 492, segs: [{ t: "놓친 건 제안 하나가 아니라," }] },
    { at: 520, segs: [{ t: "미래", c: AMBER }, { t: "였다" }] },
  ] },
  { from: 650, to: 790, size: 56, weight: 700, top: 760, lines: [
    { at: 650, segs: [{ t: "부탁하는 제안이 아니라," }] },
    { at: 690, segs: [{ t: "거절하면 " }, { t: "아까운", c: AMBER }, { t: " 제안을 만든다" }] },
  ] },
  { from: 962, to: TOTAL + 10, top: 1180, lines: [{ at: 962, segs: [{ t: "난 언제나, " }, { t: "그런 제안을 한다.", c: INK }] }] },
];

// ---------- Pieces ----------

const Overline: React.FC<{ f: number; from: number; to: number; tag: string; text: string; color?: string }> =
  ({ f, from, to, tag, text, color = AMBER }) => {
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

const BigYear: React.FC<{ f: number }> = ({ f }) => {
  const op = interpolate(f, [6, 30, 620, 640], [0, 1, 1, 0], clamp);
  if (op <= 0) return null;
  const label = f < 335 ? "2000" : yearLabel(f);
  const pulse = f >= 335 && f < 565 ? 1 : 0;
  return (
    <div style={{
      position: "absolute", left: MX - 6, top: 400, opacity: op,
      fontSize: label === "현재" ? 150 : 200, fontWeight: 700, letterSpacing: -6, lineHeight: 1,
      color: pulse ? "rgba(242,244,247,0.16)" : "rgba(242,244,247,0.09)",
      fontVariantNumeric: "tabular-nums",
    }}>{label}</div>
  );
};

const OfferCard: React.FC<{ f: number }> = ({ f }) => {
  const op = interpolate(f, [150, 168, 322, 334], [0, 1, 1, 0], clamp);
  if (op <= 0) return null;
  const p = prog(f, 152, 22);
  const st = interpolate(f - STAMP_AT, [0, 7], [1.35, 1], { ...clamp, easing: easeOut });
  const stOp = clamp01((f - STAMP_AT) / 4);
  const dimCard = interpolate(f, [STAMP_AT, STAMP_AT + 20], [1, 0.55], clamp);
  const d = f - STAMP_AT;
  const shake = d >= 0 && d < 8 ? 5 * (1 - d / 8) : 0;
  return (
    <div style={{
      position: "absolute", left: 140, right: 140, top: 620, opacity: op,
      transform: `translateY(${(1 - p) * 30}px) translate(${Math.sin(f * 2.5) * shake}px, ${Math.cos(f * 3.3) * shake * 0.6}px)`,
    }}>
      <div style={{
        border: `1.5px solid ${HAIR}`, borderRadius: 10, background: "rgba(255,255,255,0.03)",
        padding: "40px 46px 46px", opacity: dimCard,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, fontWeight: 700, letterSpacing: 5, color: SUB }}>
          <span>PROPOSAL</span><span>2000</span>
        </div>
        <div style={{ height: 1.5, background: HAIR, margin: "22px 0 30px" }} />
        <div style={{ fontSize: 26, color: SUB, marginBottom: 14 }}>넷플릭스 → 블록버스터</div>
        <div style={{ fontSize: 50, fontWeight: 700, color: INK, letterSpacing: -1.2, lineHeight: 1.3 }}>
          넷플릭스를<br /><span style={{ color: AMBER }}>5천만 달러</span>에 인수하세요.
        </div>
      </div>
      {f >= STAMP_AT && (
        <div style={{
          position: "absolute", right: 30, top: 120, opacity: stOp,
          transform: `rotate(-9deg) scale(${st})`, transformOrigin: "50% 50%",
          border: `4px solid ${FAIL}`, borderRadius: 14, padding: "8px 30px",
          color: FAIL, fontSize: 64, fontWeight: 700, letterSpacing: 8,
          background: "rgba(13,16,21,0.55)",
        }}>거절</div>
      )}
    </div>
  );
};

const Chart: React.FC<{ f: number }> = ({ f }) => {
  const op = interpolate(f, [330, 346, 620, 638], [0, 1, 1, 0], clamp);
  if (op <= 0) return null;
  const rx = revealX(f);
  const bkP = prog(f, BANKRUPT_AT, 14);
  const topP = prog(f, 560, 20);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <clipPath id="reveal"><rect x={0} y={0} width={rx} height={1920} /></clipPath>
          <clipPath id="above"><rect x={0} y={CH.y0 - 140} width={1080} height={CH.y1 - CH.y0 + 140} /></clipPath>
          <linearGradient id="nfFade" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={AMBER} stopOpacity={0.9} />
            <stop offset="1" stopColor={AMBER} stopOpacity={1} />
          </linearGradient>
        </defs>
        <line x1={CH.x0} y1={CH.y1} x2={CH.x1} y2={CH.y1} stroke={HAIR} strokeWidth={2} />
        {[2000, 2010].map((y) => (
          <line key={y} x1={yearX(y)} y1={CH.y0} x2={yearX(y)} y2={CH.y1} stroke="rgba(255,255,255,0.05)" strokeWidth={1.5} />
        ))}
        <g clipPath="url(#above)">
          <g clipPath="url(#reveal)">
            <path d={path(BLOCKBUSTER)} stroke={GRAYLINE} strokeWidth={4} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            <path d={path(NETFLIX)} stroke="url(#nfFade)" strokeWidth={5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          </g>
        </g>
        {bkP > 0 && (
          <g opacity={bkP}>
            <circle cx={yearX(2010)} cy={valY(0.02)} r={10 * bkP} fill={FAIL} />
            <line x1={yearX(2010) - 14} y1={valY(0.02) - 14} x2={yearX(2010) + 14} y2={valY(0.02) + 14} stroke={BG} strokeWidth={3} />
          </g>
        )}
        {topP > 0 && (
          <g opacity={topP}>
            <circle cx={CH.x1} cy={valY(1.2)} r={22 + 8 * topP} fill={AMBER} opacity={0.14} />
            <circle cx={CH.x1} cy={valY(1.2)} r={9 * topP} fill={AMBER} />
          </g>
        )}
      </svg>
      <div style={{ position: "absolute", left: CH.x0, top: valY(0.88) - 60, fontSize: 26, fontWeight: 700, color: "#AEB5C0", opacity: prog(f, 340, 16) }}>블록버스터</div>
      <div style={{ position: "absolute", left: CH.x0, top: valY(0.07) - 52, fontSize: 26, fontWeight: 700, color: AMBER, opacity: prog(f, 340, 16) }}>넷플릭스</div>
      <div style={{
        position: "absolute", left: yearX(2010) + 22, top: valY(0.02) - 50, fontSize: 28, fontWeight: 700, color: FAIL,
        opacity: bkP, transform: `translateX(${(1 - bkP) * -10}px)`,
      }}>2010 파산</div>
      <div style={{
        position: "absolute", right: 1080 - (CH.x1 - 40), top: valY(1.2) - 54, textAlign: "right", opacity: topP,
        transform: `translateY(${(1 - topP) * 10}px)`,
      }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4, color: SUB }}>넷플릭스</div>
        <div style={{ fontSize: 34, fontWeight: 700, color: AMBER }}>세계 최대 스트리밍 기업</div>
      </div>
      {[["2000", 2000], ["2010", 2010], ["현재", 2025]].map(([t, y]) => (
        <div key={t} style={{
          position: "absolute", left: yearX(y as number), top: CH.y1 + 14, transform: "translateX(-50%)",
          fontSize: 22, fontWeight: 700, letterSpacing: 2, color: SUB,
        }}>{t}</div>
      ))}
    </div>
  );
};

const Slam: React.FC<{ f: number }> = ({ f }) => {
  if (f < SLAM1) return null;
  const s1 = interpolate(f - SLAM1, [0, 8], [1.2, 1], { ...clamp, easing: easeOut });
  const o1 = clamp01((f - SLAM1) / 4);
  const s2 = interpolate(f - SLAM2, [0, 9], [1.35, 1], { ...clamp, easing: easeOut });
  const o2 = clamp01((f - SLAM2) / 4);
  const d = f - SLAM2;
  const shake = d >= 0 && d < 12 ? 10 * (1 - d / 12) : 0;
  const glow = interpolate(f, [SLAM2, SLAM2 + 6, SLAM2 + 40], [0, 1, 0.45], clamp);
  const settle = interpolate(f, [950, 980], [1, 0.92], clamp);
  return (
    <div style={{
      position: "absolute", left: MX, top: 690,
      transform: `translate(${Math.sin(f * 2.4) * shake}px, ${Math.cos(f * 3.2) * shake * 0.6}px) scale(${settle})`,
      transformOrigin: "0% 50%",
    }}>
      <div style={{ fontSize: 96, fontWeight: 700, color: INK, letterSpacing: -2, opacity: o1, transform: `scale(${s1})`, transformOrigin: "0% 60%" }}>
        놓치면,
      </div>
      {f >= SLAM2 && (
        <div style={{
          fontSize: 132, fontWeight: 700, color: AMBER, letterSpacing: -3, lineHeight: 1.15, opacity: o2,
          transform: `scale(${s2})`, transformOrigin: "0% 60%", whiteSpace: "nowrap",
          textShadow: `0 0 ${60 * glow}px rgba(242,180,92,${0.55 * glow})`,
        }}>너가 손해야!!</div>
      )}
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

export const MissedOffer: React.FC = () => {
  const f = useCurrentFrame();
  const endFade = interpolate(f, [TOTAL - 18, TOTAL], [1, 0], clamp);
  const slamFlash = interpolate(f, [SLAM2 - 1, SLAM2 + 3, SLAM2 + 24], [0, 0.18, 0], clamp);
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
      {/* the story scenes sit a little higher than the slam, so nudge them down separately */}
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${f < 640 ? 100 : 40}px)` }}>
        <Overline f={f} from={6} to={630} tag="TRUE STORY" text="2000년, 미국 댈러스" />
        <BigYear f={f} />
        <OfferCard f={f} />
        <Chart f={f} />
        <Slam f={f} />
        <Captions f={f} caps={CAPTIONS} />
      </div>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: slamFlash,
        background: "radial-gradient(circle at 40% 45%, rgba(242,180,92,0.9), rgba(242,180,92,0) 60%)",
      }} />
      <Grain f={f} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.45) 100%)",
      }} />
    </div>
  );
};
