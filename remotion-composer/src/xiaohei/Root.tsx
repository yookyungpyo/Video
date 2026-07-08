import { Composition } from "remotion";
import { XiaoheiSample } from "./Xiaohei";
import { XiaoheiFull } from "./XiaoheiFull";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="XiaoheiSample"
        component={XiaoheiSample}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Xiaohei"
        component={XiaoheiFull}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
