import { useEffect, useState } from "react";
import {
  Easing,
  interpolate,
  interpolateColors,
  staticFile,
  useCurrentFrame,
  continueRender,
  delayRender,
} from "remotion";

const SANS = "Noto Sans KR";
const BG = "#F6F4EF";
const NIGHT = "#16181D";
const INK = "#1B1E24";
const SUB = "#7C818A";
const BODY = "#3D424B";
const HAIR = "rgba(27,30,36,0.12)";
const FIG = "#5D636D";
const FIG_SOFT = "#AEB3BB";
const AMBER = "#DE8A1E";
const AMBER_SOFT = "#F7E3C6";
const LIGHT = "#F2EFE8";
const LSUB = "#959AA3";
const WRONG = "#B4563F";
const CHAT_BG = "#BACEE0";
const KAKAO = "#FEE500";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const backOut = Easing.out(Easing.back(1.5));
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
const progIO = (f: number, at: number, dur: number) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeInOut });

export const TOTAL = 1639;
const MX = 100;

// ---------- Narration onsets (frames, from layout_vo2.py) ----------
// 0 팀을 조용히 · 1 1위는 · 2 타이틀 · 3 5위 · 4 4위 · 5 3위 · 6 2위 · 7 그리고 1위는? · 8 1위 · 9 예산이 · 10 바로 옆에 · 11 혹시 주변에
export const VO = [18, 115, 234, 333, 499, 640, 793, 932, 1048, 1188, 1387, 1476];
const HOOK_B = 136; // 지금 당신 옆에
const R5 = [355, 409]; // 말은 청산유수인데 · 막상 해보면
const R4 = [522, 562]; // 공은 가져가고 · 책임은 넘기는
const R3 = [663, 711]; // 회의 땐 · 끝나고
const R2 = [813, 849]; // 피드백만 하면 · 방어부터
const SUS_B = 988; // 1위는?
const R1 = [1077, 1106]; // 안 되는 이유를 · 기가 막히게
const Q = [1188, 1230, 1294]; // 예산 · 전에 해봤는데 · 타이밍
const END_B = 1424; // 멀리 하세요
const END_D = 1522; // 당장 내보내세요

// card windows
const CARDS = [
  { rank: 5, from: VO[3] - 8, to: VO[4] - 8 },
  { rank: 4, from: VO[4] - 8, to: VO[5] - 8 },
  { rank: 3, from: VO[5] - 8, to: VO[6] - 8 },
  { rank: 2, from: VO[6] - 8, to: 916 },
  { rank: 1, from: VO[8] - 8, to: 1374 },
];
const SUS = { from: 916, to: VO[8] - 8 };

// light ↔ night: hook (night) → cards (light) → suspense + 1위 (night) → ending (light)
const sinIO = Easing.inOut(Easing.sin);
const slow = (f: number, at: number, dur = 54) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: sinIO });
const night = (f: number) => clamp01(1 - slow(f, 192) + slow(f, 890) - slow(f, 1350));
const win = (f: number, from: number, to: number, fin = 14, fout = 12) => prog(f, from, fin) * (1 - prog(f, to - fout, fout));

// ---------- Fonts & text ----------

const fontCss = `
@font-face { font-family: '${SANS}'; font-weight: 400; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-400-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${SANS}'; font-weight: 700; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${SANS}'; font-weight: 900; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-900-normal.woff2")}') format('woff2'); }
`;

const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender("load-fonts"));
  useEffect(() => {
    const done = () => continueRender(handle);
    Promise.all([
      (document as any).fonts.load(`400 64px "${SANS}"`, "가"),
      (document as any).fonts.load(`700 64px "${SANS}"`, "가"),
      (document as any).fonts.load(`900 64px "${SANS}"`, "가"),
    ])
      .then(() => (document as any).fonts.ready)
      .then(done)
      .catch(done);
  }, [handle]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

const Line: React.FC<{ f: number; at: number; style?: React.CSSProperties; children: React.ReactNode }> =
  ({ f, at, style, children }) => {
    if (f < at) return null;
    const p = prog(f, at, 16);
    return (
      <div style={{ overflow: "hidden", paddingBottom: "0.12em" }}>
        <div style={{ transform: `translateY(${(1 - p) * 110}%)`, opacity: 0.3 + 0.7 * p, whiteSpace: "nowrap", ...style }}>
          {children}
        </div>
      </div>
    );
  };

type Tail = "bl" | "br" | "l" | "r";
const Bubble: React.FC<{
  f: number; at: number; x: number; y: number; text: React.ReactNode; bg: string; color: string;
  fs?: number; tail?: Tail; right?: boolean; border?: string; w?: number;
}> = ({ f, at, x, y, text, bg, color, fs = 40, tail = "bl", right = false, border, w = 700 }) => {
  if (f < at) return null;
  const s = interpolate(f, [at, at + 12], [0.6, 1], { ...clamp, easing: backOut });
  const o = prog(f, at, 8);
  const origin = tail === "br" || tail === "r" ? "right bottom" : "left bottom";
  const tailStyle: React.CSSProperties =
    tail === "bl" ? { left: 38, bottom: -9 } :
    tail === "br" ? { right: 38, bottom: -9 } :
    tail === "l" ? { left: -9, top: "50%", marginTop: -9 } :
    { right: -9, top: "50%", marginTop: -9 };
  return (
    <div style={{
      position: "absolute", top: y, ...(right ? { right: x } : { left: x }),
      transform: `scale(${s})`, transformOrigin: origin, opacity: o,
      maxWidth: w,
    }}>
      <div style={{
        position: "relative", background: bg, color, fontSize: fs, fontWeight: 700, lineHeight: 1.35,
        padding: `${fs * 0.42}px ${fs * 0.7}px`, borderRadius: fs * 0.8, letterSpacing: -0.5,
        border: border ? `2px solid ${border}` : undefined, whiteSpace: "nowrap",
        boxShadow: "0 6px 18px rgba(27,30,36,0.08)",
      }}>
        {text}
        <div style={{ position: "absolute", width: 18, height: 18, background: bg, transform: "rotate(45deg)", ...tailStyle,
          borderRight: border && (tail === "bl" || tail === "br" || tail === "r") ? `2px solid ${border}` : undefined,
          borderBottom: border ? `2px solid ${border}` : undefined,
          borderLeft: border && tail === "l" ? `2px solid ${border}` : undefined }} />
      </div>
    </div>
  );
};

const Pill: React.FC<{ x: number; y: number; text: string; op: number; dark?: boolean }> = ({ x, y, text, op, dark }) =>
  op > 0 ? (
    <div style={{ position: "absolute", left: x, top: y, opacity: op, padding: "8px 20px", borderRadius: 22,
      background: dark ? INK : "#E9EBEF", color: dark ? "#FFFFFF" : BODY, fontSize: 26, fontWeight: 700 }}>{text}</div>
  ) : null;

// ---------- Drawing ----------
const Person: React.FC<{ x: number; y: number; color: string; s?: number; flip?: boolean }> = ({ x, y, color, s = 1, flip }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <line x1={-9} y1={-52} x2={-11} y2={-4} stroke={color} strokeWidth={14} strokeLinecap="round" />
    <line x1={9} y1={-52} x2={11} y2={-4} stroke={color} strokeWidth={14} strokeLinecap="round" />
    <rect x={-21} y={-118} width={42} height={72} rx={18} fill={color} />
    <line x1={-21} y1={-104} x2={-28} y2={-62} stroke={color} strokeWidth={11} strokeLinecap="round" />
    <line x1={21} y1={-104} x2={28} y2={-62} stroke={color} strokeWidth={11} strokeLinecap="round" />
    <circle cx={0} cy={-140} r={20} fill={color} />
  </g>
);

const Dots: React.FC<{ x: number; y: number; color: string; r?: number }> = ({ x, y, color, r = 5 }) => (
  <g>{[-1, 0, 1].map((k) => <circle key={k} cx={x + k * r * 3.2} cy={y} r={r} fill={color} />)}</g>
);

// ---------- Overline + rank chips ----------

const Overline: React.FC<{ f: number }> = ({ f }) => {
  const card = CARDS.find((c) => f >= c.from && f < c.to);
  if (!card) return null;
  const p = win(f, card.from, card.to, 16, 10);
  const dk = night(f);
  const color = AMBER;
  return (
    <div style={{ position: "absolute", left: MX, top: 340, display: "flex", alignItems: "center", gap: 16, opacity: p }}>
      <div style={{ width: 36 * p, height: 2, background: color }} />
      <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color }}>RANK 0{card.rank}</span>
      <span style={{ fontSize: 24, fontWeight: 400, color: interpolateColors(dk, [0, 1], [SUB, LSUB]) }}>어려운 타입</span>
    </div>
  );
};

const Chips: React.FC<{ f: number }> = ({ f }) => {
  const op = prog(f, 252, 18) * (1 - prog(f, 1352, 14));
  if (op <= 0) return null;
  const dk = night(f);
  const active = CARDS.find((c) => f >= c.from && f < c.to)?.rank ?? (f >= SUS.from && f < SUS.to ? 1 : 0);
  const revealed = f >= VO[8];
  return (
    <div style={{ position: "absolute", right: MX, top: 322, display: "flex", gap: 12, opacity: op }}>
      {[5, 4, 3, 2, 1].map((r) => {
        const isOn = r === active;
        const done = active > 0 && r > active;
        const onP = isOn ? 1 : 0;
        const bg = isOn ? AMBER : done ? interpolateColors(dk, [0, 1], ["#E6E8EC", "#2A2E36"]) : "rgba(0,0,0,0)";
        const fg = isOn ? "#FFFFFF" : done ? interpolateColors(dk, [0, 1], [SUB, LSUB]) : interpolateColors(dk, [0, 1], [SUB, LSUB]);
        return (
          <div key={r} style={{
            width: 62, height: 62, borderRadius: 18, background: bg, color: fg,
            border: `2px solid ${isOn ? AMBER : interpolateColors(dk, [0, 1], ["rgba(27,30,36,0.14)", "rgba(242,239,232,0.18)"])}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, fontWeight: 700, transform: `scale(${1 + 0.06 * onP})`, boxSizing: "border-box",
          }}>
            {r === 1 && !revealed ? "?" : r}
          </div>
        );
      })}
    </div>
  );
};

// ---------- Card header: big rank number + two title lines ----------

const Header: React.FC<{ f: number; rank: number; at: number; a: [number, React.ReactNode]; b: [number, React.ReactNode]; dark?: boolean; pre?: [number, string] }> =
  ({ f, rank, at, a, b, dark, pre }) => {
    const p = interpolate(f, [at - 6, at + 10], [0.7, 1], { ...clamp, easing: backOut });
    const o = prog(f, at - 6, 10);
    const ink = dark ? LIGHT : INK;
    return (
      <>
        <div style={{ position: "absolute", left: MX - 8, top: 400, display: "flex", alignItems: "baseline", opacity: o,
          transform: `scale(${p})`, transformOrigin: "left bottom" }}>
          <span style={{ fontSize: 240, fontWeight: 900, color: AMBER, letterSpacing: -8, lineHeight: 1 }}>{rank}</span>
          <span style={{ fontSize: 84, fontWeight: 700, color: ink, marginLeft: 10 }}>위</span>
        </div>
        <div style={{ position: "absolute", left: MX, right: MX, top: pre ? 680 : 700 }}>
          {pre && <Line f={f} at={pre[0]} style={{ fontSize: 44, fontWeight: 400, color: dark ? LSUB : SUB, lineHeight: 1.4 }}>{pre[1]}</Line>}
          <Line f={f} at={a[0]} style={{ fontSize: 62, fontWeight: 700, color: ink, letterSpacing: -1.5, lineHeight: 1.36 }}>{a[1]}</Line>
          <Line f={f} at={b[0]} style={{ fontSize: 62, fontWeight: 700, color: ink, letterSpacing: -1.5, lineHeight: 1.36 }}>{b[1]}</Line>
        </div>
      </>
    );
  };

const Am: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: AMBER }}>{children}</span>;

// ---------- Hook ----------

const Hook: React.FC<{ f: number }> = ({ f }) => {
  const op = 1 - prog(f, 198, 16);
  if (op <= 0) return null;
  const crowd = [220, 380, 540, 700, 860];
  const pick = 3;
  const hi = prog(f, HOOK_B + 6, 20);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      <div style={{ position: "absolute", left: MX, right: MX, top: 520 }}>
        <Line f={f} at={VO[0] - 2} style={{ fontSize: 64, fontWeight: 700, color: LIGHT, letterSpacing: -1.5, lineHeight: 1.36 }}>팀을 조용히</Line>
        <Line f={f} at={VO[0] + 26} style={{ fontSize: 64, fontWeight: 700, color: LIGHT, letterSpacing: -1.5, lineHeight: 1.36 }}>무너뜨리는 사람이 있습니다.</Line>
        <div style={{ height: 56 }} />
        <Line f={f} at={VO[1] + 2} style={{ fontSize: 64, fontWeight: 700, color: AMBER, letterSpacing: -1.5, lineHeight: 1.36 }}>1위는,</Line>
        <Line f={f} at={HOOK_B - 2} style={{ fontSize: 64, fontWeight: 700, color: LIGHT, letterSpacing: -1.5, lineHeight: 1.36 }}>지금 <Am>당신 옆에</Am></Line>
        <Line f={f} at={HOOK_B + 24} style={{ fontSize: 64, fontWeight: 700, color: LIGHT, letterSpacing: -1.5, lineHeight: 1.36 }}>있을지도 모릅니다.</Line>
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="hk-glow">
            <stop offset="0%" stopColor={AMBER} stopOpacity={0.35} />
            <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
          </radialGradient>
        </defs>
        {crowd.map((x, i) => {
          const a = prog(f, VO[0] + 8 + i * 5, 16);
          const isPick = i === pick;
          return (
            <g key={i} opacity={a}>
              {isPick && hi > 0 && <circle cx={x} cy={1420} r={130} fill="url(#hk-glow)" opacity={hi} />}
              <Person x={x} y={1540 + (1 - a) * 20} s={0.95}
                color={isPick ? interpolateColors(hi, [0, 1], ["#4A505A", AMBER]) : "#4A505A"} />
              {isPick && hi > 0 && (
                <text x={x} y={1330 - 10 * hi} fontSize={72} fontWeight={900} fill={AMBER} textAnchor="middle" opacity={hi}
                  fontFamily={`'${SANS}', sans-serif`}>?</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ---------- Title ----------

const Title: React.FC<{ f: number }> = ({ f }) => {
  const op = win(f, VO[2] - 6, VO[3] - 6, 16, 12);
  if (op <= 0) return null;
  const n = interpolate(f, [VO[2] + 30, VO[2] + 46], [0.6, 1], { ...clamp, easing: backOut });
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: 640, opacity: op }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 30 }}>
        <div style={{ width: 36, height: 2, background: AMBER }} />
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color: AMBER }}>TOP 5</span>
      </div>
      <Line f={f} at={VO[2] - 4} style={{ fontSize: 80, fontWeight: 700, color: INK, letterSpacing: -2.5, lineHeight: 1.3 }}>함께 일하기</Line>
      <Line f={f} at={VO[2] + 10} style={{ fontSize: 80, fontWeight: 700, color: INK, letterSpacing: -2.5, lineHeight: 1.3 }}>어려운 타입</Line>
      <div style={{ fontSize: 300, fontWeight: 900, color: AMBER, lineHeight: 1, letterSpacing: -10, marginTop: 10,
        opacity: prog(f, VO[2] + 30, 10), transform: `scale(${n})`, transformOrigin: "left center" }}>5</div>
    </div>
  );
};

// ---------- 5위: 말은 청산유수, 막상 해보면 못함 ----------

const Card5: React.FC<{ f: number }> = ({ f }) => {
  const doc = prog(f, R5[1] + 2, 18);
  const sparkle = prog(f, R5[0] + 10, 14) * (1 - prog(f, R5[1] + 10, 20));
  return (
    <>
      <Header f={f} rank={5} at={VO[3]}
        a={[R5[0] - 2, <>말은 <Am>청산유수</Am>인데,</>]}
        b={[R5[1] - 2, <>막상 해보면 <Am>못하는</Am> 사람</>]} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Person x={250} y={1520} s={1.2} color={FIG} />
        {/* sparkle strokes around the bubble */}
        {sparkle > 0 && [[110, 960, -1], [860, 945, 1], [890, 1085, 1]].map(([x, y, d], i) => (
          <g key={i} opacity={sparkle} stroke={AMBER} strokeWidth={5} strokeLinecap="round">
            <line x1={x} y1={y - 22} x2={x} y2={y - 8} />
            <line x1={x + d * 14} y1={y - 4} x2={x + d * 26} y2={y + 4} />
            <line x1={x - d * 14} y1={y - 4} x2={x - d * 24} y2={y - 10} />
          </g>
        ))}
        {/* result document — empty */}
        {doc > 0 && (
          <g opacity={doc} transform={`translate(0 ${(1 - doc) * 30})`}>
            <rect x={470} y={1150} width={480} height={370} rx={22} fill="#FFFFFF" stroke={HAIR} strokeWidth={2} />
            <text x={510} y={1214} fontSize={34} fontWeight={700} fill={INK} fontFamily={`'${SANS}', sans-serif`}>결과물</text>
            <line x1={510} y1={1238} x2={910} y2={1238} stroke={HAIR} strokeWidth={2} />
            {[1286, 1336, 1386].map((y, i) => (
              <line key={i} x1={510} y1={y} x2={i === 2 ? 760 : 910} y2={y} stroke="#D9DCE1" strokeWidth={6} strokeDasharray="14 12" strokeLinecap="round" />
            ))}
            <rect x={510} y={1440} width={300} height={16} rx={8} fill="#ECEEF1" />
            <text x={910} y={1460} fontSize={34} fontWeight={700} fill={WRONG} textAnchor="end" fontFamily={`'${SANS}', sans-serif`}>0%</text>
          </g>
        )}
      </svg>
      <Bubble f={f} at={R5[0] + 6} x={120} y={980} bg={AMBER} color="#FFFFFF" fs={42} tail="bl"
        text="완전 쉬워요, 제가 다 해봤어요!" />
    </>
  );
};

// ---------- 4위: 공은 가져가고, 책임은 넘김 ----------

const Card4: React.FC<{ f: number }> = ({ f }) => {
  const rowA = prog(f, R4[0] - 4, 14);
  const rowB = prog(f, R4[1] - 4, 14);
  const star = progIO(f, R4[0] + 6, 22);
  const blame = progIO(f, R4[1] + 18, 24);
  return (
    <>
      <Header f={f} rank={4} at={VO[4]}
        a={[R4[0] - 2, <><Am>공</Am>은 가져가고,</>]}
        b={[R4[1] - 2, <><Am>책임</Am>은 넘기는 사람</>]} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <line x1={MX} y1={1250} x2={1080 - MX} y2={1250} stroke={HAIR} strokeWidth={2} opacity={rowB} />
        {/* row A: success comes in */}
        <g opacity={rowA}>
          <Person x={230} y={1225} s={0.9} color={FIG} />
          <g transform={`translate(${lerp(900, 330, star)} ${lerp(1110, 1150, star)}) scale(${0.8 + 0.2 * star})`}>
            <circle r={40} fill={AMBER} />
            <path d="M 0 -22 L 6.5 -7 L 22 -6.5 L 10 4 L 13.5 20 L 0 11.5 L -13.5 20 L -10 4 L -22 -6.5 L -6.5 -7 Z" fill="#FFFFFF" />
          </g>
          <text x={900} y={1180} fontSize={24} fontWeight={700} fill={SUB} textAnchor="middle" opacity={1 - star}
            fontFamily={`'${SANS}', sans-serif`}>성과</text>
        </g>
        {/* row B: blame goes out */}
        <g opacity={rowB}>
          <Person x={230} y={1515} s={0.9} color={FIG} />
          <Person x={870} y={1515} s={0.9} color={FIG_SOFT} />
          <text x={870} y={1560} fontSize={26} fontWeight={700} fill={SUB} textAnchor="middle" fontFamily={`'${SANS}', sans-serif`}>김 대리</text>
          <g transform={`translate(${lerp(320, 790, blame)} 1450) rotate(${lerp(0, 12, blame)})`}>
            <rect x={-34} y={-34} width={68} height={68} rx={14} fill={WRONG} />
            <rect x={-4} y={-20} width={8} height={24} rx={4} fill="#FFFFFF" />
            <circle cx={0} cy={15} r={5} fill="#FFFFFF" />
          </g>
        </g>
      </svg>
      <Pill x={MX} y={960} text="잘됐을 때" op={rowA} />
      <Pill x={MX} y={1276} text="잘못됐을 때" op={rowB} />
      <Bubble f={f} at={R4[0] + 14} x={300} y={1010} bg={AMBER_SOFT} color={INK} fs={40} tail="bl" text="제가 한 거예요." />
      <Bubble f={f} at={R4[1] + 8} x={300} y={1300} bg={AMBER_SOFT} color={INK} fs={40} tail="bl" text="그건 김 대리가…" />
    </>
  );
};

// ---------- 3위: 회의 땐 조용, 끝나고 뒷말 ----------

const Card3: React.FC<{ f: number }> = ({ f }) => {
  const rowA = prog(f, R3[0] - 4, 14);
  const rowB = prog(f, R3[1] - 4, 14);
  const seats = [400, 540, 680, 820];
  return (
    <>
      <Header f={f} rank={3} at={VO[5]}
        a={[R3[0] - 2, <>회의 땐 <Am>조용</Am>하다가,</>]}
        b={[R3[1] - 2, <>끝나고 <Am>뒷말</Am>하는 사람</>]} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <line x1={MX} y1={1250} x2={1080 - MX} y2={1250} stroke={HAIR} strokeWidth={2} opacity={rowB} />
        {/* row A: meeting — others talk, this one stays quiet */}
        <g opacity={rowA}>
          {seats.map((x, i) => {
            const talk = i > 0 ? prog(f, R3[0] + 4 + i * 6, 10) : 0;
            return (
              <g key={i}>
                <Person x={x} y={1190} s={0.72} color={i === 0 ? AMBER : FIG_SOFT} />
                {i > 0 && talk > 0 && (
                  <g opacity={talk}>
                    <rect x={x - 38} y={1006} width={76} height={44} rx={22} fill="#FFFFFF" stroke={HAIR} strokeWidth={2} />
                    <Dots x={x} y={1028} color={FIG} r={4.5} />
                  </g>
                )}
                {i === 0 && (
                  <g opacity={prog(f, R3[0] + 16, 12)}>
                    <rect x={x - 38} y={1006} width={76} height={44} rx={22} fill="none" stroke={FIG_SOFT} strokeWidth={2} strokeDasharray="6 6" />
                  </g>
                )}
              </g>
            );
          })}
          <rect x={330} y={1168} width={560} height={30} rx={15} fill="#E2E4E8" />
        </g>
        {/* row B: after — whispering to one person */}
        <g opacity={rowB}>
          <Person x={760} y={1515} s={0.9} color={AMBER} flip />
          <Person x={880} y={1515} s={0.9} color={FIG_SOFT} />
        </g>
      </svg>
      <Pill x={MX} y={960} text="회의 중" op={rowA} />
      <Pill x={MX} y={1276} text="회의 끝나고" op={rowB} />
      <Bubble f={f} at={R3[1] + 10} x={1080 - 690} y={1330} right bg={AMBER_SOFT} color={INK} fs={36} tail="br"
        text="아까 그거, 좀 별로지 않아요?" />
    </>
  );
};

// ---------- 2위: 피드백만 하면 방어부터 ----------

const Card2: React.FC<{ f: number }> = ({ f }) => {
  const phone = prog(f, R2[0] - 10, 16);
  const replies = [R2[1] + 2, R2[1] + 20, R2[1] + 38];
  const texts = ["아니 그게 아니라요…", "제가 그렇게 한 이유가 있어요", "원래 다들 그렇게 해요"];
  return (
    <>
      <Header f={f} rank={2} at={VO[6]}
        a={[R2[0] - 2, <><Am>피드백</Am>만 하면,</>]}
        b={[R2[1] - 2, <><Am>방어</Am>부터 하는 사람</>]} />
      <div style={{ position: "absolute", left: 150, top: 950, width: 780, height: 590, borderRadius: 36, overflow: "hidden",
        background: CHAT_BG, opacity: phone, transform: `translateY(${(1 - phone) * 30}px)`, boxShadow: "0 12px 30px rgba(27,30,36,0.10)" }}>
        <div style={{ height: 76, background: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", padding: "0 30px",
          fontSize: 30, fontWeight: 700, color: INK }}>팀장님</div>
        <div style={{ position: "relative", padding: "26px 28px" }}>
          {f >= R2[0] + 2 && (
            <div style={{ display: "flex", gap: 14, opacity: prog(f, R2[0] + 2, 8), transform: `translateY(${(1 - prog(f, R2[0] + 2, 10)) * 14}px)` }}>
              <div style={{ width: 62, height: 62, borderRadius: 22, background: "#9DB3C8", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 22, color: BODY, marginBottom: 6 }}>팀장님</div>
                <div style={{ background: "#FFFFFF", color: INK, fontSize: 32, padding: "14px 20px", borderRadius: 18, borderTopLeftRadius: 4, whiteSpace: "nowrap" }}>
                  여기 숫자 하나만 다시 볼까요?
                </div>
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12, marginTop: 26 }}>
            {replies.map((at, i) =>
              f >= at ? (
                <div key={i} style={{ display: "flex", alignItems: "flex-end", gap: 8,
                  opacity: prog(f, at, 6), transform: `translateY(${(1 - prog(f, at, 8)) * 14}px)` }}>
                  <span style={{ fontSize: 18, color: BODY }}>오후 3:1{i + 2}</span>
                  <div style={{ background: KAKAO, color: INK, fontSize: 32, fontWeight: 700, padding: "14px 20px", borderRadius: 18,
                    borderTopRightRadius: 4, whiteSpace: "nowrap" }}>{texts[i]}</div>
                </div>
              ) : null,
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ---------- Suspense ----------

const Suspense: React.FC<{ f: number }> = ({ f }) => {
  const op = win(f, SUS.from, SUS.to, 18, 12);
  if (op <= 0) return null;
  const q = interpolate(f, [SUS.from + 10, SUS.from + 30], [0.7, 1], { ...clamp, easing: backOut });
  const glow = 0.5 + 0.12 * Math.sin((f - SUS.from) / 30 * Math.PI * 2 / 1.6);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", fontSize: 420, fontWeight: 900, color: AMBER, lineHeight: 1,
        opacity: prog(f, SUS.from + 10, 14), transform: `scale(${q})`, textShadow: `0 0 80px rgba(222,138,30,${glow * 0.5})` }}>?</div>
      <div style={{ position: "absolute", left: MX, right: MX, top: 1180, textAlign: "center" }}>
        <Line f={f} at={VO[7] - 2} style={{ fontSize: 56, fontWeight: 400, color: LSUB, lineHeight: 1.4 }}>그리고 가장 어려운 사람,</Line>
        <Line f={f} at={SUS_B - 2} style={{ fontSize: 80, fontWeight: 700, color: LIGHT, lineHeight: 1.3, letterSpacing: -2 }}><Am>1위</Am>는?</Line>
      </div>
    </div>
  );
};

// ---------- 1위: 안 되는 이유를 기가 막히게 찾아내는 사람 ----------

const Card1: React.FC<{ f: number }> = ({ f }) => {
  const spot = progIO(f, VO[8] - 6, 26);
  const PX = 790, PY = 1530;
  const pour = [
    { t: "안 돼요", x: 860, y: 990, at: Q[2] + 20 },
    { t: "어려워요", x: 110, y: 1400, at: Q[2] + 26 },
    { t: "그건 좀…", x: 880, y: 1110, at: Q[2] + 32 },
    { t: "규정상…", x: 320, y: 1470, at: Q[2] + 38 },
    { t: "다음에요", x: 600, y: 1190, at: Q[2] + 44 },
  ];
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="spot-cone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFE9C4" stopOpacity={0.0} />
            <stop offset="100%" stopColor="#FFE9C4" stopOpacity={0.16} />
          </linearGradient>
          <radialGradient id="spot-floor">
            <stop offset="0%" stopColor="#FFE2B0" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#FFE2B0" stopOpacity={0} />
          </radialGradient>
        </defs>
        <g opacity={spot}>
          <path d={`M ${PX - 40} 960 L ${PX + 40} 960 L ${PX + 190} ${PY} L ${PX - 190} ${PY} Z`} fill="url(#spot-cone)" />
          <ellipse cx={PX} cy={PY} rx={210} ry={44} fill="url(#spot-floor)" />
          <Person x={PX} y={PY} s={1.25} color="#C9CDD3" />
        </g>
      </svg>
      <Header f={f} rank={1} at={VO[8]} dark
        pre={[VO[8] - 2, "무슨 일이든,"]}
        a={[R1[0] - 2, <><Am>안 되는 이유</Am>를</>]}
        b={[R1[1] - 2, <>기가 막히게 잘 찾아내는 사람</>]} />
      <Bubble f={f} at={Q[0] - 2} x={MX - 20} y={1000} bg="#2C3038" color={LIGHT} fs={40} tail="r" text="예산이 없어서요." />
      <Bubble f={f} at={Q[1] - 2} x={MX - 20} y={1130} bg="#2C3038" color={LIGHT} fs={40} tail="r" text="전에 해봤는데 안 됐어요." />
      <Bubble f={f} at={Q[2] - 2} x={MX - 20} y={1260} bg="#2C3038" color={LIGHT} fs={40} tail="r" text="지금은 타이밍이 아니에요." />
      {pour.map((p, i) => (
        <Bubble key={i} f={f} at={p.at} x={p.x} y={p.y} bg="#262A31" color={LSUB} fs={28} tail="bl" text={p.t} border="rgba(242,239,232,0.10)" />
      ))}
    </>
  );
};

// ---------- Ending ----------

const Ending: React.FC<{ f: number }> = ({ f }) => {
  if (f < VO[10] - 6) return null;
  const scene = prog(f, VO[10] - 6, 18);
  const walk = progIO(f, END_D + 12, 44);
  const shut = progIO(f, END_D + 50, 18);
  const DOOR_X = 820;
  const px = lerp(330, DOOR_X, walk);
  const step = Math.sin(walk * Math.PI * 7) * 5 * (walk > 0 && walk < 1 ? 1 : 0);
  return (
    <>
      <div style={{ position: "absolute", left: MX, right: MX, top: 560 }}>
        <Line f={f} at={VO[10] - 2} style={{ fontSize: 66, fontWeight: 700, color: INK, letterSpacing: -2, lineHeight: 1.34 }}>바로 옆에 있다면,</Line>
        <Line f={f} at={END_B - 2} style={{ fontSize: 66, fontWeight: 700, color: INK, letterSpacing: -2, lineHeight: 1.34 }}>멀리 하세요.</Line>
        <div style={{ height: 60 }} />
        <Line f={f} at={VO[11] - 2} style={{ fontSize: 50, fontWeight: 400, color: SUB, lineHeight: 1.4 }}>혹시 주변에 있다면?</Line>
        <Line f={f} at={END_D - 2} style={{ fontSize: 92, fontWeight: 900, color: AMBER, letterSpacing: -3, lineHeight: 1.25 }}>당장 내보내세요.</Line>
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: scene }}>
        <line x1={MX} y1={1530} x2={1080 - MX} y2={1530} stroke={HAIR} strokeWidth={2} />
        {/* door */}
        <rect x={DOOR_X - 70} y={1290} width={140} height={240} rx={8} fill="#2A2E36" />
        <g opacity={1 - walk * 0.0}>
          <Person x={px} y={1530 - Math.abs(step)} s={0.95} color={FIG} />
        </g>
        {/* door panel swings shut over the person */}
        <rect x={DOOR_X - 70} y={1290} width={140 * lerp(0.12, 1, shut)} height={240} rx={8} fill="#E7E3DA" stroke={HAIR} strokeWidth={2} />
        <circle cx={DOOR_X - 70 + 140 * lerp(0.12, 1, shut) - 22} cy={1414} r={7} fill={SUB} opacity={shut} />
        <rect x={DOOR_X - 46} y={1248} width={92} height={32} rx={8} fill={AMBER} />
        <text x={DOOR_X} y={1273} fontSize={22} fontWeight={700} fill="#FFFFFF" textAnchor="middle" fontFamily={`'${SANS}', sans-serif`}>출구</text>
      </svg>
    </>
  );
};

// ---------- Texture ----------

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

export const HardTypes: React.FC = () => {
  const f = useCurrentFrame();
  const endFade = interpolate(f, [TOTAL - 18, TOTAL], [1, 0], clamp);
  const dk = night(f);
  const cardOp = (i: number) => win(f, CARDS[i].from, CARDS[i].to);
  const comps = [Card5, Card4, Card3, Card2, Card1];
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
      {dk > 0 && <div style={{ position: "absolute", inset: 0, background: NIGHT, opacity: dk }} />}
      <div style={{ position: "absolute", inset: 0, opacity: endFade }}>
        <Hook f={f} />
        <Title f={f} />
        <Overline f={f} />
        <Chips f={f} />
        {comps.map((C, i) => {
          const o = cardOp(i);
          return o > 0 ? (
            <div key={i} style={{ position: "absolute", inset: 0, opacity: o }}>
              <C f={f} />
            </div>
          ) : null;
        })}
        <Suspense f={f} />
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
