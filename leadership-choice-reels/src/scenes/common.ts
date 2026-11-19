import { PanelState } from "../components/transitions";
import { PANEL } from "../theme";

/** g = global frame; layer = which half of the scene to draw (see components/Panel.tsx); state = transition state. */
export type SceneProps = { g: number; layer: "bg" | "panel"; state: PanelState };

/** Screen position of the panel's centre (panels are almost square). */
export const CENTER = { x: PANEL.x + PANEL.w / 2, y: PANEL.y + PANEL.w / 2 };
