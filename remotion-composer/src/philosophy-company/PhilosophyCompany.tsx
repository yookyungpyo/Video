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

// Card 1: 철학 있는 회사 — 이유를 판다 (building with light/star at top)
const IconPhilosophyBuilding: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <rect x={30} y={46} width={80} height={74} rx={3} stroke={GRAY} strokeWidth={2.5} />
    <path d="M22 46 L70 14 L118 46" stroke={GRAY} strokeWidth={2.5} strokeLinejoin="round" fill="none" />
    <rect x={44} y={64} width={16} height={14} rx={2} stroke={GRAY} strokeWidth={1.8} />
    <rect x={80} y={64} width={16} height={14} rx={2} stroke={GRAY} strokeWidth={1.8} />
    <rect x={58} y={90} width={24} height={30} rx={2} stroke={GRAY} strokeWidth={1.8} />
    <path d="M70 34 L73 42 L82 42 L75 47 L78 56 L70 51 L62 56 L65 47 L58 42 L67 42 Z"
          stroke={YELLOW} strokeWidth={2.2} fill="none" strokeLinejoin="round" />
    <line x1={70} y1={26} x2={70} y2={22} stroke={YELLOW} strokeWidth={2} strokeLinecap="round" />
    <line x1={80} y1={30} x2={84} y2={26} stroke={YELLOW} strokeWidth={2} strokeLinecap="round" />
    <line x1={60} y1={30} x2={56} y2={26} stroke={YELLOW} strokeWidth={2} strokeLinecap="round" />
    <circle cx={70} cy={44} r={3} fill={YELLOW} opacity={0.7} />
  </svg>
);

// Card 2: 연결의 본질 — 나침반과 엔진 (compass + gear connected)
const IconCompassEngine: React.FC = () => {
  const teeth = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
      <circle cx={38} cy={70} r={26} stroke={YELLOW} strokeWidth={2.5} />
      <circle cx={38} cy={70} r={4} fill={YELLOW} />
      <path d="M38 44 L41 70 L38 58 L35 70 Z" fill={YELLOW} opacity={0.9} />
      <path d="M38 96 L41 70 L38 82 L35 70 Z" fill={GRAY} opacity={0.5} />
      <line x1={38} y1={36} x2={38} y2={32} stroke={YELLOW} strokeWidth={2} strokeLinecap="round" />
      <line x1={64} y1={70} x2={76} y2={70} stroke={GRAY} strokeWidth={2} strokeLinecap="round" strokeDasharray="3 2" />
      <circle cx={102} cy={70} r={18} stroke={GRAY} strokeWidth={2.5} />
      <circle cx={102} cy={70} r={8} stroke={GRAY} strokeWidth={2} />
      {teeth.map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line key={i}
            x1={102 + 18 * Math.cos(rad)} y1={70 + 18 * Math.sin(rad)}
            x2={102 + 24 * Math.cos(rad)} y2={70 + 24 * Math.sin(rad)}
            stroke={GRAY} strokeWidth={3.5} strokeLinecap="round" />
        );
      })}
    </svg>
  );
};

// Card 3: 철학 있는 팀 — 믿으며 일한다 (people converging to a star/purpose)
const IconTeamBelief: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <circle cx={26} cy={96} r={10} stroke={GRAY} strokeWidth={2.5} />
    <circle cx={70} cy={106} r={10} stroke={GRAY} strokeWidth={2.5} />
    <circle cx={114} cy={96} r={10} stroke={GRAY} strokeWidth={2.5} />
    <path d="M34 88 L56 54" stroke={GRAY} strokeWidth={1.8} strokeLinecap="round" strokeDasharray="3 2" />
    <path d="M70 96 L70 62" stroke={GRAY} strokeWidth={1.8} strokeLinecap="round" strokeDasharray="3 2" />
    <path d="M106 88 L84 54" stroke={GRAY} strokeWidth={1.8} strokeLinecap="round" strokeDasharray="3 2" />
    <path d="M70 22 L74 34 L86 34 L76 42 L80 54 L70 46 L60 54 L64 42 L54 34 L66 34 Z"
          stroke={YELLOW} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
    <circle cx={70} cy={38} r={4} fill={YELLOW} opacity={0.7} />
  </svg>
);

// Card 4: 철학 있는 회사 — 정체성 (lighthouse = guidance + identity)
const IconLighthouse: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <path d="M54 122 L52 62 L88 62 L86 122 Z" stroke={GRAY} strokeWidth={2.5} strokeLinejoin="round" fill="none" />
    <line x1={52.5} y1={82} x2={87.5} y2={82} stroke={GRAY} strokeWidth={1.5} opacity={0.5} />
    <line x1={53} y1={100} x2={87} y2={100} stroke={GRAY} strokeWidth={1.5} opacity={0.5} />
    <rect x={48} y={48} width={44} height={16} rx={3} stroke={YELLOW} strokeWidth={2.5} />
    <circle cx={70} cy={56} r={5} fill={YELLOW} opacity={0.85} />
    <path d="M58 48 L26 18" stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" opacity={0.75} />
    <path d="M56 48 L14 46" stroke={YELLOW} strokeWidth={2} strokeLinecap="round" opacity={0.45} />
    <path d="M82 48 L114 18" stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" opacity={0.75} />
    <path d="M84 48 L126 46" stroke={YELLOW} strokeWidth={2} strokeLinecap="round" opacity={0.45} />
    <line x1={44} y1={122} x2={96} y2={122} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
  </svg>
);

// Card 5: 당신의 회사는 — (mirror with question mark)
const IconMirror: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <ellipse cx={70} cy={58} rx={38} ry={46} stroke={GRAY} strokeWidth={2.5} />
    <line x1={70} y1={104} x2={70} y2={118} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={50} y1={118} x2={90} y2={118} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <path d="M60 44 Q60 30 70 28 Q82 26 84 38 Q86 48 74 54 Q70 56 70 64"
          stroke={YELLOW} strokeWidth={3} strokeLinecap="round" fill="none" />
    <circle cx={70} cy={72} r={4} fill={YELLOW} />
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
    context: "철학 있는 회사",
    bracket: "이유를 판다",
    punchline: "기술은 흉내낼 수 있다\n하지만 철학은 흉내낼 수 없다",
    icon: <IconPhilosophyBuilding />,
    bracketFontSize: 95,
  },
  {
    context: "연결의 본질",
    bracket: "나침반과 엔진",
    punchline: "철학은 방향을 잡고\n전문성은 그 방향으로 달린다",
    icon: <IconCompassEngine />,
    bracketFontSize: 95,
  },
  {
    context: "철학 있는 팀",
    bracket: "믿으며 일한다",
    punchline: "시키는 일이 아니라\n이유가 있어서 움직인다",
    icon: <IconTeamBelief />,
    bracketFontSize: 95,
  },
  {
    context: "",
    bracket: "철학 있는 회사",
    punchline: "전문성과 철학이 연결된 곳\n그것이 그 회사만의 정체성이 된다",
    icon: <IconLighthouse />,
    bracketFontSize: 80,
  },
  {
    context: "",
    bracket: "당신의 회사는",
    punchline: "어떤 철학으로\n어떤 전문성과 연결되어 있는가",
    icon: <IconMirror />,
    bracketFontSize: 88,
  },
];

export const PhilosophyCompany: React.FC = () => (
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
