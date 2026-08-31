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

// Card 1: Lightning bolt (AI speed) → growing bill stack (rising cost)
const IconAIHandoff: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Lightning bolt — left side, large */}
    <path d="M42 15 L22 72 L36 72 L18 125 L62 60 L48 60 Z" fill={GRAY} />
    {/* Arrow → center */}
    <line x1={70} y1={70} x2={88} y2={70} stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
    <polygon points="96,70 86,63 86,77" fill={YELLOW} />
    {/* Bill stack — right side, 3 stacked rectangles growing up */}
    <rect x={100} y={96} width={36} height={18} rx={3} stroke={YELLOW} strokeWidth={3.5} fill="none" />
    <rect x={100} y={72} width={36} height={18} rx={3} stroke={YELLOW} strokeWidth={3.5} fill="none" />
    <rect x={100} y={48} width={36} height={18} rx={3} stroke={YELLOW} strokeWidth={3.5} fill="none" />
    {/* Up-arrow above bills */}
    <line x1={118} y1={44} x2={118} y2={28} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <polygon points="118,18 110,30 126,30" fill={YELLOW} />
  </svg>
);

// Card 2: Document + giant ? (no context = must restart)
const IconMissingContext: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Document outline */}
    <path d="M14 10 L110 10 L110 130 L14 130 Z" stroke={GRAY} strokeWidth={3.5} fill="none" />
    {/* Two solid lines at top = content */}
    <line x1={26} y1={28} x2={98} y2={28} stroke={GRAY} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={26} y1={42} x2={98} y2={42} stroke={GRAY} strokeWidth={3.5} strokeLinecap="round" />
    {/* Giant ? — dominant center element */}
    <text x={62} y={100} textAnchor="middle" fontSize={68} fill={YELLOW} fontFamily="sans-serif" fontWeight={900}>?</text>
    {/* Two dashed lines at bottom = missing content */}
    <line x1={26} y1={112} x2={98} y2={112} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="5 5" />
    <line x1={26} y1={124} x2={74} y2={124} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="5 5" />
  </svg>
);

// Card 3: Checkmark circle (done) → dashed arrow → X circle (can't receive)
const IconHandoffFail: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Left: done circle with checkmark */}
    <circle cx={34} cy={70} r={30} stroke={GRAY} strokeWidth={4} fill="none" />
    <path d="M18 70 L29 84 L52 52" stroke={GRAY} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    {/* Center: dashed handoff arrow */}
    <line x1={68} y1={70} x2={88} y2={70} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" strokeDasharray="5 4" />
    <polygon points="96,70 85,63 85,77" fill={YELLOW} />
    {/* Right: blocked circle with X */}
    <circle cx={116} cy={70} r={22} stroke={YELLOW} strokeWidth={4} fill="none" />
    <line x1={103} y1={57} x2={129} y2={83} stroke={YELLOW} strokeWidth={5.5} strokeLinecap="round" />
    <line x1={129} y1={57} x2={103} y2={83} stroke={YELLOW} strokeWidth={5.5} strokeLinecap="round" />
  </svg>
);

// Card 4: Two rising trend lines — speed moderate, cost steep (clearly separated)
const IconBothRise: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <line x1={16} y1={126} x2={16} y2={12} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={16} y1={126} x2={132} y2={126} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    {/* 속도 — moderate slope, ends lower */}
    <path d="M16 126 Q72 120 90 78" stroke={GRAY} strokeWidth={5} strokeLinecap="round" fill="none" />
    <circle cx={90} cy={78} r={6} fill={GRAY} />
    <text x={94} y={86} fontSize={15} fill={GRAY} fontFamily="sans-serif" fontWeight={700}>속도</text>
    {/* 비용 — steep slope, ends much higher */}
    <path d="M16 126 Q52 114 114 26" stroke={YELLOW} strokeWidth={5} strokeLinecap="round" fill="none" />
    <circle cx={114} cy={26} r={6} fill={YELLOW} />
    <text x={88} y={16} fontSize={15} fill={YELLOW} fontFamily="sans-serif" fontWeight={700}>비용</text>
  </svg>
);

// Card 5: Person (gray) + speech bubble with bold X (yellow) = speech is blocked, can't explain
const IconCantExplain: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Person — larger for visual weight */}
    <circle cx={28} cy={32} r={16} stroke={GRAY} strokeWidth={3.5} fill="none" />
    <line x1={28} y1={48} x2={28} y2={82} stroke={GRAY} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={28} y1={64} x2={10} y2={54} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <line x1={28} y1={64} x2={46} y2={54} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <line x1={18} y1={82} x2={28} y2={110} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <line x1={38} y1={82} x2={28} y2={110} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    {/* Large speech bubble — right side */}
    <path d="M54 14 Q54 4 66 4 L126 4 Q136 4 136 18 L136 72 Q136 84 124 84 L82 84 L64 104 L68 84 Q54 84 54 72 Z"
      stroke={YELLOW} strokeWidth={3.5} fill="none" strokeLinejoin="round" />
    {/* Bold X inside bubble — speech blocked, can't explain */}
    <line x1={74} y1={24} x2={118} y2={66} stroke={YELLOW} strokeWidth={7} strokeLinecap="round" />
    <line x1={118} y1={24} x2={74} y2={66} stroke={YELLOW} strokeWidth={7} strokeLinecap="round" />
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
