import { useCurrentFrame, useVideoConfig } from "remotion";
import { clamp01, ease } from "../engine/easing";
import { useFlythrough } from "./CameraFlythrough";
import { type Motion3DProps, resolve3d, tf } from "../engine/motion3d";
import type { Rect } from "../screens";
import { HF } from "../theme";
import { SCREEN_R, SH, SW, SliceImg, toScreen, usePhone } from "./HFMobileFrame";

/**
 * One extracted region of the screenshot as its own 3D layer.
 * - Pose comes from Motion3DProps / keys (relative to its original spot).
 * - When it lifts off (z > 0) the original spot shows a faint "socket"
 *   instead of the pixels, so the element is never shown twice.
 * - Shadow grows with height; optional highlight ring.
 */
export const LayeredProductCard: React.FC<
  Motion3DProps & {
    region: Rect;
    socket?: boolean;
    cardRadius?: number; // px on screen
    corners?: "top" | "bottom";
    highlight?: number; // 0..1
    highlightColor?: string;
    blur?: number;
    children?: React.ReactNode; // overlays inside the layer (e.g. pulse)
    float?: { amp: number; period: number; from: number };
  }
> = ({ region, socket = false, cardRadius = 16, corners, highlight = 0, highlightColor = HF.blue, blur, children, float, ...m }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ph = usePhone();
  const fly = useFlythrough();
  const p = resolve3d(frame, fps, { opacity: 1, ...m });
  const s = toScreen(region);
  if (float && frame >= float.from) {
    const w = clamp01((frame - float.from) / 30);
    p.y += Math.sin(((frame - float.from) / fps) * ((Math.PI * 2) / float.period)) * float.amp * w;
  }
  // CameraFlythrough: layers split to the sides as the camera passes through
  if (fly) {
    const q = ease.inOut(clamp01((frame - fly.start) / fly.duration));
    if (q > 0) {
      const side = (s.x + s.w / 2 - SW / 2) / (SW / 2); // −1 … 1
      const dir = Math.abs(side) < 0.15 ? (s.y < SH / 2 ? -1 : 1) : Math.sign(side);
      if (Math.abs(side) < 0.15) p.y += dir * q * 520;
      else p.x += dir * q * (620 + Math.abs(side) * 200);
      p.z += q * 60;
      p.ry += -dir * q * 18;
      p.o *= 1 - clamp01((q - 0.2) / 0.5);
    }
  }
  const lift = clamp01(p.z / 160);
  const o = p.o * ph.o;
  const radius = corners === "top" ? `${SCREEN_R}px ${SCREEN_R}px 0 0` : corners === "bottom" ? `0 0 ${SCREEN_R}px ${SCREEN_R}px` : socket ? `${cardRadius}px` : undefined;
  const b = blur ?? p.blur;
  return (
    <>
      {socket && lift > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: -SW / 2 + s.x,
            top: -SH / 2 + s.y,
            width: s.w,
            height: s.h,
            borderRadius: cardRadius,
            border: `1.5px dashed rgba(46,106,246,${0.25 * lift})`,
            background: HF.socket,
            opacity: ph.o * ph.o * ph.o * Math.min(1, lift * 1.5),
            transform: "translateZ(0.3px)",
          }}
        />
      )}
      {o > 0.002 && (
        <div
          style={{
            position: "absolute",
            left: -SW / 2 + s.x,
            top: -SH / 2 + s.y,
            width: s.w,
            height: s.h,
            transformOrigin: "50% 50%",
            transform: `translateZ(${0.6 + lift * 0.01}px) ${tf(p)}`,
            opacity: o,
            filter: b > 0.05 ? `blur(${b}px)` : undefined,
            borderRadius: radius,
            boxShadow: socket
              ? `0 ${6 + 30 * lift}px ${14 + 50 * lift}px rgba(20,50,120,${0.05 + 0.16 * lift})${highlight > 0 ? `, 0 0 0 ${3 * highlight}px ${highlightColor}` : ""}`
              : undefined,
          }}
        >
          <SliceImg screen={ph.screen} region={region} radius={radius} />
          {children}
        </div>
      )}
    </>
  );
};
