import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { LogoMark, Wordmark } from "../components/Logo";
import { clamp01, ease, lerp } from "../engine/easing";
import { Motion } from "../engine/motion";
import { T } from "../theme";

/** 00:00–00:03 — a point of light blooms into the NEXUS AI logo. */
export const Opening: React.FC = () => {
  const frame = useCurrentFrame();
  // light point → bloom
  const bloom = ease.out(clamp01(frame / 34));
  const core = lerp(4, 520, bloom);
  const coreOpacity = clamp01(frame / 6) * lerp(1, 0.55, bloom);
  // camera push-in on the whole group, then push *through* into scene 02
  const push = lerp(1, 1.05, ease.inOut(clamp01(frame / 90)));
  const exitP = ease.in(clamp01((frame - 78) / 18));
  const groupScale = push * lerp(1, 1.35, exitP);
  const groupOpacity = 1 - exitP;
  if (groupOpacity <= 0) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: groupOpacity, filter: exitP > 0.02 ? `blur(${exitP * 14}px)` : undefined }}>
      <AbsoluteFill style={{ transform: `scale(${groupScale})` }}>
        {/* light */}
        <div
          style={{
            position: "absolute",
            left: 960 - core,
            top: 470 - core,
            width: core * 2,
            height: core * 2,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(160,150,255,0.55) 6%, rgba(119,107,255,0.22) 26%, rgba(66,217,200,0.06) 50%, transparent 70%)",
            opacity: coreOpacity,
          }}
        />
        {/* thin horizontal flare */}
        <div
          style={{
            position: "absolute",
            left: 960 - lerp(0, 700, bloom),
            top: 469,
            width: lerp(0, 1400, bloom),
            height: 2,
            background: "linear-gradient(90deg, transparent, rgba(185,178,255,0.8), transparent)",
            opacity: clamp01(frame / 8) * (1 - ease.inOut(clamp01((frame - 24) / 20))),
          }}
        />
        {/* logo */}
        <Motion
          startFrame={14}
          duration={26}
          spring={{ damping: 14, mass: 0.7 }}
          scale={[0.55, 1]}
          opacity={[0, 1]}
          style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center", alignItems: "center", gap: 22 }}
        >
          <div style={{ filter: "drop-shadow(0 0 40px rgba(119,107,255,0.6))" }}>
            <LogoMark size={84} draw={ease.inOut(clamp01((frame - 18) / 22))} />
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ transform: `translateX(${(1 - ease.out(clamp01((frame - 24) / 20))) * -40}px)`, opacity: clamp01((frame - 24) / 12) }}>
              <Wordmark size={46} />
            </div>
          </div>
        </Motion>
        {/* title + subtitle (mask reveal) */}
        <AnimatedText
          text="Work Smarter."
          startFrame={38}
          duration={24}
          stagger={5}
          size={132}
          weight={800}
          tracking={-0.045}
          style={{ position: "absolute", left: 0, right: 0, top: 440 }}
        />
        <AnimatedText
          text="Powered by AI."
          startFrame={52}
          duration={22}
          stagger={4}
          size={48}
          weight={600}
          tracking={-0.02}
          gradient={T.gradient}
          style={{ position: "absolute", left: 0, right: 0, top: 612 }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
