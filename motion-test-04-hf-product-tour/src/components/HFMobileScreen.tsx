import type { CSSProperties } from "react";
import { Img, staticFile } from "remotion";
import { HF } from "../theme";
import { CROP_H, CROP_TOP, SRC, SRC_W, type Rect, type ScreenId } from "../screens";

/** Phone screen size on the 1920×1080 canvas. k = canvas px per source px. */
export const K = 0.375;
export const SCREEN_W = SRC_W * K; // 495
export const SCREEN_H = CROP_H * K; // 960
export const BEZEL = 12;

/** Source rect → screen-space rect (status bar cropped). */
export const toScreen = (r: Rect) => ({ x: r.x * K, y: (r.y - CROP_TOP) * K, w: r.w * K, h: r.h * K });

/**
 * A slice of an original screenshot, drawn at its own position on the screen.
 * The pixels are the untouched source image (no redraw, no distortion).
 */
export const Slice: React.FC<{
  screen: ScreenId;
  region: Rect;
  style?: CSSProperties;
  inner?: CSSProperties; // transform applied to the pixels inside the slice box (mask reveals)
  scale?: number; // extra uniform scale for the whole slice (shared element / ending)
}> = ({ screen, region, style, inner, scale = 1 }) => {
  const s = toScreen(region);
  return (
    <div style={{ position: "absolute", left: s.x, top: s.y, width: s.w, height: s.h, overflow: "hidden", ...style }}>
      <div style={{ position: "absolute", inset: 0, ...inner }}>
        <Img
          src={staticFile(SRC[screen])}
          style={{
            position: "absolute",
            left: -region.x * K * scale,
            top: -region.y * K * scale,
            width: SRC_W * K * scale,
            height: "auto",
            maxWidth: "none",
          }}
        />
      </div>
    </div>
  );
};

/** The full screen of one screenshot (status bar cropped). */
export const FullScreen: React.FC<{ screen: ScreenId; style?: CSSProperties }> = ({ screen, style }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: HF.bg, ...style }}>
    <Img
      src={staticFile(SRC[screen])}
      style={{ position: "absolute", left: 0, top: -CROP_TOP * K, width: SCREEN_W, height: "auto", maxWidth: "none" }}
    />
  </div>
);

/**
 * HFMobileScreen — device frame (neutral graphite, no maker branding) with a
 * clipped screen area. Children are positioned in screen space (495×960).
 */
export const HFMobileScreen: React.FC<{
  children: React.ReactNode;
  style?: CSSProperties;
  shadow?: number; // 0..1
}> = ({ children, style, shadow = 1 }) => (
  <div
    style={{
      position: "absolute",
      width: SCREEN_W + BEZEL * 2,
      height: SCREEN_H + BEZEL * 2,
      borderRadius: 74,
      background: "linear-gradient(160deg, #2A2C31 0%, #17181C 100%)",
      boxShadow: `0 0 0 1.5px rgba(0,0,0,0.25), 0 50px 100px rgba(25,55,120,${0.18 * shadow}), 0 18px 36px rgba(25,55,120,${0.12 * shadow})`,
      ...style,
    }}
  >
    <div
      style={{
        position: "absolute",
        left: BEZEL,
        top: BEZEL,
        width: SCREEN_W,
        height: SCREEN_H,
        borderRadius: 62,
        overflow: "hidden",
        background: HF.bg,
        // isolate so children's transforms stay clipped to the rounded screen
        isolation: "isolate",
        transform: "translateZ(0)",
      }}
    >
      {children}
    </div>
  </div>
);
