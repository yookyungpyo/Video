import type { Motion3DProps } from "../engine/motion3d";
import type { Rect } from "../screens";
import { LayeredProductCard } from "./LayeredProductCard";

/** The original 3D illustration lifted off the screen and floating gently. */
export const FloatingIllustration: React.FC<Motion3DProps & { region: Rect; amp?: number; period?: number; floatFrom: number; children?: React.ReactNode }> = ({
  region,
  amp = 6,
  period = 2.8,
  floatFrom,
  children,
  ...m
}) => (
  <LayeredProductCard region={region} float={{ amp, period, from: floatFrom }} {...m}>
    {children}
  </LayeredProductCard>
);
