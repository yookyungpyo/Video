/* HF 비대면채널 UI/UX 개선사업 — 12s motion graphic
 * Deterministic timeline: every visual property is a pure function of the authored
 * frame f (29.97 fps, f0–f359, fractional frames allowed). No timers, no rAF state,
 * no CSS transitions, no randomness. Call seek(t) with seconds, or seekFrame(f).
 */
(() => {
"use strict";

const FPS = 30000 / 1001;
const CUTS = [0, 72, 101, 159, 187, 215, 245, 301, 1e9]; // S1..S8 start frames
const ASSET_SLOTS = ["desktop", "mobile", "service", "docs", "logo"];
const PLACEHOLDER = { desktop: "desktop", mobile: "mobile", service: "service", docs: "mobile" };
const LOGO_RATIO = 824 / 701; // supplied logo (background keyed out, otherwise untouched)
const EXTS = ["png", "jpg", "jpeg", "webp", "svg"];
const CONFIG = {
  // crops are in source-image pixels; screenshots are only scaled/cropped, never altered
  crops: {
    s1: { x: 190, w: 940 },                               // desktop main, content column
    s4: { x: 200, w: 920 },
    s4mob: { x: 0, w: 435 },                              // 스마트 서류제출
    s5: { x: 0, y: 990, w: 718, h: 520, fit: "contain" }, // mobile 자주 찾는 업무 / 미리 계산해보세요
    s6a: { x: 226, y: 40, w: 856 },                       // desktop header·통합검색·상품 카드
    s6b: { x: 0, y: 420, w: 783 },                        // 진행현황 (핵심서비스)
  },
  // S1 focus ring = 통합검색 bar in desktop source pixels
  ring: { x: 356, y: 848, w: 608, h: 58 },
};

/* ------------------------------------------------------------------ helpers */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (f, a, b) => clamp((f - a) / (b - a));
const linear = p => p;
const easeOutExpo = p => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
const easeInExpo = p => (p <= 0 ? 0 : p >= 1 ? 1 : (Math.pow(2, 10 * p - 10) - 0.0009765625) / 0.9990234375);
const easeOutCubic = p => 1 - Math.pow(1 - p, 3);
const easeInCubic = p => p * p * p;
const easeInQuad = p => p * p;
const easeInOutCubic = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const easeOutBack = (p, s = 1.70158) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
/** Damped spring that starts already moving (non-zero initial velocity) and lands on 1 at p=1. */
const spring = (p, damp = 8, freq = 10) => (p >= 1 ? 1 : 1 - Math.exp(-damp * p) * Math.cos(freq * p) * (1 - p * Math.exp(-damp)));

/** Keyframe interpolation: keys = [[frame, value, easeIntoThisKey?], ...] */
function kf(f, keys) {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, v0] = keys[i], [f1, v1, e] = keys[i + 1];
    if (f <= f1) return v0 + (v1 - v0) * (e || linear)((f - f0) / (f1 - f0));
  }
  return keys[keys.length - 1][1];
}
/** Blur that follows velocity: |d fn / d f| * k, capped. Evaluated on fractional frames. */
function velocityBlur(fn, f, k, cap, floor = 0) {
  const v = (fn(f + 0.25) - fn(f - 0.25)) * 2;
  return Math.min(cap, Math.max(floor, Math.abs(v) * k));
}

/* --------------------------------------------- SVG directional blur filters */
const SVGNS = "http://www.w3.org/2000/svg";
const filterDefs = document.getElementById("filterDefs");
let fidSeq = 0;
function dirFilter(el) {
  if (el._blur) return el._blur;
  const id = "dbf" + fidSeq++;
  const fl = document.createElementNS(SVGNS, "filter");
  fl.setAttribute("id", id);
  fl.setAttribute("x", "-40%"); fl.setAttribute("y", "-40%");
  fl.setAttribute("width", "180%"); fl.setAttribute("height", "180%");
  fl.setAttribute("color-interpolation-filters", "sRGB");
  const g = document.createElementNS(SVGNS, "feGaussianBlur");
  g.setAttribute("stdDeviation", "0 0");
  g.setAttribute("edgeMode", "none");
  fl.appendChild(g); filterDefs.appendChild(fl);
  return (el._blur = { id, g });
}
/** Independent stdDeviationX / stdDeviationY via SVG feGaussianBlur; extra = additional CSS filters. */
function setBlur(el, sx, sy, extra = "") {
  sx = Math.round(sx * 100) / 100; sy = Math.round(sy * 100) / 100;
  if (sx < 0.3 && sy < 0.3) { el.style.filter = extra || "none"; return; }
  const b = dirFilter(el);
  b.g.setAttribute("stdDeviation", `${sx} ${sy}`);
  el.style.filter = `url(#${b.id}) ${extra}`.trim();
}

const $ = id => document.getElementById(id);
const T = (el, s) => { el.style.transform = s; };
const show = (el, on) => { el.style.visibility = on ? "visible" : "hidden"; };

/* ----------------------------------------------------------- asset loading */
const resolved = {};
function tryLoad(url) {
  return new Promise(res => {
    const im = new Image();
    im.onload = () => res(im.decode().then(() => url, () => url));
    im.onerror = () => res(null);
    im.src = url;
  });
}
async function resolveAsset(name) {
  for (const ext of EXTS) {
    const u = await tryLoad(`assets/hf/${name}.${ext}`);
    if (u) return { url: u, real: true };
  }
  if (name === "logo") return { url: null, real: false };
  return { url: await tryLoad(`assets/placeholder/${PLACEHOLDER[name]}.svg`), real: false };
}
function naturalSize(url) {
  return new Promise(res => { const im = new Image(); im.onload = () => res([im.naturalWidth, im.naturalHeight]); im.src = url; });
}

/* -------------------------------------------------------------- DOM build */
function buildLogos() {
  const L = resolved.logo;
  const fill = (el, phSize, plate) => {
    el.innerHTML = "";
    if (L.real) {
      const im = new Image(); im.src = L.url; im.alt = "";
      if (plate) { const p = document.createElement("div"); p.className = "plate"; p.appendChild(im); el.appendChild(p); }
      else { el.appendChild(im); el.classList.add("real"); }
    } else { const s = document.createElement("span"); s.className = "ph"; s.textContent = "HF"; if (phSize) s.style.fontSize = phSize; el.appendChild(s); }
  };
  document.querySelectorAll("[data-logo]").forEach(el => fill(el));
  document.querySelectorAll("[data-logo-square]").forEach(el => fill(el, null, true));
  document.querySelectorAll("[data-logo-mini]").forEach(el => fill(el, "11px"));
  if (L.real) document.querySelectorAll(".s8mark, .s8ghost").forEach(el => {
    el.textContent = ""; el.classList.add("logoMask");
    el.style.webkitMaskImage = el.style.maskImage = `url(${L.url})`;
  });
}

const FROST = [
  { svg: "s6aSvg", num: "01", title: "정보구조 개선", asset: "desktop", crop: "s6a" },
  { svg: "s6bSvg", num: "02", title: "핵심서비스 개선", asset: "service", crop: "s6b" },
];
function buildFrostCards() {
  FROST.forEach((c, i) => {
    const s = $(c.svg), url = resolved[c.asset].url, [nw, nh] = resolved[c.asset].size;
    const cr = resolved[c.asset].real ? CONFIG.crops[c.crop] : { x: 0, y: 0, w: nw };
    const k = 538 / cr.w, im = `x="${(-cr.x * k).toFixed(2)}" y="${(-(cr.y || 0) * k).toFixed(2)}" width="${(nw * k).toFixed(2)}" height="${(nh * k).toFixed(2)}" preserveAspectRatio="none"`;
    s.innerHTML = `
      <defs>
        <filter id="frost${i}" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
          <feGaussianBlur stdDeviation="7"/>
          <feColorMatrix type="matrix" values="
            0.62 0.22 0.06 0 0.16
            0.12 0.72 0.06 0 0.17
            0.12 0.22 0.56 0 0.19
            0 0 0 1 0"/>
        </filter>
        <linearGradient id="scrim${i}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.42" stop-color="#0B1D3F" stop-opacity="0"/>
          <stop offset="1" stop-color="#0B1D3F" stop-opacity="0.66"/>
        </linearGradient>
        <clipPath id="tclip${i}"><text id="ttxt${i}" x="34" y="308" font-family="Pretendard" font-weight="700" font-size="74" letter-spacing="-2.4">${c.title}</text></clipPath>
        <filter id="tshadow${i}" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="9" flood-color="#06142E" flood-opacity="0.35"/></filter>
      </defs>
      <image href="${url}" ${im}/>
      <rect x="0" y="0" width="538" height="348" fill="url(#scrim${i})"/>
      <use href="#ttxt${i}" fill="#0B1D3F" fill-opacity="0.35" filter="url(#tshadow${i})"/>
      <g clip-path="url(#tclip${i})">
        <image href="${url}" ${im} filter="url(#frost${i})"/>
        <rect x="0" y="0" width="538" height="348" fill="#FFFFFF" fill-opacity="0.08"/>
      </g>
      <use href="#ttxt${i}" fill="none" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="1.3"/>
      <text x="501" y="226" text-anchor="end" font-family="InterLatin" font-weight="600" font-size="24" fill="#FFFFFF" fill-opacity="0.95" letter-spacing="0.5">${c.num}</text>
      <rect x="473" y="234" width="28" height="2.5" rx="1.25" fill="#FFFFFF" fill-opacity="0.85"/>`;
    // responsive title: scale the whole lockup to fit rather than compressing glyphs
    const t = $("ttxt" + i), w = t.getComputedTextLength(), max = 538 - 68;
    if (w > max) t.setAttribute("font-size", (74 * max / w).toFixed(2));
  });
}

/** Fit a source-pixel crop of a screenshot into its box by scale + offset only. */
function applyCrop(img, boxW, boxH, c) {
  const nw = img.naturalWidth, nh = img.naturalHeight;
  const s = c.fit === "contain" ? Math.min(boxW / c.w, boxH / c.h) : boxW / c.w;
  Object.assign(img.style, { position: "absolute", width: nw * s + "px", height: nh * s + "px",
    left: (boxW - c.w * s) / 2 - c.x * s + "px",
    top: (c.fit === "contain" ? (boxH - c.h * s) / 2 : 0) - (c.y || 0) * s + "px" });
  return s;
}
let S1K = 1; // desktop->window scale

const GHOSTS = 24;
function buildGhosts() {
  const g = $("s8ghosts");
  for (let i = 0; i < GHOSTS; i++) { const d = document.createElement("div"); d.className = "s8ghost"; d.textContent = "HF"; g.appendChild(d); }
}

/* S3 typing content */
const LINE1 = [["사용자의 여정을 ", 0], ["짧게", 1]];
const LINE2 = [["경험의 가치는 ", 0], ["크게", 1]];
const chars = segs => segs.flatMap(([s, b]) => [...s].map(ch => [ch, b]));
const L1 = chars(LINE1), L2 = chars(LINE2);
function typed(arr, n, caret) {
  let html = "", bold = false;
  for (let i = 0; i < n; i++) {
    const [ch, b] = arr[i];
    if (b && !bold) { html += "<b>"; bold = true; }
    if (!b && bold) { html += "</b>"; bold = false; }
    html += ch === " " ? "&nbsp;" : ch;
  }
  if (bold) html += "</b>";
  if (caret) html += '<span class="caret"></span>';
  return html;
}

/* ================================================================ SCENES */
const scenes = [...document.querySelectorAll(".scene")];

/* ---------------- S1  f0–71 ---------------- */
const s1 = {
  camScale: f => 1 + 0.07 * (f / 66) + kf(f, [[62, 0], [72, 0.42, easeInExpo]]),
  camY: f => -0.35 * f,
  winY: f => kf(f, [[0, 640], [30, 0, easeOutExpo]]),
  shotY: f => kf(f, [[0, 60], [46, -400, easeOutExpo]]) - Math.max(0, f - 8) * 0.5,
  titleY: f => kf(f, [[15, 78], [36, 0, easeOutExpo]]),
  logoY: f => kf(f, [[11, 120], [33, 0, easeOutExpo]]),
  pillX: f => kf(f, [[24, -46], [40, 0, easeOutExpo]]),
};
function screenOf(x, y, f) { // cam-local -> screen
  const s = s1.camScale(f);
  return [540 + (x - 540) * s, 540 + (y - 540) * s + s1.camY(f)];
}
function ringBox(f) { // ring in window-body px, rides on the scrolling screenshot
  const r = CONFIG.ring, c = CONFIG.crops.s1;
  return { x: (r.x - c.x) * S1K - 6, y: r.y * S1K + s1.shotY(f) - 6, w: r.w * S1K + 12, h: r.h * S1K + 12 };
}
function ringCenter(f) {
  const r = ringBox(f);
  return [118 + r.x + r.w / 2, 268 + 46 + r.y + r.h / 2 + s1.winY(f)];
}
function cursorPos1(f) {
  const [cx, cy] = ringCenter(f);
  const [tx, ty] = screenOf(cx + 150, cy + 14, f);
  const e = easeOutCubic(prog(f, 34, 62));
  const p0 = [1150, -40], p1 = [1010, 560];
  const u = 1 - e;
  return [u * u * p0[0] + 2 * u * e * p1[0] + e * e * tx, u * u * p0[1] + 2 * u * e * p1[1] + e * e * ty];
}
function S1(f) {
  // atmospheric haze drift
  T($("s1b1"), `translate(${f * 0.9}px, ${f * 0.45}px)`);
  T($("s1b2"), `translate(${-f * 0.7}px, ${-f * 0.55}px)`);
  const cs = s1.camScale(f), cy = s1.camY(f);
  const cam = $("s1cam");
  T(cam, `translate(0, ${cy}px) scale(${cs})`);
  const zb = velocityBlur(s1.camScale, f, 70, 9);
  setBlur(cam, zb, zb * 1.15);

  // window rises from below with slight perspective, then compresses on press
  const wy = s1.winY(f), rx = kf(f, [[0, 16], [30, 0, easeOutExpo]]);
  const press = kf(f, [[68.5, 1], [70, 0.972, easeOutCubic], [72, 0.982]]);
  const win = $("s1win");
  T(win, `translateY(${wy}px) perspective(1600px) rotateX(${rx}deg) scale(${press})`);
  setBlur(win, 0, velocityBlur(s1.winY, f, 0.16, 14));

  // screenshot revealed through a mask + internal camera crop
  const body = $("s1winBody");
  const rev = 100 * (1 - easeOutExpo(prog(f, 5, 34)));
  body.style.clipPath = `inset(0 0 ${rev}% 0 round 0 0 30px 30px)`;
  const shot = $("s1shot");
  T(shot, `translateY(${s1.shotY(f)}px) scale(${kf(f, [[0, 1.12], [32, 1.0, easeOutExpo]])})`);
  setBlur(shot, 0, velocityBlur(s1.shotY, f, 0.12, 6));

  // logo disc + title + pill
  const logo = $("s1logo");
  show(logo, f >= 11);
  T(logo, `translateY(${s1.logoY(f)}px) scale(${kf(f, [[11, 0.55], [33, 1, easeOutExpo]])})`);
  setBlur(logo, 0, velocityBlur(s1.logoY, f, 0.18, 10));

  const tw = $("s1title").parentNode;
  tw.style.overflow = "hidden"; tw.style.padding = "6px 0 10px";
  const title = $("s1title");
  show(title, f >= 15);
  T(title, `translateY(${s1.titleY(f)}px)`);
  setBlur(title, 0, velocityBlur(s1.titleY, f, 0.2, 12));

  const pill = $("s1pill");
  show(pill, f >= 24);
  T(pill, `translateX(${s1.pillX(f)}px) scale(${kf(f, [[24, 0.82], [38, 1, p => easeOutBack(p, 2.2)]])})`);
  setBlur(pill, velocityBlur(s1.pillX, f, 0.2, 8), 0);

  // focus ring answers the cursor
  const r = ringBox(f), ring = $("s1ring");
  Object.assign(ring.style, { left: r.x + "px", top: r.y + "px", width: r.w + "px", height: r.h + "px" });
  ring.style.opacity = kf(f, [[52, 0], [60, 1, easeOutCubic]]);
  T(ring, `scale(${kf(f, [[52, 1.08], [62, 1, easeOutExpo]])})`);

  // cursor: curved path from upper-right, rotates, grows 1.55x, presses at f69–71
  const cur = $("s1cursor");
  show(cur, f >= 34);
  const [x, y] = cursorPos1(f);
  const sc = lerp(1, 1.55, easeInOutCubic(prog(f, 40, 63))) * kf(f, [[68.5, 1], [70, 0.86, easeOutCubic], [72, 0.92]]);
  const rot = kf(f, [[34, 16], [62, -5, easeOutCubic]]);
  T(cur, `translate(${x - 4}px, ${y - 3}px) rotate(${rot}deg) scale(${sc})`);
  const vx = velocityBlur(ff => cursorPos1(ff)[0], f, 0.08, 3.5), vy = velocityBlur(ff => cursorPos1(ff)[1], f, 0.08, 3.5);
  setBlur(cur, vx, vy, "drop-shadow(0 4px 6px rgba(0,0,0,.28))");
}

/* ---------------- S2  f72–100 ---------------- */
const MOD_BASE = [-90, 0, 90, 180]; // top 핵심서비스, right 간편서류, bottom 일관된 UI, left 정보구조
const s2 = {
  ang: f => 235 * (1 - easeOutExpo(prog(f, 72, 86))),
  rad: f => kf(f, [[72, 380], [86, 272, easeOutExpo], [88.5, 280, easeInOutCubic], [101, 6, easeInExpo]]),
  modS: f => kf(f, [[72, 0.86], [84, 1, easeOutExpo], [89, 1], [101, 0.22, easeInExpo]]),
  iconS: f => kf(f, [[72, 1.28], [81, 1, easeOutExpo], [88.5, 1.04, easeInOutCubic], [101, 0.06, easeInExpo]]),
};
function modPos(i, f) {
  const a = (MOD_BASE[i] + s2.ang(f)) * Math.PI / 180, r = s2.rad(f);
  return [540 + Math.cos(a) * r, 540 + Math.sin(a) * r];
}
function S2(f) {
  const hs = kf(f, [[72, 0.82], [84, 1, easeOutExpo], [89, 1.06, easeInOutCubic], [101, 0.25, easeInExpo]]);
  T($("s2halo"), `scale(${hs})`);
  const icon = $("s2icon"), is = s2.iconS(f);
  T(icon, `scale(${is}) rotate(${kf(f, [[89, 0], [101, -18, easeInExpo]])}deg)`);
  const ib = velocityBlur(s2.iconS, f, 26, 10);
  setBlur(icon, ib, ib);
  for (let i = 0; i < 4; i++) {
    const m = $("m" + i), [x, y] = modPos(i, f), s = s2.modS(f);
    T(m, `translate(${x - 66}px, ${y - 66}px) scale(${s})`);
    const bx = velocityBlur(ff => modPos(i, ff)[0], f, 0.13, 16);
    const by = velocityBlur(ff => modPos(i, ff)[1], f, 0.13, 16);
    setBlur(m, bx, by);
    const lab = m.querySelector(".modLabel");
    lab.style.opacity = kf(f, [[79, 0], [84, 1, easeOutCubic], [89, 1], [92, 0]]);
    lab.style.transform = `translateX(-50%) translateY(${kf(f, [[79, 12], [86, 0, easeOutExpo]])}px)`;
  }
}

/* ---------------- S3  f101–158 ---------------- */
const TILE_C = [540, 892];
const s3 = {
  camY: f => kf(f, [[101, -46], [113, 0, easeOutExpo], [140, 0], [154, 34, easeInQuad], [159, 860, easeInExpo]]),
  panelE: f => spring(prog(f, 114, 134), 8.6, 10.5),
};
function cursorPos3(f) {
  const cy = s3.camY(f);
  const a = kf(f, [[101, 0], [112, 1, easeOutCubic]]);
  const b = kf(f, [[117, 0], [134, 1, easeInOutCubic]]);
  let x = lerp(668, TILE_C[0] + 10, a), y = lerp(1150, TILE_C[1] + 8, a);
  x = lerp(x, 858, b); y = lerp(y, 690, b);
  return [x + 0.6 * Math.max(0, f - 134), y + cy - 0.4 * Math.max(0, f - 134)];
}
function S3(f) {
  const cam = $("s3cam"), cy = s3.camY(f);
  T(cam, `translateY(${cy}px)`);
  setBlur(cam, 0, velocityBlur(s3.camY, f, 0.03, 8));

  // wallpaper drift (both the wall and the frosted sample copy)
  document.querySelectorAll("#s3 .wallGlow").forEach(g => T(g, `translate(${(f - 101) * -0.9}px, ${(f - 101) * 0.5}px)`));

  // pale-blue wash over the wallpaper as the film lifts upward
  $("s3pale").style.opacity = kf(f, [[146, 0], [159, 0.82, easeInCubic]]);

  // HF service mark is clicked
  const tile = $("s3tile");
  T(tile, `scale(${kf(f, [[111, 1], [113, 0.88, easeOutCubic], [118, 1, p => easeOutBack(p, 2.4)]])})`);

  // frosted panel springs open from the tile: small -> large -> settle
  const panel = $("s3panel");
  show(panel, f >= 114);
  const e = s3.panelE(f);
  const s = lerp(0.16, 1, e), ty = (TILE_C[1] - 488) * (1 - e);
  T(panel, `translateY(${ty}px) scale(${s})`);
  T($("s3glassBg"), `translateY(${-ty / s}px) scale(${1 / s})`);
  $("s3glassBg").style.transformOrigin = "540px 488px";
  setBlur(panel, 0, velocityBlur(ff => (TILE_C[1] - 488) * (1 - s3.panelE(ff)), f, 0.06, 6));

  // deterministic typing (frame-indexed character count)
  const n1 = clamp(Math.floor((f - 121) / (14 / L1.length)) + 1, 0, L1.length);
  const n2 = clamp(Math.floor((f - 137) / (12.5 / L2.length)) + 1, 0, L2.length);
  const blinkOn = f < 150 || ((f - 150) % 16) < 10;
  $("s3l1").innerHTML = typed(L1, n1, f < 136.5);
  $("s3l2").innerHTML = typed(L2, n2, f >= 136.5 && blinkOn);

  // cursor: rises into frame, clicks tile, then rests beside the action button
  const cur = $("s3cursor");
  const [x, y] = cursorPos3(f);
  const sc = 1.25 * kf(f, [[111, 1], [113, 0.84, easeOutCubic], [116, 1]]);
  T(cur, `translate(${x - 4}px, ${y - 3}px) rotate(${kf(f, [[101, -10], [112, -3, easeOutCubic]])}deg) scale(${sc})`);
  setBlur(cur, velocityBlur(ff => cursorPos3(ff)[0], f, 0.1, 6), velocityBlur(ff => cursorPos3(ff)[1], f, 0.1, 8),
    "drop-shadow(0 4px 6px rgba(0,0,0,.3))");
}

/* ---------------- S4  f159–186 ---------------- */
const S4_TABLE = (() => { // per-frame offsets from f159: 420 315 210 170 140 116 96 81 … 14 … 0
  const t = [420, 315, 210, 170, 140, 116, 96, 81];
  while (t[t.length - 1] > 15) t.push(Math.round(t[t.length - 1] * 0.84 * 10) / 10);
  t.push(9, 5, 2.5, 1, 0);
  return t;
})();
const s4 = {
  settle: f => {
    const u = f - 159; if (u <= 0) return S4_TABLE[0];
    const i = Math.floor(u); if (i >= S4_TABLE.length - 1) return 0;
    return lerp(S4_TABLE[i], S4_TABLE[i + 1], u - i);
  },
  drift: f => -1.6 * Math.max(0, f - 168) - kf(f, [[182, 0], [187, 120, easeInCubic]]),
};
function S4(f) {
  $("s4flash").style.opacity = kf(f, [[159, 1], [162, 0, easeOutCubic]]);
  const card = $("s4card"), off = s4.settle(f);
  T(card, `translateY(${off + s4.drift(f)}px)`);
  const blurY = off > 0 ? 24 * Math.pow(off / 420, 0.815) : 0;
  setBlur(card, 0, Math.max(blurY, velocityBlur(s4.drift, f, 0.12, 10)));

  const mob = $("s4mob");
  if (mob) {
    const mOff = off * 1.35;
    T(mob, `translateY(${mOff + s4.drift(f) * 1.3}px)`);
    setBlur(mob, 0, off > 0 ? 26 * Math.pow(Math.min(1, mOff / 420), 0.815) : velocityBlur(ff => s4.drift(ff) * 1.3, f, 0.12, 12));
  }

  const parts = [["s4k", 163], ["s4h1", 165], ["s4h2", 167], ["s4p", 170]];
  for (const [id, st] of parts) {
    const el = $(id), yf = ff => kf(ff, [[st, 34], [st + 12, 0, easeOutExpo]]) - 0.35 * Math.max(0, ff - 176);
    el.style.opacity = kf(f, [[st, 0], [st + 3, 1]]);
    T(el, `translateY(${yf(f)}px)`);
    setBlur(el, 0, velocityBlur(yf, f, 0.22, 7));
  }
}

/* ---------------- S5  f187–214 ---------------- */
const s5 = {
  cardY: f => 760 * (1 - spring(prog(f, 187, 201), 9.5, 9.2)) + kf(f, [[207, 0], [215, -640, easeInExpo]]),
  cardS: f => kf(f, [[207, 1], [213, 0.95, easeOutCubic]]),
};
function S5(f) {
  T($("s5back"), `translateY(${-(f - 187) * 1.4}px) scale(${1.04 + (f - 187) * 0.001})`);
  const card = $("s5card");
  T(card, `translateY(${s5.cardY(f)}px) scale(${s5.cardS(f)})`);
  setBlur(card, 0, velocityBlur(s5.cardY, f, 0.075, 22));
  const cap = $("s5cap"), cyf = ff => kf(ff, [[195, 26], [205, 0, easeOutExpo]]);
  cap.style.opacity = kf(f, [[195, 0], [198, 1]]);
  T(cap, `translateY(${cyf(f)}px)`);
  setBlur(cap, 0, velocityBlur(cyf, f, 0.2, 6));
}

/* ---------------- S6  f215–244 ---------------- */
const S6_POS = [[232, 176], [310, 496]];
const s6 = {
  y: (i, f) => {
    const st = 215 + i * 4;
    return kf(f, [[st, 300], [st + 13, 0, easeOutExpo]]) - 1.4 * Math.max(0, f - 229)
      - kf(f, [[238, 0], [245, 1100, easeInExpo]]);
  },
};
function S6(f) {
  for (let i = 0; i < 2; i++) {
    const el = $(i ? "s6b" : "s6a"), st = 215 + i * 4, [x, y0] = S6_POS[i];
    show(el, f >= st);
    const p = easeOutExpo(prog(f, st, st + 13));
    const sc = lerp(1.08, 1, p), defocus = lerp(12, 0, p);
    el.style.left = x + "px"; el.style.top = y0 + "px"; el.style.zIndex = 1 + i;
    T(el, `translateY(${s6.y(i, f)}px) scale(${sc})`);
    const vb = velocityBlur(ff => s6.y(i, ff), f, 0.075, 20);
    setBlur(el, defocus, defocus + vb);
  }
}

/* ---------------- S7  f245–300 ---------------- */
const s7 = {
  y: f => kf(f, [[245, 430], [269, 0, easeOutCubic]]),
  s: f => kf(f, [[245, 0.9], [269, 1, easeOutCubic], [288, 1], [300, 123 / 168, p => 0.45 * p + 0.55 * p * p * p], [301, 0.66, linear]]),
};
function S7(f) {
  const el = $("s7logo");
  // f269–287: intentional hold — pure constants, no drift
  const y = f >= 269 && f < 288 ? 0 : s7.y(f), s = f >= 269 && f < 288 ? 1 : s7.s(f);
  T(el, `translateY(${y}px) scale(${s})`);
  const dark = kf(f, [[295, 1], [301, 0.04, easeInCubic]]);
  const vb = velocityBlur(s7.y, f, 0.12, 14), zb = velocityBlur(s7.s, f, 40, 6);
  setBlur(el, zb, Math.max(vb, zb), dark < 0.999 ? `brightness(${dark})` : "");
}

/* ---------------- S8  f301–362 ---------------- */
const s8 = {
  s: f => kf(f, [[301, 7.5], [319, 1, easeOutExpo], [347, 0.93], [362.5, 0.4, p => 0.073 * p + 0.927 * p * p * p]]),
};
function S8(f) {
  const grp = $("s8grp"), s = s8.s(f);
  T(grp, `scale(${s})`);
  const speed = Math.abs((s8.s(f + 0.25) - s8.s(f - 0.25)) * 2) / s; // relative zoom speed
  const ghosts = $("s8ghosts").children, smear = clamp(speed * 2.4);
  for (let i = 0; i < ghosts.length; i++) {
    const gs = s8.s(f - (i + 1) * 0.42) / s;
    ghosts[i].style.transform = `scale(${gs})`;
    ghosts[i].style.opacity = (0.11 * (1 - i / ghosts.length) * smear).toFixed(4);
  }
  const zb = clamp(speed * 30, 0, 8);
  setBlur($("s8mark"), zb, zb, "drop-shadow(0 0 26px rgba(243,243,245,.28))");
  const sub = $("s8sub"), syf = ff => kf(ff, [[313, 22], [325, 0, easeOutExpo]]);
  sub.style.opacity = kf(f, [[313, 0], [317, 1]]);
  T(sub, `translateY(${syf(f)}px)`);
  setBlur(sub, zb * 0.6, Math.max(zb * 0.6, velocityBlur(syf, f, 0.2, 6)));
  const line = $("s8line"), lyf = ff => kf(ff, [[321, 16], [333, 0, easeOutExpo]]);
  line.style.opacity = kf(f, [[321, 0], [325, 1]]);
  T(line, `translateY(${lyf(f)}px)`);
  setBlur(line, zb * 0.6, Math.max(zb * 0.6, velocityBlur(lyf, f, 0.2, 5)));
}

const RENDER = [S1, S2, S3, S4, S5, S6, S7, S8];

/* ================================================================ seek */
let ready = false;
function seekFrame(f) {
  let k = 0;
  while (f >= CUTS[k + 1]) k++; // hard cuts: exactly one scene visible
  scenes.forEach((el, i) => { el.style.display = i === k ? "block" : "none"; });
  RENDER[k](f);
  return k;
}
function seek(t) { return seekFrame(t * FPS); }

async function init() {
  // inject S4 mobile layer (supplied mobile screenshot, no device mockup)
  const mob = document.createElement("div");
  mob.className = "s4mob"; mob.id = "s4mob";
  mob.innerHTML = '<img class="shot" data-asset="docs" alt="">';
  $("s4").insertBefore(mob, $("s4copy"));
  // pale wash sits on the wallpaper, under the panel
  $("s3cam").insertBefore($("s3pale"), $("s3cam").querySelector(".menuStrip"));

  for (const n of ASSET_SLOTS) resolved[n] = await resolveAsset(n);
  document.querySelectorAll("img[data-asset]").forEach(im => { im.src = resolved[im.dataset.asset].url; });
  for (const n of ASSET_SLOTS) if (resolved[n].url) resolved[n].size = await naturalSize(resolved[n].url);
  buildGhosts();
  buildLogos();
  await Promise.all([...document.images].map(im => im.decode().catch(() => {})));
  const crop = (sel, w, h, key) => { const im = document.querySelector(sel); return applyCrop(im, w, h, resolved[im.dataset.asset].real ? CONFIG.crops[key] : { x: 0, w: im.naturalWidth }); };
  S1K = crop("#s1shot", 844, 594, "s1");
  crop("#s4card .shot", 960, 1400, "s4");
  crop("#s4mob .shot", 236, 9999, "s4mob");
  crop(".s5img .shot", 828, 500, "s5");

  await Promise.all([400, 500, 600, 700].flatMap(w => [
    document.fonts.load(`${w} 40px Pretendard`, "가나다 짧게 크게"),
    document.fonts.load(`${w} 40px InterLatin`, "HF UI 01 02"),
  ]));
  await document.fonts.ready;
  buildFrostCards();
  await Promise.all([...document.images].map(im => (im.complete ? im.decode().catch(() => {}) : new Promise(r => { im.onload = im.onerror = r; }).then(() => im.decode().catch(() => {})))));

  const missing = ASSET_SLOTS.filter(n => !resolved[n].real);
  if (missing.length) {
    const tag = $("slotTags");
    tag.textContent = `PREVIEW · HF 에셋 슬롯: ${missing.join(", ")}`;
    tag.style.display = "block";
  }
  const fontOK = document.fonts.check("700 40px Pretendard", "짧게") && document.fonts.check("700 40px InterLatin", "HF");
  window.__status = { fontOK, missing, ready: true };
  ready = true;
  seekFrame(0);
}

window.seek = seek;
window.seekFrame = seekFrame;
window.__helpers = { kf, lerp, clamp, easeOutExpo, easeInExpo, easeInOutCubic, spring, velocityBlur };
window.__ready = init();
})();
