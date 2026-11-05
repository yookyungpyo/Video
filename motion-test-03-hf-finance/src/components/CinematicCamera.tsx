import { createContext, useContext } from "react";
import { useCurrentFrame } from "remotion";
import { W, H } from "../theme";

/**
 * 2.5D camera rig on CSS 3D. The camera looks at `target`; `orbit` (yaw),
 * `tilt` (pitch) and `roll` rotate the world around the target; `dolly`
 * moves the camera toward (+) / away (−) from it; `shift` is a lens shift in
 * px (where the target lands horizontally on screen).
 *
 * Channels are interpolated with Catmull-Rom (cubic Hermite) splines over
 * non-uniform key times, so moves flow through keys without stopping.
 */
export type CamKey = { f: number; tx: number; ty: number; tz: number; orbit: number; tilt: number; roll?: number; dolly: number; shift: number };

export const PERSPECTIVE = 2200;
const CH = ["tx", "ty", "tz", "orbit", "tilt", "roll", "dolly", "shift"] as const;

function hermite(keys: CamKey[], ch: (typeof CH)[number], f: number) {
  const n = keys.length;
  const v = (i: number) => (keys[i][ch] as number | undefined) ?? 0;
  if (f <= keys[0].f) return v(0);
  if (f >= keys[n - 1].f) return v(n - 1);
  let i = 0;
  while (f > keys[i + 1].f) i++;
  const t0 = keys[i].f, t1 = keys[i + 1].f, h = t1 - t0;
  const m = (j: number) => (j === 0 || j === n - 1 ? 0 : (v(j + 1) - v(j - 1)) / (keys[j + 1].f - keys[j - 1].f));
  // hold segments (equal values) stay perfectly still
  const flat = v(i) === v(i + 1);
  const m0 = flat ? 0 : m(i) * h, m1 = flat ? 0 : m(i + 1) * h;
  const t = (f - t0) / h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * v(i) + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * v(i + 1) + (t3 - t2) * m1;
}

export function cameraAt(keys: CamKey[], f: number) {
  const o = {} as Record<(typeof CH)[number], number>;
  for (const c of CH) o[c] = hermite(keys, c, f);
  return o;
}

const CamCtx = createContext<ReturnType<typeof cameraAt> | null>(null);
export const useCamera = () => useContext(CamCtx);

export const CinematicCamera: React.FC<{ keys: CamKey[]; children: React.ReactNode }> = ({ keys, children }) => {
  const frame = useCurrentFrame();
  const c = cameraAt(keys, frame);
  const cx = W / 2 + c.shift;
  return (
    <CamCtx.Provider value={c}>
      <div style={{ position: "absolute", inset: 0, perspective: PERSPECTIVE, perspectiveOrigin: `${cx}px ${H / 2}px`, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            left: cx,
            top: H / 2,
            width: 0,
            height: 0,
            transformStyle: "preserve-3d",
            transform: `translateZ(${c.dolly}px) rotateX(${c.tilt}deg) rotateY(${c.orbit}deg) rotateZ(${c.roll}deg) translate3d(${-c.tx}px, ${-c.ty}px, ${-c.tz}px)`,
          }}
        >
          {children}
        </div>
      </div>
    </CamCtx.Provider>
  );
};
