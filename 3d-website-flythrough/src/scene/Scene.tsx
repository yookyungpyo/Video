import { Grid, PerspectiveCamera } from "@react-three/drei";
import { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { BG } from "../lib/timeline";
import { cameraAt } from "./camera";
import { heroGlow, panelPose } from "./choreography";
import { Panel } from "./Panel";
import { makeGlowTexture, makePageTextures, makeShadowTexture } from "./textures";

export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const screens = useMemo(makePageTextures, []);
  const shadow = useMemo(makeShadowTexture, []);
  const glow = useMemo(makeGlowTexture, []);
  const cam = cameraAt(frame);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={cam.pos}
        quaternion={cam.quat}
        fov={cam.fov}
        near={0.1}
        far={200}
      />
      <fog attach="fog" args={[BG, 16, 46]} />

      {/* soft studio lighting */}
      <ambientLight intensity={0.45} />
      <directionalLight position={[6, 9, 8]} intensity={1.6} color="#E6E9FF" />
      <directionalLight position={[-8, 2, -6]} intensity={1.1} color="#6C7BFF" />
      <hemisphereLight args={["#AAB3FF", "#080A0F", 0.35]} />

      {/* faint floor grid for spatial reading; fades with distance */}
      <Grid
        position={[8, -2.9, -4]}
        args={[120, 120]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#141826"
        sectionSize={5.4}
        sectionThickness={1}
        sectionColor="#232946"
        fadeDistance={38}
        fadeStrength={1.6}
        infiniteGrid
      />

      {screens.map((tex, i) => (
        <Panel
          key={i}
          order={i}
          pose={panelPose(i, frame)}
          screen={tex}
          shadow={shadow}
          glow={glow}
          glowAmount={i === 0 ? heroGlow(frame) : 0.08}
        />
      ))}
    </>
  );
};
