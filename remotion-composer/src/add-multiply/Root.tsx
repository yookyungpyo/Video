import { Composition } from "remotion";
import { AddMultiply, TOTAL } from "./AddMultiply";

export const Root: React.FC = () => (
  <Composition
    id="AddMultiply"
    component={AddMultiply}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
