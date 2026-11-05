import { AbsoluteFill, useCurrentFrame } from "remotion";
import { T } from "../theme";

type Glow = { x: number; y: number; r: number; color: string; a: number };

type Props = {
  intensity?: number; // 0..1 master
  glows?: Glow[];
  grid?: number; // grid opacity 0..1
  drift?: number; // px of slow drift
};

/** Layered radial glows + faint grid; slow deterministic drift for parallax depth. */
export const GlowBackground: React.FC<Props> = ({ intensity = 1, glows, grid = 0.5, drift = 30 }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const list: Glow[] = glows ?? [
    { x: 30, y: 25, r: 55, color: "119,107,255", a: 0.22 },
    { x: 78, y: 70, r: 50, color: "66,217,200", a: 0.12 },
  ];
  const bg = list
    .map((g, i) => {
      const dx = Math.sin(t * 0.35 + i * 2.1) * drift * 0.05;
      const dy = Math.cos(t * 0.3 + i * 1.3) * drift * 0.05;
      return `radial-gradient(circle at ${g.x + dx}% ${g.y + dy}%, rgba(${g.color},${g.a * intensity}) 0%, rgba(${g.color},0) ${g.r}%)`;
    })
    .join(",");
  return (
    <AbsoluteFill style={{ background: T.bg }}>
      <AbsoluteFill style={{ background: bg }} />
      {grid > 0 && (
        <AbsoluteFill
          style={{
            opacity: grid * intensity,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            backgroundPosition: `${-frame * 0.25}px ${-frame * 0.15}px`,
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, #000 20%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, #000 20%, transparent 75%)",
          }}
        />
      )}
      {/* vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 75% at 50% 50%, transparent 55%, rgba(0,0,0,0.6) 100%)" }} />
    </AbsoluteFill>
  );
};
