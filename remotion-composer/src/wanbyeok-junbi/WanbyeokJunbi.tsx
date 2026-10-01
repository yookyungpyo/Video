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

// Card 1: 아직 준비가 덜 됐어 — clock frozen at 12 + waiting person below
const IconFrozenClock: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    <circle cx={70} cy={52} r={42} stroke={GRAY} strokeWidth={4} />
    <line x1={70} y1={52} x2={70} y2={18} stroke={GRAY} strokeWidth={4} strokeLinecap="round" />
    <line x1={70} y1={52} x2={88} y2={46} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <line x1={70} y1={11} x2={70} y2={17} stroke={GRAY} strokeWidth={3} />
    <line x1={111} y1={52} x2={105} y2={52} stroke={GRAY} strokeWidth={3} />
    <line x1={70} y1={93} x2={70} y2={87} stroke={GRAY} strokeWidth={3} />
    <line x1={29} y1={52} x2={35} y2={52} stroke={GRAY} strokeWidth={3} />
    {/* Person below, arms slightly raised (stuck waiting) */}
    <circle cx={70} cy={108} r={8} stroke={YELLOW} strokeWidth={3.5} />
    <line x1={70} y1={116} x2={70} y2={130} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={70} y1={122} x2={54} y2={116} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={70} y1={122} x2={86} y2={116} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={70} y1={130} x2={58} y2={140} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={70} y1={130} x2={82} y2={140} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
  </svg>
);

// Card 2: 완벽하게 준비된 사람은 없다 — frozen GRAY vs running YELLOW, separated by dashed line
const IconStartVsWait: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Left: frozen/stiff person (GRAY) */}
    <circle cx={34} cy={26} r={12} stroke={GRAY} strokeWidth={3.5} />
    <line x1={34} y1={38} x2={34} y2={72} stroke={GRAY} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={34} y1={52} x2={16} y2={52} stroke={GRAY} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={34} y1={52} x2={52} y2={52} stroke={GRAY} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={34} y1={72} x2={22} y2={90} stroke={GRAY} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={34} y1={72} x2={46} y2={90} stroke={GRAY} strokeWidth={3.5} strokeLinecap="round" />
    {/* Dashed divider */}
    <line x1={70} y1={8} x2={70} y2={132} stroke={GRAY} strokeWidth={1.5} strokeDasharray="5,5" />
    {/* Right: running person (YELLOW) */}
    <circle cx={106} cy={26} r={12} stroke={YELLOW} strokeWidth={3.5} />
    <line x1={106} y1={38} x2={106} y2={72} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    {/* Arms in running motion */}
    <line x1={106} y1={52} x2={88} y2={44} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={106} y1={52} x2={124} y2={60} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    {/* Legs in running motion */}
    <line x1={106} y1={72} x2={90} y2={90} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={106} y1={72} x2={124} y2={84} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    {/* Motion lines */}
    <line x1={126} y1={30} x2={136} y2={30} stroke={YELLOW} strokeWidth={2} strokeLinecap="round" />
    <line x1={128} y1={38} x2={138} y2={36} stroke={YELLOW} strokeWidth={2} strokeLinecap="round" />
    <line x1={128} y1={46} x2={138} y2={42} stroke={YELLOW} strokeWidth={2} strokeLinecap="round" />
  </svg>
);

// Card 3: 일단 꺼내놓으면 보인다 — rough scribble → lightbulb
const IconSketchReveal: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Rough sketch shape (GRAY, left) */}
    <path d="M8 72 L14 48 L10 28 L24 38 L32 18 L40 38 L52 26 L48 52 L60 58 L46 68 L52 88 L36 76 L26 94 L14 80 Z"
      stroke={GRAY} strokeWidth={3} strokeLinejoin="round" fill="none" />
    {/* Pencil strokes below */}
    <line x1={12} y1={108} x2={58} y2={108} stroke={GRAY} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={18} y1={118} x2={52} y2={118} stroke={GRAY} strokeWidth={2} strokeLinecap="round" opacity="0.5" />
    {/* Arrow */}
    <line x1={68} y1={62} x2={82} y2={62} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <polyline points="77,56 83,62 77,68" stroke={GRAY} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Lightbulb (YELLOW, right) */}
    <path d="M108 82 Q96 72 96 58 Q96 40 112 40 Q128 40 128 58 Q128 72 116 82 Z"
      stroke={YELLOW} strokeWidth={3.5} fill="none" strokeLinejoin="round" />
    <line x1={106} y1={82} x2={118} y2={82} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    <line x1={107} y1={90} x2={117} y2={90} stroke={YELLOW} strokeWidth={3.5} strokeLinecap="round" />
    <line x1={109} y1={98} x2={115} y2={98} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
    {/* Rays */}
    <line x1={112} y1={28} x2={112} y2={22} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={126} y1={34} x2={130} y2={30} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={98} y1={34} x2={94} y2={30} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={132} y1={58} x2={138} y2={58} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={92} y1={58} x2={86} y2={58} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
  </svg>
);

// Card 4: 혼자 다듬으면 제자리다 — person in spinning circle + multiple eyes outside
const IconAloneVsShared: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Person spinning in circle (GRAY) */}
    <circle cx={40} cy={62} r={32} stroke={GRAY} strokeWidth={3} strokeDasharray="8,4" />
    {/* Circular arrow */}
    <path d="M40 30 Q72 30 72 62 Q72 82 58 90" stroke={GRAY} strokeWidth={3} fill="none" strokeLinecap="round" />
    <polyline points="52,92 57,90 56,84" stroke={GRAY} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Person inside */}
    <circle cx={40} cy={50} r={7} stroke={GRAY} strokeWidth={3} />
    <line x1={40} y1={57} x2={40} y2={73} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <line x1={40} y1={63} x2={28} y2={68} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    <line x1={40} y1={63} x2={52} y2={68} stroke={GRAY} strokeWidth={3} strokeLinecap="round" />
    {/* Multiple YELLOW eyes on right side */}
    <ellipse cx={104} cy={36} rx={14} ry={9} stroke={YELLOW} strokeWidth={3} />
    <circle cx={104} cy={36} r={4} fill={YELLOW} />
    <ellipse cx={116} cy={62} rx={14} ry={9} stroke={YELLOW} strokeWidth={3} />
    <circle cx={116} cy={62} r={4} fill={YELLOW} />
    <ellipse cx={104} cy={88} rx={14} ry={9} stroke={YELLOW} strokeWidth={3} />
    <circle cx={104} cy={88} r={4} fill={YELLOW} />
    {/* Arrow from circle to eyes */}
    <line x1={78} y1={62} x2={86} y2={62} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
    <polyline points="83,57 88,62 83,67" stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

// Card 5: 스케치 → 공유 → 피드백 → 반복 — triangle loop with 3 nodes
const IconFeedbackLoop: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 140 140" fill="none">
    {/* Triangle loop nodes */}
    {/* Node top: 스케치 */}
    <circle cx={70} cy={18} r={14} stroke={YELLOW} strokeWidth={3.5} />
    {/* Pencil icon inside */}
    <line x1={64} y1={22} x2={76} y2={14} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={64} y1={22} x2={68} y2={12} stroke={YELLOW} strokeWidth={2} strokeLinecap="round" />
    {/* Node bottom-left: 공유 */}
    <circle cx={28} cy={96} r={14} stroke={YELLOW} strokeWidth={3.5} />
    {/* Arrow/share icon */}
    <line x1={22} y1={96} x2={34} y2={96} stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" />
    <polyline points="30,91 35,96 30,101" stroke={YELLOW} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Node bottom-right: 피드백 */}
    <circle cx={112} cy={96} r={14} stroke={YELLOW} strokeWidth={3.5} />
    {/* Speech bubble dots */}
    <circle cx={106} cy={96} r={2.5} fill={YELLOW} />
    <circle cx={112} cy={96} r={2.5} fill={YELLOW} />
    <circle cx={118} cy={96} r={2.5} fill={YELLOW} />
    {/* Connecting curved arrows */}
    {/* Top → bottom-left */}
    <path d="M60 28 Q28 48 34 82" stroke={YELLOW} strokeWidth={3} fill="none" strokeLinecap="round" />
    <polyline points="28,80 34,82 36,76" stroke={YELLOW} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Bottom-left → bottom-right */}
    <path d="M42 100 Q70 118 98 100" stroke={YELLOW} strokeWidth={3} fill="none" strokeLinecap="round" />
    <polyline points="94,96 98,100 93,104" stroke={YELLOW} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Bottom-right → top */}
    <path d="M106 82 Q112 48 80 28" stroke={YELLOW} strokeWidth={3} fill="none" strokeLinecap="round" />
    <polyline points="82,22 80,28 86,30" stroke={YELLOW} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Center: 반복 text */}
    <text x={70} y={74} textAnchor="middle" fontSize={18} fill={GRAY}
      fontFamily="sans-serif" fontWeight={700}>반복</text>
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
    context: "시작 못 하는 이유",
    bracket: "[ 아직 준비가 덜 됐어 ]",
    punchline: "그 말을 3개월째 하고 있다면\n준비가 문제가 아니다",
    icon: <IconFrozenClock />,
    bracketFontSize: 80,
  },
  {
    context: "준비의 함정",
    bracket: "[ 완벽하게 준비된 사람은 없다 ]",
    punchline: "시작한 사람과 안 한 사람의 차이\n그게 전부다",
    icon: <IconStartVsWait />,
    bracketFontSize: 72,
  },
  {
    context: "스케치의 힘",
    bracket: "[ 일단 꺼내놓으면 보인다 ]",
    punchline: "머릿속에 있는 건 완성이 아니다\n꺼내야 비로소 윤곽이 생긴다",
    icon: <IconSketchReveal />,
    bracketFontSize: 80,
  },
  {
    context: "공유가 촉매다",
    bracket: "[ 혼자 다듬으면 제자리다 ]",
    punchline: "피드백은 내가 못 보는 각도를\n한 번에 열어준다",
    icon: <IconAloneVsShared />,
    bracketFontSize: 80,
  },
  {
    context: "결론",
    bracket: "[ 스케치 → 공유 → 피드백 → 반복 ]",
    punchline: "이게 준비다\n완성은 과정 안에 있다",
    icon: <IconFeedbackLoop />,
    bracketFontSize: 68,
  },
];

export const WanbyeokJunbi: React.FC = () => {
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
