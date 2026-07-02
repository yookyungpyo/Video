import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  continueRender,
  delayRender,
} from "remotion";

// ---------------------------------------------------------------------------
// Soft 3D / claymorphism style — pastel, puffy rounded cards, soft shadows,
// gentle floating motion. The 3D plush mascot is the host. Topic: 선택과 집중.
// ---------------------------------------------------------------------------
const FONT = "Jua"; // rounded Korean display
const BODY = "Noto Sans KR";
const INK = "#403C52";
const BLUE = "#6FA8DC";
const CORAL = "#FF8E72";
const MINT = "#54C7A3";
const LAV = "#A98FE0";
const YELLOW = "#FFC95C";
const PINKR = "#F58FB0";

const MASCOT = staticFile("brand/mascot.png");

const fontCss = `
@font-face{font-family:'${FONT}';font-weight:400;src:url('${staticFile("fonts/jua-korean-400-normal.woff2")}') format('woff2');}
@font-face{font-family:'${BODY}';font-weight:700;src:url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2');}
@font-face{font-family:'${BODY}';font-weight:900;src:url('${staticFile("fonts/noto-sans-kr-korean-900-normal.woff2")}') format('woff2');}
`;

const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const done = () => continueRender(handle);
    Promise.all([
      (document as any).fonts.load(`400 80px "${FONT}"`, "중"),
      (document as any).fonts.load(`900 80px "${BODY}"`, "중"),
    ]).then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [handle]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

// soft clay double shadow (puffy extruded look)
const claySh = "16px 18px 34px rgba(120,110,160,0.30), -8px -10px 22px rgba(255,255,255,0.8)";
const clayShSm = "8px 10px 20px rgba(120,110,160,0.28), -5px -6px 14px rgba(255,255,255,0.8)";

// bouncier springs (overshoot) for livelier entrances
const usePop = (delay: number, soft = false) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: soft ? { damping: 11, stiffness: 120, mass: 1 } : { damping: 8, stiffness: 170, mass: 0.8 } });
};
const useFloat = (amp = 12, speed = 0.5, phase = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return Math.sin((frame / fps) * 2 * Math.PI * speed + phase) * amp;
};
// continuous rotation wobble (deg)
const useWobble = (amp = 3, speed = 0.45, phase = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return Math.sin((frame / fps) * 2 * Math.PI * speed + phase) * amp;
};
// subtle breathing scale around 1
const useBreathe = (amp = 0.015, speed = 0.5, phase = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return 1 + Math.sin((frame / fps) * 2 * Math.PI * speed + phase) * amp;
};

// ---------------------------------------------------------------------------
// Background — pastel gradient + soft drifting blobs + gentle top light
// ---------------------------------------------------------------------------
const ClayBG: React.FC<{ a: string; b: string }> = ({ a, b }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const blobs = [
    { c: a, r: 760, bx: 0.2, by: 0.25, ax: 110, ay: 90, s: 0.09, ph: 0 },
    { c: b, r: 820, bx: 0.82, by: 0.72, ax: 120, ay: 100, s: 0.075, ph: 2 },
    { c: "#FFFFFF", r: 600, bx: 0.7, by: 0.2, ax: 90, ay: 70, s: 0.11, ph: 4 },
  ];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #F3EEFB 0%, #F7EFEA 50%, #EAF3FB 100%)", overflow: "hidden" }}>
      {blobs.map((bl, i) => {
        const x = bl.bx * width + Math.sin(t * 2 * Math.PI * bl.s + bl.ph) * bl.ax;
        const y = bl.by * height + Math.cos(t * 2 * Math.PI * bl.s + bl.ph) * bl.ay;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - bl.r / 2,
              top: y - bl.r / 2,
              width: bl.r,
              height: bl.r,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${bl.c}AA 0%, transparent 70%)`,
              filter: "blur(40px)",
              opacity: 0.6,
            }}
          />
        );
      })}
      <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 12%, rgba(255,255,255,0.5) 0%, transparent 50%)" }} />
    </AbsoluteFill>
  );
};

// rounded puffy clay card
const ClayCard: React.FC<{
  x: number;
  y: number;
  w?: number;
  bg?: string;
  pad?: string;
  radius?: number;
  delay?: number;
  float?: number;
  children: React.ReactNode;
}> = ({ x, y, w, bg = "#FFFFFF", pad = "30px 50px", radius = 48, delay = 0, float = 0, children }) => {
  const pop = usePop(delay);
  const fl = useFloat(float + 6, 0.5, x);
  const wob = useWobble(1.6, 0.4, x);
  const br = useBreathe(0.014, 0.55, x);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        transform: `translate(-50%,-50%) translateY(${fl + (1 - pop) * 40}px) rotate(${wob}deg) scale(${pop * br})`,
        background: bg,
        padding: pad,
        borderRadius: radius,
        boxShadow: claySh,
        opacity: pop > 0.05 ? 1 : 0,
      }}
    >
      {children}
    </div>
  );
};

// soft squircle icon tile
const ICONS: Record<string, React.ReactNode> = {
  target: (
    <>
      <circle cx={50} cy={50} r={34} fill="none" stroke="#fff" strokeWidth={9} />
      <circle cx={50} cy={50} r={18} fill="none" stroke="#fff" strokeWidth={9} />
      <circle cx={50} cy={50} r={6} fill="#fff" />
    </>
  ),
  trash: (
    <>
      <path d="M26 34 L74 34 L69 86 L31 86 Z" fill="none" stroke="#fff" strokeWidth={8} strokeLinejoin="round" />
      <path d="M20 32 L80 32" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
      <path d="M40 26 L60 26" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
    </>
  ),
  converge: (
    <>
      <circle cx={50} cy={50} r={10} fill="#fff" />
      <path d="M50 14 L50 32 M45 27 L50 32 L55 27" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M86 50 L68 50 M73 45 L68 50 L73 55" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50 86 L50 68 M45 73 L50 68 L55 73" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 50 L32 50 M27 45 L32 50 L27 55" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  heartbreak: (
    <>
      <path d="M50 82 C22 62 16 44 24 34 a13 13 0 0 1 26 2 a13 13 0 0 1 26-2 C84 44 78 62 50 82 Z" fill="none" stroke="#fff" strokeWidth={8} strokeLinejoin="round" />
      <path d="M50 36 L42 52 L56 60 L48 76" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  crown: (
    <>
      <path d="M22 70 L18 34 L36 52 L50 28 L64 52 L82 34 L78 70 Z" fill="none" stroke="#fff" strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
      <path d="M22 78 L78 78" stroke="#fff" strokeWidth={8} strokeLinecap="round" />
    </>
  ),
  mask: (
    <>
      <path d="M26 26 C44 20 56 20 74 26 C78 52 68 78 50 84 C32 78 22 52 26 26 Z" fill="none" stroke="#fff" strokeWidth={8} strokeLinejoin="round" />
      <path d="M36 46 q6 -8 12 0 M52 46 q6 -8 12 0" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
      <path d="M40 64 q10 8 20 0" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
    </>
  ),
};
const ClayIcon: React.FC<{ x: number; y: number; kind: string; color: string; size?: number; delay?: number }> = ({ x, y, kind, color, size = 150, delay = 0 }) => {
  const pop = usePop(delay);
  const fl = useFloat(13, 0.62, x);
  const wob = useWobble(7, 0.5, x + 1);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        transform: `translate(-50%,-50%) translateY(${fl}px) rotate(${wob + (1 - pop) * -40}deg) scale(${pop})`,
        background: color,
        borderRadius: size * 0.3,
        boxShadow: claySh,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: pop > 0.05 ? 1 : 0,
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: size * 0.3, background: "linear-gradient(150deg, rgba(255,255,255,0.45), transparent 55%)" }} />
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 100 100">{ICONS[kind]}</svg>
    </div>
  );
};

const Pill: React.FC<{ x: number; y: number; text: string; color: string; delay?: number }> = ({ x, y, text, color, delay = 0 }) => {
  const pop = usePop(delay);
  const fl = useFloat(10, 0.58, x);
  const wob = useWobble(2.2, 0.5, x);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) translateY(${fl}px) rotate(${wob}deg) scale(${pop})`,
        background: color,
        color: "#fff",
        fontFamily: BODY,
        fontWeight: 900,
        fontSize: 40,
        padding: "16px 34px",
        borderRadius: 999,
        boxShadow: clayShSm,
        whiteSpace: "nowrap",
        opacity: pop > 0.05 ? 1 : 0,
      }}
    >
      {text}
    </div>
  );
};

type Walk = { fromX: number; startFrame: number; dur: number; steps?: number };
const Mascot: React.FC<{ x: number; y: number; w: number; delay?: number; flip?: boolean; floatAmp?: number; walk?: Walk }> = ({
  x,
  y,
  w,
  delay = 0,
  flip = false,
  floatAmp = 14,
  walk,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = usePop(delay);
  const h = (w * 2400) / 1350;

  // idle motion (default)
  const flIdle = useFloat(floatAmp + 8, 0.5, x);
  const tiltIdle = useWobble(3.2, 0.5, x);
  const sqI = Math.sin((frame / fps) * 2 * Math.PI * 0.5 + x);

  let curX = x;
  let bob = flIdle;
  let lean = tiltIdle;
  let sx = 1 - sqI * 0.04;
  let sy = 1 + sqI * 0.04;

  if (walk) {
    const steps = walk.steps ?? 2;
    const end = walk.startFrame + walk.dur;
    const p = interpolate(frame, [walk.startFrame, end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    curX = interpolate(p, [0, 1], [walk.fromX, x]);
    if (frame >= walk.startFrame && frame < end) {
      // stylized puppet walk while travelling
      const ph = ((frame - walk.startFrame) / fps) * steps * 2 * Math.PI;
      bob = -Math.abs(Math.sin(ph)) * 20; // 2 bobs per stride
      lean = Math.sin(ph) * 4.5; // alternating lean
      const plant = Math.max(0, Math.sin(ph * 2)); // foot contact
      sy = 1 - plant * 0.06;
      sx = 1 + plant * 0.05;
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        left: curX,
        top: y,
        width: w,
        height: h,
        transform: `translate(-50%,-50%) translateY(${bob}px) rotate(${lean}deg) scale(${pop}) scaleX(${sx}) scaleY(${sy}) ${flip ? "scaleX(-1)" : ""}`,
        transformOrigin: "center bottom",
        filter: "drop-shadow(10px 18px 22px rgba(120,110,160,0.4))",
        opacity: pop > 0.05 ? 1 : 0,
      }}
    >
      <Img src={MASCOT} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  );
};

const NumBubble: React.FC<{ x: number; y: number; n: string; color: string; delay?: number }> = ({ x, y, n, color, delay = 0 }) => {
  const pop = usePop(delay);
  const fl = useFloat(10, 0.62, x + 3);
  const wob = useWobble(5, 0.5, x + 2);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 120,
        height: 120,
        transform: `translate(-50%,-50%) translateY(${fl}px) rotate(${wob + (1 - pop) * 200}deg) scale(${pop})`,
        background: color,
        borderRadius: "50%",
        boxShadow: claySh,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
        fontSize: 64,
        color: "#fff",
        opacity: pop > 0.05 ? 1 : 0,
      }}
    >
      {n}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Instagram card-news (1080x1350, each rendered as a still)
// ---------------------------------------------------------------------------
const CardFrame: React.FC<{ a: string; b: string; children: React.ReactNode }> = ({ a, b, children }) => (
  <AbsoluteFill style={{ background: "#F3EEFB" }}>
    <FontLoader />
    <ClayBG a={a} b={b} />
    <AbsoluteFill style={{ transform: "scale(0.97)", transformOrigin: "center center" }}>{children}</AbsoluteFill>
  </AbsoluteFill>
);

const centerText = (top: number, size: number, color: string, family = FONT): React.CSSProperties => ({
  position: "absolute",
  top,
  width: "100%",
  textAlign: "center",
  fontFamily: family,
  fontSize: size,
  color,
  lineHeight: 1.2,
});

export const Cover: React.FC = () => (
  <CardFrame a={LAV} b={BLUE}>
    <Pill x={540} y={225} text="자기 점검 · 반성" color={LAV} delay={2} />
    <div style={{ ...centerText(345, 100, INK), textShadow: "3px 6px 0 rgba(120,110,160,0.12)" }}>나는,</div>
    <div style={{ ...centerText(470, 80, CORAL), textShadow: "3px 6px 0 rgba(120,110,160,0.12)" }}>나르시시스트일까?</div>
    <div style={{ ...centerText(605, 50, INK, BODY), fontWeight: 900 }}>문득, 나를 돌아봤다</div>
    <Mascot x={540} y={1010} w={410} delay={4} floatAmp={16} />
    <div style={{ ...centerText(1275, 44, "#7a728e") }}>www.wylieax.com</div>
  </CardFrame>
);

const TraitCard: React.FC<{
  num: string;
  word: string;
  accent: string;
  sub: string;
  detail: React.ReactNode;
  icon: string;
  tags: { t: string; c: string }[];
  a: string;
  b: string;
}> = ({ num, word, accent, sub, detail, icon, tags, a, b }) => (
  <CardFrame a={a} b={b}>
    <NumBubble x={190} y={250} n={num} color={accent} delay={2} />
    <ClayIcon x={870} y={255} kind={icon} color={accent} size={150} delay={10} />
    <ClayCard x={540} y={480} w={880} bg="#FFFFFF" delay={6} float={6} pad="30px 40px" radius={46}>
      <div style={{ fontFamily: FONT, fontSize: 86, color: INK, lineHeight: 1.05, textAlign: "center" }}>{word}</div>
    </ClayCard>
    <div style={{ ...centerText(660, 60, accent) }}>{sub}</div>
    <div style={{ ...centerText(780, 44, "#5b5570", BODY), fontWeight: 700, lineHeight: 1.45 }}>{detail}</div>
    {tags.map((tg, i) => (
      <Pill key={i} x={310 + i * 230} y={1010} text={tg.t} color={tg.c} delay={20 + i * 5} />
    ))}
    <Mascot x={885} y={1210} w={210} delay={8} floatAmp={11} />
  </CardFrame>
);

export const Trait1: React.FC = () => (
  <TraitCard
    num="1"
    word="나만 생각했다"
    accent={CORAL}
    sub="상대보다 내 기분이 먼저"
    detail={<>상대의 마음을 헤아리기보다<br />내 감정과 욕구를 앞세웠다</>}
    icon="heartbreak"
    tags={[{ t: "나 먼저", c: CORAL }, { t: "무심함", c: BLUE }, { t: "미안함", c: LAV }]}
    a={CORAL}
    b={YELLOW}
  />
);

export const Trait2: React.FC = () => (
  <TraitCard
    num="2"
    word="인정받고 싶었다"
    accent={BLUE}
    sub="특별한 사람이고 싶었다"
    detail={<>관심과 칭찬의 중심에 서려고<br />나를 실제보다 부풀렸다</>}
    icon="crown"
    tags={[{ t: "인정욕구", c: BLUE }, { t: "과시", c: YELLOW }, { t: "비교", c: MINT }]}
    a={BLUE}
    b={MINT}
  />
);

export const Trait3: React.FC = () => (
  <TraitCard
    num="3"
    word="사실은 두려웠다"
    accent={LAV}
    sub="겉으론 강한 척했다"
    detail={<>비판이 두려웠고<br />속으론 부끄러움을 숨겼다</>}
    icon="mask"
    tags={[{ t: "두려움", c: LAV }, { t: "부끄러움", c: CORAL }, { t: "불안", c: BLUE }]}
    a={LAV}
    b={PINKR}
  />
);

export const Closing: React.FC = () => (
  <CardFrame a={LAV} b={PINKR}>
    <Pill x={540} y={240} text="그리고, 반성" color={LAV} delay={2} />
    <div style={{ ...centerText(380, 78, INK) }}>인정하는 순간,</div>
    <ClayCard x={540} y={590} w={820} bg="#FFFFFF" delay={8} float={7} pad="26px 40px" radius={44}>
      <div style={{ fontFamily: FONT, fontSize: 100, color: CORAL, lineHeight: 1.0, textAlign: "center" }}>나는 달라진다</div>
    </ClayCard>
    <Pill x={320} y={820} text="인정" color={CORAL} delay={16} />
    <Pill x={540} y={820} text="성찰" color={BLUE} delay={21} />
    <Pill x={745} y={820} text="변화" color={LAV} delay={26} />
    <div style={{ ...centerText(940, 48, "#5b5570", BODY), fontWeight: 900 }}>나를 아는 게, 변화의 시작이다</div>
    <Mascot x={540} y={1150} w={330} delay={6} floatAmp={14} />
    <div style={{ ...centerText(1290, 42, "#7a728e") }}>www.wylieax.com</div>
  </CardFrame>
);
