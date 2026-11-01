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
const INK = "#1B1E24";
const SUB = "#7C818A";
const BODY = "#3D424B";
const HAIR = "rgba(27,30,36,0.12)";
const FIG = "#5D636D";
const FIG_SOFT = "#B3B8BF";
const AMBER = "#DE8A1E";
const AMBER_SOFT = "#F7E3C6";
const STEEL = "#7F98B2";
const STEEL_D = "#5F7893";
const STEEL_SOFT = "#DCE5EE";
const CYAN = "#3FB4E6";
const WRONG = "#C2513A";
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
const pop = (f: number, at: number, dur = 12) => interpolate(f, [at, at + dur], [0.6, 1], { ...clamp, easing: backOut });
const win = (f: number, from: number, to: number, fin = 14, fout = 12) => prog(f, from, fin) * (1 - prog(f, to - fout, fout));
const FONT = `'${SANS}', sans-serif`;

export const TOTAL = 1523;
const MX = 100;

// ---------- Narration onsets (frames, from layout_vo2.py) ----------
// 0 같은 AI를 써도 · 1 그중 한 유형은 · 2 팀장님이 · 3 첫째 사이보그형 · 4 AI와 계속 · 5 둘째 켄타우로스형 · 6 역할을 나눠서
// 7 셋째 전부 맡기는형 · 8 생각을 멈추고 · 9 AI 답을 · 10 그래서 물어보면 · 11 "AI가 그랬는데요." · 12 결론
export const VO = [19, 151, 257, 366, 435, 595, 667, 847, 925, 1011, 1135, 1229, 1331];
const H1B = 66; // 일하는 방식은
const H2B = 191; // 당장 내보내야
const CY_B = 490; // 함께 문제를 풉니다
const CE_A = 704; // 일부는 AI에게 맡기고
const CE_B = 751; // 직접 감독합니다
const AL_B = 1035; // 그대로 전달하는
const CH_B = 1164; // 이렇게 답합니다
const END_A = 1374; // 라고 말하는 사람은
const END_B = 1416; // 퇴사시키세요

const SC = {
  trio: { from: 0, to: 364 },
  cy: { from: 358, to: 590 },
  ce: { from: 590, to: 840 },
  al: { from: 840, to: 1128 },
  chat: { from: 1128, to: 1320 },
  end: { from: 1320, to: TOTAL + 20 },
};

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

type Seg = { t: string; c?: string; w?: number };
type Cap = { from: number; to: number; lines: { at: number; segs: Seg[] }[] };
const CAP_TOP = 1220;

const Captions: React.FC<{ f: number; caps: Cap[] }> = ({ f, caps }) => {
  const c = caps.find((x) => f >= x.from && f < x.to);
  if (!c) return null;
  const out = clamp01((c.to - f) / 8);
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP, opacity: out }}>
      <div style={{ width: 2, height: 22, background: HAIR, marginBottom: 18 }} />
      {c.lines.map((l, i) => (
        <Line key={i} f={f} at={l.at} style={{ fontSize: 46, fontWeight: 400, lineHeight: 1.5, color: BODY }}>
          {l.segs.map((s, j) => (
            <span key={j} style={{ color: s.c ?? undefined, fontWeight: s.w ?? (s.c ? 700 : undefined) }}>{s.t}</span>
          ))}
        </Line>
      ))}
    </div>
  );
};

const CAPTIONS: Cap[] = [
  { from: 15, to: 145, lines: [{ at: 15, segs: [{ t: "같은 AI를 써도," }] }, { at: H1B - 4, segs: [{ t: "일하는 방식은 " }, { t: "세 가지", c: INK }, { t: "로 나뉩니다." }] }] },
  { from: 147, to: 250, lines: [{ at: 147, segs: [{ t: "그중 한 유형은," }] }, { at: H2B - 4, segs: [{ t: "당장 내보내야", c: AMBER }, { t: " 합니다." }] }] },
  { from: 253, to: 352, lines: [{ at: 253, segs: [{ t: "팀장님이 " }, { t: "매출 보고서", c: INK }, { t: "를 부탁했습니다." }] }] },
  { from: 362, to: 584, lines: [
    { at: 362, segs: [{ t: "첫째, " }, { t: "사이보그형.", c: INK }] },
    { at: VO[4] - 4, segs: [{ t: "AI와 " }, { t: "계속 주고받으며,", c: INK }] },
    { at: CY_B - 4, segs: [{ t: "함께 문제를 풉니다." }] },
  ] },
  { from: 591, to: 834, lines: [
    { at: 591, segs: [{ t: "둘째, " }, { t: "켄타우로스형.", c: INK }] },
    { at: VO[6] - 4, segs: [{ t: "역할을 나눠서, " }, { t: "일부는 AI에게", c: STEEL_D }, { t: " 맡기고," }] },
    { at: CE_B - 4, segs: [{ t: "직접 감독", c: AMBER }, { t: "합니다." }] },
  ] },
  { from: 843, to: 1004, lines: [
    { at: 843, segs: [{ t: "셋째, " }, { t: "전부 맡기는형.", c: INK }] },
    { at: VO[8] - 4, segs: [{ t: "생각을 멈추고", c: WRONG }, { t: ", 관여하지 않습니다." }] },
  ] },
  { from: 1006, to: 1124, lines: [
    { at: VO[9] - 4, segs: [{ t: "AI 답을," }] },
    { at: AL_B - 4, segs: [{ t: "그대로 전달", c: WRONG }, { t: "하는 사람이죠." }] },
  ] },
  { from: 1131, to: 1316, lines: [
    { at: VO[10] - 4, segs: [{ t: "그래서 물어보면," }] },
    { at: CH_B - 4, segs: [{ t: "이렇게 답합니다." }] },
  ] },
];

// ---------- Overline + type chips ----------

const OVER = [
  { ...SC.trio, tag: "AI × WORK", text: "AI와 일하는 방식", n: 0 },
  { ...SC.cy, tag: "TYPE 01", text: "사이보그형", n: 1 },
  { ...SC.ce, tag: "TYPE 02", text: "켄타우로스형", n: 2 },
  { ...SC.al, tag: "TYPE 03", text: "전부 맡기는형", n: 3 },
  { ...SC.chat, tag: "TYPE 03", text: "전부 맡기는형", n: 3 },
];

const Overline: React.FC<{ f: number }> = ({ f }) => {
  const o = OVER.find((x) => f >= x.from && f < x.to);
  if (!o) return null;
  const same = OVER.find((x) => x.to === o.from && x.tag === o.tag);
  const later = OVER.find((x) => x.from === o.to && x.tag === o.tag);
  const p = (same ? 1 : prog(f, o.from + 4, 18)) * (later ? 1 : 1 - prog(f, o.to - 12, 12));
  const color = o.n === 3 ? WRONG : o.n === 1 || o.n === 2 ? STEEL_D : AMBER;
  return (
    <div style={{ position: "absolute", left: MX, top: 340, display: "flex", alignItems: "center", gap: 16, opacity: p }}>
      <div style={{ width: 36, height: 2, background: color }} />
      <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color }}>{o.tag}</span>
      <span style={{ fontSize: 26, fontWeight: 700, color: INK }}>{o.text}</span>
    </div>
  );
};

const Chips: React.FC<{ f: number }> = ({ f }) => {
  const op = prog(f, SC.cy.from, 16) * (1 - prog(f, SC.chat.to - 12, 12));
  if (op <= 0) return null;
  const n = OVER.find((x) => f >= x.from && f < x.to)?.n ?? 0;
  return (
    <div style={{ position: "absolute", right: MX, top: 322, display: "flex", gap: 12, opacity: op }}>
      {[1, 2, 3].map((k) => {
        const on = k === n;
        const bg = on ? (k === 3 ? WRONG : STEEL_D) : k < n ? "#E6E8EC" : "rgba(0,0,0,0)";
        return (
          <div key={k} style={{ width: 62, height: 62, borderRadius: 18, background: bg, boxSizing: "border-box",
            border: `2px solid ${on ? bg : "rgba(27,30,36,0.14)"}`, color: on ? "#FFFFFF" : SUB,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700 }}>{k}</div>
        );
      })}
    </div>
  );
};

// ---------- Drawing primitives ----------

const Person: React.FC<{ x: number; y: number; color: string; s?: number }> = ({ x, y, color, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <line x1={-9} y1={-52} x2={-11} y2={-4} stroke={color} strokeWidth={14} strokeLinecap="round" />
    <line x1={9} y1={-52} x2={11} y2={-4} stroke={color} strokeWidth={14} strokeLinecap="round" />
    <rect x={-21} y={-118} width={42} height={72} rx={18} fill={color} />
    <line x1={-21} y1={-104} x2={-28} y2={-62} stroke={color} strokeWidth={11} strokeLinecap="round" />
    <line x1={21} y1={-104} x2={28} y2={-62} stroke={color} strokeWidth={11} strokeLinecap="round" />
    <circle cx={0} cy={-140} r={20} fill={color} />
  </g>
);

const Doc: React.FC<{ x: number; y: number; s?: number; op?: number; title?: string }> = ({ x, y, s = 1, op = 1, title }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={op}>
    <rect x={-40} y={-52} width={80} height={104} rx={10} fill="#FFFFFF" stroke={HAIR} strokeWidth={2.5} />
    <rect x={-26} y={-34} width={34} height={8} rx={4} fill={INK} opacity={0.75} />
    {[-14, 0, 14].map((yy, i) => <rect key={i} x={-26} y={yy} width={i === 2 ? 34 : 52} height={6} rx={3} fill="#D7DADF" />)}
    <rect x={-26} y={26} width={10} height={14} rx={2} fill={AMBER} />
    <rect x={-12} y={20} width={10} height={20} rx={2} fill={AMBER} />
    <rect x={2} y={30} width={10} height={10} rx={2} fill={AMBER} />
    {title && <text x={0} y={80} fontSize={20} fontWeight={700} fill={SUB} textAnchor="middle" fontFamily={FONT}>{title}</text>}
  </g>
);

// ---------- Scene: trio at desks (hook + task) ----------

const DESK_X = [230, 540, 850];

const Trio: React.FC<{ f: number }> = ({ f }) => {
  const op = win(f, SC.trio.from, SC.trio.to, 1, 14);
  if (op <= 0) return null;
  const q = prog(f, H2B + 4, 16);
  const card = prog(f, VO[2], 16);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: op }}>
      {/* boss's request card, then three copies to each desk */}
      {card > 0 && (
        <g>
          <g opacity={card * (1 - prog(f, VO[2] + 34, 10))} transform={`translate(540 ${lerp(600, 580, card)})`}>
            <rect x={-200} y={-58} width={400} height={116} rx={22} fill="#FFFFFF" stroke={HAIR} strokeWidth={2} />
            <Doc x={-140} y={0} s={0.72} />
            <text x={-90} y={-6} fontSize={34} fontWeight={700} fill={INK} fontFamily={FONT}>매출 보고서</text>
            <text x={-90} y={34} fontSize={24} fill={SUB} fontFamily={FONT}>팀장님 요청</text>
          </g>
          {DESK_X.map((x, i) => {
            const t = progIO(f, VO[2] + 30 + i * 4, 22);
            if (t <= 0) return null;
            return <Doc key={i} x={lerp(400, x + 92, t)} y={lerp(580, 962, t)} s={lerp(0.72, 0.4, t)} op={clamp01(t * 3)} />;
          })}
        </g>
      )}
      {DESK_X.map((x, i) => {
        const a = prog(f, VO[0] + 6 + i * 6, 16);
        const isQ = i === 2;
        return (
          <g key={i} opacity={a} transform={`translate(0 ${(1 - a) * 16})`}>
            <Person x={x} y={1080} s={1.3} color={isQ ? interpolateColors(q, [0, 1], [FIG, "#3F444C"]) : FIG} />
            {/* desk + laptop (seen from behind) */}
            <rect x={x - 130} y={990} width={260} height={14} rx={7} fill="#D9D4C9" />
            <rect x={x - 58} y={942} width={116} height={52} rx={8} fill="#E8E6E1" stroke={HAIR} strokeWidth={2} />
            <circle cx={x} cy={968} r={6} fill="#CFCBC2" />
            <rect x={x - 6} y={1004} width={12} height={90} fill="#D9D4C9" />
            {isQ && q > 0 && (
              <text x={x} y={820 - 10 * q} fontSize={84} fontWeight={900} fill={AMBER} textAnchor="middle" opacity={q} fontFamily={FONT}>?</text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ---------- Scene: cyborg ----------

const Cyborg: React.FC<{ f: number; x: number; y: number; s: number; glow: number }> = ({ f, x, y, s, glow }) => {
  const hum = FIG;
  const blink = 0.65 + 0.35 * glow;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <clipPath id="cy-left"><rect x={-200} y={-420} width={200} height={440} /></clipPath>
        <clipPath id="cy-right"><rect x={0} y={-420} width={220} height={440} /></clipPath>
        <radialGradient id="cy-glow">
          <stop offset="0%" stopColor={CYAN} stopOpacity={0.45} />
          <stop offset="100%" stopColor={CYAN} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* legs: human left, robotic right */}
      <line x1={-18} y1={-110} x2={-22} y2={-6} stroke={hum} strokeWidth={26} strokeLinecap="round" />
      <line x1={18} y1={-110} x2={24} y2={-58} stroke={STEEL} strokeWidth={24} strokeLinecap="round" />
      <line x1={24} y1={-58} x2={22} y2={-6} stroke={STEEL_D} strokeWidth={20} strokeLinecap="round" />
      <circle cx={24} cy={-58} r={11} fill={STEEL_D} stroke="#FFFFFF" strokeWidth={3} />
      <rect x={6} y={-10} width={38} height={12} rx={5} fill={STEEL_D} />
      {/* human arm (left) */}
      <line x1={-46} y1={-232} x2={-64} y2={-136} stroke={hum} strokeWidth={22} strokeLinecap="round" />
      {/* torso: split */}
      <g clipPath="url(#cy-left)"><rect x={-50} y={-252} width={100} height={150} rx={40} fill={hum} /></g>
      <g clipPath="url(#cy-right)">
        <rect x={-50} y={-252} width={100} height={150} rx={40} fill={STEEL} />
        <line x1={6} y1={-214} x2={50} y2={-214} stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={3} />
        <line x1={6} y1={-150} x2={50} y2={-150} stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={3} />
        <circle cx={26} cy={-184} r={9} fill={CYAN} opacity={blink} />
      </g>
      {/* robotic arm (right), reaching out */}
      <line x1={46} y1={-232} x2={96} y2={-186} stroke={STEEL} strokeWidth={22} strokeLinecap="round" />
      <circle cx={46} cy={-232} r={13} fill={STEEL_D} stroke="#FFFFFF" strokeWidth={3} />
      <circle cx={96} cy={-186} r={11} fill={STEEL_D} stroke="#FFFFFF" strokeWidth={3} />
      <line x1={96} y1={-186} x2={150} y2={-210} stroke={STEEL_D} strokeWidth={18} strokeLinecap="round" />
      <path d="M 152 -222 L 172 -232 M 156 -210 L 178 -212 M 152 -198 L 170 -190" stroke={STEEL_D} strokeWidth={7} strokeLinecap="round" />
      {/* head: split */}
      <g clipPath="url(#cy-left)"><circle cx={0} cy={-300} r={44} fill={hum} /></g>
      <g clipPath="url(#cy-right)">
        <circle cx={0} cy={-300} r={44} fill={STEEL} />
        <path d="M 4 -322 L 44 -322" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={3} />
        <circle cx={20} cy={-298} r={18} fill="url(#cy-glow)" opacity={glow} />
        <circle cx={20} cy={-298} r={8} fill={CYAN} opacity={blink} />
        <line x1={14} y1={-344} x2={22} y2={-368} stroke={STEEL_D} strokeWidth={5} strokeLinecap="round" />
        <circle cx={22} cy={-370} r={6} fill={CYAN} opacity={blink} />
      </g>
      {/* glowing seam */}
      <line x1={0} y1={-352} x2={0} y2={-104} stroke={CYAN} strokeWidth={4} strokeDasharray="10 8" opacity={0.5 + 0.5 * glow} />
    </g>
  );
};

const CyScene: React.FC<{ f: number }> = ({ f }) => {
  const op = win(f, SC.cy.from, SC.cy.to, 16, 12);
  if (op <= 0) return null;
  const fig = prog(f, VO[3] - 6, 18);
  const msgs = [
    { at: VO[4] + 4, me: true, t: "매출이 왜 줄었을까?" },
    { at: VO[4] + 30, me: false, t: "원인 3가지를 찾았어요" },
    { at: CY_B + 2, me: true, t: "2번은 우리랑 안 맞아, 다시" },
    { at: CY_B + 30, me: false, t: "반영해서 수정했어요" },
  ];
  const lastAi = Math.max(...msgs.filter((m) => !m.me && f >= m.at).map((m) => m.at), -999);
  const glow = 0.25 + 0.75 * clamp01(1 - (f - lastAi) / 40);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g opacity={fig} transform={`translate(0 ${(1 - fig) * 20})`}>
          <ellipse cx={230} cy={1128} rx={120} ry={16} fill="rgba(27,30,36,0.06)" />
          <Cyborg f={f} x={230} y={1124} s={1.55} glow={glow} />
        </g>
        {/* sync dots from the robotic hand toward the chat */}
        {[0, 1, 2].map((k) => {
          const ph = ((f - VO[4]) / 24 + k / 3) % 1;
          return f >= VO[4] ? <circle key={k} cx={lerp(500, 560, ph)} cy={lerp(790, 760, ph)} r={6} fill={CYAN} opacity={0.6 * Math.sin(Math.PI * ph)} /> : null;
        })}
      </svg>
      <div style={{ position: "absolute", left: 560, right: MX - 10, top: 560, display: "flex", flexDirection: "column", gap: 18 }}>
        {msgs.map((m, i) =>
          f >= m.at ? (
            <div key={i} style={{ alignSelf: m.me ? "flex-end" : "flex-start", display: "flex", alignItems: "center", gap: 10,
              opacity: prog(f, m.at, 8), transform: `translateY(${(1 - prog(f, m.at, 10)) * 14}px)` }}>
              {!m.me && <div style={{ width: 44, height: 44, borderRadius: 14, background: STEEL, color: "#FFFFFF", fontSize: 18, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>AI</div>}
              <div style={{ background: m.me ? AMBER_SOFT : STEEL_SOFT, color: INK, fontSize: 28, fontWeight: 700,
                padding: "14px 20px", borderRadius: 20, whiteSpace: "nowrap",
                borderTopRightRadius: m.me ? 6 : 20, borderTopLeftRadius: m.me ? 20 : 6 }}>{m.t}</div>
            </div>
          ) : null,
        )}
      </div>
      {f >= CY_B + 44 && (
        <div style={{ position: "absolute", left: 560, top: 1040, opacity: prog(f, CY_B + 44, 12), transform: `scale(${pop(f, CY_B + 44)})`, transformOrigin: "left center",
          padding: "10px 24px", borderRadius: 26, background: STEEL_D, color: "#FFFFFF", fontSize: 30, fontWeight: 700 }}>함께 생각</div>
      )}
    </div>
  );
};

// ---------- Scene: centaur ----------

const Centaur: React.FC<{ f: number; x: number; y: number; s: number; trot: number; check: number; split: number }> = ({ f, x, y, s, trot, check, split }) => {
  const legs = [-118, -78, 52, 92];
  const ph = (f / 30) * Math.PI * 2 * 1.4;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* cable tail */}
      <path d="M -150 -180 C -200 -170 -200 -120 -214 -96" fill="none" stroke={STEEL_D} strokeWidth={8} strokeLinecap="round" />
      <circle cx={-214} cy={-92} r={8} fill={CYAN} />
      {/* robotic legs */}
      {legs.map((lx, i) => {
        const sw = trot * Math.sin(ph + (i % 2 === 0 ? 0 : Math.PI) + (i > 1 ? Math.PI / 2 : 0));
        const kx = lx + 12 + 10 * sw;
        const fx = lx + 16 * sw;
        const lift = Math.max(0, sw) * 10 * trot;
        return (
          <g key={i}>
            <line x1={lx} y1={-118} x2={kx} y2={-60} stroke={STEEL} strokeWidth={20} strokeLinecap="round" />
            <line x1={kx} y1={-60} x2={fx} y2={-4 - lift} stroke={STEEL_D} strokeWidth={16} strokeLinecap="round" />
            <circle cx={kx} cy={-60} r={9} fill={STEEL_D} stroke="#FFFFFF" strokeWidth={3} />
            <rect x={fx - 14} y={-8 - lift} width={28} height={10} rx={4} fill={STEEL_D} />
          </g>
        );
      })}
      {/* machine body */}
      <rect x={-155} y={-205} width={290} height={100} rx={46} fill={STEEL} />
      <line x1={-20} y1={-200} x2={-20} y2={-110} stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={3} />
      <text x={-88} y={-138} fontSize={40} fontWeight={900} fill="#FFFFFF" textAnchor="middle" fontFamily={FONT}>AI</text>
      <circle cx={30} cy={-156} r={8} fill={CYAN} />
      <circle cx={56} cy={-156} r={8} fill={CYAN} opacity={0.6} />
      {/* the work the machine carries: a report on its back */}
      <g transform="translate(-60 -246)">
        <rect x={-34} y={-38} width={68} height={80} rx={8} fill="#FFFFFF" stroke={HAIR} strokeWidth={2.5} />
        {[-22, -8, 6].map((yy, i) => <rect key={i} x={-22} y={yy} width={i === 2 ? 26 : 44} height={6} rx={3} fill="#D7DADF" />)}
        <rect x={-22} y={20} width={9} height={12} rx={2} fill={AMBER} />
        <rect x={-9} y={14} width={9} height={18} rx={2} fill={AMBER} />
        {check > 0 && (
          <g opacity={check}>
            <circle cx={26} cy={-34} r={22 * pop(check * 12, 0)} fill={AMBER} />
            <path d="M 15 -34 L 23 -26 L 37 -42" fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={40} strokeDashoffset={40 * (1 - check)} />
          </g>
        )}
      </g>
      {/* human upper body on the front */}
      <line x1={92} y1={-318} x2={lerp(70, 10, check)} y2={lerp(-240, -262, check)} stroke={FIG} strokeWidth={20} strokeLinecap="round" />
      <rect x={78} y={-344} width={66} height={150} rx={30} fill={FIG} />
      <line x1={138} y1={-318} x2={168} y2={-236} stroke={FIG} strokeWidth={20} strokeLinecap="round" />
      <circle cx={111} cy={-386} r={34} fill={FIG} />
      {/* waist joint: where the person meets the machine */}
      <rect x={70} y={-214} width={82} height={20} rx={10} fill={AMBER} opacity={0.35 + 0.65 * split} />
    </g>
  );
};

const CeScene: React.FC<{ f: number }> = ({ f }) => {
  const op = win(f, SC.ce.from, SC.ce.to, 16, 12);
  if (op <= 0) return null;
  const fig = prog(f, VO[5] - 6, 18);
  const split = prog(f, VO[6] + 4, 16);
  const lowL = prog(f, CE_A + 2, 14);
  const upL = prog(f, CE_B + 2, 14);
  const trot = progIO(f, CE_A + 6, 20);
  const check = prog(f, CE_B + 14, 16);
  const X = 330, Y = 1120, S = 1.3;
  const P = (px: number, py: number) => [X + px * S, Y + py * S];
  const [hx, hy] = P(150, -330);
  const [bx, by] = P(120, -160);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g opacity={fig} transform={`translate(0 ${(1 - fig) * 20})`}>
          <ellipse cx={X - 20} cy={Y + 6} rx={260} ry={18} fill="rgba(27,30,36,0.06)" />
          <Centaur f={f} x={X} y={Y} s={S} trot={trot} check={check} split={split} />
        </g>
        {upL > 0 && <line x1={hx + 10} y1={hy} x2={640} y2={705} stroke={AMBER} strokeWidth={3} strokeDasharray="6 6" opacity={upL} />}
        {lowL > 0 && <line x1={bx + 20} y1={by} x2={640} y2={925} stroke={STEEL_D} strokeWidth={3} strokeDasharray="6 6" opacity={lowL} />}
      </svg>
      {upL > 0 && (
        <div style={{ position: "absolute", left: 640, top: 660, opacity: upL, transform: `scale(${pop(f, CE_B + 2)})`, transformOrigin: "left center" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: AMBER, letterSpacing: 2, marginBottom: 6 }}>사람</div>
          <div style={{ padding: "12px 24px", borderRadius: 24, background: AMBER_SOFT, color: INK, fontSize: 34, fontWeight: 700, whiteSpace: "nowrap" }}>판단 · 감독</div>
        </div>
      )}
      {lowL > 0 && (
        <div style={{ position: "absolute", left: 640, top: 880, opacity: lowL, transform: `scale(${pop(f, CE_A + 2)})`, transformOrigin: "left center" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: STEEL_D, letterSpacing: 2, marginBottom: 6 }}>AI</div>
          <div style={{ padding: "12px 24px", borderRadius: 24, background: STEEL_SOFT, color: INK, fontSize: 34, fontWeight: 700, whiteSpace: "nowrap" }}>자료 · 초안</div>
        </div>
      )}
      {f >= CE_B + 34 && (
        <div style={{ position: "absolute", left: 640, top: 1060, opacity: prog(f, CE_B + 34, 12), transform: `scale(${pop(f, CE_B + 34)})`, transformOrigin: "left center",
          padding: "10px 24px", borderRadius: 26, background: STEEL_D, color: "#FFFFFF", fontSize: 30, fontWeight: 700 }}>나눠서 감독</div>
      )}
    </div>
  );
};

// ---------- Scene: hands everything over ----------

const AiBox: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <line x1={0} y1={-96} x2={0} y2={-120} stroke={STEEL_D} strokeWidth={6} strokeLinecap="round" />
    <circle cx={0} cy={-124} r={8} fill={CYAN} />
    <rect x={-86} y={-96} width={172} height={150} rx={34} fill={STEEL} />
    <rect x={-62} y={-70} width={124} height={70} rx={20} fill={STEEL_D} />
    <circle cx={-26} cy={-35} r={10} fill={CYAN} />
    <circle cx={26} cy={-35} r={10} fill={CYAN} />
    <text x={0} y={36} fontSize={30} fontWeight={900} fill="#FFFFFF" textAnchor="middle" fontFamily={FONT}>AI</text>
  </g>
);

const AlScene: React.FC<{ f: number }> = ({ f }) => {
  const op = win(f, SC.al.from, SC.al.to, 16, 12);
  if (op <= 0) return null;
  const a = prog(f, VO[7] - 6, 18);
  const off = prog(f, VO[8] + 4, 18);
  const PX = 540, AX = 210, BX = 870;
  const t1 = progIO(f, VO[9] + 6, 22);
  const t2 = progIO(f, AL_B + 4, 24);
  const docX = t2 > 0 ? lerp(PX, BX - 70, t2) : lerp(AX + 90, PX, t1);
  const docY = t2 > 0 ? 930 - Math.sin(Math.PI * t2) * 40 : 930 - Math.sin(Math.PI * t1) * 40;
  const docOp = prog(f, VO[9] + 2, 8);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g opacity={a}>
          <AiBox x={AX} y={1030} />
          <Person x={PX} y={1100} s={1.2} color={interpolateColors(off, [0, 1], [FIG, FIG_SOFT])} />
          <Person x={BX} y={1100} s={1.2} color={FIG} />
          <text x={BX} y={1150} fontSize={26} fontWeight={700} fill={SUB} textAnchor="middle" fontFamily={FONT}>팀장님</text>
          {/* thought bubble: thinking → empty */}
          <g transform={`translate(${PX} 760)`}>
            <circle cx={-14} cy={84} r={7} fill="none" stroke={interpolateColors(off, [0, 1], [FIG, FIG_SOFT])} strokeWidth={3} strokeDasharray={off > 0.5 ? "4 4" : undefined} />
            <circle cx={-26} cy={64} r={11} fill="none" stroke={interpolateColors(off, [0, 1], [FIG, FIG_SOFT])} strokeWidth={3} strokeDasharray={off > 0.5 ? "5 5" : undefined} />
            <rect x={-90} y={-60} width={180} height={104} rx={50} fill="#FFFFFF" fillOpacity={1 - off * 0.6}
              stroke={interpolateColors(off, [0, 1], [FIG, FIG_SOFT])} strokeWidth={3} strokeDasharray={off > 0.5 ? "10 9" : undefined} />
            <g opacity={1 - off}>
              <circle cx={-30} cy={-8} r={9} fill={AMBER} />
              <circle cx={0} cy={-8} r={9} fill={AMBER} />
              <circle cx={30} cy={-8} r={9} fill={AMBER} />
            </g>
          </g>
        </g>
        {docOp > 0 && <Doc x={docX} y={docY} s={0.8} op={docOp} />}
      </svg>
      {off > 0 && (
        <div style={{ position: "absolute", left: PX + 110, top: 712, opacity: off, padding: "8px 18px", borderRadius: 20,
          background: "#ECEDF0", color: SUB, fontSize: 24, fontWeight: 700 }}>생각 OFF</div>
      )}
      {f >= VO[9] + 8 && (
        <div style={{ position: "absolute", left: (AX + PX) / 2 - 50, top: 1120, opacity: prog(f, VO[9] + 8, 10), transform: `scale(${pop(f, VO[9] + 8)})`,
          padding: "8px 20px", borderRadius: 20, background: "#FFFFFF", border: `2px solid ${HAIR}`, color: BODY, fontSize: 26, fontWeight: 700 }}>복사</div>
      )}
      {f >= AL_B + 8 && (
        <div style={{ position: "absolute", left: (PX + BX) / 2 - 110, top: 1120, opacity: prog(f, AL_B + 8, 10), transform: `scale(${pop(f, AL_B + 8)})`,
          padding: "8px 20px", borderRadius: 20, background: "#FFFFFF", border: `2px solid ${HAIR}`, color: BODY, fontSize: 26, fontWeight: 700, whiteSpace: "nowrap" }}>붙여넣기 · 전송</div>
      )}
      {f >= AL_B + 40 && (
        <div style={{ position: "absolute", left: MX, top: 470, opacity: prog(f, AL_B + 40, 12), transform: `scale(${pop(f, AL_B + 40)})`, transformOrigin: "left center",
          padding: "10px 24px", borderRadius: 26, background: WRONG, color: "#FFFFFF", fontSize: 30, fontWeight: 700 }}>그대로 전달</div>
      )}
    </div>
  );
};

// ---------- Scene: "AI가 그랬는데요." ----------

const ChatScene: React.FC<{ f: number }> = ({ f }) => {
  const op = win(f, SC.chat.from, SC.chat.to, 16, 12);
  if (op <= 0) return null;
  const inAt = VO[10] + 8;
  const typing = f >= VO[11] - 34 && f < VO[11];
  const ring = prog(f, VO[11] + 14, 16);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      <div style={{ position: "absolute", left: 140, top: 470, width: 800, height: 560, borderRadius: 40, overflow: "hidden",
        background: CHAT_BG, boxShadow: "0 12px 30px rgba(27,30,36,0.10)" }}>
        <div style={{ height: 84, background: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", padding: "0 34px",
          fontSize: 32, fontWeight: 700, color: INK }}>팀장님</div>
        <div style={{ padding: "34px 32px" }}>
          {f >= inAt && (
            <div style={{ display: "flex", gap: 16, opacity: prog(f, inAt, 8), transform: `translateY(${(1 - prog(f, inAt, 10)) * 14}px)` }}>
              <div style={{ width: 70, height: 70, borderRadius: 24, background: "#9DB3C8", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 24, color: BODY, marginBottom: 8 }}>팀장님</div>
                <div style={{ background: "#FFFFFF", color: INK, fontSize: 36, padding: "16px 24px", borderRadius: 20, borderTopLeftRadius: 4, whiteSpace: "nowrap" }}>
                  이 숫자, 어디서 나온 거예요?
                </div>
              </div>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 60 }}>
            {typing && (
              <div style={{ background: KAKAO, padding: "22px 26px", borderRadius: 22, borderTopRightRadius: 4, display: "flex", gap: 10, opacity: prog(f, VO[11] - 34, 8) }}>
                {[0, 1, 2].map((k) => (
                  <div key={k} style={{ width: 12, height: 12, borderRadius: 6, background: INK,
                    opacity: 0.3 + 0.5 * clamp01(Math.sin(((f - VO[11]) / 30) * Math.PI * 2 * 1.2 - k * 0.9) * 0.5 + 0.5) }} />
                ))}
              </div>
            )}
            {f >= VO[11] && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, opacity: prog(f, VO[11], 6), transform: `scale(${pop(f, VO[11], 10)})`, transformOrigin: "right bottom" }}>
                <span style={{ fontSize: 20, color: BODY }}>오후 4:07</span>
                <div style={{ background: KAKAO, color: INK, fontSize: 48, fontWeight: 700, padding: "20px 30px", borderRadius: 24,
                  borderTopRightRadius: 4, whiteSpace: "nowrap", boxShadow: `0 0 0 ${6 * ring}px rgba(194,81,58,${0.55 * ring})` }}>AI가 그랬는데요.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Ending ----------

const Ending: React.FC<{ f: number }> = ({ f }) => {
  if (f < SC.end.from) return null;
  const card = prog(f, VO[12] + 10, 18);
  const st = f >= END_B + 6 ? interpolate(f, [END_B + 6, END_B + 16], [1.6, 1], { ...clamp, easing: Easing.out(Easing.quad) }) : 0;
  return (
    <>
      <div style={{ position: "absolute", left: MX, right: MX, top: 560 }}>
        <Line f={f} at={VO[12] - 4} style={{ fontSize: 76, fontWeight: 900, color: WRONG, letterSpacing: -2, lineHeight: 1.3 }}>“AI가 그랬는데요”</Line>
        <Line f={f} at={END_A - 2} style={{ fontSize: 58, fontWeight: 700, color: BODY, letterSpacing: -1.5, lineHeight: 1.4 }}>라고 말하는 사람은,</Line>
        <Line f={f} at={END_B - 2} style={{ fontSize: 120, fontWeight: 900, color: INK, letterSpacing: -4, lineHeight: 1.2 }}>퇴사시키세요.</Line>
      </div>
      {card > 0 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: card }}>
          <g transform={`translate(540 ${lerp(1250, 1230, card)})`}>
            <path d="M -40 -40 L -16 -110 M 40 -40 L 16 -110" stroke={STEEL} strokeWidth={10} strokeLinecap="round" />
            <rect x={-150} y={-46} width={300} height={250} rx={24} fill="#FFFFFF" stroke={HAIR} strokeWidth={2.5} />
            <rect x={-30} y={-34} width={60} height={12} rx={6} fill="#E3E5E9" />
            <circle cx={-70} cy={60} r={42} fill="#E6E8EC" />
            <circle cx={-70} cy={48} r={16} fill={FIG_SOFT} />
            <path d="M -98 92 Q -70 66 -42 92" fill={FIG_SOFT} />
            <rect x={0} y={34} width={110} height={16} rx={8} fill={INK} opacity={0.75} />
            <rect x={0} y={66} width={80} height={12} rx={6} fill="#D7DADF" />
            <text x={0} y={160} fontSize={28} fontWeight={700} fill={SUB} textAnchor="middle" fontFamily={FONT}>사원증</text>
            {st > 0 && (
              <g transform={`translate(70 120) rotate(-14) scale(${st})`} opacity={clamp01((1.6 - st) / 0.6 + 0.2)}>
                <rect x={-80} y={-40} width={160} height={80} rx={14} fill="none" stroke={WRONG} strokeWidth={7} />
                <text x={0} y={18} fontSize={50} fontWeight={900} fill={WRONG} textAnchor="middle" fontFamily={FONT}>퇴사</text>
              </g>
            )}
          </g>
        </svg>
      )}
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

export const AiThree: React.FC = () => {
  const f = useCurrentFrame();
  const endFade = interpolate(f, [TOTAL - 18, TOTAL], [1, 0], clamp);
  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      background: BG, fontFamily: FONT,
    }}>
      <FontLoader />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 80% 55% at 50% 46%, #FFFFFF 0%, rgba(246,244,239,0) 70%)",
      }} />
      <div style={{ position: "absolute", inset: 0, opacity: endFade }}>
        <Overline f={f} />
        <Chips f={f} />
        <Trio f={f} />
        <CyScene f={f} />
        <CeScene f={f} />
        <AlScene f={f} />
        <ChatScene f={f} />
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
