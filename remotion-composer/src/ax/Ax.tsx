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
  funnel: (
    <>
      <path d="M20 26 L80 26 L56 56 L56 82 L44 74 L44 56 Z" fill="none" stroke="#fff" strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
    </>
  ),
  grid: (
    <>
      <rect x={22} y={22} width={22} height={22} rx={5} fill="none" stroke="#fff" strokeWidth={7} />
      <rect x={56} y={22} width={22} height={22} rx={5} fill="none" stroke="#fff" strokeWidth={7} />
      <rect x={22} y={56} width={22} height={22} rx={5} fill="none" stroke="#fff" strokeWidth={7} />
      <rect x={56} y={56} width={22} height={22} rx={5} fill="#fff" />
    </>
  ),
  sun: (
    <>
      <circle cx={50} cy={50} r={18} fill="#fff" />
      <g stroke="#fff" strokeWidth={7} strokeLinecap="round">
        <path d="M50 14 L50 24" /><path d="M50 76 L50 86" />
        <path d="M14 50 L24 50" /><path d="M76 50 L86 50" />
        <path d="M25 25 L32 32" /><path d="M68 68 L75 75" />
        <path d="M75 25 L68 32" /><path d="M32 68 L25 75" />
      </g>
    </>
  ),
  heart: (
    <>
      <path d="M50 82 C20 60 14 42 24 32 a13 13 0 0 1 26 2 a13 13 0 0 1 26 -2 C86 42 80 60 50 82 Z" fill="#fff" />
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
// `bare` renders content transparent (no own bg/FontLoader/ClayBG) so the video
// can crossfade cards over ONE shared background — avoids brightness flicker.
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

export const Cover: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <CardFrame a={CORAL} b={YELLOW} bare={bare}>
    <Pill x={540} y={230} text="AX 전환 · 조직" color={LAV} delay={2} />
    <div style={{ ...centerText(360, 150, INK), textShadow: "3px 6px 0 rgba(120,110,160,0.12)" }}>1 : 9 : 90</div>
    <div style={{ ...centerText(530, 96, CORAL), textShadow: "3px 6px 0 rgba(120,110,160,0.12)" }}>법칙</div>
    <div style={{ ...centerText(680, 48, INK, BODY), fontWeight: 900 }}>AX 전환, 내부 인원도 이렇게 갈린다</div>
    <Mascot x={540} y={1035} w={380} delay={4} floatAmp={16} />
    <div style={{ ...centerText(1290, 44, "#7a728e") }}>www.wylieax.com</div>
  </CardFrame>
);

// One pyramid tier — a clay band (wider = larger share), centered
const PyTier: React.FC<{ top: number; w: number; h: number; color: string; big: string; sub: string; bigSize: number; delay: number }> = ({ top, w, h, color, big, sub, bigSize, delay }) => {
  const pop = usePop(delay);
  const fl = useFloat(4, 0.5, top);
  return (
    <div
      style={{
        position: "absolute", left: 540, top, width: w, height: h, marginLeft: -w / 2,
        transform: `translateY(${fl + (1 - pop) * 30}px) scale(${pop})`,
        background: color, borderRadius: 34, boxShadow: claySh,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        opacity: pop > 0.05 ? 1 : 0,
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: 34, background: "linear-gradient(150deg, rgba(255,255,255,0.42), transparent 55%)" }} />
      <div style={{ fontFamily: FONT, fontSize: bigSize, color: "#fff", lineHeight: 1.0, textShadow: "0 3px 6px rgba(0,0,0,0.12)" }}>{big}</div>
      <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 30, color: "rgba(255,255,255,0.94)", marginTop: 8 }}>{sub}</div>
    </div>
  );
};

export const Pyramid: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <CardFrame a={LAV} b={BLUE} bare={bare}>
    <div style={{ ...centerText(205, 48, INK), fontFamily: BODY, fontWeight: 900 }}>AX 시대, 내부 인원은 이렇게 나뉜다</div>
    <PyTier top={330} w={440} h={150} color={CORAL} big="1% 선도자" sub="AI로 만들고 이끈다" bigSize={50} delay={6} />
    <PyTier top={502} w={650} h={168} color={BLUE} big="9% 확산자" sub="적극 활용하고 전파한다" bigSize={54} delay={12} />
    <PyTier top={692} w={900} h={200} color={MINT} big="90% 관망자" sub="지켜보며 따라간다" bigSize={60} delay={18} />
    <Mascot x={895} y={1150} w={160} delay={22} floatAmp={10} />
    <div style={{ ...centerText(1295, 42, "#7a728e") }}>www.wylieax.com</div>
  </CardFrame>
);

const StatementCard: React.FC<{
  icon: string;
  lead: string;
  big: string;
  bigColor: string;
  detail: React.ReactNode;
  tags: { t: string; c: string }[];
  a: string;
  b: string;
  bare?: boolean;
}> = ({ icon, lead, big, bigColor, detail, tags, a, b, bare }) => (
  <CardFrame a={a} b={b} bare={bare}>
    <ClayIcon x={540} y={250} kind={icon} color={bigColor} size={150} delay={8} />
    <div style={{ ...centerText(425, 56, INK) }}>{lead}</div>
    <ClayCard x={540} y={615} w={960} bg="#FFFFFF" delay={6} float={6} pad="30px 36px" radius={46}>
      <div style={{ fontFamily: FONT, fontSize: 80, color: bigColor, lineHeight: 1.05, textAlign: "center", whiteSpace: "nowrap" }}>{big}</div>
    </ClayCard>
    <div style={{ ...centerText(790, 44, "#5b5570", BODY), fontWeight: 700, lineHeight: 1.45 }}>{detail}</div>
    {tags.map((tg, i) => (
      <Pill key={i} x={306 + i * 234} y={1000} text={tg.t} color={tg.c} delay={20 + i * 5} />
    ))}
    <Mascot x={888} y={1215} w={200} delay={8} floatAmp={11} />
  </CardFrame>
);

export const Mistake: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <StatementCard
    bare={bare}
    icon="mask"
    lead="리더의 흔한 실수"
    big="90%를 다 바꾸려 한다"
    bigColor={CORAL}
    detail={<>하지만 90%는<br />설득만으로 움직이지 않는다</>}
    tags={[{ t: "전사교육", c: CORAL }, { t: "일괄지시", c: BLUE }, { t: "과부하", c: LAV }]}
    a={CORAL}
    b={YELLOW}
  />
);

export const Leverage: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <StatementCard
    bare={bare}
    icon="converge"
    lead="판을 바꾸는 건"
    big="1%와 9%"
    bigColor={BLUE}
    detail={<>1%에 투자하고 9%를 키우면<br />90%는 자연히 따라온다</>}
    tags={[{ t: "핵심인재", c: BLUE }, { t: "얼리어답터", c: MINT }, { t: "확산", c: LAV }]}
    a={BLUE}
    b={MINT}
  />
);

export const Closing: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <CardFrame a={CORAL} b={YELLOW} bare={bare}>
    <Pill x={540} y={300} text="기억하세요" color={LAV} delay={2} />
    <div style={{ ...centerText(430, 58, INK) }}>다수가 아니라,</div>
    <ClayCard x={540} y={630} w={900} bg="#FFFFFF" delay={8} float={7} pad="26px 40px" radius={46}>
      <div style={{ fontFamily: FONT, fontSize: 82, color: CORAL, lineHeight: 1.0, textAlign: "center", whiteSpace: "nowrap" }}>소수에 투자하라</div>
    </ClayCard>
    <div style={{ ...centerText(795, 44, "#5b5570", BODY), fontWeight: 700 }}>AX는 90%가 아니라, 1%를 키우는 일</div>
    <Mascot x={540} y={1055} w={280} delay={6} floatAmp={14} />
    <div style={{ ...centerText(1300, 42, "#7a728e") }}>www.wylieax.com</div>
  </CardFrame>
);

// ---------------------------------------------------------------------------
// Video — non-overlapping fade-through over one shared background (no 겹침)
// ---------------------------------------------------------------------------
// Hard cut, no scene-level opacity fade → the shared background never dims, so
// there is no full-screen blink ("깜박임"). Content enters via each card's own
// per-element pop-in (usePop). Scenes are non-overlapping, so no 겹침 either.
const Fade: React.FC<{ d: number; children: React.ReactNode }> = ({ d, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ent = spring({ frame, fps, config: { damping: 16, stiffness: 120, mass: 1 } });
  return <AbsoluteFill style={{ transform: `scale(${0.985 + ent * 0.015})` }}>{children}</AbsoluteFill>;
};

export const AxVideo: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3EEFB" }}>
    <FontLoader />
    <ClayBG a={CORAL} b={BLUE} />
    <Sequence from={0} durationInFrames={110}><Fade d={110}><Cover bare /></Fade></Sequence>
    <Sequence from={110} durationInFrames={125}><Fade d={125}><Pyramid bare /></Fade></Sequence>
    <Sequence from={235} durationInFrames={110}><Fade d={110}><Mistake bare /></Fade></Sequence>
    <Sequence from={345} durationInFrames={110}><Fade d={110}><Leverage bare /></Fade></Sequence>
    <Sequence from={455} durationInFrames={115}><Fade d={115}><Closing bare /></Fade></Sequence>
  </AbsoluteFill>
);

// Native 9:16 Reel (1080x1920): ONE full-frame ClayBG + the same non-overlapping
// bare cards, vertically centered. No blurred-pad background (that duplicated the
// card content top/bottom = "겹침"). This is the correct way to make a 9:16 reel.
export const AxReels: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3EEFB" }}>
    <FontLoader />
    <ClayBG a={CORAL} b={BLUE} />
    <div style={{ position: "absolute", left: 0, top: 285, width: 1080, height: 1350 }}>
      <Sequence from={0} durationInFrames={110}><Fade d={110}><Cover bare /></Fade></Sequence>
      <Sequence from={110} durationInFrames={125}><Fade d={125}><Pyramid bare /></Fade></Sequence>
      <Sequence from={235} durationInFrames={110}><Fade d={110}><Mistake bare /></Fade></Sequence>
      <Sequence from={345} durationInFrames={110}><Fade d={110}><Leverage bare /></Fade></Sequence>
      <Sequence from={455} durationInFrames={115}><Fade d={115}><Closing bare /></Fade></Sequence>
    </div>
  </AbsoluteFill>
);
