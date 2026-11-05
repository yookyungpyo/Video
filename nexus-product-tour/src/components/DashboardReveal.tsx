import type { CSSProperties } from "react";
import { type MotionProps, useMotion } from "../engine/motion";

type Props = MotionProps & {
  children: React.ReactNode;
  style?: CSSProperties;
  /** perspective tilt (deg) that settles to 0 as the reveal completes */
  tilt?: number;
  origin?: string;
};

/**
 * Brings a whole UI surface up from below with a perspective tilt that
 * flattens out — the "product rising onto the stage" move.
 */
export const DashboardReveal: React.FC<Props> = ({ children, style, tilt = 14, origin = "50% 100%", ...m }) => {
  const r = useMotion({ translateY: [220, 0], opacity: [0, 1], scale: [0.94, 1], duration: 32, ...m });
  if (r.opacity <= 0.001) return null;
  const rx = tilt * (1 - Math.min(1, Math.max(0, r.progress)));
  return (
    <div style={{ perspective: 2400, perspectiveOrigin: "50% 0%", ...style }}>
      <div
        style={{
          ...r.style,
          transform: `${r.style.transform} rotateX(${rx}deg)`,
          transformOrigin: origin,
          width: "100%",
          height: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
};
