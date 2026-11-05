import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { easeInOut, easeOut, prog } from "../lib/anim";
import { BG, s } from "../lib/timeline";
import { HF_ACCENT, KR_FONT } from "./theme";

// Reels/Shorts safe area: keep text between ~12% and ~80% of height.
const Title: React.FC<{ kicker: string; lines: string[]; start: number; end: number; top: number }> = ({
  kicker,
  lines,
  start,
  end,
  top,
}) => {
  const frame = useCurrentFrame();
  const inP = prog(frame, start, start + 32, easeOut);
  const outP = prog(frame, end - 16, end, easeInOut);
  const op = inP * (1 - outP);
  if (op <= 0) return null;
  const tracking = interpolate(inP, [0, 1], [0.14, -0.01]);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        width: "100%",
        textAlign: "center",
        opacity: op,
        transform: `translateY(${(1 - inP) * 22 - outP * 10}px)`,
        filter: `blur(${(1 - inP) * 10 + outP * 6}px)`,
      }}
    >
      <div style={{ fontFamily: KR_FONT, fontWeight: 600, fontSize: 30, letterSpacing: "0.12em", color: "#9DB4FF", marginBottom: 22 }}>
        {kicker}
      </div>
      {lines.map((l, i) => (
        <div
          key={i}
          style={{
            fontFamily: KR_FONT,
            fontWeight: 800,
            fontSize: 78,
            lineHeight: 1.22,
            whiteSpace: "nowrap",
            letterSpacing: `${tracking}em`,
            color: "#F4F6FB",
            textShadow: "0 0 60px rgba(51,102,255,0.5), 0 2px 24px rgba(0,0,0,0.6)",
          }}
        >
          {l}
        </div>
      ))}
      <div
        style={{
          margin: "30px auto 0",
          height: 3,
          width: 180 * inP,
          background: `linear-gradient(90deg, transparent, ${HF_ACCENT}, transparent)`,
        }}
      />
    </div>
  );
};

export const HfOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn = 1 - prog(frame, 0, 18);
  const fadeOut = prog(frame, s(14.25), s(15) - 1, easeInOut);
  const scrim = Math.max(prog(frame, 8, 40) * (1 - prog(frame, s(2.6), s(3.4))), prog(frame, s(13.3), s(14)) * 0.9);
  return (
    <>
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse 85% 70% at 50% 45%, rgba(8,10,15,0) 55%, rgba(8,10,15,0.85) 100%)" }}
      />
      <AbsoluteFill
        style={{
          opacity: scrim,
          background: "linear-gradient(180deg, rgba(8,10,15,0) 55%, rgba(8,10,15,0.7) 72%, rgba(8,10,15,0.9) 100%)",
        }}
      />
      <Title kicker="HF 한국주택금융공사" lines={["내 집 마련의", "모든 순간"]} start={14} end={s(3.2)} top={1300} />
      <Title kicker="HF 앱에서 한 번에" lines={["HF와 함께,", "더 쉽고 편리하게"]} start={s(13.4)} end={s(15) + 30} top={1300} />
      <AbsoluteFill style={{ background: BG, opacity: Math.max(fadeIn, fadeOut) }} />
    </>
  );
};
