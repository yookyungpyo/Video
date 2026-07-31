import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { Cat, Fonts, CatMood } from "../catnote/CatNote";

// Cat-note style, topic: "여기까지 데려다준 것이 저기까지 데려다주는 것은 아니다"
// (What got you here won't get you there.)
const G = "Gaegu";
const BG = "#0E0E10";
const INK = "#F2F1EA";
const DIM = "#8A8A86";
const ORANGE = "#E9A23B";
const YELLOW = "#ECE24C";

const D = { stroke: INK, strokeWidth: 4, fill: "none" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const StepDoodle: React.FC = () => (
  <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
    <path d="M36 180 L108 180 L108 138 L180 138 L180 96 L252 96" />
    <path d="M252 96 L252 58 M252 58 L282 70 L252 82" />
    <circle cx={66} cy={166} r={8} />
  </g></svg>
);
const AnchorDoodle: React.FC = () => (
  <svg width={300} height={210} viewBox="0 0 300 210"><g {...D}>
    <circle cx={150} cy={50} r={13} /><path d="M150 63 L150 156" /><path d="M124 82 L176 82" />
    <path d="M150 156 C118 156 106 132 106 114 M106 114 L92 122 M106 114 L118 128" />
    <path d="M150 156 C182 156 194 132 194 114 M194 114 L208 122 M194 114 L182 128" />
  </g></svg>
);
const WallDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <path d="M150 182 L150 100 M150 100 L130 122 M150 100 L170 122" />
    <path d="M66 84 L234 84" strokeWidth={5} />
    <path d="M90 84 L80 70 M124 84 L114 70 M158 84 L148 70 M192 84 L182 70 M222 84 L212 70" strokeWidth={3.2} />
  </g></svg>
);
const DumbbellDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <path d="M92 100 L208 100" strokeWidth={5} />
    <path d="M92 74 L92 126 M110 82 L110 118" />
    <path d="M208 74 L208 126 M190 82 L190 118" />
  </g></svg>
);

type Card = { head: string; bracket: string; sub: string; doodle: React.FC; mood: CatMood };
const CARDS: Card[] = [
  { head: "여기까지 온 방식이", bracket: "저기까진 못 간다", sub: "지금을 만든 것이 다음을 막는다", doodle: StepDoodle, mood: "curious" },
  { head: "이미 몸에 뱄다", bracket: "그래서 못 버린다", sub: "익숙함이 가장 큰 관성", doodle: AnchorDoodle, mood: "calm" },
  { head: "어제의 강점이", bracket: "오늘의 한계로", sub: "통하던 게 안 통하기 시작한다", doodle: WallDoodle, mood: "question" },
  { head: "다음 단계는", bracket: "다른 근육을 쓴다", sub: "새로 배우고 새로 익혀야 한다", doodle: DumbbellDoodle, mood: "wink" },
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
      <div style={{ fontSize: 78, ...rise(local, 0) }}>더 높이 가려면</div>
      <div style={{ fontSize: 78, marginTop: 4, ...rise(local, 6) }}>덜어내야 한다</div>
      <div style={{ fontSize: 94, color: YELLOW, marginTop: 36, ...rise(local, 16) }}>
        <span style={{ opacity: 0.9 }}>[ </span>놓아야 오른다<span style={{ opacity: 0.9 }}> ]</span>
      </div>
    </div>
    <div style={{ position: "absolute", top: 960, width: "100%", textAlign: "center", ...rise(local, 26) }}>
      <div style={{ fontSize: 58, color: YELLOW }}>내려놓은 만큼</div>
      <div style={{ fontSize: 50, color: DIM, marginTop: 12 }}>가벼워지고</div>
      <div style={{ fontSize: 74, color: INK, marginTop: 8 }}>더 멀리 간다</div>
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
