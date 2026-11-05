import { createContext, useContext } from "react";

/**
 * CameraFlythrough — wrap the layers of the outgoing screen. While the camera
 * dollies through, each layer splits away from the centre (left/right by its
 * position, up/down for centred layers), rises toward the lens and fades,
 * opening a corridor for the camera.
 */
type Fly = { start: number; duration: number };
const FlyCtx = createContext<Fly | null>(null);
export const useFlythrough = () => useContext(FlyCtx);

export const CameraFlythrough: React.FC<Fly & { children: React.ReactNode }> = ({ children, ...f }) => <FlyCtx.Provider value={f}>{children}</FlyCtx.Provider>;
