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
const AMBER = "#F2B45C";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
const progIO = (f: number, at: number, dur: number) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeInOut });

export const TOTAL = 800;
const MX = 100;

// ---------- Timeline ----------
// S1 slogan flood 0–180 · S2 every company, the same sentence 180–420
// S3 it isn't AI that brings them back 420–580 · S4 so what is your company's reason? 580–800
export const GRID_AT = 186;
export const END_AT = 424;
export const ASK_AT = 580;
const CHOSEN = 9; // the one card that lifts out of the grid with its own reason

// ---------- Slogans (S1 → S2) ----------
const SLOGANS = ["AX 전환", "AI 네이티브", "AI 퍼스트", "에이전트 도입", "AI 혁신", "AI 트랜스포메이션", "생성형 AI 도입", "AI 기반 성장"];
const rnd = (i: number) => {
  const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
  return v - Math.floor(v);
};
const COLS = 4;
const ROWS = 5;
const CW = 200;
const CH = 112;
const GX = (1080 - (COLS * CW + (COLS - 1) * 26)) / 2;
const GY = 470;
const PILLS = Array.from({ length: COLS * ROWS }, (_, i) => ({
  text: SLOGANS[i % SLOGANS.length],
  // jittered 3-column layout so the flood reads as busy without pills piling on each other
  x: [260, 540, 820][i % 3] + (rnd(i) - 0.5) * 70,
  y: 490 + Math.floor(i / 3) * 88 + (rnd(i + 40) - 0.5) * 20,
  at: 10 + i * 7.5,
  cell: i,
}));
const cellXY = (i: number) => ({ x: GX + (i % COLS) * (CW + 26), y: GY + Math.floor(i / COLS) * (CH + 22) });

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
  { from: 16, to: 178, lines: [
    { at: 16, segs: [{ t: "AX 전환, AI 네이티브, AI 퍼스트…", c: INK }] },
    { at: 46, segs: [{ t: "요즘 이 말 안 하는 회사 있나요?" }] },
  ] },
  { from: 196, to: 418, lines: [
    { at: 196, segs: [{ t: "모든 회사가 " }, { t: "같은 말", c: INK }, { t: "을 하면," }] },
    { at: 236, segs: [{ t: "그 말은 아무것도 구분하지 못한다" }] },
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

// Slogan pills scatter in, then file into identical company cards
const Slogans: React.FC<{ f: number }> = ({ f }) => {
  const toGrid = progIO(f, GRID_AT, 46);
  const grey = prog(f, END_AT, 30);
  const ask = progIO(f, ASK_AT + 40, 30);
  const out = 1;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: out }}>
      {PILLS.map((p, i) => {
        const a = prog(f, p.at, 14);
        if (a <= 0) return null;
        const c = cellXY(p.cell);
        const x = lerp(p.x, c.x + CW / 2, toGrid);
        const y = lerp(p.y, c.y + CH / 2, toGrid);
        const card = prog(f, GRID_AT + 30 + (i % 7) * 3, 18);
        const w = lerp(0, CW, card);
        const h = lerp(0, CH, card);
        const chosen = i === CHOSEN ? ask : 0;
        const fade = lerp(1, 0.45, grey) * (i === CHOSEN ? 1 : lerp(1, 0.45, ask));
        return (
          <div key={i} style={{ opacity: fade + (1 - fade) * chosen, transform: `scale(${1 + 0.1 * chosen})`, transformOrigin: `${c.x + CW / 2}px ${c.y + CH / 2}px` }}>
            {card > 0 && (
              <div style={{
                position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: 10,
                border: `1.5px solid ${chosen > 0.5 ? AMBER : HAIR}`, background: chosen > 0 ? `rgba(242,180,92,${0.14 * chosen})` : "rgba(255,255,255,0.03)", opacity: card,
                boxShadow: chosen > 0 ? `0 0 ${40 * chosen}px rgba(242,180,92,${0.35 * chosen})` : undefined,
              }}>
                <div style={{ position: "absolute", left: 14, top: 10, fontSize: 18, fontWeight: 700, color: chosen > 0.5 ? AMBER : SUB, opacity: card }}>
                  {chosen > 0.5 ? "당신 회사" : `${String.fromCharCode(65 + i)}사`}
                </div>
              </div>
            )}
            <div style={{
              position: "absolute", left: x, top: y + 10 * card, transform: `translate(-50%, -50%) scale(${lerp(1, 0.76, card)})`,
              padding: "8px 18px", borderRadius: 22, border: `1.5px solid ${lerp(1, 0, card) > 0.5 ? "#7C8594" : "rgba(124,133,148,0.6)"}`,
              background: "rgba(13,16,21,0.85)", fontSize: 24, fontWeight: 700, color: "#B9C1CD", whiteSpace: "nowrap",
              opacity: a * (1 - chosen),
            }}>{card > 0.5 ? "AI 네이티브 · AX 전환" : p.text}</div>
            {chosen > 0 && (
              <div style={{
                position: "absolute", left: c.x + CW / 2, top: c.y + CH / 2 + 8, transform: "translate(-50%, -50%)",
                fontSize: 44, fontWeight: 700, color: AMBER, opacity: chosen,
              }}>?</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const Conclusion: React.FC<{ f: number }> = ({ f }) => {
  if (f < END_AT) return null;
  const first = 1 - prog(f, ASK_AT - 14, 12);
  const big: React.CSSProperties = { fontSize: 56, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.3 };
  return (
    <>
      {first > 0 && (
        <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP - 20, opacity: first }}>
          <Line f={f} at={END_AT + 8} style={{ fontSize: 38, color: BODY, lineHeight: 1.5 }}>모두가 AI를 쓰는 시대,</Line>
          <div style={{ height: 8 }} />
          <Line f={f} at={END_AT + 34} style={big}>다시 찾게 만드는 건</Line>
          <Line f={f} at={END_AT + 52} style={big}><span style={{ color: AMBER }}>AI가 아니다.</span></Line>
        </div>
      )}
      {f >= ASK_AT && (
        <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP - 20 }}>
          <Line f={f} at={ASK_AT} style={{ fontSize: 38, color: BODY, lineHeight: 1.5 }}>AI는 기본이 되었다.</Line>
          <div style={{ height: 8 }} />
          <Line f={f} at={ASK_AT + 30} style={big}>이제 묻는다,</Line>
          <Line f={f} at={ASK_AT + 50} style={big}><span style={{ color: AMBER }}>당신 회사만의 이유</span>는 무엇인가.</Line>
        </div>
      )}
    </>
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

export const AiWifi: React.FC = () => {
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
        <Overline f={f} from={6} to={END_AT} tag="EVERYONE SAYS IT" text="모두의 슬로건" color={INK} />
        <Overline f={f} from={END_AT + 4} to={ASK_AT - 4} tag="EVERYONE HAS IT" text="모두가 쓰는 시대" color={AMBER} />
        <Overline f={f} from={ASK_AT} to={TOTAL + 10} tag="THE QUESTION" text="당신 회사만의 이유" color={AMBER} />
        <Slogans f={f} />
        <Captions f={f} caps={CAPTIONS} />
        <Conclusion f={f} />
      </div>
      <Grain f={f} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.45) 100%)",
      }} />
    </div>
  );
};
