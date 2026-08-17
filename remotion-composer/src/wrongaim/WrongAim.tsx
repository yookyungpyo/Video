import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { Cat, Fonts, CatMood } from "../catnote/CatNote";

// Cat-note style (6 cards), hypothesis: the org goes wrong because of the
// LEADER'S PRIVATE goal (self-interest disguised as vision).
const G = "Gaegu";
const BG = "#0E0E10";
const INK = "#F2F1EA";
const DIM = "#8A8A86";
const ORANGE = "#E9A23B";
const YELLOW = "#ECE24C";

const D = { stroke: INK, strokeWidth: 4, fill: "none" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const person = (x: number, cy: number, r: number) => `M${x} ${cy + r + 2} L${x - r * 1.3} ${cy + r * 3.4} L${x + r * 1.3} ${cy + r * 3.4} Z`;
const star = (cx: number, cy: number, R: number, r: number) => {
  let d = "";
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rad = i % 2 ? r : R; d += `${i ? "L" : "M"}${cx + Math.cos(a) * rad} ${cy + Math.sin(a) * rad} `; }
  return d + "Z";
};

const CrownStarDoodle: React.FC = () => (
  <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
    <path d={star(150, 58, 22, 9)} />
    <path d="M96 158 L104 108 L126 138 L150 96 L174 138 L196 108 L204 158 Z" />
    <path d="M96 158 h108" />
  </g></svg>
);
const MaskDoodle: React.FC = () => (
  <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
    <path d="M150 42 C104 42 92 80 92 110 C92 142 118 168 150 168 C182 168 208 142 208 110 C208 80 196 42 150 42 Z" />
    <path d="M120 98 q12 -10 24 0 M156 98 q12 -10 24 0" strokeWidth={3.4} />
    <path d="M132 130 q18 12 36 0" strokeWidth={3.4} />
    <path d="M150 168 L150 192" />
  </g></svg>
);
const PulledDoodle: React.FC = () => (
  <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
    {[64, 100, 136].map((x) => <g key={x} opacity={0.8}><circle cx={x} cy={96} r={11} /><path d={person(x, 96, 11)} /></g>)}
    <path d="M164 118 L238 152 M238 152 L214 150 M238 152 L226 132" />
    <path d="M52 168 L212 168" strokeWidth={2.6} opacity={0.5} strokeDasharray="6 8" />
  </g></svg>
);
const SinkDoodle: React.FC = () => (
  <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
    <path d="M60 108 L196 126 L172 156 L86 148 Z" />
    <path d="M118 110 L126 66" /><path d="M126 66 L162 82 L126 92" />
    <path d="M40 170 q16 -12 32 0 t32 0 t32 0 t32 0 t32 0 t32 0" strokeWidth={3} opacity={0.7} />
  </g></svg>
);
const HourglassDoodle: React.FC = () => (
  <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
    <path d="M96 48 h108 M96 162 h108" />
    <path d="M104 48 L150 105 L104 162 M196 48 L150 105 L196 162" />
    <path d="M116 162 L184 162 L150 122 Z" fill={INK} />
    <path d="M150 105 l0 18" strokeWidth={3} opacity={0.7} />
  </g></svg>
);

type Card = { head: string; bracket: string; sub: string; doodle: React.FC; mood: CatMood };
const CARDS: Card[] = [
  { head: "조직이 잘못 가면", bracket: "리더의 사심일 수도", sub: "그런 경우가 더러 있다", doodle: CrownStarDoodle, mood: "curious" },
  { head: "사적 목표를", bracket: "비전으로 포장", sub: "회사를 위한 척, 자기를 위해", doodle: MaskDoodle, mood: "calm" },
  { head: "그래서 다들", bracket: "알면서 끌려간다", sub: "틀린 줄 알아도 말 못 한다", doodle: PulledDoodle, mood: "question" },
  { head: "한 사람 실수는", bracket: "덮을 수 있어도", sub: "리더의 사심은 조직을 삼킨다", doodle: SinkDoodle, mood: "wink" },
  { head: "깨달았을 땐", bracket: "이미 늦는다", sub: "멀리 갈수록 되돌릴 수 없다", doodle: HourglassDoodle, mood: "curious" },
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
      <div style={{ fontSize: 76, ...rise(local, 0) }}>방향을 따르기 전에</div>
      <div style={{ fontSize: 78, marginTop: 4, ...rise(local, 6) }}>이걸 물어라</div>
      <div style={{ fontSize: 86, color: YELLOW, marginTop: 36, ...rise(local, 16) }}>
        <span style={{ opacity: 0.9 }}>[ </span>누구를 위한 건가<span style={{ opacity: 0.9 }}> ]</span>
      </div>
    </div>
    <div style={{ position: "absolute", top: 980, width: "100%", textAlign: "center", ...rise(local, 26) }}>
      <div style={{ fontSize: 56, color: YELLOW }}>회사를 위한 건지</div>
      <div style={{ fontSize: 50, color: DIM, marginTop: 12 }}>자기를 위한 건지</div>
      <div style={{ fontSize: 74, color: INK, marginTop: 8 }}>그게 갈림길이다</div>
    </div>
    <div style={{ position: "absolute", top: 1520, width: "100%", display: "flex", justifyContent: "center" }}><Cat mood="happy" /></div>
  </AbsoluteFill>
);

export const Note1: React.FC = () => <><Fonts /><ArgCard c={CARDS[0]} local={40} /></>;
export const Note2: React.FC = () => <><Fonts /><ArgCard c={CARDS[1]} local={40} /></>;
export const Note3: React.FC = () => <><Fonts /><ArgCard c={CARDS[2]} local={40} /></>;
export const Note4: React.FC = () => <><Fonts /><ArgCard c={CARDS[3]} local={40} /></>;
export const Note5: React.FC = () => <><Fonts /><ArgCard c={CARDS[4]} local={40} /></>;
export const Note6: React.FC = () => <><Fonts /><CloseCard local={40} /></>;

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
            {s < 5 ? <ArgCard c={CARDS[s]} local={lc} /> : <CloseCard local={lc} />}
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
