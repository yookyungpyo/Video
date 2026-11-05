// Region map of the four original screenshots (1320×2868). Measured from the
// images; regions are cut on white gutters so they tile back seamlessly.
export const SRC_W = 1320;
export const CROP_TOP = 178; // iOS status bar removed
export const CROP_H = 2560;

export type Rect = { x: number; y: number; w: number; h: number };
const r = (x: number, y: number, x2: number, y2: number): Rect => ({ x, y, w: x2 - x, h: y2 - y });

export type ScreenId = "main" | "bogeumjari" | "jeonse" | "pension";
export const SRC: Record<ScreenId, string> = {
  main: "hf/main.png",
  bogeumjari: "hf/bogeumjari.png",
  jeonse: "hf/jeonse.png",
  pension: "hf/pension.png",
};

export const REGIONS = {
  main: {
    header: r(0, 178, 1320, 345),
    logo: r(44, 222, 180, 324),
    banner: r(0, 345, 1320, 660),
    tabs: r(0, 660, 1320, 812),
    carousel: r(0, 812, 1320, 1410),
    card: r(48, 820, 982, 1381), // 보금자리론 card
    sections: r(0, 1410, 1320, 2528),
    tabbar: r(0, 2528, 1320, 2738),
  },
  bogeumjari: {
    nav: r(0, 178, 1320, 380),
    chips: r(0, 420, 1320, 570),
    title: r(0, 590, 1320, 868),
    name: r(0, 878, 1320, 1000),
    illu: r(360, 1110, 960, 1560),
    c1: r(48, 1632, 642, 1935), // 최대 대출한도 4.2억원
    c2: r(678, 1632, 1272, 1935), // 최저금리 3.9%
    c3: r(48, 1977, 642, 2346), // 대출만기 최대 50년
    c4: r(678, 1977, 1272, 2346), // 상환방식
    button: r(0, 2520, 1320, 2720),
  },
  jeonse: {
    nav: r(0, 178, 1320, 380),
    title: r(0, 455, 1320, 720),
    name: r(0, 730, 1320, 990),
    desc: r(0, 1040, 1320, 1285),
    illu: r(380, 1380, 940, 1830),
    shield: { x: 806, y: 1512 },
    c1: r(48, 1914, 642, 2271), // 보증한도 최대 4억원
    c2: r(678, 1914, 1272, 2271), // 보증비율 최대 100%
    rest: r(0, 2300, 1320, 2360),
    button: r(0, 2520, 1320, 2720),
  },
  pension: {
    nav: r(0, 178, 1320, 380),
    title: r(0, 455, 1320, 720),
    name: r(0, 730, 1320, 850),
    desc: r(0, 905, 1320, 1075),
    illu: r(380, 1140, 940, 1610),
    c1: r(48, 1698, 642, 2025), // 최대 50%감면
    c2: r(678, 1698, 1272, 2025), // 재산세 최대 25%감면
    c3: r(48, 2067, 1272, 2370), // 세액공제 최대 200만원
    info: r(40, 2425, 1280, 2712),
  },
} as const;
