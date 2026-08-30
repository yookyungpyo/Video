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
const GRAY = "#777788";

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
  const op = interpolate(frame, [0, 14, dur - 14, dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity: op }}>{children}</AbsoluteFill>;
};

// SVG: three people, one stays (circle highlight)
const IconWhoStays: React.FC = () => (
  <svg width={160} height={160} viewBox="0 0 160 160" fill="none">
    {/* left person — faded, leaving */}
    <circle cx={36} cy={42} r={16} stroke={GRAY} strokeWidth={5} />
    <path d="M20 90 Q36 66 52 90" stroke={GRAY} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M36 88 L34 120" stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    <path d="M34 120 L26 140 M34 120 L42 140" stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    {/* right person — faded, leaving */}
    <circle cx={124} cy={42} r={16} stroke={GRAY} strokeWidth={5} />
    <path d="M108 90 Q124 66 140 90" stroke={GRAY} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M124 88 L122 120" stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    <path d="M122 120 L114 140 M122 120 L130 140" stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    {/* center person — yellow, stays */}
    <circle cx={80} cy={38} r={20} stroke={YELLOW} strokeWidth={5} />
    <path d="M58 94 Q80 64 102 94" stroke={YELLOW} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M80 92 L80 128" stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
    <path d="M80 128 L68 152 M80 128 L92 152" stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
    {/* glow ring */}
    <circle cx={80} cy={80} r={72} stroke={YELLOW} strokeWidth={2} strokeDasharray="6 8" opacity={0.4} />
  </svg>
);

// SVG: bricks being laid — culture is built
const IconCultureBuilt: React.FC = () => (
  <svg width={160} height={160} viewBox="0 0 160 160" fill="none">
    {/* bottom row bricks */}
    <rect x={10} y={120} width={58} height={28} rx={4} stroke={GRAY} strokeWidth={4} />
    <rect x={76} y={120} width={74} height={28} rx={4} stroke={GRAY} strokeWidth={4} />
    {/* middle row */}
    <rect x={10} y={86} width={74} height={28} rx={4} stroke={GRAY} strokeWidth={4} />
    <rect x={92} y={86} width={58} height={28} rx={4} stroke={GRAY} strokeWidth={4} />
    {/* top row — yellow (the one who stays builds this) */}
    <rect x={28} y={52} width={104} height={28} rx={4} stroke={YELLOW} strokeWidth={4} fill={`${YELLOW}22`} />
    <text x={80} y={71} textAnchor="middle" fontSize={16} fontWeight={700} fill={YELLOW} fontFamily="sans-serif">
      문화
    </text>
    {/* trowel hint */}
    <path d="M120 44 L142 22" stroke={WHITE} strokeWidth={4} strokeLinecap="round" />
    <path d="M130 36 L144 28 L138 46 Z" fill={WHITE} />
  </svg>
);

// SVG: anchor — retention as strategy
const IconRetention: React.FC = () => (
  <svg width={160} height={160} viewBox="0 0 160 160" fill="none">
    {/* anchor ring */}
    <circle cx={80} cy={36} r={22} stroke={YELLOW} strokeWidth={5} />
    <circle cx={80} cy={36} r={10} stroke={YELLOW} strokeWidth={4} fill="none" />
    {/* anchor shaft */}
    <line x1={80} y1={58} x2={80} y2={136} stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
    {/* anchor arms */}
    <path d="M80 136 L40 116 M80 136 L120 116" stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
    {/* curved bottom */}
    <path d="M40 116 Q40 148 80 148 Q120 148 120 116" stroke={YELLOW} strokeWidth={5} fill="none" strokeLinecap="round" />
    {/* subtle glow */}
    <circle cx={80} cy={80} r={70} stroke={YELLOW} strokeWidth={1.5} opacity={0.2} strokeDasharray="4 10" />
  </svg>
);

type CardProps = {
  context: string;
  bracket: string;
  punchline: string;
  icon: React.ReactNode;
};

const Card: React.FC<CardProps> = ({ context, bracket, punchline, icon }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = (delay: number) =>
    spring({ frame: frame - delay, fps, config: { damping: 22, stiffness: 120 } });

  const t1 = pop(4);
  const t2 = pop(18);
  const t3 = pop(32);
  const t4 = pop(50);

  return (
    <AbsoluteFill
      style={{
        background: BG,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {/* Icon */}
      <div
        style={{
          opacity: t1,
          transform: `scale(${0.6 + 0.4 * t1}) translateY(${(1 - t1) * 40}px)`,
          marginBottom: 52,
        }}
      >
        {icon}
      </div>

      {/* Context label */}
      <div
        style={{
          opacity: t2,
          transform: `translateY(${(1 - t2) * 24}px)`,
          fontFamily: FONT,
          fontWeight: 400,
          fontSize: 44,
          color: GRAY,
          textAlign: "center",
          letterSpacing: -0.5,
          marginBottom: 28,
          paddingLeft: 60,
          paddingRight: 60,
          lineHeight: 1.4,
        }}
      >
        {context}
      </div>

      {/* Bracket headline */}
      <div
        style={{
          opacity: t3,
          transform: `scale(${0.82 + 0.18 * t3})`,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 88,
          color: YELLOW,
          textAlign: "center",
          letterSpacing: -2,
          lineHeight: 1.15,
          paddingLeft: 40,
          paddingRight: 40,
          marginBottom: 36,
        }}
      >
        {`[ ${bracket} ]`}
      </div>

      {/* Punchline */}
      <div
        style={{
          opacity: t4,
          transform: `translateY(${(1 - t4) * 20}px)`,
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 48,
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

      {/* Cat emoji — always at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 90,
          fontSize: 52,
          opacity: t4,
        }}
      >
        🐱
      </div>
    </AbsoluteFill>
  );
};

const CARD_DUR = 180;
const OVERLAP = 16;

export const Culture: React.FC = () => (
  <AbsoluteFill style={{ background: BG }}>
    <FontLoader />
    <Sequence from={0} durationInFrames={CARD_DUR}>
      <Fade dur={CARD_DUR}>
        <Card
          context="회사에서 진짜 중요한 건"
          bracket="누가 남느냐"
          punchline="그게 전부다"
          icon={<IconWhoStays />}
        />
      </Fade>
    </Sequence>
    <Sequence from={CARD_DUR - OVERLAP} durationInFrames={CARD_DUR}>
      <Fade dur={CARD_DUR}>
        <Card
          context="떠난 사람은 흔적을 남기지만"
          bracket="남은 사람이"
          punchline="문화를 만든다"
          icon={<IconCultureBuilt />}
        />
      </Fade>
    </Sequence>
    <Sequence from={(CARD_DUR - OVERLAP) * 2} durationInFrames={CARD_DUR}>
      <Fade dur={CARD_DUR}>
        <Card
          context="그래서 진짜 질문은"
          bracket="누굴 붙잡겠나"
          punchline="그게 곧 전략이다"
          icon={<IconRetention />}
        />
      </Fade>
    </Sequence>
  </AbsoluteFill>
);

export const CultureVideo: React.FC = () => <Culture />;
