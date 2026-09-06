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

// Card 1: Head with hidden light bulb — ideas are in there, just not spoken
const IconHiddenIdeas: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Head outline */}
    <path d="M70 20 C40 20 22 40 22 62 C22 82 34 96 52 100 L52 112 L88 112 L88 100 C106 96 118 82 118 62 C118 40 100 20 70 20Z" stroke={GRAY} strokeWidth={3.5} />
    {/* Mouth — sealed line */}
    <line x1={52} y1={106} x2={88} y2={106} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    {/* Light bulb inside head — YELLOW */}
    <circle cx={70} cy={58} r={14} stroke={YELLOW} strokeWidth={3} />
    <line x1={64} y1={72} x2={76} y2={72} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={66} y1={78} x2={74} y2={78} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={70} y1={44} x2={70} y2={40} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={58} y1={48} x2={55} y2={45} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={82} y1={48} x2={85} y2={45} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
  </svg>
);

// Card 2: Document with pre-stamped checkmark — decision was made before the meeting
const IconPreDecided: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Document */}
    <rect x={25} y={18} width={90} height={110} rx={6} stroke={GRAY} strokeWidth={3.5} />
    {/* Lines on document */}
    <line x1={38} y1={42} x2={102} y2={42} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={38} y1={56} x2={102} y2={56} stroke={GRAY} strokeWidth={2} strokeLinecap="round" />
    <line x1={38} y1={68} x2={80} y2={68} stroke={GRAY} strokeWidth={2} strokeLinecap="round" />
    {/* Big checkmark stamp — YELLOW */}
    <polyline points="42,95 58,112 98,75" stroke={YELLOW} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

// Card 3: Person with target rings — speaking up makes you a target
const IconTargeted: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Person */}
    <circle cx={70} cy={36} r={16} stroke={GRAY} strokeWidth={3.5} />
    <path d="M46 90 C46 68 94 68 94 90 L94 112 L46 112Z" stroke={GRAY} strokeWidth={3.5} />
    {/* Target rings — YELLOW dashed */}
    <circle cx={70} cy={70} r={36} stroke={YELLOW} strokeWidth={2.5} strokeDasharray="6 4" />
    <circle cx={70} cy={70} r={52} stroke={YELLOW} strokeWidth={2} strokeDasharray="6 4" opacity={0.6} />
    {/* Cross-hair lines */}
    <line x1={70} y1={18} x2={70} y2={30} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={70} y1={110} x2={70} y2={122} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={18} y1={70} x2={30} y2={70} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={110} y1={70} x2={122} y2={70} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
  </svg>
);

// Card 4: Sealed mouth with padlock — rational silence
const IconClosed: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Mouth / lips outline — closed */}
    <path d="M24 70 C24 58 40 48 70 48 C100 48 116 58 116 70 C116 82 100 92 70 92 C40 92 24 82 24 70Z" stroke={GRAY} strokeWidth={3.5} />
    {/* Sealed line across */}
    <line x1={26} y1={70} x2={114} y2={70} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    {/* Padlock — YELLOW */}
    <rect x={56} y={74} width={28} height={22} rx={4} fill={YELLOW} />
    <path d="M62 74 L62 64 C62 57 78 57 78 64 L78 74" stroke={YELLOW} strokeWidth={4} fill="none" strokeLinecap="round" />
    <circle cx={70} cy={85} r={3.5} fill={BG} />
  </svg>
);

// Card 5: Org chart with broken middle — structure is the problem
const IconStructureProblem: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Top box */}
    <rect x={52} y={14} width={36} height={24} rx={4} stroke={GRAY} strokeWidth={3} />
    {/* Vertical line down */}
    <line x1={70} y1={38} x2={70} y2={54} stroke={GRAY} strokeWidth={2.5} />
    {/* Middle row connector line */}
    <line x1={24} y1={54} x2={116} y2={54} stroke={GRAY} strokeWidth={2.5} />
    {/* Middle boxes */}
    <rect x={8} y={54} width={32} height={24} rx={4} stroke={GRAY} strokeWidth={3} />
    <rect x={54} y={54} width={32} height={24} rx={4} stroke={GRAY} strokeWidth={3} />
    <rect x={100} y={54} width={32} height={24} rx={4} stroke={GRAY} strokeWidth={3} />
    {/* Lines down to bottom */}
    <line x1={24} y1={78} x2={24} y2={90} stroke={GRAY} strokeWidth={2.5} />
    <line x1={116} y1={78} x2={116} y2={90} stroke={GRAY} strokeWidth={2.5} />
    {/* Bottom boxes */}
    <rect x={8} y={90} width={32} height={24} rx={4} stroke={GRAY} strokeWidth={3} />
    <rect x={100} y={90} width={32} height={24} rx={4} stroke={GRAY} strokeWidth={3} />
    {/* X on middle center box — YELLOW */}
    <line x1={58} y1={58} x2={82} y2={74} stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
    <line x1={82} y1={58} x2={58} y2={74} stroke={YELLOW} strokeWidth={5} strokeLinecap="round" />
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
    context: "오해",
    bracket: "할 말이 없는 게 아니다",
    punchline: "다 보이고\n다 알고 있다",
    icon: <IconHiddenIdeas />,
    bracketFontSize: 80,
  },
  {
    context: "경험 1",
    bracket: "말해도 안 바뀐다",
    punchline: "결정은 회의 전에 났다\n우리는 통보받은 것이다",
    icon: <IconPreDecided />,
    bracketFontSize: 95,
  },
  {
    context: "경험 2",
    bracket: "말하면 표적이 된다",
    punchline: "다른 시각 = 반항\n그게 이 조직의 문화다",
    icon: <IconTargeted />,
    bracketFontSize: 88,
  },
  {
    context: "학습",
    bracket: "그래서 입을 닫는다",
    punchline: "에너지를 아낀다\n이 조직에서의 생존법이다",
    icon: <IconClosed />,
    bracketFontSize: 88,
  },
  {
    context: "",
    bracket: "문제는 내가 아니다",
    punchline: "말이 막히는 회의를 만든\n그 구조가 문제다",
    icon: <IconStructureProblem />,
    bracketFontSize: 88,
  },
];

export const MeetingSilence: React.FC = () => (
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
