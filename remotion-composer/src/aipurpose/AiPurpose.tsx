import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { Cat, Fonts, CatMood } from "../catnote/CatNote";

// Cat-note minimal dark style, topic (essay IMG_5201):
// "AI는 변화이지, 목적이 아니다" — adapt fast, but the purpose stays: solve the
// customer's problem more deeply. Cat wears a different expression per card.
const G = "Gaegu";
const BG = "#0E0E10";
const INK = "#F2F1EA";
const DIM = "#8A8A86";
const ORANGE = "#E9A23B";
const YELLOW = "#ECE24C";

const D = { stroke: INK, strokeWidth: 4, fill: "none" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const ChangeDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <path d="M46 156 C96 156 156 132 206 66" />
    <path d="M206 66 L182 70 M206 66 L202 94" />
    <path d="M118 52 L118 74 M107 63 L129 63" strokeWidth={3.4} />
    <path d="M244 120 L244 138 M235 129 L253 129" strokeWidth={3.4} />
  </g></svg>
);
const TargetDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <circle cx={150} cy={100} r={46} /><circle cx={150} cy={100} r={30} /><circle cx={150} cy={100} r={15} />
    <circle cx={150} cy={100} r={4} fill={INK} />
  </g></svg>
);
const SwapDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <path d="M64 82 L214 82 M214 82 L194 72 M214 82 L194 92" />
    <path d="M214 126 L64 126 M64 126 L84 116 M64 126 L84 136" />
  </g></svg>
);
const ForkDoodle: React.FC = () => (
  <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
    <path d="M150 170 L150 116 M150 116 L100 72 M150 116 L200 72" />
    <path d="M84 64 l8 9 l15 -19" />
    <path d="M191 56 l18 18 M209 56 l-18 18" strokeWidth={3.6} />
  </g></svg>
);

type Card = { head: string; bracket: string; sub: string; doodle: React.FC; mood: CatMood };
const CARDS: Card[] = [
  { head: "AI는 변화지", bracket: "목적이 아니다", sub: "일하는 방식은 바뀌어도", doodle: ChangeDoodle, mood: "curious" },
  { head: "목적은 여전히", bracket: "고객의 문제", sub: "더 깊이 이해하고 더 잘 푸는 것", doodle: TargetDoodle, mood: "calm" },
  { head: "요즘은 거꾸로", bracket: "AI부터 생각한다", sub: "고객 문제보다 'AI로 뭘 만들까'부터", doodle: SwapDoodle, mood: "question" },
  { head: "AI 유창함은", bracket: "쓸 곳을 아는 것", sub: "어디에 쓰고, 어디엔 안 쓸지", doodle: ForkDoodle, mood: "wink" },
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
      <div style={{ position: "absolute", top: 1500, width: "100%", display: "flex", justifyContent: "center" }}><Cat mood={c.mood} /></div>
    </AbsoluteFill>
  );
};

const CloseCard: React.FC<{ local: number }> = ({ local }) => (
  <AbsoluteFill style={{ background: BG, fontFamily: G }}>
    <div style={{ position: "absolute", top: 380, width: "100%", textAlign: "center", color: INK }}>
      <div style={{ fontSize: 66, ...rise(local, 0) }}>변화엔 빠르게</div>
      <div style={{ fontSize: 66, marginTop: 4, ...rise(local, 6) }}>적응하되</div>
      <div style={{ fontSize: 80, color: YELLOW, marginTop: 34, ...rise(local, 16) }}>
        <span style={{ opacity: 0.9 }}>[ </span>목적은 그대로<span style={{ opacity: 0.9 }}> ]</span>
      </div>
    </div>
    <div style={{ position: "absolute", top: 940, width: "100%", textAlign: "center", ...rise(local, 26) }}>
      <div style={{ fontSize: 48, color: YELLOW }}>AI로 고객의 문제를</div>
      <div style={{ fontSize: 42, color: DIM, marginTop: 10 }}>더 깊이, 더 잘</div>
      <div style={{ fontSize: 62, color: INK, marginTop: 6 }}>해결하는 회사로</div>
    </div>
    <div style={{ position: "absolute", top: 1500, width: "100%", display: "flex", justifyContent: "center" }}><Cat mood="happy" /></div>
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
