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

// Card 1: 재능이 없다면 — 포기가 답이다? (wilting flower in pot)
const IconWilt: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <path d="M38 86 L46 118 L94 118 L102 86 Z" stroke={GRAY} strokeWidth={2.5} strokeLinejoin="round" fill="none" />
    <line x1={34} y1={86} x2={106} y2={86} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <path d="M70 86 L70 58 Q70 44 88 38" stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" fill="none" />
    <circle cx={88} cy={30} r={10} stroke={GRAY} strokeWidth={2} />
    <path d="M82 22 Q76 14 80 22" stroke={GRAY} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    <path d="M94 24 Q102 18 100 26" stroke={GRAY} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    <path d="M96 34 Q104 38 98 40" stroke={GRAY} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    <line x1={20} y1={18} x2={36} y2={34} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={36} y1={18} x2={20} y2={34} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
  </svg>
);

// Card 2: 태도가 있다면 — 재능이 자란다 (blooming flower)
const IconBloom: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <line x1={70} y1={108} x2={70} y2={56} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <path d="M70 84 Q48 76 44 60 Q58 66 70 78" stroke={YELLOW} strokeWidth={2.5} fill="none" strokeLinecap="round" />
    <path d="M70 70 Q92 62 96 46 Q82 52 70 64" stroke={YELLOW} strokeWidth={2.5} fill="none" strokeLinecap="round" />
    <circle cx={86} cy={38} r={9} stroke={YELLOW} strokeWidth={2.5} />
    <circle cx={78} cy={24} r={9} stroke={YELLOW} strokeWidth={2.5} />
    <circle cx={62} cy={24} r={9} stroke={YELLOW} strokeWidth={2.5} />
    <circle cx={54} cy={38} r={9} stroke={YELLOW} strokeWidth={2.5} />
    <circle cx={62} cy={52} r={9} stroke={YELLOW} strokeWidth={2.5} />
    <circle cx={78} cy={52} r={9} stroke={YELLOW} strokeWidth={2.5} />
    <circle cx={70} cy={38} r={10} stroke={YELLOW} strokeWidth={3} fill={BG} />
    <path d="M70 108 Q58 120 48 128" stroke={GRAY} strokeWidth={2} strokeLinecap="round" fill="none" />
    <path d="M70 110 Q70 122 70 130" stroke={GRAY} strokeWidth={2} strokeLinecap="round" fill="none" />
    <path d="M70 108 Q82 120 92 128" stroke={GRAY} strokeWidth={2} strokeLinecap="round" fill="none" />
  </svg>
);

// Card 3: 왜 그런가 — 재능은 씨앗이다 (seed with sun and water)
const IconSeed: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <ellipse cx={70} cy={100} rx={24} ry={16} stroke={GRAY} strokeWidth={2.5} />
    <line x1={70} y1={84} x2={70} y2={100} stroke={GRAY} strokeWidth={1.5} strokeDasharray="2 2" />
    <path d="M70 84 L70 56" stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <path d="M70 68 Q52 56 48 40" stroke={GRAY} strokeWidth={2} strokeLinecap="round" fill="none" />
    <path d="M70 62 Q88 50 92 34" stroke={GRAY} strokeWidth={2} strokeLinecap="round" fill="none" />
    <circle cx={108} cy={24} r={12} stroke={YELLOW} strokeWidth={2.5} />
    <line x1={108} y1={6} x2={108} y2={2} stroke={YELLOW} strokeWidth={2} strokeLinecap="round" />
    <line x1={122} y1={14} x2={126} y2={10} stroke={YELLOW} strokeWidth={2} strokeLinecap="round" />
    <line x1={126} y1={24} x2={130} y2={24} stroke={YELLOW} strokeWidth={2} strokeLinecap="round" />
    <line x1={122} y1={34} x2={126} y2={38} stroke={YELLOW} strokeWidth={2} strokeLinecap="round" />
    <line x1={94} y1={14} x2={90} y2={10} stroke={YELLOW} strokeWidth={2} strokeLinecap="round" />
    <line x1={94} y1={34} x2={90} y2={38} stroke={YELLOW} strokeWidth={2} strokeLinecap="round" />
    <path d="M26 14 Q26 4 34 8 Q42 12 38 24 Q34 34 26 28 Z" stroke={YELLOW} strokeWidth={2} fill="none" strokeLinejoin="round" />
  </svg>
);

// Card 4: 태도의 본질 — 계속하는 힘 (winding upward path with person and flag)
const IconPersist: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <path d="M18 122 Q36 112 50 118 Q66 126 80 108 Q94 90 108 62 Q118 42 122 24"
          stroke={GRAY} strokeWidth={2.5} strokeDasharray="5 4" strokeLinecap="round" fill="none" />
    <circle cx={88} cy={98} r={10} stroke={YELLOW} strokeWidth={3} />
    <line x1={88} y1={86} x2={88} y2={72} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={82} y1={78} x2={88} y2={72} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={94} y1={78} x2={88} y2={72} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={122} y1={24} x2={122} y2={8} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
    <path d="M122 8 L136 14 L122 20" stroke={YELLOW} strokeWidth={2} fill="none" strokeLinejoin="round" />
  </svg>
);

// Card 5: 태도를 선택하라 — fork in road (attitude path up, quitting path flat)
const IconChoose: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <line x1={70} y1={124} x2={70} y2={76} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <path d="M70 76 Q52 54 32 26" stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    <line x1={32} y1={26} x2={24} y2={36} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={32} y1={26} x2={44} y2={30} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <path d="M18 10 L20 16 L26 16 L22 20 L24 26 L18 22 L12 26 L14 20 L10 16 L16 16 Z"
          stroke={YELLOW} strokeWidth={2} fill="none" strokeLinejoin="round" />
    <path d="M70 76 Q92 82 114 90" stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" fill="none" strokeDasharray="5 4" />
    <line x1={108} y1={86} x2={120} y2={96} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={120} y1={86} x2={108} y2={96} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
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
    context: "재능이 없다면",
    bracket: "포기가 답이다?",
    punchline: "대부분은 이렇게 생각하고\n일찍 멈춰버린다",
    icon: <IconWilt />,
    bracketFontSize: 88,
  },
  {
    context: "태도가 있다면",
    bracket: "재능이 자란다",
    punchline: "태도는 재능을 키우고\n없던 길도 만들어낸다",
    icon: <IconBloom />,
    bracketFontSize: 95,
  },
  {
    context: "왜 그런가",
    bracket: "재능은 씨앗이다",
    punchline: "씨앗이 꽃이 되려면\n물과 햇빛과 기다림이 필요하다",
    icon: <IconSeed />,
    bracketFontSize: 88,
  },
  {
    context: "태도의 본질",
    bracket: "계속하는 힘",
    punchline: "힘든 날에도 다시 앉는 것\n그것이 재능을 꽃피운다",
    icon: <IconPersist />,
    bracketFontSize: 95,
  },
  {
    context: "",
    bracket: "태도를 선택하라",
    punchline: "재능이 없다고 탓하기 전에\n오늘 하루의 태도를 돌아봐라",
    icon: <IconChoose />,
    bracketFontSize: 88,
  },
];

export const TalentAttitude: React.FC = () => (
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
