import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { Cat, Fonts, CatMood } from "../catnote/CatNote";

// Cat-note style, topic: persuasion order 결론 → 이유 → 근거 (+ one example card).
const G = "Gaegu";
const BG = "#0E0E10";
const INK = "#F2F1EA";
const DIM = "#8A8A86";
const ORANGE = "#E9A23B";
const YELLOW = "#ECE24C";

const D = { stroke: INK, strokeWidth: 4, fill: "none" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const OrderDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <circle cx={72} cy={70} r={7} fill={INK} /><path d="M94 70 h150" />
    <circle cx={72} cy={100} r={7} fill={INK} /><path d="M94 100 h120" />
    <circle cx={72} cy={130} r={7} fill={INK} /><path d="M94 130 h146" />
  </g></svg>
);
const TargetDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <circle cx={176} cy={100} r={44} /><circle cx={176} cy={100} r={28} /><circle cx={176} cy={100} r={13} />
    <circle cx={176} cy={100} r={4} fill={INK} />
    <path d="M58 100 L128 100 M128 100 L112 90 M128 100 L112 110" />
  </g></svg>
);
const BulbDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <circle cx={150} cy={96} r={34} /><path d="M134 130 h32 M140 142 h20" />
    <path d="M150 44 v-14 M108 60 l-10 -10 M192 60 l10 -10 M96 100 h-14 M204 100 h14" strokeWidth={3.2} />
  </g></svg>
);
const BarsDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <path d="M84 162 h144" />
    <rect x={98} y={120} width={24} height={40} /><rect x={138} y={96} width={24} height={64} /><rect x={178} y={72} width={24} height={88} />
  </g></svg>
);

type Card = { head: string; bracket: string; sub: string; doodle: React.FC; mood: CatMood };
const CARDS: Card[] = [
  { head: "설득은", bracket: "순서가 9할", sub: "무엇을 먼저 말하느냐", doodle: OrderDoodle, mood: "curious" },
  { head: "① 먼저", bracket: "결론부터", sub: "듣는 사람은 결론이 급하다", doodle: TargetDoodle, mood: "calm" },
  { head: "② 그다음", bracket: "이유를", sub: "왜 그런지 한 문장으로", doodle: BulbDoodle, mood: "question" },
  { head: "③ 끝으로", bracket: "근거로 못 박기", sub: "숫자·사례로 증명한다", doodle: BarsDoodle, mood: "wink" },
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
      <div style={{ position: "absolute", top: 1520, width: "100%", display: "flex", justifyContent: "center" }}><Cat mood={c.mood} /></div>
    </AbsoluteFill>
  );
};

const exRow = (label: string, color: string, text: string) => (
  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 22, marginTop: 26 }}>
    <span style={{ fontSize: 40, color, minWidth: 96, textAlign: "right" }}>{label}</span>
    <span style={{ fontSize: 62, color: INK }}>{text}</span>
  </div>
);

const CloseCard: React.FC<{ local: number }> = ({ local }) => (
  <AbsoluteFill style={{ background: BG, fontFamily: G }}>
    <div style={{ position: "absolute", top: 300, width: "100%", textAlign: "center", fontSize: 50, color: DIM, ...rise(local, 0) }}>이렇게 한 번에</div>
    <div style={{ position: "absolute", top: 430, width: "100%", ...rise(local, 8) }}>
      {exRow("결론", YELLOW, "이 안으로 가시죠")}
      {exRow("이유", ORANGE, "제일 빠르니까요")}
      {exRow("근거", "#9AD1C4", "지난달 30% 단축됐고요")}
    </div>
    <div style={{ position: "absolute", top: 900, width: "100%", textAlign: "center", ...rise(local, 22) }}>
      <div style={{ fontSize: 90, color: YELLOW }}>
        <span style={{ opacity: 0.9 }}>[ </span>결론부터 말하라<span style={{ opacity: 0.9 }}> ]</span>
      </div>
      <div style={{ fontSize: 54, color: DIM, marginTop: 22 }}>순서만 바꿔도 통한다</div>
    </div>
    <div style={{ position: "absolute", top: 1520, width: "100%", display: "flex", justifyContent: "center" }}><Cat mood="happy" /></div>
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
