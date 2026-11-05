import type { CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import { type Ease, clamp01, ease, lerp } from "../engine/easing";
import { HF } from "../theme";

type Box = { x: number; y: number; w: number; h: number; r: number };

/**
 * Container transform: a box morphs from `from` (e.g. a product card) to `to`
 * (e.g. the whole screen). `fromContent` fades out during the first half,
 * the box fill takes over, so the card visibly becomes the next page.
 */
export const SharedElementTransition: React.FC<{
  startFrame: number;
  duration?: number;
  easing?: Ease;
  from: Box;
  to: Box;
  fromContent?: React.ReactNode;
  fill?: string;
  fromFill?: string;
  style?: CSSProperties;
}> = ({ startFrame, duration = 24, easing = ease.inOutQuint, from, to, fromContent, fill = HF.bg, fromFill = HF.blueCard, style }) => {
  const frame = useCurrentFrame();
  const raw = clamp01((frame - startFrame) / duration);
  if (frame < startFrame || raw >= 1) return null;
  const p = easing(raw);
  const b = { x: lerp(from.x, to.x, p), y: lerp(from.y, to.y, p), w: lerp(from.w, to.w, p), h: lerp(from.h, to.h, p), r: lerp(from.r, to.r, p) };
  const contentO = 1 - clamp01(raw / 0.45);
  const fillMix = clamp01((raw - 0.15) / 0.5);
  return (
    <div
      style={{
        position: "absolute",
        left: b.x,
        top: b.y,
        width: b.w,
        height: b.h,
        borderRadius: b.r,
        overflow: "hidden",
        background: fromFill,
        boxShadow: `0 20px 50px rgba(25,55,120,${0.25 * (1 - p)})`,
        ...style,
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: fill, opacity: fillMix }} />
      {contentO > 0 && (
        <div style={{ position: "absolute", left: 0, top: 0, width: from.w, height: from.h, opacity: contentO, transformOrigin: "0 0", transform: `scale(${b.w / from.w}, ${b.w / from.w})` }}>
          {fromContent}
        </div>
      )}
    </div>
  );
};
