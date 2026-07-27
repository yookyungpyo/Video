import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { Cat, Fonts } from "../catnote/CatNote";

// Same minimal dark handwritten "cat note" style, new topic:
// "남 잘 때 자고 놀 때 놀면서 남보다 좋은 대접 바라는 게 도둑놈 아닌가?"
const G = "Gaegu";
const BG = "#0E0E10";
const INK = "#F2F1EA";
const DIM = "#8A8A86";
const ORANGE = "#E9A23B";
const YELLOW = "#ECE24C";

const D = { stroke: INK, strokeWidth: 4, fill: "none" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

// ---- doodles ----
const SleepDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <path d="M132 46 a46 46 0 1 0 30 80 a34 34 0 1 1 -30 -80 Z" />
    <path d="M196 58 l22 0 l-22 22 l22 0" />
    <path d="M226 92 l16 0 l-16 16 l16 0" />
    <path d="M250 120 l11 0 l-11 11 l11 0" />
  </g></svg>
);
const StarDoodle: React.FC = () => {
  const pts = (cx: number, cy: number, R: number, r: number) => {
    let d = "";
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rad = i % 2 ? r : R; d += `${i ? "L" : "M"}${cx + Math.cos(a) * rad} ${cy + Math.sin(a) * rad} `; }
    return d + "Z";
  };
  return (
    <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
      <path d={pts(150, 44, 30, 12)} />
      <circle cx={150} cy={120} r={16} />
      <path d="M150 136 L150 176 M150 150 L150 96 M150 150 L128 168 M150 150 L172 168" />
    </g></svg>
  );
};
const ChairDoodle: React.FC = () => (
  <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
    <path d="M118 40 L118 150 M118 150 L118 180 M170 96 L170 180 M118 150 L170 150 M118 96 L170 96" />
    <circle cx={144} cy={70} r={15} />
  </g></svg>
);
const HandDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    {/* coin */}
    <circle cx={92} cy={104} r={27} /><circle cx={92} cy={104} r={18} strokeWidth={3} />
    {/* grabbing hand reaching from the right */}
    <path d="M236 74 C206 72 196 96 200 118 C203 136 219 144 238 142" />
    <path d="M204 92 L176 86 M200 108 L172 108 M204 124 L180 132" strokeWidth={3.4} />
    <path d="M232 132 L216 146" strokeWidth={3.4} />
  </g></svg>
);

type Card = { head: string; bracket: string; sub: string; doodle: React.FC };
const CARDS: Card[] = [
  { head: "잘 거 다 자고", bracket: "놀 거 다 놀았다", sub: "남들과 똑같이 살았다", doodle: SleepDoodle },
  { head: "그런데 결과는", bracket: "나만 특별하길", sub: "같은 걸 하고 다른 걸 바란다", doodle: StarDoodle },
  { head: "더 받는 자린", bracket: "이미 임자가 있다", sub: "남들 잘 때 깨어 있던 사람", doodle: ChairDoodle },
  { head: "그걸 넘보면", bracket: "도둑놈 심보", sub: "치른 값도 없이 남의 몫을", doodle: HandDoodle },
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
      <div style={{ position: "absolute", top: 300, width: "100%", textAlign: "center", fontSize: 82, color: INK, ...rise(local, 0) }}>{c.head}</div>
      <div style={{ position: "absolute", top: 520, width: "100%", textAlign: "center", fontSize: 78, color: ORANGE, ...rise(local, 8) }}>
        <span style={{ opacity: 0.85 }}>[ </span>{c.bracket}<span style={{ opacity: 0.85 }}> ]</span>
      </div>
      <div style={{ position: "absolute", top: 656, width: "100%", textAlign: "center", fontSize: 44, color: DIM, ...rise(local, 18) }}>{c.sub}</div>
      <div style={{ position: "absolute", top: 900, width: "100%", display: "flex", justifyContent: "center", ...rise(local, 12) }}><Doodle /></div>
      <div style={{ position: "absolute", top: 1520, width: "100%", display: "flex", justifyContent: "center" }}><Cat /></div>
    </AbsoluteFill>
  );
};

const CloseCard: React.FC<{ local: number }> = ({ local }) => (
  <AbsoluteFill style={{ background: BG, fontFamily: G }}>
    <div style={{ position: "absolute", top: 380, width: "100%", textAlign: "center", color: INK }}>
      <div style={{ fontSize: 66, ...rise(local, 0) }}>값을 안 치르고</div>
      <div style={{ fontSize: 66, marginTop: 4, ...rise(local, 6) }}>더 받길 바라는 것</div>
      <div style={{ fontSize: 84, color: YELLOW, marginTop: 34, ...rise(local, 16) }}>
        <span style={{ opacity: 0.9 }}>[ </span>그게 도둑놈<span style={{ opacity: 0.9 }}> ]</span>
      </div>
    </div>
    <div style={{ position: "absolute", top: 940, width: "100%", textAlign: "center", ...rise(local, 26) }}>
      <div style={{ fontSize: 48, color: YELLOW }}>부럽다면?</div>
      <div style={{ fontSize: 42, color: DIM, marginTop: 10 }}>샘내지 말고</div>
      <div style={{ fontSize: 62, color: INK, marginTop: 6 }}>남들 멈출 때 한 발 더</div>
    </div>
    <div style={{ position: "absolute", top: 1520, width: "100%", display: "flex", justifyContent: "center" }}><Cat /></div>
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
