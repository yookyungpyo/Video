import "@fontsource/noto-sans-kr/500.css";
import "@fontsource/noto-sans-kr/700.css";
import "@fontsource/noto-sans-kr/800.css";
import { useEffect, useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { type CamKey, CameraZoom } from "./components/CameraZoom";
import { END_SCALE, END_X, END_Y, HFBrandEnding, PHONE_H, PHONE_W } from "./components/HFBrandEnding";
import { HFMobileScreen } from "./components/HFMobileScreen";
import { clamp01, ease, lerp } from "./engine/easing";
import { REGIONS } from "./screens";
import { BogeumjariScene } from "./scenes/BogeumjariScene";
import { focusOf } from "./scenes/common";
import { HFMainScene } from "./scenes/HFMainScene";
import { HousingPensionScene } from "./scenes/HousingPensionScene";
import { JeonseOnScene } from "./scenes/JeonseOnScene";
import { DURATION, HF } from "./theme";

const STAGE = { x: 1340, y: 540 };
const REST = { fx: PHONE_W / 2, fy: PHONE_H / 2 };
const at = (r: { x: number; y: number; w: number; h: number }) => focusOf(r);
const bogCards = { x: 48, y: 1632, w: 1224, h: 714 };

// Camera: push-ins on what the story is pointing at; always eased back to rest.
const CAM: CamKey[] = [
  { f: 0, scale: 1, ...REST },
  { f: 62, scale: 1, ...REST },
  { f: 94, scale: 1.26, ...at(REGIONS.main.card) },
  { f: 126, scale: 1, ...REST },
  { f: 176, scale: 1, ...REST },
  { f: 210, scale: 1.34, ...at(bogCards) },
  { f: 232, scale: 1.34, ...at(bogCards) },
  { f: 254, scale: 1.2, ...at({ x: 0, y: 2300, w: 1320, h: 420 }) },
  { f: 278, scale: 1, ...REST },
  { f: 322, scale: 1, ...REST },
  { f: 398, scale: 1.16, ...at({ x: 48, y: 1914, w: 1224, h: 357 }) },
  { f: 426, scale: 1, ...REST },
  { f: 474, scale: 1, ...REST },
  { f: 526, scale: 1.1, ...at({ x: 48, y: 1698, w: 1224, h: 672 }) },
  { f: 546, scale: 1, ...REST },
];

function useFonts() {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const sample = "내게 맞는 주택금융을 더 쉽게 보금자리론 전세 주택연금 한국주택금융공사 0123456789억원%";
    Promise.all([500, 700, 800].map((w) => document.fonts.load(`${w} 40px 'Noto Sans KR'`, sample)))
      .then(() => document.fonts.ready)
      .then(() => continueRender(h))
      .catch((e) => cancelRender(e));
  }, [h]);
}

export const HFProductTour: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // stage: rises in (scene 01), travels into the right slot (scene 05)
  const rise = spring({ frame: frame - 4, fps, config: { damping: 20, mass: 1 }, durationInFrames: 34 });
  const end = ease.inOut(clamp01((frame - 534) / 30));
  const sx = lerp(STAGE.x, END_X[2], end);
  const sy = lerp(STAGE.y, END_Y, end);
  const sc = lerp(lerp(0.94, 1, rise), END_SCALE, end);
  const ty = lerp(760, 0, rise);
  const bgShape = 1 - end;
  const fadeOut = ease.inOut(clamp01((frame - (DURATION - 9)) / 8)); // last 0.3s
  return (
    <AbsoluteFill style={{ background: HF.bg, fontFamily: HF.font, color: HF.text }}>
      {/* soft background plate behind the phone */}
      <div
        style={{
          position: "absolute",
          left: STAGE.x - 500,
          top: STAGE.y - 500,
          width: 1000,
          height: 1000,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${HF.bg2} 0%, ${HF.bg2} 55%, rgba(242,245,249,0) 72%)`,
          opacity: bgShape * clamp01(frame / 20),
          transform: `scale(${lerp(0.9, 1, rise)})`,
        }}
      />
      {/* left panels */}
      <HFMainScene.Panel />
      <BogeumjariScene.Panel />
      <JeonseOnScene.Panel />
      <HousingPensionScene.Panel />
      {/* the phone */}
      <div
        style={{
          position: "absolute",
          left: sx - PHONE_W / 2,
          top: sy - PHONE_H / 2,
          width: PHONE_W,
          height: PHONE_H,
          transform: `translateY(${ty}px) scale(${sc})`,
          transformOrigin: "50% 50%",
        }}
      >
        <CameraZoom keys={CAM} anchor={{ x: PHONE_W / 2, y: PHONE_H / 2 }}>
          <HFMobileScreen>
            <HFMainScene.Screen />
            <BogeumjariScene.Screen />
            <JeonseOnScene.Screen />
            <HousingPensionScene.Screen />
          </HFMobileScreen>
        </CameraZoom>
      </div>
      <HFBrandEnding startFrame={540} />
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: fadeOut }} />
    </AbsoluteFill>
  );
};
