import { useEffect, useState } from "react";
import {
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  continueRender,
  delayRender,
} from "remotion";

const FONT = "Noto Sans KR";
const BG = "#060608";
const YELLOW = "#FFD60A";
const WHITE = "#FFFFFF";
const GRAY = "#888899";
const CARD_DUR = 160, OVERLAP = 16, CARDS = 5;

const fontCss = `
@font-face { font-family: '${FONT}'; font-weight: 400; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-400-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${FONT}'; font-weight: 700; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${FONT}'; font-weight: 900; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-900-normal.woff2")}') format('woff2'); }
`;

const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender("load-fonts"));
  useEffect(() => {
    const done = () => continueRender(handle);
    Promise.all([
      (document as any).fonts.load(`400 64px "${FONT}"`, "가"),
      (document as any).fonts.load(`700 64px "${FONT}"`, "가"),
      (document as any).fonts.load(`900 64px "${FONT}"`, "가"),
    ])
      .then(() => (document as any).fonts.ready)
      .then(done)
      .catch(done);
  }, [handle]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
// Staggered draw-on progress for SVG stroke k within icon progress p
const seg = (p: number, k: number) => clamp01((p - k * 0.09) / 0.5);
const draw = (p: number, k: number) => ({
  pathLength: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1 - seg(p, k),
});

type IconProps = { p: number; t: number };

// Card 1: 왜 이것도 못하지? — tangled thought ball wobbling above a bobbing person
const IconTangled: React.FC<IconProps> = ({ p, t }) => {
  const wobble = Math.sin(t * Math.PI * 2 * 0.6) * 7;
  const bob = Math.sin(t * Math.PI * 2 * 0.9) * 3;
  const shimmer = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 1.4);
  return (
    <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
      <g transform={`translate(0 ${bob}) rotate(${wobble} 70 45)`}>
        <path d="M30 55 C22 30 50 16 66 30 C70 10 104 14 102 36 C124 34 126 60 104 60 C116 76 92 86 80 72 C74 90 44 86 48 68 C28 72 22 58 36 52"
          stroke={GRAY} strokeWidth={3.5} strokeLinecap="round" {...draw(p, 0)} />
        <path d="M58 40 C68 28 84 30 88 44" stroke={YELLOW} strokeWidth={4} strokeLinecap="round"
          opacity={0.4 + shimmer * 0.6} {...draw(p, 2)} />
      </g>
      <g transform={`translate(0 ${-bob * 0.6})`}>
        <circle cx={70} cy={100} r={15} stroke={GRAY} strokeWidth={4} {...draw(p, 3)} />
        <path d="M38 138 Q70 114 102 138" stroke={GRAY} strokeWidth={4} strokeLinecap="round" {...draw(p, 4)} />
      </g>
    </svg>
  );
};

// Card 2: 일 vs 나 — balance scale see-sawing, heart pulsing
const IconBalance: React.FC<IconProps> = ({ p, t }) => {
  const sway = Math.sin(t * Math.PI * 2 * 0.45) * 5;
  const beat = 1 + 0.16 * Math.abs(Math.sin(t * Math.PI * 2 * 0.9));
  return (
    <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
      <polygon points="70,66 56,120 84,120" stroke={GRAY} strokeWidth={3.5} strokeLinejoin="round" {...draw(p, 0)} />
      <line x1={38} y1={120} x2={102} y2={120} stroke={GRAY} strokeWidth={3.5} strokeLinecap="round" {...draw(p, 1)} />
      <g transform={`rotate(${sway} 70 65)`}>
        <line x1={16} y1={54} x2={124} y2={76} stroke={GRAY} strokeWidth={4} strokeLinecap="round" {...draw(p, 2)} />
        <line x1={16} y1={54} x2={16} y2={70} stroke={GRAY} strokeWidth={3} {...draw(p, 3)} />
        <rect x={4} y={70} width={24} height={20} rx={3} stroke={GRAY} strokeWidth={3.5} {...draw(p, 4)} />
        <line x1={124} y1={76} x2={124} y2={90} stroke={YELLOW} strokeWidth={3} {...draw(p, 5)} />
        <g transform={`translate(124 102) scale(${beat}) translate(-124 -102)`}>
          <path d="M124 112 C110 102 112 86 124 93 C136 86 138 102 124 112 Z"
            fill={YELLOW} opacity={seg(p, 6)} />
        </g>
      </g>
    </svg>
  );
};

// Card 3: 하다 보면 잘하게 되어있어 — equalizer-bouncing bars + surging arrow
const IconSteps: React.FC<IconProps> = ({ p, t }) => {
  const sy = (ph: number) => 1 + 0.1 * Math.sin(t * Math.PI * 2 * 1.1 + ph);
  const surge = Math.sin(t * Math.PI * 2 * 0.8);
  const dx = surge * 5, dy = -surge * 3;
  return (
    <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
      <g transform={`translate(31 128) scale(1 ${sy(0)}) translate(-31 -128)`}>
        <rect x={18} y={100} width={26} height={28} rx={3} stroke={GRAY} strokeWidth={3.5} {...draw(p, 0)} />
      </g>
      <g transform={`translate(70 128) scale(1 ${sy(1.6)}) translate(-70 -128)`}>
        <rect x={57} y={76} width={26} height={52} rx={3} stroke={GRAY} strokeWidth={3.5} {...draw(p, 1)} />
      </g>
      <g transform={`translate(109 128) scale(1 ${sy(3.2)}) translate(-109 -128)`}>
        <rect x={96} y={48} width={26} height={80} rx={3} stroke={GRAY} strokeWidth={3.5} {...draw(p, 2)} />
      </g>
      <g transform={`translate(${dx} ${dy})`}>
        <polyline points="14,90 70,58 120,28" stroke={YELLOW} strokeWidth={4.5}
          strokeLinecap="round" strokeLinejoin="round" {...draw(p, 4)} />
        <polyline points="104,24 121,27 118,43" stroke={YELLOW} strokeWidth={4.5}
          strokeLinecap="round" strokeLinejoin="round" {...draw(p, 6)} />
      </g>
    </svg>
  );
};

// Card 4: 에너지는 오래 간다 — battery charging cycle + flickering bolt
const IconBattery: React.FC<IconProps> = ({ p, t }) => {
  const cycle = (t % 2.4) / 2.4; // 0..1 repeating charge
  const bar = (i: number) => 0.18 + 0.82 * clamp01((cycle - i * 0.25) / 0.18);
  const bolt = 1 + 0.14 * Math.sin(t * Math.PI * 2 * 1.8);
  const flick = 0.65 + 0.35 * Math.sin(t * Math.PI * 2 * 3.1);
  return (
    <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
      <rect x={14} y={46} width={96} height={48} rx={8} stroke={GRAY} strokeWidth={4} {...draw(p, 0)} />
      <rect x={112} y={58} width={12} height={24} rx={3} stroke={GRAY} strokeWidth={3.5} {...draw(p, 1)} />
      <rect x={24} y={56} width={20} height={28} rx={3} fill={YELLOW} opacity={seg(p, 2) * bar(0)} />
      <rect x={52} y={56} width={20} height={28} rx={3} fill={YELLOW} opacity={seg(p, 3) * bar(1)} />
      <rect x={80} y={56} width={20} height={28} rx={3} fill={YELLOW} opacity={seg(p, 4) * bar(2)} />
      <g transform={`translate(66 120) scale(${bolt}) translate(-66 -120)`} opacity={flick}>
        <path d="M64 104 L54 122 L66 120 L60 136 L78 116 L66 118 L74 104 Z"
          stroke={YELLOW} strokeWidth={3} strokeLinejoin="round" {...draw(p, 5)} />
      </g>
    </svg>
  );
};

// Card 5: 선하고 건강한 에너지 — radiant person, rays orbiting, arms waving
const IconGlowPerson: React.FC<IconProps> = ({ p, t }) => {
  const orbit = (t * 46) % 360;
  const wave = Math.sin(t * Math.PI * 2 * 0.7) * 7;
  const twinkle = 0.55 + 0.45 * Math.sin(t * Math.PI * 2 * 1.8);
  return (
    <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
      <g transform={`rotate(${orbit} 70 62)`} opacity={twinkle}>
        <line x1={70} y1={16} x2={70} y2={4} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" {...draw(p, 6)} />
        <line x1={31} y1={29} x2={22} y2={21} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" {...draw(p, 6)} />
        <line x1={109} y1={29} x2={118} y2={21} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" {...draw(p, 6)} />
        <line x1={24} y1={62} x2={12} y2={62} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" {...draw(p, 7)} />
        <line x1={116} y1={62} x2={128} y2={62} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" {...draw(p, 7)} />
        <line x1={31} y1={95} x2={22} y2={103} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" {...draw(p, 7)} />
        <line x1={109} y1={95} x2={118} y2={103} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" {...draw(p, 7)} />
      </g>
      <circle cx={70} cy={46} r={16} stroke={YELLOW} strokeWidth={4} {...draw(p, 0)} />
      <line x1={70} y1={62} x2={70} y2={104} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" {...draw(p, 1)} />
      <g transform={`rotate(${wave} 70 76)`}>
        <line x1={70} y1={76} x2={42} y2={58} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" {...draw(p, 2)} />
        <line x1={70} y1={76} x2={98} y2={58} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" {...draw(p, 3)} />
      </g>
      <line x1={70} y1={104} x2={54} y2={132} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" {...draw(p, 4)} />
      <line x1={70} y1={104} x2={86} y2={132} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" {...draw(p, 5)} />
    </svg>
  );
};

type CardData = {
  context: string;
  bracket: string;
  punchline: string;
  Icon: React.FC<IconProps>;
  bracketFontSize: number;
};

const cards: CardData[] = [
  {
    context: "처음엔 다 그래",
    bracket: "[ 왜 이것도 못하지? ]",
    punchline: "못하는 게 부끄러운 게 아니다\n아직 안 해본 것뿐이다",
    Icon: IconTangled,
    bracketFontSize: 84,
  },
  {
    context: "자주 하는 착각",
    bracket: "[ 일 못하면 나도 못난 건가? ]",
    punchline: "일의 실력과 사람의 가치는\n전혀 다른 이야기다",
    Icon: IconBalance,
    bracketFontSize: 72,
  },
  {
    context: "시간이 답이다",
    bracket: "[ 하다 보면 잘하게 되어있어 ]",
    punchline: "못하는 시간을 버티는 사람이\n결국 잘하는 사람이 된다",
    Icon: IconSteps,
    bracketFontSize: 72,
  },
  {
    context: "실력보다 먼저",
    bracket: "[ 에너지는 실력보다 오래 간다 ]",
    punchline: "실력은 쌓을 수 있다\n하지만 에너지는 매일 선택이다",
    Icon: IconBattery,
    bracketFontSize: 66,
  },
  {
    context: "결론",
    bracket: "[ 선하고 건강한 에너지 ]",
    punchline: "일을 잘하는 것보다\n함께 있으면 힘이 나는 사람이 되자",
    Icon: IconGlowPerson,
    bracketFontSize: 80,
  },
];

// Slow-orbiting ambient light orbs behind everything
const BgOrbs: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const x1 = 540 + Math.sin(t * Math.PI * 2 * 0.045) * 280;
  const y1 = 680 + Math.cos(t * Math.PI * 2 * 0.035) * 220;
  const x2 = 540 - Math.sin(t * Math.PI * 2 * 0.03) * 320;
  const y2 = 1150 + Math.sin(t * Math.PI * 2 * 0.05) * 180;
  return (
    <>
      <div style={{
        position: "absolute", width: 1000, height: 1000,
        left: x1 - 500, top: y1 - 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,214,10,0.055), transparent 62%)",
      }} />
      <div style={{
        position: "absolute", width: 1100, height: 1100,
        left: x2 - 550, top: y2 - 550, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(136,136,153,0.07), transparent 62%)",
      }} />
    </>
  );
};

// Floating dust particles drifting upward for the whole video
const Particles: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  return (
    <>
      {Array.from({ length: 26 }).map((_, i) => {
        const baseX = random(`px${i}`) * 1080;
        const size = 3 + random(`ps${i}`) * 5;
        const speed = 20 + random(`pv${i}`) * 34;
        const y = ((random(`py${i}`) * 2100 - t * speed) % 2100 + 2100) % 2100 - 90;
        const x = baseX + Math.sin(t * 0.5 + i * 1.7) * 26;
        const op = 0.06 + random(`po${i}`) * 0.16;
        const isYellow = random(`pc${i}`) > 0.72;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y,
            width: size, height: size, borderRadius: "50%",
            background: isYellow ? YELLOW : GRAY, opacity: op,
          }} />
        );
      })}
    </>
  );
};

const ProgressDots: React.FC = () => {
  const frame = useCurrentFrame();
  const active = Math.min(CARDS - 1, Math.floor(frame / (CARD_DUR - OVERLAP)));
  return (
    <div style={{
      position: "absolute", bottom: 392, width: "100%",
      display: "flex", justifyContent: "center", gap: 14,
    }}>
      {Array.from({ length: CARDS }).map((_, i) => (
        <div key={i} style={{
          width: i === active ? 44 : 12, height: 12, borderRadius: 6,
          background: i === active ? YELLOW : "#333340",
          transition: "none",
        }} />
      ))}
    </div>
  );
};

const Card: React.FC<CardData> = ({ context, bracket, punchline, Icon, bracketFontSize }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const pop = (delay: number, stiff = 120, damping = 20) =>
    spring({ frame: frame - delay, fps, config: { damping, stiffness: stiff, mass: 0.85 } });

  const eCard = pop(0, 90);
  const t1 = pop(4, 130);
  const t2 = pop(16);
  const tCat = pop(56, 140, 11);

  // SVG draw-on progress
  const pIcon = interpolate(frame, [4, 46], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Bracket: per-character 3D flip stagger
  const chars = bracket.split("");
  const bracketDone = 30 + chars.length * 1.1 + 10;
  const glowSize = 28 + 12 * Math.sin(t * Math.PI * 2 * 0.8);
  const glowOn = frame > bracketDone;

  // Impact flash when the bracket lands
  const flash = interpolate(frame, [bracketDone - 4, bracketDone + 2, bracketDone + 22], [0, 0.45, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Punchline: word-by-word rise
  const lines = punchline.split("\n");
  let wordIdx = 0;

  const iconIdle = Math.sin(t * Math.PI * 2 * 0.6) * 10 * t1;
  const iconRot = Math.sin(t * Math.PI * 2 * 0.4) * 3.5 * t1;
  const iconBeat = 1 + 0.04 * Math.sin(t * Math.PI * 2 * 0.75) * t1;
  const haloPulse = 1 + 0.14 * Math.sin(t * Math.PI * 2 * 0.7);
  const catFloat = tCat > 0.95 ? Math.sin(t * Math.PI * 2 * 0.55) * 14 : 0;
  const catWiggle = tCat > 0.95 ? Math.sin(t * Math.PI * 2 * 1.1) * 3 : 0;

  // Gentle exit zoom during the outgoing crossfade
  const exitScale = interpolate(frame, [CARD_DUR - OVERLAP, CARD_DUR], [1, 1.045], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const breathe = Math.sin(t * Math.PI * 2 * 0.18) * 4;

  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      fontFamily: `'${FONT}', sans-serif`,
      transform: `scale(${exitScale})`,
    }}>
      {/* Impact flash behind content */}
      <div style={{
        position: "absolute", inset: 0, opacity: flash,
        background: "radial-gradient(circle at 50% 44%, rgba(255,214,10,0.35), transparent 55%)",
      }} />
      <div style={{
        position: "absolute", top: 200, bottom: 640, left: 60, right: 60,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 32,
        transform: `translateY(${(1 - eCard) * 70 + breathe}px)`,
      }}>
        {/* Icon with pulsing halo + draw-on strokes */}
        <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            width: 420, height: 420, borderRadius: "50%",
            transform: `translate(-50%, -50%) scale(${haloPulse * t1})`,
            background: "radial-gradient(circle, rgba(255,214,10,0.10), transparent 60%)",
          }} />
          <div style={{
            transform: `translateY(${-80 + t1 * 80}px) scale(${(0.6 + t1 * 0.4) * iconBeat}) translateY(${iconIdle}px) rotate(${iconRot}deg)`,
            opacity: t1,
          }}>
            <Icon p={pIcon} t={t} />
          </div>
        </div>
        {/* Context: tracking-in */}
        <div style={{
          color: GRAY, fontSize: 60, opacity: t2,
          letterSpacing: `${(1 - t2) * 16 + 1}px`,
          transform: `translateY(${(1 - t2) * 16}px)`,
        }}>
          {context}
        </div>
        {/* Bracket: per-character 3D flip */}
        <div style={{
          display: "flex", justifyContent: "center", perspective: 800,
          fontSize: bracketFontSize, fontWeight: 900, color: YELLOW,
          lineHeight: 1.2, whiteSpace: "nowrap",
          textShadow: glowOn ? `0 0 ${glowSize}px #FFD60A55` : undefined,
        }}>
          {chars.map((ch, i) => {
            const s = spring({
              frame: frame - (28 + i * 1.1), fps,
              config: { damping: 14, stiffness: 170, mass: 0.6 },
            });
            return (
              <span key={i} style={{
                display: "inline-block", whiteSpace: "pre",
                transform: `rotateX(${(1 - s) * -95}deg) translateY(${(1 - s) * 24}px)`,
                opacity: s,
              }}>{ch}</span>
            );
          })}
        </div>
        {/* Punchline: word-by-word rise */}
        <div style={{
          color: WHITE, fontSize: 60, fontWeight: 700,
          textAlign: "center", lineHeight: 1.5,
        }}>
          {lines.map((line, li) => (
            <div key={li}>
              {line.split(" ").map((word, wi) => {
                const myIdx = wordIdx++;
                const s = spring({
                  frame: frame - (52 + myIdx * 3.5), fps,
                  config: { damping: 18, stiffness: 140, mass: 0.7 },
                });
                return (
                  <span key={wi} style={{
                    display: "inline-block", whiteSpace: "pre",
                    transform: `translateY(${(1 - s) * 34}px)`,
                    opacity: s,
                  }}>{word + (wi < line.split(" ").length - 1 ? " " : "")}</span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Cat: overshoot bounce entrance + float */}
      <div style={{
        position: "absolute", bottom: 480, width: "100%",
        textAlign: "center", fontSize: 96,
        transform: `translateY(${(1 - tCat) * 90}px) scale(${Math.max(0, tCat)}) translateY(${catFloat}px) rotate(${catWiggle}deg)`,
        opacity: Math.min(1, tCat * 1.4),
      }}>🐱</div>
    </div>
  );
};

export const MothaedoGwaenchana: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{
      width: 1080, height: 1920, background: BG,
      position: "relative", overflow: "hidden",
    }}>
      <FontLoader />
      <BgOrbs />
      <Particles />
      {cards.map((card, i) => {
        const start = i * (CARD_DUR - OVERLAP);
        const op = interpolate(
          frame,
          [start, start + OVERLAP, start + CARD_DUR - OVERLAP, start + CARD_DUR],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        return (
          <div key={i} style={{ position: "absolute", inset: 0, opacity: op }}>
            <Sequence from={start} durationInFrames={CARD_DUR}>
              <Card {...card} />
            </Sequence>
          </div>
        );
      })}
      <ProgressDots />
      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 46%, transparent 52%, rgba(0,0,0,0.55) 100%)",
      }} />
    </div>
  );
};
