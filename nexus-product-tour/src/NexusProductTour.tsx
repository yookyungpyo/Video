import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import { useEffect, useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, useCurrentFrame } from "remotion";
import { GlowBackground } from "./components/GlowBackground";
import { clamp01, ease, lerp } from "./engine/easing";
import { Automation } from "./scenes/Automation";
import { DashboardStage } from "./scenes/DashboardStage";
import { Ending } from "./scenes/Ending";
import { Highlights } from "./scenes/Highlights";
import { Opening } from "./scenes/Opening";
import { Titles } from "./scenes/Titles";
import { WorkflowScene } from "./scenes/WorkflowScene";
import { DURATION, T } from "./theme";

function useFonts() {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([400, 500, 600, 700, 800].map((w) => document.fonts.load(`${w} 40px Inter`)))
      .then(() => document.fonts.ready)
      .then(() => continueRender(handle))
      .catch((e) => cancelRender(e));
  }, [handle]);
}

export const NexusProductTour: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  // background energy follows the story: dark open → lively product → bright end
  const intensity = lerp(0.15, 1, ease.out(clamp01((frame - 10) / 70)));
  const fadeOut = ease.inOut(clamp01((frame - (DURATION - 15)) / 14)); // last 0.5s
  return (
    <AbsoluteFill style={{ background: T.bg, fontFamily: T.font, color: T.text }}>
      <GlowBackground intensity={intensity} grid={frame < 84 ? 0 : 0.6 * clamp01((frame - 84) / 30)} />
      <Opening />
      <DashboardStage />
      <Automation />
      <WorkflowScene />
      <Highlights />
      <Ending />
      <Titles />
      <AbsoluteFill style={{ background: "#000", opacity: fadeOut }} />
    </AbsoluteFill>
  );
};
