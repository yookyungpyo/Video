import { createContext, useContext, type CSSProperties } from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { type Motion3DProps, type Pose, resolve3d, tf } from "../engine/motion3d";
import { CROP_H, CROP_TOP, SRC, SRC_W, type Rect, type ScreenId } from "../screens";
import { HF } from "../theme";

export const K = 0.36; // canvas px per source px at camera distance 0
export const SW = SRC_W * K; // 475
export const SH = CROP_H * K; // 922
export const BEZEL = 12;
export const SCREEN_R = 58;

export const toScreen = (r: Rect) => ({ x: r.x * K, y: (r.y - CROP_TOP) * K, w: r.w * K, h: r.h * K });

/** Group opacity can't be applied to a preserve-3d parent (it would flatten),
 *  so phones pass it down to every leaf through context. */
const PhoneCtx = createContext({ o: 1, screen: "main" as ScreenId });
export const usePhone = () => useContext(PhoneCtx);

/** Raw pixels of one source region (leaf, 2D). */
export const SliceImg: React.FC<{ screen: ScreenId; region: Rect; radius?: string; style?: CSSProperties }> = ({ screen, region, radius, style }) => {
  const s = toScreen(region);
  return (
    <div style={{ position: "relative", width: s.w, height: s.h, overflow: "hidden", borderRadius: radius, ...style }}>
      <Img src={staticFile(SRC[screen])} style={{ position: "absolute", left: -region.x * K, top: -region.y * K, width: SRC_W * K, maxWidth: "none" }} />
    </div>
  );
};

/**
 * HFMobileFrame — neutral graphite device (no maker branding) built from
 * stacked planes so it shows a sliver of thickness when the camera orbits.
 */
export const HFMobileFrame: React.FC<{ o: number; shadow?: number }> = ({ o: oIn, shadow = 1 }) => {
  // the dark device fades well before the white screen, so a fading phone
  // dissolves to light instead of turning gray
  const o = Math.max(0, (oIn - 0.5) * 2);
  const plane = (z: number, c: string, extra: CSSProperties = {}) => (
    <div
      style={{
        position: "absolute",
        left: -SW / 2 - BEZEL,
        top: -SH / 2 - BEZEL,
        width: SW + BEZEL * 2,
        height: SH + BEZEL * 2,
        borderRadius: SCREEN_R + BEZEL,
        background: c,
        transform: `translateZ(${z}px)`,
        opacity: o,
        ...extra,
      }}
    />
  );
  return (
    <>
      {plane(-70, "rgba(20,45,100,0.32)", { filter: "blur(36px)", opacity: o * shadow * 0.9, transform: "translate3d(18px, 40px, -70px) scale(0.96)" })}
      {plane(-12, "#101114")}
      {plane(-6, "#17181C")}
      {plane(-1.5, "linear-gradient(160deg, #2C2E34 0%, #16171B 100%)", { boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.10)" })}
    </>
  );
};

/**
 * PerspectiveScreen — a phone placed in the 3D world. Children are Layers in
 * screen space. Supports Motion3DProps (incl. keys) for the whole device.
 */
export const PerspectiveScreen: React.FC<
  Motion3DProps & {
    screen: ScreenId;
    children?: React.ReactNode;
    base?: string; // screen base colour
    sheen?: number; // 0..1 soft light sweep position (studio light)
    shadow?: number;
    baseBlur?: number;
    bare?: boolean; // no device / base — just a positioned 3D group
  }
> = ({ screen, children, base = "#FFFFFF", sheen, shadow, baseBlur = 0, bare = false, ...m }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p: Pose = resolve3d(frame, fps, { opacity: 1, ...m });
  if (p.o <= 0.002) return null;
  return (
    <PhoneCtx.Provider value={{ o: p.o, screen }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transformStyle: "preserve-3d", transform: tf(p) }}>
        {!bare && <HFMobileFrame o={p.o} shadow={shadow} />}
        {/* screen base — what a lifted layer leaves behind */}
        {!bare && <div
          style={{
            position: "absolute",
            left: -SW / 2,
            top: -SH / 2,
            width: SW,
            height: SH,
            borderRadius: SCREEN_R,
            background: base,
            // opaque until the device has faded (avoids a gray see-through phase)
            opacity: Math.min(1, p.o * 2),
            filter: baseBlur > 0.05 ? `blur(${baseBlur}px)` : undefined,
          }}
        />}
        {children}
        {sheen !== undefined && sheen > 0 && sheen < 1 && (
          <div
            style={{
              position: "absolute",
              left: -SW / 2,
              top: -SH / 2,
              width: SW,
              height: SH,
              borderRadius: SCREEN_R,
              overflow: "hidden",
              transform: "translateZ(1px)",
              opacity: p.o,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -200,
                bottom: -200,
                width: 160,
                left: -260 + sheen * (SW + 520),
                transform: "rotate(18deg)",
                background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.55), rgba(255,255,255,0))",
              }}
            />
          </div>
        )}
      </div>
    </PhoneCtx.Provider>
  );
};

/** Full screenshot as one flat layer (used where no separation is needed). */
export const FullLayer: React.FC<{ screen: ScreenId }> = ({ screen }) => {
  const { o } = usePhone();
  return (
    <div style={{ position: "absolute", left: -SW / 2, top: -SH / 2, width: SW, height: SH, borderRadius: SCREEN_R, overflow: "hidden", opacity: o, transform: "translateZ(0.5px)" }}>
      <Img src={staticFile(SRC[screen])} style={{ position: "absolute", left: 0, top: -CROP_TOP * K, width: SW, maxWidth: "none" }} />
    </div>
  );
};
