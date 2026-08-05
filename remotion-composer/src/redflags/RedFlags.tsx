import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { Cat, Fonts, CatMood } from "../catnote/CatNote";

// Cat-note style (6 cards), topic: "난 이런 사람과 일 안 한다" + 5 red flags.
const G = "Gaegu";
const BG = "#0E0E10";
const INK = "#F2F1EA";
const DIM = "#8A8A86";
const ORANGE = "#E9A23B";

const D = { stroke: INK, strokeWidth: 4, fill: "none" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const person = (x: number, cy: number, r: number) => `M${x} ${cy + r + 2} L${x - r * 1.3} ${cy + r * 3.6} L${x + r * 1.3} ${cy + r * 3.6} Z`;

const NoPersonDoodle: React.FC = () => (
  <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
    <circle cx={150} cy={80} r={17} /><path d={person(150, 80, 17)} />
    <circle cx={150} cy={108} r={78} /><path d="M96 58 L204 158" strokeWidth={5} />
  </g></svg>
);
const CrownDoodle: React.FC = () => (
  <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
    <circle cx={150} cy={126} r={30} />
    <path d="M118 100 L126 70 L142 92 L150 62 L158 92 L174 70 L182 100 Z" />
    <path d="M206 108 l0 16 M198 116 l16 0" strokeWidth={3} />
  </g></svg>
);
const MedalDoodle: React.FC = () => (
  <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
    <path d="M134 86 L122 50 M166 86 L178 50" />
    <circle cx={150} cy={120} r={30} /><circle cx={150} cy={120} r={11} />
  </g></svg>
);
const NoClapDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <path d="M78 54 h144 a18 18 0 0 1 18 18 v44 a18 18 0 0 1 -18 18 h-66 l-28 24 l4 -24 h-54 a18 18 0 0 1 -18 -18 v-44 a18 18 0 0 1 18 -18 Z" />
    <path d="M92 60 L226 146" strokeWidth={5} />
  </g></svg>
);
const BrokenDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <ellipse cx={108} cy={104} rx={30} ry={20} /><ellipse cx={192} cy={104} rx={30} ry={20} />
    <path d="M150 74 l-10 18 l14 8 l-10 20" strokeWidth={3.4} />
  </g></svg>
);
const RuleXDoodle: React.FC = () => (
  <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
    <rect x={100} y={50} width={100} height={120} rx={12} />
    <path d="M134 42 h32 v16 h-32 Z" />
    <path d="M120 88 h60 M120 110 h60 M120 132 h44" strokeWidth={3.2} />
    <path d="M96 56 L204 168 M204 56 L96 168" strokeWidth={5} />
  </g></svg>
);

type Card = { head: string; bracket: string; sub: string; doodle: React.FC; mood: CatMood };
const CARDS: Card[] = [
  { head: "난 이런 사람과", bracket: "일 안 한다", sub: "함께 못 갈 5가지 유형", doodle: NoPersonDoodle, mood: "curious" },
  { head: "① 나만 아는", bracket: "나르시시스트", sub: "팀보다 늘 자기가 먼저", doodle: CrownDoodle, mood: "calm" },
  { head: "② 티만 내는", bracket: "공명심", sub: "일보다 인정받는 게 목적", doodle: MedalDoodle, mood: "question" },
  { head: "③ 칭찬에", bracket: "인색한 사람", sub: "남의 공을 인정하지 않는다", doodle: NoClapDoodle, mood: "wink" },
  { head: "④ 약속을", bracket: "쉽게 어긴다", sub: "말과 행동이 자꾸 다르다", doodle: BrokenDoodle, mood: "curious" },
  { head: "⑤ 룰을", bracket: "무시하는 사람", sub: "혼자만 예외이고 싶어 한다", doodle: RuleXDoodle, mood: "question" },
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
      <div style={{ position: "absolute", top: 286, width: "100%", textAlign: "center", fontSize: 96, color: INK, ...rise(local, 0) }}>{c.head}</div>
      <div style={{ position: "absolute", top: 512, width: "100%", textAlign: "center", fontSize: 92, color: ORANGE, ...rise(local, 8) }}>
        <span style={{ opacity: 0.85 }}>[ </span>{c.bracket}<span style={{ opacity: 0.85 }}> ]</span>
      </div>
      <div style={{ position: "absolute", top: 664, width: "100%", textAlign: "center", fontSize: 54, color: DIM, ...rise(local, 18) }}>{c.sub}</div>
      <div style={{ position: "absolute", top: 908, width: "100%", display: "flex", justifyContent: "center", ...rise(local, 12) }}><Doodle /></div>
      <div style={{ position: "absolute", top: 1500, width: "100%", display: "flex", justifyContent: "center" }}><Cat mood={c.mood} /></div>
    </AbsoluteFill>
  );
};

export const Note1: React.FC = () => <><Fonts /><ArgCard c={CARDS[0]} local={40} /></>;
export const Note2: React.FC = () => <><Fonts /><ArgCard c={CARDS[1]} local={40} /></>;
export const Note3: React.FC = () => <><Fonts /><ArgCard c={CARDS[2]} local={40} /></>;
export const Note4: React.FC = () => <><Fonts /><ArgCard c={CARDS[3]} local={40} /></>;
export const Note5: React.FC = () => <><Fonts /><ArgCard c={CARDS[4]} local={40} /></>;
export const Note6: React.FC = () => <><Fonts /><ArgCard c={CARDS[5]} local={40} /></>;

const SCENE = 108;
export const REEL_DUR = SCENE * 6;
export const CatReel: React.FC = () => {
  const gf = useCurrentFrame();
  const scenes = [0, 1, 2, 3, 4, 5];
  const cur = Math.min(5, Math.floor(gf / SCENE));
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
            <ArgCard c={CARDS[s]} local={lc} />
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
