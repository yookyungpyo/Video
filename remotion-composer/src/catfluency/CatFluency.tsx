import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { Cat, Fonts } from "../catnote/CatNote";

// Same minimal dark handwritten "cat note" style, topic: "AI 유창성" (AI fluency).
const G = "Gaegu";
const BG = "#0E0E10";
const INK = "#F2F1EA";
const DIM = "#8A8A86";
const ORANGE = "#E9A23B";
const YELLOW = "#ECE24C";

const D = { stroke: INK, strokeWidth: 4, fill: "none" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

// ---- doodles ----
const ChatDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <rect x={34} y={44} width={120} height={72} rx={18} />
    <path d="M66 116 L64 140 L92 116" />
    <path d="M64 74 h60 M64 92 h44" strokeWidth={3.4} />
    <rect x={150} y={92} width={116} height={64} rx={18} />
    <path d="M236 156 L238 176 L212 156" />
    <path d="M176 118 h64 M176 134 h40" strokeWidth={3.4} />
  </g></svg>
);
const GrowDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <path d="M60 158 L120 128 L162 140 L214 66" />
    <path d="M214 66 L190 68 M214 66 L212 92" />
    <circle cx={60} cy={158} r={4} fill={INK} /><circle cx={120} cy={128} r={4} fill={INK} /><circle cx={162} cy={140} r={4} fill={INK} />
  </g></svg>
);
const AskDoodle: React.FC = () => (
  <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
    <path d="M74 46 h150 a20 20 0 0 1 20 20 v56 a20 20 0 0 1 -20 20 h-58 l-30 26 l5 -26 h-67 a20 20 0 0 1 -20 -20 v-56 a20 20 0 0 1 20 -20 Z" />
    <path d="M132 84 a18 18 0 1 1 22 22 c-6 5 -9 8 -9 15" strokeWidth={4.4} />
    <path d="M145 132 l0 4" strokeWidth={5} />
  </g></svg>
);
const BalanceDoodle: React.FC = () => (
  <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
    <path d="M150 46 L150 150 M124 160 L176 160 M150 150 L150 160" />
    <path d="M94 60 L206 60" />
    <path d="M94 60 L80 94 M94 60 L108 94 M78 94 a18 7 0 0 0 34 0" />
    <path d="M206 60 L192 94 M206 60 L220 94 M190 94 a18 7 0 0 0 34 0" />
  </g></svg>
);

type Card = { head: string; bracket: string; sub: string; doodle: React.FC };
const CARDS: Card[] = [
  { head: "AI 유창성이란", bracket: "검색이 아니라 대화", sub: "정답을 찾는 게 아니라 함께 만든다", doodle: ChatDoodle },
  { head: "언어를 배우듯", bracket: "쓸수록 늘어난다", sub: "재능이 아니라 반복의 결과", doodle: GrowDoodle },
  { head: "유창한 사람은", bracket: "질문이 다르다", sub: "무엇을 어떻게 물을지 안다", doodle: AskDoodle },
  { head: "동시에 안다", bracket: "어디까지 믿을지", sub: "AI의 한계와 실수를 감지한다", doodle: BalanceDoodle },
];

const rise = (p: number, d = 0) => {
  const o = interpolate(p, [d, d + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const y = interpolate(p, [d, d + 22], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return { opacity: o, transform: `translateY(${y}px)` };
};

const ArgCard: React.FC<{ c: Card; local: number }> = ({ c, local }) => {
  const Doodle = c.doodle;
  return (
    <AbsoluteFill style={{ background: BG, fontFamily: G }}>
      <div style={{ position: "absolute", top: 300, width: "100%", textAlign: "center", fontSize: 82, color: INK, ...rise(local, 0) }}>{c.head}</div>
      <div style={{ position: "absolute", top: 520, width: "100%", textAlign: "center", fontSize: 78, color: ORANGE, ...rise(local, 8) }}>
        <span style={{ opacity: 0.85 }}>[ </span>{c.bracket}<span style={{ opacity: 0.85 }}> ]</span>
      </div>
      <div style={{ position: "absolute", top: 656, width: "100%", textAlign: "center", fontSize: 44, color: DIM, ...rise(local, 18) }}>{c.sub}</div>
      <div style={{ position: "absolute", top: 900, width: "100%", display: "flex", justifyContent: "center", ...rise(local, 12) }}><Doodle /></div>
      <div style={{ position: "absolute", top: 1520, width: "100%", display: "flex", justifyContent: "center" }}><Cat /></div>
    </AbsoluteFill>
  );
};

const CloseCard: React.FC<{ local: number }> = ({ local }) => (
  <AbsoluteFill style={{ background: BG, fontFamily: G }}>
    <div style={{ position: "absolute", top: 380, width: "100%", textAlign: "center", color: INK }}>
      <div style={{ fontSize: 66, ...rise(local, 0) }}>지식은 검색되고</div>
      <div style={{ fontSize: 66, marginTop: 4, ...rise(local, 6) }}>유창함은 쌓인다</div>
      <div style={{ fontSize: 80, color: YELLOW, marginTop: 34, ...rise(local, 16) }}>
        <span style={{ opacity: 0.9 }}>[ </span>격차는 벌어진다<span style={{ opacity: 0.9 }}> ]</span>
      </div>
    </div>
    <div style={{ position: "absolute", top: 940, width: "100%", textAlign: "center", ...rise(local, 26) }}>
      <div style={{ fontSize: 48, color: YELLOW }}>AI는 도구가 아니라 언어</div>
      <div style={{ fontSize: 42, color: DIM, marginTop: 10 }}>겁내지 말고</div>
      <div style={{ fontSize: 62, color: INK, marginTop: 6 }}>오늘부터 말 걸어라</div>
    </div>
    <div style={{ position: "absolute", top: 1520, width: "100%", display: "flex", justifyContent: "center" }}><Cat /></div>
  </AbsoluteFill>
);

export const Note1: React.FC = () => <><Fonts /><ArgCard c={CARDS[0]} local={40} /></>;
export const Note2: React.FC = () => <><Fonts /><ArgCard c={CARDS[1]} local={40} /></>;
export const Note3: React.FC = () => <><Fonts /><ArgCard c={CARDS[2]} local={40} /></>;
export const Note4: React.FC = () => <><Fonts /><ArgCard c={CARDS[3]} local={40} /></>;
export const Note5: React.FC = () => <><Fonts /><CloseCard local={40} /></>;

const SCENE = 108;
export const REEL_DUR = SCENE * 5;
export const CatReel: React.FC = () => {
  const gf = useCurrentFrame();
  const scenes = [0, 1, 2, 3, 4];
  const cur = Math.min(4, Math.floor(gf / SCENE));
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Fonts />
      {scenes.map((s) => {
        const start = s * SCENE;
        const local = gf - start;
        const visible = local >= 0 && local < SCENE;
        const lc = Math.max(0, Math.min(SCENE - 1, local));
        return (
          <AbsoluteFill key={s} style={{ opacity: visible ? 1 : 0 }}>
            {s < 4 ? <ArgCard c={CARDS[s]} local={lc} /> : <CloseCard local={lc} />}
          </AbsoluteFill>
        );
      })}
      <div style={{ position: "absolute", top: 40, left: 40, right: 40, display: "flex", gap: 8 }}>
        {scenes.map((s) => (
          <div key={s} style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.22)", overflow: "hidden" }}>
            <div style={{ width: s < cur ? "100%" : s === cur ? `${interpolate(gf - cur * SCENE, [0, SCENE], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%` : "0%", height: "100%", background: INK }} />
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
