import { useEffect, useState } from "react";
import {
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

// Card 1: 저는 ○○회사 ○○팀 ○○입니다 — business card as the person's face/head
const IconCardMask: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <rect x={24} y={14} width={92} height={58} rx={6} stroke={GRAY} strokeWidth={4} />
    <line x1={36} y1={30} x2={104} y2={30} stroke={GRAY} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={36} y1={43} x2={104} y2={43} stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
    <line x1={36} y1={56} x2={90} y2={56} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <line x1={70} y1={72} x2={70} y2={108} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    <line x1={70} y1={84} x2={50} y2={98} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    <line x1={70} y1={84} x2={90} y2={98} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    <line x1={70} y1={108} x2={54} y2={128} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    <line x1={70} y1={108} x2={86} y2={128} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
  </svg>
);

// Card 2: 명함이 없으면 나는 누구지? — person + large ?
const IconWhoAmI: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <circle cx={44} cy={30} r={14} stroke={GRAY} strokeWidth={4} />
    <line x1={44} y1={44} x2={44} y2={82} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    <line x1={44} y1={58} x2={24} y2={72} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    <line x1={44} y1={58} x2={64} y2={72} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    <line x1={44} y1={82} x2={28} y2={104} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    <line x1={44} y1={82} x2={60} y2={104} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    <text x={104} y={82} textAnchor="middle" fontSize={76} fill={YELLOW}
      fontFamily="sans-serif" fontWeight={900}>?</text>
  </svg>
);

// Card 3: 회사가 곧 나인 줄 알았어 — building with yellow person inside
const IconPersonInBuilding: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <rect x={14} y={22} width={112} height={106} rx={4} stroke={GRAY} strokeWidth={4} />
    <rect x={24} y={34} width={18} height={14} rx={2} stroke={GRAY} strokeWidth={2.5} />
    <rect x={52} y={34} width={18} height={14} rx={2} stroke={GRAY} strokeWidth={2.5} />
    <rect x={98} y={34} width={18} height={14} rx={2} stroke={GRAY} strokeWidth={2.5} />
    <rect x={24} y={58} width={18} height={14} rx={2} stroke={GRAY} strokeWidth={2.5} />
    <rect x={98} y={58} width={18} height={14} rx={2} stroke={GRAY} strokeWidth={2.5} />
    <circle cx={70} cy={84} r={10} stroke={YELLOW} strokeWidth={3.5} />
    <line x1={70} y1={94} x2={70} y2={116} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={70} y1={102} x2={56} y2={112} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={70} y1={102} x2={84} y2={112} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
  </svg>
);

// Card 4: 일 말고 뭘 좋아했더라? — large heart with ?
const IconForgottenHeart: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <path d="M70 118 C70 118 12 78 12 44 C12 26 26 14 44 14 C55 14 64 20 70 30 C76 20 85 14 96 14 C114 14 128 26 128 44 C128 78 70 118 70 118Z"
      stroke={YELLOW} strokeWidth={4} fill="none" />
    <text x={70} y={80} textAnchor="middle" fontSize={48} fill={YELLOW}
      fontFamily="sans-serif" fontWeight={900}>?</text>
  </svg>
);

// Card 5: 나는 ○○○을 좋아하는 사람이다 — yellow person + big star
const IconSelfStar: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <circle cx={40} cy={26} r={14} stroke={YELLOW} strokeWidth={4} />
    <line x1={40} y1={40} x2={40} y2={80} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <line x1={40} y1={54} x2={20} y2={68} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <line x1={40} y1={54} x2={60} y2={68} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <line x1={40} y1={80} x2={24} y2={102} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <line x1={40} y1={80} x2={56} y2={102} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <polygon
      points="100,12 108,36 134,36 114,52 122,76 100,60 78,76 86,52 66,36 92,36"
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
          <div style={{ color: GRAY, fontSize: 60, transform: `translateX(${(1 - t2) * -40}px)`, opacity: t2 }}>
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
          color: WHITE, fontSize: 60, fontWeight: 700,
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
    context: "처음 만난 사람에게",
    bracket: "[ 저는 ○○회사 ○○팀입니다 ]",
    punchline: "그 뒤에 오는 말이 없다면\n당신은 직함으로 살고 있는 거다",
    icon: <IconCardMask />,
    bracketFontSize: 76,
  },
  {
    context: "퇴직 후 처음 드는 생각",
    bracket: "[ 명함이 없으면 나는 누구지? ]",
    punchline: "오래 일한 사람일수록\n이 질문이 더 무섭게 느껴진다",
    icon: <IconWhoAmI />,
    bracketFontSize: 72,
  },
  {
    context: "일하는 동안 착각했던 것",
    bracket: "[ 회사가 곧 나인 줄 알았어 ]",
    punchline: "회사는 내가 머문 곳이고\n나는 그보다 훨씬 큰 사람이다",
    icon: <IconPersonInBuilding />,
    bracketFontSize: 76,
  },
  {
    context: "나를 찾는 질문",
    bracket: "[ 일 말고 뭘 좋아했더라? ]",
    punchline: "직함 없이도 빛나는 것들이\n원래의 나를 기억하고 있다",
    icon: <IconForgottenHeart />,
    bracketFontSize: 80,
  },
  {
    context: "그때부터 진짜 시작",
    bracket: "[ 나는 ○○○을 좋아하는 사람이다 ]",
    punchline: "명함 대신 좋아하는 것으로\n나를 소개할 수 있을 때",
    icon: <IconSelfStar />,
    bracketFontSize: 68,
  },
];

export const MyeongHameNaneun: React.FC = () => {
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
