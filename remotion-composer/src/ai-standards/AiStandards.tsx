import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
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

// Reels safe zone: Instagram UI covers top ~240px, bottom ~340px
const SAFE_TOP = 240;
const SAFE_BOTTOM = 340;

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

const Fade: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 12, dur - 12, dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity: op }}>{children}</AbsoluteFill>;
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

// Card 1: AI robot head with hollow/empty inside — no internal standard
const IconNoStandard: React.FC = () => (
  <svg width={140} height={140} viewBox="0 0 140 140" fill="none">
    <rect x={24} y={38} width={92} height={72} rx={12} stroke={GRAY} strokeWidth={4.5} />
    <rect x={8} y={54} width={10} height={28} rx={5} fill={GRAY} />
    <rect x={122} y={54} width={10} height={28} rx={5} fill={GRAY} />
    <rect x={50} y={20} width={40} height={18} rx={6} stroke={GRAY} strokeWidth={4} fill="none" />
    <line x1={70} y1={20} x2={70} y2={38} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    {/* eyes — dim, no inner light */}
    <circle cx={50} cy={74} r={10} stroke={GRAY} strokeWidth={4} fill="none" />
    <circle cx={90} cy={74} r={10} stroke={GRAY} strokeWidth={4} fill="none" />
    {/* mouth — flat line, no expression */}
    <line x1={50} y1={98} x2={90} y2={98} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    {/* question mark inside — signal of missing standard */}
    <text x={70} y={78} textAnchor="middle" fontSize={22} fill={YELLOW} fontFamily="sans-serif" fontWeight={700}>?</text>
  </svg>
);

// Card 2: arrows going every direction — no direction without standards
const IconRandomDirections: React.FC = () => (
  <svg width={140} height={140} viewBox="0 0 140 140" fill="none">
    <circle cx={70} cy={70} r={14} fill={GRAY} opacity={0.4} />
    {/* arrows radiating outward in many directions — all dim */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
      const rad = (deg * Math.PI) / 180;
      const x1 = 70 + Math.cos(rad) * 20;
      const y1 = 70 + Math.sin(rad) * 20;
      const x2 = 70 + Math.cos(rad) * 50;
      const y2 = 70 + Math.sin(rad) * 50;
      const ax = 70 + Math.cos(rad) * 44;
      const ay = 70 + Math.sin(rad) * 44;
      return (
        <g key={i}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 2 === 0 ? GRAY : `${GRAY}77`} strokeWidth={3.5} strokeLinecap="round" />
          <polygon
            points={`${x2},${y2} ${ax + Math.cos(rad + Math.PI / 2) * 5},${ay + Math.sin(rad + Math.PI / 2) * 5} ${ax + Math.cos(rad - Math.PI / 2) * 5},${ay + Math.sin(rad - Math.PI / 2) * 5}`}
            fill={i % 2 === 0 ? GRAY : `${GRAY}77`}
          />
        </g>
      );
    })}
  </svg>
);

// Card 3: compass/target — standards give direction
const IconCompass: React.FC = () => (
  <svg width={140} height={140} viewBox="0 0 140 140" fill="none">
    <circle cx={70} cy={70} r={56} stroke={GRAY} strokeWidth={3.5} />
    <circle cx={70} cy={70} r={38} stroke={GRAY} strokeWidth={2.5} strokeDasharray="5 6" />
    <circle cx={70} cy={70} r={18} stroke={YELLOW} strokeWidth={3.5} />
    {/* needle pointing up (north) — yellow */}
    <polygon points="70,22 63,70 70,62 77,70" fill={YELLOW} />
    {/* needle pointing down — gray */}
    <polygon points="70,118 63,70 70,78 77,70" fill={GRAY} opacity={0.5} />
    {/* cardinal marks */}
    <line x1={70} y1={14} x2={70} y2={20} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={70} y1={120} x2={70} y2={126} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={14} y1={70} x2={20} y2={70} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={120} y1={70} x2={126} y2={70} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
  </svg>
);

// Card 4: same robot icon, now one dim and one bright — standards unlock AI
const IconAiUnlocked: React.FC = () => (
  <svg width={160} height={120} viewBox="0 0 160 120" fill="none">
    {/* dim robot left */}
    <rect x={8} y={28} width={56} height={46} rx={8} stroke={GRAY} strokeWidth={3.5} opacity={0.45} />
    <circle cx={28} cy={50} r={6} stroke={GRAY} strokeWidth={3} fill="none" opacity={0.45} />
    <circle cx={48} cy={50} r={6} stroke={GRAY} strokeWidth={3} fill="none" opacity={0.45} />
    <line x1={28} y1={64} x2={48} y2={64} stroke={GRAY} strokeWidth={3} strokeLinecap="round" opacity={0.45} />
    {/* arrow between */}
    <path d="M70 62 L90 62" stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    <polygon points="90,62 84,57 84,67" fill={YELLOW} />
    {/* bright robot right — with standard = yellow eyes */}
    <rect x={96} y={28} width={56} height={46} rx={8} stroke={YELLOW} strokeWidth={3.5} />
    <circle cx={116} cy={50} r={6} stroke={YELLOW} strokeWidth={3} fill={`${YELLOW}44`} />
    <circle cx={136} cy={50} r={6} stroke={YELLOW} strokeWidth={3} fill={`${YELLOW}44`} />
    {/* smile */}
    <path d="M114 66 Q126 74 138 66" stroke={YELLOW} strokeWidth={3} strokeLinecap="round" fill="none" />
    {/* person hand giving key / standard — small figure above arrow */}
    <circle cx={80} cy={28} r={8} stroke={WHITE} strokeWidth={2.5} fill="none" />
    <path d="M80 36 L80 52" stroke={WHITE} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={70} y1={44} x2={90} y2={44} stroke={WHITE} strokeWidth={2.5} strokeLinecap="round" />
  </svg>
);

// Card 5: person on summit with flag
const IconWinner: React.FC = () => (
  <svg width={140} height={140} viewBox="0 0 140 140" fill="none">
    {/* mountain */}
    <path d="M10 120 L70 30 L130 120 Z" stroke={GRAY} strokeWidth={4} fill="none" strokeLinejoin="round" />
    {/* person at summit */}
    <circle cx={70} cy={30} r={10} stroke={YELLOW} strokeWidth={4} fill="none" />
    {/* flag pole */}
    <line x1={80} y1={26} x2={80} y2={10} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    {/* flag */}
    <path d="M80 10 L104 16 L80 22 Z" fill={YELLOW} />
    {/* body */}
    <line x1={70} y1={40} x2={70} y2={64} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <line x1={58} y1={50} x2={82} y2={50} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <line x1={70} y1={64} x2={60} y2={82} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <line x1={70} y1={64} x2={80} y2={82} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
  </svg>
);

// ─── Card Component ───────────────────────────────────────────────────────────

type CardProps = {
  context: string;
  bracket: string;
  punchline: string;
  icon: React.ReactNode;
  iconW?: number;
};

const Card: React.FC<CardProps> = ({ context, bracket, punchline, icon, iconW = 140 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const pop = (delay: number, stiff = 120) =>
    spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: stiff, mass: 0.85 } });

  const t1 = pop(4, 130);
  const t2 = pop(16);
  const t3 = pop(30);
  const t4 = pop(46);
  const tCat = pop(54, 100);

  // Icon: idle breathe after settling
  const iconIdle = t1 > 0.98 ? Math.sin(t * Math.PI * 2 * 0.6) * 6 : 0;
  const iconRot = t1 > 0.98 ? Math.sin(t * Math.PI * 2 * 0.4) * 2 : 0;

  // Bracket glow pulse
  const glowSize = 28 + 12 * Math.sin(t * Math.PI * 2 * 0.8);

  // Cat: float up-down + entry bounce
  const catFloat = tCat > 0.95 ? Math.sin(t * Math.PI * 2 * 0.55) * 14 : 0;
  const catWiggle = tCat > 0.95 ? Math.sin(t * Math.PI * 2 * 1.1) * 3 : 0;

  return (
    <AbsoluteFill style={{ background: BG }}>
      {/* Content block */}
      <div
        style={{
          position: "absolute",
          top: 200,
          left: 0,
          right: 0,
          bottom: 640,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Icon — spin-drop entry + gentle idle breathe */}
        <div
          style={{
            opacity: t1,
            transform: `scale(${0.5 + 0.5 * t1}) translateY(${(1 - t1) * 60 + iconIdle}px) rotate(${(1 - t1) * -20 + iconRot}deg)`,
            marginBottom: 44,
            width: iconW,
            display: "flex",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>

        {/* Context — slide in from left */}
        <div
          style={{
            opacity: t2,
            transform: `translateX(${(1 - t2) * -40}px) translateY(${(1 - t2) * 10}px)`,
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: 54,
            color: GRAY,
            textAlign: "center",
            letterSpacing: -0.5,
            marginBottom: 18,
            paddingLeft: 60,
            paddingRight: 60,
            lineHeight: 1.4,
          }}
        >
          {context}
        </div>

        {/* Bracket — scale-pop + continuous glow pulse */}
        <div
          style={{
            opacity: t3,
            transform: `scale(${0.75 + 0.25 * t3})`,
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 112,
            color: YELLOW,
            textAlign: "center",
            letterSpacing: -3,
            lineHeight: 1.1,
            paddingLeft: 30,
            paddingRight: 30,
            marginBottom: 26,
            textShadow: t3 > 0.9
              ? `0 0 ${glowSize}px ${YELLOW}55, 0 0 ${glowSize * 2}px ${YELLOW}22`
              : "none",
          }}
        >
          {`[ ${bracket} ]`}
        </div>

        {/* Punchline — slide in from right */}
        <div
          style={{
            opacity: t4,
            transform: `translateX(${(1 - t4) * 40}px) translateY(${(1 - t4) * 10}px)`,
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 56,
            color: WHITE,
            textAlign: "center",
            letterSpacing: -0.5,
            paddingLeft: 60,
            paddingRight: 60,
            lineHeight: 1.4,
          }}
        >
          {punchline}
        </div>
      </div>

      {/* Cat — large, floating, slight wiggle */}
      <div
        style={{
          position: "absolute",
          bottom: 480,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          fontSize: 96,
          opacity: tCat,
          transform: `scale(${0.4 + 0.6 * tCat}) translateY(${(1 - tCat) * 40 - catFloat}px) rotate(${catWiggle}deg)`,
        }}
      >
        🐱
      </div>
    </AbsoluteFill>
  );
};

// ─── Composition ──────────────────────────────────────────────────────────────

const CARD_DUR = 130;
const OVERLAP = 14;

const cards: CardProps[] = [
  {
    context: "AI는",
    bracket: "기준이 없다",
    punchline: "판단은 사람 몫이다",
    icon: <IconNoStandard />,
  },
  {
    context: "뭘 시킬지 모르면",
    bracket: "시켜도 소용없다",
    punchline: "AI는 방향을 스스로 정하지 못한다",
    icon: <IconRandomDirections />,
  },
  {
    context: "좋은 질문은",
    bracket: "기준에서 나온다",
    punchline: "기준이 없으면 질문도 흐리다",
    icon: <IconCompass />,
  },
  {
    context: "기준을 먼저 잡으면",
    bracket: "AI가 달라진다",
    punchline: "같은 도구도 다르게 쓰인다",
    icon: <IconAiUnlocked />,
    iconW: 160,
  },
  {
    context: "AI 시대의 경쟁력",
    bracket: "기준 있는 사람",
    punchline: "방향을 아는 사람이 이긴다",
    icon: <IconWinner />,
  },
];

export const AiStandards: React.FC = () => (
  <AbsoluteFill style={{ background: BG }}>
    <FontLoader />
    {cards.map((card, i) => (
      <Sequence
        key={i}
        from={(CARD_DUR - OVERLAP) * i}
        durationInFrames={CARD_DUR}
      >
        <Fade dur={CARD_DUR}>
          <Card {...card} />
        </Fade>
      </Sequence>
    ))}
  </AbsoluteFill>
);
