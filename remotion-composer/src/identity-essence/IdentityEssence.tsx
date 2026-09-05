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

// Card 1: ID badge with X — title is not the self
const IconBadgeX: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <rect x={18} y={30} width={104} height={82} rx={8} stroke={GRAY} strokeWidth={3.5} />
    <rect x={50} y={19} width={40} height={14} rx={5} stroke={GRAY} strokeWidth={2.5} />
    <line x1={32} y1={60} x2={108} y2={60} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <line x1={42} y1={73} x2={98} y2={73} stroke={GRAY} strokeWidth={2} strokeLinecap="round" />
    <line x1={48} y1={84} x2={92} y2={84} stroke={GRAY} strokeWidth={2} strokeLinecap="round" />
    <line x1={24} y1={36} x2={116} y2={106} stroke={YELLOW} strokeWidth={10} strokeLinecap="round" />
    <line x1={116} y1={36} x2={24} y2={106} stroke={YELLOW} strokeWidth={10} strokeLinecap="round" />
  </svg>
);

// Card 2: Two circles — building (company-me) vs upward arrow (free-me)
const IconTwoSelves: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <circle cx={35} cy={70} r={28} stroke={GRAY} strokeWidth={3} />
    <rect x={23} y={54} width={24} height={30} rx={2} fill={GRAY} />
    <rect x={27} y={59} width={6} height={5} rx={1} fill={BG} />
    <rect x={37} y={59} width={6} height={5} rx={1} fill={BG} />
    <rect x={27} y={68} width={6} height={5} rx={1} fill={BG} />
    <rect x={37} y={68} width={6} height={5} rx={1} fill={BG} />
    <rect x={30} y={75} width={11} height={9} rx={1} fill={BG} />
    <text x={70} y={75} textAnchor="middle" fontSize={14} fill={GRAY} fontFamily="sans-serif" fontWeight={700}>vs</text>
    <circle cx={105} cy={70} r={28} stroke={YELLOW} strokeWidth={3.5} />
    <line x1={105} y1={88} x2={105} y2={56} stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
    <line x1={105} y1={56} x2={95} y2={67} stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
    <line x1={105} y1={56} x2={115} y2={67} stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
  </svg>
);

// Card 3: Diamond with sparkles — polish your core self
const IconPolish: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <polygon points="70,18 112,54 70,122 28,54" stroke={GRAY} strokeWidth={3.5} />
    <line x1={28} y1={54} x2={112} y2={54} stroke={GRAY} strokeWidth={2} />
    <line x1={70} y1={18} x2={50} y2={54} stroke={GRAY} strokeWidth={1.5} strokeOpacity={0.6} />
    <line x1={70} y1={18} x2={90} y2={54} stroke={GRAY} strokeWidth={1.5} strokeOpacity={0.6} />
    <line x1={116} y1={26} x2={124} y2={18} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <line x1={112} y1={20} x2={128} y2={24} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <line x1={120} y1={16} x2={120} y2={32} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <line x1={20} y1={36} x2={12} y2={28} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={16} y1={30} x2={28} y2={34} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <circle cx={70} cy={18} r={4} fill={YELLOW} />
  </svg>
);

// Card 4: Growing bar chart — essence improves, titles follow naturally
const IconRise: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <rect x={12} y={100} width={22} height={25} rx={3} fill={GRAY} />
    <rect x={42} y={78} width={22} height={47} rx={3} fill={GRAY} />
    <rect x={72} y={52} width={22} height={73} rx={3} fill={GRAY} />
    <rect x={102} y={26} width={22} height={99} rx={3} fill={YELLOW} />
    <polygon points="113,16 106,28 120,28" fill={YELLOW} />
    <line x1={8} y1={125} x2={132} y2={125} stroke={GRAY} strokeWidth={2} />
  </svg>
);

// Card 5: Seed sprouting — invest in your core self now
const IconInvest: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <line x1={14} y1={100} x2={126} y2={100} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <ellipse cx={70} cy={114} rx={16} ry={10} stroke={GRAY} strokeWidth={3} />
    <line x1={70} y1={100} x2={70} y2={42} stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
    <path d="M70 65 Q44 50 40 33 Q58 38 70 58" fill={YELLOW} />
    <path d="M70 55 Q96 38 105 26 Q92 42 70 58" fill={YELLOW} />
    <circle cx={70} cy={34} r={8} fill={YELLOW} />
    <line x1={70} y1={22} x2={70} y2={15} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={82} y1={26} x2={87} y2={21} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={58} y1={26} x2={53} y2={21} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
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
    context: "사회적신분의 오해",
    bracket: "직함이 나는 아니다",
    punchline: "000회사의 나는\n컨트롤 밖에 있는 영역이다",
    icon: <IconBadgeX />,
    bracketFontSize: 88,
  },
  {
    context: "두 개의 나",
    bracket: "000회사의 나 vs 그냥 나",
    punchline: "회사의 나와 달리\n그냥 나는 컨트롤 가능하며\n지속성을 가져갈 수 있다",
    icon: <IconTwoSelves />,
    bracketFontSize: 70,
  },
  {
    context: "핵심",
    bracket: "나를 갈고 닦으면 오래간다",
    punchline: "직함이 아닌,\n내 본질의 가치를 쌓아라",
    icon: <IconPolish />,
    bracketFontSize: 80,
  },
  {
    context: "법칙",
    bracket: "본질이 좋아지면",
    punchline: "사회적 직함은\n자연히 따라온다",
    icon: <IconRise />,
    bracketFontSize: 95,
  },
  {
    context: "",
    bracket: "지금 자신의 본질에 투자하라",
    punchline: "모든 직장인이여\n— 바로 지금이다",
    icon: <IconInvest />,
    bracketFontSize: 74,
  },
];

export const IdentityEssence: React.FC = () => (
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
