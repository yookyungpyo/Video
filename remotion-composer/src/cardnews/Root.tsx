import { Composition } from "remotion";
import { CardNews } from "./CardNews";

export const Root: React.FC = () => {
  return (
    <Composition
      id="CardNews"
      component={CardNews}
      durationInFrames={720}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
