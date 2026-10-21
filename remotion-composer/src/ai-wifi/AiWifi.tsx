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
const LINE = "#C9CED6";
const DIM = "#5E6878";
const AMBER = "#F2B45C";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
const progIO = (f: number, at: number, dur: number) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeInOut });

export const TOTAL = 1440;
const MX = 100;

// ---------- Timeline ----------
// S1 slogan flood 0–180 · S2 every company, the same sentence 180–420
// S3 the "FREE Wi-Fi" sticker 420–760 · S4 why you come back 760–1090
// S5 it isn't AI that brings them back 1090–1236 · S6 so what is your company's reason? 1236–1440
export const GRID_AT = 186;
export const DOOR_AT = 440;
export const STREET_AT = 540;
export const FADE_AT = 615;
export const OPEN_AT = 770;
const CORNER_AT = 880;
const WARM_AT = 984;
export const END_AT = 1096;
export const ASK_AT = 1244;

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
  { from: 196, to: 414, lines: [
    { at: 196, segs: [{ t: "모든 회사가 " }, { t: "같은 말", c: INK }, { t: "을 하면," }] },
    { at: 236, segs: [{ t: "그 말은 아무것도 구분하지 못한다" }] },
  ] },
  { from: DOOR_AT - 4, to: 592, lines: [
    { at: DOOR_AT - 4, segs: [{ t: "한때 카페 문 앞엔" }] },
    { at: DOOR_AT + 22, segs: [{ t: "'Free Wi-Fi'", c: AMBER }, { t: "가 붙어 있었다" }] },
  ] },
  { from: 600, to: 756, lines: [
    { at: 600, segs: [{ t: "이제는 아무도 써 붙이지 않는다." }] },
    { at: 640, segs: [{ t: "없으면 " }, { t: "이상할 뿐", c: INK }, { t: "이다" }] },
  ] },
  { from: 772, to: 876, lines: [
    { at: 772, segs: [{ t: "와이파이가 없으면," }] },
    { at: 792, segs: [{ t: "안 간다.", c: INK }] },
  ] },
  { from: 882, to: 982, lines: [
    { at: 882, segs: [{ t: "하지만 와이파이 때문에" }] },
    { at: 902, segs: [{ t: "다시 가지는 않는다", c: INK }] },
  ] },
  { from: 988, to: 1088, lines: [
    { at: 988, segs: [{ t: "다시 가는 이유는," }] },
    { at: 1008, segs: [{ t: "커피 맛", c: AMBER }, { t: "과 " }, { t: "그 공간", c: AMBER }, { t: "이다" }] },
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
  const out = 1 - prog(f, DOOR_AT - 30, 22);
  if (out <= 0) return null;
  const toGrid = progIO(f, GRID_AT, 46);
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
        return (
          <div key={i}>
            {card > 0 && (
              <div style={{
                position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: 10,
                border: `1.5px solid ${HAIR}`, background: "rgba(255,255,255,0.03)", opacity: card,
              }}>
                <div style={{ position: "absolute", left: 14, top: 10, fontSize: 18, fontWeight: 700, color: SUB, opacity: card }}>
                  {String.fromCharCode(65 + i)}사
                </div>
              </div>
            )}
            <div style={{
              position: "absolute", left: x, top: y + 10 * card, transform: `translate(-50%, -50%) scale(${lerp(1, 0.76, card)})`,
              padding: "8px 18px", borderRadius: 22, border: `1.5px solid ${lerp(1, 0, card) > 0.5 ? "#7C8594" : "rgba(124,133,148,0.6)"}`,
              background: "rgba(13,16,21,0.85)", fontSize: 24, fontWeight: 700, color: "#B9C1CD", whiteSpace: "nowrap",
              opacity: a,
            }}>{card > 0.5 ? "AI 네이티브 · AX 전환" : p.text}</div>
          </div>
        );
      })}
    </div>
  );
};

const WifiIcon: React.FC<{ x: number; y: number; s: number; color: string; op?: number; w?: number }> = ({ x, y, s, color, op = 1, w = 3 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={op}>
    {[30, 20, 10].map((r) => (
      <path key={r} d={`M ${-r} ${-r * 0.35} A ${r * 1.2} ${r * 1.2} 0 0 1 ${r} ${-r * 0.35}`} fill="none" stroke={color} strokeWidth={w / s} strokeLinecap="round" />
    ))}
    <circle cx={0} cy={2} r={3.4} fill={color} />
  </g>
);

// A café door in thin line art; the sticker lives on its glass
const Door: React.FC<{ x: number; y: number; sticker: number; stickerGray: number; small: number; open?: number; stickerText?: string; key?: number }> =
  ({ x, y, sticker, stickerGray, small, open = 0, stickerText = "FREE Wi-Fi" }) => {
    const w = 150;
    const h = 280;
    const sCol = stickerGray > 0.5 ? DIM : AMBER;
    const panelW = w * (1 - 0.82 * open);
    return (
      <g>
        <line x1={x - w / 2 - 26} y1={y - 26} x2={x + w / 2 + 26} y2={y - 26} stroke={LINE} strokeWidth={2} opacity={0.6} />
        <text x={x} y={y - 38} textAnchor="middle" fontSize={18} fontWeight={700} letterSpacing={6} fill={SUB}>CAFE</text>
        <rect x={x - w / 2 - 8} y={y - 8} width={w + 16} height={h + 8} fill="none" stroke={LINE} strokeWidth={2} opacity={0.5} />
        {open > 0 && <rect x={x - w / 2} y={y} width={w} height={h} fill="url(#warm-in)" opacity={open} />}
        <g>
          <rect x={x - w / 2} y={y} width={panelW} height={h} fill="#141A23" stroke={LINE} strokeWidth={2} />
          <rect x={x - w / 2 + 16 * (panelW / w)} y={y + 18} width={Math.max(0, panelW - 32 * (panelW / w))} height={h * 0.62} fill="rgba(160,180,210,0.06)" stroke={LINE} strokeWidth={1.2} opacity={0.6} />
          <line x1={x - w / 2 + panelW - 18 * (panelW / w)} y1={y + h * 0.52} x2={x - w / 2 + panelW - 18 * (panelW / w)} y2={y + h * 0.66} stroke={LINE} strokeWidth={4} strokeLinecap="round" />
        </g>
        {small > 0 && open < 0.3 && <WifiIcon x={x + w / 2 - 24} y={y + 40} s={0.5} color={DIM} op={small * (1 - open * 3)} />}
        {sticker > 0 && open < 0.3 && (
          <g opacity={sticker * (1 - open * 3)}>
            <rect x={x - 58} y={y + 64} width={116} height={92} rx={10} fill={stickerGray > 0.5 ? "rgba(94,104,120,0.18)" : "rgba(242,180,92,0.16)"} stroke={sCol} strokeWidth={2} />
            <WifiIcon x={x} y={y + 102} s={0.62} color={sCol} />
            <text x={x} y={y + 140} textAnchor="middle" fontSize={16} fontWeight={700} fill={sCol}>{stickerText}</text>
          </g>
        )}
      </g>
    );
  };

const Street: React.FC<{ f: number }> = ({ f }) => {
  const show = prog(f, DOOR_AT - 10, 22) * (1 - progIO(f, OPEN_AT + 20, 30));
  if (show <= 0) return null;
  const zoom = lerp(1.9, 1, progIO(f, STREET_AT, 50));
  const others = prog(f, STREET_AT + 20, 24);
  const centerSticker = prog(f, DOOR_AT + 18, 18);
  const open = progIO(f, OPEN_AT - 6, 30);
  const doors = [-2, -1, 0, 1, 2];
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: show }}>
      <defs>
        <radialGradient id="warm-in"><stop offset="0" stopColor={AMBER} stopOpacity={0.55} /><stop offset="1" stopColor={AMBER} stopOpacity={0.08} /></radialGradient>
      </defs>
      <g transform={`translate(540 760) scale(${zoom}) translate(-540 -760)`}>
        <line x1={20} y1={920} x2={1060} y2={920} stroke={HAIR} strokeWidth={2} />
        {doors.map((d, i) => {
          const fadeStart = FADE_AT + [3, 1, 4, 0, 2][i] * 14;
          const gray = prog(f, fadeStart, 16);
          const gone = prog(f, fadeStart + 22, 22);
          const stick = (d === 0 ? centerSticker : others * prog(f, STREET_AT + 26 + i * 6, 14)) * (1 - gone);
          return (
            <g key={d} opacity={d === 0 ? 1 : others}>
              <Door x={540 + d * 200} y={640} sticker={stick} stickerGray={gray} small={gone} open={d === 0 ? open : 0} />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

// Inside the café: Wi-Fi recedes to a corner, the cup and the window light up
const Interior: React.FC<{ f: number }> = ({ f }) => {
  const show = prog(f, OPEN_AT + 26, 26);
  if (show <= 0) return null;
  const toCorner = progIO(f, CORNER_AT, 40);
  const warm = prog(f, WARM_AT, 36);
  const ai = prog(f, END_AT + 10, 24);
  const wx = lerp(540, 900, toCorner);
  const wy = lerp(560, 480, toCorner);
  const ws = lerp(2.2, 0.9, toCorner);
  const wcol = toCorner > 0.5 ? DIM : INK;
  const steam = (k: number) => {
    const ph = (f * 0.02 + k * 0.33) % 1;
    const x0 = 520 + k * 22;
    const yb = 900 - ph * 130;
    return <path key={k} d={`M ${x0} ${yb + 60} C ${x0 - 14} ${yb + 40}, ${x0 + 14} ${yb + 20}, ${x0} ${yb}`} fill="none" stroke={AMBER} strokeWidth={2.5} strokeLinecap="round"
      opacity={warm * 0.55 * Math.sin(Math.PI * ph)} />;
  };
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: show }}>
      <defs>
        <radialGradient id="cup-glow"><stop offset="0" stopColor={AMBER} stopOpacity={0.45} /><stop offset="1" stopColor={AMBER} stopOpacity={0} /></radialGradient>
        <linearGradient id="win-light" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={AMBER} stopOpacity={0.28} /><stop offset="1" stopColor={AMBER} stopOpacity={0.05} /></linearGradient>
      </defs>
      {/* window seat */}
      <rect x={150} y={500} width={330} height={300} fill={`rgba(242,180,92,${0.04 + 0.2 * warm})`} stroke={warm > 0.3 ? AMBER : LINE} strokeOpacity={0.4 + 0.5 * warm} strokeWidth={2} />
      <line x1={315} y1={500} x2={315} y2={800} stroke={warm > 0.3 ? AMBER : LINE} strokeOpacity={0.4 + 0.4 * warm} strokeWidth={2} />
      <line x1={150} y1={650} x2={480} y2={650} stroke={warm > 0.3 ? AMBER : LINE} strokeOpacity={0.4 + 0.4 * warm} strokeWidth={2} />
      <path d="M 480 800 L 760 1060 L 120 1060 L 150 800 Z" fill="url(#win-light)" opacity={warm} />
      {/* table + cup */}
      <ellipse cx={560} cy={1000} rx={260 * 1.4} ry={40} fill="url(#cup-glow)" opacity={warm} />
      <line x1={250} y1={1000} x2={870} y2={1000} stroke={LINE} strokeWidth={2} opacity={0.6} />
      <circle cx={560} cy={930} r={150} fill="url(#cup-glow)" opacity={warm} />
      <ellipse cx={560} cy={995} rx={92} ry={12} fill="none" stroke={warm > 0.3 ? AMBER : LINE} strokeWidth={2.5} />
      <path d="M 500 900 L 508 985 Q 560 997 612 985 L 620 900 Z" fill={`rgba(242,180,92,${0.06 + 0.22 * warm})`} stroke={warm > 0.3 ? AMBER : LINE} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M 618 915 Q 662 920 652 948 Q 644 968 612 965" fill="none" stroke={warm > 0.3 ? AMBER : LINE} strokeWidth={2.5} />
      <ellipse cx={560} cy={900} rx={60} ry={8} fill="none" stroke={warm > 0.3 ? AMBER : LINE} strokeWidth={2} />
      {[0, 1, 2].map(steam)}
      {/* Wi-Fi: centre stage at first, then a small grey corner icon */}
      <WifiIcon x={wx} y={wy} s={ws} color={wcol} op={1} w={3} />
      {ai > 0 && (
        <g opacity={ai}>
          <rect x={wx - 34} y={wy + 18} width={68} height={34} rx={8} fill="rgba(94,104,120,0.2)" stroke={DIM} strokeWidth={2} />
          <text x={wx} y={wy + 42} textAnchor="middle" fontSize={20} fontWeight={700} fill={SUB}>AI</text>
        </g>
      )}
    </svg>
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
  const interiorDim = interpolate(f, [END_AT, END_AT + 30], [1, 0.75], clamp);
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
        <Overline f={f} from={6} to={420} tag="EVERYONE SAYS IT" text="모두의 슬로건" color={INK} />
        <Overline f={f} from={DOOR_AT - 6} to={760} tag="ONCE A PERK" text="카페 문 앞의 스티커" color={AMBER} />
        <Overline f={f} from={OPEN_AT} to={END_AT} tag="WHY WE RETURN" text="다시 가는 이유" color={AMBER} />
        <Overline f={f} from={END_AT + 4} to={ASK_AT - 4} tag="EVERYONE HAS IT" text="모두가 쓰는 시대" color={AMBER} />
        <Overline f={f} from={ASK_AT} to={TOTAL + 10} tag="THE QUESTION" text="당신 회사만의 이유" color={AMBER} />
        <Slogans f={f} />
        <Street f={f} />
        <div style={{ position: "absolute", inset: 0, opacity: interiorDim }}><Interior f={f} /></div>
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
