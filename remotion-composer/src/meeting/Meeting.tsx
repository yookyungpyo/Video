import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { Cat, Fonts, CatMood } from "../catnote/CatNote";

// Cat-note style, topic: what must remain after a meeting (decision/owner/deadline).
const G = "Gaegu";
const BG = "#0E0E10";
const INK = "#F2F1EA";
const DIM = "#8A8A86";
const ORANGE = "#E9A23B";
const YELLOW = "#ECE24C";

const D = { stroke: INK, strokeWidth: 4, fill: "none" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const LingerDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <path d="M70 140 h160 M92 140 v34 M208 140 v34" />
    <text x={132} y={104} fontFamily={G} fontSize={64} fill={INK} stroke="none">?</text>
  </g></svg>
);
const CheckDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <circle cx={150} cy={100} r={48} />
    <path d="M126 100 l16 20 l34 -42" strokeWidth={5} />
  </g></svg>
);
const TagDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <path d="M138 52 h24 v14 h-24 Z" /><path d="M150 66 v8" />
    <rect x={96} y={74} width={108} height={82} rx={10} />
    <circle cx={150} cy={104} r={12} /><path d="M128 140 q22 -20 44 0" />
  </g></svg>
);
const CalDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <rect x={86} y={62} width={128} height={104} rx={8} /><path d="M86 94 h128" />
    <path d="M114 54 v16 M186 54 v16" />
    <circle cx={172} cy={132} r={15} stroke={YELLOW} strokeWidth={5} />
    <path d="M108 118 h20 M108 140 h20 M140 118 h20" strokeWidth={3} opacity={0.7} />
  </g></svg>
);

type Card = { head: string; bracket: string; sub: string; doodle: React.FC; mood: CatMood };
const CARDS: Card[] = [
  { head: "회의가 끝나면", bracket: "뭐가 남나?", sub: "느낌 말고 남는 것", doodle: LingerDoodle, mood: "curious" },
  { head: "① 무엇을", bracket: "정했는가", sub: "결론 없으면 안 한 회의", doodle: CheckDoodle, mood: "calm" },
  { head: "② 누가", bracket: "맡는가", sub: "'우리'가 하면 아무도 안 한다", doodle: TagDoodle, mood: "question" },
  { head: "③ 언제까지", bracket: "끝내는가", sub: "날짜 없는 일은 안 굴러간다", doodle: CalDoodle, mood: "wink" },
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
      <div style={{ fontSize: 78, ...rise(local, 0) }}>회의록 말고</div>
      <div style={{ fontSize: 78, marginTop: 4, ...rise(local, 6) }}>이 세 줄</div>
      <div style={{ fontSize: 84, color: YELLOW, marginTop: 36, ...rise(local, 16) }}>
        <span style={{ opacity: 0.9 }}>[ </span>결정 · 담당 · 기한<span style={{ opacity: 0.9 }}> ]</span>
      </div>
    </div>
    <div style={{ position: "absolute", top: 980, width: "100%", textAlign: "center", ...rise(local, 26) }}>
      <div style={{ fontSize: 56, color: YELLOW }}>이게 없으면</div>
      <div style={{ fontSize: 50, color: DIM, marginTop: 12 }}>그냥 수다다</div>
      <div style={{ fontSize: 74, color: INK, marginTop: 8 }}>다음 액션을 남겨라</div>
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
