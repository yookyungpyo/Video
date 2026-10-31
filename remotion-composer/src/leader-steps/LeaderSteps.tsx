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
const FIG = "#2F3540";
const FOLLOW = "#8A929E";
const AMBER = "#DE8A1E";
const AMBER_SOFT = "#F7E3C6";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
const progIO = (f: number, at: number, dur: number) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeInOut });

export const TOTAL = 1295;
const MX = 100;

// ---------- Narration onsets (frames, from layout_vo2.py) ----------
// 0 intro · 1 지위 · 2 관계 · 3 성과 · 4 완성 · 5 conclusion
export const VO = [18, 145, 444, 702, 908, 1093];
const L1_TITLE = 226; // "사람들은 직함을 보고 따릅니다"
const L1_SEAT = 300; // "그 자리 자체가, … 인정받았다는 뜻입니다"
const L2_LIKE = 519; // "이제는 좋아서 따릅니다"
const L2_TALK = 580; // "공감하고 소통하며, …"
const L3_DO = 778; // "쌓은 관계 위에서, 함께 결과를…"
const L4_GROW = 985; // "다른 사람을, 리더로 키워 냅니다"
const END2 = 1146; // "사람을 키울 때 완성됩니다"

// ---------- Staircase ----------
const BASE_Y = 1120;
const STEPS = [
  { n: "1단계", name: "지위", x: 110, y: 1000 },
  { n: "2단계", name: "관계", x: 327, y: 880 },
  { n: "3단계", name: "성과", x: 544, y: 760 },
  { n: "4단계", name: "완성", x: 761, y: 640 },
];
const SW = 210;
const spot = (i: number, dx = 0) => ({ x: STEPS[i].x + SW / 2 + dx, y: STEPS[i].y });
const CLIMB_AT = [VO[1] + 4, VO[2] + 4, VO[3] + 4, VO[4] + 4];

// a hop between two points with a small arc
const hop = (f: number, at: number, a: { x: number; y: number }, b: { x: number; y: number }, dur = 22) => {
  const p = progIO(f, at, dur);
  return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) - Math.sin(p * Math.PI) * 54, p };
};
const leaderPos = (f: number) => {
  let pos = { x: 40, y: BASE_Y };
  let prev = pos;
  for (let i = 0; i < 4; i++) {
    if (f < CLIMB_AT[i]) break;
    const target = spot(i);
    const h = hop(f, CLIMB_AT[i], prev, target);
    pos = { x: h.x, y: h.y };
    prev = target;
  }
  return pos;
};
const level = (f: number) => CLIMB_AT.reduce((n, at) => (f >= at ? n + 1 : n), 0);

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
const CAP_TOP = 1220;

const Captions: React.FC<{ f: number; caps: Cap[] }> = ({ f, caps }) => {
  const c = caps.find((x) => f >= x.from && f < x.to);
  if (!c) return null;
  const out = clamp01((c.to - f) / 8);
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
  { from: VO[0] - 4, to: VO[1] - 6, lines: [
    { at: VO[0] - 4, segs: [{ t: "존 맥스웰은 리더십에" }] },
    { at: VO[0] + 40, segs: [{ t: "단계", c: INK }, { t: "가 있다고 말합니다." }] },
  ] },
  { from: VO[1] - 4, to: L1_SEAT - 4, lines: [
    { at: VO[1] - 4, segs: [{ t: "1단계, ", c: AMBER }, { t: "지위의 리더.", c: INK }] },
    { at: L1_TITLE - 2, segs: [{ t: "사람들은 " }, { t: "직함", c: INK }, { t: "을 보고 따릅니다." }] },
  ] },
  { from: L1_SEAT - 4, to: VO[2] - 6, lines: [
    { at: L1_SEAT - 4, segs: [{ t: "그 자리 자체가," }] },
    { at: L1_SEAT + 30, segs: [{ t: "당신의 능력을 " }, { t: "인정받았다", c: INK }, { t: "는 뜻입니다." }] },
  ] },
  { from: VO[2] - 4, to: L2_TALK - 4, lines: [
    { at: VO[2] - 4, segs: [{ t: "2단계, ", c: AMBER }, { t: "관계의 리더.", c: INK }] },
    { at: L2_LIKE - 2, segs: [{ t: "이제는 " }, { t: "좋아서", c: INK }, { t: " 따릅니다." }] },
  ] },
  { from: L2_TALK - 4, to: VO[3] - 6, lines: [
    { at: L2_TALK - 4, segs: [{ t: "공감하고 소통하며," }] },
    { at: L2_TALK + 40, segs: [{ t: "마음을 움직입니다.", c: INK }] },
  ] },
  { from: VO[3] - 4, to: VO[4] - 6, lines: [
    { at: VO[3] - 4, segs: [{ t: "3단계, ", c: AMBER }, { t: "성과의 리더.", c: INK }] },
    { at: L3_DO - 2, segs: [{ t: "쌓은 관계 위에서," }] },
    { at: L3_DO + 46, segs: [{ t: "함께 결과", c: INK }, { t: "를 만들어 냅니다." }] },
  ] },
  { from: VO[4] - 4, to: VO[5] - 6, lines: [
    { at: VO[4] - 4, segs: [{ t: "4단계, ", c: AMBER }, { t: "완성된 리더.", c: INK }] },
    { at: L4_GROW - 2, segs: [{ t: "다른 사람을," }] },
    { at: L4_GROW + 28, segs: [{ t: "리더로 키워 냅니다.", c: INK }] },
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

// a simple pictogram person standing with feet at (x, y)
const Person: React.FC<{ x: number; y: number; color: string; s?: number; op?: number }> = ({ x, y, color, s = 1, op = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={op}>
    <line x1={-9} y1={-52} x2={-11} y2={-4} stroke={color} strokeWidth={14} strokeLinecap="round" />
    <line x1={9} y1={-52} x2={11} y2={-4} stroke={color} strokeWidth={14} strokeLinecap="round" />
    <rect x={-21} y={-118} width={42} height={72} rx={18} fill={color} />
    <line x1={-21} y1={-104} x2={-28} y2={-62} stroke={color} strokeWidth={11} strokeLinecap="round" />
    <line x1={21} y1={-104} x2={28} y2={-62} stroke={color} strokeWidth={11} strokeLinecap="round" />
    <circle cx={0} cy={-140} r={20} fill={color} />
  </g>
);

const Stairs: React.FC<{ f: number }> = ({ f }) => {
  const lv = level(f);
  const lead = leaderPos(f);
  const glow = prog(f, END2 - 10, 50);
  // at level 4 others start climbing behind the leader
  const followers = [0, 1, 2].map((k) => {
    const at = L4_GROW + k * 16;
    const target = spot(2 - k, k === 0 ? -40 : 0);
    let p = { x: 30 - k * 20, y: BASE_Y };
    if (f >= at) {
      const steps = [spot(0, -30 + k * 10), ...(2 - k >= 1 ? [spot(1, -20 + k * 10)] : []), ...(2 - k >= 2 ? [spot(2, -40)] : [])];
      let prev = p;
      steps.forEach((s, j) => {
        const h = hop(f, at + j * 20, prev, s, 18);
        if (f >= at + j * 20) p = { x: h.x, y: h.y };
        prev = s;
      });
    }
    return { p, op: prog(f, at - 10, 12), target };
  });
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="ls-glow">
          <stop offset="0%" stopColor={AMBER} stopOpacity={0.45} />
          <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
        </radialGradient>
      </defs>
      <line x1={MX - 40} y1={BASE_Y} x2={1080 - MX + 40} y2={BASE_Y} stroke={HAIR} strokeWidth={2} />
      {glow > 0 && <ellipse cx={STEPS[3].x + SW / 2} cy={STEPS[3].y - 90} rx={170 + 40 * glow} ry={150 + 30 * glow} fill="url(#ls-glow)" opacity={glow} />}
      {STEPS.map((s, i) => {
        const a = prog(f, 20 + i * 10, 20);
        const done = lv > i;
        const now = lv === i + 1;
        return (
          <g key={i} opacity={a} fontFamily={`'${SANS}', sans-serif`}>
            <rect x={s.x} y={s.y} width={SW} height={BASE_Y - s.y} rx={10} fill={done ? (now ? AMBER_SOFT : "#FBF3E6") : "#FFFFFF"} stroke={HAIR} strokeWidth={2} />
            <line x1={s.x + 4} y1={s.y} x2={s.x + SW - 4} y2={s.y} stroke={done ? AMBER : "#D5D8DD"} strokeWidth={now ? 6 : 4} strokeLinecap="round" />
            <text x={s.x + 22} y={s.y + 42} fontSize={22} fontWeight={700} fill={done ? AMBER : SUB}>{s.n}</text>
            <text x={s.x + 22} y={s.y + 84} fontSize={36} fontWeight={700} fill={done ? INK : "#A9AFB7"}>{s.name}</text>
          </g>
        );
      })}
      {followers.map((fo, k) => (fo.op > 0 ? <Person key={k} x={fo.p.x} y={fo.p.y} color={FOLLOW} s={0.86} op={fo.op} /> : null))}
      <Person x={lead.x} y={lead.y} color={FIG} op={prog(f, VO[1] - 6, 14)} />
    </svg>
  );
};

// ---------- the card for each level (top-left, above the low steps) ----------
const CARD = { x: MX, y: 430, w: 470, h: 250 };
const Card: React.FC<{ op: number; title: string; children: React.ReactNode }> = ({ op, title, children }) =>
  op > 0 ? (
    <div style={{
      position: "absolute", left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: 28, background: "#FFFFFF",
      border: `2px solid ${HAIR}`, boxShadow: "0 12px 32px rgba(40,40,40,0.06)", opacity: op, transform: `translateY(${(1 - op) * 20}px)`,
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", left: 28, top: 22, fontSize: 24, fontWeight: 700, color: AMBER }}>{title}</div>
      {children}
    </div>
  ) : null;

const Cards: React.FC<{ f: number }> = ({ f }) => {
  const span = (from: number, to: number) => prog(f, from, 16) * (1 - prog(f, to - 14, 12));
  const stamp = prog(f, L1_SEAT + 30, 14);
  const talk1 = prog(f, VO[2] + 30, 14);
  const talk2 = prog(f, L2_TALK + 10, 14);
  const bars = [0, 1, 2].map((k) => progIO(f, L3_DO + 10 + k * 12, 30));
  return (
    <>
      <Card op={span(VO[1] + 10, VO[2])} title="1단계 · 지위">
        <div style={{ position: "absolute", left: 60, top: 70, width: 230, height: 84, borderRadius: 12, background: "#2F3540",
          color: "#FFFFFF", fontSize: 40, fontWeight: 700, textAlign: "center", lineHeight: "84px", transform: "perspective(400px) rotateX(14deg)" }}>팀장</div>
        <div style={{ position: "absolute", left: 50, top: 156, width: 250, height: 16, borderRadius: 4, background: "#C9CED6" }} />
        <div style={{ position: "absolute", left: 28, top: 200, fontSize: 24, color: BODY }}>직함을 보고 따른다</div>
        <div style={{ position: "absolute", right: 26, top: 78, padding: "10px 16px", borderRadius: 16, border: `3px solid ${AMBER}`, color: AMBER,
          fontSize: 24, fontWeight: 700, transform: `rotate(-8deg) scale(${1.3 - 0.3 * stamp})`, opacity: stamp }}>능력 인정</div>
      </Card>
      <Card op={span(VO[2] + 10, VO[3])} title="2단계 · 관계">
        <div style={{ position: "absolute", left: 30, top: 62, padding: "12px 22px", borderRadius: "22px 22px 22px 6px", background: AMBER_SOFT,
          fontSize: 28, fontWeight: 700, color: INK, opacity: talk1 }}>요즘 어때요?</div>
        <div style={{ position: "absolute", right: 30, top: 122, padding: "12px 22px", borderRadius: "22px 22px 6px 22px", background: "#EEF0F3",
          fontSize: 28, fontWeight: 700, color: INK, opacity: talk2 }}>사실 고민이 있어요</div>
        <div style={{ position: "absolute", left: 28, top: 200, fontSize: 24, color: BODY }}>좋아서 따른다</div>
      </Card>
      <Card op={span(VO[3] + 10, VO[4])} title="3단계 · 성과">
        <svg width={CARD.w} height={CARD.h} style={{ position: "absolute", inset: 0 }}>
          <line x1={40} y1={180} x2={CARD.w - 40} y2={180} stroke={HAIR} strokeWidth={2} />
          {bars.map((b, k) => (
            <rect key={k} x={70 + k * 120} y={180 - (40 + k * 40) * b} width={70} height={(40 + k * 40) * b} rx={8} fill={k === 2 ? AMBER : "#E7C79A"} />
          ))}
        </svg>
        <div style={{ position: "absolute", left: 28, top: 200, fontSize: 24, color: BODY }}>함께 결과를 낸다</div>
      </Card>
      <Card op={span(VO[4] + 10, VO[5] + 40)} title="4단계 · 완성">
        <svg width={CARD.w} height={CARD.h} style={{ position: "absolute", inset: 0 }}>
          {[0, 1, 2].map((k) => {
            const grown = progIO(f, L4_GROW + 20 + k * 14, 24);
            return <Person key={k} x={110 + k * 125} y={182} color={grown > 0.5 ? AMBER : FOLLOW} s={0.72 + 0.12 * grown} />;
          })}
        </svg>
        <div style={{ position: "absolute", left: 28, top: 200, fontSize: 24, color: BODY }}>사람을 리더로 키운다</div>
      </Card>
    </>
  );
};

const Ending: React.FC<{ f: number }> = ({ f }) => {
  if (f < VO[5] - 4) return null;
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP - 10 }}>
      <Line f={f} at={VO[5] - 4} style={{ fontSize: 44, color: BODY, lineHeight: 1.45 }}>리더십은 직함에서 시작해,</Line>
      <div style={{ height: 6 }} />
      <Line f={f} at={END2 - 2} style={{ fontSize: 60, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.3 }}>
        <span style={{ color: AMBER }}>사람을 키울 때</span> 완성됩니다.
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

export const LeaderSteps: React.FC = () => {
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
        <Overline f={f} from={6} to={VO[5] - 6} tag="LEADERSHIP LEVELS" text="존 맥스웰" color={INK} />
        <Overline f={f} from={VO[5] - 2} to={TOTAL + 10} tag="LEADERSHIP" text="리더십의 완성" color={AMBER} />
        <Stairs f={f} />
        <Cards f={f} />
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
