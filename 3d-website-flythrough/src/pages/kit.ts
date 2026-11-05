// Small Canvas2D drawing kit for the demo website pages.
// Everything is deterministic: no Math.random, no time.

export const PW = 1600; // page texture width  (16:10)
export const PH = 1000; // page texture height

export const FONT = "Inter, 'Helvetica Neue', Arial, sans-serif";
export const ACC = "#6C7BFF";

export type Ctx = CanvasRenderingContext2D;

export const font = (ctx: Ctx, size: number, weight = 500) => {
  ctx.font = `${weight} ${size}px ${FONT}`;
};

export function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function box(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string | CanvasGradient,
  stroke?: string,
) {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

export function text(
  ctx: Ctx,
  str: string,
  x: number,
  y: number,
  size: number,
  color: string,
  weight = 500,
  align: CanvasTextAlign = "left",
  tracking = 0,
) {
  font(ctx, size, weight);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  (ctx as any).letterSpacing = `${tracking}px`;
  ctx.fillText(str, x, y);
  (ctx as any).letterSpacing = "0px";
}

/** placeholder text line */
export function line(ctx: Ctx, x: number, y: number, w: number, color: string, h = 10) {
  box(ctx, x, y, w, h, h / 2, color);
}

export function pill(
  ctx: Ctx,
  label: string,
  x: number,
  y: number,
  h: number,
  fill: string,
  color: string,
  size = 18,
  stroke?: string,
) {
  font(ctx, size, 600);
  const w = ctx.measureText(label).width + h * 1.1;
  box(ctx, x, y, w, h, h / 2, fill, stroke);
  text(ctx, label, x + w / 2, y + h / 2 + size * 0.36, size, color, 600, "center");
  return w;
}

export function dot(ctx: Ctx, x: number, y: number, r: number, color: string) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

/** Browser chrome + nav bar shared by all pages. */
export function chrome(
  ctx: Ctx,
  opts: { dark: boolean; url: string; active: number; brand?: string },
) {
  const { dark } = opts;
  const bar = dark ? "#0B0E15" : "#ECEEF4";
  const fg = dark ? "#E8EAF2" : "#11131A";
  const mute = dark ? "#7C8297" : "#6A7084";
  // window bar
  ctx.fillStyle = bar;
  ctx.fillRect(0, 0, PW, 52);
  ["#FF5F57", "#FEBC2E", "#28C840"].forEach((c, i) => dot(ctx, 30 + i * 24, 26, 7, c));
  box(ctx, PW / 2 - 260, 13, 520, 27, 14, dark ? "#151924" : "#FFFFFF");
  text(ctx, opts.url, PW / 2, 32, 15, mute, 500, "center");
  ctx.fillStyle = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  ctx.fillRect(0, 52, PW, 1);
  // nav
  const y = 118;
  logo(ctx, 72, y - 22, dark);
  text(ctx, opts.brand ?? "Lumen", 118, y, 26, fg, 700, "left", -0.5);
  const items = ["Product", "Solutions", "Pricing", "Stories", "Docs"];
  let x = 560;
  items.forEach((it, i) => {
    text(ctx, it, x, y - 2, 18, i === opts.active ? fg : mute, i === opts.active ? 600 : 500);
    if (i === opts.active) line(ctx, x, y + 14, ctx.measureText(it).width, ACC, 3);
    x += ctx.measureText(it).width + 44;
  });
  text(ctx, "Sign in", PW - 250, y - 2, 18, mute, 500);
  pill(ctx, "Get started", PW - 170, y - 30, 42, dark ? "#FFFFFF" : "#11131A", dark ? "#0B0E15" : "#FFFFFF", 16);
}

export function logo(ctx: Ctx, x: number, y: number, dark: boolean) {
  const g = ctx.createLinearGradient(x, y, x + 32, y + 32);
  g.addColorStop(0, "#8D98FF");
  g.addColorStop(1, ACC);
  box(ctx, x, y, 32, 32, 9, g);
  ctx.beginPath();
  ctx.arc(x + 16, y + 16, 7, 0, Math.PI * 2);
  ctx.fillStyle = dark ? "#0B0E15" : "#FFFFFF";
  ctx.fill();
}

/** deterministic pseudo-noise in [0,1) */
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function makeCanvas(draw: (ctx: Ctx) => void) {
  const c = document.createElement("canvas");
  c.width = PW;
  c.height = PH;
  const ctx = c.getContext("2d")!;
  draw(ctx);
  return c;
}
