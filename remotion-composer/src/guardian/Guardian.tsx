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
// Soft 3D / claymorphism style. Topic: 나쁜 결과를 막은 '보이지 않는 노력'을
// 인정하자 — 좋은 결과(보이는 성과)만 보지 말고.
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
const GREY = "#B4ADC0";

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
  trophy: (
    <>
      <path d="M32 22 H68 V40 a18 18 0 0 1 -36 0 Z" fill="none" stroke="#fff" strokeWidth={7} strokeLinejoin="round" />
      <path d="M32 28 H21 a9 9 0 0 0 12 15" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
      <path d="M68 28 H79 a9 9 0 0 1 -12 15" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
      <path d="M50 58 V70 M40 80 H60 M45 70 H55" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  shield: (
    <>
      <path d="M50 15 L80 27 V49 C80 67 67 80 50 86 C33 80 20 67 20 49 V27 Z" fill="none" stroke="#fff" strokeWidth={7} strokeLinejoin="round" />
      <path d="M37 50 L47 60 L64 40" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  eyeoff: (
    <>
      <path d="M16 52 C30 32 70 32 84 52" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M40 58 a13 13 0 0 0 18 -16" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 30 L80 80" stroke="#fff" strokeWidth={7} strokeLinecap="round" />
    </>
  ),
  question: (
    <>
      <path d="M37 41 a13 13 0 1 1 20 11 c-5 3 -7 6 -7 13" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={50} cy={78} r={5} fill="#fff" />
    </>
  ),
  clap: (
    <>
      <path d="M40 30 L34 20 M52 26 L50 14 M64 30 L70 20" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
      <path d="M30 46 L46 38 q6 -3 9 3 l10 20 a16 16 0 0 1 -28 15 L22 62 q-4 -8 8 -16 Z" fill="none" stroke="#fff" strokeWidth={6.5} strokeLinejoin="round" />
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

// one contrast panel (bright = visible result / muted-dashed = unseen effort)
const Panel: React.FC<{ x: number; icon: string; iconColor: string; label: string; sub: string; muted?: boolean; delay: number }> = ({ x, icon, iconColor, label, sub, muted, delay }) => {
  const pop = usePop(delay);
  const fl = useFloat(7, 0.5, x);
  const wob = useWobble(1.3, 0.4, x);
  const w = 430;
  const h = 486;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 428,
        width: w,
        height: h,
        marginLeft: -w / 2,
        transform: `translateY(${fl + (1 - pop) * 34}px) rotate(${wob}deg) scale(${pop})`,
        background: muted ? "#ECE9F1" : "#FFFFFF",
        border: muted ? "3px dashed #C6C0D2" : "none",
        borderRadius: 44,
        boxShadow: muted ? clayShSm : claySh,
        opacity: pop > 0.05 ? 1 : 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
      }}
    >
      <div
        style={{
          width: 156,
          height: 156,
          background: muted ? GREY : iconColor,
          borderRadius: 48,
          boxShadow: muted ? clayShSm : claySh,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", inset: 0, borderRadius: 48, background: "linear-gradient(150deg, rgba(255,255,255,0.4), transparent 55%)" }} />
        <svg width={96} height={96} viewBox="0 0 100 100">{ICONS[icon]}</svg>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 54, color: muted ? "#9990a6" : INK }}>{label}</div>
      <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 38, color: muted ? "#ABA3B8" : iconColor }}>{sub}</div>
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
  <CardFrame a={MINT} b={BLUE} bare={bare}>
    <Pill x={540} y={230} text="보이지 않는 노력" color={LAV} delay={2} />
    <div style={{ ...centerText(360, 100, INK), ...shadow }}>아무 일도</div>
    <div style={{ ...centerText(505, 100, MINT), ...shadow }}>없었잖아?</div>
    <div style={{ ...centerText(700, 46, INK, BODY), fontWeight: 900 }}>그 '아무 일'을 지킨 사람이 있다</div>
    <Mascot x={540} y={1055} w={380} delay={4} floatAmp={16} />
    <div style={{ ...centerText(1290, 44, "#7a728e") }}>www.wylieax.com</div>
  </CardFrame>
);

// ② 문제 제기 — 대비 패널
export const Contrast: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <CardFrame a={BLUE} b={LAV} bare={bare}>
    <div style={{ ...centerText(215, 50, INK), fontFamily: BODY, fontWeight: 900 }}>우리가 박수를 보내는 곳</div>
    <Panel x={300} icon="trophy" iconColor={MINT} label="보이는 성과" sub="박수받는다" delay={8} />
    <Panel x={780} icon="shield" iconColor={GREY} label="막아낸 노력" sub="티도 안 난다" muted delay={16} />
    <div style={{ ...centerText(1010, 46, "#5b5570", BODY), fontWeight: 700 }}>결과만 눈에 들어온다</div>
    <Mascot x={168} y={1185} w={168} delay={26} floatAmp={10} />
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

// ③ 반전 — 사고가 없던 건 운이 아니라 막은 것
export const Turn: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <StatementCard
    bare={bare}
    icon="shield"
    lead="사고가 없던 건"
    big="운이 아니라, 막은 것"
    bigColor={MINT}
    bigSize={68}
    detail={<>조용히 리스크를 걷어낸<br />누군가가 있었다</>}
    tags={[{ t: "예방", c: MINT }, { t: "대비", c: BLUE }, { t: "궂은일", c: LAV }]}
    a={MINT}
    b={BLUE}
  />
);

// ④ 이유 — 잘 막을수록 티가 나지 않는다
export const Why: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <StatementCard
    bare={bare}
    icon="eyeoff"
    lead="잘 막을수록"
    big="티가 나지 않는다"
    bigColor={LAV}
    bigSize={76}
    detail={<>성공한 예방은 '아무 일 없음'으로 남아,<br />그 노력은 지워진다</>}
    tags={[{ t: "무사고", c: LAV }, { t: "조용함", c: BLUE }, { t: "저평가", c: CORAL }]}
    a={LAV}
    b={PINKR}
  />
);

// ⑤ 마무리 (B안) — 오늘 조용했다면, 누가 막아준 걸까?
export const Closing: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <CardFrame a={BLUE} b={MINT} bare={bare}>
    <Pill x={540} y={295} text="한번 돌아보기" color={LAV} delay={2} />
    <div style={{ ...centerText(425, 56, INK) }}>오늘 조용했다면,</div>
    <ClayCard x={540} y={630} w={940} bg="#FFFFFF" delay={8} float={7} pad="26px 34px" radius={46}>
      <div style={{ fontFamily: FONT, fontSize: 76, color: MINT, lineHeight: 1.0, textAlign: "center", whiteSpace: "nowrap" }}>누가 막아준 걸까?</div>
    </ClayCard>
    <div style={{ ...centerText(795, 44, "#5b5570", BODY), fontWeight: 700, lineHeight: 1.45 }}>아무 일 없던 하루도,<br />누군가의 노력이다</div>
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
    <Sequence from={110} durationInFrames={130}><Fade d={130}><Contrast bare /></Fade></Sequence>
    <Sequence from={240} durationInFrames={110}><Fade d={110}><Turn bare /></Fade></Sequence>
    <Sequence from={350} durationInFrames={110}><Fade d={110}><Why bare /></Fade></Sequence>
    <Sequence from={460} durationInFrames={115}><Fade d={115}><Closing bare /></Fade></Sequence>
  </>
);

export const GuardianVideo: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3EEFB" }}>
    <FontLoader />
    <ClayBG a={MINT} b={BLUE} />
    {scenes}
  </AbsoluteFill>
);

export const GuardianReels: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3EEFB" }}>
    <FontLoader />
    <ClayBG a={MINT} b={BLUE} />
    <div style={{ position: "absolute", left: 0, top: 285, width: 1080, height: 1350 }}>{scenes}</div>
  </AbsoluteFill>
);
