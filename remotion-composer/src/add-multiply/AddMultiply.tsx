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
const NEUTRAL = "#A3A9B2";
const DARK = "#4A505A";
const AMBER = "#DE8A1E";
const AMBER_SOFT = "#F7E3C6";
const WRONG = "#B4563F";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
const progIO = (f: number, at: number, dur: number) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeInOut });

export const TOTAL = 1007;
const MX = 100;

// ---------- Narration onsets (frames, from layout_vo2.py) ----------
// 0 직원 잘하면 · 1 리더 잘하면 · 2 직원 잘못 가면 · 3 리더 잘못 가면 · 4 직원 지치면 · 5 리더 지치면 · 6 직원은 더하기
export const VO = [49, 164, 302, 419, 575, 686, 839];
const END2 = 886; // "리더는 곱하기"

// ---------- Layout: one row for the employee, one for the leader and ten team members ----------
const EMP = { x: 330, y: 740 };
const LEAD = { x: 205, y: 1110 };
const TEAM = Array.from({ length: 10 }, (_, i) => ({ x: 420 + (i % 5) * 118, y: i < 5 ? 985 : 1115 }));

// person mood: +1 lit, 0 neutral, -1 drained
const empMood = (f: number) =>
  prog(f, VO[0] + 12, 18) * (1 - prog(f, VO[2] - 14, 14))
  - prog(f, VO[4] + 14, 18) * (1 - prog(f, VO[6] - 12, 14))
  + prog(f, END2 + 4, 18);
const teamMood = (f: number, i: number) => {
  const d = i * 3;
  return prog(f, VO[1] + 16 + d, 16) * (1 - prog(f, VO[2] - 14, 14))
    - prog(f, VO[5] + 18 + d, 16) * (1 - prog(f, VO[6] - 12, 14))
    + prog(f, END2 + 8 + d, 16);
};
const leadMood = (f: number) =>
  prog(f, VO[1] + 6, 16) * (1 - prog(f, VO[2] - 14, 14))
  - prog(f, VO[5] + 6, 16) * (1 - prog(f, VO[6] - 12, 14))
  + prog(f, END2, 16);
const moodColor = (m: number) =>
  m >= 0 ? interpolateColors(m, [0, 1], [NEUTRAL, AMBER]) : interpolateColors(-m, [0, 1], [NEUTRAL, DARK]);

// direction arrows in the second example: → toward the goal, then swinging off course
const empArrow = (f: number) => ({ op: prog(f, VO[2], 14) * (1 - prog(f, VO[3] - 12, 12)), wrong: progIO(f, VO[2] + 30, 22) });
const teamArrow = (f: number, i: number) => ({ op: prog(f, VO[3], 14) * (1 - prog(f, VO[4] - 12, 12)), wrong: progIO(f, VO[3] + 32 + i * 3, 20) });

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
          <Line key={i} f={f} at={l.at} style={{ fontSize: 46, fontWeight: 400, lineHeight: 1.5, color: BODY }}>
            {l.segs.map((s, j) => (
              <span key={j} style={{ color: s.c ?? undefined, fontWeight: s.w ?? (s.c ? 700 : undefined) }}>{s.t}</span>
            ))}
          </Line>
        ) : null,
      )}
    </div>
  );
};

const pair = (k: number, a: Seg[], b: Seg[], d = 40): Cap => ({
  from: VO[k] - 4, to: VO[k + 1] - 6, lines: [{ at: VO[k] - 4, segs: a }, { at: VO[k] + d, segs: b }],
});
const CAPTIONS: Cap[] = [
  pair(0, [{ t: "직원", c: INK }, { t: "이 잘하면," }], [{ t: "한 사람만큼", c: INK }, { t: " 좋아집니다." }]),
  pair(1, [{ t: "리더", c: AMBER }, { t: "가 잘하면," }], [{ t: "팀원 모두만큼", c: AMBER }, { t: " 좋아집니다." }], 44),
  pair(2, [{ t: "직원", c: INK }, { t: "이 잘못 가면," }], [{ t: "일 하나", c: INK }, { t: "가 늦어집니다." }]),
  pair(3, [{ t: "리더", c: AMBER }, { t: "가 잘못 가면," }], [{ t: "팀 전체", c: AMBER }, { t: "가 엉뚱한 곳으로 갑니다." }], 44),
  pair(4, [{ t: "직원", c: INK }, { t: "이 지치면," }], [{ t: "그 자리만", c: INK }, { t: " 어두워집니다." }]),
  pair(5, [{ t: "리더", c: AMBER }, { t: "가 지치면," }], [{ t: "팀 분위기 전체", c: AMBER }, { t: "가 가라앉습니다." }], 44),
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

// ---------- Drawing ----------
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

const Halo: React.FC<{ x: number; y: number; r: number; m: number }> = ({ x, y, r, m }) =>
  m > 0.02 ? <circle cx={x} cy={y} r={r} fill="url(#am-glow)" opacity={m} />
    : m < -0.02 ? <circle cx={x} cy={y} r={r * 0.8} fill="rgba(40,46,56,0.10)" opacity={-m} /> : null;

const Arrow: React.FC<{ x: number; y: number; op: number; wrong: number; s?: number }> = ({ x, y, op, wrong, s = 1 }) =>
  op > 0 ? (
    <g opacity={op} transform={`translate(${x} ${y}) rotate(${lerp(0, 155, wrong)}) scale(${s})`}>
      <line x1={-26} y1={0} x2={22} y2={0} stroke={interpolateColors(wrong, [0, 1], [AMBER, WRONG])} strokeWidth={6} strokeLinecap="round" />
      <path d="M 10 -12 L 26 0 L 10 12" fill="none" stroke={interpolateColors(wrong, [0, 1], [AMBER, WRONG])} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ) : null;

const Badge: React.FC<{ x: number; y: number; op: number; text: string; color: string; bg: string }> = ({ x, y, op, text, color, bg }) =>
  op > 0 ? (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-100%, -50%) scale(${0.9 + 0.1 * op})`, transformOrigin: "right center",
      opacity: op, padding: "10px 22px", borderRadius: 26, background: bg, color, fontSize: 30, fontWeight: 700, whiteSpace: "nowrap" }}>{text}</div>
  ) : null;

const Scene: React.FC<{ f: number }> = ({ f }) => {
  const rowsIn = prog(f, 40, 18);
  const em = empMood(f);
  const lm = leadMood(f);
  const ea = empArrow(f);
  const goal = prog(f, VO[2] - 4, 14) * (1 - prog(f, VO[4] - 12, 12));
  const ripple = (at: number) => {
    const p = clamp01((f - at) / 30);
    return p > 0 && p < 1 ? p : 0;
  };
  const rp = Math.max(ripple(VO[1] + 8), ripple(VO[3] + 26), ripple(VO[5] + 10), ripple(END2 + 2));
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: rowsIn }}>
      <defs>
        <radialGradient id="am-glow">
          <stop offset="0%" stopColor={AMBER} stopOpacity={0.4} />
          <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* row frames */}
      <rect x={MX - 20} y={470} width={1080 - 2 * MX + 40} height={300} rx={28} fill="#FFFFFF" fillOpacity={0.6} stroke={HAIR} strokeWidth={2} />
      <rect x={MX - 20} y={800} width={1080 - 2 * MX + 40} height={340} rx={28} fill="#FFFFFF" fillOpacity={0.6} stroke={HAIR} strokeWidth={2} />
      <g fontFamily={`'${SANS}', sans-serif`} fontWeight={700}>
        <rect x={MX + 4} y={492} width={96} height={46} rx={23} fill="#EEF0F3" />
        <text x={MX + 52} y={524} fontSize={26} fill={BODY} textAnchor="middle">직원</text>
        <rect x={MX + 4} y={822} width={96} height={46} rx={23} fill={AMBER} />
        <text x={MX + 52} y={854} fontSize={26} fill="#FFFFFF" textAnchor="middle">리더</text>
      </g>
      {/* goal flags in the direction example */}
      {goal > 0 && [620, 950].map((y, k) => (
        <g key={k} opacity={goal} transform={`translate(950 ${y})`}>
          <line x1={0} y1={-60} x2={0} y2={10} stroke={SUB} strokeWidth={4} strokeLinecap="round" />
          <path d="M 0 -60 L 34 -48 L 0 -36 Z" fill={AMBER} />
          <text x={0} y={42} fontSize={20} fontWeight={700} fill={SUB} textAnchor="middle" fontFamily={`'${SANS}', sans-serif`}>목표</text>
        </g>
      ))}
      {/* employee */}
      <Halo x={EMP.x} y={EMP.y - 70} r={110} m={em} />
      <Person x={EMP.x} y={EMP.y} color={moodColor(em)} s={0.95} />
      <Arrow x={EMP.x} y={EMP.y - 190} op={ea.op} wrong={ea.wrong} />
      {/* leader → team */}
      {rp > 0 && <circle cx={LEAD.x} cy={LEAD.y - 70} r={60 + 640 * rp} fill="none" stroke={lm < 0 ? DARK : AMBER} strokeWidth={3} opacity={0.35 * (1 - rp)} />}
      <Halo x={LEAD.x} y={LEAD.y - 70} r={120} m={lm} />
      <circle cx={LEAD.x} cy={LEAD.y - 70} r={92} fill="none" stroke={AMBER} strokeWidth={3} opacity={0.5} />
      <Person x={LEAD.x} y={LEAD.y} color={moodColor(lm)} s={0.95} />
      {TEAM.map((t, i) => {
        const m = teamMood(f, i);
        const ar = teamArrow(f, i);
        return (
          <g key={i}>
            <Halo x={t.x} y={t.y - 45} r={62} m={m} />
            <Person x={t.x} y={t.y} color={moodColor(m)} s={0.56} />
            <Arrow x={t.x} y={t.y - 108} op={ar.op} wrong={ar.wrong} s={0.6} />
          </g>
        );
      })}
      <Arrow x={LEAD.x} y={LEAD.y - 190} op={teamArrow(f, 0).op} wrong={progIO(f, VO[3] + 24, 20)} />
    </svg>
  );
};

const Badges: React.FC<{ f: number }> = ({ f }) => {
  const empOn = [0, 2, 4].reduce((m, k) => Math.max(m, prog(f, VO[k] + 40, 14) * (1 - prog(f, VO[k + 1] - 4, 12))), 0);
  const leadOn = [1, 3, 5].reduce((m, k) => Math.max(m, prog(f, VO[k] + 44, 14) * (1 - prog(f, VO[k + 1] - 4, 12))), 0);
  const endOn = prog(f, VO[6] + 4, 16);
  return (
    <>
      <Badge x={1080 - MX - 10} y={530} op={Math.max(empOn, endOn)} text={endOn > 0.5 ? "+ 한 사람" : "영향 1명"} color={BODY} bg="#EEF0F3" />
      <Badge x={1080 - MX - 10} y={846} op={Math.max(leadOn, prog(f, END2, 16))} text={f >= END2 ? "× 팀원 모두" : "영향 10명"} color="#FFFFFF" bg={AMBER} />
    </>
  );
};

const Title: React.FC<{ f: number }> = ({ f }) => {
  const a = prog(f, 4, 16) * (1 - prog(f, 30, 12));
  if (a <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 820, textAlign: "center", opacity: a, fontSize: 64, fontWeight: 700, color: INK, letterSpacing: -2 }}>
      직원은 <span style={{ color: SUB }}>더하기</span>,<br />리더는 <span style={{ color: AMBER }}>곱하기</span>
    </div>
  );
};

const Ending: React.FC<{ f: number }> = ({ f }) => {
  if (f < VO[6] - 4) return null;
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP - 10 }}>
      <Line f={f} at={VO[6] - 4} style={{ fontSize: 60, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.3 }}>직원은 <span style={{ color: SUB }}>더하기</span>,</Line>
      <Line f={f} at={END2 - 2} style={{ fontSize: 60, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.3 }}>리더는 <span style={{ color: AMBER }}>곱하기.</span></Line>
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

export const AddMultiply: React.FC = () => {
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
        <Overline f={f} from={6} to={TOTAL + 10} tag="ADD × MULTIPLY" text="직원과 리더" color={AMBER} />
        <Title f={f} />
        {f >= 40 && <Scene f={f} />}
        <Badges f={f} />
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
