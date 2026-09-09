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

// Card 1: Brick wall blocking an arrow — making things was a barrier
const IconWall: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Brick wall — 3 rows */}
    <rect x={42} y={22} width={38} height={18} rx={3} stroke={GRAY} strokeWidth={2.5} />
    <rect x={84} y={22} width={26} height={18} rx={3} stroke={GRAY} strokeWidth={2.5} />
    <rect x={32} y={44} width={26} height={18} rx={3} stroke={GRAY} strokeWidth={2.5} />
    <rect x={62} y={44} width={38} height={18} rx={3} stroke={GRAY} strokeWidth={2.5} />
    <rect x={104} y={44} width={18} height={18} rx={3} stroke={GRAY} strokeWidth={2.5} />
    <rect x={42} y={66} width={38} height={18} rx={3} stroke={GRAY} strokeWidth={2.5} />
    <rect x={84} y={66} width={26} height={18} rx={3} stroke={GRAY} strokeWidth={2.5} />
    <rect x={32} y={88} width={26} height={18} rx={3} stroke={GRAY} strokeWidth={2.5} />
    <rect x={62} y={88} width={38} height={18} rx={3} stroke={GRAY} strokeWidth={2.5} />
    <rect x={104} y={88} width={18} height={18} rx={3} stroke={GRAY} strokeWidth={2.5} />
    {/* Yellow arrow hitting wall — blocked */}
    <line x1={8} y1={70} x2={38} y2={70} stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
    <line x1={28} y1={60} x2={38} y2={70} stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
    <line x1={28} y1={80} x2={38} y2={70} stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
    {/* Impact X */}
    <line x1={36} y1={60} x2={46} y2={80} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <line x1={46} y1={60} x2={36} y2={80} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
  </svg>
);

// Card 2: Papers with X and one checkmark — cheap failures, fast iteration
const IconFastFail: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Failed paper 1 */}
    <rect x={8} y={30} width={34} height={44} rx={4} stroke={GRAY} strokeWidth={2.5} />
    <line x1={14} y1={41} x2={36} y2={63} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <line x1={36} y1={41} x2={14} y2={63} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    {/* Failed paper 2 */}
    <rect x={53} y={20} width={34} height={44} rx={4} stroke={GRAY} strokeWidth={2.5} />
    <line x1={59} y1={31} x2={81} y2={53} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <line x1={81} y1={31} x2={59} y2={53} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    {/* Success paper — YELLOW */}
    <rect x={92} y={30} width={40} height={52} rx={5} stroke={YELLOW} strokeWidth={3.5} />
    <polyline points="100,58 110,70 128,44" stroke={YELLOW} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Recycling arrows — fast iteration */}
    <path d="M25 82 Q25 100 45 100" stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" fill="none" />
    <path d="M45 100 Q65 100 65 82" stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" fill="none" />
    <line x1={62} y1={76} x2={65} y2={82} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={68} y1={76} x2={65} y2={82} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
  </svg>
);

// Card 3: Trophy high on pedestal — success threshold rising
const IconHighBar: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Pedestal — tall */}
    <rect x={54} y={62} width={32} height={60} rx={3} stroke={GRAY} strokeWidth={2.5} />
    <rect x={42} y={118} width={56} height={10} rx={3} stroke={GRAY} strokeWidth={2.5} />
    {/* Trophy on top */}
    <path d="M70 18 C54 18 50 30 52 40 C54 50 62 56 70 58 C78 56 86 50 88 40 C90 30 86 18 70 18Z" stroke={YELLOW} strokeWidth={3} />
    <line x1={70} y1={58} x2={70} y2={62} stroke={YELLOW} strokeWidth={3} />
    <line x1={56} y1={62} x2={84} y2={62} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={52} y1={30} x2={44} y2={30} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={88} y1={30} x2={96} y2={30} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={44} y1={24} x2={44} y2={38} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={96} y1={24} x2={96} y2={38} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
    {/* People reaching up but can't reach */}
    <circle cx={20} cy={106} r={6} stroke={GRAY} strokeWidth={2} />
    <line x1={20} y1={112} x2={20} y2={128} stroke={GRAY} strokeWidth={2} />
    <line x1={20} y1={117} x2={12} y2={124} stroke={GRAY} strokeWidth={2} />
    {/* Reaching arm up */}
    <line x1={20} y1={117} x2={28} y2={108} stroke={GRAY} strokeWidth={2} />
    <circle cx={118} cy={106} r={6} stroke={GRAY} strokeWidth={2} />
    <line x1={118} y1={112} x2={118} y2={128} stroke={GRAY} strokeWidth={2} />
    <line x1={118} y1={117} x2={110} y2={124} stroke={GRAY} strokeWidth={2} />
    <line x1={118} y1={117} x2={126} y2={108} stroke={GRAY} strokeWidth={2} />
  </svg>
);

// Card 4: All bars rising but bar chart same pattern — average up, differentiation harder
const IconAverageUp: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Before: lower bars (faded) */}
    <rect x={12} y={90} width={16} height={30} rx={2} stroke={GRAY} strokeWidth={2} opacity={0.35} />
    <rect x={34} y={78} width={16} height={42} rx={2} stroke={GRAY} strokeWidth={2} opacity={0.35} />
    <rect x={56} y={86} width={16} height={34} rx={2} stroke={GRAY} strokeWidth={2} opacity={0.35} />
    {/* After: all bars higher (same relative pattern, all up) */}
    <rect x={80} y={54} width={16} height={66} rx={2} stroke={GRAY} strokeWidth={3} />
    <rect x={102} y={42} width={16} height={78} rx={2} stroke={GRAY} strokeWidth={3} />
    <rect x={124} y={50} width={16} height={70} rx={2} stroke={GRAY} strokeWidth={3} />
    {/* Up arrows on each after-bar */}
    <line x1={88} y1={50} x2={88} y2={40} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={84} y1={44} x2={88} y2={40} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={92} y1={44} x2={88} y2={40} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={110} y1={38} x2={110} y2={28} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={106} y1={32} x2={110} y2={28} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={114} y1={32} x2={110} y2={28} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={132} y1={46} x2={132} y2={36} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={128} y1={40} x2={132} y2={36} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={136} y1={40} x2={132} y2={36} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    {/* Baseline */}
    <line x1={8} y1={120} x2={132} y2={120} stroke={GRAY} strokeWidth={2} />
    {/* Arrow connecting before → after */}
    <line x1={50} y1={84} x2={74} y2={68} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="4 3" />
  </svg>
);

// Card 5: Scatter (many attempts) vs deep arrow (focused win)
const IconStrategy: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Divider */}
    <line x1={70} y1={14} x2={70} y2={126} stroke={GRAY} strokeWidth={1.5} strokeDasharray="4 4" />
    {/* Left side: scatter — many short arrows in random directions (GRAY) */}
    <line x1={35} y1={50} x2={18} y2={34} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={18} y1={34} x2={22} y2={42} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={18} y1={34} x2={28} y2={36} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={35} y1={70} x2={10} y2={70} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={10} y1={70} x2={16} y2={64} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={10} y1={70} x2={16} y2={76} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={35} y1={90} x2={14} y2={106} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={14} y1={106} x2={20} y2={98} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={14} y1={106} x2={24} y2={108} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={35} y1={70} x2={20} y2={56} stroke={GRAY} strokeWidth={2} strokeLinecap="round" opacity={0.5} />
    <line x1={35} y1={70} x2={20} y2={86} stroke={GRAY} strokeWidth={2} strokeLinecap="round" opacity={0.5} />
    {/* Right side: single focused arrow hitting bullseye (YELLOW) */}
    {/* Bullseye target */}
    <circle cx={108} cy={70} r={26} stroke={GRAY} strokeWidth={2} opacity={0.5} />
    <circle cx={108} cy={70} r={16} stroke={GRAY} strokeWidth={2} opacity={0.7} />
    <circle cx={108} cy={70} r={7} fill={YELLOW} />
    {/* Deep arrow going in */}
    <line x1={76} y1={70} x2={100} y2={70} stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
    <line x1={92} y1={62} x2={100} y2={70} stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
    <line x1={92} y1={78} x2={100} y2={70} stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
  </svg>
);

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
            whiteSpace: "pre-line",
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

const CARD_DUR = 130;
const OVERLAP = 14;

const cards: CardProps[] = [
  {
    context: "이전",
    bracket: "만드는 게 벽이었다",
    punchline: "시간, 돈, 팀\n다 있어야 시작했다",
    icon: <IconWall />,
    bracketFontSize: 88,
  },
  {
    context: "지금",
    bracket: "실패비용이 사라졌다",
    punchline: "AI로 하루에 만들고\n내일 버릴 수 있다",
    icon: <IconFastFail />,
    bracketFontSize: 88,
  },
  {
    context: "반전",
    bracket: "성공비용은 올라갔다",
    punchline: "모두가 빠르게 만드니\n기준이 달라졌다",
    icon: <IconHighBar />,
    bracketFontSize: 88,
  },
  {
    context: "이유",
    bracket: "평균이 올라갔다",
    punchline: "도구가 평등해지면\n차별화는 더 어려워진다",
    icon: <IconAverageUp />,
    bracketFontSize: 95,
  },
  {
    context: "",
    bracket: "전략이 달라졌다",
    punchline: "실패는 빠르게 많이\n성공은 깊고 다르게",
    icon: <IconStrategy />,
    bracketFontSize: 95,
  },
];

export const AiCost: React.FC = () => (
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
