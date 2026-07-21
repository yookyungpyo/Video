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
// gentle floating motion. The 3D plush mascot is the host.
// Topic: AX 전환의 진짜 병목 — 9명이 AI를 써도, 안 쓰는 1명이 팀 속도를 결정한다.
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
  clock: (
    <>
      <circle cx={50} cy={50} r={34} fill="none" stroke="#fff" strokeWidth={8} />
      <path d="M50 30 L50 50 L66 60" fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  link: (
    <>
      <rect x={18} y={38} width={42} height={24} rx={12} fill="none" stroke="#fff" strokeWidth={8} />
      <rect x={40} y={38} width={42} height={24} rx={12} fill="none" stroke="#fff" strokeWidth={8} />
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
  eye: (
    <>
      <path d="M14 50 C30 26 70 26 86 50 C70 74 30 74 14 50 Z" fill="none" stroke="#fff" strokeWidth={8} strokeLinejoin="round" />
      <circle cx={50} cy={50} r={13} fill="#fff" />
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

// A single clay dot in the 10-person grid (check = uses AI, x = doesn't)
const Dot: React.FC<{ cx: number; cy: number; color: string; mark: "check" | "x"; delay: number; pulse?: boolean }> = ({ cx, cy, color, mark, delay, pulse }) => {
  const pop = usePop(delay);
  const fl = useFloat(6, 0.55, cx);
  const brRaw = useBreathe(0.05, 1.1, cx);
  const br = pulse ? brRaw : 1;
  const size = 120;
  return (
    <div
      style={{
        position: "absolute",
        left: cx,
        top: cy,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        transform: `translateY(${fl + (1 - pop) * 24}px) scale(${pop * br})`,
        background: color,
        borderRadius: "50%",
        boxShadow: pulse ? "0 0 0 8px rgba(255,142,114,0.20), " + claySh : claySh,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: pop > 0.05 ? 1 : 0,
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "linear-gradient(150deg, rgba(255,255,255,0.5), transparent 55%)" }} />
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 100 100">
        {mark === "check" ? (
          <path d="M24 52 L44 72 L78 30" fill="none" stroke="#fff" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <path d="M32 32 L68 68" stroke="#fff" strokeWidth={13} strokeLinecap="round" />
            <path d="M68 32 L32 68" stroke="#fff" strokeWidth={13} strokeLinecap="round" />
          </>
        )}
      </svg>
    </div>
  );
};

const DotGrid: React.FC = () => {
  const cols = 5;
  const gapX = 175;
  const gapY = 178;
  const startX = 540 - ((cols - 1) * gapX) / 2; // 190
  const startY = 555;
  const dots = [];
  for (let i = 0; i < 10; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const isRed = i === 9;
    dots.push(
      <Dot key={i} cx={startX + c * gapX} cy={startY + r * gapY} color={isRed ? CORAL : MINT} mark={isRed ? "x" : "check"} delay={6 + i * 3} pulse={isRed} />
    );
  }
  return <>{dots}</>;
};

// ---------------------------------------------------------------------------
// Instagram card-news (1080x1350, each rendered as a still)
// ---------------------------------------------------------------------------
// `bare` renders content transparent (no own bg/FontLoader/ClayBG) so the video
// can hard-cut cards over ONE shared background — avoids 겹침 & 깜박임.
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
    <Pill x={540} y={230} text="AX 전환 · 병목" color={LAV} delay={2} />
    <div style={{ ...centerText(350, 104, INK), ...shadow }}>9명이 써도</div>
    <div style={{ ...centerText(500, 112, CORAL), ...shadow }}>1명이 안 쓰면</div>
    <div style={{ ...centerText(700, 46, INK, BODY), fontWeight: 900 }}>AX 전환의 진짜 병목</div>
    <Mascot x={540} y={1055} w={380} delay={4} floatAmp={16} />
    <div style={{ ...centerText(1290, 44, "#7a728e") }}>www.wylieax.com</div>
  </CardFrame>
);

// ② 문제 제기 — 10-dot grid (9 green + 1 red)
export const Problem: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <CardFrame a={MINT} b={YELLOW} bare={bare}>
    <div style={{ ...centerText(205, 52, INK), fontFamily: BODY, fontWeight: 900 }}>10명 조직, AI 도입률 90%</div>
    <DotGrid />
    <Pill x={890} y={860} text="안 쓰는 1명" color={CORAL} delay={30} />
    <div style={{ ...centerText(995, 46, "#5b5570", BODY), fontWeight: 700 }}>숫자만 보면, 성공처럼 보인다</div>
    <Mascot x={168} y={1170} w={175} delay={30} floatAmp={10} />
    <div style={{ ...centerText(1295, 42, "#7a728e") }}>www.wylieax.com</div>
  </CardFrame>
);

// generic statement card (icon + lead + big word + detail + tags + mascot)
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

// ③ 반전 — 팀 속도는 가장 느린 1명에 맞춰진다
export const Reversal: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <StatementCard
    bare={bare}
    icon="clock"
    lead="하지만 팀의 속도는"
    big="가장 느린 1명에 맞춰진다"
    bigColor={CORAL}
    bigSize={64}
    detail={<>협업·인수인계·의사결정이<br />그 1명을 거치는 순간, 9명이 멈춘다</>}
    tags={[{ t: "병목", c: CORAL }, { t: "인수인계", c: BLUE }, { t: "대기", c: LAV }]}
    a={CORAL}
    b={YELLOW}
  />
);

// ④ 이유 — 속도는 평균이 아니라 최저
export const Reason: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <StatementCard
    bare={bare}
    icon="link"
    lead="일은 혼자 하지 않는다"
    big="'평균'이 아니라 '최저'"
    bigColor={BLUE}
    bigSize={70}
    detail={<>파이프라인은<br />가장 느린 구간의 속도로 흐른다</>}
    tags={[{ t: "최약링크", c: BLUE }, { t: "연결", c: MINT }, { t: "리듬", c: LAV }]}
    a={BLUE}
    b={LAV}
  />
);

// ⑤ 마무리 (B안) — 도입률이 아니라 가장 느린 사람을 보라
export const Closing: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <CardFrame a={MINT} b={BLUE} bare={bare}>
    <Pill x={540} y={295} text="전환의 완성" color={LAV} delay={2} />
    <div style={{ ...centerText(425, 56, INK) }}>도입률을 보지 말고,</div>
    <ClayCard x={540} y={630} w={940} bg="#FFFFFF" delay={8} float={7} pad="26px 36px" radius={46}>
      <div style={{ fontFamily: FONT, fontSize: 78, color: BLUE, lineHeight: 1.0, textAlign: "center", whiteSpace: "nowrap" }}>가장 느린 사람을 보라</div>
    </ClayCard>
    <div style={{ ...centerText(790, 42, "#5b5570", BODY), fontWeight: 700, lineHeight: 1.45 }}>전환의 완성은 평균이 아니라,<br />최저점에서 결정된다</div>
    <Mascot x={540} y={1075} w={270} delay={6} floatAmp={14} />
    <div style={{ ...centerText(1300, 42, "#7a728e") }}>www.wylieax.com</div>
  </CardFrame>
);

// ---------------------------------------------------------------------------
// Video — HARD CUT over ONE shared background (no 겹침, no 깜박임)
// ---------------------------------------------------------------------------
// No scene-level opacity fade → the shared ClayBG never dims (no blink). Content
// enters via each card's own per-element usePop. Scenes are non-overlapping.
const Fade: React.FC<{ d: number; children: React.ReactNode }> = ({ d, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ent = spring({ frame, fps, config: { damping: 16, stiffness: 120, mass: 1 } });
  return <AbsoluteFill style={{ transform: `scale(${0.985 + ent * 0.015})` }}>{children}</AbsoluteFill>;
};

const scenes = (
  <>
    <Sequence from={0} durationInFrames={110}><Fade d={110}><Cover bare /></Fade></Sequence>
    <Sequence from={110} durationInFrames={130}><Fade d={130}><Problem bare /></Fade></Sequence>
    <Sequence from={240} durationInFrames={110}><Fade d={110}><Reversal bare /></Fade></Sequence>
    <Sequence from={350} durationInFrames={110}><Fade d={110}><Reason bare /></Fade></Sequence>
    <Sequence from={460} durationInFrames={115}><Fade d={115}><Closing bare /></Fade></Sequence>
  </>
);

export const BottleneckVideo: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3EEFB" }}>
    <FontLoader />
    <ClayBG a={BLUE} b={CORAL} />
    {scenes}
  </AbsoluteFill>
);

// Native 9:16 Reel (1080x1920): ONE full-frame ClayBG + the same non-overlapping
// bare cards, vertically centered (top:285). NEVER blur-pad the 4:5 up to 9:16.
export const BottleneckReels: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3EEFB" }}>
    <FontLoader />
    <ClayBG a={BLUE} b={CORAL} />
    <div style={{ position: "absolute", left: 0, top: 285, width: 1080, height: 1350 }}>{scenes}</div>
  </AbsoluteFill>
);
