import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import { ThreeCanvas } from "@remotion/three";
import { useEffect, useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, useVideoConfig } from "remotion";
import { BG } from "./lib/timeline";
import { Overlay } from "./Overlay";
import { Scene } from "./scene/Scene";

// Canvas textures draw text, so Inter must be loaded before they are built.
function useFontsReady() {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("Loading Inter"));
  useEffect(() => {
    Promise.all(
      [400, 500, 600, 700].map((w) => document.fonts.load(`${w} 40px Inter`)),
    )
      .then(() => document.fonts.ready)
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [handle]);
  return ready;
}

export const Flythrough: React.FC = () => {
  const { width, height } = useVideoConfig();
  const ready = useFontsReady();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 90% 80% at 50% 42%, #10131C 0%, ${BG} 70%)`,
      }}
    >
      {ready && (
        <ThreeCanvas
          width={width}
          height={height}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          dpr={1}
        >
          <Scene />
        </ThreeCanvas>
      )}
      <Overlay />
    </AbsoluteFill>
  );
};
