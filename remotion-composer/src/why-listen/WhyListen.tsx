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
const mixRGB = (a: number[], b: number[], t: number) => `rgb(${a.map((c, i) => Math.round(c + (b[i] - c) * t)).join(",")})`;

export const TOTAL = 1290;
const MX = 100;

// ---------- Timeline ----------
// S1 hook 0–150 · S2 the usual opener 150–450 · S3 "so what?" 450–600
// S4 a reason first 600–900 · S5 the order 900–1110 · S6 conclusion 1110–1290
const SAY_A = 160;
const SAY_A_END = 440;
export const AWAY_AT = 240;
export const AWAY_GAP = 22;
const THOUGHT_AT = 462;
const SAY_B = 612;
const SAY_B_END = 890;
export const BACK_AT = 670;
export const BACK_GAP = 16;
const ORDER_AT = 905;
const SWAP = [968, 1010];
const END_AT = 1120;

// ---------- Room geometry ----------
const SPK = { x: 540, y: 620 };
const R = 400;
const N = 8;
const SEATS = Array.from({ length: N }, (_, k) => {
  const th = ((25 + (k * 130) / (N - 1)) * Math.PI) / 180;
  return { x: SPK.x + R * Math.cos(th), y: SPK.y + R * Math.sin(th) };
});
// who drifts off during the usual opener (two keep listening), and the order they come back
export const AWAY_ORDER = [3, 6, 1, 4, 0, 7];
export const BACK_ORDER = [2, 5, 3, 6, 1, 4, 0, 7];

const awayAt = (f: number, k: number) => {
  const i = AWAY_ORDER.indexOf(k);
  const off = i < 0 ? 0 : progIO(f, AWAY_AT + i * AWAY_GAP, 20);
  const j = BACK_ORDER.indexOf(k);
  const back = progIO(f, BACK_AT + j * BACK_GAP, 18);
  return off * (1 - back);
};
const litAt = (f: number, k: number) => progIO(f, BACK_AT + BACK_ORDER.indexOf(k) * BACK_GAP, 18);
const attention = (f: number) => {
  let s = 0;
  for (let k = 0; k < N; k++) s += 1 - awayAt(f, k);
  return s / N;
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

type Seg = { t: string; c?: string; w?: number };
type Cap = { from: number; to: number; lines: { at: number; segs: Seg[] }[] };
const CAP_TOP = 1190;

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
  { from: 16, to: 150, lines: [
    { at: 16, segs: [{ t: "아무리 좋은 말도," }] },
    { at: 40, segs: [{ t: "들을 이유", c: INK }, { t: "가 없으면 흘려듣는다" }] },
  ] },
  { from: 176, to: 446, lines: [
    { at: 176, segs: [{ t: "'정리해 봤는데요'로 시작하면," }] },
    { at: 236, segs: [{ t: "듣는 사람은 " }, { t: "휴대폰", c: INK }, { t: "을 본다" }] },
  ] },
  { from: THOUGHT_AT, to: 600, lines: [
    { at: THOUGHT_AT, segs: [{ t: "듣는 사람은 늘 묻는다." }] },
    { at: THOUGHT_AT + 28, segs: [{ t: "'이걸 내가 왜 들어야 하지?'", c: INK }] },
  ] },
  { from: SAY_B + 12, to: 896, lines: [
    { at: SAY_B + 12, segs: [{ t: "같은 내용도," }] },
    { at: SAY_B + 52, segs: [{ t: "들을 이유를 먼저", c: AMBER }, { t: " 주면 귀가 열린다" }] },
  ] },
  { from: ORDER_AT + 7, to: 1106, lines: [
    { at: ORDER_AT + 7, segs: [{ t: "내용보다 먼저," }] },
    { at: ORDER_AT + 39, segs: [{ t: "'당신에게 왜 중요한지'", c: AMBER }, { t: "를 말하자" }] },
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

// What the speaker says first
const Speech: React.FC<{ f: number }> = ({ f }) => {
  const a = interpolate(f, [SAY_A, SAY_A + 16, SAY_A_END - 8, SAY_A_END + 6], [0, 1, 1, 0], clamp);
  const b = interpolate(f, [SAY_B, SAY_B + 16, SAY_B_END, SAY_B_END + 14], [0, 1, 1, 0], clamp);
  const quote = (op: number, children: React.ReactNode, at: number, color: string) => (
    <div style={{ position: "absolute", left: MX, right: MX, top: 420, opacity: op }}>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 5, color: SUB, marginBottom: 10 }}>첫 마디</div>
      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ width: 4, borderRadius: 2, background: color, transform: `scaleY(${prog(f, at, 16)})`, transformOrigin: "50% 0%" }} />
        <div>{children}</div>
      </div>
    </div>
  );
  return (
    <>
      {a > 0 && quote(a, (
        <Line f={f} at={SAY_A + 4} style={{ fontSize: 38, fontWeight: 700, color: INK, lineHeight: 1.35 }}>"오늘은 3분기 데이터를 정리해 봤는데요…"</Line>
      ), SAY_A, SUB)}
      {b > 0 && quote(b, (
        <>
          <Line f={f} at={SAY_B + 4} style={{ fontSize: 38, fontWeight: 700, color: INK, lineHeight: 1.35 }}>"이 3분이면, 다음 달 <span style={{ color: AMBER }}>야근을</span></Line>
          <Line f={f} at={SAY_B + 16} style={{ fontSize: 38, fontWeight: 700, color: INK, lineHeight: 1.35 }}><span style={{ color: AMBER }}>절반으로</span> 줄일 수 있습니다."</Line>
        </>
      ), SAY_B, AMBER)}
    </>
  );
};

const Room: React.FC<{ f: number }> = ({ f }) => {
  const show = prog(f, 0, 24) * interpolate(f, [ORDER_AT - 10, ORDER_AT + 10, END_AT, END_AT + 30], [1, 0.06, 0.06, 0.4], clamp);
  const talking = Math.max(
    interpolate(f, [SAY_A, SAY_A + 10, SAY_A_END - 20, SAY_A_END], [0, 1, 1, 0], clamp),
    interpolate(f, [SAY_B, SAY_B + 10, SAY_B_END - 20, SAY_B_END], [0, 1, 1, 0], clamp),
  );
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: show }}>
      <defs>
        <radialGradient id="cone-amber"><stop offset="0" stopColor={AMBER} stopOpacity={0.5} /><stop offset="1" stopColor={AMBER} stopOpacity={0} /></radialGradient>
        <radialGradient id="cone-gray"><stop offset="0" stopColor="#C9CED6" stopOpacity={0.35} /><stop offset="1" stopColor="#C9CED6" stopOpacity={0} /></radialGradient>
        <radialGradient id="cone-phone"><stop offset="0" stopColor="#9FB8DA" stopOpacity={0.45} /><stop offset="1" stopColor="#9FB8DA" stopOpacity={0} /></radialGradient>
        <radialGradient id="phone-glow"><stop offset="0" stopColor="#BFD3EE" stopOpacity={0.55} /><stop offset="1" stopColor="#BFD3EE" stopOpacity={0} /></radialGradient>
        <radialGradient id="spk-glow"><stop offset="0" stopColor={INK} stopOpacity={0.35} /><stop offset="1" stopColor={INK} stopOpacity={0} /></radialGradient>
      </defs>
      {/* the speaker's voice: soft arcs travelling toward the room */}
      {talking > 0 && [0, 1, 2].map((i) => {
        const ph = ((f * 0.012 + i / 3) % 1);
        const r = 50 + ph * 300;
        return (
          <path key={i} d={`M ${SPK.x - r * 0.8} ${SPK.y + r * 0.6} A ${r} ${r} 0 0 0 ${SPK.x + r * 0.8} ${SPK.y + r * 0.6}`}
            fill="none" stroke={INK} strokeWidth={1.5} opacity={talking * 0.22 * Math.sin(Math.PI * ph)} />
        );
      })}
      <circle cx={SPK.x} cy={SPK.y} r={70} fill="url(#spk-glow)" />
      <circle cx={SPK.x} cy={SPK.y} r={28} fill={INK} />
      <path d={`M ${SPK.x - 46} ${SPK.y + 62} Q ${SPK.x} ${SPK.y + 30} ${SPK.x + 46} ${SPK.y + 62}`} stroke={INK} strokeWidth={10} strokeLinecap="round" fill="none" opacity={0.9} />
      {SEATS.map((s, k) => {
        const away = awayAt(f, k);
        const lit = litAt(f, k);
        const toSpk = Math.atan2(SPK.y - s.y, SPK.x - s.x);
        const down = Math.atan2(1, (s.x - SPK.x) / R * 0.6); // gaze drops to the lap, slightly outward
        const ang = lerp(toSpk, down, away);
        const cone = 120;
        const spread = 0.42;
        const p1 = { x: s.x + Math.cos(ang - spread) * cone, y: s.y + Math.sin(ang - spread) * cone };
        const p2 = { x: s.x + Math.cos(ang + spread) * cone, y: s.y + Math.sin(ang + spread) * cone };
        const headCol = mixRGB(mixRGB2([201, 206, 214], [96, 104, 118], away), [242, 180, 92], lit * (1 - away));
        const phone = { x: s.x + Math.cos(down) * 46, y: s.y + Math.sin(down) * 46 };
        return (
          <g key={k}>
            <path d={`M ${s.x} ${s.y} L ${p1.x} ${p1.y} A ${cone} ${cone} 0 0 1 ${p2.x} ${p2.y} Z`}
              fill={away > 0.5 ? "url(#cone-phone)" : lit > 0.5 ? "url(#cone-amber)" : "url(#cone-gray)"} opacity={0.9} />
            <path d={`M ${s.x - 34} ${s.y + 44} Q ${s.x} ${s.y + 14} ${s.x + 34} ${s.y + 44}`} stroke={headCol} strokeWidth={9} strokeLinecap="round" fill="none" opacity={0.85} />
            <circle cx={s.x} cy={s.y} r={22} fill={headCol} />
            {lit > 0 && <circle cx={s.x} cy={s.y} r={34} fill="none" stroke={AMBER} strokeWidth={2} opacity={0.5 * lit * (1 - away)} />}
            {away > 0.05 && (
              <g opacity={away}>
                <circle cx={phone.x} cy={phone.y} r={30} fill="url(#phone-glow)" />
                <rect x={phone.x - 9} y={phone.y - 14} width={18} height={28} rx={4} fill="#D4E2F4" transform={`rotate(${(down * 180) / Math.PI - 90} ${phone.x} ${phone.y})`} />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};
// helper kept separate so the head colour can blend gray → dim → amber smoothly
const mixRGB2 = (a: number[], b: number[], t: number) => a.map((c, i) => Math.round(c + (b[i] - c) * t));

const Thought: React.FC<{ f: number }> = ({ f }) => {
  const op = interpolate(f, [THOUGHT_AT - 6, THOUGHT_AT + 14, SAY_B - 10, SAY_B + 4], [0, 1, 1, 0], clamp);
  if (op <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 800, textAlign: "center", opacity: op, transform: `translateY(${(1 - prog(f, THOUGHT_AT - 6, 20)) * 12}px)` }}>
      <div style={{ fontSize: 36, fontWeight: 700, color: "#B9C6D8" }}>"그래서, 나랑 무슨 상관?"</div>
    </div>
  );
};

const Gauge: React.FC<{ f: number }> = ({ f }) => {
  const op = prog(f, SAY_A - 10, 16) * (1 - prog(f, ORDER_AT - 12, 14));
  if (op <= 0) return null;
  const a = attention(f);
  const lit = f > BACK_AT;
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: 1105, opacity: op, display: "flex", alignItems: "center", gap: 20 }}>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 4, color: SUB, whiteSpace: "nowrap" }}>집중도 <span style={{ letterSpacing: 1, fontWeight: 400 }}>· 예시</span></div>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ width: `${a * 100}%`, height: "100%", borderRadius: 4, background: lit ? AMBER : "#AEB5C0" }} />
      </div>
      <div style={{ width: 90, textAlign: "right", fontSize: 32, fontWeight: 700, color: lit ? AMBER : INK, fontVariantNumeric: "tabular-nums" }}>{Math.round(a * 100)}%</div>
    </div>
  );
};

// The order: content-first vs reason-first
const Order: React.FC<{ f: number }> = ({ f }) => {
  const op = interpolate(f, [ORDER_AT, ORDER_AT + 16, END_AT - 8, END_AT + 10], [0, 1, 1, 0], clamp);
  if (op <= 0) return null;
  const sw = progIO(f, SWAP[0], SWAP[1] - SWAP[0]);
  const lift = Math.sin(Math.PI * sw) * 55;
  const L = 330, Rr = 750, Y = 720;
  const block = (label: string, x: number, y: number, amber: boolean) => (
    <div style={{
      position: "absolute", left: x - 120, top: y, width: 240, height: 92, borderRadius: 12,
      border: `2px solid ${amber ? AMBER : "#7C8594"}`, background: amber ? "#2A251C" : "#161B23",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 700, color: amber ? AMBER : BODY,
    }}>{label}</div>
  );
  const done = prog(f, SWAP[1] + 4, 16);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      {block("내용", lerp(L, Rr, sw), Y + lift, false)}
      {block("이유", lerp(Rr, L, sw), Y - lift, true)}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <line x1={L + 132} y1={Y + 46} x2={Rr - 140} y2={Y + 46} stroke={SUB} strokeWidth={2} opacity={1 - Math.sin(Math.PI * sw)} />
        <path d={`M ${Rr - 150} ${Y + 38} L ${Rr - 136} ${Y + 46} L ${Rr - 150} ${Y + 54}`} stroke={SUB} strokeWidth={2} fill="none" opacity={1 - Math.sin(Math.PI * sw)} />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: Y - 120, textAlign: "center", fontSize: 28, fontWeight: 700 }}>
        <span style={{ color: SUB, opacity: 1 - done, position: "absolute", left: 0, right: 0 }}>흘려듣게 되는 순서</span>
        <span style={{ color: AMBER, opacity: done, position: "absolute", left: 0, right: 0 }}>귀가 열리는 순서</span>
      </div>
    </div>
  );
};

const Conclusion: React.FC<{ f: number }> = ({ f }) => {
  if (f < END_AT) return null;
  const big: React.CSSProperties = { fontSize: 62, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.3 };
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP - 20 }}>
      <Line f={f} at={END_AT + 6} style={big}>내 말을 <span style={{ color: AMBER }}>왜 들어야 하는지,</span></Line>
      <Line f={f} at={END_AT + 30} style={big}>먼저 알려주고 시작하자.</Line>
      <div style={{ height: 20 }} />
      <Line f={f} at={END_AT + 62} style={{ fontSize: 34, color: SUB, lineHeight: 1.5 }}>이게 없으면, 설득력이 없다.</Line>
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

export const WhyListen: React.FC = () => {
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
        <Overline f={f} from={6} to={450} tag="THE FIRST LINE" text="회의실 첫 마디" color={INK} />
        <Overline f={f} from={THOUGHT_AT - 4} to={600} tag="WHAT THEY THINK" text="듣는 사람의 속마음" color={INK} />
        <Overline f={f} from={SAY_B - 4} to={900} tag="REASON FIRST" text="같은 내용, 다른 첫 마디" color={AMBER} />
        <Overline f={f} from={ORDER_AT - 2} to={1110} tag="THE ORDER" text="이유 → 내용" color={AMBER} />
        <Overline f={f} from={END_AT - 2} to={TOTAL + 10} tag="CONCLUSION" text="설득의 시작" color={AMBER} />
        <Room f={f} />
        <Speech f={f} />
        <Thought f={f} />
        <Gauge f={f} />
        <Order f={f} />
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
