import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  continueRender,
  delayRender,
} from "remotion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Bird,
  BookOpen,
  Brain,
  ChartColumnIncreasing,
  ChartNoAxesColumnIncreasing,
  ClipboardCheck,
  Coins,
  Crosshair,
  Crown,
  Dumbbell,
  FlaskConical,
  Footprints,
  Goal,
  Handshake,
  Hourglass,
  Leaf,
  Lightbulb,
  ListOrdered,
  MountainSnow,
  Network,
  Pencil,
  Puzzle,
  RefreshCcw,
  RefreshCw,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Split,
  Star,
  Target,
  TriangleAlert,
  Trophy,
  User,
  UserCheck,
  Users,
  UsersRound,
  Zap,
} from "lucide-react";

// ---------------------------------------------------------------------------
// "You want → You must" — clean blue/white infographic motion graphic.
// 20 pairs of 원하는 것 → 해야 할 것, one pair per beat, then a recap grid.
// The 3D plush mascot hosts (big in hook/close, small corner host in body).
// ---------------------------------------------------------------------------
const FONT = "Pretendard";
const NAVY = "#0E1630";
const BLUE = "#1B63F5";
const SKY = "#EEF3FD";
const SKY_LINE = "#D9E5FB";
const PALE = "#CFE0FF";
const GRAY = "#5B6478";

const MASCOT = staticFile("brand/mascot.png");

// timeline (frames @30fps)
const TITLE = 100;
const PAIRS_AT = 200;
const PAIR_LEN = 84;
const RECAP = PAIRS_AT + 20 * PAIR_LEN; // 1880
const RECAP_LEN = 190;
const CLOSE = RECAP + RECAP_LEN; // 2070
const CLOSE_LEN = 150;
export const WANT_MUST_FRAMES = CLOSE + CLOSE_LEN; // 2220 (74s)

type Side = { en: string; ko: string; desc: string; icon: LucideIcon };
const s = (en: string, ko: string, desc: string, icon: LucideIcon): Side => ({ en, ko, desc, icon });

const PAIRS: { want: Side; must: Side }[] = [
  { want: s("Freedom", "자유", "원하는 삶을\n스스로 선택하고 싶다.", Bird), must: s("Discipline", "자기 절제", "지금의 편안함을 조절하고\n규칙을 지켜야 한다.", Dumbbell) },
  { want: s("Success", "성공", "의미 있는 성과를\n이루고 싶다.", Trophy), must: s("Patience", "인내", "단기 결과에 흔들리지 않고\n꾸준히 기다려야 한다.", Hourglass) },
  { want: s("Money", "부", "경제적 여유를\n가지고 싶다.", Coins), must: s("Risk", "위험 감수", "불확실성을 감수하고\n도전해야 한다.", TriangleAlert) },
  { want: s("Growth", "성장", "지속적으로 발전하고\n더 나아가고 싶다.", ChartNoAxesColumnIncreasing), must: s("Consistency", "꾸준함", "작은 실행을 반복하며\n지속해야 한다.", RefreshCw) },
  { want: s("Peace", "평온", "마음의 안정과 균형을\n얻고 싶다.", Leaf), must: s("Boundaries", "경계 설정", "불필요한 것들을\n단호히 거절해야 한다.", ShieldCheck) },
  { want: s("Opportunity", "기회", "더 많은 가능성을\n만나고 싶다.", Lightbulb), must: s("Discomfort", "불편함 감수", "익숙한 상황을 벗어나\n새로운 환경에 뛰어들어야 한다.", MountainSnow) },
  { want: s("Respect", "존중", "주변의 인정과 존중을\n받고 싶다.", Users), must: s("Integrity", "정직과 원칙", "일관된 가치와 행동으로\n신뢰를 쌓아야 한다.", Scale) },
  { want: s("Trust", "신뢰", "사람들에게 신뢰받고\n함께 일하고 싶다.", Handshake), must: s("Reliability", "약속 이행", "말보다 행동으로\n책임을 다해야 한다.", BadgeCheck) },
  { want: s("Leadership", "리더십", "사람들을 이끌고\n영향력을 발휘하고 싶다.", Crown), must: s("Responsibility", "책임", "더 큰 책임을 받아들이고\n결과에 대해 책임져야 한다.", UserCheck) },
  { want: s("Influence", "영향력", "더 많은 사람들에게\n좋은 영향을 주고 싶다.", Network), must: s("Credibility", "신뢰성", "전문성과 일관된 행동으로\n신뢰를 쌓아야 한다.", Award) },
  { want: s("Innovation", "혁신", "새로운 가치를\n만들고 싶다.", Settings), must: s("Experimentation", "실험", "실패를 두려워하지 않고\n다양히 시도해야 한다.", FlaskConical) },
  { want: s("Change", "변화", "더 나은 방향으로\n바꾸고 싶다.", RefreshCcw), must: s("Courage", "용기", "지금의 익숙함을 버리고\n과감히 행동해야 한다.", Footprints) },
  { want: s("Excellence", "탁월함", "최고의 결과를\n만들고 싶다.", Star), must: s("Practice", "반복 훈련", "기본에 충실한 반복과\n연습이 필요하다.", Target) },
  { want: s("Expertise", "전문성", "특정 분야에서\n전문가가 되고 싶다.", BookOpen), must: s("Deep Work", "깊은 몰입", "방해 요소를 줄이고\n깊이 몰입해야 한다.", Brain) },
  { want: s("Creativity", "창의성", "새로운 아이디어를\n만들고 싶다.", Pencil), must: s("Curiosity", "호기심", "늘 질문하고 배우려는\n자세가 필요하다.", Search) },
  { want: s("Confidence", "자신감", "스스로를 믿고\n당당하고 싶다.", User), must: s("Preparation", "준비", "충분한 학습과 사전 준비로\n실력을 쌓아야 한다.", ClipboardCheck) },
  { want: s("Focus", "집중", "핵심에 집중하고\n성과를 내고 싶다.", Crosshair), must: s("Prioritization", "우선순위 설정", "모든 일을 다 하지 말고\n중요한 것에 집중해야 한다.", ListOrdered) },
  { want: s("Speed", "속도", "빠르게 움직이고\n기회를 잡고 싶다.", Zap), must: s("Decisiveness", "결단력", "정보를 분석하고\n신속하게 결정해야 한다.", Split) },
  { want: s("Execution", "실행력", "아이디어를\n현실로 만들고 싶다.", ChartColumnIncreasing), must: s("Accountability", "결과 책임", "끝까지 실행하고\n결과에 대해 책임져야 한다.", Goal) },
  { want: s("Teamwork", "팀워크", "함께 더 큰 성과를\n이루고 싶다.", UsersRound), must: s("Collaboration", "협력", "다른 사람과 열린 마음으로\n소통하고 협력해야 한다.", Puzzle) },
];

const fontCss = `
@font-face{font-family:'${FONT}';font-weight:600;src:url('${staticFile("fonts/Pretendard-SemiBold.woff2")}') format('woff2');}
@font-face{font-family:'${FONT}';font-weight:800;src:url('${staticFile("fonts/Pretendard-ExtraBold.woff2")}') format('woff2');}
@font-face{font-family:'${FONT}';font-weight:900;src:url('${staticFile("fonts/Pretendard-Black.woff2")}') format('woff2');}
`;

const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const done = () => continueRender(handle);
    Promise.all(
      [600, 800, 900].map((w) => (document as any).fonts.load(`${w} 80px "${FONT}"`, "중A")),
    )
      .then(() => (document as any).fonts.ready)
      .then(done)
      .catch(done);
  }, [handle]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const usePop = (delay: number, soft = false) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - delay,
    fps,
    config: soft ? { damping: 14, stiffness: 120, mass: 1 } : { damping: 10, stiffness: 170, mass: 0.8 },
  });
};
// eased 0→1 progress over [delay, delay+dur]
const useP = (delay: number, dur: number) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [delay, delay + dur], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
};
const useFloat = (amp = 10, speed = 0.45, phase = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return Math.sin((frame / fps) * 2 * Math.PI * speed + phase) * amp;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

// line icon that draws itself on (stroke-dash is inherited by every path)
const DrawIcon: React.FC<{ I: LucideIcon; size: number; color: string; p: number; stroke?: number }> = ({
  I,
  size,
  color,
  p,
  stroke = 1.8,
}) => <I size={size} color={color} strokeWidth={stroke} style={{ strokeDasharray: 80, strokeDashoffset: 80 * (1 - p) }} />;

// text that slides up out of a mask
const Reveal: React.FC<{ delay: number; children: React.ReactNode }> = ({ delay, children }) => {
  const p = usePop(delay, true);
  return (
    <div style={{ overflow: "hidden", padding: "4px 12px 10px" }}>
      <div style={{ transform: `translateY(${(1 - p) * 115}%)`, opacity: p > 0.02 ? 1 : 0 }}>{children}</div>
    </div>
  );
};

// down arrow that draws on
const DownArrow: React.FC<{ p: number; w: number; h: number; color: string; stroke: number }> = ({ p, w, h, color, stroke }) => {
  const len = h - stroke;
  const head = interpolate(p, [0.7, 1], [0, 1], clamp);
  const hw = w / 2 - stroke;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <line
        x1={w / 2}
        y1={stroke / 2}
        x2={w / 2}
        y2={h - stroke}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - p)}
      />
      <polyline
        points={`${w / 2 - hw},${h - hw - stroke} ${w / 2},${h - stroke} ${w / 2 + hw},${h - hw - stroke}`}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={head}
      />
    </svg>
  );
};

const Scene: React.FC<{ d: number; last?: boolean; children: React.ReactNode }> = ({ d, last = false, children }) => {
  const frame = useCurrentFrame();
  const opacity = last
    ? interpolate(frame, [0, 8], [0, 1], clamp)
    : interpolate(frame, [0, 8, d - 10, d], [0, 1, 1, 0], clamp);
  const out = last ? 0 : interpolate(frame, [d - 12, d], [0, -36], { ...clamp, easing: Easing.in(Easing.cubic) });
  return <AbsoluteFill style={{ opacity, transform: `translateY(${out}px)` }}>{children}</AbsoluteFill>;
};

// ---------------------------------------------------------------------------
// Background — white with a slow-drifting blue dot grid + soft sky blobs
// ---------------------------------------------------------------------------
const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const blobs = [
    { r: 900, bx: 0.15, by: 0.2, ax: 120, ay: 90, sp: 0.05, ph: 0 },
    { r: 1000, bx: 0.9, by: 0.78, ax: 130, ay: 110, sp: 0.04, ph: 2 },
  ];
  return (
    <AbsoluteFill style={{ background: "#FFFFFF", overflow: "hidden" }}>
      {blobs.map((b, i) => {
        const x = b.bx * width + Math.sin(t * 2 * Math.PI * b.sp + b.ph) * b.ax;
        const y = b.by * height + Math.cos(t * 2 * Math.PI * b.sp + b.ph) * b.ay;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - b.r / 2,
              top: y - b.r / 2,
              width: b.r,
              height: b.r,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${PALE}99 0%, transparent 65%)`,
              filter: "blur(30px)",
            }}
          />
        );
      })}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${BLUE}1F 2px, transparent 2.6px)`,
          backgroundSize: "48px 48px",
          backgroundPosition: `${(t * 6) % 48}px ${(t * 9) % 48}px`,
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, black 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, black 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Mascot host — one persistent instance that travels between scene positions
// ---------------------------------------------------------------------------
const Host: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const kf = [0, 92, 124, RECAP, RECAP + 26, CLOSE - 2, CLOSE - 1, CLOSE + 32];
  const ease = { ...clamp, easing: Easing.inOut(Easing.cubic) };
  const x = interpolate(frame, kf, [540, 540, 872, 872, 872, 872, 540, 540], ease);
  const y = interpolate(frame, kf, [1180, 1180, 1690, 1690, 2450, 2450, 2450, 1190], ease);
  const w = interpolate(frame, kf, [500, 500, 232, 232, 232, 232, 470, 470], ease);
  const h = (w * 2400) / 1350;
  const pop = usePop(4);
  const fl = useFloat(12, 0.5);
  const tilt = Math.sin((frame / fps) * 2 * Math.PI * 0.42) * 2.6;

  // body beat: a little hop each time a "must" card lands
  let hop = 0;
  let sx = 1;
  let sy = 1;
  if (frame >= PAIRS_AT && frame < RECAP) {
    const local = (frame - PAIRS_AT) % PAIR_LEN;
    if (local >= 28 && local < 46) hop = -Math.sin((Math.PI * (local - 28)) / 18) * 36;
    if (local >= 46 && local < 54) {
      const plant = Math.sin((Math.PI * (local - 46)) / 8);
      sy = 1 - plant * 0.07;
      sx = 1 + plant * 0.06;
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        transform: `translate(-50%,-50%) translateY(${fl + hop}px) rotate(${tilt}deg) scale(${pop}) scaleX(${sx}) scaleY(${sy})`,
        transformOrigin: "center bottom",
        filter: "drop-shadow(10px 18px 24px rgba(27,99,245,0.22))",
        opacity: pop > 0.05 ? 1 : 0,
      }}
    >
      <Img src={MASCOT} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 1 — Hook: 원하는 것, 있으세요?  (want chips float around the host)
// ---------------------------------------------------------------------------
const CHIPS = [
  { i: 0, x: 200, y: 790 },
  { i: 1, x: 885, y: 740 },
  { i: 2, x: 170, y: 1050 },
  { i: 3, x: 910, y: 1020 },
  { i: 4, x: 205, y: 1310 },
  { i: 7, x: 890, y: 1300 },
  { i: 6, x: 225, y: 1570 },
  { i: 9, x: 860, y: 1575 },
];

const Chip: React.FC<{ side: Side; x: number; y: number; delay: number; k: number }> = ({ side, x, y, delay, k }) => {
  const p = usePop(delay);
  const fl = useFloat(14, 0.4, k * 1.3);
  const rot = Math.sin(k * 2.1) * 5;
  const I = side.icon;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) translateY(${fl}px) rotate(${rot}deg) scale(${p})`,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "18px 30px 18px 24px",
        background: "#FFFFFF",
        border: `3px solid ${SKY_LINE}`,
        borderRadius: 999,
        boxShadow: "0 16px 34px rgba(27,99,245,0.16)",
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: 50,
        color: NAVY,
        whiteSpace: "nowrap",
      }}
    >
      <I size={46} color={BLUE} strokeWidth={2} />
      {side.ko}
    </div>
  );
};

const Hook: React.FC = () => (
  <AbsoluteFill>
    <div style={{ position: "absolute", top: 240, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Reveal delay={6}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 136, color: NAVY, letterSpacing: -4, lineHeight: 1.1 }}>원하는 것,</div>
      </Reveal>
      <Reveal delay={14}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 136, color: BLUE, letterSpacing: -4, lineHeight: 1.1 }}>있으세요?</div>
      </Reveal>
    </div>
    {CHIPS.map((c, k) => (
      <Chip key={k} side={PAIRS[c.i].want} x={c.x} y={c.y} delay={24 + k * 5} k={k} />
    ))}
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Scene 2 — Title: You want → You must
// ---------------------------------------------------------------------------
const Wordmark: React.FC<{ second: string; size: number }> = ({ second, size }) => (
  <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: -size * 0.035, lineHeight: 1.05, whiteSpace: "nowrap" }}>
    <span style={{ color: NAVY }}>You </span>
    <span style={{ color: BLUE }}>{second}</span>
  </div>
);

const Title: React.FC = () => {
  const arrow = useP(16, 14);
  const bar = useP(62, 14);
  const line = (text: React.ReactNode, delay: number) => (
    <Reveal delay={delay}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 66, color: NAVY, letterSpacing: -1.5, lineHeight: 1.25 }}>{text}</div>
    </Reveal>
  );
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 300 }}>
        <Reveal delay={4}>
          <Wordmark second="want" size={196} />
        </Reveal>
      </div>
      <div style={{ position: "absolute", top: 560 }}>
        <DownArrow p={arrow} w={96} h={200} color={NAVY} stroke={16} />
      </div>
      <div style={{ position: "absolute", top: 790 }}>
        <Reveal delay={30}>
          <Wordmark second="must" size={196} />
        </Reveal>
      </div>
      <div style={{ position: "absolute", top: 1110, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {line("원하는 것이 있다면,", 46)}
        {line("반드시 그에 상응하는", 52)}
        {line(
          <span>
            <span style={{ position: "relative", color: BLUE }}>
              <span
                style={{
                  position: "absolute",
                  left: -6,
                  right: -6,
                  bottom: 6,
                  height: 22,
                  background: PALE,
                  borderRadius: 8,
                  transform: `scaleX(${bar})`,
                  transformOrigin: "left center",
                  zIndex: -1,
                }}
              />
              행동
            </span>
            이 있습니다.
          </span>,
          58,
        )}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 3 — Pairs: WANT card → arrow → MUST card
// ---------------------------------------------------------------------------
const CARD_X = 80;
const CARD_W = 920;
const CARD_H = 530;
const WANT_Y = 250;
const MUST_Y = 930;

// shrink long English words so they stay on one line in the text column
const enSize = (word: string) => Math.min(104, Math.floor(600 / (word.length * 0.62)));

const SideCard: React.FC<{ side: Side; kind: "want" | "must"; n: number; delay: number }> = ({ side, kind, n, delay }) => {
  const frame = useCurrentFrame();
  const filled = kind === "must";
  const p = usePop(delay, true);
  const icon = useP(delay + 6, 24);
  const iconWob = Math.sin(((frame + n * 7) / 30) * 2 * Math.PI * 0.5) * 4;
  const descP = useP(delay + 12, 14);
  const shine = interpolate(frame, [delay + 16, delay + 36], [-120, 220], clamp);
  const enter = filled
    ? `translateY(${(1 - p) * 110}px) scale(${0.9 + 0.1 * p})`
    : `translateX(${(1 - p) * -160}px)`;
  const I = side.icon;
  return (
    <div
      style={{
        position: "absolute",
        left: CARD_X,
        top: filled ? MUST_Y : WANT_Y,
        width: CARD_W,
        height: CARD_H,
        boxSizing: "border-box",
        padding: "46px 52px",
        borderRadius: 44,
        background: filled ? `linear-gradient(150deg, #2C72FF 0%, ${BLUE} 55%, #1450D8 100%)` : SKY,
        border: filled ? "none" : `3px solid ${SKY_LINE}`,
        boxShadow: filled ? "0 34px 70px rgba(27,99,245,0.38)" : "0 20px 44px rgba(14,22,48,0.07)",
        transform: enter,
        opacity: Math.min(1, p * 2),
        overflow: "hidden",
        fontFamily: FONT,
      }}
    >
      {filled && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.28) 50%, transparent 62%)",
            transform: `translateX(${shine}%)`,
          }}
        />
      )}
      {/* top row: tag + label */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{
            padding: "10px 24px",
            borderRadius: 999,
            background: filled ? "#FFFFFF" : BLUE,
            color: filled ? BLUE : "#FFFFFF",
            fontWeight: 900,
            fontSize: 30,
            letterSpacing: 2,
          }}
        >
          {pad2(n)} · YOU {filled ? "MUST" : "WANT"}
        </div>
        <div style={{ fontWeight: 800, fontSize: 34, color: filled ? PALE : GRAY }}>{filled ? "해야 할 것" : "원하는 것"}</div>
      </div>
      {/* icon + words */}
      <div style={{ display: "flex", alignItems: "center", marginTop: 34 }}>
        <div
          style={{
            width: 168,
            height: 168,
            flex: "0 0 168px",
            borderRadius: "50%",
            background: "#FFFFFF",
            border: filled ? "none" : `3px solid ${SKY_LINE}`,
            boxShadow: filled ? "0 14px 30px rgba(8,30,90,0.25)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `rotate(${iconWob}deg)`,
          }}
        >
          <DrawIcon I={I} size={92} color={BLUE} p={icon} />
        </div>
        <div style={{ marginLeft: 40, display: "flex", flexDirection: "column" }}>
          <Reveal delay={delay + 4}>
            <div
              style={{
                fontWeight: 900,
                fontSize: enSize(side.en),
                color: filled ? "#FFFFFF" : NAVY,
                letterSpacing: -2,
                lineHeight: 1.05,
                whiteSpace: "nowrap",
              }}
            >
              {side.en}
            </div>
          </Reveal>
          <Reveal delay={delay + 9}>
            <div style={{ fontWeight: 800, fontSize: 60, color: filled ? PALE : BLUE, lineHeight: 1.1, whiteSpace: "nowrap" }}>{side.ko}</div>
          </Reveal>
        </div>
      </div>
      {/* description */}
      <div
        style={{
          marginTop: 32,
          fontWeight: 600,
          fontSize: 44,
          lineHeight: 1.42,
          letterSpacing: -0.5,
          color: filled ? "rgba(255,255,255,0.94)" : GRAY,
          whiteSpace: "pre-line",
          opacity: descP,
          transform: `translateY(${(1 - descP) * 18}px)`,
        }}
      >
        {side.desc}
      </div>
    </div>
  );
};

const PairScene: React.FC<{ i: number }> = ({ i }) => {
  const arrow = useP(20, 12);
  const label = useP(24, 10);
  const pair = PAIRS[i];
  return (
    <AbsoluteFill>
      <SideCard side={pair.want} kind="want" n={i + 1} delay={0} />
      <div
        style={{
          position: "absolute",
          top: WANT_Y + CARD_H + 16,
          width: "100%",
          height: MUST_Y - WANT_Y - CARD_H - 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
        }}
      >
        <DownArrow p={arrow} w={56} h={110} color={BLUE} stroke={10} />
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 46,
            color: NAVY,
            opacity: label,
            transform: `translateX(${(1 - label) * 24}px)`,
          }}
        >
          그렇다면, <span style={{ color: BLUE }}>반드시</span>
        </div>
      </div>
      <SideCard side={pair.must} kind="must" n={i + 1} delay={28} />
    </AbsoluteFill>
  );
};

// persistent chrome over all pairs: wordmark header + counter + progress dots
const PairChrome: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < PAIRS_AT - 8 || frame >= RECAP) return null;
  const opacity = interpolate(frame, [PAIRS_AT - 8, PAIRS_AT + 4, RECAP - 10, RECAP], [0, 1, 1, 0], clamp);
  const idx = Math.min(19, Math.floor((frame - PAIRS_AT) / PAIR_LEN));
  const local = frame - PAIRS_AT - idx * PAIR_LEN;
  const numPop = spring({ frame: Math.max(0, local), fps, config: { damping: 10, stiffness: 180, mass: 0.7 } });
  const pulse = 1 + Math.sin((frame / fps) * 2 * Math.PI * 1.2) * 0.12;
  return (
    <AbsoluteFill style={{ opacity }}>
      <div style={{ position: "absolute", top: 120, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 22 }}>
        <Wordmark second="want" size={64} />
        <ArrowRight size={52} color={NAVY} strokeWidth={2.6} />
        <Wordmark second="must" size={64} />
      </div>
      <div style={{ position: "absolute", left: 96, top: 1530, fontFamily: FONT, display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontWeight: 900, fontSize: 84, color: BLUE, display: "inline-block", transform: `scale(${0.7 + 0.3 * numPop})`, transformOrigin: "left bottom" }}>
          {pad2(idx + 1)}
        </span>
        <span style={{ fontWeight: 800, fontSize: 42, color: GRAY }}>/ 20</span>
      </div>
      {Array.from({ length: 20 }).map((_, k) => {
        const row = Math.floor(k / 10);
        const col = k % 10;
        const done = k < idx;
        const cur = k === idx;
        const size = cur ? 26 * pulse : 22;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: 110 + col * 56,
              top: 1680 + row * 58,
              width: size,
              height: size,
              transform: "translate(-50%,-50%)",
              borderRadius: "50%",
              background: done || cur ? BLUE : SKY_LINE,
              boxShadow: cur ? `0 0 0 8px ${PALE}` : "none",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 4 — Recap: all 20 pairs at a glance
// ---------------------------------------------------------------------------
const RecapRow: React.FC<{ k: number; x: number; y: number }> = ({ k, x, y }) => {
  const delay = 14 + k * 4;
  const p = usePop(delay, true);
  const must = useP(delay + 6, 10);
  const pair = PAIRS[k];
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 452,
        height: 84,
        boxSizing: "border-box",
        padding: "0 18px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#FFFFFF",
        border: `2px solid ${SKY_LINE}`,
        borderRadius: 22,
        boxShadow: "0 10px 24px rgba(27,99,245,0.08)",
        fontFamily: FONT,
        whiteSpace: "nowrap",
        opacity: Math.min(1, p * 2),
        transform: `translateX(${(1 - p) * -60}px)`,
      }}
    >
      <span style={{ fontWeight: 900, fontSize: 26, color: BLUE, width: 38 }}>{pad2(k + 1)}</span>
      <span style={{ fontWeight: 800, fontSize: 33, color: NAVY }}>{pair.want.ko}</span>
      <ArrowRight size={28} color={BLUE} strokeWidth={2.6} style={{ opacity: must, flex: "0 0 auto" }} />
      <span style={{ fontWeight: 800, fontSize: 33, color: BLUE, opacity: must, transform: `translateX(${(1 - must) * -12}px)` }}>
        {pair.must.ko}
      </span>
    </div>
  );
};

const Recap: React.FC = () => {
  const msg = useP(110, 16);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 150, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Reveal delay={2}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Wordmark second="want" size={84} />
            <ArrowRight size={68} color={NAVY} strokeWidth={2.6} />
            <Wordmark second="must" size={84} />
          </div>
        </Reveal>
        <Reveal delay={8}>
          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 40, color: GRAY }}>20가지, 한눈에 정리</div>
        </Reveal>
      </div>
      {PAIRS.map((_, k) => (
        <RecapRow key={k} k={k} x={k < 10 ? 76 : 552} y={380 + (k % 10) * 102} />
      ))}
      <div
        style={{
          position: "absolute",
          top: 1440,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 54,
          lineHeight: 1.35,
          color: NAVY,
          letterSpacing: -1,
          opacity: msg,
          transform: `translateY(${(1 - msg) * 24}px)`,
        }}
      >
        원하는 것이 있다면,
        <br />
        반드시 그에 상응하는 <span style={{ color: BLUE }}>행동</span>이 있습니다.
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 5 — Close: 이제, 행동할 차례.
// ---------------------------------------------------------------------------
const Close: React.FC = () => {
  const chip = usePop(34);
  const foot = useP(50, 14);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 210, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Reveal delay={6}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 84, color: NAVY, letterSpacing: -2.5 }}>원하는 것을 정했다면,</div>
        </Reveal>
        <Reveal delay={14}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 108, color: BLUE, letterSpacing: -3.5 }}>이제, 행동할 차례.</div>
        </Reveal>
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 590,
          transform: `translate(-50%,0) scale(${chip})`,
          padding: "20px 40px",
          borderRadius: 999,
          background: "#FFFFFF",
          border: `3px solid ${SKY_LINE}`,
          boxShadow: "0 16px 34px rgba(27,99,245,0.16)",
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 50,
          color: NAVY,
          whiteSpace: "nowrap",
        }}
      >
        오늘 나의 <span style={{ color: BLUE }}>You must</span>는?
      </div>
      <div
        style={{
          position: "absolute",
          top: 1720,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 40,
          color: GRAY,
          letterSpacing: 1,
          opacity: foot,
        }}
      >
        www.wylieax.com
      </div>
    </AbsoluteFill>
  );
};

export const WantMust: React.FC = () => (
  <AbsoluteFill style={{ background: "#FFFFFF" }}>
    <FontLoader />
    <Backdrop />
    {/* Reels safe area: keep everything clear of the platform UI */}
    <AbsoluteFill style={{ transform: "translateY(-15px) scale(0.85)", transformOrigin: "center center" }}>
      <Sequence from={0} durationInFrames={TITLE}>
        <Scene d={TITLE}>
          <Hook />
        </Scene>
      </Sequence>
      <Sequence from={TITLE} durationInFrames={PAIRS_AT - TITLE}>
        <Scene d={PAIRS_AT - TITLE}>
          <Title />
        </Scene>
      </Sequence>
      {PAIRS.map((_, i) => (
        <Sequence key={i} from={PAIRS_AT + i * PAIR_LEN} durationInFrames={PAIR_LEN}>
          <Scene d={PAIR_LEN}>
            <PairScene i={i} />
          </Scene>
        </Sequence>
      ))}
      <PairChrome />
      <Sequence from={RECAP} durationInFrames={RECAP_LEN}>
        <Scene d={RECAP_LEN}>
          <Recap />
        </Scene>
      </Sequence>
      <Sequence from={CLOSE} durationInFrames={CLOSE_LEN}>
        <Scene d={CLOSE_LEN} last>
          <Close />
        </Scene>
      </Sequence>
      <Host />
    </AbsoluteFill>
  </AbsoluteFill>
);
