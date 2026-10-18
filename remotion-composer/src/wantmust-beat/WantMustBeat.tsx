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
import { Bookmark, Heart } from "lucide-react";

// ---------------------------------------------------------------------------
// "You want → You must" — 반말 팩폭 beat-cut kinetic typography (loopable).
// Two parts of 10 pairs (PART 1: 01–10, PART 2: 11–20). 120 BPM, half-time:
// each pair = one 2s bar — question on the kick (beat 1), answer SLAMS on the
// snare (beat 3). Black stage, white + electric blue.
// Ends on a CTA — PART 1: 나머지 10개 듣고 싶어? ❤ 하트 눌러줘!
//                PART 2: 저장해 두고 흔들릴 때 🔖 다시 봐!
// ---------------------------------------------------------------------------
const FONT = "Pretendard";
const BG = "#07080B";
const WHITE = "#F4F6FB";
const MUTED = "#8C95A8";
const BLUE = "#2E6CFF";
const BLUE_BG = "#1B5CFF";
const HEART = "#FF3B5C"; // the like-button red, so the CTA reads instantly

const MASCOT = staticFile("brand/mascot.png");

// timeline (frames @30fps, 120 BPM)
const BEAT = 15;
const PER_PART = 10;
const PAIR = 4 * BEAT; // one bar per pair
const ANS = 2 * BEAT; // answer lands on beat 3
const PAIRS_AT = 4 * BEAT; // 60 — after the 1-bar hook
const DROP = PAIRS_AT + PER_PART * PAIR; // 660 — music cuts: 원하는 만큼, → 해.
const HAE = 2 * BEAT; // 해. lands on beat 3 of the drop bar
const OUTRO = DROP + 4 * BEAT; // 720 — mascot + 몇 번?
const CTA = OUTRO + 4 * BEAT; // 780 — like / save CTA
export const WANT_MUST_BEAT_FRAMES = CTA + 4 * BEAT; // 840 (28s)

type Pair = { q: string; a: string; en: string };
const PAIRS: Pair[] = [
  { q: "자유", a: "절제해.", en: "FREEDOM → DISCIPLINE" },
  { q: "성공", a: "버텨.", en: "SUCCESS → PATIENCE" },
  { q: "돈", a: "리스크 져.", en: "MONEY → RISK" },
  { q: "성장", a: "꾸준히 해.", en: "GROWTH → CONSISTENCY" },
  { q: "평온", a: "지킬 선을\n정해.", en: "PEACE → BOUNDARIES" },
  { q: "기회", a: "불편함에\n뛰어들어.", en: "OPPORTUNITY → DISCOMFORT" },
  { q: "존중", a: "정직해.", en: "RESPECT → INTEGRITY" },
  { q: "신뢰", a: "약속 지켜.", en: "TRUST → RELIABILITY" },
  { q: "리더십", a: "책임져.", en: "LEADERSHIP → RESPONSIBILITY" },
  { q: "영향력", a: "증명해.", en: "INFLUENCE → CREDIBILITY" },
  { q: "혁신", a: "실험해.", en: "INNOVATION → EXPERIMENTATION" },
  { q: "변화", a: "용기 내.", en: "CHANGE → COURAGE" },
  { q: "탁월함", a: "반복해.", en: "EXCELLENCE → PRACTICE" },
  { q: "전문성", a: "몰입해.", en: "EXPERTISE → DEEP WORK" },
  { q: "창의성", a: "질문해.", en: "CREATIVITY → CURIOSITY" },
  { q: "자신감", a: "준비해.", en: "CONFIDENCE → PREPARATION" },
  { q: "집중", a: "다 하려고\n하지 마.", en: "FOCUS → PRIORITIZATION" },
  { q: "속도", a: "결단해.", en: "SPEED → DECISIVENESS" },
  { q: "실행력", a: "끝까지 해.", en: "EXECUTION → ACCOUNTABILITY" },
  { q: "팀워크", a: "먼저\n손 내밀어.", en: "TEAMWORK → COLLABORATION" },
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
const outC = { ...clamp, easing: Easing.out(Easing.cubic) };

const rand = (i: number, salt: number): number => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const pad2 = (n: number) => String(n).padStart(2, "0");

// rough Pretendard Black advance widths (em) → font size that fits `maxW`
const emWidth = (line: string) =>
  [...line].reduce((w, c) => w + (c === " " ? 0.28 : c === "." || c === "," ? 0.3 : c === "?" ? 0.5 : /[A-Za-z0-9]/.test(c) ? 0.6 : 0.95), 0);
const fitSize = (text: string, maxW: number, cap: number) =>
  Math.min(cap, Math.floor(maxW / Math.max(...text.split("\n").map(emWidth))));

// chromatic split that decays after a slam
const rgbSplit = (age: number, k = 1) => {
  const d = interpolate(age, [0, 6], [12 * k, 0], clamp);
  return d > 0.3 ? `${d}px 0 0 rgba(255,40,90,0.75), ${-d}px 0 0 rgba(0,210,255,0.75)` : "none";
};

// ---------------------------------------------------------------------------
// Slam events drive the global camera shake / zoom punch / flash
// ---------------------------------------------------------------------------
const SLAMS: { f: number; s: number }[] = [
  { f: 2 * BEAT, s: 0.9 },
  ...Array.from({ length: PER_PART }).flatMap((_, j) => [
    { f: PAIRS_AT + j * PAIR, s: 0.3 },
    { f: PAIRS_AT + j * PAIR + ANS, s: j % 4 === 2 ? 1.4 : 1 },
  ]),
  { f: DROP + HAE, s: 2.4 },
  { f: OUTRO, s: 0.6 },
  { f: CTA, s: 0.6 },
  { f: CTA + BEAT, s: 0.5 },
].sort((a, b) => a.f - b.f);

const useSlam = () => {
  const frame = useCurrentFrame();
  let last: { f: number; s: number } | null = null;
  for (const e of SLAMS) if (e.f <= frame) last = e;
  return last ? { age: frame - last.f, s: last.s, frame } : { age: 999, s: 0, frame };
};

// the blue "invert" hit on every 4th pair's answer beat
const isInvert = (frame: number) => {
  if (frame < PAIRS_AT || frame >= DROP) return false;
  const local = frame - PAIRS_AT;
  return Math.floor(local / PAIR) % 4 === 2 && local % PAIR >= ANS;
};

// ---------------------------------------------------------------------------
// Stage: near-black + giant ghost number + grain + vignette
// ---------------------------------------------------------------------------
// pre-baked noise tile, jumped to a random offset every frame (a per-frame
// feTurbulence was heavy enough that Chrome sometimes captured unrasterized tiles)
const GRAIN = staticFile("wantmust/grain.png");
const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        opacity: 0.07,
        mixBlendMode: "screen",
        pointerEvents: "none",
        backgroundImage: `url(${GRAIN})`,
        backgroundSize: "512px 512px",
        backgroundPosition: `${Math.floor(rand(frame, 7) * 512)}px ${Math.floor(rand(frame, 8) * 512)}px`,
      }}
    />
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 60% at 50% 50%, transparent 45%, rgba(0,0,0,0.75) 100%)" }} />
);

const Flash: React.FC = () => {
  const { age, s, frame } = useSlam();
  const op = isInvert(frame) ? 0 : interpolate(age, [0, 4], [0.11 * Math.min(s, 2), 0], clamp);
  return <AbsoluteFill style={{ background: "#FFFFFF", opacity: op, pointerEvents: "none" }} />;
};

// ---------------------------------------------------------------------------
// Hook — 원하는 거 있어? [2탄] / 지금부터 알려줄게. [10가지 | 나머지 10개]
// ---------------------------------------------------------------------------
const Big: React.FC<{ text: string; color: string; size: number; age: number }> = ({ text, color, size, age }) => {
  const sc = interpolate(age, [0, 5], [1.12, 1], outC);
  return (
    <div
      style={{
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        color,
        letterSpacing: -size * 0.04,
        lineHeight: 1.08,
        whiteSpace: "nowrap",
        transform: `scale(${sc})`,
        textShadow: rgbSplit(age, 0.8),
      }}
    >
      {text}
    </div>
  );
};

// pill tag under the hook lines (outlined, or filled for the 2탄 badge)
const Tag: React.FC<{ text: string; scale: number; filled?: boolean }> = ({ text, scale, filled = false }) => (
  <div
    style={{
      marginTop: 44,
      padding: "14px 56px",
      border: `6px solid ${BLUE}`,
      borderRadius: 999,
      background: filled ? BLUE : "transparent",
      fontFamily: FONT,
      fontWeight: 900,
      fontSize: 92,
      color: WHITE,
      letterSpacing: -1,
      transform: `scale(${scale})`,
    }}
  >
    {text}
  </div>
);

// PART 2 opens as the sequel: "2탄" badge on the cover frame, "나머지 10개" tag
const HOOK_TAGS: Record<number, { cover?: string; list: string }> = {
  1: { list: "10가지" },
  2: { cover: "2탄", list: "나머지 10개" },
};

const Hook: React.FC<{ part: number }> = ({ part }) => {
  const f = useCurrentFrame();
  const second = f >= 2 * BEAT;
  const age = second ? f - 2 * BEAT : f;
  const tags = HOOK_TAGS[part];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      {!second ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${1 + f * 0.0015})` }}>
          <Big text="원하는 거" color={WHITE} size={208} age={99} />
          <Big text="있어?" color={BLUE} size={250} age={99} />
          {tags.cover && <Tag text={tags.cover} scale={1} filled />}
        </div>
      ) : (
        <>
          <Big text="지금부터" color={WHITE} size={200} age={age} />
          <Big text="알려줄게." color={BLUE} size={200} age={age} />
          <Tag text={tags.list} scale={interpolate(age, [3, 8], [0, 1], outC)} />
        </>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Pair — question on the beat, answer slams on the next. 4 rotating cut styles:
// 0 punch-zoom · 1 whip · 2 blue invert · 3 letter drop. Every pair lands in the
// same place: centered, question at a fixed top, answer starting right below.
// ---------------------------------------------------------------------------
const AnswerChars: React.FC<{ text: string; size: number; age: number; color: string }> = ({ text, size, age, color }) => {
  let k = 0;
  return (
    <>
      {text.split("\n").map((line, li) => (
        <div key={li} style={{ display: "flex", justifyContent: "inherit" }}>
          {[...line].map((c, ci) => {
            const d = k++ * 0.9;
            const p = interpolate(age, [d, d + 4], [0, 1], outC);
            return (
              <span
                key={ci}
                style={{
                  display: "inline-block",
                  whiteSpace: "pre",
                  color,
                  transform: `translateY(${(1 - p) * -size * 0.7}px) rotate(${(1 - p) * (ci % 2 ? 14 : -14)}deg)`,
                  opacity: p > 0.01 ? 1 : 0,
                }}
              >
                {c}
              </span>
            );
          })}
        </div>
      ))}
    </>
  );
};

const Q_TOP = 660; // question top (safe-area coords) — identical for every pair

const PairScene: React.FC<{ i: number; part: number }> = ({ i, part }) => {
  const f = useCurrentFrame();
  const pair = PAIRS[i];
  const tpl = (i % PER_PART) % 4;
  const aOn = f >= ANS;
  const aAge = f - ANS;
  const hold = 1 + f * 0.0007; // slow push-in while the pair holds
  const invert = tpl === 2 && aOn;

  // question entrance
  const qp = interpolate(f, [0, 4], [0, 1], outC);
  const qT =
    tpl === 1
      ? `translateX(${(1 - qp) * -320}px)`
      : tpl === 3
        ? `translateY(${(1 - qp) * -140}px)`
        : `scale(${1.25 - 0.25 * qp})`;
  const qBlur = (1 - qp) * 10;
  const qSize = 128;

  // answer entrance
  const aSize = fitSize(pair.a, 900, 290);
  const ap = interpolate(aAge, [0, 5], [0, 1], outC);
  const aT =
    tpl === 1
      ? `translateX(${(1 - ap) * 420}px)`
      : tpl === 2
        ? `scale(${1.4 - 0.4 * ap})`
        : tpl === 3
          ? "none"
          : `scale(${1.7 - 0.7 * ap})`;
  const aBlur = tpl === 3 ? 0 : (1 - ap) * 14;
  const aColor = invert ? WHITE : BLUE;
  const tagP = interpolate(aAge, [3, 9], [0, 1], outC);

  // ghost number drifts behind
  const ghostScale = interpolate(f, [0, PAIR], [1, 1.07]);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          right: -60,
          bottom: 120,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 760,
          lineHeight: 1,
          color: "transparent",
          WebkitTextStroke: `3px ${invert ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)"}`,
          transform: `scale(${ghostScale})`,
          transformOrigin: "right bottom",
          letterSpacing: -30,
        }}
      >
        {pad2(i + 1)}
      </div>
      {/* counter + brand */}
      <div style={{ position: "absolute", top: 300, left: 100, right: 100, display: "flex", justifyContent: "space-between", alignItems: "baseline", fontFamily: FONT }}>
        <div>
          <span style={{ fontWeight: 900, fontSize: 64, color: invert ? WHITE : BLUE }}>{pad2(i + 1)}</span>
          <span style={{ fontWeight: 800, fontSize: 34, color: invert ? "rgba(255,255,255,0.7)" : MUTED }}> / 20</span>
        </div>
        <div style={{ fontWeight: 800, fontSize: 30, letterSpacing: 1, color: invert ? "rgba(255,255,255,0.75)" : MUTED }}>
          <span style={{ fontWeight: 900, color: invert ? WHITE : BLUE }}>PART {part}</span> · You want → You must
        </div>
      </div>
      {/* question + answer — fixed anchor, so 1- and 2-line answers start at the same spot */}
      <AbsoluteFill style={{ transform: `scale(${hold})` }}>
        <div
          style={{
            position: "absolute",
            top: Q_TOP,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontFamily: FONT,
            fontWeight: 900,
          }}
        >
          <div
            style={{
              fontSize: qSize,
              letterSpacing: -qSize * 0.035,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
              transform: qT,
              filter: qBlur > 0.3 ? `blur(${qBlur}px)` : "none",
              opacity: (aOn ? 0.78 : 1) * Math.min(1, qp * 3),
            }}
          >
            <span style={{ color: WHITE }}>{pair.q}</span>
            <span style={{ color: invert ? "rgba(255,255,255,0.75)" : MUTED }}> 원해?</span>
          </div>
          <div
            style={{
              marginTop: 34,
              fontSize: aSize,
              letterSpacing: -aSize * 0.04,
              lineHeight: 1.04,
              color: aColor,
              textAlign: "center",
              justifyContent: "center",
              whiteSpace: "pre",
              visibility: aOn ? "visible" : "hidden",
              transform: aT,
              transformOrigin: "center center",
              filter: aBlur > 0.3 ? `blur(${aBlur}px)` : "none",
              textShadow: tpl === 3 ? "none" : rgbSplit(aAge),
            }}
          >
            {tpl === 3 ? <AnswerChars text={pair.a} size={aSize} age={aAge} color={aColor} /> : pair.a}
          </div>
          <div
            style={{
              marginTop: 40,
              fontWeight: 800,
              fontSize: 32,
              letterSpacing: 6,
              color: invert ? "rgba(255,255,255,0.8)" : MUTED,
              opacity: aOn ? tagP : 0,
              transform: `translateY(${(1 - tagP) * 14}px)`,
            }}
          >
            {pair.en}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Drop — music cuts: 원하는 만큼, (typed in silence) → 해. (giant slam)
// ---------------------------------------------------------------------------
const Drop: React.FC = () => {
  const f = useCurrentFrame();
  const line = "원하는 만큼,";
  const typed = Math.min(line.length, Math.floor(f / 2) + 1);
  const hae = f >= HAE;
  const age = f - HAE;
  const hp = interpolate(age, [0, 6], [0, 1], outC);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", fontFamily: FONT, fontWeight: 900 }}>
      <div
        style={{
          fontSize: 150,
          letterSpacing: -5,
          color: WHITE,
          whiteSpace: "pre",
          opacity: hae ? 0.7 : 1,
          transform: `translateY(${hae ? interpolate(age, [0, 6], [0, -30], outC) : 0}px)`,
        }}
      >
        {line.slice(0, typed)}
        <span style={{ opacity: !hae && f % 10 < 5 ? 1 : 0, color: BLUE }}>|</span>
      </div>
      <div
        style={{
          fontSize: 560,
          lineHeight: 1,
          letterSpacing: -20,
          color: BLUE,
          visibility: hae ? "visible" : "hidden",
          transform: `scale(${2.2 - 1.2 * hp})`,
          filter: hp < 0.95 ? `blur(${(1 - hp) * 18}px)` : "none",
          textShadow: rgbSplit(age, 2),
        }}
      >
        해.
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Outro — mascot + 너한테 제일 필요한 건 몇 번?  then 다시 물을게. (→ loop)
// ---------------------------------------------------------------------------
const Outro: React.FC<{ part: number }> = ({ part }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f - 2, fps, config: { damping: 9, stiffness: 160, mass: 0.8 } });
  const fl = Math.sin((f / fps) * 2 * Math.PI * 0.6) * 12;
  const tilt = Math.sin((f / fps) * 2 * Math.PI * 0.5) * 3;
  const q2 = interpolate(f, [BEAT, BEAT + 5], [0, 1], outC);
  const brand = interpolate(f, [2 * BEAT, 2 * BEAT + 8], [0, 1], outC);
  const w = 520;
  const h = (w * 2400) / 1350;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <div
        style={{
          position: "absolute",
          left: 540 - 520,
          top: 1170 - 520,
          width: 1040,
          height: 1040,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${BLUE}55 0%, transparent 62%)`,
          opacity: pop,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 540 - w / 2,
          top: 1170 - h / 2,
          width: w,
          height: h,
          transform: `translateY(${fl + (1 - pop) * 220}px) rotate(${tilt}deg) scale(${0.6 + 0.4 * pop})`,
          transformOrigin: "center bottom",
          filter: `drop-shadow(0 0 40px ${BLUE}66)`,
          opacity: pop > 0.02 ? 1 : 0,
        }}
      >
        <Img src={MASCOT} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
      <div style={{ position: "absolute", top: 300, width: "100%", textAlign: "center", fontWeight: 900 }}>
        <div style={{ fontSize: 84, color: WHITE, letterSpacing: -3 }}>너한테 제일 필요한 건</div>
        <div
          style={{
            fontSize: 190,
            color: BLUE,
            letterSpacing: -7,
            lineHeight: 1.1,
            opacity: q2,
            transform: `scale(${1.3 - 0.3 * q2})`,
            textShadow: rgbSplit(f - BEAT),
          }}
        >
          몇 번?
        </div>
      </div>
      <div style={{ position: "absolute", top: 1660, width: "100%", textAlign: "center", opacity: brand }}>
        <div style={{ fontWeight: 900, fontSize: 56, letterSpacing: -1.5 }}>
          <span style={{ color: WHITE }}>You want </span>
          <span style={{ color: MUTED }}>→ </span>
          <span style={{ color: WHITE }}>You </span>
          <span style={{ color: BLUE }}>must</span>
        </div>
        <div style={{ marginTop: 10, fontWeight: 600, fontSize: 32, color: MUTED, letterSpacing: 1 }}>www.wylieax.com</div>
        <div style={{ marginTop: 18, fontWeight: 800, fontSize: 34, color: BLUE, letterSpacing: 1 }}>
          {part === 1 ? "PART 2 · 11–20 계속 ▶" : "◀ PART 1 · 01–10"}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// CTA — lines slam, then the icon pops and beats on every beat
// ---------------------------------------------------------------------------
type CtaSpec = { l1: string; l2: string; icon: LucideIcon; color: string; label: string };
const CTAS: Record<number, CtaSpec> = {
  1: { l1: "나머지 10개", l2: "듣고 싶어?", icon: Heart, color: HEART, label: "하트 눌러줘!" },
  2: { l1: "저장해 두고", l2: "흔들릴 때", icon: Bookmark, color: WHITE, label: "다시 봐!" },
};

const Cta: React.FC<{ part: number }> = ({ part }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { l1, l2, icon: Icon, color, label: text } = CTAS[part];
  const heartPop = spring({ frame: f - BEAT, fps, config: { damping: 8, stiffness: 180, mass: 0.7 } });
  const beatAge = f >= BEAT ? (f - BEAT) % BEAT : 99;
  const pulse = 1 + 0.14 * Math.exp(-beatAge / 3);
  const label = interpolate(f, [BEAT + 4, BEAT + 10], [0, 1], outC);
  return (
    <AbsoluteFill style={{ alignItems: "center", fontFamily: FONT, fontWeight: 900 }}>
      <div style={{ position: "absolute", top: 380, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Big text={l1} color={WHITE} size={150} age={f} />
        <Big text={l2} color={BLUE} size={170} age={f} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 860,
          transform: `scale(${heartPop * pulse})`,
          filter: `drop-shadow(0 0 60px ${color === WHITE ? BLUE : color}88)`,
          opacity: heartPop > 0.02 ? 1 : 0,
        }}
      >
        <Icon size={340} color={color} fill={color} strokeWidth={1.5} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 1270,
          fontSize: 120,
          color: WHITE,
          letterSpacing: -4,
          opacity: label,
          transform: `translateY(${(1 - label) * 30}px)`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

export const WantMustBeat: React.FC<{ part: number }> = ({ part }) => {
  const { age, s, frame } = useSlam();
  const amp = 16 * s * Math.exp(-age / 2.2);
  const dx = amp * (rand(frame, 1) * 2 - 1);
  const dy = amp * (rand(frame, 2) * 2 - 1);
  const zoom = 1 + 0.035 * s * Math.exp(-age / 3);
  return (
    <AbsoluteFill style={{ background: isInvert(frame) ? BLUE_BG : BG }}>
      <FontLoader />
      {/* camera: shake + zoom punch on every slam */}
      <AbsoluteFill style={{ transform: `translate(${dx}px,${dy}px) scale(${zoom})` }}>
        {/* Reels safe area */}
        <AbsoluteFill style={{ transform: "translateY(-15px) scale(0.85)", transformOrigin: "center center" }}>
          <Sequence from={0} durationInFrames={PAIRS_AT}>
            <Hook part={part} />
          </Sequence>
          {Array.from({ length: PER_PART }).map((_, j) => (
            <Sequence key={j} from={PAIRS_AT + j * PAIR} durationInFrames={PAIR}>
              <PairScene i={(part - 1) * PER_PART + j} part={part} />
            </Sequence>
          ))}
          <Sequence from={DROP} durationInFrames={OUTRO - DROP}>
            <Drop />
          </Sequence>
          <Sequence from={OUTRO} durationInFrames={CTA - OUTRO}>
            <Outro part={part} />
          </Sequence>
          <Sequence from={CTA} durationInFrames={WANT_MUST_BEAT_FRAMES - CTA}>
            <Cta part={part} />
          </Sequence>
        </AbsoluteFill>
      </AbsoluteFill>
      <Vignette />
      <Grain />
      <Flash />
    </AbsoluteFill>
  );
};
