import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { Cat, Fonts, CatMood } from "../catnote/CatNote";

// Cat-note style, topic: "workslop" — plausible-but-empty AI output rotting orgs.
const G = "Gaegu";
const BG = "#0E0E10";
const INK = "#F2F1EA";
const DIM = "#8A8A86";
const ORANGE = "#E9A23B";
const YELLOW = "#ECE24C";

const D = { stroke: INK, strokeWidth: 4, fill: "none" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const ShinyPaperDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <path d="M100 46 h68 l24 24 v92 h-92 Z" /><path d="M168 46 v24 h24" />
    <path d="M116 96 h58 M116 116 h58 M116 136 h40" strokeWidth={3} opacity={0.7} />
    <path d="M216 60 l0 20 M206 70 h20" strokeWidth={3.4} stroke={YELLOW} />
  </g></svg>
);
const EmptyBoxDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <path d="M98 108 L202 108 L188 166 L112 166 Z" />
    <path d="M98 108 L78 84 M202 108 L222 84 M98 108 L120 88 M202 108 L180 88" />
    <path d="M150 120 v38" strokeWidth={3} opacity={0.45} strokeDasharray="5 8" />
  </g></svg>
);
const PassDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <rect x={64} y={74} width={58} height={46} rx={4} /><path d="M64 92 h58 M93 74 v46" strokeWidth={3} opacity={0.7} />
    <path d="M136 100 L196 128 M196 128 L177 124 M196 128 L188 142" />
    <circle cx={232} cy={112} r={13} /><path d="M232 125 L214 160 M232 125 L250 160" />
  </g></svg>
);
const BrokenDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <ellipse cx={106} cy={104} rx={30} ry={20} /><ellipse cx={194} cy={104} rx={30} ry={20} />
    <path d="M150 72 l-11 18 l15 8 l-11 22" strokeWidth={3.4} />
  </g></svg>
);

type Card = { head: string; bracket: string; sub: string; doodle: React.FC; mood: CatMood };
const CARDS: Card[] = [
  { head: "요즘 조직의 병", bracket: "Workslop", sub: "그럴듯한데 본질이 빠진 AI 결과물", doodle: ShinyPaperDoodle, mood: "curious" },
  { head: "겉은 완성인데", bracket: "속은 텅 빈다", sub: "폼만 그럴듯, 내용은 없다", doodle: EmptyBoxDoodle, mood: "calm" },
  { head: "일은 안 사라진다", bracket: "떠넘겨질 뿐", sub: "결국 받는 사람이 다시 한다", doodle: PassDoodle, mood: "question" },
  { head: "그래서 무너진다", bracket: "서로의 신뢰가", sub: "또 검산해야 하는 결과물", doodle: BrokenDoodle, mood: "wink" },
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
      <div style={{ fontSize: 78, ...rise(local, 0) }}>AI는 도구지</div>
      <div style={{ fontSize: 78, marginTop: 4, ...rise(local, 6) }}>대신이 아니다</div>
      <div style={{ fontSize: 92, color: YELLOW, marginTop: 36, ...rise(local, 16) }}>
        <span style={{ opacity: 0.9 }}>[ </span>본질을 남겨라<span style={{ opacity: 0.9 }}> ]</span>
      </div>
    </div>
    <div style={{ position: "absolute", top: 980, width: "100%", textAlign: "center", ...rise(local, 26) }}>
      <div style={{ fontSize: 56, color: YELLOW }}>폼 말고 실속</div>
      <div style={{ fontSize: 50, color: DIM, marginTop: 12 }}>속도 말고 신뢰</div>
      <div style={{ fontSize: 74, color: INK, marginTop: 8 }}>네 손으로 마무리</div>
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
