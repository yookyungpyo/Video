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

// Card 1: Dice (GRAY) + % (YELLOW) — AI is probabilistic, not deterministic
const IconProbability: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Dice */}
    <rect x={8} y={22} width={76} height={76} rx={12} stroke={GRAY} strokeWidth={4.5} fill="none" />
    <circle cx={28} cy={42} r={8} fill={GRAY} />
    <circle cx={46} cy={60} r={8} fill={GRAY} />
    <circle cx={64} cy={78} r={8} fill={GRAY} />
    {/* % dominant right */}
    <text x={112} y={108} textAnchor="middle" fontSize={72} fill={YELLOW} fontFamily="sans-serif" fontWeight={900}>%</text>
  </svg>
);

// Card 2: Warning triangle (GRAY) + ! (YELLOW) — critical, irreversible failure
const IconCritical: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <path d="M70 12 L128 118 L12 118 Z" stroke={GRAY} strokeWidth={5} strokeLinejoin="round" fill="none" />
    <line x1={70} y1={42} x2={70} y2={84} stroke={YELLOW} strokeWidth={10} strokeLinecap="round" />
    <circle cx={70} cy={100} r={7} fill={YELLOW} />
  </svg>
);

// Card 3: ✓ circle (GRAY) + ? center (YELLOW) + ✗ circle (GRAY) — neither guaranteed
const IconUncertain: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Left: checkmark circle */}
    <circle cx={30} cy={62} r={26} stroke={GRAY} strokeWidth={4} fill="none" />
    <path d="M17 62 L26 76 L46 48" stroke={GRAY} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    {/* Right: X circle */}
    <circle cx={110} cy={62} r={26} stroke={GRAY} strokeWidth={4} fill="none" />
    <line x1={97} y1={49} x2={123} y2={75} stroke={GRAY} strokeWidth={5.5} strokeLinecap="round" />
    <line x1={123} y1={49} x2={97} y2={75} stroke={GRAY} strokeWidth={5.5} strokeLinecap="round" />
    {/* Center uncertainty */}
    <text x={70} y={80} textAnchor="middle" fontSize={40} fill={YELLOW} fontFamily="sans-serif" fontWeight={900}>?</text>
  </svg>
);

// Card 4: Robot (GRAY) → ! (YELLOW) — accountability falls on humans
const IconAccountability: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Robot head */}
    <rect x={8} y={24} width={68} height={62} rx={10} stroke={GRAY} strokeWidth={4} fill="none" />
    <circle cx={28} cy={46} r={8} fill={GRAY} />
    <circle cx={56} cy={46} r={8} fill={GRAY} />
    {/* Antenna */}
    <line x1={42} y1={24} x2={42} y2={12} stroke={GRAY} strokeWidth={3.5} strokeLinecap="round" />
    <circle cx={42} cy={8} r={5} fill={GRAY} />
    {/* Mouth */}
    <line x1={22} y1={70} x2={62} y2={70} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    {/* Arrow → */}
    <line x1={82} y1={55} x2={96} y2={55} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <polygon points="104,55 94,48 94,62" fill={YELLOW} />
    {/* Large ! */}
    <line x1={118} y1={18} x2={118} y2={74} stroke={YELLOW} strokeWidth={11} strokeLinecap="round" />
    <circle cx={118} cy={92} r={8} fill={YELLOW} />
  </svg>
);

// Card 5: Bullseye (GRAY) + center dot (YELLOW) — precision: knowing where to use AI
const IconPrecision: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <circle cx={70} cy={70} r={62} stroke={GRAY} strokeWidth={3} fill="none" />
    <circle cx={70} cy={70} r={40} stroke={GRAY} strokeWidth={3} fill="none" />
    <circle cx={70} cy={70} r={20} stroke={GRAY} strokeWidth={3} fill="none" />
    <circle cx={70} cy={70} r={10} fill={YELLOW} />
    {/* Crosshair */}
    <line x1={4} y1={70} x2={46} y2={70} stroke={GRAY} strokeWidth={2} strokeLinecap="round" strokeDasharray="4 3" />
    <line x1={94} y1={70} x2={136} y2={70} stroke={GRAY} strokeWidth={2} strokeLinecap="round" strokeDasharray="4 3" />
    <line x1={70} y1={4} x2={70} y2={46} stroke={GRAY} strokeWidth={2} strokeLinecap="round" strokeDasharray="4 3" />
    <line x1={70} y1={94} x2={70} y2={136} stroke={GRAY} strokeWidth={2} strokeLinecap="round" strokeDasharray="4 3" />
  </svg>
);

// ─── Card Component ───────────────────────────────────────────────────────────

type CardProps = {
  context: string;
  bracket: string;
  punchline: string;
  icon: React.ReactNode;
  iconW?: number;
  bracketFontSize?: number;
};

const Card: React.FC<CardProps> = ({ context, bracket, punchline, icon, iconW = 280, bracketFontSize = 108 }) => {
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

  const iconIdle = t1 > 0.98 ? Math.sin(t * Math.PI * 2 * 0.6) * 6 : 0;
  const iconRot = t1 > 0.98 ? Math.sin(t * Math.PI * 2 * 0.4) * 2 : 0;

  const glowSize = 28 + 12 * Math.sin(t * Math.PI * 2 * 0.8);

  const catFloat = tCat > 0.95 ? Math.sin(t * Math.PI * 2 * 0.55) * 14 : 0;
  const catWiggle = tCat > 0.95 ? Math.sin(t * Math.PI * 2 * 1.1) * 3 : 0;

  return (
    <AbsoluteFill style={{ background: BG }}>
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

        {context ? (
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
        ) : null}

        <div
          style={{
            opacity: t3,
            transform: `scale(${0.75 + 0.25 * t3})`,
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: bracketFontSize,
            color: YELLOW,
            textAlign: "center",
            letterSpacing: -3,
            lineHeight: 1.1,
            paddingLeft: 30,
            paddingRight: 30,
            marginBottom: 26,
            whiteSpace: bracketFontSize < 108 ? "nowrap" : undefined,
            textShadow: t3 > 0.9
              ? `0 0 ${glowSize}px ${YELLOW}55, 0 0 ${glowSize * 2}px ${YELLOW}22`
              : "none",
          }}
        >
          {`[ ${bracket} ]`}
        </div>

        <div
          style={{
            opacity: t4,
            transform: `translateX(${(1 - t4) * 40}px) translateY(${(1 - t4) * 10}px)`,
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 52,
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
    context: "AI의 본질",
    bracket: "AI는 확률이다",
    punchline: "맞을 가능성이 높을 뿐, 틀릴 확률도 항상 존재한다",
    icon: <IconProbability />,
  },
  {
    context: "크리티컬한 업무",
    bracket: "한 번의 실수가",
    punchline: "되돌릴 수 없는 결과를 만든다",
    icon: <IconCritical />,
  },
  {
    context: "확정적 정의 불가",
    bracket: '"맞다" or "아니다"',
    punchline: "AI는 이걸 보장하지 못한다",
    icon: <IconUncertain />,
    bracketFontSize: 84,
  },
  {
    context: "검증 책임",
    bracket: "AI가 틀렸을 때",
    punchline: "책임지는 건 결국 사람이다",
    icon: <IconAccountability />,
  },
  {
    context: "",
    bracket: "AI를 보수적으로",
    punchline: "쓸 곳 가릴 줄 아는 게 진짜 실력이다",
    icon: <IconPrecision />,
  },
];

export const AiCaution: React.FC = () => (
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
