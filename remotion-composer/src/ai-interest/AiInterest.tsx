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

// Card 1: Three phones crowded together — everyone holds AI
const IconCrowdAI: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Left phone */}
    <rect x={8} y={36} width={32} height={56} rx={5} stroke={GRAY} strokeWidth={2.5} />
    <circle cx={16} cy={50} r={3} fill={GRAY} />
    <line x1={20} y1={50} x2={36} y2={50} stroke={GRAY} strokeWidth={1.5} />
    <line x1={14} y1={58} x2={36} y2={58} stroke={GRAY} strokeWidth={1.5} />
    <line x1={14} y1={65} x2={30} y2={65} stroke={GRAY} strokeWidth={1.5} />
    {/* Right phone */}
    <rect x={100} y={36} width={32} height={56} rx={5} stroke={GRAY} strokeWidth={2.5} />
    <circle cx={108} cy={50} r={3} fill={GRAY} />
    <line x1={112} y1={50} x2={128} y2={50} stroke={GRAY} strokeWidth={1.5} />
    <line x1={104} y1={58} x2={128} y2={58} stroke={GRAY} strokeWidth={1.5} />
    <line x1={104} y1={65} x2={122} y2={65} stroke={GRAY} strokeWidth={1.5} />
    {/* Center phone — highlighted */}
    <rect x={44} y={18} width={52} height={86} rx={8} stroke={YELLOW} strokeWidth={4} />
    {/* AI chip inside center phone */}
    <rect x={56} y={38} width={28} height={28} rx={4} stroke={YELLOW} strokeWidth={2.5} />
    <rect x={62} y={44} width={16} height={16} rx={2} fill={YELLOW} opacity={0.3} />
    <line x1={56} y1={48} x2={50} y2={48} stroke={YELLOW} strokeWidth={2} />
    <line x1={56} y1={54} x2={50} y2={54} stroke={YELLOW} strokeWidth={2} />
    <line x1={56} y1={60} x2={50} y2={60} stroke={YELLOW} strokeWidth={2} />
    <line x1={84} y1={48} x2={90} y2={48} stroke={YELLOW} strokeWidth={2} />
    <line x1={84} y1={54} x2={90} y2={54} stroke={YELLOW} strokeWidth={2} />
    <line x1={84} y1={60} x2={90} y2={60} stroke={YELLOW} strokeWidth={2} />
    <line x1={64} y1={38} x2={64} y2={32} stroke={YELLOW} strokeWidth={2} />
    <line x1={70} y1={38} x2={70} y2={32} stroke={YELLOW} strokeWidth={2} />
    <line x1={76} y1={38} x2={76} y2={32} stroke={YELLOW} strokeWidth={2} />
    <line x1={64} y1={66} x2={64} y2={72} stroke={YELLOW} strokeWidth={2} />
    <line x1={70} y1={66} x2={70} y2={72} stroke={YELLOW} strokeWidth={2} />
    <line x1={76} y1={66} x2={76} y2={72} stroke={YELLOW} strokeWidth={2} />
    {/* Screen bottom dots */}
    <circle cx={70} cy={96} r={4} stroke={YELLOW} strokeWidth={2} />
  </svg>
);

// Card 2: Wrench pointing at void — tool with no direction
const IconEmptyTool: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Wrench body */}
    <path d="M28 105 L72 62" stroke={GRAY} strokeWidth={12} strokeLinecap="round" />
    {/* Wrench head */}
    <circle cx={82} cy={52} r={22} stroke={GRAY} strokeWidth={3.5} />
    <circle cx={82} cy={52} r={10} stroke={GRAY} strokeWidth={3} />
    <line x1={72} y1={43} x2={60} y2={31} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    <line x1={91} y1={62} x2={103} y2={74} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    {/* Arrow pointing to void — dotted, fading */}
    <line x1={28} y1={105} x2={12} y2={122} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" strokeDasharray="4 5" opacity={0.4} />
    {/* Empty target at end */}
    <circle cx={8} cy={126} r={5} stroke={YELLOW} strokeWidth={2} opacity={0.3} />
  </svg>
);

// Card 3: Speech bubble with big question mark
const IconBigQuestion: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Speech bubble */}
    <path d="M14 18 C14 10 20 6 28 6 L112 6 C120 6 126 10 126 18 L126 86 C126 94 120 98 112 98 L52 98 L30 122 L36 98 L28 98 C20 98 14 94 14 86 Z" stroke={GRAY} strokeWidth={3} />
    {/* Question mark stem */}
    <path d="M70 72 L70 58 C70 42 90 42 90 54 C90 62 70 66 70 72Z" stroke={YELLOW} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Question mark dot */}
    <circle cx={70} cy={82} r={5} fill={YELLOW} />
  </svg>
);

// Card 4: Flame with wings — passion enables flight
const IconFlameWings: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Left wing */}
    <path d="M58 70 Q30 50 18 30 Q30 48 45 62" stroke={YELLOW} strokeWidth={4} strokeLinecap="round" fill="none" />
    <path d="M55 80 Q18 72 10 50 Q24 64 42 72" stroke={YELLOW} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.7} />
    <path d="M56 90 Q20 96 14 76 Q28 82 44 84" stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.5} />
    {/* Right wing */}
    <path d="M82 70 Q110 50 122 30 Q110 48 95 62" stroke={YELLOW} strokeWidth={4} strokeLinecap="round" fill="none" />
    <path d="M85 80 Q122 72 130 50 Q116 64 98 72" stroke={YELLOW} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.7} />
    <path d="M84 90 Q120 96 126 76 Q112 82 96 84" stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.5} />
    {/* Flame center */}
    <path d="M70 28 C70 28 86 44 86 62 C86 76 78 84 70 84 C62 84 54 76 54 62 C54 44 70 28 70 28Z" fill={YELLOW} opacity={0.9} />
    <path d="M70 42 C70 42 78 52 78 62 C78 70 74 74 70 74 C66 74 62 70 62 62 C62 52 70 42 70 42Z" fill={BG} opacity={0.35} />
    {/* Glow */}
    <circle cx={70} cy={62} r={28} stroke={YELLOW} strokeWidth={1} opacity={0.25} />
  </svg>
);

// Card 5: Two hands — left holds AI (closed/circuit), right open/empty
const IconTwoHands: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Left hand — holding phone */}
    <rect x={12} y={52} width={28} height={46} rx={5} stroke={GRAY} strokeWidth={2.5} />
    {/* Circuit inside phone */}
    <circle cx={22} cy={66} r={3} fill={GRAY} />
    <line x1={25} y1={66} x2={36} y2={66} stroke={GRAY} strokeWidth={1.5} />
    <line x1={22} y1={69} x2={22} y2={76} stroke={GRAY} strokeWidth={1.5} />
    <circle cx={22} cy={76} r={2.5} fill={GRAY} />
    <line x1={24} y1={76} x2={36} y2={76} stroke={GRAY} strokeWidth={1.5} />
    <line x1={36} y1={66} x2={36} y2={84} stroke={GRAY} strokeWidth={1.5} />
    {/* Left hand fingers (closed grip) */}
    <path d="M12 58 Q8 58 8 64 L8 80 Q8 86 12 86" stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    {/* vs divider */}
    <text x={70} y={80} textAnchor="middle" fontSize={13} fill={GRAY} fontFamily="sans-serif" fontWeight={700}>vs</text>
    {/* Right hand — open palm, empty */}
    <path d="M100 52 L100 94 Q100 100 106 100 L128 100 Q134 100 134 94 L134 66 Q134 60 128 60 L122 60 L122 54 Q122 48 116 48 Q110 48 110 54 L110 52 Q110 46 104 46 Q100 46 100 52Z" stroke={YELLOW} strokeWidth={3} fill="none" />
    {/* Question mark above right hand */}
    <path d="M117 22 C117 14 126 14 126 22 C126 28 117 30 117 34" stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    <circle cx={117} cy={40} r={3} fill={YELLOW} />
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
    context: "현실",
    bracket: "AI, AI, AI",
    punchline: "다들 AI를 쥐고 있다\n당연한 세상이 됐다",
    icon: <IconCrowdAI />,
    bracketFontSize: 108,
  },
  {
    context: "문제",
    bracket: "AI는 도구다",
    punchline: "도구만 있고\n방향이 없으면 그냥 빈 손이다",
    icon: <IconEmptyTool />,
    bracketFontSize: 95,
  },
  {
    context: "질문",
    bracket: "그래서 뭘 하고 싶은데?",
    punchline: "AI로 뭘 만들지가 아니라\n넌 뭘 하고 싶냐는 거다",
    icon: <IconBigQuestion />,
    bracketFontSize: 64,
  },
  {
    context: "핵심",
    bracket: "관심사가 먼저다",
    punchline: "하고 싶은 게 있는 사람에게\nAI는 날개가 된다",
    icon: <IconFlameWings />,
    bracketFontSize: 95,
  },
  {
    context: "",
    bracket: "다른 한 손엔 뭘 쥘 거야?",
    punchline: "AI 말고\n네가 진짜 원하는 것",
    icon: <IconTwoHands />,
    bracketFontSize: 78,
  },
];

export const AiInterest: React.FC = () => (
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
