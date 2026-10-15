import { Composition } from "remotion";
import { ReportWeek, TOTAL } from "./ReportWeek";

export const Root: React.FC = () => (
  <Composition
    id="ReportWeek"
    component={ReportWeek}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
