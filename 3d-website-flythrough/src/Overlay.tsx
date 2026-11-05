import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { easeInOut, easeOut, prog } from "./lib/anim";
import { ACCENT, BG, s } from "./lib/timeline";

const Title: React.FC<{
  text: string;
  kicker: string;
  start: number;
  end: number;
  y: string;
  size?: number;
  track?: [number, number];
}> = ({ text, kicker, start, end, y, size = 92, track = [0.55, 0.28] }) => {
  const frame = useCurrentFrame();
  const inP = prog(frame, start, start + 32, easeOut);
  const outP = prog(frame, end - 16, end, easeInOut);
  const op = inP * (1 - outP);
  if (op <= 0) return null;
  const tracking = interpolate(inP, [0, 1], track);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: y,
          width: "100%",
          textAlign: "center",
          opacity: op,
          transform: `translateY(${(1 - inP) * 18 - outP * 10}px)`,
          filter: `blur(${(1 - inP) * 10 + outP * 6}px)`,
        }}
      >
        <div
          style={{
            fontFamily: "Inter",
            fontWeight: 500,
            fontSize: 20,
            letterSpacing: "0.5em",
            color: "#9AA3FF",
            marginBottom: 22,
            paddingLeft: "0.5em",
          }}
        >
          {kicker}
        </div>
        <div
          style={{
            fontFamily: "Inter",
            fontWeight: 700,
            fontSize: size,
            whiteSpace: "nowrap",
            letterSpacing: `${tracking}em`,
            paddingLeft: `${tracking}em`,
            color: "#F4F5FA",
            textShadow: `0 0 60px rgba(108,123,255,0.45), 0 2px 24px rgba(0,0,0,0.6)`,
          }}
        >
          {text}
        </div>
        <div
          style={{
            margin: "30px auto 0",
            height: 2,
            width: 160 * inP,
            background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const Overlay: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn = 1 - prog(frame, 0, 18);
  const fadeOut = prog(frame, s(14.25), s(15) - 1, easeInOut);
  return (
    <>
      {/* lens vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 75% 70% at 50% 50%, rgba(8,10,15,0) 55%, rgba(8,10,15,0.85) 100%)",
        }}
      />
      {/* title backing scrim so titles stay legible over panels */}
      <AbsoluteFill
        style={{
          opacity: Math.max(prog(frame, 8, 40) * (1 - prog(frame, s(2.6), s(3.4))), prog(frame, s(13.3), s(14)) * 0.9),
          background:
            "linear-gradient(180deg, rgba(8,10,15,0) 30%, rgba(8,10,15,0.55) 62%, rgba(8,10,15,0.85) 100%)",
        }}
      />
      <Title text="DIGITAL EXPERIENCE" kicker="LUMEN STUDIO" start={14} end={s(3.2)} y="73%" />
      <Title text="DESIGNED FOR EXPERIENCE" kicker="LUMEN 3.0" start={s(13.4)} end={s(15) + 30} y="74%" size={76} track={[0.4, 0.22]} />
      <AbsoluteFill style={{ background: BG, opacity: Math.max(fadeIn, fadeOut) }} />
    </>
  );
};
