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
// Soft 3D / claymorphism style. Topic: 꾸준함은 정답이 아니다. 하지만 전제다.
// (모든 성취의 밑엔 꾸준함 → 정답은 아니다(방향) → 그래도 없으면 아무것도 → 전제)
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
  // stacked layers = accumulation / foundation
  layers: (
    <>
      <rect x={22} y={60} width={56} height={15} rx={6} fill="#fff" />
      <rect x={29} y={41} width={42} height={14} rx={6} fill="#fff" opacity={0.82} />
      <rect x={36} y={24} width={28} height={13} rx={6} fill="#fff" opacity={0.64} />
    </>
  ),
  // compass = direction
  compass: (
    <>
      <circle cx={50} cy={50} r={35} fill="none" stroke="#fff" strokeWidth={7} />
      <path d="M64 36 L54 54 L36 64 L46 46 Z" fill="#fff" />
      <circle cx={50} cy={50} r={4.5} fill="#fff" />
    </>
  ),
  // sprout = growth (won't grow without it)
  growth: (
    <>
      <path d="M50 86 V48" stroke="#fff" strokeWidth={7} strokeLinecap="round" />
      <path d="M50 60 C39 60 29 52 27 39 C41 39 50 47 50 60 Z" fill="#fff" />
      <path d="M50 52 C61 52 71 44 73 31 C59 31 50 39 50 52 Z" fill="#fff" />
      <path d="M34 86 H66" stroke="#fff" strokeWidth={7} strokeLinecap="round" />
    </>
  ),
  // infinity-ish loop = persistence
  loop: (
    <>
      <path d="M50 50 C42 34 20 34 20 50 C20 66 42 66 50 50 C58 34 80 34 80 50 C80 66 58 66 50 50 Z" fill="none" stroke="#fff" strokeWidth={7} strokeLinejoin="round" />
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

const Mascot: React.FC<{ x: number; y: number; w: number; delay?: number; flip?: boolean; floatAmp?: number }> = ({ x, y, w, delay = 0, flip = false, floatAmp = 14 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = usePop(delay);
  const h = (w * 2400) / 1350;
  const fl = useFloat(floatAmp + 8, 0.5, x);
  const tilt = useWobble(3.2, 0.5, x);
  const sq = Math.sin((frame / fps) * 2 * Math.PI * 0.5 + x);
  const sx = 1 - sq * 0.04;
  const sy = 1 + sq * 0.04;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        transform: `translate(-50%,-50%) translateY(${fl}px) rotate(${tilt}deg) scale(${pop}) scaleX(${sx}) scaleY(${sy}) ${flip ? "scaleX(-1)" : ""}`,
        transformOrigin: "center bottom",
        filter: "drop-shadow(10px 18px 22px rgba(120,110,160,0.4))",
        opacity: pop > 0.05 ? 1 : 0,
      }}
    >
      <Img src={MASCOT} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
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
  <CardFrame a={BLUE} b={MINT} bare={bare}>
    <Pill x={540} y={235} text="꾸준함에 대하여" color={LAV} delay={2} />
    <div style={{ ...centerText(365, 118, INK), ...shadow }}>꾸준함이</div>
    <div style={{ ...centerText(520, 118, BLUE), ...shadow }}>정답일까?</div>
    <div style={{ ...centerText(720, 46, INK, BODY), fontWeight: 900 }}>흔한 조언에 대한 반문</div>
    <Mascot x={540} y={1055} w={380} delay={4} floatAmp={16} />
    <div style={{ ...centerText(1290, 44, "#7a728e") }}>www.wylieax.com</div>
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

// ② 중요성 (C안) — 모든 성취의 밑엔 꾸준함이 있다
export const Foundation: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <StatementCard
    bare={bare}
    icon="layers"
    lead="모든 성취의 밑엔"
    big="꾸준함이 있다"
    bigColor={MINT}
    bigSize={80}
    detail={<>눈에 띄는 결과도,<br />보이지 않는 반복 위에 선다</>}
    tags={[{ t: "토대", c: MINT }, { t: "반복", c: BLUE }, { t: "기본", c: LAV }]}
    a={MINT}
    b={BLUE}
  />
);

// ③ 반전 (caveat) — 하지만 정답은 아니다
export const Caveat: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <StatementCard
    bare={bare}
    icon="compass"
    lead="하지만 솔직히,"
    big="정답은 아니다"
    bigColor={CORAL}
    bigSize={80}
    detail={<>방향이 틀리면,<br />꾸준함은 더 빨리 헤맬 뿐</>}
    tags={[{ t: "방향", c: CORAL }, { t: "전략", c: BLUE }, { t: "선택", c: LAV }]}
    a={CORAL}
    b={YELLOW}
  />
);

// ④ 필요조건 — 그래도 없으면 아무것도
export const Necessity: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <StatementCard
    bare={bare}
    icon="growth"
    lead="그래도 분명한 건"
    big="없으면, 아무것도"
    bigColor={BLUE}
    bigSize={76}
    detail={<>재능도 전략도,<br />지속되지 않으면 사라진다</>}
    tags={[{ t: "지속", c: BLUE }, { t: "필요조건", c: MINT }, { t: "복리", c: LAV }]}
    a={BLUE}
    b={LAV}
  />
);

// ⑤ 마무리 — 정답이 아니라, 전제다
export const Closing: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <CardFrame a={MINT} b={YELLOW} bare={bare}>
    <Pill x={540} y={295} text="그러니 꾸준함은" color={LAV} delay={2} />
    <div style={{ ...centerText(425, 56, INK) }}>결국 이렇게 남는다</div>
    <ClayCard x={540} y={630} w={960} bg="#FFFFFF" delay={8} float={7} pad="26px 30px" radius={46}>
      <div style={{ fontFamily: FONT, fontSize: 66, color: MINT, lineHeight: 1.0, textAlign: "center", whiteSpace: "nowrap" }}>정답이 아니라, 전제다</div>
    </ClayCard>
    <div style={{ ...centerText(795, 44, "#5b5570", BODY), fontWeight: 700, lineHeight: 1.45 }}>방향을 정했다면,<br />남은 건 꾸준함뿐</div>
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
    <Sequence from={110} durationInFrames={110}><Fade d={110}><Foundation bare /></Fade></Sequence>
    <Sequence from={220} durationInFrames={110}><Fade d={110}><Caveat bare /></Fade></Sequence>
    <Sequence from={330} durationInFrames={110}><Fade d={110}><Necessity bare /></Fade></Sequence>
    <Sequence from={440} durationInFrames={115}><Fade d={115}><Closing bare /></Fade></Sequence>
  </>
);

export const SteadyVideo: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3EEFB" }}>
    <FontLoader />
    <ClayBG a={BLUE} b={MINT} />
    {scenes}
  </AbsoluteFill>
);

export const SteadyReels: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3EEFB" }}>
    <FontLoader />
    <ClayBG a={BLUE} b={MINT} />
    <div style={{ position: "absolute", left: 0, top: 285, width: 1080, height: 1350 }}>{scenes}</div>
  </AbsoluteFill>
);
