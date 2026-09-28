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

// Card 1: 위에서 하라고 했어요 — person → straight arrow → person (no processing)
const IconPassThrough: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <circle cx={70} cy={16} r={10} stroke={GRAY} strokeWidth={3.5} />
    <line x1={70} y1={26} x2={70} y2={44} stroke={GRAY} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={70} y1={34} x2={58} y2={44} stroke={GRAY} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={70} y1={34} x2={82} y2={44} stroke={GRAY} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={70} y1={52} x2={70} y2={88} stroke={YELLOW} strokeWidth={6} strokeLinecap="round" />
    <polyline points="56,80 70,96 84,80" stroke={YELLOW} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" fill="none" />
    <circle cx={70} cy={112} r={10} stroke={GRAY} strokeWidth={3.5} />
    <line x1={70} y1={122} x2={70} y2={136} stroke={GRAY} strokeWidth={3.5} strokeLinecap="round" />
  </svg>
);

// Card 2: 저도 왜 하는지 모르겠어요 — megaphone + ?
const IconEcho: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <path d="M14 48 L14 84 L46 84 L92 110 L92 22 L46 48 Z"
      stroke={GRAY} strokeWidth={4} strokeLinejoin="round" fill="none" />
    <path d="M100 46 Q116 66 100 86" stroke={GRAY} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    <text x={30} y={76} textAnchor="middle" fontSize={40} fill={YELLOW}
      fontFamily="sans-serif" fontWeight={900}>?</text>
  </svg>
);

// Card 3: 그냥 시키니까 하는 거죠 — walking person with X over head (no thinking)
const IconNoThink: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <circle cx={70} cy={32} r={14} stroke={GRAY} strokeWidth={4} />
    <line x1={56} y1={20} x2={84} y2={44} stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
    <line x1={84} y1={20} x2={56} y2={44} stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
    <line x1={70} y1={46} x2={70} y2={86} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    <line x1={70} y1={60} x2={50} y2={76} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    <line x1={70} y1={60} x2={90} y2={76} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    <line x1={70} y1={86} x2={54} y2={108} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    <line x1={70} y1={86} x2={86} y2={108} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
  </svg>
);

// Card 4: 이게 왜 중요한지 알아요? — yellow person + speech bubble with 왜?
const IconWhyBubble: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <circle cx={46} cy={50} r={14} stroke={YELLOW} strokeWidth={4} />
    <line x1={46} y1={64} x2={46} y2={100} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <line x1={46} y1={78} x2={28} y2={92} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <line x1={46} y1={78} x2={64} y2={92} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    <rect x={70} y={18} width={60} height={48} rx={10} stroke={YELLOW} strokeWidth={3.5} fill="none" />
    <line x1={78} y1={66} x2={86} y2={76} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    <text x={100} y={52} textAnchor="middle" fontSize={28} fill={YELLOW}
      fontFamily="sans-serif" fontWeight={900}>왜?</text>
  </svg>
);

// Card 5: 중간이 살아야 팀이 산다 — pyramid: leader → middle (yellow) → team
const IconBridge: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <circle cx={70} cy={16} r={10} stroke={GRAY} strokeWidth={3.5} />
    <line x1={70} y1={26} x2={70} y2={46} stroke={GRAY} strokeWidth={3} />
    <circle cx={70} cy={60} r={14} stroke={YELLOW} strokeWidth={4} />
    <line x1={58} y1={72} x2={34} y2={92} stroke={YELLOW} strokeWidth={3.5} />
    <line x1={82} y1={72} x2={106} y2={92} stroke={YELLOW} strokeWidth={3.5} />
    <circle cx={28} cy={106} r={10} stroke={GRAY} strokeWidth={3.5} />
    <line x1={28} y1={116} x2={28} y2={132} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <circle cx={112} cy={106} r={10} stroke={GRAY} strokeWidth={3.5} />
    <line x1={112} y1={116} x2={112} y2={132} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
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
    context: "중간리더가 흔히 하는 말",
    bracket: "[ 위에서 하라고 했어요 ]",
    punchline: "그 말을 듣는 팀원은\n이유를 모른 채 움직인다",
    icon: <IconPassThrough />,
    bracketFontSize: 80,
  },
  {
    context: "솔직히 나도 모름",
    bracket: "[ 저도 왜 하는지 모르겠어요 ]",
    punchline: "소화하지 않고 내려보내는 건\n전달이 아니라 메아리다",
    icon: <IconEcho />,
    bracketFontSize: 72,
  },
  {
    context: "팀원이 느끼는 것",
    bracket: "[ 그냥 시키니까 하는 거죠 ]",
    punchline: "이유 없는 일엔 몰입이 없고\n몰입 없는 팀엔 성장도 없다",
    icon: <IconNoThink />,
    bracketFontSize: 80,
  },
  {
    context: "진짜 중간리더는",
    bracket: "[ 이게 왜 중요한지 알아요? ]",
    punchline: "리더의 의도를 소화해서\n팀원의 언어로 다시 설명한다",
    icon: <IconWhyBubble />,
    bracketFontSize: 76,
  },
  {
    context: "결국",
    bracket: "[ 중간이 살아야 팀이 산다 ]",
    punchline: "위의 뜻을 이해하고\n아래에 이유를 주는 것",
    icon: <IconBridge />,
    bracketFontSize: 80,
  },
];

export const JunganLeader: React.FC = () => {
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
