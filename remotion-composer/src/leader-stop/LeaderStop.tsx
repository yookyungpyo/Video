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

// Card 1: 더 해, 계속 해 — pillar crumbling under constant downward pressure
const IconCrumble: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <rect x={46} y={58} width={48} height={62} rx={4} stroke={GRAY} strokeWidth={2.5} />
    <path d="M60 68 L70 80 L63 92" stroke={GRAY} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.9} />
    <path d="M80 74 L88 86" stroke={GRAY} strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.7} />
    <rect x={22} y={106} width={18} height={12} rx={2} stroke={GRAY} strokeWidth={2} opacity={0.55} transform="rotate(-20 31 112)" />
    <rect x={100} y={110} width={16} height={10} rx={2} stroke={GRAY} strokeWidth={2} opacity={0.55} transform="rotate(15 108 115)" />
    <line x1={58} y1={10} x2={58} y2={50} stroke={YELLOW} strokeWidth={4.5} strokeLinecap="round" />
    <line x1={50} y1={42} x2={58} y2={50} stroke={YELLOW} strokeWidth={4.5} strokeLinecap="round" />
    <line x1={66} y1={42} x2={58} y2={50} stroke={YELLOW} strokeWidth={4.5} strokeLinecap="round" />
    <line x1={82} y1={10} x2={82} y2={50} stroke={YELLOW} strokeWidth={4.5} strokeLinecap="round" />
    <line x1={74} y1={42} x2={82} y2={50} stroke={YELLOW} strokeWidth={4.5} strokeLinecap="round" />
    <line x1={90} y1={42} x2={82} y2={50} stroke={YELLOW} strokeWidth={4.5} strokeLinecap="round" />
  </svg>
);

// Card 2: 그만해도 된다 — open palm (you can pause, relief)
const IconPalm: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <rect x={46} y={16} width={10} height={52} rx={5} stroke={YELLOW} strokeWidth={3} />
    <rect x={60} y={10} width={10} height={58} rx={5} stroke={YELLOW} strokeWidth={3} />
    <rect x={74} y={12} width={10} height={56} rx={5} stroke={YELLOW} strokeWidth={3} />
    <rect x={88} y={18} width={10} height={50} rx={5} stroke={YELLOW} strokeWidth={3} />
    <path d="M44 64 Q40 112 70 120 Q100 112 98 64 L98 60 L44 60 Z"
          stroke={YELLOW} strokeWidth={3} fill="none" strokeLinejoin="round" />
    <path d="M44 72 Q30 68 28 58 Q26 46 38 46 Q44 46 44 58 L44 72"
          stroke={YELLOW} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Card 3: 판단이 필요하다 — balance scale (judgment, criteria)
const IconBalance: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <line x1={70} y1={26} x2={70} y2={118} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <circle cx={70} cy={26} r={5} stroke={GRAY} strokeWidth={2.5} />
    <line x1={20} y1={46} x2={120} y2={40} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={20} y1={46} x2={20} y2={70} stroke={GRAY} strokeWidth={2} strokeDasharray="3 3" />
    <line x1={120} y1={40} x2={120} y2={76} stroke={GRAY} strokeWidth={2} strokeDasharray="3 3" />
    <path d="M6 70 Q20 84 34 70" stroke={YELLOW} strokeWidth={3} fill="none" strokeLinecap="round" />
    <circle cx={20} cy={67} r={5} fill={YELLOW} opacity={0.5} />
    <path d="M106 76 Q120 90 134 76" stroke={GRAY} strokeWidth={2.5} fill="none" strokeLinecap="round" />
    <rect x={58} y={118} width={24} height={8} rx={3} stroke={GRAY} strokeWidth={2.5} />
    <line x1={46} y1={126} x2={94} y2={126} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
  </svg>
);

// Card 4: 약해 보이지 않는다 — shield with pause bars (strength that permits rest)
const IconShieldPause: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <path d="M70 12 L110 30 L110 72 Q110 102 70 124 Q30 102 30 72 L30 30 Z"
          stroke={YELLOW} strokeWidth={3.5} fill="none" strokeLinejoin="round" />
    <rect x={50} y={52} width={14} height={36} rx={4} stroke={YELLOW} strokeWidth={3.5} />
    <rect x={76} y={52} width={14} height={36} rx={4} stroke={YELLOW} strokeWidth={3.5} />
  </svg>
);

// Card 5: 그런 리더가 되자 — ascending staircase with star at top
const IconStairStar: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <rect x={10} y={100} width={26} height={18} rx={3} stroke={GRAY} strokeWidth={2.5} />
    <rect x={36} y={82} width={26} height={36} rx={3} stroke={GRAY} strokeWidth={2.5} />
    <rect x={62} y={64} width={26} height={54} rx={3} stroke={GRAY} strokeWidth={2.5} />
    <rect x={88} y={46} width={30} height={72} rx={3} stroke={YELLOW} strokeWidth={3} />
    <path d="M103 10 L107 22 L120 22 L110 30 L114 42 L103 34 L92 42 L96 30 L86 22 L99 22 Z"
          stroke={YELLOW} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
    <line x1={75} y1={60} x2={75} y2={48} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" strokeDasharray="5 3" />
    <line x1={70} y1={54} x2={75} y2={48} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={80} y1={54} x2={75} y2={48} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
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
    context: "보통의 리더",
    bracket: "더 해, 계속 해",
    punchline: "채찍만 있는 리더 아래서\n팀은 조용히 무너진다",
    icon: <IconCrumble />,
    bracketFontSize: 95,
  },
  {
    context: "강한 리더",
    bracket: "그만해도 된다",
    punchline: "이 말을 할 줄 아는 리더가\n진짜 강한 리더다",
    icon: <IconPalm />,
    bracketFontSize: 95,
  },
  {
    context: "왜 어려운가",
    bracket: "판단이 필요하다",
    punchline: "충분하다고 말하려면\n기준과 용기가 있어야 한다",
    icon: <IconBalance />,
    bracketFontSize: 95,
  },
  {
    context: "진짜 강함",
    bracket: "약해 보이지 않는다",
    punchline: "잠시 쉬자 라고 말해주는 리더는\n일을 할 줄 아는 리더",
    icon: <IconShieldPause />,
    bracketFontSize: 88,
  },
  {
    context: "",
    bracket: "그런 리더가 되자",
    punchline: "쉬어도 된다\n쉼표를 찍어주는 그런 리더가 되자",
    icon: <IconStairStar />,
    bracketFontSize: 95,
  },
];

export const LeaderStop: React.FC = () => (
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
