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

// Card 1: Robot (AI) + speed → growing bill stack = handoff cost rises
const IconAIHandoff: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <rect x={8} y={34} width={48} height={40} rx={8} stroke={GRAY} strokeWidth={3.5} fill="none" />
    <rect x={18} y={45} width={9} height={9} rx={2} fill={GRAY} />
    <rect x={37} y={45} width={9} height={9} rx={2} fill={GRAY} />
    <line x1={20} y1={62} x2={46} y2={62} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={32} y1={34} x2={32} y2={24} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <circle cx={32} cy={20} r={5} fill={YELLOW} />
    <line x1={58} y1={46} x2={72} y2={46} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={56} y1={54} x2={70} y2={54} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={58} y1={62} x2={72} y2={62} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={76} y1={54} x2={90} y2={54} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    <polygon points="98,54 87,48 87,60" fill={GRAY} />
    <rect x={102} y={84} width={30} height={14} rx={3} stroke={YELLOW} strokeWidth={3} fill="none" />
    <rect x={102} y={68} width={30} height={14} rx={3} stroke={YELLOW} strokeWidth={3} fill="none" />
    <rect x={102} y={52} width={30} height={14} rx={3} stroke={YELLOW} strokeWidth={3} fill="none" />
    <line x1={117} y1={46} x2={117} y2={32} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <polygon points="117,24 109,35 125,35" fill={YELLOW} />
  </svg>
);

// Card 2: Document with missing context (big ?) + must restart from top
const IconMissingContext: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <path d="M18 12 L106 12 L106 128 L18 128 Z" stroke={GRAY} strokeWidth={3.5} fill="none" />
    <line x1={30} y1={30} x2={94} y2={30} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <line x1={30} y1={44} x2={94} y2={44} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <text x={62} y={94} textAnchor="middle" fontSize={52} fill={YELLOW} fontFamily="sans-serif" fontWeight={900}>?</text>
    <line x1={30} y1={110} x2={94} y2={110} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="4 5" />
    <line x1={30} y1={122} x2={70} y2={122} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="4 5" />
    <path d="M122 110 Q134 70 122 28" stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    <polygon points="122,20 114,32 130,32" fill={YELLOW} />
  </svg>
);

// Card 3: Done checkmark + failed handoff arrow + two people can't receive (X marks)
const IconHandoffFail: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <circle cx={32} cy={70} r={26} stroke={GRAY} strokeWidth={4} fill="none" />
    <path d="M18 70 L28 82 L50 56" stroke={GRAY} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    <line x1={60} y1={70} x2={82} y2={70} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" strokeDasharray="5 4" />
    <polygon points="90,70 80,64 80,76" fill={YELLOW} />
    <line x1={92} y1={44} x2={106} y2={58} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={106} y1={44} x2={92} y2={58} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={92} y1={104} x2={106} y2={118} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={106} y1={104} x2={92} y2={118} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <circle cx={112} cy={36} r={10} stroke={GRAY} strokeWidth={3} fill="none" />
    <line x1={112} y1={46} x2={112} y2={62} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <path d="M112 54 L98 62" stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <line x1={104} y1={62} x2={112} y2={76} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <line x1={120} y1={62} x2={112} y2={76} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <circle cx={112} cy={96} r={10} stroke={GRAY} strokeWidth={3} fill="none" />
    <line x1={112} y1={106} x2={112} y2={122} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <path d="M112 114 L98 122" stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <line x1={104} y1={122} x2={112} y2={136} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <line x1={120} y1={122} x2={112} y2={136} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
  </svg>
);

// Card 4: Two rising trend lines on axes — speed and cost both climbing
const IconBothRise: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <line x1={18} y1={122} x2={18} y2={18} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={18} y1={122} x2={132} y2={122} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <path d="M18 122 Q62 108 98 58" stroke={GRAY} strokeWidth={4.5} strokeLinecap="round" fill="none" />
    <circle cx={98} cy={58} r={6} fill={GRAY} />
    <text x={100} y={52} fontSize={12} fill={GRAY} fontFamily="sans-serif" fontWeight={700}>속도</text>
    <path d="M18 122 Q62 104 112 36" stroke={YELLOW} strokeWidth={4.5} strokeLinecap="round" fill="none" />
    <circle cx={112} cy={36} r={6} fill={YELLOW} />
    <text x={114} y={30} fontSize={12} fill={YELLOW} fontFamily="sans-serif" fontWeight={700}>비용</text>
  </svg>
);

// Card 5: Document with checkmark X'd out + speech bubble ? = can't explain = not done
const IconCantExplain: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <path d="M14 24 L90 24 L106 40 L106 124 L14 124 Z" stroke={GRAY} strokeWidth={3.5} fill="none" strokeLinejoin="round" />
    <path d="M90 24 L90 40 L106 40" stroke={GRAY} strokeWidth={3} strokeLinejoin="round" />
    <path d="M34 74 L50 90 L76 56" stroke={GRAY} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    <line x1={22} y1={32} x2={98} y2={116} stroke={YELLOW} strokeWidth={7} strokeLinecap="round" opacity={0.9} />
    <line x1={98} y1={32} x2={22} y2={116} stroke={YELLOW} strokeWidth={7} strokeLinecap="round" opacity={0.9} />
    <path d="M112 18 Q130 18 130 34 Q130 50 118 52 L115 62 L108 52 Q96 50 96 34 Q96 18 112 18 Z"
      stroke={YELLOW} strokeWidth={3} fill="none" strokeLinejoin="round" />
    <text x={113} y={42} textAnchor="middle" fontSize={20} fill={YELLOW} fontFamily="sans-serif" fontWeight={900}>?</text>
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

const Card: React.FC<CardProps> = ({ context, bracket, punchline, icon, iconW = 280 }) => {
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
            fontSize: 108,
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
    context: "AI 시대의 아이러니",
    bracket: "AI가 빠를수록",
    punchline: "넘기는 비용은 더 커진다",
    icon: <IconAIHandoff />,
  },
  {
    context: "AI 결과물의 특징",
    bracket: "맥락이 없다",
    punchline: "받는 사람은 처음부터 읽어야 한다",
    icon: <IconMissingContext />,
  },
  {
    context: "실제로 일어나는 일",
    bracket: "완성됐는데",
    punchline: "팀원 누구도 이어받지 못한다",
    icon: <IconHandoffFail />,
  },
  {
    context: "진짜 병목",
    bracket: "속도는 올랐다",
    punchline: "협업 비용도 같이 올랐다",
    icon: <IconBothRise />,
  },
  {
    context: "",
    bracket: "설명 못 하면",
    punchline: "완성이 아니다",
    icon: <IconCantExplain />,
  },
];

export const Handoff: React.FC = () => (
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
