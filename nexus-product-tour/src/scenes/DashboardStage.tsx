import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AnimatedCursor } from "../components/AnimatedCursor";
import { DashboardReveal } from "../components/DashboardReveal";
import { clamp01, ease, lerp } from "../engine/easing";
import { ASSIST_RECT, DASH_H, DASH_W, Dashboard, MENU_STEP, MENU_Y0 } from "../ui/Dashboard";

// Stage geometry: dashboard centred horizontally, centre at y = 674.
export const STAGE_CX = 960;
export const STAGE_CY = 674;

export const REVEAL = 88; // dashboard reveal start
export const MENU_CLICK = 146;
export const ASSIST_CLICK = 202;
export const MORPH = 206; // assistant begins expanding (scene 03)
export const EXIT = 326;

/** Camera scale of the dashboard: push-in during 02, push-back during 03. */
export function dashScale(frame: number) {
  const push = lerp(0.8, 0.825, ease.inOut(clamp01((frame - REVEAL) / (MORPH - REVEAL))));
  const back = ease.inOut(clamp01((frame - MORPH) / 24));
  return lerp(push, 0.74, back);
}

/** Assistant slot in screen coordinates at a given frame. */
export function assistSlot(frame: number) {
  const s = dashScale(frame);
  return {
    x: STAGE_CX + (ASSIST_RECT.x - DASH_W / 2) * s,
    y: STAGE_CY + (ASSIST_RECT.y - DASH_H / 2) * s,
    w: ASSIST_RECT.w * s,
    h: ASSIST_RECT.h * s,
  };
}

/** 00:03–00:11 — dashboard rises, comes alive, then recedes behind the assistant. */
export const DashboardStage: React.FC = () => {
  const frame = useCurrentFrame();
  const s = dashScale(frame);
  const back = ease.inOut(clamp01((frame - MORPH) / 24));
  const exit = ease.inOut(clamp01((frame - EXIT) / 18));
  // slight parallax pan while the cursor travels
  const pan = Math.sin(clamp01((frame - REVEAL) / 120) * Math.PI) * -10;
  const opacity = lerp(1, 0.32, back) * (1 - exit);
  if (opacity <= 0.001 || frame < REVEAL) return null;
  return (
    <AbsoluteFill>
      <DashboardReveal
        startFrame={REVEAL}
        duration={34}
        easing={ease.out}
        tilt={16}
        style={{ position: "absolute", left: STAGE_CX - DASH_W / 2, top: STAGE_CY - DASH_H / 2, width: DASH_W, height: DASH_H }}
      >
        <div
          style={{
            width: DASH_W,
            height: DASH_H,
            transform: `translateX(${pan}px) scale(${s * lerp(1, 0.94, exit)})`,
            transformOrigin: "50% 50%",
            opacity,
            filter: back > 0.02 ? `blur(${back * 7}px)` : undefined,
            position: "relative",
          }}
        >
          <Dashboard t0={REVEAL} menuSwitch={MENU_CLICK + 1} assistantOpacity={frame >= MORPH ? 0 : 1} />
          <AnimatedCursor
            scale={1.25}
            endFrame={MORPH + 6}
            points={[
              { f: 116, x: 1240, y: 800 },
              { f: 140, x: 120, y: MENU_Y0 + MENU_STEP + 2 },
              { f: MENU_CLICK, x: 120, y: MENU_Y0 + MENU_STEP + 2, click: true },
              { f: 172, x: 520, y: 250 },
              { f: 196, x: ASSIST_RECT.x + 160, y: ASSIST_RECT.y + ASSIST_RECT.h - 48 },
              { f: ASSIST_CLICK, x: ASSIST_RECT.x + 160, y: ASSIST_RECT.y + ASSIST_RECT.h - 48, click: true },
            ]}
          />
        </div>
      </DashboardReveal>
    </AbsoluteFill>
  );
};
