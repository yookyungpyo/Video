import type { CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import { type Ease, clamp01, ease, lerp } from "../engine/easing";

type Props = {
  from?: number;
  to: number;
  startFrame?: number;
  duration?: number;
  delay?: number;
  easing?: Ease;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  style?: CSSProperties;
};

/** Number that counts from → to. Uses tabular figures so width doesn't jitter. */
export const AnimatedCounter: React.FC<Props> = ({
  from = 0,
  to,
  startFrame = 0,
  duration = 30,
  delay = 0,
  easing = ease.out,
  decimals = 0,
  prefix = "",
  suffix = "",
  style,
}) => {
  const frame = useCurrentFrame();
  const p = easing(clamp01((frame - startFrame - delay) / duration));
  const v = lerp(from, to, p);
  const txt = v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {prefix}
      {txt}
      {suffix}
    </span>
  );
};
