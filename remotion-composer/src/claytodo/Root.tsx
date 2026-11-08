import { Composition } from "remotion";
import { ClayTodo } from "./ClayTodo";

export const Root: React.FC = () => {
  return <Composition id="ClayTodo" component={ClayTodo} durationInFrames={630} fps={30} width={1080} height={1920} />;
};
