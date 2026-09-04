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

// Card 1: Neural net (GRAY) + dominant + (YELLOW) — AI defaults to adding
const IconPlusDefault: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <circle cx={22} cy={35} r={7} fill={GRAY} />
    <circle cx={50} cy={18} r={7} fill={GRAY} />
    <circle cx={58} cy={55} r={7} fill={GRAY} />
    <circle cx={22} cy={72} r={7} fill={GRAY} />
    <circle cx={50} cy={90} r={7} fill={GRAY} />
    <line x1={22} y1={35} x2={50} y2={18} stroke={GRAY} strokeWidth={2.5} />
    <line x1={22} y1={35} x2={58} y2={55} stroke={GRAY} strokeWidth={2.5} />
    <line x1={50} y1={18} x2={58} y2={55} stroke={GRAY} strokeWidth={2.5} />
    <line x1={22} y1={72} x2={58} y2={55} stroke={GRAY} strokeWidth={2.5} />
    <line x1={22} y1={72} x2={50} y2={90} stroke={GRAY} strokeWidth={2.5} />
    <line x1={58} y1={55} x2={50} y2={90} stroke={GRAY} strokeWidth={2.5} />
    <text x={108} y={98} textAnchor="middle" fontSize={88} fill={YELLOW} fontFamily="sans-serif" fontWeight={900}>+</text>
  </svg>
);

// Card 2: Stacked boxes (GRAY) + X on top (YELLOW) — piling up leads to paralysis
const IconParalysis: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <rect x={28} y={96} width={84} height={24} rx={4} stroke={GRAY} strokeWidth={3.5} fill="none" />
    <rect x={20} y={68} width={100} height={24} rx={4} stroke={GRAY} strokeWidth={3.5} fill="none" />
    <rect x={12} y={40} width={116} height={24} rx={4} stroke={GRAY} strokeWidth={3.5} fill="none" />
    <line x1={50} y1={10} x2={90} y2={32} stroke={YELLOW} strokeWidth={9} strokeLinecap="round" />
    <line x1={90} y1={10} x2={50} y2={32} stroke={YELLOW} strokeWidth={9} strokeLinecap="round" />
  </svg>
);

// Card 3: Seesaw tipped — + (GRAY, light) vs − (YELLOW, heavy) — subtraction is harder
const IconSubtractHarder: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <polygon points="70,115 58,130 82,130" fill={GRAY} />
    <line x1={15} y1={72} x2={125} y2={95} stroke={GRAY} strokeWidth={5} strokeLinecap="round" />
    <text x={18} y={62} textAnchor="middle" fontSize={42} fill={GRAY} fontFamily="sans-serif" fontWeight={700}>+</text>
    <text x={122} y={120} textAnchor="middle" fontSize={60} fill={YELLOW} fontFamily="sans-serif" fontWeight={900}>−</text>
  </svg>
);

// Card 4: Wavy complexity (GRAY) vs single arrow (YELLOW) — simplicity = speed
const IconSimplicitySpeed: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <path d="M8 38 Q18 28 28 38 Q38 48 48 38" stroke={GRAY} strokeWidth={3} fill="none" strokeLinecap="round" />
    <path d="M8 55 Q18 45 28 55 Q38 65 48 55" stroke={GRAY} strokeWidth={3} fill="none" strokeLinecap="round" />
    <path d="M8 72 Q18 62 28 72 Q38 82 48 72" stroke={GRAY} strokeWidth={3} fill="none" strokeLinecap="round" />
    <path d="M8 89 Q18 79 28 89 Q38 99 48 89" stroke={GRAY} strokeWidth={3} fill="none" strokeLinecap="round" />
    <path d="M8 106 Q18 96 28 106 Q38 116 48 106" stroke={GRAY} strokeWidth={3} fill="none" strokeLinecap="round" />
    <line x1={68} y1={18} x2={68} y2={122} stroke={GRAY} strokeWidth={1.5} strokeDasharray="5 4" />
    <line x1={86} y1={70} x2={122} y2={70} stroke={YELLOW} strokeWidth={9} strokeLinecap="round" />
    <polygon points="132,70 116,58 116,82" fill={YELLOW} />
  </svg>
);

// Card 5: Funnel (YELLOW) — many + inputs, single refined output = subtractive skill
const IconFunnel: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <text x={18} y={30} textAnchor="middle" fontSize={22} fill={GRAY} fontFamily="sans-serif" fontWeight={700}>+</text>
    <text x={52} y={22} textAnchor="middle" fontSize={22} fill={GRAY} fontFamily="sans-serif" fontWeight={700}>+</text>
    <text x={88} y={26} textAnchor="middle" fontSize={22} fill={GRAY} fontFamily="sans-serif" fontWeight={700}>+</text>
    <text x={124} y={20} textAnchor="middle" fontSize={22} fill={GRAY} fontFamily="sans-serif" fontWeight={700}>+</text>
    <path d="M6 40 L134 40 L88 90 L52 90 Z" stroke={YELLOW} strokeWidth={4.5} strokeLinejoin="round" fill="none" />
    <line x1={70} y1={90} x2={70} y2={120} stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
    <circle cx={70} cy={129} r={9} fill={YELLOW} />
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

// ─── Composition ──────────────────────────────────────────────────────────────

const CARD_DUR = 130;
const OVERLAP = 14;

const cards: CardProps[] = [
  {
    context: "AI의 기본값",
    bracket: "AI의 기본값은 +다",
    punchline: "요청하면 생성하고, 질문하면 추가하고,\n쓸수록 쌓인다",
    icon: <IconPlusDefault />,
    bracketFontSize: 90,
  },
  {
    context: "더하기의 함정",
    bracket: "더하기의 끝은 마비다",
    punchline: "넘쳐나는 기능 속에서\n정작 결정을 못 한다",
    icon: <IconParalysis />,
    bracketFontSize: 80,
  },
  {
    context: "진짜 실력",
    bracket: "빼기가 더 어렵다",
    punchline: "무엇을 버릴지 모르면 AI도 짐이 된다",
    icon: <IconSubtractHarder />,
  },
  {
    context: "빼기의 힘",
    bracket: "단순함이 속도다",
    punchline: "핵심만 남긴 사람이 결국 앞서간다",
    icon: <IconSimplicitySpeed />,
  },
  {
    context: "",
    bracket: "더하기는 AI에게",
    punchline: "빼는 판단은 내가 한다\n— 그게 진짜 실력이다",
    icon: <IconFunnel />,
  },
];

export const AiSubtraction: React.FC = () => (
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
