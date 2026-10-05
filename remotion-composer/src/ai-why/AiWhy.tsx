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
const popIn = (p: number, k: number) => ({
  opacity: seg(p, k),
  transform: `translate(0 ${(1 - seg(p, k)) * 14})`,
});

const BLOB = "M70 10 C108 4 134 34 130 72 C126 108 104 134 68 130 C32 126 6 104 10 68 C14 34 36 14 70 10 Z";

type IconProps = { p: number; t: number };

// Shared robot head: charcoal rounded square, blinking white eyes, bobbing coral antenna
const RobotHead: React.FC<IconProps & { cx: number; cy: number; s: number; k: number }> = ({ p, t, cx, cy, s, k }) => {
  const blink = (t % 2.6) > 2.45 ? 0.15 : 1;
  const bob = Math.sin(t * Math.PI * 2 * 1.2) * 3;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`} {...popIn(p, k)}>
      <line x1={0} y1={-30} x2={0} y2={-44 + bob} stroke={CHARCOAL} strokeWidth={4} strokeLinecap="round" />
      <circle cx={0} cy={-46 + bob} r={6} fill={CORAL} />
      <rect x={-34} y={-30} width={68} height={58} rx={16} fill={CHARCOAL} />
      <rect x={-20} y={-12} width={12} height={16 * blink} rx={5} fill="#FFFFFF"
        transform={`translate(0 ${(1 - blink) * 7})`} />
      <rect x={8} y={-12} width={12} height={16 * blink} rx={5} fill="#FFFFFF"
        transform={`translate(0 ${(1 - blink) * 7})`} />
      <rect x={-14} y={12} width={28} height={5} rx={2.5} fill="#FFFFFF" opacity={0.7} />
    </g>
  );
};

// Card 1: AI does everything — robot + orbiting pen / picture / code chips
const IconAllSkills: React.FC<IconProps> = ({ p, t }) => {
  const orbit = t * 50;
  const chip = (i: number) => {
    const a = ((orbit + i * 120) * Math.PI) / 180;
    return { x: 70 + Math.cos(a) * 48, y: 74 + Math.sin(a) * 40 };
  };
  const c0 = chip(0), c1 = chip(1), c2 = chip(2);
  return (
    <svg width={300} height={300} viewBox="0 0 140 140" fill="none">
      <path d={BLOB} fill="#FFFFFF" opacity={0.9 * seg(p, 0)} />
      <RobotHead p={p} t={t} cx={70} cy={76} s={0.78} k={1} />
      <g opacity={seg(p, 3)}>
        <g transform={`translate(${c0.x} ${c0.y})`}>
          <circle r={12} fill={CORAL} />
          <path d="M-5 5 L4 -4 L6 -2 L-3 7 Z" fill="#FFFFFF" />
        </g>
        <g transform={`translate(${c1.x} ${c1.y})`}>
          <circle r={12} fill={AMBER} />
          <path d="M-6 5 L-1 -2 L2 2 L4 -1 L7 5 Z" fill="#FFFFFF" />
        </g>
        <g transform={`translate(${c2.x} ${c2.y})`}>
          <circle r={12} fill={CORAL} />
          <path d="M-3 -5 L-7 0 L-3 5 M3 -5 L7 0 L3 5" stroke="#FFFFFF" strokeWidth={2.5}
            strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      </g>
    </svg>
  );
};

// Card 2: AI has no wants — robot with an EMPTY thought bubble
const IconEmptyBubble: React.FC<IconProps> = ({ p, t }) => {
  const pulse = 1 + 0.06 * Math.sin(t * Math.PI * 2 * 0.8);
  const dashOff = -t * 18;
  return (
    <svg width={300} height={300} viewBox="0 0 140 140" fill="none">
      <path d={BLOB} fill="#FFE8D2" opacity={0.95 * seg(p, 0)} />
      <RobotHead p={p} t={t} cx={52} cy={96} s={0.62} k={1} />
      <g transform={`translate(98 44) scale(${pulse}) translate(-98 -44)`} opacity={seg(p, 3)}>
        <circle cx={98} cy={44} r={24} stroke={CORAL} strokeWidth={4.5}
          strokeDasharray="7 6" strokeDashoffset={dashOff} />
        <circle cx={76} cy={68} r={4.5} fill={CORAL} />
        <circle cx={68} cy={76} r={3} fill={CORAL} />
      </g>
    </svg>
  );
};

// Card 3: desire comes from lack — half-empty glass with sloshing coral liquid
const IconHalfGlass: React.FC<IconProps> = ({ p, t }) => {
  const slosh = Math.sin(t * Math.PI * 2 * 0.7) * 5;
  const level = 92;
  const surface = `M40 ${level - slosh} Q70 ${level + slosh * 1.6} 100 ${level + slosh} L97 116 Q70 122 43 116 Z`;
  return (
    <svg width={300} height={300} viewBox="0 0 140 140" fill="none">
      <path d={BLOB} fill="#FFDFA8" opacity={0.95 * seg(p, 0)} />
      <path d={surface} fill={CORAL} opacity={seg(p, 3)} />
      <path d="M34 34 L44 118 Q70 126 96 118 L106 34" stroke={CHARCOAL} strokeWidth={6}
        strokeLinecap="round" strokeLinejoin="round" {...popIn(p, 1)} />
      <line x1={50} y1={52} x2={50} y2={68} stroke="#FFFFFF" strokeWidth={4}
        strokeLinecap="round" opacity={0.8 * seg(p, 4)} />
    </svg>
  );
};

// Card 4: "how" = AI gear, "why" = human question mark
const IconHowWhy: React.FC<IconProps> = ({ p, t }) => {
  const spin = (t * 70) % 360;
  const hop = Math.abs(Math.sin(t * Math.PI * 2 * 0.8)) * -8;
  const teeth = Array.from({ length: 8 }).map((_, i) => (
    <rect key={i} x={-5} y={-30} width={10} height={12} rx={2} fill={CHARCOAL}
      transform={`rotate(${i * 45})`} />
  ));
  return (
    <svg width={300} height={300} viewBox="0 0 140 140" fill="none">
      <path d={BLOB} fill="#FFD28A" opacity={0.95 * seg(p, 0)} />
      <g transform={`translate(46 74) rotate(${spin})`} opacity={seg(p, 1)}>
        {teeth}
        <circle r={21} fill={CHARCOAL} />
        <circle r={8} fill="#FFD28A" />
      </g>
      <g transform={`translate(0 ${hop})`} opacity={seg(p, 3)}>
        <circle cx={100} cy={70} r={24} fill={CORAL} />
        <text x={100} y={82} textAnchor="middle" fontSize={34} fontWeight={900}
          fill="#FFFFFF" fontFamily={`'${FONT}', sans-serif`}>왜</text>
      </g>
    </svg>
  );
};

// Card 5: the blob IS the sun — person who knows "why"
const IconSunPerson: React.FC<IconProps> = ({ p, t }) => {
  const orbit = (t * 40) % 360;
  const wave = Math.sin(t * Math.PI * 2 * 0.7) * 7;
  return (
    <svg width={300} height={300} viewBox="0 0 140 140" fill="none">
      <g transform={`rotate(${orbit} 70 70)`} opacity={seg(p, 1)}>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * 45 * Math.PI) / 180;
          return <line key={i}
            x1={70 + Math.cos(a) * 58} y1={70 + Math.sin(a) * 58}
            x2={70 + Math.cos(a) * 68} y2={70 + Math.sin(a) * 68}
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
    context: "요즘 AI는",
    headline: "글도 그림도 코드도 척척",
    punchline: "시키면 뭐든 해낸다\n사람보다 빠르고 지치지도 않는다",
    Icon: IconAllSkills,
    headlineFontSize: 80,
  },
  {
    context: "그런데 단 하나",
    headline: "AI는 '원하는 것'이 없다",
    punchline: "스스로 하고 싶은 게 없다\n누가 시키기 전엔 아무것도 하지 않는다",
    Icon: IconEmptyBubble,
    headlineFontSize: 78,
  },
  {
    context: "왜?",
    headline: "욕망은 결핍에서 나온다",
    punchline: "결핍을 겪어본 적 없는 존재는\n무언가를 원할 이유가 없다",
    Icon: IconHalfGlass,
    headlineFontSize: 84,
  },
  {
    context: "그래서",
    headline: "'어떻게'는 AI가, '왜'는 사람이",
    punchline: "방법은 AI가 찾아준다\n하지만 '왜'는 사람이 고민해야 한다",
    Icon: IconHowWhy,
    headlineFontSize: 62,
  },
  {
    context: "결론",
    headline: "왜 하는지 아는 사람",
    punchline: "AI 시대의 경쟁력은 능력이 아니라\n이유를 고민하는 힘이다",
    Icon: IconSunPerson,
    headlineFontSize: 88,
  },
];

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
  const hl = pop(26, 70, 16);
  const tCat = pop(56, 140, 11);

  const pIcon = interpolate(frame, [4, 44], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

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
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
          opacity: t2, transform: `translateY(${(1 - t2) * 16}px)`,
        }}>
          <div style={{ width: 46, height: 6, borderRadius: 3, background: CORAL }} />
          <div style={{ color: SOFT, fontSize: 56, letterSpacing: `${(1 - t2) * 12 + 1}px` }}>
            {context}
          </div>
        </div>
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

export const AiWhy: React.FC = () => {
  const frame = useCurrentFrame();
  const g = frame / TOTAL;

  const top = interpolateColors(g, [0, 1], ["#E3CFE8", "#FFF9EE"]);
  const mid = interpolateColors(g, [0, 1], ["#F6C2A4", "#FFECC2"]);
  const bot = interpolateColors(g, [0, 1], ["#EF9377", "#FFD27E"]);

  const sunY = interpolate(g, [0, 1], [1500, 950]);
  const sunOp = 0.45 + 0.4 * g;

  let flash = 0;
  for (let i = 1; i < CARDS; i++) {
    const center = i * (CARD_DUR - OVERLAP) + OVERLAP / 2;
    flash = Math.max(flash, Math.max(0, 1 - Math.abs(frame - center) / 14));
  }
  flash = Math.pow(flash, 1.6) * 0.92;

  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      background: `linear-gradient(180deg, ${top} 0%, ${mid} 55%, ${bot} 100%)`,
    }}>
      <FontLoader />
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
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: flash,
        background: "radial-gradient(circle at 50% 46%, #FFFFFF 30%, rgba(255,246,222,0.9) 65%, rgba(255,240,210,0.75) 100%)",
      }} />
    </div>
  );
};
