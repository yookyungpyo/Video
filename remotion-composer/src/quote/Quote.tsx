import { useEffect, useState } from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, continueRender, delayRender, useCurrentFrame } from "remotion";

// Bright cinematic "quote reel" — airy real photo (kept bright), a single elegant
// Korean serif line near the top over a soft scrim, light grain. Ref: viral IG quote reels.
const SERIF = "Noto Serif KR";
const SANS = "Noto Sans KR";
const HAND = "Nanum Pen Script"; // handwriting (pen)

const fontCss = `
@font-face{font-family:'${SERIF}';font-weight:500;src:url('${staticFile("fonts/noto-serif-kr-korean-500-normal.woff2")}') format('woff2');}
@font-face{font-family:'${SERIF}';font-weight:600;src:url('${staticFile("fonts/noto-serif-kr-korean-600-normal.woff2")}') format('woff2');}
@font-face{font-family:'${SERIF}';font-weight:700;src:url('${staticFile("fonts/noto-serif-kr-korean-700-normal.woff2")}') format('woff2');}
@font-face{font-family:'${SANS}';font-weight:400;src:url('${staticFile("fonts/noto-sans-kr-korean-400-normal.woff2")}') format('woff2');}
@font-face{font-family:'${HAND}';font-weight:400;src:url('${staticFile("fonts/nanum-pen-script-korean-400-normal.woff2")}') format('woff2');}
`;

const Fonts: React.FC = () => {
  const [h] = useState(() => delayRender("f"));
  useEffect(() => {
    const done = () => continueRender(h);
    Promise.all([
      (document as any).fonts.load(`600 80px "${SERIF}"`, "성과묵묵"),
      (document as any).fonts.load(`400 80px "${HAND}"`, "남시선"),
      (document as any).fonts.load(`400 40px "${SANS}"`, "성과"),
    ]).then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [h]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

const Grain: React.FC = () => (
  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.08, mixBlendMode: "overlay", pointerEvents: "none" }}>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)" />
  </svg>
);

const QuoteCard: React.FC<{
  photo: string;
  lines: string[];
  top?: number;
  size?: number;
}> = ({ photo, lines, top = 250, size = 76 }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Fonts />
    {/* kept BRIGHT: only mild contrast/warmth, no darkening */}
    <Img src={staticFile(photo)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(1.02) contrast(1.05) saturate(1.03)" }} />
    {/* warm airy wash */}
    <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(255,244,230,0.05), rgba(255,250,240,0.02))" }} />
    {/* soft scrim ONLY behind top text + a touch at the very bottom for the handle */}
    <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(20,22,30,0.5) 0%, rgba(20,22,30,0.22) 22%, transparent 40%, transparent 88%, rgba(20,22,30,0.4) 100%)" }} />
    <Grain />
    {/* quote near the top */}
    <div style={{ position: "absolute", top, width: "100%", padding: "0 92px", textAlign: "center" }}>
      {lines.map((l, i) => (
        <div key={i} style={{ fontFamily: SERIF, fontWeight: 600, fontSize: size, lineHeight: 1.44, color: "#FFFFFF", textShadow: "0 2px 16px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.5)", letterSpacing: -0.5 }}>
          {l}
        </div>
      ))}
    </div>
    {/* handle */}
    <div style={{ position: "absolute", bottom: 116, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 400, fontSize: 32, letterSpacing: 6, color: "rgba(255,255,255,0.78)", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>@wylieax</div>
  </AbsoluteFill>
);

export const QuoteA: React.FC = () => <QuoteCard photo="quotephoto/p1.jpg" lines={["부족한 성과는", "결국 누군가의 몫이 된다"]} size={72} />;
export const QuoteB: React.FC = () => <QuoteCard photo="quotephoto/p2.jpg" lines={["티 안 나게, 그 빈자리를", "누군가 대신 메운다"]} size={70} />;
export const QuoteC: React.FC = () => <QuoteCard photo="quotephoto/p3.jpg" lines={["묵묵히 메우는 사람이", "가장 먼저 지친다"]} />;
export const QuoteD: React.FC = () => <QuoteCard photo="quotephoto/p4.jpg" lines={["한 사람이 무너지면", "팀 전체가 주저앉는다"]} />;
export const QuoteE: React.FC = () => <QuoteCard photo="quotephoto/p5.jpg" lines={["에이스를 갈아 넣는 건", "가장 빠른 붕괴다"]} />;

// athletic-woman aesthetic samples
export const QuoteR: React.FC = () => <QuoteCard photo="quotephoto/r1.jpg" lines={["오늘의 땀은,", "배신하지 않는다"]} />;
export const QuoteG: React.FC = () => <QuoteCard photo="quotephoto/r2.jpg" lines={["한계라고 느낀 순간이", "진짜 시작이다"]} size={66} />;

// ── athletic quote REEL (Ken Burns + crossfade + quote fade) ──────────────
type Scene = { photo: string; lines: string[]; size: number; top: number; dynamic?: boolean };
const REEL: Scene[] = [
  { photo: "quotephoto/r1.jpg", lines: ["오늘의 땀은,", "배신하지 않는다"], size: 76, top: 250 },
  { photo: "quotephoto/r3.jpg", lines: ["변명은 짧고,", "후회는 길다"], size: 76, top: 250 },
  { photo: "quotephoto/r2.jpg", lines: ["한계라고 느낀 순간이", "진짜 시작이다"], size: 66, top: 250 },
  { photo: "quotephoto/r4.jpg", lines: ["결국,", "해내는 사람이 이긴다"], size: 72, top: 250 },
  { photo: "quotephoto/r5.jpg", lines: ["묵묵히 해낸 하루가,", "나를 만든다"], size: 72, top: 250 },
];
export const REEL_DUR = 120;
export const REEL_OV = 16;
export const REEL_TOTAL = (REEL.length - 1) * (REEL_DUR - REEL_OV) + REEL_DUR;

const ReelScene: React.FC<{ s: Scene; dur: number; first: boolean; last: boolean }> = ({ s, dur, first, last }) => {
  const f = useCurrentFrame();
  // Only fade the INCOMING scene in over the previous (which stays fully opaque
  // underneath until covered) — never fade a scene out to black. This keeps total
  // on-screen brightness constant across cuts → no crossfade brightness flicker.
  const sceneOp = first ? 1 : interpolate(f, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dyn = s.dynamic;
  const scale = interpolate(f, [0, dur], dyn ? [1.12, 1.32] : [1.06, 1.16], { extrapolateRight: "clamp" });
  const panX = dyn ? interpolate(f, [0, dur], [-26, 26], { extrapolateRight: "clamp" }) : 0;
  // first scene: quote appears TOGETHER with the scene (no delay)
  const qIn0 = first ? 0 : 12;
  const qIn1 = first ? 6 : 26;
  const qOp = interpolate(f, [qIn0, qIn1, dur - 30, dur - 14], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const qY = interpolate(f, [qIn0, qIn1], [18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: sceneOp }}>
      <AbsoluteFill style={{ background: "#000" }} />
      <AbsoluteFill style={{ transform: `translateX(${panX}px) scale(${scale})` }}>
        <Img src={staticFile(s.photo)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(1.02) contrast(1.05) saturate(1.03)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(20,22,30,0.5) 0%, rgba(20,22,30,0.2) 22%, transparent 42%, transparent 86%, rgba(20,22,30,0.44) 100%)" }} />
      <Grain />
      <div style={{ position: "absolute", top: s.top, width: "100%", padding: "0 40px", textAlign: "center", opacity: qOp, transform: `translateY(${qY}px)` }}>
        {s.lines.map((l, i) => (
          <div key={i} style={{ fontFamily: HAND, fontWeight: 400, fontSize: s.size * 2.0, lineHeight: 1.18, color: "#FFFFFF", textShadow: "0 3px 22px rgba(0,0,0,0.72), 0 1px 3px rgba(0,0,0,0.7), 0 0 2px rgba(0,0,0,0.6)", letterSpacing: 0 }}>{l}</div>
        ))}
      </div>
      <div style={{ position: "absolute", bottom: 116, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 400, fontSize: 32, letterSpacing: 6, color: "rgba(255,255,255,0.78)", textShadow: "0 1px 6px rgba(0,0,0,0.5)", opacity: qOp }}>@wylieax</div>
    </AbsoluteFill>
  );
};

export const QuoteReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Fonts />
    {REEL.map((s, i) => (
      <Sequence key={i} from={i * (REEL_DUR - REEL_OV)} durationInFrames={REEL_DUR}>
        <ReelScene s={s} dur={REEL_DUR} first={i === 0} last={i === REEL.length - 1} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

// ── "남의 시선" reflective reel (self-focus / stoic) ──────────────────────
const MIND: Scene[] = [
  { photo: "quotephoto/v1.jpg", lines: ["남의 시선을", "바꾸려 하지", "마세요"], size: 72, top: 190 },
  { photo: "quotephoto/v2.jpg", lines: ["그런 데", "내 시간을", "허비하지 마세요"], size: 64, top: 180 },
  { photo: "quotephoto/v3.jpg", lines: ["타인의", "생각과 행동을", "통제할 수 있을까요?"], size: 58, top: 170, dynamic: true },
  { photo: "quotephoto/v4.jpg", lines: ["아니요,", "불가능해요"], size: 84, top: 230 },
  { photo: "quotephoto/v5.jpg", lines: ["바꿀 수 있는 건,", "오직 나 자신뿐"], size: 68, top: 220, dynamic: true },
];
export const MIND_TOTAL = (MIND.length - 1) * (REEL_DUR - REEL_OV) + REEL_DUR;

export const MindReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Fonts />
    {MIND.map((s, i) => (
      <Sequence key={i} from={i * (REEL_DUR - REEL_OV)} durationInFrames={REEL_DUR}>
        <ReelScene s={s} dur={REEL_DUR} first={i === 0} last={i === MIND.length - 1} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
