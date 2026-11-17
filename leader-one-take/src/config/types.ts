export type Vec2 = [number, number];
export type Ease = "inOut" | "in" | "out" | "linear";

/**
 * One camera keyframe. `f` is a frame number local to the scene (0 = the scene boundary; values below 0 or above
 * the scene length are allowed and are reached during the overlap with the neighbouring scene).
 *   scale  1 = the picture exactly covers 1080x1920; never below 1
 *   focal  the point of the picture (0-1, 0-1) that sits on the scene's screen anchor
 *   x, y   extra shift of the picture in screen px (x: 80 moves the picture 80 px to the right)
 *   ease   easing of the segment that ENDS at this key (default inOut; all curves are sine-based)
 */
export type CameraKey = { f: number; scale: number; focal: Vec2; x?: number; y?: number; ease?: Ease };

/** Something that must stay inside the frame (normally a face) while the camera is on it. */
export type Subject = { name: string; at: Vec2; size: Vec2; frames: [number, number] };

export type TransitionKind = "occluder" | "glass" | "whip" | "push";
export type Direction = "left" | "right" | "up" | "down";
/** How a scene is entered. `dir` = the direction in which things move across the screen. */
export type TransitionSpec = { kind: TransitionKind; dir: Direction; color?: string; note: string };

export type LayerName = "bg" | "mid" | "fg";
/** How strongly a layer follows the camera: zoom 0 = keeps its first-key scale, 1 = full; pan likewise. */
export type LayerDepth = Record<LayerName, { zoom: number; pan: number }>;

/** Optional second picture inside a scene (over-the-shoulder view, top view). Used only if the file exists. */
export type AuxShot = {
  key: string;                 // public/images/<key>.(png|jpg|jpeg|webp)
  place: "start" | "end";      // before or after the main picture
  cutAt: number;               // local frame of the hidden cut between the two pictures
  keys: CameraKey[];
  transition: TransitionSpec;
  what: string;
};

export type SubtitleCue = { at: number; until: number; text: string }; // local frames; "{word}" = accent, "\n" = line break

export type SceneConfig = {
  n: number;
  id: string;                  // picture: public/images/<id>.(png|jpg|jpeg|webp)
  title: string;
  frames: number;              // scene length; the eight lengths add up to 1650
  anchor: Vec2;                // screen position (0-1) where the focal point sits
  keys: CameraKey[];
  subjects: Subject[];
  /** What was asked for, what the single flat picture really gets, and what separate layers would add. */
  motion: { asked: string; flat: string; layered: string };
  depth?: LayerDepth;
  aux?: AuxShot;
  /** Entered with this transition (scene 01 has none). */
  enter?: TransitionSpec;
  subtitles: SubtitleCue[];
};
