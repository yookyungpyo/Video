import { useEffect, useState } from "react";
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, continueRender, delayRender } from "remotion";

// ---------------------------------------------------------------------------
// Simple cute hand-drawn (샤오헤이/Luo Xiaohei-ish) explainer, drawn in SVG.
// The "genius chef (AI)" kitchen metaphor for 7 AI-usage concepts:
// harness / prompt / context / skill / command / plugin / loop.
// ---------------------------------------------------------------------------
const HAND = "Nanum Pen Script";
const SANS = "Noto Sans KR";
const INK = "#3A3540";
const ACC = "#E8734C";       // concept accent
const YEL = "#F2C14E";
const JEAN = "#6E8AC0";
const SKIN = "#F7D8BE";
const CHEEK = "#F0A79E";
const APRON = "#FBFBF7";
const SHIRT = "#A9C4D8";
const HAIR = "#2E2A33";
const WALL_A = "#EFE3D0";
const WALL_B = "#E7D7BE";
const WOOD = "#C89A66";
const WOOD_D = "#B07E4E";
const PAPER = "#FBF6EA";
const MINT = "#7FC7A6";
const STEAM = "#EDE6DA";

const fontCss = `
@font-face{font-family:'${HAND}';font-weight:400;src:url('${staticFile("fonts/nanum-pen-script-korean-400-normal.woff2")}') format('woff2');}
@font-face{font-family:'${SANS}';font-weight:400;src:url('${staticFile("fonts/noto-sans-kr-korean-400-normal.woff2")}') format('woff2');}
@font-face{font-family:'${SANS}';font-weight:700;src:url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2');}
`;
const Fonts: React.FC = () => {
  const [h] = useState(() => delayRender("f"));
  useEffect(() => {
    const done = () => continueRender(h);
    Promise.all([(document as any).fonts.load(`400 90px "${HAND}"`, "셰프주방"), (document as any).fonts.load(`700 40px "${SANS}"`, "셰프")]).then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [h]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

const useBob = (amp = 5, speed = 0.5, phase = 0) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return Math.sin((f / fps) * 2 * Math.PI * speed + phase) * amp;
};
const usePop = (delay = 0) => spring({ frame: useCurrentFrame() - delay, fps: useVideoConfig().fps, config: { damping: 12, stiffness: 120 } });

// ── backdrop ────────────────────────────────────────────────────────────────
const Kitchen: React.FC = () => (
  <AbsoluteFill>
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${WALL_A} 0%, ${WALL_B} 100%)` }} />
    <div style={{ position: "absolute", right: 100, top: 610, width: 250, height: 260, background: "#33405C", borderRadius: 14, border: `10px solid ${WALL_A}`, boxShadow: `0 0 0 6px ${INK}` }}>
      <div style={{ position: "absolute", left: "50%", top: 0, width: 6, height: "100%", marginLeft: -3, background: WALL_A }} />
      <div style={{ position: "absolute", top: "50%", left: 0, height: 6, width: "100%", marginTop: -3, background: WALL_A }} />
      <div style={{ position: "absolute", right: 24, top: 22, width: 34, height: 34, borderRadius: "50%", background: "#F4E6B0", opacity: 0.85 }} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1560, height: 360, background: WOOD }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 1548, height: 16, background: WOOD_D }} />
  </AbsoluteFill>
);

// ── characters (same reusable components → 100% consistent) ─────────────────
type Arm = "down" | "up" | "search";
const Boy: React.FC<{ x: number; y?: number; s?: number; arm?: Arm; delay?: number }> = ({ x, y = 1720, s = 1.6, arm = "down", delay = 0 }) => {
  const bob = useBob(5, 0.5, x);
  const pop = usePop(delay);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-100%) translateY(${bob}px) scale(${pop * s})`, transformOrigin: "center bottom", opacity: pop > 0.05 ? 1 : 0 }}>
      <svg width={150} height={250} viewBox="0 0 150 250">
        <rect x={54} y={188} width={18} height={44} rx={8} fill={JEAN} stroke={INK} strokeWidth={4} />
        <rect x={78} y={188} width={18} height={44} rx={8} fill={JEAN} stroke={INK} strokeWidth={4} />
        <ellipse cx={62} cy={236} rx={16} ry={9} fill="#fff" stroke={INK} strokeWidth={4} />
        <ellipse cx={88} cy={236} rx={16} ry={9} fill="#fff" stroke={INK} strokeWidth={4} />
        <path d="M40 130 Q75 118 110 130 L114 196 Q75 208 36 196 Z" fill={YEL} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        {arm === "up" ? <path d="M44 140 Q22 110 30 86" fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" /> : <path d="M44 140 Q30 168 40 190" fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />}
        <path d="M108 140 Q124 166 116 190" fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
        <circle cx={75} cy={88} r={42} fill={SKIN} stroke={INK} strokeWidth={4} />
        <path d="M33 84 Q34 44 75 42 Q116 44 117 84 Q100 66 75 66 Q50 66 33 84 Z" fill={HAIR} />
        <circle cx={60} cy={92} r={4.5} fill={INK} />
        <circle cx={90} cy={92} r={4.5} fill={INK} />
        <circle cx={50} cy={104} r={7} fill={CHEEK} opacity={0.6} />
        <circle cx={100} cy={104} r={7} fill={CHEEK} opacity={0.6} />
        <path d="M66 108 Q75 114 84 108" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      </svg>
    </div>
  );
};
const Chef: React.FC<{ x: number; y?: number; s?: number; arm?: Arm; puzzled?: boolean; delay?: number }> = ({ x, y = 1720, s = 1.5, arm = "down", puzzled = false, delay = 0 }) => {
  const bob = useBob(5, 0.5, x + 2);
  const pop = usePop(delay);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-100%) translateY(${bob}px) scale(${pop * s})`, transformOrigin: "center bottom", opacity: pop > 0.05 ? 1 : 0 }}>
      <svg width={175} height={330} viewBox="0 0 175 330">
        <rect x={66} y={250} width={20} height={60} rx={9} fill={INK} />
        <rect x={92} y={250} width={20} height={60} rx={9} fill={INK} />
        <ellipse cx={76} cy={314} rx={17} ry={9} fill="#fff" stroke={INK} strokeWidth={4} />
        <ellipse cx={102} cy={314} rx={17} ry={9} fill="#fff" stroke={INK} strokeWidth={4} />
        <path d="M50 150 Q89 138 128 150 L132 258 Q89 270 46 258 Z" fill={SHIRT} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d="M62 158 L116 158 L120 256 Q89 266 58 256 Z" fill={APRON} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
        <path d="M70 158 Q89 150 108 158" fill="none" stroke={INK} strokeWidth={3.5} />
        <line x1={89} y1={150} x2={89} y2={140} stroke={INK} strokeWidth={3.5} />
        {arm === "search" ? <path d="M52 162 Q26 150 18 132" fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" /> : arm === "up" ? <path d="M126 162 Q150 132 142 108" fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" /> : <><path d="M52 162 Q36 196 46 222" fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" /><path d="M126 162 Q142 196 132 222" fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" /></>}
        <circle cx={89} cy={96} r={46} fill={SKIN} stroke={INK} strokeWidth={4} />
        <path d="M43 92 Q44 48 89 46 Q134 48 135 92 Q128 70 108 66 Q100 58 89 60 Q78 58 70 66 Q50 70 43 92 Z" fill={HAIR} />
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

// ── concept props ────────────────────────────────────────────────────────────
const Wrap: React.FC<{ x: number; y: number; delay?: number; children: React.ReactNode }> = ({ x, y, delay = 4, children }) => {
  const pop = usePop(delay);
  const bob = useBob(6, 0.45, x);
  return <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) translateY(${bob}px) scale(${pop})`, opacity: pop > 0.05 ? 1 : 0 }}>{children}</div>;
};
const Stove: React.FC = () => (
  <svg width={360} height={240} viewBox="0 0 360 240">
    <rect x={20} y={70} width={320} height={150} rx={18} fill="#9AA0A8" stroke={INK} strokeWidth={7} />
    <circle cx={120} cy={140} r={40} fill="#6B7078" stroke={INK} strokeWidth={6} />
    <circle cx={240} cy={140} r={40} fill="#6B7078" stroke={INK} strokeWidth={6} />
    <circle cx={60} cy={50} r={12} fill={INK} /><circle cx={300} cy={50} r={12} fill={INK} />
    {/* pot on left burner */}
    <rect x={80} y={92} width={80} height={44} rx={8} fill="#B7BEC6" stroke={INK} strokeWidth={5} />
    <path d="M92 100 q10 -8 20 0 t20 0" fill="none" stroke="#fff" strokeWidth={3} opacity={0.7} />
  </svg>
);
const Ticket: React.FC = () => (
  <svg width={220} height={280} viewBox="0 0 220 280">
    <path d="M24 14 H196 V250 L178 236 L160 250 L142 236 L124 250 L106 236 L88 250 L70 236 L52 250 L34 236 L24 250 Z" fill={PAPER} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <line x1={52} y1={70} x2={168} y2={70} stroke={ACC} strokeWidth={7} strokeLinecap="round" />
    <line x1={52} y1={110} x2={168} y2={110} stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.5} />
    <line x1={52} y1={144} x2={140} y2={144} stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.5} />
    <line x1={52} y1={178} x2={155} y2={178} stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.5} />
  </svg>
);
const StickyNote: React.FC = () => (
  <svg width={260} height={230} viewBox="0 0 260 230">
    <rect x={14} y={14} width={232} height={200} rx={10} fill="#FCE7A6" stroke={INK} strokeWidth={6} transform="rotate(-3 130 114)" />
    <text x={70} y={100} fontFamily={SANS} fontWeight={700} fontSize={34} fill={INK}>냄비 ↓</text>
    <text x={70} y={160} fontFamily={SANS} fontWeight={700} fontSize={34} fill={INK}>소금 ↑</text>
  </svg>
);
const RecipeCard: React.FC = () => (
  <svg width={250} height={300} viewBox="0 0 250 300">
    <rect x={16} y={16} width={218} height={268} rx={16} fill={PAPER} stroke={INK} strokeWidth={6} />
    <rect x={16} y={16} width={218} height={58} rx={16} fill={MINT} stroke={INK} strokeWidth={6} />
    <text x={125} y={56} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={34} fill="#fff">레시피</text>
    <line x1={44} y1={118} x2={206} y2={118} stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.5} />
    <line x1={44} y1={156} x2={206} y2={156} stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.5} />
    <line x1={44} y1={194} x2={176} y2={194} stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.5} />
    <line x1={44} y1={232} x2={196} y2={232} stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.5} />
  </svg>
);
const CmdBtn: React.FC = () => (
  <svg width={330} height={170} viewBox="0 0 330 170">
    <rect x={16} y={30} width={298} height={92} rx={46} fill={ACC} stroke={INK} strokeWidth={7} />
    <text x={150} y={92} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={44} fill="#fff">/아침세트</text>
    {/* cursor */}
    <path d="M232 108 L232 156 L246 142 L256 164 L266 158 L256 138 L276 138 Z" fill="#fff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
  </svg>
);
const Plugin: React.FC = () => (
  <svg width={420} height={260} viewBox="0 0 420 260">
    {/* kitchen node */}
    <rect x={20} y={90} width={110} height={90} rx={14} fill={SHIRT} stroke={INK} strokeWidth={6} />
    <text x={75} y={145} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={26} fill={INK}>부엌</text>
    {/* link */}
    <path d="M132 135 H210" fill="none" stroke={INK} strokeWidth={7} strokeDasharray="12 10" />
    <circle cx={171} cy={135} r={20} fill="#fff" stroke={INK} strokeWidth={6} />
    <path d="M163 135 h16 M171 127 v16" stroke={ACC} strokeWidth={6} strokeLinecap="round" />
    {/* shop nodes */}
    <rect x={214} y={20} width={120} height={80} rx={12} fill={YEL} stroke={INK} strokeWidth={6} />
    <text x={274} y={70} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={26} fill={INK}>마트</text>
    <rect x={214} y={168} width={120} height={80} rx={12} fill={MINT} stroke={INK} strokeWidth={6} />
    <text x={274} y={218} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={26} fill="#fff">베이커리</text>
    <path d="M210 135 L214 60" fill="none" stroke={INK} strokeWidth={6} strokeDasharray="10 8" />
    <path d="M210 135 L214 208" fill="none" stroke={INK} strokeWidth={6} strokeDasharray="10 8" />
  </svg>
);
const Steam: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const f = useCurrentFrame();
  return <>{[0, 1, 2].map((i) => { const t = ((f + i * 20) % 60) / 60; return <div key={i} style={{ position: "absolute", left: x + (i - 1) * 24, top: y - t * 80, width: 18, height: 18, borderRadius: "50%", background: STEAM, opacity: (1 - t) * 0.7 }} />; })}</>;
};
const LoopBowl: React.FC = () => {
  const f = useCurrentFrame();
  const rot = (f * 3) % 360;
  return (
    <svg width={300} height={300} viewBox="0 0 300 300">
      <g transform={`rotate(${rot} 150 150)`}>
        <path d="M150 40 A110 110 0 1 1 60 90" fill="none" stroke={ACC} strokeWidth={12} strokeLinecap="round" />
        <path d="M150 40 L128 20 M150 40 L128 62" fill="none" stroke={ACC} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* bowl + spoon (taste) */}
      <path d="M92 150 Q150 138 208 150 Q196 200 150 206 Q104 200 92 150 Z" fill="#EDE3D6" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <ellipse cx={150} cy={152} rx={56} ry={12} fill="#E8A24A" stroke={INK} strokeWidth={4} />
      <line x1={196} y1={120} x2={230} y2={92} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <ellipse cx={192} cy={126} rx={16} ry={11} fill="#D9D3C6" stroke={INK} strokeWidth={5} />
    </svg>
  );
};
const StarDish: React.FC = () => (
  <div style={{ position: "relative" }}>
    <svg width={300} height={200} viewBox="0 0 300 200">
      <ellipse cx={150} cy={150} rx={130} ry={34} fill="#EDE6DC" stroke={INK} strokeWidth={6} />
      <ellipse cx={150} cy={140} rx={90} ry={24} fill="#F0C98A" stroke={INK} strokeWidth={4} />
      <path d="M110 138 q18 -10 36 0 M158 134 q16 -8 30 2" fill="none" stroke="#C77A2E" strokeWidth={4} strokeLinecap="round" />
      <path d="M150 44 L160 74 L192 74 L166 94 L176 124 L150 106 L124 124 L134 94 L108 74 L140 74 Z" fill={YEL} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    </svg>
  </div>
);

// ── caption (concept head + description) ─────────────────────────────────────
const Caption: React.FC<{ head?: string; lines: string[]; f: number; dur: number; first: boolean }> = ({ head, lines, f, dur, first }) => {
  const a0 = first ? 0 : 8, a1 = first ? 8 : 22;
  const op = interpolate(f, [a0, a1, dur - 22, dur - 10], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(f, [a0, a1], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 140, width: "100%", textAlign: "center", opacity: op, transform: `translateY(${y}px)`, padding: "0 60px" }}>
      {head && <div style={{ fontFamily: HAND, fontSize: 110, color: ACC, lineHeight: 1.05, textShadow: "0 2px 0 rgba(255,255,255,0.5)" }}>{head}</div>}
      {lines.map((l, i) => <div key={i} style={{ fontFamily: HAND, fontSize: 84, lineHeight: 1.2, color: INK, textShadow: "0 2px 0 rgba(255,255,255,0.5)" }}>{l}</div>)}
    </div>
  );
};

// ── example card (center-left, fills the space + aids understanding) ─────────
const ExampleCard: React.FC<{ lines: string[]; f: number }> = ({ lines, f }) => {
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f - 10, fps, config: { damping: 13, stiffness: 120 } });
  return (
    <div style={{ position: "absolute", left: 78, top: 720, width: 600, transform: `translateY(${(1 - pop) * 18}px) scale(${0.9 + pop * 0.1})`, transformOrigin: "left center", opacity: pop > 0.05 ? 1 : 0, background: PAPER, border: `5px solid ${INK}`, borderRadius: 28, padding: "28px 34px 34px", boxShadow: "10px 12px 0 rgba(58,53,64,0.14)" }}>
      <div style={{ display: "inline-block", background: ACC, color: "#fff", fontFamily: SANS, fontWeight: 700, fontSize: 30, padding: "6px 22px", borderRadius: 999, marginBottom: 18 }}>예시</div>
      {lines.map((l, i) => (
        <div key={i} style={{ fontFamily: SANS, fontWeight: 700, fontSize: 43, lineHeight: 1.5, color: INK }}>{l}</div>
      ))}
    </div>
  );
};

// ── scenes ────────────────────────────────────────────────────────────────────
type Scene = { head?: string; lines: string[]; example?: string[]; content: React.ReactNode };
const SCENES: Scene[] = [
  { lines: ["천재 셰프(AI)를", "진짜 미슐랭으로 만드는 법"], example: ["천재도", "잘 부려야", "제 실력이 난다"], content: <><Boy x={380} /><Chef x={730} /></> },
  { head: "① 프롬프트", lines: ["주문서를 구체적으로"], example: ["그냥: \"밥 해줘\"", "구체적: \"매콤 김치볶음밥,", "계란 반숙, 2인분\""], content: <><Boy x={330} arm="up" /><Wrap x={560} y={1360}><Ticket /></Wrap><Chef x={790} /></> },
  { head: "② 컨텍스트", lines: ["우리 부엌 사정을 알려주기"], example: ["\"냄비는 싱크대 아래,", "애는 안 매운 걸로,", "새우 알레르기 있어\""], content: <><Boy x={330} arm="up" /><Wrap x={560} y={1350}><StickyNote /></Wrap><Chef x={790} /></> },
  { head: "③ 스킬", lines: ["우리집 레시피 카드"], example: ["\"우리집 된장찌개는", "이 순서, 이 비율\"", "→ 매번 같은 맛"], content: <><Chef x={760} /><Wrap x={430} y={1330}><RecipeCard /></Wrap></> },
  { head: "④ 명령어", lines: ["단축 주문 버튼 하나로"], example: ["/아침세트 →", "토스트+계란+커피", "자동으로 뚝딱"], content: <><Chef x={780} /><Wrap x={430} y={1360}><CmdBtn /></Wrap></> },
  { head: "⑤ 플러그인", lines: ["밖과 연결해 없는 걸 조달"], example: ["재료가 없네?", "→ 마트앱 연결", "셰프가 알아서 주문"], content: <><Chef x={820} /><Wrap x={430} y={1350}><Plugin /></Wrap></> },
  { head: "⑥ 하네스", lines: ["요리하는 주방 그 자체"], example: ["불·물·팬이 있어야", "머릿속 레시피가", "진짜 요리가 된다"], content: <><Wrap x={540} y={1340}><Stove /></Wrap><Chef x={800} /><Steam x={452} y={1240} /></> },
  { head: "⑦ 루프", lines: ["맛보고 고치기, 반복"], example: ["간 보고 → 소금 넣고", "다시 간 보고…", "될 때까지 반복"], content: <><Chef x={800} arm="down" /><Wrap x={430} y={1320}><LoopBowl /></Wrap></> },
  { lines: ["이 7가지를 갖춰줄 때", "천재는 진짜 미슐랭이 된다"], example: ["주문·정보·레시피·", "버튼·연결·주방·반복", "다 갖추면 완성!"], content: <><Boy x={360} /><Chef x={720} arm="up" /><Wrap x={540} y={1360}><StarDish /></Wrap></> },
];
export const SCENE_DUR = 120;
export const CHEF_TOTAL = SCENES.length * SCENE_DUR;

const SceneView: React.FC<{ sc: Scene; f: number; first: boolean }> = ({ sc, f, first }) => (
  <AbsoluteFill>
    <Kitchen />
    {sc.content}
    {sc.example && <ExampleCard lines={sc.example} f={f} />}
    <Caption head={sc.head} lines={sc.lines} f={f} dur={SCENE_DUR} first={first} />
    <div style={{ position: "absolute", bottom: 84, width: "100%", textAlign: "center", fontFamily: SANS, fontSize: 30, letterSpacing: 6, color: "#8a8175" }}>@wylieax</div>
  </AbsoluteFill>
);

export const ChefAiReel: React.FC = () => {
  const gf = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: WALL_A }}>
      <Fonts />
      {SCENES.map((sc, i) => {
        const start = i * SCENE_DUR;
        const local = gf - start;
        const visible = local >= 0 && local < SCENE_DUR;
        return <AbsoluteFill key={i} style={{ opacity: visible ? 1 : 0 }}><SceneView sc={sc} f={Math.max(0, Math.min(SCENE_DUR - 1, local))} first={i === 0} /></AbsoluteFill>;
      })}
    </AbsoluteFill>
  );
};
