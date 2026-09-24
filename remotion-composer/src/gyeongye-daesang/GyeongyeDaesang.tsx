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
const CARD_DUR = 130, OVERLAP = 14;

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

// Card 1: 자기 일만 하는 사람 — wall dividing one from team
const IconWall: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Dividing wall */}
    <line x1={72} y1={8} x2={72} y2={132} stroke={GRAY} strokeWidth={7} strokeLinecap="round" />
    {/* Person on left (yellow) */}
    <circle cx={36} cy={38} r={16} stroke={YELLOW} strokeWidth={4} />
    <line x1={36} y1={54} x2={36} y2={94} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <line x1={36} y1={68} x2={18} y2={82} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <line x1={36} y1={68} x2={54} y2={82} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    {/* Team on right (gray, excluded) */}
    <circle cx={100} cy={48} r={11} stroke={GRAY} strokeWidth={3} />
    <line x1={100} y1={59} x2={100} y2={86} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <circle cx={124} cy={48} r={11} stroke={GRAY} strokeWidth={3} />
    <line x1={124} y1={59} x2={124} y2={86} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
  </svg>
);

// Card 2: 바쁜데 결과 없음 — spinning arrow + big ?
const IconSpinEmpty: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Circular spinning arrow */}
    <path d="M28,70 A42,42 0 1,1 112,70" stroke={YELLOW} strokeWidth={6} strokeLinecap="round" />
    <polygon points="110,54 114,72 98,68" fill={YELLOW} />
    {/* Big ? */}
    <text x={70} y={86} textAnchor="middle" fontSize={52} fill={GRAY}
      fontFamily="sans-serif" fontWeight={900}>?</text>
  </svg>
);

// Card 3: 공유 안 함 — clipboard with padlock
const IconSealedReport: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Clipboard body */}
    <rect x={26} y={28} width={88} height={100} rx={6} stroke={GRAY} strokeWidth={4} />
    {/* Clipboard top clip */}
    <rect x={50} y={20} width={40} height={16} rx={5} stroke={GRAY} strokeWidth={4} />
    {/* Padlock body */}
    <rect x={52} y={74} width={36} height={28} rx={6} stroke={YELLOW} strokeWidth={4} />
    {/* Padlock shackle */}
    <path d="M60 74 L60 65 Q70 54 80 65 L80 74"
      stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
  </svg>
);

// Card 4: 기한 안 지킴 — calendar with X
const IconMissedDeadline: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Calendar outline */}
    <rect x={18} y={28} width={104} height={92} rx={6} stroke={GRAY} strokeWidth={4} />
    {/* Header bar */}
    <line x1={18} y1={52} x2={122} y2={52} stroke={GRAY} strokeWidth={3} />
    {/* Binding rings */}
    <line x1={50} y1={18} x2={50} y2={40} stroke={GRAY} strokeWidth={5} strokeLinecap="round" />
    <line x1={90} y1={18} x2={90} y2={40} stroke={GRAY} strokeWidth={5} strokeLinecap="round" />
    {/* X mark */}
    <line x1={42} y1={64} x2={98} y2={110} stroke={YELLOW} strokeWidth={8} strokeLinecap="round" />
    <line x1={98} y1={64} x2={42} y2={110} stroke={YELLOW} strokeWidth={8} strokeLinecap="round" />
  </svg>
);

// Card 5: 부정적인 사람 — light bulb with X
const IconKillIdea: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Light bulb */}
    <path d="M70,18 C46,18 28,34 28,55 C28,71 38,84 52,90 L52,106 L88,106 L88,90 C102,84 112,71 112,55 C112,34 94,18 70,18 Z"
      stroke={GRAY} strokeWidth={4} />
    <line x1={52} y1={110} x2={88} y2={110} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    <line x1={56} y1={118} x2={84} y2={118} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    {/* X mark - extinguishing */}
    <line x1={46} y1={40} x2={94} y2={88} stroke={YELLOW} strokeWidth={8} strokeLinecap="round" />
    <line x1={94} y1={40} x2={46} y2={88} stroke={YELLOW} strokeWidth={8} strokeLinecap="round" />
  </svg>
);

type CardProps = {
  context: string;
  bracket: string;
  punchline: string;
  icon: React.ReactNode;
  bracketFontSize?: number;
};

const Card: React.FC<CardProps> = ({ context, bracket, punchline, icon, bracketFontSize = 108 }) => {
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
  const glowStyle: React.CSSProperties = t3 > 0.9 ? { textShadow: `0 0 ${glowSize}px #FFD60A55` } : {};
  const catFloat = tCat > 0.95 ? Math.sin(t * Math.PI * 2 * 0.55) * 14 : 0;
  const catWiggle = tCat > 0.95 ? Math.sin(t * Math.PI * 2 * 1.1) * 3 : 0;

  return (
    <div style={{
      width: 1080, height: 1920, background: BG,
      position: "relative", overflow: "hidden",
      fontFamily: `'${FONT}', sans-serif`,
    }}>
      <div style={{
        position: "absolute", top: 200, bottom: 640, left: 60, right: 60,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 32,
      }}>
        {/* Icon */}
        <div style={{
          transform: `translateY(${-100 + t1 * 100}px) scale(${t1}) translateY(${iconIdle}px) rotate(${iconRot}deg)`,
          opacity: t1,
        }}>
          {icon}
        </div>
        {/* Context */}
        {context ? (
          <div style={{
            color: GRAY, fontSize: 28,
            transform: `translateX(${(1 - t2) * -40}px)`, opacity: t2,
          }}>{context}</div>
        ) : null}
        {/* Bracket */}
        <div style={{
          color: YELLOW, fontSize: bracketFontSize, fontWeight: 900,
          textAlign: "center", lineHeight: 1.2,
          whiteSpace: bracketFontSize < 108 ? "nowrap" : undefined,
          ...glowStyle,
          transform: `scale(${0.8 + t3 * 0.2})`, opacity: t3,
        }}>{bracket}</div>
        {/* Punchline */}
        <div style={{
          color: WHITE, fontSize: 38, fontWeight: 700,
          textAlign: "center", whiteSpace: "pre-line",
          transform: `translateX(${(1 - t4) * 40}px)`, opacity: t4,
        }}>{punchline}</div>
      </div>
      {/* Cat mascot */}
      <div style={{
        position: "absolute", bottom: 480, width: "100%",
        textAlign: "center", fontSize: 96,
        transform: `translateY(${(1 - tCat) * 60}px) translateY(${catFloat}px) rotate(${catWiggle}deg)`,
        opacity: tCat,
      }}>🐱</div>
    </div>
  );
};

const cards: CardProps[] = [
  {
    context: "팀으로 일하는데",
    bracket: "[ 그건 내 일 아닌데요 ]",
    punchline: "자기 일만 챙기는 사람 곁에선\n항상 내가 더 지친다",
    icon: <IconWall />,
    bracketFontSize: 80,
  },
  {
    context: "맨날 바쁘다는데",
    bracket: "[ 저 요즘 너무 바빠요 ]",
    punchline: "바쁘다는 말만 많고\n결과물은 아무도 못 봤다",
    icon: <IconSpinEmpty />,
    bracketFontSize: 80,
  },
  {
    context: "일이 어떻게 됐어요?",
    bracket: "[ 알아서 잘 하고 있어요 ]",
    punchline: "공유 없는 사람은\n문제가 터질 때까지 모른다",
    icon: <IconSealedReport />,
    bracketFontSize: 76,
  },
  {
    context: "오늘까지라고 했는데",
    bracket: "[ 조금만 더 주시면 돼요 ]",
    punchline: "한 번 미루는 게 습관이 되면\n신뢰는 그냥 사라진다",
    icon: <IconMissedDeadline />,
    bracketFontSize: 76,
  },
  {
    context: "뭔가 시도해보려는데",
    bracket: "[ 어차피 안 될 거잖아요 ]",
    punchline: "해보기도 전에 꺼버리는 사람\n같이 있으면 나도 작아진다",
    icon: <IconKillIdea />,
    bracketFontSize: 76,
  },
];

export const GyeongyeDaesang: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div>
      <FontLoader />
      {cards.map((card, i) => {
        const start = i * (CARD_DUR - OVERLAP);
        const op = interpolate(
          frame,
          [start, start + OVERLAP, start + CARD_DUR - OVERLAP, start + CARD_DUR],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        return (
          <div key={i} style={{ position: "absolute", inset: 0, opacity: op }}>
            <Sequence from={start} durationInFrames={CARD_DUR}>
              <Card {...card} />
            </Sequence>
          </div>
        );
      })}
    </div>
  );
};
