import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { Cat, Fonts, CatMood } from "../catnote/CatNote";

// Cat-note style, topic: reluctantly following a leader's wrong goal.
const G = "Gaegu";
const BG = "#0E0E10";
const INK = "#F2F1EA";
const DIM = "#8A8A86";
const ORANGE = "#E9A23B";
const YELLOW = "#ECE24C";

const D = { stroke: INK, strokeWidth: 4, fill: "none" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const person = (x: number, cy: number, r: number) => `M${x} ${cy + r + 2} L${x - r * 1.3} ${cy + r * 3.4} L${x + r * 1.3} ${cy + r * 3.4} Z`;

const PulledDoodle: React.FC = () => (
  <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
    {[64, 100, 136].map((x) => <g key={x} opacity={0.8}><circle cx={x} cy={96} r={11} /><path d={person(x, 96, 11)} /></g>)}
    <path d="M164 118 L238 152 M238 152 L214 150 M238 152 L226 132" />
    <path d="M52 168 L212 168" strokeWidth={2.6} opacity={0.5} strokeDasharray="6 8" />
  </g></svg>
);
const SilenceDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <path d="M92 100 h116" />
    <path d="M108 90 v20 M128 90 v20 M148 90 v20 M168 90 v20 M188 90 v20" strokeWidth={3} />
  </g></svg>
);
const WrongFastDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <path d="M44 78 h34 M40 98 h34 M44 118 h34" strokeWidth={3} opacity={0.6} />
    <path d="M92 98 L214 98 M214 98 L194 86 M214 98 L194 110" strokeWidth={5} />
    <path d="M110 140 L214 140 L214 98" opacity={0.6} />
  </g></svg>
);
const SpeakDoodle: React.FC = () => (
  <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
    <circle cx={108} cy={116} r={16} /><path d={person(108, 116, 16)} />
    <path d="M108 132 L150 92" />
    <path d="M150 46 h60 a12 12 0 0 1 12 12 v30 a12 12 0 0 1 -12 12 h-30 l-18 16 l3 -16 h-15 a12 12 0 0 1 -12 -12 v-30 a12 12 0 0 1 12 -12 Z" />
    <path d="M180 60 v22 M180 90 v3" strokeWidth={4} />
  </g></svg>
);

type Card = { head: string; bracket: string; sub: string; doodle: React.FC; mood: CatMood };
const CARDS: Card[] = [
  { head: "잘못된 목표에", bracket: "끌려간다면", sub: "틀린 줄 알면서 어쩔 수 없이", doodle: PulledDoodle, mood: "curious" },
  { head: "말 안 하면", bracket: "동의가 된다", sub: "침묵을 리더는 지지로 읽는다", doodle: SilenceDoodle, mood: "calm" },
  { head: "열심히 할수록", bracket: "더 빨리 틀린다", sub: "방향이 틀리면 속도는 독", doodle: WrongFastDoodle, mood: "question" },
  { head: "진짜 충성은", bracket: "이견을 말하는 것", sub: "맞추기가 아니라 바로잡기", doodle: SpeakDoodle, mood: "wink" },
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
      <div style={{ fontSize: 78, ...rise(local, 0) }}>방향이 틀리면</div>
      <div style={{ fontSize: 78, marginTop: 4, ...rise(local, 6) }}>멈춤도 전진이다</div>
      <div style={{ fontSize: 88, color: YELLOW, marginTop: 36, ...rise(local, 16) }}>
        <span style={{ opacity: 0.9 }}>[ </span>한 명이라도 말하라<span style={{ opacity: 0.9 }}> ]</span>
      </div>
    </div>
    <div style={{ position: "absolute", top: 980, width: "100%", textAlign: "center", ...rise(local, 26) }}>
      <div style={{ fontSize: 56, color: YELLOW }}>끌려가지 말고</div>
      <div style={{ fontSize: 50, color: DIM, marginTop: 12 }}>질문을 던져라</div>
      <div style={{ fontSize: 74, color: INK, marginTop: 8 }}>그게 조직을 구한다</div>
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
