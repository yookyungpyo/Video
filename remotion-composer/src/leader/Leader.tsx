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
  compass: (
    <>
      <circle cx={50} cy={50} r={36} fill="none" stroke="#fff" strokeWidth={8} />
      <path d="M50 28 L60 50 L50 72 L40 50 Z" fill="#fff" />
      <circle cx={50} cy={50} r={5} fill="none" stroke={INK} strokeWidth={3} />
    </>
  ),
  wrench: (
    <>
      <path d="M66 22 a17 17 0 1 0 13 26 L41 86 a10 10 0 0 1-15-15 L64 33 a17 17 0 0 1 2-11 Z" fill="none" stroke="#fff" strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
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
// Animated clay bar chart — rounded bars grow up (spring) with count-up label
// ---------------------------------------------------------------------------
type Bar = { label: string; value: number; color: string };
const ClayBars: React.FC<{
  data: Bar[];
  max: number;
  baseY: number;   // y of the baseline (bottom of bars)
  maxH: number;    // pixel height for a value == max
  startX: number;  // center x of first bar
  gap: number;     // center-to-center spacing
  barW: number;
  delay?: number;
}> = ({ data, max, baseY, maxH, startX, gap, barW, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      {/* baseline */}
      <div style={{ position: "absolute", left: startX - barW / 2 - 40, top: baseY, width: gap * (data.length - 1) + barW + 80, height: 10, background: "#E3DCEF", borderRadius: 999, boxShadow: clayShSm }} />
      {data.map((b, i) => {
        const g = spring({ frame: frame - delay - i * 8, fps, config: { damping: 12, stiffness: 120, mass: 1 } });
        const h = Math.max(6, (maxH * b.value) / max * g);
        const cx = startX + i * gap;
        const shown = Math.round(b.value * g);
        const wob = Math.sin((frame / fps) * 2 * Math.PI * 0.4 + i * 2) * 1.4;
        return (
          <div key={i}>
            {/* value label on top */}
            <div style={{ position: "absolute", left: cx, top: baseY - h - 92, width: 240, marginLeft: -120, textAlign: "center", fontFamily: FONT, fontSize: 72, color: b.color, opacity: g > 0.06 ? 1 : 0, textShadow: "2px 3px 0 rgba(120,110,160,0.12)" }}>
              {shown}<span style={{ fontSize: 40 }}>%</span>
            </div>
            {/* the bar */}
            <div style={{ position: "absolute", left: cx - barW / 2, top: baseY - h, width: barW, height: h, background: b.color, borderRadius: barW * 0.42, boxShadow: claySh, transform: `rotate(${wob * 0.15}deg)`, opacity: g > 0.04 ? 1 : 0 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: barW * 0.42, background: "linear-gradient(150deg, rgba(255,255,255,0.5), transparent 50%)" }} />
            </div>
            {/* label under baseline */}
            <div style={{ position: "absolute", left: cx, top: baseY + 28, width: 300, marginLeft: -150, textAlign: "center", fontFamily: FONT, fontSize: 60, color: INK, opacity: g > 0.1 ? 1 : 0 }}>
              {b.label}
            </div>
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
// Scenes
// ---------------------------------------------------------------------------
const Hook: React.FC = () => {
  const t2 = usePop(8, true);
  const t3 = usePop(20, true);
  return (
    <AbsoluteFill>
      <Pill x={540} y={300} text="좋은 리더의 조건" color={LAV} delay={2} />
      <div
        style={{
          position: "absolute",
          top: 410,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 116,
          color: INK,
          lineHeight: 1.16,
          opacity: t2,
          transform: `scale(${0.9 + t2 * 0.1})`,
          textShadow: "3px 5px 0 rgba(120,110,160,0.12)",
        }}
      >
        리더는
      </div>
      <div
        style={{
          position: "absolute",
          top: 540,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 124,
          lineHeight: 1.16,
          opacity: t3,
          transform: `scale(${0.9 + t3 * 0.1})`,
          textShadow: "3px 5px 0 rgba(120,110,160,0.12)",
        }}
      >
        <span style={{ color: "#9b93ad" }}>How</span>
        <span style={{ color: INK }}>보다 </span>
        <span style={{ color: CORAL }}>Why</span>
      </div>
      <Pill x={540} y={760} text="무엇을 말해야 할까?" color={BLUE} delay={32} />
      <Mascot x={540} y={1280} w={440} delay={4} floatAmp={16} walk={{ fromX: -170, startFrame: 8, dur: 50, steps: 2 }} />
    </AbsoluteFill>
  );
};

const BarScene: React.FC = () => {
  const head = usePop(4, true);
  const cap = usePop(60, true);
  return (
    <AbsoluteFill>
      <Pill x={540} y={250} text="리더의 시간은 어디에?" color={LAV} delay={2} />
      <div
        style={{
          position: "absolute",
          top: 360,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 64,
          color: INK,
          opacity: head,
        }}
      >
        리더가 직접 쥐어야 할 몫
      </div>
      <ClayBars
        data={[
          { label: "WHY · 방향", value: 80, color: CORAL },
          { label: "HOW · 방법", value: 20, color: BLUE },
        ]}
        max={100}
        baseY={1330}
        maxH={620}
        startX={385}
        gap={310}
        barW={250}
        delay={14}
      />
      <div
        style={{
          position: "absolute",
          top: 1430,
          width: "100%",
          textAlign: "center",
          fontFamily: BODY,
          fontWeight: 900,
          fontSize: 52,
          color: CORAL,
          opacity: cap,
        }}
      >
        Why에 집중, How는 위임
      </div>
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
    <Mascot x={870} y={1430} w={230} delay={6} flip={flip} floatAmp={12} walk={{ fromX: 1280, startFrame: 22, dur: 42, steps: 2 }} />
  </AbsoluteFill>
);

const StepWhy: React.FC = () => (
  <Step num="W" word="WHY" accent={CORAL} sub="이유와 방향을 준다" insight="사람들이 스스로 움직인다" icon="compass"
    tags={[{ t: "목적", c: CORAL }, { t: "방향", c: YELLOW }, { t: "기준", c: MINT }]} />
);
const StepHow: React.FC = () => (
  <Step num="H" word="HOW" accent={BLUE} sub="방법은 맡긴다" insight="중간 리더와 각자의 몫" icon="wrench"
    tags={[{ t: "실행", c: BLUE }, { t: "디테일", c: LAV }, { t: "현장", c: MINT }]} flip />
);

const Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c1 = usePop(6, true);
  const foot = usePop(30, true);
  const flMasc = useFloat(10, 0.5, 9);
  const cards = [
    { t: "WHY = 리더", c: CORAL },
    { t: "HOW = 위임", c: BLUE },
  ];
  return (
    <AbsoluteFill>
      <Pill x={540} y={360} text="하나만 기억하세요" color={LAV} delay={2} />
      <ClayCard x={540} y={550} bg="#FFFFFF" delay={8} float={8} pad="28px 64px">
        <div style={{ fontFamily: FONT, fontSize: 104, lineHeight: 1.0, whiteSpace: "nowrap" }}>
          <span style={{ color: "#9b93ad" }}>How</span>
          <span style={{ color: INK }}>가 아니라 </span>
          <span style={{ color: CORAL }}>Why</span>
        </div>
      </ClayCard>
      {cards.map((c, i) => (
        <Pill key={i} x={360 + i * 360} y={730} text={c.t} color={c.c} delay={16 + i * 6} />
      ))}
      <div
        style={{
          position: "absolute",
          top: 880,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 64,
          color: INK,
          lineHeight: 1.32,
          opacity: c1,
        }}
      >
        <span style={{ color: CORAL }}>이유</span>를 주면,
        <br />
        <span style={{ color: BLUE }}>방법</span>은 따라온다
      </div>
      <Mascot x={540} y={1290} w={300} delay={4} floatAmp={14} walk={{ fromX: -160, startFrame: 14, dur: 46, steps: 2 }} />
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

export const Leader: React.FC = () => {
  const frame = useCurrentFrame();
  const pair =
    frame < 90 ? [LAV, BLUE] : frame < 220 ? [CORAL, YELLOW] : frame < 320 ? [CORAL, PINKR] : frame < 420 ? [BLUE, MINT] : [LAV, PINKR];
  return (
    <AbsoluteFill style={{ background: "#F3EEFB" }}>
      <FontLoader />
      <ClayBG a={pair[0]} b={pair[1]} />
      <AbsoluteFill style={{ transform: "translateY(-15px) scale(0.85)", transformOrigin: "center center" }}>
        <Sequence from={0} durationInFrames={90}><Fade d={90}><Hook /></Fade></Sequence>
        <Sequence from={90} durationInFrames={130}><Fade d={130}><BarScene /></Fade></Sequence>
        <Sequence from={220} durationInFrames={100}><Fade d={100}><StepWhy /></Fade></Sequence>
        <Sequence from={320} durationInFrames={100}><Fade d={100}><StepHow /></Fade></Sequence>
        <Sequence from={420} durationInFrames={110}><Fade d={110}><Close /></Fade></Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
