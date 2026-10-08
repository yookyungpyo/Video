import { Composition } from "remotion";
import { GatchwoIpgi, TOTAL } from "./GatchwoIpgi";

export const Root: React.FC = () => (
  <Composition
    id="GatchwoIpgi"
    component={GatchwoIpgi}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
