import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { Cat, Fonts, CatMood } from "../catnote/CatNote";

// Cat-note style, topic: "힘을 가진 사람은 꽤 자주 자기 기분을 업무처럼 이야기한다"
const G = "Gaegu";
const BG = "#0E0E10";
const INK = "#F2F1EA";
const DIM = "#8A8A86";
const ORANGE = "#E9A23B";
const YELLOW = "#ECE24C";

const D = { stroke: INK, strokeWidth: 4, fill: "none" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const person = (x: number, cy: number, r: number) => `M${x} ${cy + r + 2} L${x - r * 1.3} ${cy + r * 3.4} L${x + r * 1.3} ${cy + r * 3.4} Z`;

const PowerDoodle: React.FC = () => (
  <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
    <path d="M96 178 L204 178 L204 150 L96 150 Z" /><path d="M96 164 L204 164" strokeWidth={2.6} />
    <circle cx={150} cy={92} r={16} /><path d={person(150, 92, 16)} />
  </g></svg>
);
const MoodAgendaDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <circle cx={80} cy={100} r={30} /><circle cx={70} cy={92} r={2.5} fill={INK} /><circle cx={90} cy={92} r={2.5} fill={INK} />
    <path d="M68 114 q12 -10 24 0" />
    <path d="M124 100 L164 100 M164 100 L150 90 M164 100 L150 110" />
    <path d="M186 82 h56 M186 100 h56 M186 118 h40" strokeWidth={3.2} />
  </g></svg>
);
const MaskDoodle: React.FC = () => (
  <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
    <path d="M150 40 C104 40 92 78 92 108 C92 140 118 166 150 166 C182 166 208 140 208 108 C208 78 196 40 150 40 Z" />
    <path d="M120 96 q12 -10 24 0 M156 96 q12 -10 24 0" strokeWidth={3.4} />
    <path d="M132 128 q18 12 36 0" strokeWidth={3.4} />
    <path d="M150 166 L150 190" />
  </g></svg>
);
const BurdenDoodle: React.FC = () => (
  <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
    <rect x={100} y={44} width={100} height={40} rx={6} />
    <path d="M92 58 L82 74 M208 58 L218 74" strokeWidth={3} />
    <circle cx={150} cy={110} r={15} />
    <path d="M150 126 L128 84 M150 126 L172 84" />
    <path d="M150 126 L150 152 M150 140 L130 172 M150 140 L170 172" />
  </g></svg>
);

type Card = { head: string; bracket: string; sub: string; doodle: React.FC; mood: CatMood };
const CARDS: Card[] = [
  { head: "힘을 가진 사람은", bracket: "꽤 자주", sub: "자기 기분을 업무처럼 말한다", doodle: PowerDoodle, mood: "curious" },
  { head: "그의 기분이", bracket: "곧 안건이 된다", sub: "오늘의 분위기가 팀의 우선순위", doodle: MoodAgendaDoodle, mood: "calm" },
  { head: "겉은 업무인데", bracket: "속은 기분", sub: "논리 같지만 실은 그날의 컨디션", doodle: MaskDoodle, mood: "question" },
  { head: "약한 쪽이", bracket: "대신 치른다", sub: "눈치 보며 그 기분을 감당한다", doodle: BurdenDoodle, mood: "wink" },
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

const CloseCard: React.FC<{ local: number }> = ({ local }) => (
  <AbsoluteFill style={{ background: BG, fontFamily: G }}>
    <div style={{ position: "absolute", top: 360, width: "100%", textAlign: "center", color: INK }}>
      <div style={{ fontSize: 78, ...rise(local, 0) }}>힘이 클수록</div>
      <div style={{ fontSize: 78, marginTop: 4, ...rise(local, 6) }}>네 기분은 비싸진다</div>
      <div style={{ fontSize: 92, color: YELLOW, marginTop: 36, ...rise(local, 16) }}>
        <span style={{ opacity: 0.9 }}>[ </span>일에 섞지 마라<span style={{ opacity: 0.9 }}> ]</span>
      </div>
    </div>
    <div style={{ position: "absolute", top: 970, width: "100%", textAlign: "center", ...rise(local, 26) }}>
      <div style={{ fontSize: 56, color: YELLOW }}>감정은 네 것</div>
      <div style={{ fontSize: 50, color: DIM, marginTop: 12 }}>일은 모두의 것</div>
      <div style={{ fontSize: 74, color: INK, marginTop: 8 }}>선을 지켜라</div>
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
