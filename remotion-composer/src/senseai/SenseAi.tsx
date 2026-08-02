import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { Cat, Fonts, CatMood } from "../catnote/CatNote";

// Cat-note style, topic: "Sense × AI = better work"
const G = "Gaegu";
const BG = "#0E0E10";
const INK = "#F2F1EA";
const DIM = "#8A8A86";
const ORANGE = "#E9A23B";
const YELLOW = "#ECE24C";

const D = { stroke: INK, strokeWidth: 4, fill: "none" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const SameDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <rect x={52} y={62} width={78} height={78} rx={14} /><circle cx={91} cy={101} r={12} />
    <rect x={170} y={62} width={78} height={78} rx={14} /><circle cx={209} cy={101} r={12} />
    <path d="M144 92 h12 M144 110 h12" strokeWidth={3.4} />
  </g></svg>
);
const MultiplyDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <path d="M118 68 L182 132 M182 68 L118 132" strokeWidth={6} />
    <path d="M96 60 L96 74 M89 67 L103 67 M214 128 L214 142 M207 135 L221 135" strokeWidth={3} />
  </g></svg>
);
const EyeDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <path d="M64 100 Q150 46 236 100 Q150 154 64 100 Z" />
    <circle cx={150} cy={100} r={24} /><circle cx={150} cy={100} r={5} fill={INK} />
  </g></svg>
);
const AmplifyDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <path d="M70 84 L70 116 L150 150 L150 50 Z" />
    <path d="M170 82 a22 22 0 0 1 0 36 M188 68 a40 40 0 0 1 0 64" />
  </g></svg>
);

type Card = { head: string; bracket: string; sub: string; doodle: React.FC; mood: CatMood };
const CARDS: Card[] = [
  { head: "AI만 잘 써선", bracket: "차이가 안 난다", sub: "누구나 같은 도구를 쥔 시대", doodle: SameDoodle, mood: "curious" },
  { head: "AI를 곱하는 건", bracket: "너의 센스", sub: "무엇이 좋은지 아는 감각", doodle: MultiplyDoodle, mood: "calm" },
  { head: "센스란", bracket: "문제를 보는 눈", sub: "고객이 진짜 원하는 걸 읽는다", doodle: EyeDoodle, mood: "question" },
  { head: "더하기가 아니라", bracket: "곱하기다", sub: "센스가 0이면 결과도 0", doodle: AmplifyDoodle, mood: "wink" },
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
    <div style={{ position: "absolute", top: 356, width: "100%", textAlign: "center", color: INK }}>
      <div style={{ fontSize: 88, ...rise(local, 0) }}>Sense × AI</div>
      <div style={{ fontSize: 82, marginTop: 6, color: YELLOW, ...rise(local, 6) }}>= better work</div>
      <div style={{ fontSize: 90, color: YELLOW, marginTop: 40, ...rise(local, 16) }}>
        <span style={{ opacity: 0.9 }}>[ </span>센스를 키워라<span style={{ opacity: 0.9 }}> ]</span>
      </div>
    </div>
    <div style={{ position: "absolute", top: 980, width: "100%", textAlign: "center", ...rise(local, 26) }}>
      <div style={{ fontSize: 56, color: YELLOW }}>AI는 증폭기일 뿐</div>
      <div style={{ fontSize: 50, color: DIM, marginTop: 12 }}>센스가 원본이다</div>
      <div style={{ fontSize: 74, color: INK, marginTop: 8 }}>감각부터 길러라</div>
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
