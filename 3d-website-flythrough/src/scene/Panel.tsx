import { RoundedBox } from "@react-three/drei";
import { AdditiveBlending, type Texture } from "three";
import { ACCENT } from "../lib/timeline";
import { PANEL_H as DEFAULT_H, PANEL_W as DEFAULT_W, type PanelPose } from "./choreography";

type Props = {
  pose: PanelPose;
  screen: Texture;
  shadow: Texture;
  glow: Texture;
  glowAmount?: number;
  order: number;
  w?: number;
  h?: number;
  radius?: number;
  depth?: number;
  accent?: string;
  shadowOpacity?: number;
};

export const Panel: React.FC<Props> = ({
  pose,
  screen,
  shadow,
  glow,
  glowAmount = 0,
  order,
  w: PANEL_W = DEFAULT_W,
  h: PANEL_H = DEFAULT_H,
  radius = 0.035,
  depth = 0.07,
  accent = ACCENT,
  shadowOpacity = 0.75,
}) => {
  const o = pose.opacity;
  if (o <= 0.001) return null;
  return (
    <group position={pose.pos} rotation={pose.rot} scale={pose.scale}>
      {/* accent halo behind the screen */}
      {glowAmount > 0.001 && (
        <mesh position={[0, 0, -0.3]} renderOrder={order * 10}>
          <planeGeometry args={[PANEL_W * 2.3, PANEL_H * 2.6]} />
          <meshBasicMaterial
            map={glow}
            color={accent}
            transparent
            opacity={glowAmount * o}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
      {/* soft drop shadow, offset down/back */}
      <mesh position={[0.12, -0.32, -0.22]} renderOrder={order * 10 + 1}>
        <planeGeometry args={[PANEL_W * 1.5, PANEL_H * 1.62]} />
        <meshBasicMaterial map={shadow} transparent opacity={shadowOpacity * o} depthWrite={false} />
      </mesh>
      {/* device slab: thin lit bezel */}
      <RoundedBox
        args={[PANEL_W + depth, PANEL_H + depth, depth]}
        radius={radius}
        smoothness={4}
        position={[0, 0, -depth / 2 - 0.005]}
        renderOrder={order * 10 + 2}
      >
        <meshStandardMaterial
          color="#1A1E2B"
          metalness={0.55}
          roughness={0.32}
          transparent
          opacity={o}
        />
      </RoundedBox>
      {/* the website itself */}
      <mesh position={[0, 0, 0.002]} renderOrder={order * 10 + 3}>
        <planeGeometry args={[PANEL_W, PANEL_H]} />
        <meshBasicMaterial map={screen} transparent opacity={o} toneMapped={false} />
      </mesh>
    </group>
  );
};
