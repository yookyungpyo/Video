import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { Cat, Fonts, CatMood } from "../catnote/CatNote";

// Cat-note style, topic: "조직은 결국 사람을 닮습니다"
const G = "Gaegu";
const BG = "#0E0E10";
const INK = "#F2F1EA";
const DIM = "#8A8A86";
const ORANGE = "#E9A23B";
const YELLOW = "#ECE24C";

const D = { stroke: INK, strokeWidth: 4, fill: "none" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const person = (x: number, cy: number, r: number) => `M${x} ${cy + r + 2} L${x - r * 1.3} ${cy + r * 3.6} L${x + r * 1.3} ${cy + r * 3.6} Z`;

const PeopleDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    {[90, 150, 210].map((x) => <g key={x}><circle cx={x} cy={72} r={16} /><path d={person(x, 72, 16)} /></g>)}
  </g></svg>
);
const MirrorDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <path d="M150 34 L150 168" strokeDasharray="7 10" />
    <circle cx={104} cy={78} r={15} /><path d={person(104, 78, 15)} />
    <g opacity={0.55}><circle cx={196} cy={78} r={15} /><path d={person(196, 78, 15)} /></g>
  </g></svg>
);
const LeadDoodle: React.FC = () => (
  <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
    <circle cx={104} cy={78} r={19} /><path d={person(104, 78, 19)} />
    {[176, 214, 252].map((x, i) => <g key={x} opacity={0.7}><circle cx={x} cy={96 - (i % 2) * 4} r={11} /><path d={person(x, 96 - (i % 2) * 4, 11)} /></g>)}
  </g></svg>
);
const FloorDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <path d="M46 66 L108 66 L108 100 L170 100 L170 134 L232 134" />
    <path d="M232 134 L232 168 M218 154 L232 168 L246 154" strokeWidth={3.6} />
  </g></svg>
);

type Card = { head: string; bracket: string; sub: string; doodle: React.FC; mood: CatMood };
const CARDS: Card[] = [
  { head: "문화는 구호가 아니라", bracket: "사람이다", sub: "벽에 붙은 가치가 아니라 곁의 사람", doodle: PeopleDoodle, mood: "curious" },
  { head: "조직은 결국", bracket: "사람을 닮는다", sub: "뽑고 남기고 올린 사람만큼", doodle: MirrorDoodle, mood: "calm" },
  { head: "특히 윗사람을", bracket: "그대로 닮는다", sub: "말이 아니라 행동을 따라간다", doodle: LeadDoodle, mood: "question" },
  { head: "용인한 최악이", bracket: "조직의 기준", sub: "봐준 만큼 수준이 내려간다", doodle: FloorDoodle, mood: "wink" },
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
      <div style={{ fontSize: 78, ...rise(local, 0) }}>전략도 시스템도</div>
      <div style={{ fontSize: 78, marginTop: 4, ...rise(local, 6) }}>결국 사람이 한다</div>
      <div style={{ fontSize: 92, color: YELLOW, marginTop: 36, ...rise(local, 16) }}>
        <span style={{ opacity: 0.9 }}>[ </span>사람이 곧 문화다<span style={{ opacity: 0.9 }}> ]</span>
      </div>
    </div>
    <div style={{ position: "absolute", top: 970, width: "100%", textAlign: "center", ...rise(local, 26) }}>
      <div style={{ fontSize: 56, color: YELLOW }}>누굴 뽑고</div>
      <div style={{ fontSize: 50, color: DIM, marginTop: 12 }}>누굴 남길지</div>
      <div style={{ fontSize: 74, color: INK, marginTop: 8 }}>그게 조직을 만든다</div>
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
