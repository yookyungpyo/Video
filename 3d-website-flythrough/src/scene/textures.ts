import { CanvasTexture, LinearMipmapLinearFilter, SRGBColorSpace, Texture } from "three";
import { PH, PW } from "../pages/kit";
import { drawPages } from "../pages/pages";

function toTexture(c: HTMLCanvasElement, aniso = 8): Texture {
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = aniso;
  t.minFilter = LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

/** Page screens with rounded corners + a hairline border baked in. */
export function makePageTextures(): Texture[] {
  return drawPages().map((src) => {
    const c = document.createElement("canvas");
    c.width = PW;
    c.height = PH;
    const ctx = c.getContext("2d")!;
    ctx.beginPath();
    ctx.roundRect(1, 1, PW - 2, PH - 2, 26);
    ctx.save();
    ctx.clip();
    ctx.drawImage(src, 0, 0);
    ctx.restore();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.stroke();
    return toTexture(c);
  });
}

/** Soft blurred rounded-rect, used as a contact shadow behind each panel. */
export function makeShadowTexture(): Texture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 384;
  const ctx = c.getContext("2d")!;
  ctx.filter = "blur(34px)";
  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.beginPath();
  ctx.roundRect(86, 86, 512 - 172, 384 - 172, 24);
  ctx.fill();
  return toTexture(c, 1);
}

/** Radial glow (white core → transparent); tinted by material colour. */
export function makeGlowTexture(): Texture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.55)");
  g.addColorStop(0.6, "rgba(255,255,255,0.12)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  return toTexture(c, 1);
}
