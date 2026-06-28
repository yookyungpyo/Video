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
  const pop = usePop(delay);
  const fl = useFloat(floatAmp + 8, 0.5, x);
  const tilt = useWobble(3.2, 0.5, x);
  // squash & stretch synced to the float (volume-preserving)
  const sq = Math.sin((useCurrentFrame() / useVideoConfig().fps) * 2 * Math.PI * 0.5 + x);
  const sx = 1 - sq * 0.04;
  const sy = 1 + sq * 0.04;
  const h = (w * 2400) / 1350;
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
// Scenes
// ---------------------------------------------------------------------------
const Hook: React.FC = () => {
  const t2 = usePop(8, true);
  const t3 = usePop(18, true);
  return (
    <AbsoluteFill>
      <Pill x={540} y={300} text="전부 다 중요하다고?" color={LAV} delay={2} />
      <div
        style={{
          position: "absolute",
          top: 420,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 110,
          color: INK,
          lineHeight: 1.18,
          opacity: t2,
          transform: `scale(${0.9 + t2 * 0.1})`,
          textShadow: "3px 5px 0 rgba(120,110,160,0.12)",
        }}
      >
        모든 게 중요하면
      </div>
      <div
        style={{
          position: "absolute",
          top: 560,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 92,
          color: CORAL,
          lineHeight: 1.18,
          opacity: t3,
          transform: `scale(${0.9 + t3 * 0.1})`,
          textShadow: "3px 5px 0 rgba(120,110,160,0.12)",
        }}
      >
        아무것도 중요하지 않다
      </div>
      <Pill x={540} y={760} text="그래서, 고르는 법" color={BLUE} delay={30} />
      <Mascot x={540} y={1280} w={440} delay={22} floatAmp={16} />
    </AbsoluteFill>
  );
};

const Step: React.FC<{
  num: string;
  word: string;
  accent: string;
  sub: string;
  insight: string;
  icon: string;
  tags: { t: string; c: string }[];
  flip?: boolean;
}> = ({ num, word, accent, sub, insight, icon, tags, flip }) => (
  <AbsoluteFill>
    <NumBubble x={235} y={415} n={num} color={accent} delay={2} />
    <ClayCard x={520} y={640} bg="#FFFFFF" delay={8} float={8} pad="34px 70px">
      <div style={{ fontFamily: FONT, fontSize: 150, color: INK, lineHeight: 1.0, whiteSpace: "nowrap" }}>{word}</div>
    </ClayCard>
    <ClayIcon x={880} y={560} kind={icon} color={accent} size={150} delay={16} />
    <div
      style={{
        position: "absolute",
        top: 880,
        width: "100%",
        textAlign: "center",
        fontFamily: FONT,
        fontSize: 66,
        color: INK,
        opacity: 1,
      }}
    >
      {sub}
    </div>
    <div
      style={{
        position: "absolute",
        top: 975,
        width: "100%",
        textAlign: "center",
        fontFamily: BODY,
        fontWeight: 900,
        fontSize: 46,
        color: accent,
      }}
    >
      {insight}
    </div>
    {tags.map((tg, i) => (
      <Pill key={i} x={300 + i * 240} y={1130} text={tg.t} color={tg.c} delay={24 + i * 5} />
    ))}
    <Mascot x={870} y={1430} w={230} delay={28} flip={flip} floatAmp={12} />
  </AbsoluteFill>
);

const Step1: React.FC = () => (
  <Step num="1" word="우선순위" accent={BLUE} sub="딱 하나만 정한다" insight="가장 중요한 1가지부터" icon="target"
    tags={[{ t: "목표", c: BLUE }, { t: "기준", c: YELLOW }, { t: "정렬", c: MINT }]} />
);
const Step2: React.FC = () => (
  <Step num="2" word="버리기" accent={CORAL} sub="안 할 것을 정한다" insight="우선순위 = 거절의 기술" icon="trash"
    tags={[{ t: "거절", c: CORAL }, { t: "삭제", c: BLUE }, { t: "미루기", c: LAV }]} flip />
);
const Step3: React.FC = () => (
  <Step num="3" word="몰입" accent={MINT} sub="하나에 에너지를 모은다" insight="분산은 약함, 집중은 힘" icon="converge"
    tags={[{ t: "딥워크", c: MINT }, { t: "반복", c: BLUE }, { t: "완성", c: PINKR }]} />
);

const Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c1 = usePop(6, true);
  const foot = usePop(30, true);
  const flMasc = useFloat(10, 0.5, 9);
  const cards = [
    { t: "우선순위", c: BLUE },
    { t: "버리기", c: CORAL },
    { t: "몰입", c: MINT },
  ];
  return (
    <AbsoluteFill>
      <Pill x={540} y={360} text="딱 하나만 기억하세요" color={LAV} delay={2} />
      <ClayCard x={540} y={540} bg="#FFFFFF" delay={8} float={8} pad="28px 70px">
        <div style={{ fontFamily: FONT, fontSize: 130, color: CORAL, lineHeight: 1.0, whiteSpace: "nowrap" }}>선택과 집중</div>
      </ClayCard>
      {cards.map((c, i) => (
        <Pill key={i} x={300 + i * 240} y={730} text={c.t} color={c.c} delay={16 + i * 5} />
      ))}
      <div
        style={{
          position: "absolute",
          top: 880,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 62,
          color: INK,
          lineHeight: 1.32,
          opacity: c1,
        }}
      >
        <span style={{ color: BLUE }}>'다 하겠다'</span>는
        <br />
        <span style={{ color: CORAL }}>'아무것도 안 하겠다'</span>와 같다
      </div>
      <Mascot x={540} y={1290} w={300} delay={20} floatAmp={14} />
      <div
        style={{
          position: "absolute",
          bottom: 175,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 60,
          color: "#7a728e",
          opacity: foot,
        }}
      >
        www.wylieax.com
      </div>
    </AbsoluteFill>
  );
};

// pop-in cross-fade (each scene springs in + slides up)
const Fade: React.FC<{ d: number; children: React.ReactNode }> = ({ d, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, 8, d - 8, d], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ent = spring({ frame, fps, config: { damping: 13, stiffness: 110, mass: 1 } });
  const out = interpolate(frame, [d - 10, d], [0, 18], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity, transform: `translateY(${(1 - ent) * 34 - out}px) scale(${0.93 + ent * 0.07})` }}>
      {children}
    </AbsoluteFill>
  );
};

export const Clay: React.FC = () => {
  const frame = useCurrentFrame();
  const pair =
    frame < 95 ? [LAV, BLUE] : frame < 200 ? [BLUE, MINT] : frame < 305 ? [CORAL, YELLOW] : frame < 410 ? [MINT, BLUE] : [LAV, PINKR];
  return (
    <AbsoluteFill style={{ background: "#F3EEFB" }}>
      <FontLoader />
      <ClayBG a={pair[0]} b={pair[1]} />
      <AbsoluteFill style={{ transform: "translateY(-15px) scale(0.85)", transformOrigin: "center center" }}>
        <Sequence from={0} durationInFrames={95}><Fade d={95}><Hook /></Fade></Sequence>
        <Sequence from={95} durationInFrames={105}><Fade d={105}><Step1 /></Fade></Sequence>
        <Sequence from={200} durationInFrames={105}><Fade d={105}><Step2 /></Fade></Sequence>
        <Sequence from={305} durationInFrames={105}><Fade d={105}><Step3 /></Fade></Sequence>
        <Sequence from={410} durationInFrames={100}><Fade d={100}><Close /></Fade></Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
