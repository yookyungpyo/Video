import { useEffect, useState } from "react";
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, continueRender, delayRender } from "remotion";

// ---------------------------------------------------------------------------
// Simple hand-drawn (샤오헤이/Luo Xiaohei-ish) cooking story, drawn entirely in
// SVG in Remotion — so the two characters are 100% consistent, no stray extras,
// no image decode / flicker, no API. Topic: a genius chef friend (AI) doesn't
// know OUR kitchen — without your guidance a genius is clumsier than we are.
// ---------------------------------------------------------------------------
const HAND = "Nanum Pen Script";
const SANS = "Noto Sans KR";
const INK = "#3A3540";
const YEL = "#F2C14E";     // boy sweater
const JEAN = "#6E8AC0";    // boy jeans
const SKIN = "#F7D8BE";
const CHEEK = "#F0A79E";
const APRON = "#FBFBF7";   // chef apron
const SHIRT = "#A9C4D8";   // chef shirt
const HAIR = "#2E2A33";
const WALL_A = "#EFE3D0";
const WALL_B = "#E7D7BE";
const WOOD = "#C89A66";
const WOOD_D = "#B07E4E";
const STEAM = "#EDE6DA";

const fontCss = `
@font-face{font-family:'${HAND}';font-weight:400;src:url('${staticFile("fonts/nanum-pen-script-korean-400-normal.woff2")}') format('woff2');}
@font-face{font-family:'${SANS}';font-weight:400;src:url('${staticFile("fonts/noto-sans-kr-korean-400-normal.woff2")}') format('woff2');}
`;
const Fonts: React.FC = () => {
  const [h] = useState(() => delayRender("f"));
  useEffect(() => {
    const done = () => continueRender(h);
    Promise.all([(document as any).fonts.load(`400 90px "${HAND}"`, "라면천재")]).then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [h]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

const useBob = (amp = 6, speed = 0.5, phase = 0) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return Math.sin((f / fps) * 2 * Math.PI * speed + phase) * amp;
};

// ── kitchen backdrop (same every scene) — simple wall + window + floor ──────
const Kitchen: React.FC = () => (
  <AbsoluteFill>
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${WALL_A} 0%, ${WALL_B} 100%)` }} />
    {/* window (upper right, out of the caption zone) */}
    <div style={{ position: "absolute", right: 90, top: 560, width: 280, height: 300, background: "#33405C", borderRadius: 14, border: `10px solid ${WALL_A}`, boxShadow: `0 0 0 6px ${INK}` }}>
      <div style={{ position: "absolute", left: "50%", top: 0, width: 6, height: "100%", marginLeft: -3, background: WALL_A }} />
      <div style={{ position: "absolute", top: "50%", left: 0, height: 6, width: "100%", marginTop: -3, background: WALL_A }} />
      <div style={{ position: "absolute", right: 26, top: 24, width: 40, height: 40, borderRadius: "50%", background: "#F4E6B0", opacity: 0.85 }} />
    </div>
    {/* floor */}
    <div style={{ position: "absolute", left: 0, right: 0, top: 1560, height: 360, background: WOOD }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 1548, height: 16, background: WOOD_D }} />
  </AbsoluteFill>
);

// ── characters ─────────────────────────────────────────────────────────────
type Arm = "down" | "up" | "hold" | "search";
const Boy: React.FC<{ x: number; y?: number; s?: number; arm?: Arm; smug?: boolean; delay?: number }> = ({ x, y = 1720, s = 1.7, arm = "down", smug = false, delay = 0 }) => {
  const bob = useBob(5, 0.5, x);
  const pop = spring({ frame: useCurrentFrame() - delay, fps: useVideoConfig().fps, config: { damping: 12, stiffness: 120 } });
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-100%) translateY(${bob}px) scale(${pop})`, transformOrigin: "center bottom", opacity: pop > 0.05 ? 1 : 0 }}>
      <svg width={150 * s} height={250 * s} viewBox="0 0 150 250">
        {/* legs */}
        <rect x={54} y={188} width={18} height={44} rx={8} fill={JEAN} stroke={INK} strokeWidth={4} />
        <rect x={78} y={188} width={18} height={44} rx={8} fill={JEAN} stroke={INK} strokeWidth={4} />
        <ellipse cx={62} cy={236} rx={16} ry={9} fill="#fff" stroke={INK} strokeWidth={4} />
        <ellipse cx={88} cy={236} rx={16} ry={9} fill="#fff" stroke={INK} strokeWidth={4} />
        {/* body sweater */}
        <path d="M40 130 Q75 118 110 130 L114 196 Q75 208 36 196 Z" fill={YEL} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        {/* arms */}
        {arm === "up" ? (
          <path d="M44 140 Q22 110 30 86" fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
        ) : (
          <path d="M44 140 Q30 168 40 190" fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
        )}
        <path d="M108 140 Q124 166 116 190" fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
        {/* head */}
        <circle cx={75} cy={88} r={42} fill={SKIN} stroke={INK} strokeWidth={4} />
        {/* bowl-cut hair */}
        <path d="M33 84 Q34 44 75 42 Q116 44 117 84 Q100 66 75 66 Q50 66 33 84 Z" fill={HAIR} />
        <path d="M33 84 Q40 70 52 70 M117 84 Q110 70 98 70" fill="none" stroke={HAIR} strokeWidth={10} strokeLinecap="round" />
        {/* face */}
        <circle cx={60} cy={92} r={4.5} fill={INK} />
        <circle cx={90} cy={92} r={4.5} fill={INK} />
        <circle cx={50} cy={104} r={7} fill={CHEEK} opacity={0.6} />
        <circle cx={100} cy={104} r={7} fill={CHEEK} opacity={0.6} />
        {smug ? <path d="M64 108 Q75 116 86 108" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" /> : <path d="M66 108 Q75 114 84 108" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />}
      </svg>
    </div>
  );
};

const Chef: React.FC<{ x: number; y?: number; s?: number; arm?: Arm; puzzled?: boolean; delay?: number }> = ({ x, y = 1720, s = 1.55, arm = "down", puzzled = false, delay = 0 }) => {
  const bob = useBob(5, 0.5, x + 2);
  const pop = spring({ frame: useCurrentFrame() - delay, fps: useVideoConfig().fps, config: { damping: 12, stiffness: 120 } });
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-100%) translateY(${bob}px) scale(${pop})`, transformOrigin: "center bottom", opacity: pop > 0.05 ? 1 : 0 }}>
      <svg width={175 * s} height={330 * s} viewBox="0 0 175 330">
        {/* legs */}
        <rect x={66} y={250} width={20} height={60} rx={9} fill={INK} />
        <rect x={92} y={250} width={20} height={60} rx={9} fill={INK} />
        <ellipse cx={76} cy={314} rx={17} ry={9} fill="#fff" stroke={INK} strokeWidth={4} />
        <ellipse cx={102} cy={314} rx={17} ry={9} fill="#fff" stroke={INK} strokeWidth={4} />
        {/* shirt */}
        <path d="M50 150 Q89 138 128 150 L132 258 Q89 270 46 258 Z" fill={SHIRT} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        {/* apron */}
        <path d="M62 158 L116 158 L120 256 Q89 266 58 256 Z" fill={APRON} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
        <path d="M70 158 Q89 150 108 158" fill="none" stroke={INK} strokeWidth={3.5} />
        <line x1={89} y1={150} x2={89} y2={140} stroke={INK} strokeWidth={3.5} />
        {/* arms */}
        {arm === "search" ? (
          <path d="M52 162 Q26 150 18 132" fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
        ) : arm === "up" ? (
          <path d="M126 162 Q150 132 142 108" fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
        ) : (
          <>
            <path d="M52 162 Q36 196 46 222" fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
            <path d="M126 162 Q142 196 132 222" fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
          </>
        )}
        {/* head */}
        <circle cx={89} cy={96} r={46} fill={SKIN} stroke={INK} strokeWidth={4} />
        {/* short hair */}
        <path d="M43 92 Q44 48 89 46 Q134 48 135 92 Q128 70 108 66 Q100 58 89 60 Q78 58 70 66 Q50 70 43 92 Z" fill={HAIR} />
        {/* glasses */}
        <circle cx={72} cy={98} r={15} fill="#fff" stroke={INK} strokeWidth={4} opacity={0.9} />
        <circle cx={106} cy={98} r={15} fill="#fff" stroke={INK} strokeWidth={4} opacity={0.9} />
        <line x1={87} y1={98} x2={91} y2={98} stroke={INK} strokeWidth={4} />
        <circle cx={72} cy={98} r={4.5} fill={INK} />
        <circle cx={106} cy={98} r={4.5} fill={INK} />
        {puzzled ? <path d="M78 122 Q89 116 100 124" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" /> : <path d="M78 120 Q89 128 100 120" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />}
      </svg>
    </div>
  );
};

// ── props ──────────────────────────────────────────────────────────────────
const Steam: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const f = useCurrentFrame();
  return (
    <>
      {[0, 1, 2].map((i) => {
        const t = ((f + i * 20) % 60) / 60;
        return <div key={i} style={{ position: "absolute", left: x + (i - 1) * 26, top: y - t * 90, width: 20, height: 20, borderRadius: "50%", background: STEAM, opacity: (1 - t) * 0.7 }} />;
      })}
    </>
  );
};
const Pot: React.FC<{ x: number; y: number; boiling?: boolean }> = ({ x, y, boiling }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)" }}>
    <svg width={220} height={150} viewBox="0 0 220 150">
      <rect x={30} y={44} width={160} height={86} rx={14} fill="#9AA3AD" stroke={INK} strokeWidth={5} />
      <rect x={20} y={36} width={180} height={20} rx={10} fill="#B7BEC6" stroke={INK} strokeWidth={5} />
      <rect x={2} y={40} width={26} height={10} rx={5} fill={INK} />
      <rect x={192} y={40} width={26} height={10} rx={5} fill={INK} />
      {boiling && <path d="M50 56 q14 -10 28 0 t28 0 t28 0" fill="none" stroke="#fff" strokeWidth={4} opacity={0.7} />}
    </svg>
    {boiling && <Steam x={110} y={30} />}
  </div>
);
const Bowl: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)" }}>
    <svg width={210} height={140} viewBox="0 0 210 140">
      <path d="M20 54 Q105 40 190 54 Q176 122 105 128 Q34 122 20 54 Z" fill="#EDE3D6" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <ellipse cx={105} cy={56} rx={84} ry={16} fill="#E8A24A" stroke={INK} strokeWidth={4} />
      <path d="M60 52 q16 -6 30 2 M120 50 q16 -4 28 4" fill="none" stroke="#C77A2E" strokeWidth={4} strokeLinecap="round" />
    </svg>
    <Steam x={105} y={22} />
  </div>
);
const RamenPack: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${s})` }}>
    <svg width={120} height={150} viewBox="0 0 120 150">
      <rect x={18} y={16} width={84} height={118} rx={10} fill="#E4574C" stroke={INK} strokeWidth={5} />
      <rect x={30} y={40} width={60} height={40} rx={8} fill="#F7E3C4" />
      <text x={60} y={112} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={20} fill="#fff">라면</text>
    </svg>
  </div>
);
const SaltShelf: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)" }}>
    <svg width={180} height={90} viewBox="0 0 180 90">
      <rect x={10} y={60} width={160} height={12} rx={4} fill={WOOD_D} stroke={INK} strokeWidth={4} />
      <rect x={64} y={22} width={40} height={40} rx={7} fill="#F3EFe8" stroke={INK} strokeWidth={4} />
      <rect x={70} y={14} width={28} height={12} rx={4} fill="#C9C2B6" stroke={INK} strokeWidth={4} />
      <text x={84} y={50} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={16} fill={INK}>소금</text>
    </svg>
  </div>
);
// a highlighted "look here" pointer ring
const Ring: React.FC<{ x: number; y: number; delay: number }> = ({ x, y, delay }) => {
  const f = useCurrentFrame();
  const p = ((f - delay) % 45) / 45;
  return <div style={{ position: "absolute", left: x, top: y, width: 90, height: 90, marginLeft: -45, marginTop: -45, borderRadius: "50%", border: `6px solid ${CHEEK}`, opacity: (1 - p) * 0.9, transform: `scale(${0.6 + p * 0.7})` }} />;
};

// ── caption ─────────────────────────────────────────────────────────────────
const Caption: React.FC<{ lines: string[]; f: number; dur: number; first: boolean }> = ({ lines, f, dur, first }) => {
  const a0 = first ? 0 : 10;
  const a1 = first ? 8 : 24;
  const op = interpolate(f, [a0, a1, dur - 24, dur - 12], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(f, [a0, a1], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", opacity: op, transform: `translateY(${y}px)` }}>
      {lines.map((l, i) => (
        <div key={i} style={{ fontFamily: HAND, fontSize: 96, lineHeight: 1.18, color: INK, textShadow: "0 2px 0 rgba(255,255,255,0.5)" }}>{l}</div>
      ))}
    </div>
  );
};

// ── scenes ───────────────────────────────────────────────────────────────────
const Spark: React.FC<{ x: number; y: number; sz?: number }> = ({ x, y, sz = 70 }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)" }}>
    <svg width={sz} height={sz} viewBox="0 0 100 100"><path d="M50 6 L58 42 L94 50 L58 58 L50 94 L42 58 L6 50 L42 42 Z" fill={YEL} stroke={INK} strokeWidth={4} strokeLinejoin="round" /></svg>
  </div>
);
const Stove: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)" }}>
    <svg width={240} height={150} viewBox="0 0 240 150"><rect x={16} y={40} width={208} height={96} rx={14} fill="#8A8F98" stroke={INK} strokeWidth={6} /><circle cx={78} cy={84} r={26} fill="#6B7078" stroke={INK} strokeWidth={5} /><circle cx={162} cy={84} r={26} fill="#6B7078" stroke={INK} strokeWidth={5} /><circle cx={40} cy={30} r={9} fill={INK} /><circle cx={200} cy={30} r={9} fill={INK} /></svg>
  </div>
);
const Cabinet: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)" }}>
    <svg width={220} height={200} viewBox="0 0 220 200"><rect x={10} y={10} width={200} height={180} rx={12} fill={WOOD} stroke={INK} strokeWidth={6} /><line x1={110} y1={20} x2={110} y2={180} stroke={INK} strokeWidth={5} /><circle cx={92} cy={100} r={9} fill={INK} /><circle cx={128} cy={100} r={9} fill={INK} /></svg>
  </div>
);
type Scene = { content: React.ReactNode; lines: string[] };
const SCENES: Scene[] = [
  { lines: ["우리가 AI를", "잘못 쓰는 예를 들어줄게"], content: <><Boy x={520} arm="hold" /><RamenPack x={720} y={1470} s={1.1} /></> },
  { lines: ["엄청 똑똑한 친구가", "새로 생겼어"], content: <Chef x={540} /> },
  { lines: ["세계적인", "미슐랭 셰프급 천재야"], content: <><Chef x={540} /><Spark x={720} y={1180} sz={90} /><Spark x={360} y={1320} sz={56} /></> },
  { lines: ["'라면 좀 끓여줘'", "하고 부탁했어"], content: <><Boy x={330} arm="up" /><Chef x={760} /><RamenPack x={540} y={1440} s={1.15} /></> },
  { lines: ["근데 이 친구,", "우리집 부엌은 처음이야"], content: <Chef x={540} puzzled arm="down" /> },
  { lines: ["냄비가 어딨는지 몰라", "여기저기 열어봐"], content: <><Cabinet x={320} y={1150} /><Ring x={320} y={1150} delay={0} /><Chef x={640} arm="search" puzzled /></> },
  { lines: ["불도 어떻게 켜는지", "헤매"], content: <><Chef x={720} puzzled /><Stove x={370} y={1500} /><Spark x={370} y={1380} sz={44} /></> },
  { lines: ["'냄비는 싱크대 아래'", "알려줬어"], content: <><Boy x={330} arm="up" /><Chef x={760} /><Pot x={520} y={1520} /><Ring x={520} y={1520} delay={0} /></> },
  { lines: ["'소금은 위칸이야'", "짚어줬어"], content: <><Boy x={420} arm="up" /><Chef x={790} /><SaltShelf x={430} y={680} /><Ring x={430} y={680} delay={10} /></> },
  { lines: ["그제야 물을 올리고", "끓이기 시작해"], content: <div style={{ position: "absolute", left: 540, top: 1200, transform: "translate(-50%,-50%) scale(1.7)" }}><Pot x={0} y={0} boiling /></div> },
  { lines: ["결국 라면 하나", "겨우 완성했어"], content: <div style={{ position: "absolute", left: 540, top: 1200, transform: "translate(-50%,-50%) scale(1.7)" }}><Bowl x={0} y={0} /></div> },
  { lines: ["천재 셰프인데", "우리집에선 나보다 서툴러"], content: <><Boy x={360} smug /><Chef x={760} puzzled /></> },
  { lines: ["낯선 환경에선", "천재도 우리와 똑같아"], content: <><Boy x={370} /><Chef x={740} /></> },
  { lines: ["설명해준 만큼만 잘해", "— 이게 AI야"], content: <><Boy x={370} arm="up" /><Chef x={760} /><Bowl x={540} y={1420} /></> },
];
export const SCENE_DUR = 110;
export const COOK_TOTAL = SCENES.length * SCENE_DUR;

const SceneView: React.FC<{ sc: Scene; f: number; first: boolean }> = ({ sc, f, first }) => (
  <AbsoluteFill>
    <Kitchen />
    {sc.content}
    <Caption lines={sc.lines} f={f} dur={SCENE_DUR} first={first} />
    <div style={{ position: "absolute", bottom: 90, width: "100%", textAlign: "center", fontFamily: SANS, fontSize: 30, letterSpacing: 6, color: "#8a8175" }}>@wylieax</div>
  </AbsoluteFill>
);

export const CookReel: React.FC = () => {
  const gf = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: WALL_A }}>
      <Fonts />
      {SCENES.map((sc, i) => {
        const start = i * SCENE_DUR;
        const local = gf - start;
        const visible = local >= 0 && local < SCENE_DUR;
        return (
          <AbsoluteFill key={i} style={{ opacity: visible ? 1 : 0 }}>
            <SceneView sc={sc} f={Math.max(0, Math.min(SCENE_DUR - 1, local))} first={i === 0} />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
