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
const EFFORT = "#9098A4";
const AMBER = "#DE8A1E";
const AMBER_SOFT = "#F7E3C6";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
const progIO = (f: number, at: number, dur: number) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeInOut });

export const TOTAL = 1663;
const MX = 100;

// ---------- Narration onsets (frames, from layout_vo2.py) ----------
// 0 hook · 1 문자/카톡 · 2 전화/앱 · 3 편해지면 더 쓴다 / 제본스의 역설 · 4 우리 회사도
// 5 개발 · 6 영업 · 7 기획 · 8 AI 시대, 일은 줄지 않습니다…
export const VO = [19, 153, 373, 561, 774, 849, 1050, 1219, 1434];
const KAKAO = 253; // "카톡이 공짜가 되자"
const APP = 447; // "앱으로 몇 번 누르면 되니"
const NAME = 664; // "이걸 제본스의 역설이라고 해요"
const ROW_AT = [879, 1079, 1248]; // the sentence after "개발." / "영업." / "기획."
const END2 = 1468; // "일은 줄지 않습니다"
const END3 = 1523; // "더 많아지고, 바뀔 뿐입니다"

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
    { at: VO[0] - 4, segs: [{ t: "AI 덕분에 일이 편해지면," }] },
    { at: VO[0] + 50, segs: [{ t: "일이 줄어들까요?", c: INK }] },
  ] },
  { from: VO[1] - 4, to: KAKAO - 4, lines: [
    { at: VO[1] - 4, segs: [{ t: "문자가 한 통에 20원일 땐" }] },
    { at: VO[1] + 40, segs: [{ t: "아껴 보냈죠." }] },
  ] },
  { from: KAKAO - 4, to: VO[2] - 6, lines: [
    { at: KAKAO - 4, segs: [{ t: "카톡이 공짜가 되자," }] },
    { at: KAKAO + 34, segs: [{ t: "하루에 " }, { t: "수백 개", c: AMBER }, { t: "를 보냅니다." }] },
  ] },
  { from: VO[2] - 4, to: APP - 4, lines: [
    { at: VO[2] - 4, segs: [{ t: "전화로 주문할 땐" }] },
    { at: VO[2] + 30, segs: [{ t: "가끔 시켰는데," }] },
  ] },
  { from: APP - 4, to: VO[3] - 6, lines: [
    { at: APP - 4, segs: [{ t: "앱으로 몇 번 누르면 되니" }] },
    { at: APP + 40, segs: [{ t: "더 자주", c: AMBER }, { t: " 시켜 먹습니다." }] },
  ] },
  { from: VO[3] - 4, to: NAME - 4, lines: [
    { at: VO[3] - 4, segs: [{ t: "편해지면," }] },
    { at: VO[3] + 26, segs: [{ t: "덜 쓰는 게 아니라 " }, { t: "더 씁니다.", c: INK }] },
  ] },
  { from: NAME - 4, to: VO[4] - 6, lines: [
    { at: NAME - 4, segs: [{ t: "이걸" }] },
    { at: NAME + 10, segs: [{ t: "제본스의 역설", c: AMBER }, { t: "이라고 해요." }] },
  ] },
  { from: VO[4] - 4, to: VO[5] - 6, lines: [
    { at: VO[4] - 4, segs: [{ t: "우리 회사도" }] },
    { at: VO[4] + 20, segs: [{ t: "마찬가지입니다.", c: INK }] },
  ] },
  { from: VO[5] - 4, to: VO[6] - 6, lines: [
    { at: VO[5] - 4, segs: [{ t: "개발.", c: AMBER }] },
    { at: ROW_AT[0] - 2, segs: [{ t: "AI로 기능 하나 만드는 시간이 줄자," }] },
    { at: ROW_AT[0] + 66, segs: [{ t: "만들어 달라는 " }, { t: "목록이 길어졌습니다.", c: INK }] },
  ] },
  { from: VO[6] - 4, to: VO[7] - 6, lines: [
    { at: VO[6] - 4, segs: [{ t: "영업.", c: AMBER }] },
    { at: ROW_AT[1] - 2, segs: [{ t: "제안서가 금방 나오자," }] },
    { at: ROW_AT[1] + 44, segs: [{ t: "더 많은 고객", c: INK }, { t: "에게 제안을 넣습니다." }] },
  ] },
  { from: VO[7] - 4, to: VO[8] - 6, lines: [
    { at: VO[7] - 4, segs: [{ t: "기획.", c: AMBER }] },
    { at: ROW_AT[2] - 2, segs: [{ t: "기획안 초안이 10분이면 나오자," }] },
    { at: ROW_AT[2] + 62, segs: [{ t: "검토할 안이 " }, { t: "하나에서 다섯 개", c: INK }, { t: "가 됐습니다." }] },
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

// ---------- S0–S3: two bars ----------
const BAR = { base: 1120, max: 360, w: 150, lx: 380, rx: 700 };
const EXAMPLES = [{ s: VO[1], t: KAKAO }, { s: VO[2], t: APP }];
const barVals = (f: number) => {
  let effort = 0.55;
  let amount = 0.55;
  for (const e of EXAMPLES) {
    if (f < e.s) break;
    const reset = progIO(f, e.s, 24);
    const flip = progIO(f, e.t + 4, 36);
    const grow = progIO(f, e.t + 10, 50);
    effort = lerp(lerp(effort, 0.9, reset), 0.18, flip);
    amount = lerp(lerp(amount, 0.22, reset), 0.95, grow);
  }
  return { effort, amount };
};

const Bars: React.FC<{ f: number }> = ({ f }) => {
  const vis = prog(f, 10, 20) * (1 - progIO(f, VO[4] - 16, 20));
  if (vis <= 0) return null;
  const { effort, amount } = barVals(f);
  const arrows = prog(f, VO[3] + 10, 20);
  const bar = (x: number, v: number, color: string, label: string) => (
    <g>
      <rect x={x - BAR.w / 2} y={BAR.base - BAR.max} width={BAR.w} height={BAR.max} rx={14} fill="#FFFFFF" stroke={HAIR} strokeWidth={2} />
      <rect x={x - BAR.w / 2} y={BAR.base - BAR.max * v} width={BAR.w} height={BAR.max * v} rx={14} fill={color} />
      <text x={x} y={BAR.base + 44} fontSize={26} fontWeight={700} fill={BODY} textAnchor="middle" fontFamily={`'${SANS}', sans-serif`}>{label}</text>
    </g>
  );
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: vis }}>
      {bar(BAR.lx, effort, EFFORT, "한 번 하는 수고")}
      {bar(BAR.rx, amount, AMBER, "하는 횟수")}
      {arrows > 0 && (
        <g opacity={arrows} fontFamily={`'${SANS}', sans-serif`} fontWeight={700}>
          <text x={BAR.lx} y={BAR.base - BAR.max * effort - 22} fontSize={44} fill={EFFORT} textAnchor="middle">↓</text>
          <text x={BAR.rx} y={BAR.base - BAR.max * amount - 22} fontSize={44} fill={AMBER} textAnchor="middle">↑</text>
        </g>
      )}
    </svg>
  );
};

// icon area above the bars
const ICON_Y = 470;
const Pill: React.FC<{ x: number; y: number; op: number; color: string; bg: string; children: React.ReactNode; size?: number }> =
  ({ x, y, op, color, bg, children, size = 30 }) =>
    op > 0 ? (
      <div style={{
        position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${0.92 + 0.08 * op})`, opacity: op,
        padding: "10px 24px", borderRadius: 28, background: bg, fontSize: size, fontWeight: 700, color, whiteSpace: "nowrap",
      }}>{children}</div>
    ) : null;

const ChatScene: React.FC<{ f: number }> = ({ f }) => {
  const vis = prog(f, VO[1], 18) * (1 - prog(f, VO[2] - 12, 12));
  if (vis <= 0) return null;
  const before = 1 - prog(f, KAKAO, 14);
  const after = prog(f, KAKAO, 14);
  const n = Math.floor(interpolate(f, [KAKAO + 6, KAKAO + 90], [0, 28], clamp));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: ICON_Y, height: 250, opacity: vis }}>
      {before > 0 && (
        <div style={{ position: "absolute", left: 540, top: 110, transform: "translate(-50%, -50%)", opacity: before, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ padding: "18px 30px", borderRadius: 26, background: "#FFFFFF", border: `2px solid ${HAIR}`, fontSize: 34, fontWeight: 700, color: BODY }}>문자</div>
          <div style={{ padding: "10px 20px", borderRadius: 20, background: "#EEF0F3", fontSize: 30, fontWeight: 700, color: SUB }}>한 통 20원</div>
        </div>
      )}
      {after > 0 && (
        <div style={{ position: "absolute", inset: 0, opacity: after }}>
          {Array.from({ length: n }, (_, i) => {
            const col = i % 7;
            const row = Math.floor(i / 7);
            const right = (i * 7) % 3 === 0;
            return (
              <div key={i} style={{
                position: "absolute", left: 150 + col * 112 + (right ? 18 : 0), top: 10 + row * 58,
                width: 84 + ((i * 13) % 3) * 8, height: 40, borderRadius: 20,
                background: right ? AMBER_SOFT : "#FFFFFF", border: `2px solid ${right ? "#EFCB97" : HAIR}`,
              }} />
            );
          })}
          <Pill x={540} y={250} op={prog(f, KAKAO + 20, 16)} color={AMBER} bg="#FFFFFF" size={28}>카톡 · 무료</Pill>
        </div>
      )}
    </div>
  );
};

const OrderScene: React.FC<{ f: number }> = ({ f }) => {
  const vis = prog(f, VO[2], 18) * (1 - prog(f, VO[3] - 12, 12));
  if (vis <= 0) return null;
  const before = 1 - prog(f, APP, 14);
  const after = prog(f, APP, 14);
  const n = Math.floor(interpolate(f, [APP + 10, APP + 90], [0, 12], clamp));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: ICON_Y, height: 250, opacity: vis }}>
      {before > 0 && (
        <div style={{ position: "absolute", left: 540, top: 110, transform: "translate(-50%, -50%)", opacity: before, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ padding: "18px 30px", borderRadius: 26, background: "#FFFFFF", border: `2px solid ${HAIR}`, fontSize: 34, fontWeight: 700, color: BODY }}>전화 주문</div>
          <div style={{ padding: "10px 20px", borderRadius: 20, background: "#EEF0F3", fontSize: 30, fontWeight: 700, color: SUB }}>가끔</div>
        </div>
      )}
      {after > 0 && (
        <div style={{ position: "absolute", inset: 0, opacity: after }}>
          <div style={{ position: "absolute", left: 170, top: 0, width: 130, height: 230, borderRadius: 24, border: `3px solid ${BODY}`, background: "#FFFFFF" }}>
            {[0, 1, 2].map((k) => (
              <div key={k} style={{ position: "absolute", left: 18, top: 30 + k * 62, width: 94, height: 44, borderRadius: 12, background: k === 1 ? AMBER : AMBER_SOFT }} />
            ))}
          </div>
          {Array.from({ length: n }, (_, i) => (
            <div key={i} style={{
              position: "absolute", left: 360 + (i % 6) * 95, top: 20 + Math.floor(i / 6) * 115,
              width: 70, height: 96, borderRadius: 8, background: "#FFFFFF", border: `2px solid ${HAIR}`,
              boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
            }}>
              <div style={{ margin: "14px 12px 0", height: 8, borderRadius: 4, background: "#D5D8DD" }} />
              <div style={{ margin: "10px 12px 0", height: 8, borderRadius: 4, background: "#D5D8DD", width: 30 }} />
              <div style={{ margin: "18px 12px 0", height: 10, borderRadius: 5, background: AMBER_SOFT }} />
            </div>
          ))}
          <Pill x={720} y={262} op={prog(f, APP + 20, 16)} color={AMBER} bg="#FFFFFF" size={28}>배달앱 · 몇 번 터치</Pill>
        </div>
      )}
    </div>
  );
};

const ParadoxName: React.FC<{ f: number }> = ({ f }) => {
  const a = prog(f, NAME + 10, 20) * (1 - prog(f, VO[4] - 14, 14));
  const lead = prog(f, VO[3], 18) * (1 - prog(f, VO[4] - 14, 14));
  if (lead <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: ICON_Y - 20, textAlign: "center", opacity: lead }}>
      <div style={{ fontSize: 46, fontWeight: 700, color: INK, letterSpacing: -1 }}>
        편해지면 <span style={{ color: EFFORT }}>↓</span> &nbsp;→&nbsp; 더 쓴다 <span style={{ color: AMBER }}>↑</span>
      </div>
      <div style={{ display: "inline-block", marginTop: 22, padding: "12px 32px", borderRadius: 36, background: AMBER, color: "#FFFFFF",
        fontSize: 48, fontWeight: 700, opacity: a, transform: `scale(${0.9 + 0.1 * a})` }}>제본스의 역설</div>
    </div>
  );
};

// ---------- S4–S7: our company, three teams ----------
const TEAMS = [
  { name: "개발", what: "기능 요청 목록", n0: 3, n1: 9, glyph: "list" },
  { name: "영업", what: "제안 넣는 고객", n0: 3, n1: 10, glyph: "client" },
  { name: "기획", what: "검토할 기획안", n0: 1, n1: 5, glyph: "doc" },
];
const ROW_Y = [560, 760, 960];

const Glyph: React.FC<{ kind: string; x: number; y: number; op: number; hot: boolean }> = ({ kind, x, y, op, hot }) => {
  const stroke = hot ? "#EFCB97" : HAIR;
  const fill = hot ? AMBER_SOFT : "#FFFFFF";
  return (
    <g opacity={op} transform={`translate(${x} ${y})`}>
      {kind === "list" && (
        <>
          <rect x={-22} y={-26} width={44} height={52} rx={6} fill={fill} stroke={stroke} strokeWidth={2} />
          {[0, 1, 2].map((k) => <line key={k} x1={-12} y1={-12 + k * 12} x2={12} y2={-12 + k * 12} stroke={hot ? AMBER : "#C7CCD3"} strokeWidth={3} strokeLinecap="round" />)}
        </>
      )}
      {kind === "client" && (
        <>
          <circle cx={0} cy={-10} r={11} fill={fill} stroke={stroke} strokeWidth={2} />
          <path d="M -20 24 Q 0 -4 20 24 Z" fill={fill} stroke={stroke} strokeWidth={2} />
        </>
      )}
      {kind === "doc" && (
        <>
          <path d="M -20 -28 L 10 -28 L 22 -16 L 22 28 L -20 28 Z" fill={fill} stroke={stroke} strokeWidth={2} />
          {[0, 1].map((k) => <line key={k} x1={-10} y1={-6 + k * 12} x2={12} y2={-6 + k * 12} stroke={hot ? AMBER : "#C7CCD3"} strokeWidth={3} strokeLinecap="round" />)}
        </>
      )}
    </g>
  );
};

const Company: React.FC<{ f: number }> = ({ f }) => {
  const vis = progIO(f, VO[4] - 6, 24) * (1 - 0.7 * progIO(f, VO[8] - 6, 30));
  if (vis <= 0) return null;
  return (
    <>
      <Pill x={540} y={455} op={prog(f, VO[4], 18)} color={INK} bg="#FFFFFF" size={32}>우리 회사</Pill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: vis }}>
        {TEAMS.map((t, i) => {
          const rowIn = prog(f, VO[4] + 10 + i * 8, 18);
          const active = f >= VO[5 + i] - 4;
          const run = progIO(f, ROW_AT[i] + 6, 60);
          const focus = active ? (i < 2 && f >= VO[6 + i] - 4 ? 0.55 : 1) : 0.4;
          const y = ROW_Y[i];
          const effortW = lerp(220, 50, run);
          const n = Math.round(lerp(t.n0, t.n1, progIO(f, ROW_AT[i] + 20, 70)));
          return (
            <g key={i} opacity={rowIn * focus} fontFamily={`'${SANS}', sans-serif`}>
              <rect x={MX} y={y - 70} width={1080 - 2 * MX} height={150} rx={22} fill="#FFFFFF" fillOpacity={0.7} stroke={HAIR} strokeWidth={2} />
              <rect x={MX + 24} y={y - 46} width={96} height={48} rx={24} fill={active ? AMBER : "#EEF0F3"} />
              <text x={MX + 72} y={y - 12} fontSize={26} fontWeight={700} fill={active ? "#FFFFFF" : SUB} textAnchor="middle">{t.name}</text>
              <text x={MX + 24} y={y + 50} fontSize={22} fontWeight={700} fill={SUB}>한 번 하는 수고</text>
              <rect x={MX + 24} y={y + 14} width={220} height={14} rx={7} fill="#EEF0F3" />
              <rect x={MX + 24} y={y + 14} width={effortW} height={14} rx={7} fill={EFFORT} />
              <text x={MX + 300} y={y - 30} fontSize={22} fontWeight={700} fill={SUB}>{t.what}</text>
              {Array.from({ length: t.n1 }, (_, k) => (
                <Glyph key={k} kind={t.glyph} x={MX + 330 + k * 56} y={y + 24} op={k < n ? 1 : 0} hot={k >= t.n0} />
              ))}
            </g>
          );
        })}
      </svg>
    </>
  );
};

const Ending: React.FC<{ f: number }> = ({ f }) => {
  if (f < VO[8] - 4) return null;
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP - 20 }}>
      <Line f={f} at={VO[8] - 4} style={{ fontSize: 44, color: BODY, lineHeight: 1.45 }}>AI 시대,</Line>
      <Line f={f} at={END2 - 2} style={{ fontSize: 60, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.3 }}>일은 줄지 않습니다.</Line>
      <Line f={f} at={END3 - 2} style={{ fontSize: 60, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.3 }}>
        <span style={{ color: AMBER }}>더 많아지고, 바뀔 뿐</span>입니다.
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

export const Jevons: React.FC = () => {
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
        <Overline f={f} from={6} to={VO[3] - 6} tag="EASIER" text="편해지면" color={INK} />
        <Overline f={f} from={VO[3] - 2} to={VO[4] - 6} tag="JEVONS PARADOX" text="제본스의 역설" color={AMBER} />
        <Overline f={f} from={VO[4] - 2} to={VO[8] - 6} tag="OUR COMPANY" text="우리 회사" color={INK} />
        <Overline f={f} from={VO[8] - 2} to={TOTAL + 10} tag="AI ERA" text="AI 시대" color={AMBER} />
        <Bars f={f} />
        <ChatScene f={f} />
        <OrderScene f={f} />
        <ParadoxName f={f} />
        <Company f={f} />
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
