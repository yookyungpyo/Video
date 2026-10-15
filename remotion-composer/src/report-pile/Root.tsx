import { Composition } from "remotion";
import { ReportPile, TOTAL } from "./ReportPile";

export const Root: React.FC = () => (
  <Composition
    id="ReportPile"
    component={ReportPile}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
