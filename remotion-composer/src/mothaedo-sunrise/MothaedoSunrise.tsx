import { useEffect, useState } from "react";
import {
  Sequence,
  interpolate,
  interpolateColors,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  continueRender,
  delayRender,
} from "remotion";

const FONT = "Noto Sans KR";
const CHARCOAL = "#2E241D";
const INK = "#3E3129";
const SOFT = "#6B5646";
const CORAL = "#FF7A4D";
const AMBER = "#FFB84C";
const CARD_DUR = 160, OVERLAP = 16, CARDS = 5;
const TOTAL = (CARD_DUR - OVERLAP) * (CARDS - 1) + CARD_DUR;

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
const seg = (p: number, k: number) => clamp01((p - k * 0.1) / 0.45);
// element pop-in: fade + rise
const popIn = (p: number, k: number) => ({
  opacity: seg(p, k),
  transform: `translate(0 ${(1 - seg(p, k)) * 14})`,
});

const BLOB = "M70 10 C108 4 134 34 130 72 C126 108 104 134 68 130 C32 126 6 104 10 68 C14 34 36 14 70 10 Z";

type IconProps = { p: number; t: number };

// Card 1: white blob + tangled charcoal scribble, coral strand shimmer
const IconTangleSun: React.FC<IconProps> = ({ p, t }) => {
  const wob = Math.sin(t * Math.PI * 2 * 0.6) * 6;
  return (
    <svg width={300} height={300} viewBox="0 0 140 140" fill="none">
      <path d={BLOB} fill="#FFFFFF" opacity={0.9 * seg(p, 0)} />
      <g transform={`rotate(${wob} 70 66)`}>
        <path d="M34 72 C26 48 52 34 68 46 C72 28 102 32 100 52 C120 50 122 74 102 74 C112 88 90 98 78 86 C72 102 44 98 48 82 C30 86 26 72 38 68"
          stroke={CHARCOAL} strokeWidth={4.5} strokeLinecap="round" {...popIn(p, 2)} />
        <path d="M58 54 C68 42 84 44 88 58" stroke={CORAL} strokeWidth={5} strokeLinecap="round"
          {...popIn(p, 4)} />
      </g>
    </svg>
  );
};

// Card 2: peach blob + charcoal balance + coral heart, see-sawing
const IconBalanceSun: React.FC<IconProps> = ({ p, t }) => {
  const sway = Math.sin(t * Math.PI * 2 * 0.45) * 5;
  const beat = 1 + 0.15 * Math.abs(Math.sin(t * Math.PI * 2 * 0.9));
  return (
    <svg width={300} height={300} viewBox="0 0 140 140" fill="none">
      <path d={BLOB} fill="#FFE8D2" opacity={0.95 * seg(p, 0)} />
      <g {...popIn(p, 1)}>
        <polygon points="70,64 60,106 80,106" fill={CHARCOAL} />
        <rect x={46} y={104} width={48} height={7} rx={3.5} fill={CHARCOAL} />
      </g>
      <g transform={`rotate(${sway} 70 62)`}>
        <rect x={20} y={50} width={102} height={7} rx={3.5} fill={CHARCOAL}
          transform="rotate(10 70 62)" opacity={seg(p, 2)} />
        <g transform="rotate(10 70 62)">
          <rect x={16} y={60} width={22} height={18} rx={4} fill={CHARCOAL} opacity={seg(p, 3)} />
          <g transform={`translate(116 76) scale(${beat}) translate(-116 -76)`}>
            <path d="M116 86 C104 77 106 63 116 69 C126 63 128 77 116 86 Z"
              fill={CORAL} opacity={seg(p, 4)} />
          </g>
        </g>
      </g>
    </svg>
  );
};

// Card 3: amber blob + bouncing filled bars + coral arrow
const IconGrowthSun: React.FC<IconProps> = ({ p, t }) => {
  const sy = (ph: number) => 1 + 0.1 * Math.sin(t * Math.PI * 2 * 1.1 + ph);
  const surge = Math.sin(t * Math.PI * 2 * 0.8);
  return (
    <svg width={300} height={300} viewBox="0 0 140 140" fill="none">
      <path d={BLOB} fill="#FFDFA8" opacity={0.95 * seg(p, 0)} />
      <g transform={`translate(39 108) scale(1 ${sy(0)}) translate(-39 -108)`}>
        <rect x={28} y={86} width={22} height={22} rx={5} fill={CHARCOAL} opacity={seg(p, 1)} />
      </g>
      <g transform={`translate(70 108) scale(1 ${sy(1.6)}) translate(-70 -108)`}>
        <rect x={59} y={68} width={22} height={40} rx={5} fill={CHARCOAL} opacity={seg(p, 2)} />
      </g>
      <g transform={`translate(101 108) scale(1 ${sy(3.2)}) translate(-101 -108)`}>
        <rect x={90} y={48} width={22} height={60} rx={5} fill={CHARCOAL} opacity={seg(p, 3)} />
      </g>
      <g transform={`translate(${surge * 4} ${-surge * 2.5})`} opacity={seg(p, 5)}>
        <polyline points="26,74 70,50 110,30" stroke={CORAL} strokeWidth={6}
          strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="96,26 112,29 109,44" stroke={CORAL} strokeWidth={6}
          strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
};

// Card 4: warm blob + battery with coral charge cycle + bolt
const IconBatterySun: React.FC<IconProps> = ({ p, t }) => {
  const cycle = (t % 2.4) / 2.4;
  const bar = (i: number) => 0.2 + 0.8 * clamp01((cycle - i * 0.25) / 0.18);
  const bolt = 1 + 0.13 * Math.sin(t * Math.PI * 2 * 1.8);
  return (
    <svg width={300} height={300} viewBox="0 0 140 140" fill="none">
      <path d={BLOB} fill="#FFD28A" opacity={0.95 * seg(p, 0)} />
      <rect x={22} y={44} width={82} height={42} rx={9} stroke={CHARCOAL} strokeWidth={6}
        opacity={seg(p, 1)} />
      <rect x={106} y={55} width={10} height={20} rx={3} fill={CHARCOAL} opacity={seg(p, 1)} />
      <rect x={32} y={54} width={17} height={22} rx={3} fill={CORAL} opacity={seg(p, 2) * bar(0)} />
      <rect x={55} y={54} width={17} height={22} rx={3} fill={CORAL} opacity={seg(p, 3) * bar(1)} />
      <rect x={78} y={54} width={17} height={22} rx={3} fill={CORAL} opacity={seg(p, 4) * bar(2)} />
      <g transform={`translate(66 112) scale(${bolt}) translate(-66 -112)`}>
        <path d="M66 94 L56 114 L66 112 L61 130 L78 108 L67 110 L74 94 Z"
          fill={CHARCOAL} opacity={seg(p, 5)} />
      </g>
    </svg>
  );
};

// Card 5: the blob IS the sun — amber circle + rotating rays + white person
const IconSunPerson: React.FC<IconProps> = ({ p, t }) => {
  const orbit = (t * 40) % 360;
  const wave = Math.sin(t * Math.PI * 2 * 0.7) * 7;
  return (
    <svg width={300} height={300} viewBox="0 0 140 140" fill="none">
      <g transform={`rotate(${orbit} 70 70)`} opacity={seg(p, 1)}>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * 45 * Math.PI) / 180;
          const x1 = 70 + Math.cos(a) * 58, y1 = 70 + Math.sin(a) * 58;
          const x2 = 70 + Math.cos(a) * 68, y2 = 70 + Math.sin(a) * 68;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={AMBER} strokeWidth={6} strokeLinecap="round" />;
        })}
      </g>
      <circle cx={70} cy={70} r={50} fill={AMBER} opacity={0.95 * seg(p, 0)} />
      <circle cx={70} cy={48} r={12} fill="#FFFFFF" opacity={seg(p, 2)} />
      <g opacity={seg(p, 3)}>
        <line x1={70} y1={60} x2={70} y2={92} stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" />
        <g transform={`rotate(${wave} 70 70)`}>
          <line x1={70} y1={70} x2={48} y2={56} stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" />
          <line x1={70} y1={70} x2={92} y2={56} stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" />
        </g>
        <line x1={70} y1={92} x2={57} y2={112} stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" />
        <line x1={70} y1={92} x2={83} y2={112} stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" />
      </g>
    </svg>
  );
};

type CardData = {
  context: string;
  headline: string;
  punchline: string;
  Icon: React.FC<IconProps>;
  headlineFontSize: number;
};

const cards: CardData[] = [
  {
    context: "처음엔 다 그래",
    headline: "왜 이것도 못하지?",
    punchline: "못하는 게 부끄러운 게 아니다\n아직 안 해본 것뿐이다",
    Icon: IconTangleSun,
    headlineFontSize: 92,
  },
  {
    context: "자주 하는 착각",
    headline: "일 못하면 나도 못난 건가?",
    punchline: "일의 실력과 사람의 가치는\n전혀 다른 이야기다",
    Icon: IconBalanceSun,
    headlineFontSize: 74,
  },
  {
    context: "시간이 답이다",
    headline: "하다 보면 잘하게 되어있어",
    punchline: "못하는 시간을 버티는 사람이\n결국 잘하는 사람이 된다",
    Icon: IconGrowthSun,
    headlineFontSize: 74,
  },
  {
    context: "실력보다 먼저",
    headline: "에너지는 실력보다 오래 간다",
    punchline: "실력은 쌓을 수 있다\n하지만 에너지는 매일 선택이다",
    Icon: IconBatterySun,
    headlineFontSize: 70,
  },
  {
    context: "결론",
    headline: "선하고 건강한 에너지",
    punchline: "일을 잘하는 것보다\n함께 있으면 힘이 나는 사람이 되자",
    Icon: IconSunPerson,
    headlineFontSize: 84,
  },
];

// Rising warm light particles
const LightParticles: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  return (
    <>
      {Array.from({ length: 24 }).map((_, i) => {
        const baseX = random(`lx${i}`) * 1080;
        const size = 4 + random(`ls${i}`) * 7;
        const speed = 26 + random(`lv${i}`) * 40;
        const y = ((random(`ly${i}`) * 2100 - t * speed) % 2100 + 2100) % 2100 - 90;
        const x = baseX + Math.sin(t * 0.5 + i * 1.7) * 30;
        const shimmer = 0.5 + 0.5 * Math.sin(t * 2.2 + i * 2.1);
        const op = (0.12 + random(`lo${i}`) * 0.22) * shimmer;
        const warm = random(`lc${i}`) > 0.5;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y,
            width: size, height: size, borderRadius: "50%",
            background: warm ? "#FFD9A0" : "#FFFFFF", opacity: op,
            boxShadow: `0 0 ${size * 2}px ${warm ? "#FFC878" : "#FFFFFF"}`,
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
          background: i === active ? CORAL : "rgba(62,45,30,0.22)",
        }} />
      ))}
    </div>
  );
};

const Card: React.FC<CardData> = ({ context, headline, punchline, Icon, headlineFontSize }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const pop = (delay: number, stiff = 120, damping = 20) =>
    spring({ frame: frame - delay, fps, config: { damping, stiffness: stiff, mass: 0.85 } });

  const eCard = pop(0, 90);
  const t1 = pop(4, 130);
  const t2 = pop(16);
  const hl = pop(26, 70, 16); // highlighter swipe
  const tCat = pop(56, 140, 11);

  const pIcon = interpolate(frame, [4, 44], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Jelly icon motion
  const floatY = Math.sin(t * Math.PI * 2 * 0.5) * 10 * t1;
  const jx = 1 + 0.05 * Math.sin(t * Math.PI * 2 * 0.9) * t1;
  const jy = 1 - 0.05 * Math.sin(t * Math.PI * 2 * 0.9) * t1;
  const shadowW = 190 + floatY * 3.5;
  const shadowOp = 0.16 + floatY * 0.006;

  const words = headline.split(" ");
  const lines = punchline.split("\n");
  let wordIdx = 0;

  const catFloat = tCat > 0.95 ? Math.sin(t * Math.PI * 2 * 0.55) * 14 : 0;
  const catWiggle = tCat > 0.95 ? Math.sin(t * Math.PI * 2 * 1.1) * 3 : 0;

  // Exit: content rises away
  const exitUp = interpolate(frame, [CARD_DUR - OVERLAP, CARD_DUR], [0, -70], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const breathe = Math.sin(t * Math.PI * 2 * 0.18) * 4;

  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      fontFamily: `'${FONT}', sans-serif`,
    }}>
      <div style={{
        position: "absolute", top: 200, bottom: 640, left: 60, right: 60,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 34,
        transform: `translateY(${(1 - eCard) * 80 + breathe + exitUp}px)`,
      }}>
        {/* Jelly icon + floating shadow */}
        <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute", left: "50%", bottom: -26,
            transform: "translateX(-50%)",
            width: shadowW, height: 26, borderRadius: "50%",
            background: `rgba(90,50,20,${Math.max(0.05, shadowOp)})`,
            filter: "blur(6px)",
          }} />
          <div style={{
            transform: `translateY(${-70 + t1 * 70}px) scale(${(0.6 + t1 * 0.4) * jx}, ${(0.6 + t1 * 0.4) * jy}) translateY(${floatY}px)`,
            opacity: t1,
          }}>
            <Icon p={pIcon} t={t} />
          </div>
        </div>
        {/* Context: coral tick + label */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
          opacity: t2, transform: `translateY(${(1 - t2) * 16}px)`,
        }}>
          <div style={{ width: 46, height: 6, borderRadius: 3, background: CORAL }} />
          <div style={{ color: SOFT, fontSize: 56, letterSpacing: `${(1 - t2) * 12 + 1}px` }}>
            {context}
          </div>
        </div>
        {/* Headline with highlighter swipe */}
        <div style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap" }}>
          <div style={{
            position: "absolute", top: "6%", bottom: "2%", left: -24, right: -24,
            background: `linear-gradient(90deg, ${AMBER}, ${CORAL})`,
            borderRadius: 20, opacity: 0.85,
            transform: `rotate(-1.2deg) scaleX(${hl})`,
            transformOrigin: "left center",
          }} />
          <div style={{
            position: "relative", display: "flex",
            fontSize: headlineFontSize, fontWeight: 900, color: CHARCOAL, lineHeight: 1.25,
          }}>
            {words.map((word, wi) => {
              const s = spring({
                frame: frame - (30 + wi * 3), fps,
                config: { damping: 13, stiffness: 180, mass: 0.6 },
              });
              return (
                <span key={wi} style={{
                  display: "inline-block", whiteSpace: "pre",
                  transform: `translateY(${(1 - s) * 30}px) scale(${0.6 + s * 0.4})`,
                  transformOrigin: "bottom center",
                  opacity: s,
                }}>{word + (wi < words.length - 1 ? " " : "")}</span>
              );
            })}
          </div>
        </div>
        {/* Punchline: word-by-word rise */}
        <div style={{
          color: INK, fontSize: 60, fontWeight: 700,
          textAlign: "center", lineHeight: 1.5,
        }}>
          {lines.map((line, li) => (
            <div key={li}>
              {line.split(" ").map((word, wi) => {
                const myIdx = wordIdx++;
                const s = spring({
                  frame: frame - (54 + myIdx * 3.5), fps,
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
      {/* Cat with sun halo */}
      <div style={{
        position: "absolute", bottom: 480, width: "100%",
        textAlign: "center", fontSize: 96,
        transform: `translateY(${(1 - tCat) * 90}px) scale(${Math.max(0, tCat)}) translateY(${catFloat}px) rotate(${catWiggle}deg)`,
        opacity: Math.min(1, tCat * 1.4),
      }}>
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          width: 260, height: 260, borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(255,200,100,0.45), transparent 62%)",
        }} />
        <span style={{ position: "relative" }}>🐱</span>
      </div>
    </div>
  );
};

export const MothaedoSunrise: React.FC = () => {
  const frame = useCurrentFrame();
  const g = frame / TOTAL;

  // Dawn → bright morning across the whole video
  const top = interpolateColors(g, [0, 1], ["#E3CFE8", "#FFF9EE"]);
  const mid = interpolateColors(g, [0, 1], ["#F6C2A4", "#FFECC2"]);
  const bot = interpolateColors(g, [0, 1], ["#EF9377", "#FFD27E"]);

  // Rising sun glow
  const sunY = interpolate(g, [0, 1], [1500, 950]);
  const sunOp = 0.45 + 0.4 * g;

  // White light-bleed wipe at each card boundary
  let flash = 0;
  for (let i = 1; i < CARDS; i++) {
    const center = i * (CARD_DUR - OVERLAP) + OVERLAP / 2;
    const d = Math.abs(frame - center);
    flash = Math.max(flash, Math.max(0, 1 - d / 14));
  }
  flash = Math.pow(flash, 1.6) * 0.92;

  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      background: `linear-gradient(180deg, ${top} 0%, ${mid} 55%, ${bot} 100%)`,
    }}>
      <FontLoader />
      {/* Sun */}
      <div style={{
        position: "absolute", left: 540 - 700, top: sunY - 700,
        width: 1400, height: 1400, borderRadius: "50%", opacity: sunOp,
        background: "radial-gradient(circle, rgba(255,241,200,0.95), rgba(255,214,140,0.35) 42%, transparent 68%)",
      }} />
      <LightParticles />
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
      {/* Light-bleed wipe */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: flash,
        background: "radial-gradient(circle at 50% 46%, #FFFFFF 30%, rgba(255,246,222,0.9) 65%, rgba(255,240,210,0.75) 100%)",
      }} />
    </div>
  );
};
