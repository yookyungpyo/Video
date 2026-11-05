import type { CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import { clamp01 } from "../engine/easing";
import { type MotionProps, useMotion } from "../engine/motion";
import { HF } from "../theme";
import type { Rect, ScreenId } from "../screens";
import { Slice, toScreen } from "./HFMobileScreen";

/**
 * One card of an original screenshot that enters on its own (stagger) and can
 * be highlighted (accent ring + lift) without redrawing its pixels.
 */
export const AnimatedProductCard: React.FC<
  MotionProps & {
    screen: ScreenId;
    region: Rect;
    radius?: number;
    highlightAt?: number;
    highlightFor?: number;
    highlightColor?: string;
    lift?: number; // extra scale while highlighted
    style?: CSSProperties;
  }
> = ({ screen, region, radius = 24 * 0.375 * 2, highlightAt, highlightFor = 36, highlightColor = HF.blue, lift = 0.03, style, ...m }) => {
  const frame = useCurrentFrame();
  const r = useMotion({ translateY: [36, 0], duration: 20, ...m });
  if (r.opacity <= 0.001) return null;
  const h = highlightAt === undefined ? 0 : clamp01((frame - highlightAt) / 8) * (1 - clamp01((frame - highlightAt - highlightFor) / 10));
  const s = toScreen(region);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        opacity: r.opacity,
        transform: `${r.style.transform} `,
        transformOrigin: `${s.x + s.w / 2}px ${s.y + s.h / 2}px`,
        filter: r.style.filter,
        ...style,
      }}
    >
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${s.x + s.w / 2}px ${s.y + s.h / 2}px`, transform: `scale(${1 + lift * h})` }}>
        <Slice screen={screen} region={region} style={{ borderRadius: radius, boxShadow: h > 0 ? `0 0 0 ${2.5 * h}px ${highlightColor}, 0 ${12 * h}px ${28 * h}px rgba(25,55,120,${0.18 * h})` : undefined }} />
      </div>
    </div>
  );
};
