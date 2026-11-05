import { useCurrentFrame } from "remotion";
import { HFBrandEnding } from "../components/HFBrandEnding";
import { FullLayer, PerspectiveScreen } from "../components/HFMobileFrame";
import { ease } from "../engine/easing";
import { DEPTH } from "./JeonseOnScene";

// on-screen label positions once the camera settles (dolly −700 → scale ≈ 0.76)
const S = 2200 / (2200 + 700);
const LX = [960 - 565 * S, 960, 960 + 565 * S];
const LY = 540 + (160 + 461) * S + 10;

/** World part: 보금자리론 (left) and HF전세ON (centre) rejoin the 주택연금 phone. */
const World: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < 730) return null;
  return (
    <>
      <PerspectiveScreen
        screen="bogeumjari"
        keys={[
          { f: 736, p: { x: -760, z: DEPTH - 260, ry: 26, o: 0, s: 0.92 } },
          { f: 790, p: { x: -600, z: DEPTH, ry: 16, o: 1, s: 1 }, easing: ease.out },
          { f: 836, p: { x: -565, y: 160, ry: 6 } },
        ]}
      >
        <FullLayer screen="bogeumjari" />
      </PerspectiveScreen>
      <PerspectiveScreen
        screen="jeonse"
        keys={[
          { f: 746, p: { z: DEPTH - 420, o: 0, s: 0.9 } },
          { f: 800, p: { z: DEPTH - 60, o: 1, s: 1 }, easing: ease.out },
          { f: 836, p: { y: 160, z: DEPTH } },
        ]}
      >
        <FullLayer screen="jeonse" />
      </PerspectiveScreen>
    </>
  );
};

const Overlay: React.FC = () => <HFBrandEnding startFrame={806} labelsAt={826} labelX={LX} labelY={LY} />;

export const HFEndingScene = { World, Overlay };
