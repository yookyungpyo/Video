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

const FONT = "IPAGothic";
const BG = "#060608";
const YELLOW = "#FFD60A";
const WHITE = "#FFFFFF";
const GRAY = "#888899";

const fontCss = `
@font-face { font-family: 'IPAGothic'; font-weight: 400; font-style: normal;
  src: url('${staticFile("fonts/ipa-gothic.ttf")}') format('truetype'); }
`;

const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender("load-fonts"));
  useEffect(() => {
    const done = () => continueRender(handle);
    Promise.all([
      (document as any).fonts.load(`400 64px "${FONT}"`, "あ"),
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

// Card 1: 毎日のこと — 何のためにがんばってるんだろう (running figure + question cloud)
const IconRunning: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Head */}
    <circle cx={52} cy={28} r={11} stroke={GRAY} strokeWidth={2.5} />
    {/* Body leaning forward */}
    <line x1={52} y1={39} x2={46} y2={65} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    {/* Arm back */}
    <line x1={49} y1={50} x2={34} y2={44} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    {/* Arm forward */}
    <line x1={49} y1={50} x2={62} y2={60} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    {/* Leg back */}
    <line x1={46} y1={65} x2={34} y2={84} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={34} y1={84} x2={40} y2={102} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    {/* Leg forward */}
    <line x1={46} y1={65} x2={60} y2={78} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={60} y1={78} x2={50} y2={96} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    {/* Question bubble */}
    <ellipse cx={98} cy={34} rx={28} ry={22} stroke={YELLOW} strokeWidth={2.2} />
    <path d="M93 24 Q93 18 98 17 Q105 16 108 22 Q111 28 104 33 Q100 36 100 40"
          stroke={YELLOW} strokeWidth={2.8} strokeLinecap="round" fill="none" />
    <circle cx={100} cy={46} r={3} fill={YELLOW} />
    {/* Ground line */}
    <line x1={20} y1={108} x2={80} y2={108} stroke={GRAY} strokeWidth={2} strokeLinecap="round" opacity={0.4} />
  </svg>
);

// Card 2: 答えを探すと — 空っぽな感じがする (empty vessel)
const IconEmpty: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Cup body */}
    <path d="M36 42 L44 110 L96 110 L104 42 Z" stroke={GRAY} strokeWidth={2.5} strokeLinejoin="round" />
    {/* Cup rim */}
    <line x1={32} y1={42} x2={108} y2={42} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    {/* Handle */}
    <path d="M104 56 Q126 56 126 76 Q126 96 104 96" stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" fill="none" />
    {/* Empty swirl inside (very faint) */}
    <path d="M70 68 Q70 60 76 62 Q82 64 80 72 Q78 80 70 78 Q62 76 62 68"
          stroke={GRAY} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.35} />
    {/* Dotted lines suggesting emptiness */}
    <line x1={56} y1={80} x2={84} y2={80} stroke={GRAY} strokeWidth={1.2} strokeDasharray="4 4" opacity={0.3} />
    <line x1={52} y1={96} x2={88} y2={96} stroke={GRAY} strokeWidth={1.2} strokeDasharray="4 4" opacity={0.3} />
    {/* Yellow dot — the tiny remaining spark */}
    <circle cx={70} cy={68} r={4} fill={YELLOW} opacity={0.6} />
  </svg>
);

// Card 3: でも実は — 「なんで？」って思えること (speech bubble with ?)
const IconSpeechQ: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Speech bubble */}
    <path d="M18 22 Q18 14 26 14 L114 14 Q122 14 122 22 L122 82 Q122 90 114 90 L80 90 L70 108 L60 90 L26 90 Q18 90 18 82 Z"
          stroke={GRAY} strokeWidth={2.5} strokeLinejoin="round" />
    {/* Big ? inside */}
    <path d="M62 38 Q62 28 70 26 Q80 24 84 34 Q88 44 76 52 Q72 55 70 62"
          stroke={YELLOW} strokeWidth={4} strokeLinecap="round" fill="none" />
    <circle cx={70} cy={74} r={5} fill={YELLOW} />
  </svg>
);

// Card 4: — 意味は後でわかる (winding path to star)
const IconPath: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Winding path */}
    <path d="M20 114 Q30 100 50 104 Q70 108 80 90 Q90 72 72 60 Q54 48 66 32 Q74 20 88 18"
          stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" fill="none" strokeDasharray="5 3" />
    {/* Star at end */}
    <path d="M88 4 L91 12 L100 12 L93 17 L96 26 L88 21 L80 26 L83 17 L76 12 L85 12 Z"
          stroke={YELLOW} strokeWidth={2} fill="none" strokeLinejoin="round" />
    <circle cx={88} cy={15} r={3.5} fill={YELLOW} opacity={0.8} />
    {/* Footprints along path */}
    <ellipse cx={26} cy={108} rx={3} ry={4.5} stroke={GRAY} strokeWidth={1.2} transform="rotate(-20 26 108)" opacity={0.5} />
    <ellipse cx={36} cy={104} rx={3} ry={4.5} stroke={GRAY} strokeWidth={1.2} transform="rotate(-15 36 104)" opacity={0.5} />
    <ellipse cx={60} cy={100} rx={3} ry={4.5} stroke={GRAY} strokeWidth={1.2} transform="rotate(-5 60 100)" opacity={0.5} />
    <ellipse cx={78} cy={88} rx={3} ry={4.5} stroke={GRAY} strokeWidth={1.2} transform="rotate(20 78 88)" opacity={0.5} />
    {/* Arrow at end of path */}
    <path d="M84 22 L88 16 L92 22" stroke={YELLOW} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

// Card 5: — だから今日も (rising sun)
const IconSunrise: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Horizon line */}
    <line x1={14} y1={88} x2={126} y2={88} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    {/* Sun semicircle */}
    <path d="M30 88 Q30 46 70 46 Q110 46 110 88" stroke={YELLOW} strokeWidth={3} fill="none" />
    <circle cx={70} cy={88} r={3} fill={YELLOW} opacity={0.6} />
    {/* Rays */}
    <line x1={70} y1={38} x2={70} y2={28} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={92} y1={46} x2={99} y2={38} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={48} y1={46} x2={41} y2={38} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={108} y1={66} x2={118} y2={62} stroke={YELLOW} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
    <line x1={32} y1={66} x2={22} y2={62} stroke={YELLOW} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
    {/* Ground glow lines */}
    <line x1={30} y1={98} x2={50} y2={98} stroke={GRAY} strokeWidth={1.5} strokeLinecap="round" opacity={0.4} />
    <line x1={90} y1={98} x2={110} y2={98} stroke={GRAY} strokeWidth={1.5} strokeLinecap="round" opacity={0.4} />
    <line x1={20} y1={108} x2={120} y2={108} stroke={GRAY} strokeWidth={1.5} strokeLinecap="round" opacity={0.25} />
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
            width: 280,
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
              letterSpacing: 0,
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
            fontWeight: 400,
            fontSize: bracketFontSize,
            color: YELLOW,
            textAlign: "center",
            letterSpacing: 0,
            lineHeight: 1.2,
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
            fontWeight: 400,
            fontSize: 52,
            color: WHITE,
            textAlign: "center",
            letterSpacing: 0,
            paddingLeft: 60,
            paddingRight: 60,
            lineHeight: 1.5,
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
    context: "毎日のこと",
    bracket: "何のためにがんばってるんだろう",
    punchline: "朝起きてまた走り出して\nでもなんでだろうって思う",
    icon: <IconRunning />,
    bracketFontSize: 52,
  },
  {
    context: "答えを探すと",
    bracket: "空っぽな感じがする",
    punchline: "がんばればがんばるほど\nなんかよくわからなくなる",
    icon: <IconEmpty />,
    bracketFontSize: 82,
  },
  {
    context: "でも実は",
    bracket: "「なんで？」って思えること",
    punchline: "それって一番\nちゃんと生きてる証拠だよ",
    icon: <IconSpeechQ />,
    bracketFontSize: 68,
  },
  {
    context: "",
    bracket: "意味は後でわかる",
    punchline: "理由わからなくても走ってて\nその道のりが人生になってく",
    icon: <IconPath />,
    bracketFontSize: 82,
  },
  {
    context: "",
    bracket: "だから今日も",
    punchline: "答えが出なくてもいい\n走り続けること、それが答えなんだ",
    icon: <IconSunrise />,
    bracketFontSize: 92,
  },
];

export const NandeGanbare: React.FC = () => (
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
