import "@fontsource/noto-sans-kr/500.css";
import "@fontsource/noto-sans-kr/700.css";
import "@fontsource/noto-sans-kr/800.css";
import { useEffect, useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, useCurrentFrame } from "remotion";
import { type CamKey, CinematicCamera } from "./components/CinematicCamera";
import { clamp01, ease, lerp } from "./engine/easing";
import { BogeumjariScene } from "./scenes/BogeumjariScene";
import { HFEndingScene } from "./scenes/HFEndingScene";
import { HFIntroScene } from "./scenes/HFIntroScene";
import { HousingPensionScene } from "./scenes/HousingPensionScene";
import { DEPTH, JeonseOnScene } from "./scenes/JeonseOnScene";
import { DURATION, HF } from "./theme";

const SHIFT = 250; // lens shift: product sits right of centre, type on the left
const C = (f: number, tx: number, ty: number, tz: number, orbit: number, tilt: number, dolly: number, shift = SHIFT): CamKey => ({ f, tx, ty, tz, orbit, tilt, dolly, shift });

/** One continuous camera path for the whole film. */
export const CAMERA: CamKey[] = [
  // 01 — push in on the tilted main screen
  C(0, 0, 0, 0, -4, 1, -560),
  C(119, 0, -10, 0, -2, 0.5, -120),
  // 02 — hand-off, then orbit across the separated cards
  C(160, 0, 0, 0, 0, 0, -40),
  C(196, 0, 40, 0, 0, 0, -10),
  C(234, 0, 160, 110, -12, 5, 30),
  C(276, 0, 185, 150, 9, 6, 50),
  C(300, 0, 20, 40, 0, 1, 10),
  // 03 — flythrough to the deeper HF전세ON plane, cards forward/back
  C(352, 0, 0, DEPTH, 0, 0, -30),
  C(410, 0, 190, DEPTH + 120, 9, 5, 30),
  C(452, 0, 120, DEPTH + 60, -5, 2, 20),
  C(486, 0, 0, DEPTH, 0, 0, 0),
  // 04 — 주택연금 emerges; camera rises to the illustration, travels between cards
  C(530, 0, 0, DEPTH, 0, 0, -40),
  C(580, 0, -120, DEPTH + 180, -6, -3, 30),
  C(628, -30, 170, DEPTH + 240, 10, 5, 60),
  C(676, 30, 215, DEPTH + 260, -7, 6, 70),
  C(722, 0, 0, DEPTH, 0, 0, 0),
  // 05 — pull out with an orbit, then settle frontal on the line-up
  C(784, 0, 0, DEPTH, 13, 3, -980, 0),
  C(840, 0, 0, DEPTH, 0, 0, -700, 0),
  C(899, 0, 0, DEPTH, 0, 0, -680, 0),
];

function useFonts() {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const sample = "주택금융의 새로운 경험 우리 가족의 소중한 보금자리 안심할 수 있는 전세자금 마련 평생의 주거 안정을 위한 선택 내 삶에 맞는 한국주택금융공사 0123456789억원%";
    Promise.all([500, 700, 800].map((w) => document.fonts.load(`${w} 40px 'Noto Sans KR'`, sample)))
      .then(() => document.fonts.ready)
      .then(() => continueRender(h))
      .catch((e) => cancelRender(e));
  }, [h]);
}

/** Opening light + world-space parallax orbs. */
const Atmosphere: React.FC = () => {
  const frame = useCurrentFrame();
  const light = ease.inOut(clamp01((frame - 8) / 56));
  const point = clamp01(frame / 10) * (1 - clamp01((frame - 50) / 20));
  const cx = 960 + SHIFT;
  return (
    <>
      <AbsoluteFill style={{ background: HF.bg }} />
      {/* dark blue that the light opens up */}
      {light < 1 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at ${cx}px 540px, rgba(10,26,63,0) ${lerp(0, 1500, light)}px, ${HF.navy} ${lerp(0, 1500, light) + 260}px)`,
          }}
        />
      )}
      {point > 0 && (
        <div
          style={{
            position: "absolute",
            left: cx - 400,
            top: 140,
            width: 800,
            height: 800,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(170,200,255,0.45) 12%, rgba(120,160,255,0.12) 40%, transparent 70%)",
            transform: `scale(${lerp(0.08, 1.3, ease.out(clamp01(frame / 50)))})`,
            opacity: point,
          }}
        />
      )}
    </>
  );
};

const Orbs: React.FC = () => {
  const frame = useCurrentFrame();
  const o = clamp01((frame - 40) / 40);
  const orbs = [
    { x: -1000, y: -460, z: -2300, r: 620, c: HF.bg2 },
    { x: 1100, y: 420, z: -2400, r: 760, c: "#E2ECFB" },
    { x: -500, y: 700, z: -2700, r: 420, c: "#EDF3FC" },
    { x: 700, y: -560, z: -3200, r: 900, c: HF.bg2 },
  ];
  return (
    <>
      {orbs.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: b.x - b.r,
            top: b.y - b.r,
            width: b.r * 2,
            height: b.r * 2,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${b.c} 0%, ${b.c} 45%, rgba(234,241,251,0) 70%)`,
            transform: `translateZ(${b.z}px)`,
            opacity: o,
          }}
        />
      ))}
    </>
  );
};

export const HFFinanceFilm: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const fade = ease.inOut(clamp01((frame - (DURATION - 30)) / 29)); // last 0.5s
  return (
    <AbsoluteFill style={{ fontFamily: HF.font, color: HF.text }}>
      <Atmosphere />
      <CinematicCamera keys={CAMERA}>
        <Orbs />
        <HFIntroScene.World />
        <BogeumjariScene.World />
        <JeonseOnScene.World />
        <HousingPensionScene.World />
        <HFEndingScene.World />
      </CinematicCamera>
      <HFIntroScene.Overlay />
      <BogeumjariScene.Overlay />
      <JeonseOnScene.Overlay />
      <HousingPensionScene.Overlay />
      <HFEndingScene.Overlay />
      <AbsoluteFill style={{ background: HF.bg, opacity: fade }} />
    </AbsoluteFill>
  );
};
