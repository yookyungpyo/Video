import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { Cat, Fonts, CatMood } from "../catnote/CatNote";

// Cat-note style, topic: "Lead, follow, or get out of the way — 셋 중 하나만 해."
const G = "Gaegu";
const BG = "#0E0E10";
const INK = "#F2F1EA";
const DIM = "#8A8A86";
const ORANGE = "#E9A23B";
const YELLOW = "#ECE24C";

const D = { stroke: INK, strokeWidth: 4, fill: "none" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const person = (x: number, cy: number, r: number) => `M${x} ${cy + r + 2} L${x - r * 1.3} ${cy + r * 3.4} L${x + r * 1.3} ${cy + r * 3.4} Z`;

const ThreeWayDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <path d="M150 172 L150 116" /><circle cx={150} cy={172} r={5} fill={INK} />
    <path d="M150 116 L92 66 M92 66 L96 86 M92 66 L112 72" />
    <path d="M150 116 L150 54 M150 54 L141 72 M150 54 L159 72" />
    <path d="M150 116 L208 66 M208 66 L188 72 M208 66 L204 86" />
  </g></svg>
);
const LeadDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <g opacity={0.5}>{[54, 84].map((x) => <g key={x}><circle cx={x} cy={104} r={10} /><path d={person(x, 104, 10)} /></g>)}</g>
    <circle cx={132} cy={92} r={16} /><path d={person(132, 92, 16)} />
    <path d="M150 100 L206 100 M206 100 L188 90 M206 100 L188 110" />
    <path d="M132 76 L132 52 L156 60 L132 68" />
  </g></svg>
);
const FollowDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    {[92, 150, 208].map((x, i) => <g key={x} opacity={0.65 + i * 0.12}><circle cx={x} cy={86} r={13} /><path d={person(x, 86, 13)} /></g>)}
    <path d="M74 160 L226 160 M226 160 L208 150 M226 160 L208 170" />
  </g></svg>
);
const AsideDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <g opacity={0.6}><circle cx={150} cy={60} r={13} /><path d={person(150, 60, 13)} /></g>
    <path d="M118 84 q28 -16 56 0" strokeWidth={3} opacity={0.5} strokeDasharray="5 7" />
    <path d="M56 148 L236 148 M236 148 L216 137 M236 148 L216 159" strokeWidth={5} />
  </g></svg>
);

type Card = { head: string; bracket: string; sub: string; doodle: React.FC; mood: CatMood };
const CARDS: Card[] = [
  { head: "조직에서 넌", bracket: "셋 중 하나", sub: "무엇이든 하나는 골라라", doodle: ThreeWayDoodle, mood: "curious" },
  { head: "① 이끌든가", bracket: "앞에서 책임져라", sub: "방향을 정하고 짊어져라", doodle: LeadDoodle, mood: "calm" },
  { head: "② 따르든가", bracket: "제대로 밀어라", sub: "정해졌으면 힘을 보태라", doodle: FollowDoodle, mood: "question" },
  { head: "③ 비키든가", bracket: "길을 막지 마라", sub: "못 할 거면 자리를 내줘라", doodle: AsideDoodle, mood: "wink" },
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
    <div style={{ position: "absolute", top: 360, width: "100%", textAlign: "center", color: INK }}>
      <div style={{ fontSize: 72, ...rise(local, 0) }}>이끌든 따르든 비키든</div>
      <div style={{ fontSize: 78, marginTop: 6, ...rise(local, 6) }}>하나만 골라</div>
      <div style={{ fontSize: 92, color: YELLOW, marginTop: 36, ...rise(local, 16) }}>
        <span style={{ opacity: 0.9 }}>[ </span>고르면 다 옳다<span style={{ opacity: 0.9 }}> ]</span>
      </div>
    </div>
    <div style={{ position: "absolute", top: 980, width: "100%", textAlign: "center", ...rise(local, 26) }}>
      <div style={{ fontSize: 56, color: YELLOW }}>고른 쪽을</div>
      <div style={{ fontSize: 50, color: DIM, marginTop: 12 }}>끝까지</div>
      <div style={{ fontSize: 74, color: INK, marginTop: 8 }}>밀고 가라</div>
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
