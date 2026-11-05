import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AnimatedCursor } from "../components/AnimatedCursor";
import { clamp01, ease, lerp } from "../engine/easing";
import { T } from "../theme";
import { AssistantCompact } from "../ui/Dashboard";
import { AssistantPanelFull, PANEL_H, PANEL_W, type AssistantTiming } from "../ui/AssistantPanel";
import { MORPH, assistSlot } from "./DashboardStage";

export const TARGET = { x: 300, y: 300, w: PANEL_W, h: PANEL_H };
export const TIMING: AssistantTiming = { typeStart: 226, send: 260, thinkEnd: 284, cta: 306 };
export const CTA_CLICK = 322;
export const PANEL_EXIT = 326;

/** 00:07–00:11 — the assistant panel zooms out of its slot and does the work. */
export const Automation: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < MORPH) return null;
  const m = ease.snappy(clamp01((frame - MORPH) / 24));
  const from = assistSlot(MORPH);
  // exit: shrink toward the first workflow node (left-centre) and fade
  const ex = ease.inOut(clamp01((frame - PANEL_EXIT) / 18));
  const exitTo = { x: 195, y: 552, w: 300, h: 176 };
  const r = {
    x: lerp(lerp(from.x, TARGET.x, m), exitTo.x, ex),
    y: lerp(lerp(from.y, TARGET.y, m), exitTo.y, ex),
    w: lerp(lerp(from.w, TARGET.w, m), exitTo.w, ex),
    h: lerp(lerp(from.h, TARGET.h, m), exitTo.h, ex),
  };
  const opacity = 1 - clamp01((frame - PANEL_EXIT - 8) / 10);
  if (opacity <= 0) return null;
  const compactO = 1 - clamp01((frame - MORPH - 2) / 8);
  const fullO = clamp01((frame - MORPH - 12) / 10) * (1 - clamp01((frame - PANEL_EXIT) / 8));
  const contentScale = r.w / TARGET.w;
  return (
    <AbsoluteFill style={{ opacity }}>
      <div
        style={{
          position: "absolute",
          left: r.x,
          top: r.y,
          width: r.w,
          height: r.h,
          borderRadius: lerp(20 * 0.8, 28, m),
          background: `linear-gradient(180deg, ${T.surface2} 0%, ${T.surface} 100%)`,
          border: "1px solid rgba(119,107,255,0.35)",
          boxShadow: `0 60px 140px rgba(0,0,0,0.6), 0 0 ${lerp(0, 120, m)}px rgba(119,107,255,0.25)`,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 0%, rgba(119,107,255,0.16), transparent 55%)" }} />
        {/* compact face (matches the dashboard slot) */}
        {compactO > 0 && (
          <div style={{ position: "absolute", left: 0, top: 0, opacity: compactO, transform: `scale(${r.w / 360})`, transformOrigin: "0 0" }}>
            <div style={{ position: "relative", left: -1112, top: -104 }}>
              <AssistantCompact t0={-100} />
            </div>
          </div>
        )}
        {fullO > 0 && (
          <div style={{ position: "absolute", left: 0, top: 0, width: TARGET.w, height: TARGET.h, opacity: fullO, transform: `scale(${contentScale})`, transformOrigin: "0 0" }}>
            <AssistantPanelFull t={TIMING} />
          </div>
        )}
      </div>
      <AnimatedCursor
        scale={1.25}
        startFrame={232}
        endFrame={PANEL_EXIT + 4}
        points={[
          { f: 232, x: 1380, y: 560 },
          { f: 254, x: TARGET.x + TARGET.w - 66, y: TARGET.y + 140 },
          { f: TIMING.send, x: TARGET.x + TARGET.w - 66, y: TARGET.y + 140, click: true },
          { f: 290, x: 1500, y: 640 },
          { f: 316, x: TARGET.x + 140, y: TARGET.y + 660 },
          { f: CTA_CLICK, x: TARGET.x + 140, y: TARGET.y + 660, click: true },
        ]}
      />
    </AbsoluteFill>
  );
};
