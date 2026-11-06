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
const FIG = "#5D636D";
const FIG_SOFT = "#B3B8BF";
const AMBER = "#DE8A1E";
const AMBER_SOFT = "#F7E3C6";
const WRONG = "#B4563F";
const CHAT_BG = "#BACEE0";
const KAKAO = "#FEE500";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = Easing.out(Easing.cubic);
const backOut = Easing.out(Easing.back(1.5));
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
const pop = (f: number, at: number, dur = 12) => interpolate(f, [at, at + dur], [0.6, 1], { ...clamp, easing: backOut });
const win = (f: number, from: number, to: number, fin = 14, fout = 12) => prog(f, from, fin) * (1 - prog(f, to - fout, fout));
const FONT = `'${SANS}', sans-serif`;

export const TOTAL = 1228;
const MX = 100;

// ---------- Narration onsets (frames, from layout_vo2.py) ----------
// 0 일할 생각 없는 사람 · 1 평생 살면서 · 2 면담도 해보고 · 3 결과는 · 4 반대로 · 5 피드백 한 마디면 · 6 차이는 · 7 받아들일 의지 · 8 결론
export const VO = [19, 152, 285, 470, 584, 681, 830, 907, 1010];
const HOOK_B = 71; // 설득하면 바뀔까요?
const ATT = [285, 315, 361, 393]; // 면담 · 칭찬 · 교육 · 성과급
const RES_B = 493; // 늘 같았습니다
const OPP_B = 605; // 바뀌려는 사람은
const NEXT = 717; // 다음 날
const END_B = 1079; // 사람은 절대 바뀌지 않습니다

const SC = {
  a: { from: 0, to: 270 },
  b: { from: 270, to: 572 },
  c: { from: 572, to: 818 },
  d: { from: 818, to: 1000 },
  e: { from: 1000, to: TOTAL + 20 },
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
  { from: 15, to: 146, lines: [{ at: 15, segs: [{ t: "일할 생각 없는", c: INK }, { t: " 사람," }] }, { at: HOOK_B - 4, segs: [{ t: "설득하면", c: AMBER }, { t: " 바뀔까요?" }] }] },
  { from: 148, to: 266, lines: [{ at: 148, segs: [{ t: "평생 살면서," }] }, { at: 186, segs: [{ t: "그 방법을 " }, { t: "찾지 못했습니다.", c: INK }] }] },
  { from: 281, to: 464, lines: [
    { at: ATT[0] - 4, segs: [{ t: "면담도 해보고, 칭찬도 해보고," }] },
    { at: ATT[2] - 4, segs: [{ t: "교육도 보내고, 성과급도 걸어봤습니다." }] },
  ] },
  { from: 466, to: 568, lines: [{ at: VO[3] - 4, segs: [{ t: "결과는," }] }, { at: RES_B - 4, segs: [{ t: "늘 같았습니다.", c: WRONG }] }] },
  { from: 580, to: 676, lines: [{ at: VO[4] - 4, segs: [{ t: "반대로," }] }, { at: OPP_B - 4, segs: [{ t: "바뀌려는 사람", c: AMBER }, { t: "은 다릅니다." }] }] },
  { from: 677, to: 814, lines: [{ at: VO[5] - 4, segs: [{ t: "피드백 한 마디면," }] }, { at: NEXT - 4, segs: [{ t: "다음 날", c: INK }, { t: " 달라져 있습니다." }] }] },
];

// ---------- Overline ----------

const OVER = [
  { ...SC.a, tag: "PERSUASION", text: "설득의 한계" },
  { ...SC.b, tag: "TRIED", text: "해본 것들" },
  { ...SC.c, tag: "CONTRAST", text: "바뀌는 사람" },
  { from: SC.d.from, to: TOTAL + 20, tag: "WILL", text: "받아들일 의지" },
];

const Overline: React.FC<{ f: number }> = ({ f }) => {
  const o = OVER.find((x) => f >= x.from && f < x.to);
  if (!o) return null;
  const p = prog(f, o.from + 4, 18) * (1 - prog(f, o.to - 12, 12));
  return (
    <div style={{ position: "absolute", left: MX, top: 340, display: "flex", alignItems: "center", gap: 16, opacity: p }}>
      <div style={{ width: 36, height: 2, background: AMBER }} />
      <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color: AMBER }}>{o.tag}</span>
      <span style={{ fontSize: 26, fontWeight: 700, color: INK }}>{o.text}</span>
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

// head down on the desk
const Slumped: React.FC<{ x: number; y: number; s?: number; color?: string }> = ({ x, y, s = 1, color = FIG }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {/* chair */}
    <rect x={-96} y={-96} width={78} height={12} rx={6} fill="#D9D4C9" />
    <rect x={-100} y={-196} width={12} height={110} rx={6} fill="#D9D4C9" />
    <rect x={-62} y={-86} width={10} height={86} fill="#D9D4C9" />
    {/* legs */}
    <line x1={-52} y1={-100} x2={12} y2={-98} stroke={color} strokeWidth={22} strokeLinecap="round" />
    <line x1={12} y1={-98} x2={14} y2={-6} stroke={color} strokeWidth={20} strokeLinecap="round" />
    {/* torso leaning forward */}
    <line x1={-50} y1={-108} x2={50} y2={-168} stroke={color} strokeWidth={46} strokeLinecap="round" />
    {/* desk */}
    <rect x={10} y={-150} width={220} height={14} rx={7} fill="#D9D4C9" />
    <rect x={200} y={-140} width={12} height={140} fill="#D9D4C9" />
    {/* folded arms + head resting */}
    <rect x={40} y={-178} width={110} height={26} rx={13} fill={color} />
    <circle cx={104} cy={-196} r={25} fill={color} />
  </g>
);

const Bubble: React.FC<{ f: number; at: number; x: number; y: number; text: string; bg?: string; fs?: number; right?: boolean }> =
  ({ f, at, x, y, text, bg = "#FFFFFF", fs = 34, right }) =>
    f >= at ? (
      <div style={{ position: "absolute", top: y, ...(right ? { right: x } : { left: x }), opacity: prog(f, at, 8),
        transform: `scale(${pop(f, at)})`, transformOrigin: right ? "right bottom" : "left bottom" }}>
        <div style={{ position: "relative", background: bg, color: INK, fontSize: fs, fontWeight: 700, padding: `${fs * 0.42}px ${fs * 0.7}px`,
          borderRadius: fs * 0.8, whiteSpace: "nowrap", border: `2px solid ${HAIR}` }}>
          {text}
          <div style={{ position: "absolute", width: 18, height: 18, background: bg, transform: "rotate(45deg)", bottom: -10,
            ...(right ? { right: 40 } : { left: 40 }), borderRight: `2px solid ${HAIR}`, borderBottom: `2px solid ${HAIR}` }} />
        </div>
      </div>
    ) : null;

// ---------- Scene A: the question + a search that finds nothing ----------

const QUERY = "일 안 하는 사람 일하게 만드는 법";

const SceneA: React.FC<{ f: number }> = ({ f }) => {
  const op = win(f, SC.a.from, SC.a.to, 1, 14);
  if (op <= 0) return null;
  const fig = prog(f, 8, 18);
  const sb = prog(f, VO[1] - 6, 14);
  const typed = Math.floor(clamp01((f - VO[1]) / 30) * QUERY.length);
  const res = prog(f, 196, 12);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: fig }}>
        <ellipse cx={420} cy={1150} rx={240} ry={16} fill="rgba(27,30,36,0.05)" />
        <Slumped x={330} y={1146} s={1.25} />
        <Person x={810} y={1146} s={1.25} color={FIG_SOFT} />
      </svg>
      <Bubble f={f} at={30} x={1080 - 900} y={760} right text="같이 한번 해볼까요?" />
      <Bubble f={f} at={HOOK_B + 6} x={1080 - 900} y={870} right fs={30} text="이건 꼭 필요한 일이에요" />
      {sb > 0 && (
        <div style={{ position: "absolute", left: MX, right: MX, top: 450, opacity: sb, transform: `translateY(${(1 - sb) * 14}px)` }}>
          <div style={{ height: 96, borderRadius: 48, background: "#FFFFFF", border: `2px solid ${HAIR}`, display: "flex", alignItems: "center",
            padding: "0 34px", gap: 20, boxShadow: "0 8px 24px rgba(27,30,36,0.06)" }}>
            <svg width={36} height={36}><circle cx={15} cy={15} r={11} fill="none" stroke={SUB} strokeWidth={4} /><line x1={23} y1={23} x2={33} y2={33} stroke={SUB} strokeWidth={4} strokeLinecap="round" /></svg>
            <span style={{ fontSize: 34, fontWeight: 400, color: INK, whiteSpace: "nowrap" }}>
              {QUERY.slice(0, typed)}
              {typed < QUERY.length && <span style={{ display: "inline-block", width: 3, height: 36, background: INK, marginLeft: 4, verticalAlign: "middle" }} />}
            </span>
          </div>
          {res > 0 && (
            <div style={{ marginTop: 14, marginLeft: 34, opacity: res, fontSize: 30, color: SUB }}>
              검색 결과 <span style={{ color: WRONG, fontWeight: 700 }}>0건</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ---------- Scene B: checklist — every attempt, no change ----------

const TRIES = ["1:1 면담", "칭찬하기", "교육 보내기", "성과급 걸기"];

const Check: React.FC<{ p: number }> = ({ p }) => (
  <svg width={44} height={44}>
    <rect x={2} y={2} width={40} height={40} rx={10} fill={p > 0.2 ? INK : "#FFFFFF"} stroke={p > 0.2 ? INK : "rgba(27,30,36,0.25)"} strokeWidth={3} />
    <path d="M 12 22 L 19 29 L 32 14" fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round"
      strokeDasharray={32} strokeDashoffset={32 * (1 - p)} />
  </svg>
);

const SceneB: React.FC<{ f: number }> = ({ f }) => {
  const op = win(f, SC.b.from, SC.b.to, 16, 12);
  if (op <= 0) return null;
  const all = prog(f, RES_B, 14);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      <div style={{ position: "absolute", left: MX, right: MX, top: 450, borderRadius: 32, background: "#FFFFFF", border: `2px solid ${HAIR}`,
        boxShadow: "0 10px 30px rgba(27,30,36,0.06)", padding: "40px 44px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span style={{ fontSize: 40, fontWeight: 700, color: INK }}>김 대리 일하게 만들기</span>
          <span style={{ fontSize: 24, color: SUB }}>할 일 4</span>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 22, color: SUB, marginTop: 22, paddingRight: 6 }}>결과</div>
        {TRIES.map((t, i) => {
          const c = prog(f, ATT[i] + 2, 12);
          const r = f >= ATT[i] + 18;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, height: 104, borderTop: `2px solid ${HAIR}` }}>
              <Check p={c} />
              <span style={{ fontSize: 38, fontWeight: 700, color: c > 0.5 ? BODY : SUB, flex: 1 }}>{t}</span>
              {r && (
                <span style={{ opacity: prog(f, ATT[i] + 18, 8), transform: `scale(${pop(f, ATT[i] + 18)})`, display: "inline-block",
                  padding: "8px 20px", borderRadius: 20, fontSize: 28, fontWeight: 700,
                  background: all > 0 ? `rgba(180,86,63,${0.12 * all})` : "#EEF0F3", color: all > 0.5 ? WRONG : SUB }}>변화 없음</span>
              )}
            </div>
          );
        })}
        <div style={{ display: "flex", alignItems: "center", gap: 20, height: 110, borderTop: `2px solid ${INK}`, opacity: 0.35 + 0.65 * all }}>
          <svg width={70} height={70} viewBox="0 0 280 230" style={{ flexShrink: 0 }}>
            <Slumped x={110} y={226} s={0.95} color={all > 0.5 ? FIG : FIG_SOFT} />
          </svg>
          <span style={{ fontSize: 30, color: BODY, flex: 1 }}>김 대리 지금 상태</span>
          <span style={{ fontSize: 34, fontWeight: 700, color: all > 0.5 ? WRONG : SUB }}>그대로</span>
        </div>
      </div>
    </div>
  );
};

// ---------- Scene C: same feedback, two people ----------

const Chat: React.FC<{ f: number; top: number; label: string; amber?: boolean; askAt: number; reply: string; replyAt: number; next: React.ReactNode }> =
  ({ f, top, label, amber, askAt, reply, replyAt, next }) => {
    const op = prog(f, askAt - 14, 14);
    return (
      <div style={{ position: "absolute", left: MX, right: MX, top, opacity: op }}>
        <div style={{ display: "inline-block", padding: "6px 18px", borderRadius: 18, fontSize: 24, fontWeight: 700, marginBottom: 10,
          background: amber ? AMBER : "#E6E8EC", color: amber ? "#FFFFFF" : BODY }}>{label}</div>
        <div style={{ height: 286, borderRadius: 28, background: CHAT_BG, padding: "22px 26px", boxSizing: "border-box", overflow: "hidden" }}>
          {f >= askAt && (
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", opacity: prog(f, askAt, 8) }}>
              <div style={{ width: 48, height: 48, borderRadius: 18, background: "#9DB3C8", flexShrink: 0 }} />
              <div style={{ background: "#FFFFFF", color: INK, fontSize: 28, padding: "12px 18px", borderRadius: 16, borderTopLeftRadius: 4, whiteSpace: "nowrap" }}>
                이 부분, 다시 볼까요?
              </div>
            </div>
          )}
          {f >= replyAt && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10, opacity: prog(f, replyAt, 8), transform: `translateY(${(1 - prog(f, replyAt, 10)) * 10}px)` }}>
              <div style={{ background: KAKAO, color: INK, fontSize: 28, fontWeight: 700, padding: "12px 18px", borderRadius: 16, borderTopRightRadius: 4, whiteSpace: "nowrap" }}>{reply}</div>
            </div>
          )}
          {f >= NEXT && (
            <div style={{ opacity: prog(f, NEXT, 10) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "14px 0 10px" }}>
                <div style={{ flex: 1, height: 2, background: "rgba(27,30,36,0.15)" }} />
                <span style={{ fontSize: 20, color: BODY, background: "rgba(255,255,255,0.5)", padding: "3px 14px", borderRadius: 12 }}>다음 날</span>
                <div style={{ flex: 1, height: 2, background: "rgba(27,30,36,0.15)" }} />
              </div>
              {f >= NEXT + 16 && <div style={{ opacity: prog(f, NEXT + 16, 10) }}>{next}</div>}
            </div>
          )}
        </div>
      </div>
    );
  };

const SceneC: React.FC<{ f: number }> = ({ f }) => {
  const op = win(f, SC.c.from, SC.c.to, 16, 12);
  if (op <= 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      <Chat f={f} top={430} label="일할 생각 없는 사람" askAt={VO[4] + 6} reply="네…" replyAt={VO[4] + 30}
        next={<div style={{ textAlign: "center", fontSize: 26, color: BODY, opacity: 0.8 }}>(아무 변화 없음)</div>} />
      <Chat f={f} top={800} label="바뀌려는 사람" amber askAt={OPP_B + 4} reply="네! 수정해서 다시 올릴게요" replyAt={OPP_B + 28}
        next={
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ background: KAKAO, borderRadius: 16, borderTopRightRadius: 4, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 48, borderRadius: 6, background: "#FFFFFF", border: `2px solid ${HAIR}`, position: "relative" }}>
                <div style={{ position: "absolute", left: 7, right: 7, top: 10, height: 4, borderRadius: 2, background: AMBER }} />
                <div style={{ position: "absolute", left: 7, right: 12, top: 20, height: 4, borderRadius: 2, background: "#D7DADF" }} />
                <div style={{ position: "absolute", left: 7, right: 7, top: 30, height: 4, borderRadius: 2, background: "#D7DADF" }} />
              </div>
              <span style={{ fontSize: 26, fontWeight: 700, color: INK, whiteSpace: "nowrap" }}>수정본 올렸습니다</span>
            </div>
          </div>
        } />
    </div>
  );
};

// ---------- Scene D: not persuasion — will ----------

const SceneD: React.FC<{ f: number }> = ({ f }) => {
  const op = win(f, SC.d.from, SC.d.to, 16, 12);
  if (op <= 0) return null;
  const a = prog(f, VO[6] - 4, 16);
  const strike = prog(f, VO[6] + 34, 20);
  const b = f >= VO[7] - 4 ? pop(f, VO[7] - 4, 14) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 520, textAlign: "center" }}>
        <div style={{ position: "relative", display: "inline-block", fontSize: 150, fontWeight: 900, letterSpacing: -4,
          color: strike > 0.5 ? FIG_SOFT : INK, opacity: a, transform: `translateY(${(1 - a) * 20}px)` }}>
          설득
          <div style={{ position: "absolute", left: -10, top: "54%", height: 12, borderRadius: 6, background: WRONG, width: `${strike * 104}%` }} />
        </div>
        <div style={{ fontSize: 40, color: SUB, marginTop: 10, opacity: prog(f, VO[6] + 20, 12) }}>이 아니라</div>
        {b > 0 && (
          <div style={{ fontSize: 210, fontWeight: 900, color: AMBER, letterSpacing: -6, lineHeight: 1.1, marginTop: 20,
            transform: `scale(${b})`, opacity: prog(f, VO[7] - 4, 8) }}>의지</div>
        )}
      </div>
      <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP }}>
        <div style={{ width: 2, height: 22, background: HAIR, marginBottom: 18 }} />
        <Line f={f} at={VO[6] - 4} style={{ fontSize: 46, lineHeight: 1.5, color: BODY }}>차이는 설득이 아니었습니다.</Line>
        <Line f={f} at={VO[7] - 4} style={{ fontSize: 46, lineHeight: 1.5, color: BODY }}><span style={{ color: AMBER, fontWeight: 700 }}>받아들일 의지</span>였습니다.</Line>
      </div>
    </div>
  );
};

// ---------- Scene E: conclusion ----------

const SceneE: React.FC<{ f: number }> = ({ f }) => {
  if (f < SC.e.from) return null;
  const fig = prog(f, END_B + 20, 20);
  return (
    <>
      <div style={{ position: "absolute", left: MX, right: MX, top: 560 }}>
        <Line f={f} at={VO[8] - 4} style={{ fontSize: 50, fontWeight: 400, color: SUB, lineHeight: 1.45 }}>당사자가</Line>
        <Line f={f} at={VO[8] + 14} style={{ fontSize: 64, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.35 }}>받아들일 <span style={{ color: AMBER }}>의지</span>가 없으면,</Line>
        <div style={{ height: 40 }} />
        <Line f={f} at={END_B - 4} style={{ fontSize: 64, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.35 }}>사람은</Line>
        <Line f={f} at={END_B + 10} style={{ fontSize: 96, fontWeight: 900, color: INK, letterSpacing: -3, lineHeight: 1.25 }}><span style={{ color: WRONG }}>절대</span> 바뀌지 않습니다.</Line>
      </div>
      {fig > 0 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: fig * 0.9 }}>
          <Slumped x={430} y={1460} s={0.95} color={FIG_SOFT} />
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

export const NoPersuade: React.FC = () => {
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
        <SceneA f={f} />
        <SceneB f={f} />
        <SceneC f={f} />
        <SceneD f={f} />
        <SceneE f={f} />
        <Captions f={f} caps={CAPTIONS} />
      </div>
      <Grain f={f} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 62%, rgba(120,108,88,0.14) 100%)",
      }} />
    </div>
  );
};
