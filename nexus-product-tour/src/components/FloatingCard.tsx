import type { CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import { type MotionProps, Motion } from "../engine/motion";
import { T } from "../theme";

type Props = MotionProps & {
  children?: React.ReactNode;
  style?: CSSProperties;
  /** idle float amplitude in px (0 disables) */
  float?: number;
  floatSpeed?: number;
  phase?: number;
  highlight?: number; // 0..1 accent border glow
};

/** Glass surface card with entrance motion + deterministic idle float. */
export const FloatingCard: React.FC<Props> = ({
  children,
  style,
  float = 4,
  floatSpeed = 1,
  phase = 0,
  highlight = 0,
  ...m
}) => {
  const frame = useCurrentFrame();
  const fy = Math.sin((frame / 30) * 1.4 * floatSpeed + phase) * float;
  return (
    <Motion {...m} style={{ position: "absolute", ...pick(style) }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `translateY(${fy}px)`,
          background: `linear-gradient(180deg, ${T.surface2} 0%, ${T.surface} 100%)`,
          borderRadius: T.r.xl,
          border: `1px solid ${highlight > 0 ? `rgba(119,107,255,${0.25 + highlight * 0.55})` : T.line}`,
          boxShadow: `0 30px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.02) inset, 0 0 ${60 * highlight}px rgba(119,107,255,${0.35 * highlight})`,
          overflow: "hidden",
          ...omitPos(style),
        }}
      >
        {children}
      </div>
    </Motion>
  );
};

const POS = ["left", "top", "right", "bottom", "width", "height", "zIndex"] as const;
function pick(s?: CSSProperties) {
  const o: CSSProperties = {};
  if (!s) return o;
  for (const k of POS) if (s[k] !== undefined) (o as any)[k] = s[k];
  return o;
}
function omitPos(s?: CSSProperties) {
  const o: CSSProperties = { ...s };
  for (const k of POS) delete (o as any)[k];
  return o;
}
