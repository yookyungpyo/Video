import { PerspectiveCamera } from "@react-three/drei";
import { useMemo } from "react";
import type { Texture } from "three";
import { useCurrentFrame } from "remotion";
import { BG } from "../lib/timeline";
import { Panel } from "../scene/Panel";
import { makeGlowTexture, makeShadowTexture } from "../scene/textures";
import { HF_ACCENT } from "./theme";
import { PHONE_H, PHONE_W, hfCameraAt, homeGlow, phonePose } from "./layout";

export const HfScene: React.FC<{ screens: Texture[] }> = ({ screens }) => {
  const frame = useCurrentFrame();
  const shadow = useMemo(makeShadowTexture, []);
  const glow = useMemo(makeGlowTexture, []);
  const cam = hfCameraAt(frame);
  return (
    <>
      <PerspectiveCamera makeDefault position={cam.pos} quaternion={cam.quat} fov={cam.fov} near={0.1} far={200} />
      <fog attach="fog" args={[BG, 18, 48]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[6, 9, 8]} intensity={1.6} color="#E6EBFF" />
      <directionalLight position={[-8, -4, -6]} intensity={1.1} color={HF_ACCENT} />
      <hemisphereLight args={["#AFC2FF", "#080A0F", 0.35]} />
      {screens.map((tex, i) => (
        <Panel
          key={i}
          order={i}
          pose={phonePose(i, frame)}
          screen={tex}
          shadow={shadow}
          glow={glow}
          glowAmount={i === 0 ? homeGlow(frame) : 0.1}
          w={PHONE_W}
          h={PHONE_H}
          radius={0.22}
          depth={0.13}
          accent={HF_ACCENT}
          shadowOpacity={0.85}
        />
      ))}
    </>
  );
};
