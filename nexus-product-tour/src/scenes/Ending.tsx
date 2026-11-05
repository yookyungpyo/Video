import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { LogoMark, Wordmark } from "../components/Logo";
import { clamp01, ease, lerp } from "../engine/easing";
import { Motion } from "../engine/motion";
import { T } from "../theme";

export const END_START = 546;

/** 00:18–00:20 — logo + closing line, then fade to black. */
export const Ending: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < END_START) return null;
  const glow = ease.out(clamp01((frame - END_START) / 24));
  const push = lerp(1.04, 1, ease.out(clamp01((frame - END_START) / 50)));
  return (
    <AbsoluteFill style={{ transform: `scale(${push})` }}>
      <div
        style={{
          position: "absolute",
          left: 960 - 700,
          top: 330 - 420,
          width: 1400,
          height: 840,
          background: "radial-gradient(ellipse at center, rgba(119,107,255,0.30) 0%, rgba(66,217,200,0.08) 40%, transparent 70%)",
          opacity: glow,
        }}
      />
      <Motion
        startFrame={END_START + 2}
        duration={22}
        spring={{ damping: 14, mass: 0.7 }}
        scale={[0.7, 1]}
        style={{ position: "absolute", left: 0, right: 0, top: 266, display: "flex", justifyContent: "center", alignItems: "center", gap: 20 }}
      >
        <div style={{ filter: "drop-shadow(0 0 36px rgba(119,107,255,0.55))" }}>
          <LogoMark size={76} draw={ease.inOut(clamp01((frame - END_START - 4) / 18))} />
        </div>
        <Wordmark size={42} />
      </Motion>
      <AnimatedText
        text={"One Workspace.\nInfinite Possibilities."}
        startFrame={END_START + 10}
        duration={22}
        stagger={4}
        size={104}
        weight={800}
        tracking={-0.045}
        style={{ position: "absolute", left: 0, right: 0, top: 420 }}
      />
      <Motion startFrame={END_START + 26} duration={18} translateY={[10, 0]} style={{ position: "absolute", left: 0, right: 0, top: 710, textAlign: "center", fontFamily: T.font, fontSize: 24, color: T.text2, letterSpacing: "0.02em" }}>
        nexus.ai — Start free today
      </Motion>
    </AbsoluteFill>
  );
};
