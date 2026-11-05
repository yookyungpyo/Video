import "@fontsource/noto-sans-kr/600.css";
import "@fontsource/noto-sans-kr/800.css";
import { ThreeCanvas } from "@remotion/three";
import { useEffect, useState } from "react";
import type { Texture } from "three";
import { AbsoluteFill, cancelRender, continueRender, delayRender, useVideoConfig } from "remotion";
import { BG } from "../lib/timeline";
import { HfOverlay } from "./HfOverlay";
import { HfScene } from "./HfScene";
import { loadHfTextures } from "./screens";

const TEXT = "HF 한국주택금융공사 내 집 마련의 모든 순간 함께, 더 쉽고 편리하게 앱에서 한 번에";

export const FlythroughHF: React.FC = () => {
  const { width, height } = useVideoConfig();
  const [screens, setScreens] = useState<Texture[] | null>(null);
  const [handle] = useState(() => delayRender("Loading HF screens + fonts"));
  useEffect(() => {
    Promise.all([
      loadHfTextures(),
      document.fonts.load(`600 30px 'Noto Sans KR'`, TEXT),
      document.fonts.load(`800 78px 'Noto Sans KR'`, TEXT),
    ])
      .then(([t]) => document.fonts.ready.then(() => t))
      .then((t) => {
        setScreens(t);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [handle]);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 100% 70% at 50% 40%, #0F1422 0%, ${BG} 70%)` }}>
      {screens && (
        <ThreeCanvas width={width} height={height} gl={{ antialias: true, alpha: true }} dpr={1}>
          <HfScene screens={screens} />
        </ThreeCanvas>
      )}
      <HfOverlay />
    </AbsoluteFill>
  );
};
