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
// Collage / cut-out stop-motion style — paper, halftone, washi tape, marker
// doodles, bold display type. Topic: what people spend money on.
// ---------------------------------------------------------------------------
const DISPLAY = "Black Han Sans"; // heavy Korean display
const HAND = "Gaegu"; // marker handwriting
const BODY = "Noto Sans KR";
const ANTON = "Anton"; // latin numerals

const PAPER = "#F1E7D2";
const INK = "#211C16";
const PINK = "#FF2E7E";
const RED = "#E8442E";
const BLUE = "#2F6BD8";
const YELLOW = "#FFC83D";
const GREEN = "#1FA06A";

const MASCOT = staticFile("brand/mascot.png");

const fontCss = `
@font-face{font-family:'${DISPLAY}';font-weight:400;src:url('${staticFile("fonts/black-han-sans-korean-400-normal.woff2")}') format('woff2');}
@font-face{font-family:'${HAND}';font-weight:400;src:url('${staticFile("fonts/gaegu-korean-400-normal.woff2")}') format('woff2');}
@font-face{font-family:'${HAND}';font-weight:700;src:url('${staticFile("fonts/gaegu-korean-700-normal.woff2")}') format('woff2');}
@font-face{font-family:'${BODY}';font-weight:700;src:url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2');}
@font-face{font-family:'${BODY}';font-weight:900;src:url('${staticFile("fonts/noto-sans-kr-korean-900-normal.woff2")}') format('woff2');}
@font-face{font-family:'${ANTON}';font-weight:400;src:url('${staticFile("fonts/anton-latin-400-normal.woff2")}') format('woff2');}
`;

const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const done = () => continueRender(handle);
    Promise.all([
      (document as any).fonts.load(`400 80px "${DISPLAY}"`, "돈"),
      (document as any).fonts.load(`700 80px "${HAND}"`, "돈"),
      (document as any).fonts.load(`900 80px "${BODY}"`, "돈"),
      (document as any).fonts.load(`400 80px "${ANTON}"`, "01"),
    ]).then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [handle]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

const rand = (i: number, s: number) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// stop-motion jitter — re-rolls a small offset every few frames (~7fps feel)
const useStep = (seed: number, amp = 5, rotAmp = 1.6, step = 4) => {
  const frame = useCurrentFrame();
  const k = Math.floor(frame / step);
  return {
    jx: (rand(seed, k) - 0.5) * amp,
    jy: (rand(seed + 7, k) - 0.5) * amp,
    jr: (rand(seed + 13, k) - 0.5) * rotAmp,
  };
};

// snappy stop-motion pop-in
const usePop = (delay: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 11, stiffness: 220, mass: 0.6 } });
};

// jagged "torn paper" polygon
const tornPath = (seed: number, jag = 2.4) => {
  const pts: string[] = [];
  const steps = 9;
  for (let i = 0; i <= steps; i++) pts.push(`${(i / steps) * 100}% ${rand(seed, i) * jag}%`);
  for (let i = 0; i <= steps; i++) pts.push(`${100 - rand(seed + 1, i) * jag}% ${(i / steps) * 100}%`);
  for (let i = 0; i <= steps; i++) pts.push(`${100 - (i / steps) * 100}% ${100 - rand(seed + 2, i) * jag}%`);
  for (let i = 0; i <= steps; i++) pts.push(`${rand(seed + 3, i) * jag}% ${100 - (i / steps) * 100}%`);
  return `polygon(${pts.join(",")})`;
};

// ---------------------------------------------------------------------------
// Collage primitives
// ---------------------------------------------------------------------------
const Halftone: React.FC<{ color?: string; size?: number; opacity?: number }> = ({
  color = "rgba(0,0,0,0.16)",
  size = 15,
  opacity = 1,
}) => (
  <AbsoluteFill
    style={{
      opacity,
      backgroundImage: `radial-gradient(${color} 1.6px, transparent 1.7px)`,
      backgroundSize: `${size}px ${size}px`,
    }}
  />
);

const Grain: React.FC = () => (
  <AbsoluteFill style={{ opacity: 0.06, mixBlendMode: "multiply" }}>
    <svg width="100%" height="100%">
      <filter id="gr">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#gr)" />
    </svg>
  </AbsoluteFill>
);

const PaperBG: React.FC = () => (
  <AbsoluteFill style={{ background: PAPER }}>
    <Halftone color="rgba(120,90,60,0.10)" size={16} />
    <Grain />
    <AbsoluteFill
      style={{ background: "radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0) 55%, rgba(60,40,20,0.18) 100%)" }}
    />
  </AbsoluteFill>
);

const Tape: React.FC<{ x: number; y: number; w?: number; rot?: number; color?: string }> = ({
  x,
  y,
  w = 150,
  rot = -8,
  color = "rgba(255,210,90,0.55)",
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: 46,
      background: color,
      transform: `translate(-50%,-50%) rotate(${rot}deg)`,
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)",
      backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0 6px, transparent 6px 12px)",
    }}
  />
);

// colored torn card holding content
const Card: React.FC<{
  x: number;
  y: number;
  rot?: number;
  bg?: string;
  pad?: string;
  seed?: number;
  delay?: number;
  children: React.ReactNode;
  shadow?: boolean;
}> = ({ x, y, rot = 0, bg = "#fff", pad = "26px 40px", seed = 1, delay = 0, children, shadow = true }) => {
  const pop = usePop(delay);
  const { jr } = useStep(seed, 0, 1.1, 5);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot + jr}deg) scale(${pop})`,
        background: bg,
        padding: pad,
        clipPath: tornPath(seed),
        boxShadow: shadow ? "8px 12px 0 rgba(33,28,22,0.18)" : "none",
        opacity: pop > 0.05 ? 1 : 0,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
};

// a flat torn colored paper block (layered behind cards / for color pops)
const ColorBlock: React.FC<{ x: number; y: number; w: number; h: number; color: string; rot?: number; seed?: number; delay?: number; halftone?: boolean }> = ({
  x,
  y,
  w,
  h,
  color,
  rot = 0,
  seed = 5,
  delay = 0,
  halftone = false,
}) => {
  const pop = usePop(delay);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${pop})`,
        background: color,
        clipPath: tornPath(seed, 3),
        overflow: "hidden",
        opacity: pop > 0.05 ? 1 : 0,
      }}
    >
      {halftone && <Halftone color="rgba(0,0,0,0.18)" size={13} />}
    </div>
  );
};

// a few scattered marker dots/dashes
const Specks: React.FC<{ seed: number; color: string; n?: number; box?: [number, number, number, number]; delay?: number }> = ({
  seed,
  color,
  n = 6,
  box = [120, 300, 960, 1500],
  delay = 0,
}) => {
  const pop = usePop(delay);
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const x = box[0] + rand(seed + i, 1) * (box[2] - box[0]);
        const y = box[1] + rand(seed + i, 2) * (box[3] - box[1]);
        const r = 6 + rand(seed + i, 3) * 10;
        const dash = rand(seed + i, 4) > 0.5;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: dash ? r * 2.6 : r,
              height: r,
              borderRadius: dash ? 8 : "50%",
              background: color,
              opacity: pop * 0.9,
              transform: `rotate(${(rand(seed + i, 5) - 0.5) * 90}deg)`,
            }}
          />
        );
      })}
    </>
  );
};

// marker doodles -----------------------------------------------------------
const ScribbleCircle: React.FC<{ x: number; y: number; w: number; h: number; color?: string; delay?: number }> = ({
  x,
  y,
  w,
  h,
  color = PINK,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const len = 2 * Math.PI * ((w + h) / 4);
  return (
    <svg
      style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", overflow: "visible" }}
      width={w}
      height={h}
    >
      <path
        d={`M ${w * 0.5} ${h * 0.04} C ${w * 1.05} ${h * 0.05}, ${w * 1.02} ${h * 0.98}, ${w * 0.45} ${h * 0.95} C ${-w * 0.06} ${h * 0.92}, ${w * 0.0} ${h * 0.08}, ${w * 0.6} ${h * 0.08}`}
        fill="none"
        stroke={color}
        strokeWidth={9}
        strokeLinecap="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - draw)}
      />
    </svg>
  );
};

const Underline: React.FC<{ x: number; y: number; w: number; color?: string; delay?: number }> = ({
  x,
  y,
  w,
  color = PINK,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", overflow: "visible" }} width={w} height={26}>
      <path
        d={`M 4 16 C ${w * 0.3} 6, ${w * 0.55} 24, ${w - 6} 12`}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={w}
        strokeDashoffset={w * (1 - draw)}
      />
    </svg>
  );
};

const Sparkle: React.FC<{ x: number; y: number; s?: number; color?: string; delay?: number }> = ({
  x,
  y,
  s = 40,
  color = YELLOW,
  delay = 0,
}) => {
  const pop = usePop(delay);
  return (
    <svg style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${pop})`, overflow: "visible" }} width={s} height={s}>
      <path d={`M ${s / 2} 0 L ${s * 0.6} ${s * 0.4} L ${s} ${s / 2} L ${s * 0.6} ${s * 0.6} L ${s / 2} ${s} L ${s * 0.4} ${s * 0.6} L 0 ${s / 2} L ${s * 0.4} ${s * 0.4} Z`} fill={color} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    </svg>
  );
};

const ArrowUp: React.FC<{ x: number; y: number; h?: number; color?: string; delay?: number }> = ({ x, y, h = 90, color = GREEN, delay = 0 }) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", overflow: "visible" }} width={50} height={h}>
      <path d={`M 25 ${h} C 18 ${h * 0.6}, 32 ${h * 0.4}, 25 8`} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" strokeDasharray={h} strokeDashoffset={h * (1 - draw)} />
      <path d={`M 8 26 L 25 6 L 42 26`} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" opacity={draw > 0.9 ? 1 : 0} />
    </svg>
  );
};

const MascotCut: React.FC<{ x: number; y: number; w: number; rot?: number; delay?: number; flip?: boolean }> = ({
  x,
  y,
  w,
  rot = -4,
  delay = 0,
  flip = false,
}) => {
  const pop = usePop(delay);
  const { jr } = useStep(Math.round(x), 0, 1.2, 5);
  const h = (w * 2400) / 1350;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot + jr}deg) scale(${pop})`,
        background: "#fff",
        padding: "16px 16px 26px",
        boxShadow: "8px 12px 0 rgba(33,28,22,0.2)",
        clipPath: tornPath(99, 1.6),
      }}
    >
      <Tape x={w * 0.5 + 16} y={6} w={120} rot={6} color="rgba(255,46,126,0.5)" />
      <div style={{ width: w, height: h, transform: flip ? "scaleX(-1)" : "none" }}>
        <Img src={MASCOT} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
    </div>
  );
};

const BigWord: React.FC<{ x: number; y: number; text: string; size: number; color?: string; rot?: number; delay?: number; seed?: number }> = ({
  x,
  y,
  text,
  size,
  color = INK,
  rot = -2,
  delay = 0,
  seed = 3,
}) => {
  const pop = usePop(delay);
  const { jx, jy, jr } = useStep(seed, 4, 1.2);
  return (
    <div
      style={{
        position: "absolute",
        left: x + jx,
        top: y + jy,
        transform: `translate(-50%,-50%) rotate(${rot + jr}deg) scale(${pop})`,
        fontFamily: DISPLAY,
        fontSize: size,
        color,
        lineHeight: 0.95,
        letterSpacing: -1,
        textShadow: "4px 5px 0 rgba(33,28,22,0.15)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

const NumTag: React.FC<{ x: number; y: number; n: string; color: string; delay?: number }> = ({ x, y, n, color, delay = 0 }) => {
  const pop = usePop(delay);
  const { jr } = useStep(Math.round(x + 5), 0, 2.4, 5);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${-6 + jr}deg) scale(${pop})`,
        background: color,
        color: "#fff",
        fontFamily: ANTON,
        fontSize: 60,
        padding: "6px 26px",
        clipPath: tornPath(Math.round(x), 3),
        boxShadow: "5px 7px 0 rgba(33,28,22,0.22)",
      }}
    >
      {n}
    </div>
  );
};

const Label: React.FC<{ x: number; y: number; text: string; size?: number; color?: string; delay?: number; rot?: number }> = ({
  x,
  y,
  text,
  size = 44,
  color = INK,
  delay = 0,
  rot = -1,
}) => {
  const pop = usePop(delay);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${pop})`,
        fontFamily: HAND,
        fontWeight: 700,
        fontSize: size,
        color,
        whiteSpace: "nowrap",
        opacity: pop > 0.05 ? 1 : 0,
      }}
    >
      {text}
    </div>
  );
};

// drawn collage icon on a torn sticker (replaces repetitive mascot use)
const ICONS: Record<string, (c: string) => React.ReactNode> = {
  bolt: (c) => <path d="M58 6 L24 56 L46 56 L38 94 L78 40 L54 40 Z" fill={c} stroke={INK} strokeWidth={4} strokeLinejoin="round" />,
  key: (c) => (
    <>
      <circle cx={32} cy={34} r={20} fill="none" stroke={c} strokeWidth={11} />
      <path d="M44 44 L86 86" stroke={c} strokeWidth={11} strokeLinecap="round" />
      <path d="M70 70 L82 58 M80 80 L92 68" stroke={c} strokeWidth={11} strokeLinecap="round" />
    </>
  ),
  heart: (c) => (
    <path
      d="M50 86 C 10 56, 14 22, 38 22 C 50 22, 50 34, 50 34 C 50 34, 50 22, 62 22 C 86 22, 90 56, 50 86 Z"
      fill={c}
      stroke={INK}
      strokeWidth={4}
      strokeLinejoin="round"
    />
  ),
};
const IconSticker: React.FC<{ x: number; y: number; kind: string; bg: string; iconColor?: string; rot?: number; delay?: number; seed?: number }> = ({
  x,
  y,
  kind,
  bg,
  iconColor = "#fff",
  rot = 6,
  delay = 0,
  seed = 40,
}) => {
  const pop = usePop(delay);
  const { jr } = useStep(seed, 0, 1.6, 5);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot + jr}deg) scale(${pop})`,
        background: bg,
        padding: 26,
        clipPath: tornPath(seed, 3),
        boxShadow: "6px 9px 0 rgba(33,28,22,0.2)",
        opacity: pop > 0.05 ? 1 : 0,
      }}
    >
      <Tape x={66} y={2} w={90} rot={-10} color="rgba(255,255,255,0.5)" />
      <svg width={100} height={100} viewBox="0 0 100 100" style={{ display: "block" }}>
        {ICONS[kind](iconColor)}
      </svg>
    </div>
  );
};

// row of small "example" sticker tags
const Tags: React.FC<{ x: number; y: number; items: { t: string; c: string }[]; delay?: number }> = ({ x, y, items, delay = 0 }) => (
  <>
    {items.map((it, i) => {
      const pop = usePop(delay + i * 5);
      const rot = (i % 2 ? 1 : -1) * (3 + i);
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x + i * 230 - ((items.length - 1) * 230) / 2,
            top: y,
            transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${pop})`,
            background: it.c,
            color: "#fff",
            fontFamily: BODY,
            fontWeight: 900,
            fontSize: 40,
            padding: "12px 26px",
            clipPath: tornPath(50 + i, 3),
            boxShadow: "4px 6px 0 rgba(33,28,22,0.18)",
            whiteSpace: "nowrap",
            opacity: pop > 0.05 ? 1 : 0,
          }}
        >
          {it.t}
        </div>
      );
    })}
  </>
);

// ---------------------------------------------------------------------------
// Scenes
// ---------------------------------------------------------------------------
const Hook: React.FC = () => (
  <AbsoluteFill>
    <Tape x={540} y={468} w={250} rot={-6} />
    <Label x={540} y={468} text="사람들은" size={74} color={INK} delay={2} rot={-3} />
    <BigWord x={540} y={640} text="어디에 돈을" size={150} delay={8} seed={4} rot={-2} />
    <BigWord x={540} y={800} text="쓸까?" size={170} color={RED} delay={16} seed={5} rot={1} />
    <ScribbleCircle x={690} y={800} w={300} h={210} color={PINK} delay={26} />
    <Label x={540} y={1015} text="지갑을 여는 3가지" size={66} color={BLUE} delay={34} />
    <MascotCut x={600} y={1330} w={190} rot={-5} delay={30} />
  </AbsoluteFill>
);

const Reason: React.FC<{
  num: string;
  numColor: string;
  word: string;
  wordColor: string;
  sub: string;
  insight: string;
  accent: string;
  icon: string;
  tags: { t: string; c: string }[];
  extra?: React.ReactNode;
}> = ({ num, numColor, word, wordColor, sub, insight, accent, icon, tags, extra }) => (
  <AbsoluteFill>
    {/* layered colored paper behind the word card */}
    <ColorBlock x={520} y={648} w={560} h={290} color={accent} rot={-6} seed={30} delay={5} halftone />
    <NumTag x={235} y={420} n={num} color={numColor} delay={2} />
    <Card x={500} y={640} rot={-3} bg="#fff" seed={Math.round(word.length + 2)} delay={8} pad="22px 56px">
      <div style={{ fontFamily: DISPLAY, fontSize: 168, color: wordColor, lineHeight: 1.0, letterSpacing: -2, whiteSpace: "nowrap" }}>{word}</div>
    </Card>
    <IconSticker x={860} y={600} kind={icon} bg={accent} rot={8} delay={14} seed={Math.round(word.length + 41)} />
    <Underline x={500} y={780} w={430} color={accent} delay={22} />
    {/* sub headline (bold) + insight (handwriting) */}
    <div
      style={{
        position: "absolute",
        top: 900,
        width: "100%",
        textAlign: "center",
        fontFamily: BODY,
        fontWeight: 900,
        fontSize: 60,
        color: INK,
        opacity: 1,
      }}
    >
      {sub}
    </div>
    <Label x={540} y={1020} text={insight} size={66} color={accent} delay={20} />
    {/* example tags */}
    <Tags x={540} y={1230} items={tags} delay={26} />
    {extra}
  </AbsoluteFill>
);

const Convenience: React.FC = () => (
  <Reason
    num="01"
    numColor={BLUE}
    word="편리함"
    wordColor={INK}
    sub="귀찮음을 없애준다"
    insight="시간과 수고를 줄여주니까"
    accent={BLUE}
    icon="bolt"
    tags={[
      { t: "배달", c: BLUE },
      { t: "구독", c: YELLOW },
      { t: "자동화", c: RED },
    ]}
  />
);

const Solution: React.FC = () => (
  <Reason
    num="02"
    numColor={RED}
    word="해결책"
    wordColor={INK}
    sub="문제를 없애준다면"
    insight="고통이 클수록 지갑이 열린다"
    accent={RED}
    icon="key"
    tags={[
      { t: "불편", c: RED },
      { t: "불안", c: BLUE },
      { t: "손해", c: INK },
    ]}
  />
);

const Experience: React.FC = () => (
  <Reason
    num="03"
    numColor={PINK}
    word="경험"
    wordColor={PINK}
    sub="기억에 남는 감정을 산다"
    insight="감정이 클수록 더 쓴다"
    accent={PINK}
    icon="heart"
    tags={[
      { t: "여행", c: PINK },
      { t: "공연", c: BLUE },
      { t: "선물", c: GREEN },
    ]}
  />
);

const Close: React.FC = () => {
  const cards = [
    { t: "편리함", c: BLUE },
    { t: "해결책", c: RED },
    { t: "경험", c: PINK },
  ];
  return (
    <AbsoluteFill>
      <Label x={540} y={425} text="사람의 지갑을 여는" size={74} color={INK} delay={2} />
      <BigWord x={540} y={560} text="3가지" size={146} color={RED} delay={8} seed={6} />
      <ScribbleCircle x={540} y={560} w={340} h={205} color={PINK} delay={26} />
      {cards.map((c, i) => (
        <Card key={i} x={250 + i * 290} y={760} rot={i % 2 ? 4 : -4} bg={c.c} seed={i + 20} delay={16 + i * 6} pad="18px 28px">
          <div style={{ fontFamily: DISPLAY, fontSize: 56, color: "#fff" }}>{c.t}</div>
        </Card>
      ))}
      {/* conclusion */}
      <div
        style={{
          position: "absolute",
          top: 900,
          width: "100%",
          textAlign: "center",
          fontFamily: BODY,
          fontWeight: 900,
          fontSize: 56,
          color: INK,
          lineHeight: 1.3,
        }}
      >
        결국 사람은
        <br />
        <span style={{ color: PINK }}>더 나은 기분</span>을 산다
      </div>
      <Label x={540} y={1140} text="당신의 고객은 무엇을 사고 있나요?" size={62} color="#3f372c" delay={30} />
      <MascotCut x={560} y={1330} w={175} rot={-4} delay={20} />
      <div
        style={{
          position: "absolute",
          bottom: 230,
          width: "100%",
          textAlign: "center",
          fontFamily: HAND,
          fontWeight: 700,
          fontSize: 34,
          color: "#8a7a62",
        }}
      >
        www.wylieax.com
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Transition (quick paper cut — hard with tiny fade for stop-motion feel)
// ---------------------------------------------------------------------------
const Cut: React.FC<{ d: number; children: React.ReactNode }> = ({ d, children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 3, d - 3, d], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const Collage: React.FC = () => (
  <AbsoluteFill style={{ background: PAPER }}>
    <FontLoader />
    <PaperBG />
    {/* safe-area band for Reels UI */}
    <AbsoluteFill style={{ transform: "translateY(-20px) scale(0.84)", transformOrigin: "center center" }}>
      <Sequence from={0} durationInFrames={90}>
        <Cut d={90}>
          <Hook />
        </Cut>
      </Sequence>
      <Sequence from={90} durationInFrames={110}>
        <Cut d={110}>
          <Convenience />
        </Cut>
      </Sequence>
      <Sequence from={200} durationInFrames={110}>
        <Cut d={110}>
          <Solution />
        </Cut>
      </Sequence>
      <Sequence from={310} durationInFrames={110}>
        <Cut d={110}>
          <Experience />
        </Cut>
      </Sequence>
      <Sequence from={420} durationInFrames={95}>
        <Cut d={95}>
          <Close />
        </Cut>
      </Sequence>
    </AbsoluteFill>
  </AbsoluteFill>
);
