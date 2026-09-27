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
const CARD_DUR = 160, OVERLAP = 16;

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

// Card 1: 운이 좋아보이는 사람 — magnifying glass revealing a running person
const IconMagnifyEffort: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <circle cx={58} cy={56} r={36} stroke={GRAY} strokeWidth={5} />
    <line x1={85} y1={83} x2={116} y2={114} stroke={GRAY} strokeWidth={7} strokeLinecap="round" />
    <circle cx={58} cy={36} r={10} stroke={YELLOW} strokeWidth={3.5} />
    <line x1={58} y1={46} x2={58} y2={68} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={58} y1={54} x2={44} y2={64} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={58} y1={54} x2={72} y2={64} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={58} y1={68} x2={46} y2={80} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={58} y1={68} x2={70} y2={78} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
  </svg>
);

// Card 2: 기회가 안 보임 — door with golden light from keyhole
const IconHiddenDoor: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <rect x={28} y={16} width={84} height={114} rx={5} stroke={GRAY} strokeWidth={4.5} />
    <circle cx={70} cy={72} r={8} stroke={YELLOW} strokeWidth={4} />
    <path d="M64 78 L76 78 L73 96 L67 96 Z" fill={YELLOW} />
    <line x1={70} y1={52} x2={70} y2={36} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
    <line x1={83} y1={57} x2={98} y2={46} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
    <line x1={57} y1={57} x2={42} y2={46} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
  </svg>
);

// Card 3: 보이지 않는 쌓임 — stacking bars with upward arrow
const IconStackBuild: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <rect x={18} y={96} width={104} height={20} rx={5} stroke={GRAY} strokeWidth={3.5} />
    <rect x={18} y={70} width={104} height={20} rx={5} stroke={GRAY} strokeWidth={3.5} />
    <rect x={18} y={44} width={104} height={20} rx={5} stroke={YELLOW} strokeWidth={3.5} />
    <line x1={70} y1={38} x2={70} y2={12} stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
    <polyline points="57,24 70,11 83,24" stroke={YELLOW} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" fill="none" />
  </svg>
);

// Card 4: 딱 한 발짝만 더 — person just before the finish line
const IconLastStep: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <line x1={100} y1={12} x2={100} y2={128} stroke={YELLOW} strokeWidth={8} strokeLinecap="round" />
    <line x1={86} y1={56} x2={100} y2={56} stroke={GRAY} strokeWidth={3} strokeDasharray="4,3" strokeLinecap="round" />
    <circle cx={42} cy={34} r={14} stroke={YELLOW} strokeWidth={4} />
    <line x1={42} y1={48} x2={42} y2={84} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <line x1={42} y1={62} x2={26} y2={74} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <line x1={42} y1={62} x2={58} y2={72} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <line x1={42} y1={84} x2={28} y2={104} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <line x1={42} y1={84} x2={56} y2={102} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
  </svg>
);

// Card 5: 열심히가 곧 운이다 — person + equals + star
const IconEffortStar: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <circle cx={30} cy={32} r={12} stroke={YELLOW} strokeWidth={3.5} />
    <line x1={30} y1={44} x2={30} y2={72} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={30} y1={54} x2={16} y2={64} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={30} y1={54} x2={44} y2={62} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={30} y1={72} x2={18} y2={88} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={30} y1={72} x2={42} y2={86} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={62} y1={52} x2={78} y2={52} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    <line x1={62} y1={64} x2={78} y2={64} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    <polygon
      points="110,18 117,40 140,40 122,54 128,76 110,62 92,76 98,54 80,40 103,40"
      stroke={YELLOW} strokeWidth={3.5} fill="none"
    />
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
        <div style={{
          transform: `translateY(${-100 + t1 * 100}px) scale(${t1}) translateY(${iconIdle}px) rotate(${iconRot}deg)`,
          opacity: t1,
        }}>
          {icon}
        </div>
        {context ? (
          <div style={{ color: GRAY, fontSize: 52, transform: `translateX(${(1 - t2) * -40}px)`, opacity: t2 }}>
            {context}
          </div>
        ) : null}
        <div style={{
          color: YELLOW, fontSize: bracketFontSize, fontWeight: 900,
          textAlign: "center", lineHeight: 1.2,
          whiteSpace: bracketFontSize < 108 ? "nowrap" : undefined,
          ...glowStyle,
          transform: `scale(${0.8 + t3 * 0.2})`, opacity: t3,
        }}>{bracket}</div>
        <div style={{
          color: WHITE, fontSize: 52, fontWeight: 700,
          textAlign: "center", whiteSpace: "pre-line",
          transform: `translateX(${(1 - t4) * 40}px)`, opacity: t4,
        }}>{punchline}</div>
      </div>
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
    context: "주변을 보면",
    bracket: "[ 저 사람은 운이 좋아 ]",
    punchline: "근데 자세히 보면\n그 사람이 제일 열심히 했더라",
    icon: <IconMagnifyEffort />,
    bracketFontSize: 80,
  },
  {
    context: "기회가 없는 게 아니라",
    bracket: "[ 아직 눈에 안 보일 뿐 ]",
    punchline: "준비 안 된 사람 눈에는\n기회가 기회로 안 보인다",
    icon: <IconHiddenDoor />,
    bracketFontSize: 80,
  },
  {
    context: "티가 안 날 때",
    bracket: "[ 지금 쌓이고 있다 ]",
    punchline: "보이지 않는 곳에서 쌓인 것들이\n언젠가 한 번에 터진다",
    icon: <IconStackBuild />,
    bracketFontSize: 88,
  },
  {
    context: "해도 안 되는 것 같을 때",
    bracket: "[ 딱 한 발짝만 더 ]",
    punchline: "운이 들어오는 문은\n포기하기 직전에 열린다",
    icon: <IconLastStep />,
    bracketFontSize: 88,
  },
  {
    context: "결국",
    bracket: "[ 열심히가 곧 운이다 ]",
    punchline: "운을 기다리는 게 아니라\n운이 올 자리를 만드는 거다",
    icon: <IconEffortStar />,
    bracketFontSize: 84,
  },
];

export const YeolsimhiUn: React.FC = () => {
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
