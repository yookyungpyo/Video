import { useCurrentFrame } from "remotion";
import { type MotionProps, useMotion } from "../engine/motion";
import type { Rect, ScreenId } from "../screens";
import { Slice, toScreen } from "./HFMobileScreen";

/**
 * The original 3D illustration (kept as source pixels), revealed with a
 * scale-up and then floating gently. `parallax` adds camera-linked drift.
 */
export const IllustrationFloat: React.FC<
  MotionProps & { screen: ScreenId; region: Rect; amplitude?: number; period?: number; parallax?: number }
> = ({ screen, region, amplitude = 5, period = 2.6, parallax = 0, ...m }) => {
  const frame = useCurrentFrame();
  const r = useMotion({ scale: [0.72, 1], spring: { damping: 14, mass: 0.8 }, duration: 26, ...m });
  if (r.opacity <= 0.001) return null;
  const s = toScreen(region);
  const fy = Math.sin(((frame / 30) * Math.PI * 2) / period) * amplitude * Math.min(1, Math.max(0, r.progress));
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: r.opacity,
        transformOrigin: `${s.x + s.w / 2}px ${s.y + s.h / 2}px`,
        transform: `translateY(${fy + parallax}px) ${r.style.transform}`,
      }}
    >
      <Slice screen={screen} region={region} />
    </div>
  );
};
