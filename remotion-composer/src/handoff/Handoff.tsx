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

// Card 1: Rocket (speed) + cost arrow both going up — the paradox
const IconParadox: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Rocket */}
    <path d="M70 14 C70 14 88 30 88 60 L70 72 L52 60 C52 30 70 14 70 14 Z" stroke={YELLOW} strokeWidth={4} fill="none" strokeLinejoin="round" />
    <path d="M52 60 L44 80 L60 72 L70 72 L80 72 L96 80 L88 60 Z" stroke={GRAY} strokeWidth={3} fill="none" strokeLinejoin="round" />
    <circle cx={70} cy={48} r={8} stroke={YELLOW} strokeWidth={3.5} fill="none" />
    {/* Cost arrow rising — dashed, alarming */}
    <path d="M20 120 Q36 90 56 72" stroke={YELLOW} strokeWidth={3} strokeDasharray="5 4" strokeLinecap="round" />
    <polygon points="56,72 46,76 52,84" fill={YELLOW} />
    {/* $ label */}
    <text x={14} y={124} fontSize={20} fill={YELLOW} fontFamily="sans-serif" fontWeight={700}>↑$</text>
  </svg>
);

// Card 2: Document with big question mark — no context
const IconNoContext: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Document shape */}
    <path d="M24 16 L96 16 L116 36 L116 128 L24 128 Z" stroke={GRAY} strokeWidth={4} fill="none" strokeLinejoin="round" />
    {/* Folded corner */}
    <path d="M96 16 L96 36 L116 36" stroke={GRAY} strokeWidth={3} strokeLinejoin="round" />
    {/* Text lines — missing / dotted */}
    <line x1={40} y1={58} x2={100} y2={58} stroke={GRAY} strokeWidth={3} strokeLinecap="round" strokeDasharray="6 5" />
    <line x1={40} y1={74} x2={100} y2={74} stroke={GRAY} strokeWidth={3} strokeLinecap="round" strokeDasharray="6 5" />
    <line x1={40} y1={90} x2={80} y2={90} stroke={GRAY} strokeWidth={3} strokeLinecap="round" strokeDasharray="6 5" />
    {/* Giant question mark */}
    <text x={70} y={114} textAnchor="middle" fontSize={48} fill={YELLOW} fontFamily="sans-serif" fontWeight={900}>?</text>
  </svg>
);

// Card 3: Checkmark done but blocked wall — completed but can't hand off
const IconBlocked: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Check circle — done */}
    <circle cx={36} cy={70} r={26} stroke={GRAY} strokeWidth={4} fill="none" />
    <path d="M22 70 L32 82 L52 58" stroke={GRAY} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    {/* Wall / barrier in middle */}
    <rect x={62} y={34} width={16} height={72} rx={4} fill={YELLOW} opacity={0.9} />
    {/* Bricks pattern */}
    <line x1={62} y1={58} x2={78} y2={58} stroke={BG} strokeWidth={2} />
    <line x1={62} y1={82} x2={78} y2={82} strokeWidth={2} stroke={BG} />
    <line x1={70} y1={34} x2={70} y2={58} stroke={BG} strokeWidth={2} />
    <line x1={70} y1={58} x2={70} y2={82} stroke={BG} strokeWidth={2} opacity={0} />
    {/* Person reaching from right — blocked */}
    <circle cx={108} cy={52} r={10} stroke={GRAY} strokeWidth={3.5} fill="none" />
    <path d="M108 62 L108 90" stroke={GRAY} strokeWidth={3.5} strokeLinecap="round" />
    <path d="M108 76 L86 68" stroke={GRAY} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={94} y1={90} x2={108} y2={110} stroke={GRAY} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={122} y1={90} x2={108} y2={110} stroke={GRAY} strokeWidth={3.5} strokeLinecap="round" />
  </svg>
);

// Card 4: Two arrows both up — speed ↑ cost ↑
const IconBothUp: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Left arrow: speed */}
    <line x1={38} y1={110} x2={38} y2={30} stroke={GRAY} strokeWidth={5} strokeLinecap="round" />
    <polygon points="38,20 28,42 48,42" fill={GRAY} />
    {/* Speed label */}
    <text x={38} y={126} textAnchor="middle" fontSize={18} fill={GRAY} fontFamily="sans-serif" fontWeight={700}>속도</text>
    {/* Right arrow: cost — yellow, alarming */}
    <line x1={102} y1={110} x2={102} y2={30} stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
    <polygon points="102,20 92,42 112,42" fill={YELLOW} />
    {/* Cost label */}
    <text x={102} y={126} textAnchor="middle" fontSize={18} fill={YELLOW} fontFamily="sans-serif" fontWeight={700}>비용</text>
    {/* Equal sign / both same */}
    <line x1={58} y1={66} x2={82} y2={66} stroke={WHITE} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
    <line x1={58} y1={76} x2={82} y2={76} stroke={WHITE} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
  </svg>
);

// Card 5: Speech bubble with X — can't explain = not done
const IconNoExplain: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Speech bubble */}
    <path d="M16 24 Q16 12 28 12 L112 12 Q124 12 124 24 L124 84 Q124 96 112 96 L58 96 L38 124 L42 96 L28 96 Q16 96 16 84 Z"
      stroke={YELLOW} strokeWidth={4} fill="none" strokeLinejoin="round" />
    {/* X inside */}
    <line x1={50} y1={40} x2={90} y2={72} stroke={YELLOW} strokeWidth={6} strokeLinecap="round" />
    <line x1={90} y1={40} x2={50} y2={72} stroke={YELLOW} strokeWidth={6} strokeLinecap="round" />
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
    icon: <IconParadox />,
  },
  {
    context: "AI 결과물의 특징",
    bracket: "맥락이 없다",
    punchline: "받는 사람은 처음부터 읽어야 한다",
    icon: <IconNoContext />,
  },
  {
    context: "실제로 일어나는 일",
    bracket: "완성됐는데",
    punchline: "팀원 누구도 이어받지 못한다",
    icon: <IconBlocked />,
  },
  {
    context: "진짜 병목",
    bracket: "속도는 올랐다",
    punchline: "협업 비용도 같이 올랐다",
    icon: <IconBothUp />,
  },
  {
    context: "",
    bracket: "설명 못 하면",
    punchline: "완성이 아니다",
    icon: <IconNoExplain />,
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
