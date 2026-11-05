import {
  ACC, PH, PW, box, chrome, dot, font, hash, line, makeCanvas, pill, rr, text, type Ctx,
} from "./kit";

// ───────────────────────────── 01 HOME (dark hero) ─────────────────────────────
function home(ctx: Ctx) {
  ctx.fillStyle = "#0A0D14";
  ctx.fillRect(0, 0, PW, PH);
  // ambient hero glow
  const g = ctx.createRadialGradient(1150, 460, 20, 1150, 460, 620);
  g.addColorStop(0, "rgba(108,123,255,0.40)");
  g.addColorStop(0.5, "rgba(108,123,255,0.10)");
  g.addColorStop(1, "rgba(108,123,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PW, PH);
  chrome(ctx, { dark: true, url: "lumen.studio", active: 0 });

  pill(ctx, "●  New — Lumen 3.0 is live", 72, 230, 38, "rgba(108,123,255,0.14)", "#AEB6FF", 16, "rgba(108,123,255,0.35)");
  text(ctx, "Design digital", 70, 360, 86, "#F3F4F8", 700, "left", -2.5);
  text(ctx, "experiences that", 70, 455, 86, "#F3F4F8", 700, "left", -2.5);
  text(ctx, "move people.", 70, 550, 86, ACC, 700, "left", -2.5);
  text(ctx, "The creative platform for teams who build", 72, 622, 23, "#8A90A6", 400);
  text(ctx, "immersive websites, products and stories.", 72, 656, 23, "#8A90A6", 400);
  pill(ctx, "Start building  →", 72, 702, 58, ACC, "#FFFFFF", 19);
  pill(ctx, "Watch the film", 296, 702, 58, "rgba(255,255,255,0.04)", "#E8EAF2", 19, "rgba(255,255,255,0.16)");

  // hero visual: stacked glass cards
  const cx = 1130;
  box(ctx, cx - 300, 250, 520, 360, 26, "rgba(255,255,255,0.035)", "rgba(255,255,255,0.10)");
  box(ctx, cx - 240, 205, 520, 360, 26, "rgba(20,24,36,0.92)", "rgba(255,255,255,0.12)");
  // card content: chart
  text(ctx, "Engagement", cx - 205, 258, 18, "#8A90A6", 500);
  text(ctx, "+248%", cx - 205, 305, 44, "#F3F4F8", 700, "left", -1);
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const x = cx - 205 + i * 11.5;
    const y = 500 - i * 3.4 - Math.sin(i * 0.55) * 18 - hash(i) * 10;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.strokeStyle = ACC;
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.lineTo(cx - 205 + 460, 530);
  ctx.lineTo(cx - 205, 530);
  const fg = ctx.createLinearGradient(0, 330, 0, 530);
  fg.addColorStop(0, "rgba(108,123,255,0.35)");
  fg.addColorStop(1, "rgba(108,123,255,0)");
  ctx.fillStyle = fg;
  ctx.fill();
  // floating chip
  box(ctx, cx + 120, 560, 230, 92, 20, "rgba(28,33,48,0.96)", "rgba(255,255,255,0.12)");
  dot(ctx, cx + 160, 606, 18, "rgba(108,123,255,0.25)");
  dot(ctx, cx + 160, 606, 7, ACC);
  text(ctx, "Live visitors", cx + 192, 596, 15, "#8A90A6", 500);
  text(ctx, "12,480", cx + 192, 626, 24, "#F3F4F8", 700);

  // logos row
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(72, 836, PW - 144, 1);
  text(ctx, "TRUSTED BY TEAMS AT", 72, 890, 14, "#5D6378", 600, "left", 2);
  ["Northwind", "Halcyon", "Vertex", "Oro", "Kinetic", "Atlas"].forEach((n, i) =>
    text(ctx, n, 340 + i * 205, 893, 26, "#4E546A", 700, "left", -0.5),
  );
}

// ─────────────────────────── 02 FEATURES (light grid) ──────────────────────────
function features(ctx: Ctx) {
  ctx.fillStyle = "#F6F7FB";
  ctx.fillRect(0, 0, PW, PH);
  chrome(ctx, { dark: false, url: "lumen.studio/product", active: 0 });
  text(ctx, "PLATFORM", PW / 2, 228, 15, ACC, 700, "center", 3);
  text(ctx, "Everything you need to ship", PW / 2, 296, 54, "#11131A", 700, "center", -1.5);
  text(ctx, "Composable tools for motion, content and performance — in one place.", PW / 2, 342, 21, "#6A7084", 400, "center");
  const items = [
    ["Motion Engine", "Timeline-based animation with real-time preview."],
    ["Visual CMS", "Structured content your whole team can edit."],
    ["3D Scenes", "Drop in WebGL scenes without writing shaders."],
    ["Analytics", "Understand how every interaction performs."],
    ["Edge Hosting", "Global deploys in under ten seconds."],
    ["Collaboration", "Comments, branches and reviews built in."],
  ];
  items.forEach(([t, d], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 92 + col * 482;
    const y = 400 + row * 270;
    box(ctx, x, y, 450, 240, 22, "#FFFFFF", "rgba(17,19,26,0.08)");
    const ig = ctx.createLinearGradient(x + 36, y + 36, x + 96, y + 96);
    ig.addColorStop(0, i === 2 ? ACC : "#EEF0FF");
    ig.addColorStop(1, i === 2 ? "#8D98FF" : "#E2E5FF");
    box(ctx, x + 36, y + 36, 60, 60, 16, ig);
    // icon glyph
    ctx.strokeStyle = i === 2 ? "#FFFFFF" : ACC;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    const ix = x + 66;
    const iy = y + 66;
    if (i % 3 === 0) { ctx.arc(ix, iy, 13, 0, Math.PI * 2); }
    else if (i % 3 === 1) { rr(ctx, ix - 13, iy - 13, 26, 26, 6); }
    else { ctx.moveTo(ix - 14, iy + 10); ctx.lineTo(ix, iy - 14); ctx.lineTo(ix + 14, iy + 10); ctx.closePath(); }
    ctx.stroke();
    text(ctx, t, x + 36, y + 148, 26, "#11131A", 700, "left", -0.5);
    text(ctx, d, x + 36, y + 186, 18, "#6A7084", 400);
  });
}

// ─────────────────────────── 03 DASHBOARD (dark app) ───────────────────────────
function dashboard(ctx: Ctx) {
  ctx.fillStyle = "#0C0F17";
  ctx.fillRect(0, 0, PW, PH);
  chrome(ctx, { dark: true, url: "app.lumen.studio/insights", active: 1 });
  // sidebar
  ctx.fillStyle = "#0A0D14";
  ctx.fillRect(0, 170, 260, PH - 170);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(260, 170, 1, PH - 170);
  ["Overview", "Insights", "Audience", "Journeys", "Experiments", "Settings"].forEach((n, i) => {
    const y = 215 + i * 58;
    if (i === 1) box(ctx, 20, y - 30, 220, 46, 12, "rgba(108,123,255,0.14)");
    dot(ctx, 48, y - 7, 6, i === 1 ? ACC : "#3A4055");
    text(ctx, n, 70, y, 18, i === 1 ? "#E8EAF2" : "#7C8297", i === 1 ? 600 : 500);
  });
  // header
  text(ctx, "Insights", 300, 238, 38, "#F3F4F8", 700, "left", -1);
  text(ctx, "Last 30 days · All properties", 300, 272, 17, "#7C8297", 400);
  pill(ctx, "Export", PW - 300, 205, 44, "rgba(255,255,255,0.04)", "#E8EAF2", 16, "rgba(255,255,255,0.14)");
  pill(ctx, "+ New report", PW - 192, 205, 44, ACC, "#FFFFFF", 16);
  // KPIs
  const kpis = [["Sessions", "1.28M", "+12.4%"], ["Conversion", "4.92%", "+0.8%"], ["Avg. time", "3m 41s", "+22s"], ["Revenue", "$384K", "+18.1%"]];
  kpis.forEach(([l, v, d], i) => {
    const x = 300 + i * 322;
    box(ctx, x, 305, 300, 140, 18, "#121622", "rgba(255,255,255,0.07)");
    text(ctx, l, x + 26, 345, 16, "#7C8297", 500);
    text(ctx, v, x + 26, 400, 38, "#F3F4F8", 700, "left", -1);
    pill(ctx, d, x + 196, 372, 30, "rgba(52,211,153,0.14)", "#4ADE9B", 14);
  });
  // line chart
  box(ctx, 300, 468, 860, 470, 18, "#121622", "rgba(255,255,255,0.07)");
  text(ctx, "Traffic overview", 326, 512, 20, "#E8EAF2", 600);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(326, 560 + i * 80, 808, 1);
  }
  const plot = (amp: number, off: number, color: string, w: number) => {
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const x = 326 + i * (808 / 48);
      const y = 850 - off - i * 4.2 - Math.sin(i * 0.42) * amp - hash(i + off) * 18;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.lineJoin = "round";
    ctx.stroke();
  };
  plot(40, 0, ACC, 4);
  plot(26, -60, "rgba(255,255,255,0.28)", 2.5);
  // bars
  box(ctx, 1182, 468, 358, 470, 18, "#121622", "rgba(255,255,255,0.07)");
  text(ctx, "Top channels", 1208, 512, 20, "#E8EAF2", 600);
  [["Organic", 0.86], ["Direct", 0.64], ["Social", 0.52], ["Referral", 0.38], ["Email", 0.27]].forEach(([n, v], i) => {
    const y = 570 + i * 70;
    text(ctx, n as string, 1208, y, 16, "#9AA0B4", 500);
    box(ctx, 1208, y + 14, 306, 12, 6, "rgba(255,255,255,0.06)");
    box(ctx, 1208, y + 14, 306 * (v as number), 12, 6, i === 0 ? ACC : "rgba(108,123,255,0.55)");
  });
}

// ─────────────────────────── 04 PRICING (dark tiers) ───────────────────────────
function pricing(ctx: Ctx) {
  ctx.fillStyle = "#090B11";
  ctx.fillRect(0, 0, PW, PH);
  const g = ctx.createRadialGradient(PW / 2, 620, 10, PW / 2, 620, 520);
  g.addColorStop(0, "rgba(108,123,255,0.22)");
  g.addColorStop(1, "rgba(108,123,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PW, PH);
  chrome(ctx, { dark: true, url: "lumen.studio/pricing", active: 2 });
  text(ctx, "Simple, scalable pricing", PW / 2, 262, 56, "#F3F4F8", 700, "center", -1.5);
  text(ctx, "Start free. Upgrade when your experience grows.", PW / 2, 308, 21, "#8A90A6", 400, "center");
  const tiers = [
    ["Starter", "$0", "For personal projects", false],
    ["Studio", "$49", "For growing teams", true],
    ["Enterprise", "Custom", "For global brands", false],
  ] as const;
  tiers.forEach(([n, p, d, hi], i) => {
    const w = 420;
    const x = PW / 2 - 660 + i * 450;
    const y = hi ? 360 : 392;
    const h = hi ? 580 : 530;
    box(ctx, x, y, w, h, 26, hi ? "#151A2C" : "#10131C", hi ? "rgba(108,123,255,0.75)" : "rgba(255,255,255,0.08)");
    if (hi) pill(ctx, "MOST POPULAR", x + w - 182, y + 30, 32, ACC, "#FFFFFF", 13);
    text(ctx, n, x + 36, y + 66, 24, "#E8EAF2", 600);
    text(ctx, d, x + 36, y + 98, 17, "#7C8297", 400);
    text(ctx, p, x + 36, y + 186, 62, "#F3F4F8", 700, "left", -2);
    if (p !== "Custom") {
      font(ctx, 62, 700);
      text(ctx, "/ month", x + 46 + ctx.measureText(p).width, y + 184, 18, "#7C8297", 500);
    }
    ["Unlimited projects", "Motion engine", "Custom domains", "Team analytics", "Priority support"].forEach((f, k) => {
      const yy = y + 260 + k * 46;
      dot(ctx, x + 46, yy - 6, 10, hi ? "rgba(108,123,255,0.25)" : "rgba(255,255,255,0.07)");
      dot(ctx, x + 46, yy - 6, 4, hi ? ACC : "#8A90A6");
      text(ctx, f, x + 70, yy, 18, k < 3 + i ? "#C9CDD9" : "#4E546A", 500);
    });
    const bw = w - 72;
    box(ctx, x + 36, y + h - 86, bw, 54, 14, hi ? ACC : "rgba(255,255,255,0.05)", hi ? undefined : "rgba(255,255,255,0.14)");
    text(ctx, hi ? "Start free trial" : "Get started", x + 36 + bw / 2, y + h - 52, 18, "#FFFFFF", 600, "center");
  });
}

// ──────────────────────────── 05 STORIES (editorial) ───────────────────────────
function stories(ctx: Ctx) {
  ctx.fillStyle = "#0B0D13";
  ctx.fillRect(0, 0, PW, PH);
  chrome(ctx, { dark: true, url: "lumen.studio/stories", active: 3 });
  text(ctx, "Stories", 72, 252, 64, "#F3F4F8", 700, "left", -2);
  text(ctx, "How leading teams craft experiences with Lumen.", 72, 296, 21, "#8A90A6", 400);
  ["All", "Case studies", "Product", "Craft"].forEach((t, i) => {
    pill(ctx, t, 1010 + [0, 70, 240, 360][i], 228, 40, i === 0 ? "#F3F4F8" : "rgba(255,255,255,0.04)", i === 0 ? "#0B0D13" : "#C9CDD9", 15, i === 0 ? undefined : "rgba(255,255,255,0.12)");
  });
  // feature story
  const fx = 72, fy = 340, fw = 860, fh = 600;
  rr(ctx, fx, fy, fw, fh, 24);
  ctx.save();
  ctx.clip();
  const bg = ctx.createLinearGradient(fx, fy, fx + fw, fy + fh);
  bg.addColorStop(0, "#1B2040");
  bg.addColorStop(0.55, "#2C3478");
  bg.addColorStop(1, "#6C7BFF");
  ctx.fillStyle = bg;
  ctx.fillRect(fx, fy, fw, fh);
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.arc(fx + 640, fy + 220, 60 + i * 52, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${0.16 - i * 0.02})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  const sh = ctx.createLinearGradient(0, fy + 280, 0, fy + fh);
  sh.addColorStop(0, "rgba(8,10,15,0)");
  sh.addColorStop(1, "rgba(8,10,15,0.85)");
  ctx.fillStyle = sh;
  ctx.fillRect(fx, fy, fw, fh);
  ctx.restore();
  pill(ctx, "CASE STUDY", fx + 40, fy + 410, 32, "rgba(255,255,255,0.14)", "#FFFFFF", 13);
  text(ctx, "Halcyon rebuilt its flagship", fx + 40, fy + 495, 40, "#FFFFFF", 700, "left", -1);
  text(ctx, "launch as a 3D story", fx + 40, fy + 543, 40, "#FFFFFF", 700, "left", -1);
  // side list
  [["Product", "Designing for depth: spatial UI on the web"], ["Craft", "The art of the camera move"], ["Case study", "Vertex grew conversion 3× with motion"]].forEach(([k, t], i) => {
    const y = fy + i * 205;
    const x = 968;
    box(ctx, x, y, 560, 186, 20, "#11141D", "rgba(255,255,255,0.07)");
    const tg = ctx.createLinearGradient(x + 22, y + 22, x + 164, y + 164);
    tg.addColorStop(0, ["#2A2F55", "#1E3A4A", "#3B2A55"][i]);
    tg.addColorStop(1, ["#6C7BFF", "#3FA7C9", "#9B6CFF"][i]);
    box(ctx, x + 22, y + 22, 142, 142, 14, tg);
    text(ctx, (k as string).toUpperCase(), x + 190, y + 58, 13, ACC, 700, "left", 2);
    const words = (t as string).split(" ");
    let l1 = "", l2 = "";
    words.forEach((w) => ((l1 + w).length < 24 && !l2 ? (l1 += w + " ") : (l2 += w + " ")));
    text(ctx, l1.trim(), x + 190, y + 98, 22, "#E8EAF2", 600);
    text(ctx, l2.trim(), x + 190, y + 128, 22, "#E8EAF2", 600);
    line(ctx, x + 190, y + 152, 120, "rgba(255,255,255,0.10)", 8);
  });
}

export const PAGE_DRAWERS = [home, features, dashboard, pricing, stories];
export const PAGE_NAMES = ["Home", "Product", "Insights", "Pricing", "Stories"];

export const drawPages = () => PAGE_DRAWERS.map((d) => makeCanvas(d));
export { line };
