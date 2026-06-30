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
// doodles, bold display type.
// Topic: "잘하는 게 뭐 그리 중요해? 미친 듯이 즐기는 게 진짜 중요한 거야."
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
const PURPLE = "#7A4FD0";

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
      (document as any).fonts.load(`400 80px "${DISPLAY}"`, "즐"),
      (document as any).fonts.load(`700 80px "${HAND}"`, "즐"),
      (document as any).fonts.load(`900 80px "${BODY}"`, "즐"),
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
        strokeDasharray={2 * Math.PI * ((w + h) / 4)}
        strokeDashoffset={2 * Math.PI * ((w + h) / 4) * (1 - draw)}
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

// two diagonal marker strokes that draw on — "지워버려" / 부정 표시
const CrossOut: React.FC<{ x: number; y: number; w: number; h: number; color?: string; delay?: number }> = ({
  x,
  y,
  w,
  h,
  color = RED,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const d1 = interpolate(frame, [delay, delay + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const d2 = interpolate(frame, [delay + 7, delay + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const len = Math.hypot(w, h);
  return (
    <svg style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", overflow: "visible" }} width={w} height={h}>
      <path
        d={`M 8 ${h * 0.16} C ${w * 0.4} ${h * 0.3}, ${w * 0.6} ${h * 0.7}, ${w - 8} ${h * 0.9}`}
        fill="none"
        stroke={color}
        strokeWidth={16}
        strokeLinecap="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - d1)}
      />
      <path
        d={`M ${w - 8} ${h * 0.16} C ${w * 0.6} ${h * 0.32}, ${w * 0.4} ${h * 0.68}, 8 ${h * 0.9}`}
        fill="none"
        stroke={color}
        strokeWidth={16}
        strokeLinecap="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - d2)}
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

const BigWord: React.FC<{ x: number; y: number; text: string; size: number; color?: string; rot?: number; delay?: number; seed?: number; strike?: boolean; strikeDelay?: number }> = ({
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

// drawn collage icon on a torn sticker
const ICONS: Record<string, (c: string) => React.ReactNode> = {
  fire: (c) => (
    <path
      d="M52 4 C 70 28 60 42 56 48 C 62 38 52 30 52 30 C 52 46 38 50 41 66 C 35 60 33 54 33 54 C 24 68 32 88 50 94 C 72 90 80 66 66 50 C 67 60 60 64 60 64 C 70 44 60 24 52 4 Z"
      fill={c}
      stroke={INK}
      strokeWidth={4}
      strokeLinejoin="round"
    />
  ),
  star: (c) => (
    <path
      d="M50 6 L61 38 L95 38 L67 58 L78 92 L50 70 L22 92 L33 58 L5 38 L39 38 Z"
      fill={c}
      stroke={INK}
      strokeWidth={4}
      strokeLinejoin="round"
    />
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
  bolt: (c) => <path d="M58 6 L24 56 L46 56 L38 94 L78 40 L54 40 Z" fill={c} stroke={INK} strokeWidth={4} strokeLinejoin="round" />,
};
const IconSticker: React.FC<{ x: number; y: number; kind: string; bg: string; iconColor?: string; rot?: number; delay?: number; seed?: number; size?: number }> = ({
  x,
  y,
  kind,
  bg,
  iconColor = "#fff",
  rot = 6,
  delay = 0,
  seed = 40,
  size = 100,
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
      <Tape x={size * 0.66} y={2} w={90} rot={-10} color="rgba(255,255,255,0.5)" />
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
        {ICONS[kind](iconColor)}
      </svg>
    </div>
  );
};

// row of small "example" sticker tags
const Tags: React.FC<{ x: number; y: number; items: { t: string; c: string }[]; delay?: number; gap?: number }> = ({ x, y, items, delay = 0, gap = 230 }) => (
  <>
    {items.map((it, i) => {
      const pop = usePop(delay + i * 5);
      const rot = (i % 2 ? 1 : -1) * (3 + i);
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x + i * gap - ((items.length - 1) * gap) / 2,
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

// bare transparent mascot (no paper frame) — collage host, floats gently
const BareMascot: React.FC<{ x: number; y: number; w: number; rot?: number; delay?: number; flip?: boolean }> = ({
  x,
  y,
  w,
  rot = -3,
  delay = 0,
  flip = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = usePop(delay);
  const floatY = Math.sin((frame / fps) * Math.PI * 1.1) * 9;
  const h = (w * 2400) / 1350;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + floatY,
        width: w,
        height: h,
        transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${pop}) ${flip ? "scaleX(-1)" : ""}`,
        filter: "drop-shadow(5px 9px 0 rgba(33,28,22,0.18))",
        opacity: pop > 0.05 ? 1 : 0,
      }}
    >
      <Img src={MASCOT} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scenes (6 cuts)
// ---------------------------------------------------------------------------

// 1) Hook — the provocative question
const Hook: React.FC = () => (
  <AbsoluteFill>
    <Tape x={540} y={392} w={420} rot={-6} />
    <Label x={540} y={392} text="있잖아…" size={140} color={INK} delay={2} rot={-3} />
    <BigWord x={540} y={560} text="잘하는 게" size={128} delay={8} seed={4} rot={-2} />
    <BigWord x={540} y={720} text="뭐 그리" size={140} delay={14} seed={6} rot={1} />
    <BigWord x={540} y={890} text="중요해??" size={156} color={RED} delay={20} seed={5} rot={-1} />
    <ScribbleCircle x={560} y={895} w={420} h={230} color={PINK} delay={30} />
    <Sparkle x={250} y={560} s={54} color={YELLOW} delay={36} />
    <Sparkle x={860} y={690} s={44} color={BLUE} delay={40} />
    <Specks seed={3} color={"rgba(33,28,22,0.35)"} n={5} box={[160, 480, 940, 980]} delay={30} />
    <BareMascot x={300} y={1330} w={300} rot={-4} delay={26} />
    <Label x={720} y={1300} text="진짜 중요한 건…" size={58} color={BLUE} delay={44} rot={3} />
  </AbsoluteFill>
);

// 2) The trap — comparison / "남보다 잘해야 해"
const Trap: React.FC = () => (
  <AbsoluteFill>
    <Label x={540} y={385} text="남들은 다 잘하는데" size={120} color={INK} delay={2} />
    <ColorBlock x={520} y={660} w={620} h={300} color={BLUE} rot={-6} seed={30} delay={5} halftone />
    <Card x={500} y={650} rot={-3} bg="#fff" seed={7} delay={8} pad="22px 54px">
      <div style={{ fontFamily: DISPLAY, fontSize: 150, color: INK, lineHeight: 1.0, letterSpacing: -2, whiteSpace: "nowrap" }}>나만 뒤처져</div>
    </Card>
    <IconSticker x={880} y={560} kind="bolt" bg={BLUE} rot={9} delay={16} seed={48} />
    <Underline x={500} y={790} w={470} color={BLUE} delay={24} />
    <div
      style={{
        position: "absolute",
        top: 905,
        width: "100%",
        textAlign: "center",
        fontFamily: BODY,
        fontWeight: 900,
        fontSize: 58,
        color: INK,
      }}
    >
      비교는 끝이 없고
    </div>
    <Label x={540} y={1020} text="잘해도 늘 불안하다" size={64} color={RED} delay={22} />
    <Tags x={540} y={1230} items={[{ t: "비교", c: BLUE }, { t: "조급함", c: RED }, { t: "번아웃", c: INK }]} delay={26} />
  </AbsoluteFill>
);

// 3) The truth — being good but not enjoying = won't last
const Truth: React.FC = () => (
  <AbsoluteFill>
    <Label x={540} y={385} text="근데 말이야," size={124} color={INK} delay={2} />
    <BigWord x={400} y={580} text="잘해도" size={150} delay={8} seed={9} rot={-2} />
    <CrossOut x={400} y={580} w={420} h={180} color={RED} delay={26} />
    <Card x={560} y={770} rot={3} bg={YELLOW} seed={11} delay={16} pad="16px 40px">
      <div style={{ fontFamily: DISPLAY, fontSize: 92, color: INK, whiteSpace: "nowrap" }}>안 즐거우면?</div>
    </Card>
    <div
      style={{
        position: "absolute",
        top: 930,
        width: "100%",
        textAlign: "center",
        fontFamily: BODY,
        fontWeight: 900,
        fontSize: 58,
        color: INK,
      }}
    >
      금방 지치고 멈춰버려
    </div>
    <Label x={540} y={1045} text="재미가 없으면 못 버티거든" size={60} color={RED} delay={24} />
    <Tags x={540} y={1250} items={[{ t: "작심삼일", c: RED }, { t: "번아웃", c: INK }, { t: "포기", c: BLUE }]} delay={28} gap={250} />
  </AbsoluteFill>
);

// 4) The pivot (climax) — enjoy like crazy
const Pivot: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ColorBlock x={540} y={700} w={760} h={420} color={PINK} rot={-4} seed={33} delay={4} halftone />
      <Specks seed={21} color={YELLOW} n={9} box={[150, 360, 940, 1120]} delay={18} />
      <BigWord x={540} y={560} text="미친 듯이" size={138} color={"#fff"} delay={8} seed={14} rot={-2} />
      <BigWord x={540} y={740} text="즐겨라!" size={196} color={YELLOW} delay={16} seed={15} rot={1} />
      <ScribbleCircle x={540} y={745} w={520} h={250} color={"#fff"} delay={28} />
      <IconSticker x={150} y={560} kind="fire" bg={RED} rot={-10} delay={22} seed={51} size={96} />
      <IconSticker x={930} y={730} kind="fire" bg={RED} rot={12} delay={26} seed={52} size={96} />
      <Sparkle x={250} y={900} s={56} color={YELLOW} delay={30} />
      <Sparkle x={840} y={520} s={48} color={"#fff"} delay={34} />
      <Sparkle x={700} y={980} s={44} color={YELLOW} delay={38} />
      <div
        style={{
          position: "absolute",
          top: 1010,
          width: "100%",
          textAlign: "center",
          fontFamily: BODY,
          fontWeight: 900,
          fontSize: 64,
          color: INK,
          transform: `scale(${1 + Math.sin(frame / 6) * 0.015})`,
        }}
      >
        그게 진짜 중요한 거야
      </div>
      <Label x={540} y={1230} text="결과보다 그 순간의 몰입!" size={62} color={PINK} delay={34} />
    </AbsoluteFill>
  );
};

// 5) Why it works — 공자: those who enjoy can't be beaten
const Why: React.FC = () => (
  <AbsoluteFill>
    <Label x={540} y={385} text="공자도 말했어" size={124} color={INK} delay={2} />
    <ColorBlock x={520} y={645} w={640} h={300} color={GREEN} rot={-5} seed={36} delay={5} halftone />
    <Card x={500} y={640} rot={-3} bg="#fff" seed={17} delay={8} pad="20px 48px">
      <div style={{ fontFamily: DISPLAY, fontSize: 120, color: INK, lineHeight: 1.0, letterSpacing: -2, whiteSpace: "nowrap" }}>즐기는 사람</div>
    </Card>
    <IconSticker x={880} y={580} kind="star" bg={GREEN} rot={8} delay={14} seed={54} />
    <Underline x={500} y={770} w={470} color={GREEN} delay={22} />
    <div
      style={{
        position: "absolute",
        top: 880,
        width: "100%",
        textAlign: "center",
        fontFamily: DISPLAY,
        fontSize: 110,
        color: PURPLE,
        letterSpacing: -2,
      }}
    >
      못 이겨!
    </div>
    <Label x={540} y={1050} text="즐기면 더 오래, 더 멀리 가" size={60} color={"#6b5d45"} delay={24} rot={1} />
    <Tags x={540} y={1250} items={[{ t: "몰입", c: GREEN }, { t: "꾸준함", c: BLUE }, { t: "성장", c: PINK }]} delay={28} />
  </AbsoluteFill>
);

// 6) Close — drop "being good", just enjoy + brand sign-off
const Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fpop = usePop(30);
  const floatY = Math.sin((frame / fps) * Math.PI) * 8;
  return (
    <AbsoluteFill>
      <Label x={540} y={385} text="그러니까 우리," size={124} color={INK} delay={2} />
      <BigWord x={460} y={560} text="잘하지 마." size={120} delay={8} seed={18} rot={-2} />
      <CrossOut x={460} y={560} w={520} h={150} color={"#9a8b70"} delay={24} />
      <BigWord x={540} y={740} text="즐겨버려!" size={172} color={PINK} delay={16} seed={19} rot={1} />
      <ScribbleCircle x={540} y={745} w={500} h={230} color={YELLOW} delay={30} />
      <Sparkle x={250} y={620} s={50} color={YELLOW} delay={34} />
      <Sparkle x={860} y={690} s={44} color={BLUE} delay={38} />
      <div
        style={{
          position: "absolute",
          top: 935,
          width: "100%",
          textAlign: "center",
          fontFamily: BODY,
          fontWeight: 900,
          fontSize: 56,
          color: INK,
          lineHeight: 1.3,
        }}
      >
        잘하는 건
        <br />
        <span style={{ color: PINK }}>즐기다 보면</span> 따라온다
      </div>
      {/* brand footer: bare mascot before the URL */}
      <div
        style={{
          position: "absolute",
          bottom: 215,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
          opacity: fpop > 0.05 ? 1 : 0,
          transform: `scale(${fpop})`,
        }}
      >
        <Img
          src={MASCOT}
          style={{
            height: 250,
            width: "auto",
            transform: `translateY(${floatY}px)`,
            filter: "drop-shadow(4px 7px 0 rgba(33,28,22,0.18))",
          }}
        />
        <span style={{ fontFamily: HAND, fontWeight: 700, fontSize: 68, color: "#4a4031" }}>www.wylieax.com</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Transition (quick paper cut — hard with tiny fade for stop-motion feel)
// ---------------------------------------------------------------------------
const Cut: React.FC<{ d: number; children: React.ReactNode }> = ({ d, children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 6, d - 6, d], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const EnjoyCollage: React.FC = () => (
  <AbsoluteFill style={{ background: PAPER }}>
    <FontLoader />
    <PaperBG />
    {/* safe-area band for Reels UI */}
    <AbsoluteFill style={{ transform: "translateY(-20px) scale(0.84)", transformOrigin: "center center" }}>
      <Sequence from={0} durationInFrames={140}>
        <Cut d={140}>
          <Hook />
        </Cut>
      </Sequence>
      <Sequence from={140} durationInFrames={150}>
        <Cut d={150}>
          <Trap />
        </Cut>
      </Sequence>
      <Sequence from={290} durationInFrames={150}>
        <Cut d={150}>
          <Truth />
        </Cut>
      </Sequence>
      <Sequence from={440} durationInFrames={160}>
        <Cut d={160}>
          <Pivot />
        </Cut>
      </Sequence>
      <Sequence from={600} durationInFrames={150}>
        <Cut d={150}>
          <Why />
        </Cut>
      </Sequence>
      <Sequence from={750} durationInFrames={160}>
        <Cut d={160}>
          <Close />
        </Cut>
      </Sequence>
    </AbsoluteFill>
  </AbsoluteFill>
);
