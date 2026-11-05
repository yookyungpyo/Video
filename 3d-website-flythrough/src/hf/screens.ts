import { CanvasTexture, LinearMipmapLinearFilter, SRGBColorSpace, type Texture } from "three";
import { staticFile } from "remotion";

export const HF_SCREENS = ["hf/01-home.png", "hf/02-bogeumjari.png", "hf/03-pension.png", "hf/04-jeonse.png"];

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error(`Failed to load ${src}`));
    img.src = src;
  });

/** Load the cropped phone screenshots and bake rounded screen corners. */
export async function loadHfTextures(): Promise<Texture[]> {
  const imgs = await Promise.all(HF_SCREENS.map((p) => loadImage(staticFile(p))));
  return imgs.map((img) => {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d")!;
    const r = c.width * 0.085;
    ctx.beginPath();
    ctx.roundRect(0, 0, c.width, c.height, r);
    ctx.save();
    ctx.clip();
    ctx.drawImage(img, 0, 0);
    ctx.restore();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,0.10)";
    ctx.stroke();
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    t.minFilter = LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.needsUpdate = true;
    return t;
  });
}
