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
// Soft 3D / claymorphism style — pastel, puffy rounded cards, soft shadows.
// Topic: "AI가 다 해준다며?" — 카더라·체리픽만 보고 압박·생산성 집착하는 경영진에 일침.
// ---------------------------------------------------------------------------
const FONT = "Jua";
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

const claySh = "16px 18px 34px rgba(120,110,160,0.30), -8px -10px 22px rgba(255,255,255,0.8)";
const clayShSm = "8px 10px 20px rgba(120,110,160,0.28), -5px -6px 14px rgba(255,255,255,0.8)";

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
const useWobble = (amp = 3, speed = 0.45, phase = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return Math.sin((frame / fps) * 2 * Math.PI * speed + phase) * amp;
};
const useBreathe = (amp = 0.015, speed = 0.5, phase = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return 1 + Math.sin((frame / fps) * 2 * Math.PI * speed + phase) * amp;
};

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

const ICONS: Record<string, React.ReactNode> = {
  bubble: (
    <>
      <path d="M18 28 H82 a6 6 0 0 1 6 6 V62 a6 6 0 0 1 -6 6 H46 L30 82 V68 H18 a6 6 0 0 1 -6 -6 V34 a6 6 0 0 1 6 -6 Z" fill="none" stroke="#fff" strokeWidth={7} strokeLinejoin="round" />
      <path d="M28 42 H72 M28 54 H60" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
    </>
  ),
  star: (
    <path d="M50 15 L61 40 L88 43 L67 61 L73 88 L50 74 L27 88 L33 61 L12 43 L39 40 Z" fill="none" stroke="#fff" strokeWidth={7} strokeLinejoin="round" />
  ),
  press: (
    <>
      <rect x={20} y={56} width={60} height={16} rx={7} fill="#fff" />
      <path d="M35 20 V44 M27 36 L35 44 L43 36" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M65 20 V44 M57 36 L65 44 L73 36" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  gauge: (
    <>
      <path d="M16 70 A34 34 0 1 1 84 70" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" />
      <path d="M50 68 L70 40" stroke="#fff" strokeWidth={7} strokeLinecap="round" />
      <circle cx={50} cy={70} r={7} fill="#fff" />
    </>
  ),
  sparkle: (
    <>
      <path d="M50 14 L57 43 L86 50 L57 57 L50 86 L43 57 L14 50 L43 43 Z" fill="#fff" />
      <circle cx={80} cy={22} r={6} fill="#fff" />
      <circle cx={22} cy={78} r={5} fill="#fff" />
    </>
  ),
  chartdown: (
    <>
      <path d="M18 18 V82 H84" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 40 L46 56 L60 46 L76 66" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M76 66 L76 50 M76 66 L60 66" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  compass: (
    <>
      <circle cx={50} cy={50} r={36} fill="none" stroke="#fff" strokeWidth={7} />
      <path d="M64 36 L54 54 L36 64 L46 46 Z" fill="#fff" />
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
      const ph = ((frame - walk.startFrame) / fps) * steps * 2 * Math.PI;
      bob = -Math.abs(Math.sin(ph)) * 20;
      lean = Math.sin(ph) * 4.5;
      const plant = Math.max(0, Math.sin(ph * 2));
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

// one diagnosis item: clay icon tile + label under it
const DiagItem: React.FC<{ x: number; y: number; icon: string; color: string; label: string; delay: number }> = ({ x, y, icon, color, label, delay }) => {
  const pop = usePop(delay);
  const fl = useFloat(8, 0.55, x);
  const wob = useWobble(2.4, 0.5, x);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 320,
        transform: `translate(-50%,-50%) translateY(${fl + (1 - pop) * 26}px) scale(${pop})`,
        opacity: pop > 0.05 ? 1 : 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 138,
          height: 138,
          background: color,
          borderRadius: 42,
          boxShadow: claySh,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          transform: `rotate(${wob}deg)`,
        }}
      >
        <div style={{ position: "absolute", inset: 0, borderRadius: 42, background: "linear-gradient(150deg, rgba(255,255,255,0.45), transparent 55%)" }} />
        <svg width={84} height={84} viewBox="0 0 100 100">{ICONS[icon]}</svg>
      </div>
      <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 40, color: INK, marginTop: 18, whiteSpace: "nowrap" }}>{label}</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
const CardFrame: React.FC<{ a: string; b: string; bare?: boolean; children: React.ReactNode }> = ({ a, b, bare, children }) =>
  bare ? (
    <AbsoluteFill style={{ transform: "translateY(-48px) scale(0.97)", transformOrigin: "center center" }}>{children}</AbsoluteFill>
  ) : (
    <AbsoluteFill style={{ background: "#F3EEFB" }}>
      <FontLoader />
      <ClayBG a={a} b={b} />
      <AbsoluteFill style={{ transform: "translateY(-48px) scale(0.97)", transformOrigin: "center center" }}>{children}</AbsoluteFill>
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

const shadow = { textShadow: "3px 6px 0 rgba(120,110,160,0.12)" };

// ① 커버
export const Cover: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <CardFrame a={CORAL} b={YELLOW} bare={bare}>
    <Pill x={540} y={225} text="경영진에게 · 일침" color={LAV} delay={2} />
    <div style={{ ...centerText(345, 60, "#8a8398", BODY), fontWeight: 900 }}>옆집은 AI로</div>
    <div style={{ ...centerText(440, 108, CORAL), ...shadow }}>다 한다던데?</div>
    <div style={{ ...centerText(640, 46, INK, BODY), fontWeight: 900 }}>카더라에 흔들리는 리더에게</div>
    <Mascot x={540} y={1050} w={380} delay={4} floatAmp={16} />
    <div style={{ ...centerText(1290, 44, "#7a728e") }}>www.wylieax.com</div>
  </CardFrame>
);

// ② 현상 진단 — 2x2 아이콘 그리드
export const Diagnosis: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <CardFrame a={LAV} b={BLUE} bare={bare}>
    <div style={{ ...centerText(195, 50, INK), fontFamily: BODY, fontWeight: 900 }}>요즘 경영진이 AI를 대하는 법</div>
    <DiagItem x={340} y={490} icon="bubble" color={CORAL} label="카더라 뉴스" delay={8} />
    <DiagItem x={740} y={490} icon="star" color={YELLOW} label="체리픽 사례" delay={14} />
    <DiagItem x={340} y={775} icon="press" color={LAV} label="무조건 압박" delay={20} />
    <DiagItem x={740} y={775} icon="gauge" color={BLUE} label="생산성 숫자" delay={26} />
    <div style={{ ...centerText(1010, 46, "#5b5570", BODY), fontWeight: 700 }}>듣고 싶은 것만 보고, 밀어붙인다</div>
    <Mascot x={168} y={1185} w={170} delay={32} floatAmp={10} />
    <div style={{ ...centerText(1295, 42, "#7a728e") }}>www.wylieax.com</div>
  </CardFrame>
);

const StatementCard: React.FC<{
  icon: string;
  lead: string;
  big: string;
  bigColor: string;
  bigSize?: number;
  detail: React.ReactNode;
  tags: { t: string; c: string }[];
  a: string;
  b: string;
  bare?: boolean;
}> = ({ icon, lead, big, bigColor, bigSize = 80, detail, tags, a, b, bare }) => (
  <CardFrame a={a} b={b} bare={bare}>
    <ClayIcon x={540} y={250} kind={icon} color={bigColor} size={150} delay={8} />
    <div style={{ ...centerText(425, 56, INK) }}>{lead}</div>
    <ClayCard x={540} y={615} w={980} bg="#FFFFFF" delay={6} float={6} pad="30px 30px" radius={46}>
      <div style={{ fontFamily: FONT, fontSize: bigSize, color: bigColor, lineHeight: 1.05, textAlign: "center", whiteSpace: "nowrap" }}>{big}</div>
    </ClayCard>
    <div style={{ ...centerText(790, 44, "#5b5570", BODY), fontWeight: 700, lineHeight: 1.45 }}>{detail}</div>
    {tags.map((tg, i) => (
      <Pill key={i} x={306 + i * 234} y={1000} text={tg.t} color={tg.c} delay={20 + i * 5} />
    ))}
    <Mascot x={888} y={1215} w={200} delay={8} floatAmp={11} />
  </CardFrame>
);

// ③ 일침 ① — AI는 마법이 아니다
export const Myth: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <StatementCard
    bare={bare}
    icon="sparkle"
    lead="먼저 인정하자"
    big="AI는 마법이 아니다"
    bigColor={CORAL}
    bigSize={74}
    detail={<>남의 성공 하이라이트만 보면,<br />그 뒤의 실패와 맥락은 안 보인다</>}
    tags={[{ t: "생존편향", c: CORAL }, { t: "체리픽", c: BLUE }, { t: "착시", c: LAV }]}
    a={CORAL}
    b={YELLOW}
  />
);

// ④ 일침 ② — 압박한다고 생산성은 안 오른다
export const Pressure: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <StatementCard
    bare={bare}
    icon="chartdown"
    lead="숫자로 찍어 누르면"
    big="생산성은 안 오른다"
    bigColor={BLUE}
    bigSize={74}
    detail={<>맥락 없는 압박은 '척'만 남기고,<br />진짜 역량은 자라지 않는다</>}
    tags={[{ t: "번아웃", c: BLUE }, { t: "보여주기", c: MINT }, { t: "정체", c: LAV }]}
    a={BLUE}
    b={LAV}
  />
);

// ⑤ 마무리 — 카더라 말고 우리 조직
export const Closing: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <CardFrame a={MINT} b={BLUE} bare={bare}>
    <Pill x={540} y={295} text="방향은 여기서" color={LAV} delay={2} />
    <div style={{ ...centerText(425, 56, INK) }}>리더가 봐야 할 건</div>
    <ClayCard x={540} y={630} w={960} bg="#FFFFFF" delay={8} float={7} pad="26px 30px" radius={46}>
      <div style={{ fontFamily: FONT, fontSize: 66, color: MINT, lineHeight: 1.0, textAlign: "center", whiteSpace: "nowrap" }}>카더라 말고, 우리 조직</div>
    </ClayCard>
    <div style={{ ...centerText(790, 42, "#5b5570", BODY), fontWeight: 700, lineHeight: 1.45 }}>옆집 사례가 아니라,<br />우리의 문제·사람·맥락에서 시작하라</div>
    <Mascot x={540} y={1075} w={270} delay={6} floatAmp={14} />
    <div style={{ ...centerText(1300, 42, "#7a728e") }}>www.wylieax.com</div>
  </CardFrame>
);

// ---------------------------------------------------------------------------
// Video — HARD CUT over ONE shared background (no 겹침, no 깜박임)
// ---------------------------------------------------------------------------
const Fade: React.FC<{ d: number; children: React.ReactNode }> = ({ d, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ent = spring({ frame, fps, config: { damping: 16, stiffness: 120, mass: 1 } });
  return <AbsoluteFill style={{ transform: `scale(${0.985 + ent * 0.015})` }}>{children}</AbsoluteFill>;
};

const scenes = (
  <>
    <Sequence from={0} durationInFrames={110}><Fade d={110}><Cover bare /></Fade></Sequence>
    <Sequence from={110} durationInFrames={135}><Fade d={135}><Diagnosis bare /></Fade></Sequence>
    <Sequence from={245} durationInFrames={110}><Fade d={110}><Myth bare /></Fade></Sequence>
    <Sequence from={355} durationInFrames={110}><Fade d={110}><Pressure bare /></Fade></Sequence>
    <Sequence from={465} durationInFrames={115}><Fade d={115}><Closing bare /></Fade></Sequence>
  </>
);

export const HearsayVideo: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3EEFB" }}>
    <FontLoader />
    <ClayBG a={CORAL} b={BLUE} />
    {scenes}
  </AbsoluteFill>
);

export const HearsayReels: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3EEFB" }}>
    <FontLoader />
    <ClayBG a={CORAL} b={BLUE} />
    <div style={{ position: "absolute", left: 0, top: 285, width: 1080, height: 1350 }}>{scenes}</div>
  </AbsoluteFill>
);
