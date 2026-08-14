import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { Cat, Fonts, CatMood } from "../catnote/CatNote";

// Cat-note style, topic: "AI만이 살아남아" — twist: the one who USES AI survives.
const G = "Gaegu";
const BG = "#0E0E10";
const INK = "#F2F1EA";
const DIM = "#8A8A86";
const ORANGE = "#E9A23B";
const YELLOW = "#ECE24C";

const D = { stroke: INK, strokeWidth: 4, fill: "none" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const person = (x: number, cy: number, r: number) => `M${x} ${cy + r + 2} L${x - r * 1.3} ${cy + r * 3.4} L${x + r * 1.3} ${cy + r * 3.4} Z`;

const SurvivorDoodle: React.FC = () => (
  <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
    <g opacity={0.5}><circle cx={54} cy={150} r={10} /><path d="M54 160 L94 172" /></g>
    <g opacity={0.5}><circle cx={246} cy={150} r={10} /><path d="M246 160 L206 172" /></g>
    <circle cx={150} cy={92} r={16} /><path d={person(150, 92, 16)} />
    <path d="M166 76 L166 50 L190 58 L166 66" />
  </g></svg>
);
const WieldDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <circle cx={108} cy={110} r={16} /><path d={person(108, 110, 16)} />
    <path d="M108 126 L150 84" />
    <rect x={150} y={54} width={40} height={34} rx={6} /><rect x={162} y={64} width={16} height={14} rx={2} />
    <path d="M158 54 v-8 M170 54 v-8 M182 54 v-8 M158 88 v8 M170 88 v8 M182 88 v8" strokeWidth={3} />
  </g></svg>
);
const DesksDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <circle cx={92} cy={104} r={12} /><path d="M60 130 h64 M70 130 v26 M114 130 v26" />
    <rect x={78} y={64} width={28} height={22} rx={4} /><path d="M118 62 l10 -8 M120 74 l12 -2" strokeWidth={2.6} stroke={YELLOW} />
    <g opacity={0.55}><circle cx={210} cy={104} r={12} /><path d="M178 130 h64 M188 130 v26 M232 130 v26" /></g>
  </g></svg>
);
const MindDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <circle cx={150} cy={112} r={42} />
    <path d="M132 112 l12 16 l26 -34" strokeWidth={5} />
    <text x={196} y={72} fontFamily={G} fontSize={44} fill={INK} stroke="none">?</text>
  </g></svg>
);

type Card = { head: string; bracket: string; sub: string; doodle: React.FC; mood: CatMood };
const CARDS: Card[] = [
  { head: "이제는", bracket: "AI만 살아남아", sub: "다들 그렇게 말한다", doodle: SurvivorDoodle, mood: "curious" },
  { head: "아니, 사실은", bracket: "쓰는 사람이 산다", sub: "AI가 아니라 다루는 사람", doodle: WieldDoodle, mood: "calm" },
  { head: "널 대체하는 건", bracket: "옆자리 동료", sub: "AI가 아니라 AI 쓰는 사람", doodle: DesksDoodle, mood: "question" },
  { head: "사람의 몫은", bracket: "판단과 질문", sub: "AI가 못 하는 걸 한다", doodle: MindDoodle, mood: "wink" },
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

const CloseCard: React.FC<{ local: number }> = ({ local }) => (
  <AbsoluteFill style={{ background: BG, fontFamily: G }}>
    <div style={{ position: "absolute", top: 356, width: "100%", textAlign: "center", color: INK }}>
      <div style={{ fontSize: 74, ...rise(local, 0) }}>AI가 이기는 게 아니라</div>
      <div style={{ fontSize: 78, marginTop: 6, ...rise(local, 6) }}>쓰는 사람이 이긴다</div>
      <div style={{ fontSize: 90, color: YELLOW, marginTop: 36, ...rise(local, 16) }}>
        <span style={{ opacity: 0.9 }}>[ </span>도구가 아니라 무기<span style={{ opacity: 0.9 }}> ]</span>
      </div>
    </div>
    <div style={{ position: "absolute", top: 980, width: "100%", textAlign: "center", ...rise(local, 26) }}>
      <div style={{ fontSize: 56, color: YELLOW }}>겁내지 말고</div>
      <div style={{ fontSize: 50, color: DIM, marginTop: 12 }}>먼저 손에 쥐어라</div>
      <div style={{ fontSize: 74, color: INK, marginTop: 8 }}>오늘부터 써라</div>
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
