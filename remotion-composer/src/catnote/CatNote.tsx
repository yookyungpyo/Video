import { useEffect, useState } from "react";
import { AbsoluteFill, staticFile, continueRender, delayRender, useCurrentFrame, interpolate, Easing } from "remotion";

// Minimal dark handwritten "cat note" style (reference IMG_5186/5187):
// near-black bg, Gaegu handwriting, orange/yellow accents, tiny white doodles,
// and a cute black cat mascot with glowing mint eyes at the bottom.
const G = "Gaegu";
const BG = "#0E0E10";
const INK = "#F2F1EA";
const DIM = "#8A8A86";
const ORANGE = "#E9A23B";
const YELLOW = "#ECE24C";
const MINT = "#7FEAD6";

const fontCss = `
@font-face{font-family:'${G}';font-weight:400;src:url('${staticFile("fonts/gaegu-korean-400-normal.woff2")}') format('woff2');}
@font-face{font-family:'${G}';font-weight:700;src:url('${staticFile("fonts/gaegu-korean-700-normal.woff2")}') format('woff2');}
`;
export const Fonts: React.FC = () => {
  const [h] = useState(() => delayRender("f"));
  useEffect(() => {
    const done = () => continueRender(h);
    Promise.all([(document as any).fonts.load(`400 90px "${G}"`, "고양이Prompt"), (document as any).fonts.load(`700 90px "${G}"`, "루프")]).then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [h]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

// ---- Cat mascot (black body, white outline, mint eyes) ----
export type CatMood = "calm" | "curious" | "question" | "wink" | "happy";
export const Cat: React.FC<{ size?: number; mood?: CatMood }> = ({ size = 190, mood = "calm" }) => {
  const f = useCurrentFrame();
  // livelier motion
  const bounce = mood === "happy" ? -Math.abs(Math.sin(f / 9)) * 10 : Math.sin(f / 16) * 5;
  const blink = f % 84 > 76 ? 0.14 : 1; // blink every ~2.8s
  const tiltBase = mood === "curious" ? -8 : mood === "question" ? 9 : 0;
  const tiltOsc = mood === "curious" || mood === "question" ? Math.sin(f / 20) * 4 : Math.sin(f / 40) * 1.5;
  const tilt = tiltBase + tiltOsc;
  const eyeR = mood === "curious" ? 13 : 12;
  const wag = Math.sin(f / 8) * 9; // tail sway
  const qbob = Math.sin(f / 9) * 5;
  const heartPulse = 1.5 * (1 + Math.sin(f / 6) * 0.16);
  // active wink: mostly closed, briefly opens then winks again
  const winkOpen = f % 96 >= 42 && f % 96 <= 54;
  return (
    <svg width={size} height={size * 210 / 160} viewBox="0 0 160 210" style={{ transform: `translateY(${bounce}px) rotate(${tilt}deg)`, transformOrigin: "80px 165px", overflow: "visible" }}>
      <g fill="#040405" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" strokeLinecap="round">
        {/* ears (behind body) */}
        <path d="M52 46 L44 15 L74 37 Z" />
        <path d="M108 46 L116 15 L86 37 Z" />
        {/* body/head bell */}
        <path d="M80 33 C55 33 43 58 43 97 C43 130 52 160 61 160 L99 160 C108 160 117 130 117 97 C117 58 105 33 80 33 Z" />
      </g>
      {/* tail (curls up on the right) — wags */}
      <g transform={`rotate(${wag} 113 150)`}>
        <path d="M108 152 C150 156 158 92 130 96 C144 98 142 120 122 120" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* eyes */}
      {mood === "happy" ? (
        <g fill="none" stroke={MINT} strokeWidth={4.6} strokeLinecap="round">
          <path d="M59 98 q8 -12 16 0" /><path d="M85 98 q8 -12 16 0" />
        </g>
      ) : mood === "wink" ? (
        <>
          <ellipse cx={67} cy={95} rx={8.5} ry={12 * blink} fill={MINT} />
          {winkOpen ? <ellipse cx={93} cy={95} rx={8.5} ry={12} fill={MINT} /> : <path d="M85 97 q8 -11 16 0" fill="none" stroke={MINT} strokeWidth={4.6} strokeLinecap="round" />}
        </>
      ) : (
        <g fill={MINT}>
          <ellipse cx={67} cy={95} rx={8.5} ry={eyeR * blink} />
          <ellipse cx={93} cy={95} rx={8.5} ry={eyeR * blink} />
        </g>
      )}
      {/* nose + mouth */}
      <path d="M75 112 L85 112 L80 118 Z" fill={INK} />
      {mood === "happy" ? (
        <path d="M80 118 C80 127 71 130 64 125 M80 118 C80 127 89 130 96 125" fill="none" stroke={INK} strokeWidth={2.8} strokeLinecap="round" />
      ) : (
        <path d="M80 118 C80 124 74 126 69 123 M80 118 C80 124 86 126 91 123" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
      )}
      {/* accessory */}
      {mood === "question" && <text x={118} y={44 + qbob} fontFamily="Gaegu" fontSize={40} fill={INK}>?</text>}
      {mood === "happy" && <path transform={`translate(120 42) scale(${heartPulse})`} d="M0 -5 C0 -8 -6 -9 -8 -5 C-10 -1 -4 3 0 7 C4 3 10 -1 8 -5 C6 -9 0 -8 0 -5 Z" fill="#F2A0A0" />}
    </svg>
  );
};

// ---- tiny white doodles ----
const D = { stroke: INK, strokeWidth: 4, fill: "none" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const Stick: React.FC<{ x?: number }> = ({ x = 70 }) => (
  <g {...D}>
    <circle cx={x} cy={44} r={17} />
    <path d={`M${x} 61 L${x} 116`} />
    <path d={`M${x} 76 L${x - 24} 98 M${x} 76 L${x + 24} 98`} />
    <path d={`M${x} 116 L${x - 18} 156 M${x} 116 L${x + 18} 156`} />
  </g>
);
const PromptDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><Stick x={80} />
    <g {...D}><path d="M150 72 L214 72 M150 92 L200 92 M150 112 L210 112" /></g>
  </svg>
);
const ContextDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200">
    <rect x={44} y={30} width={212} height={140} rx={14} {...D} strokeDasharray="7 11" />
    <g {...D}><circle cx={150} cy={86} r={16} /><path d="M150 102 L150 140 M150 112 L132 128 M150 112 L168 128" /></g>
  </svg>
);
const HarnessDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <circle cx={112} cy={100} r={30} /><circle cx={112} cy={100} r={11} />
    {Array.from({ length: 8 }).map((_, i) => { const a = (i * Math.PI) / 4; return <path key={i} d={`M${112 + Math.cos(a) * 30} ${100 + Math.sin(a) * 30} L${112 + Math.cos(a) * 40} ${100 + Math.sin(a) * 40}`} />; })}
    <path d="M170 70 a18 18 0 1 0 18 18 L214 130 L228 116 L186 76 a18 18 0 0 0 -16 -6 Z" />
  </g></svg>
);
const LoopDoodle: React.FC = () => (
  <svg width={300} height={200} viewBox="0 0 300 200"><g {...D}>
    <path d="M150 46 a54 54 0 1 1 -46 26" />
    <path d="M150 46 L128 34 M150 46 L136 66" />
  </g></svg>
);
const DOODLES: Record<string, React.FC> = { prompt: PromptDoodle, context: ContextDoodle, harness: HarnessDoodle, loop: LoopDoodle };

type Concept = { n: number; term: string; bracket: string; sub: string; doodle: string };
export const CONCEPTS: Concept[] = [
  { n: 1, term: "Prompt 엔지니어링", bracket: "친절한 상담원이 되어줘", sub: "원하는 걸 말로 시킨다", doodle: "prompt" },
  { n: 2, term: "Context 엔지니어링", bracket: "우리 상황부터 알아둬", sub: "배경을 먼저 깔아준다", doodle: "context" },
  { n: 3, term: "Harness 엔지니어링", bracket: "일할 도구를 쥐여줘", sub: "실행 환경을 만들어준다", doodle: "harness" },
  { n: 4, term: "Loop 엔지니어링", bracket: "스스로 고치게 두라", sub: "반복하며 스스로 다듬는다", doodle: "loop" },
];

const rise = (p: number, d = 0) => {
  const o = interpolate(p, [d, d + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const y = interpolate(p, [d, d + 22], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return { opacity: o, transform: `translateY(${y}px)` };
};

const ConceptCard: React.FC<{ c: Concept; local: number }> = ({ c, local }) => {
  const Doodle = DOODLES[c.doodle];
  return (
    <AbsoluteFill style={{ background: BG, fontFamily: G }}>
      <div style={{ position: "absolute", top: 300, width: "100%", textAlign: "center", fontSize: 82, color: INK, ...rise(local, 0) }}>{c.n}. {c.term}</div>
      <div style={{ position: "absolute", top: 520, width: "100%", textAlign: "center", fontSize: 74, color: ORANGE, ...rise(local, 8) }}>
        <span style={{ opacity: 0.85 }}>[ </span>{c.bracket}<span style={{ opacity: 0.85 }}> ]</span>
      </div>
      <div style={{ position: "absolute", top: 648, width: "100%", textAlign: "center", fontSize: 44, color: DIM, ...rise(local, 18) }}>{c.sub}</div>
      <div style={{ position: "absolute", top: 900, width: "100%", display: "flex", justifyContent: "center", ...rise(local, 12) }}><Doodle /></div>
      <div style={{ position: "absolute", top: 1520, width: "100%", display: "flex", justifyContent: "center" }}><Cat /></div>
    </AbsoluteFill>
  );
};

const SummaryCard: React.FC<{ local: number }> = ({ local }) => {
  const chain = ["Prompt 엔지니어링", "Context 엔지니어링", "Harness 엔지니어링"];
  return (
    <AbsoluteFill style={{ background: BG, fontFamily: G }}>
      <div style={{ position: "absolute", top: 380, width: "100%", textAlign: "center", color: INK }}>
        {chain.map((t, i) => (
          <div key={i} style={{ ...rise(local, i * 5) }}>
            <div style={{ fontSize: 60 }}>{t}</div>
            <div style={{ fontSize: 34, color: DIM, lineHeight: 1 }}>↓</div>
          </div>
        ))}
        <div style={{ fontSize: 72, color: YELLOW, marginTop: 6, ...rise(local, 18) }}>
          <span style={{ color: YELLOW, opacity: 0.9 }}>[ </span>Loop 엔지니어링<span style={{ color: YELLOW, opacity: 0.9 }}> ]</span>
        </div>
      </div>
      <div style={{ position: "absolute", top: 960, width: "100%", textAlign: "center", ...rise(local, 26) }}>
        <div style={{ fontSize: 48, color: YELLOW }}>다음 진화?</div>
        <div style={{ fontSize: 42, color: DIM, marginTop: 10 }}>아직은 이론에 가깝다</div>
        <div style={{ fontSize: 58, color: INK, marginTop: 6 }}>하지만 방향은 이쪽</div>
      </div>
      <div style={{ position: "absolute", top: 1520, width: "100%", display: "flex", justifyContent: "center" }}><Cat /></div>
    </AbsoluteFill>
  );
};

// still compositions (settled)
export const Note1: React.FC = () => <><Fonts /><ConceptCard c={CONCEPTS[0]} local={40} /></>;
export const Note2: React.FC = () => <><Fonts /><ConceptCard c={CONCEPTS[1]} local={40} /></>;
export const Note3: React.FC = () => <><Fonts /><ConceptCard c={CONCEPTS[2]} local={40} /></>;
export const Note4: React.FC = () => <><Fonts /><ConceptCard c={CONCEPTS[3]} local={40} /></>;
export const Note5: React.FC = () => <><Fonts /><SummaryCard local={40} /></>;

// reel
const SCENE = 108; // 3.6s
export const REEL_DUR = SCENE * 5; // 540f = 18s
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
            {s < 4 ? <ConceptCard c={CONCEPTS[s]} local={lc} /> : <SummaryCard local={lc} />}
          </AbsoluteFill>
        );
      })}
      {/* instagram-story progress segments */}
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
