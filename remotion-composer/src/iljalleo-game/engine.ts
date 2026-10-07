// Deterministic falling-block simulation. Every drop is scripted (spawn frame,
// fall duration, column, width); landing rows and line clears are derived here
// so the render and the soundtrack read the same timeline.

export const COLS = 8;
export const ROWS = 12;
export const CLEAR_DELAY = 10;
export const SHIFT_FRAMES = 8;

export const NEON = {
  cyan: "#22D3EE",
  pink: "#FF4FA3",
  yellow: "#FFE14D",
  green: "#4ADE80",
  purple: "#A78BFA",
  orange: "#FB923C",
  gold: "#FFC83D",
};

export type Drop = {
  spawn: number;
  dur: number;
  col: number;
  w: number;
  label: string;
  color: string;
  chestOpenAt?: number;
};

export type Block = Drop & {
  id: number;
  land: number;
  hist: { f: number; row: number }[];
  flashFrom?: number;
  removedAt?: number;
};

export type ClearEvent = { f: number; row: number };

const drop = (
  spawn: number, dur: number, col: number, w: number,
  label: string, color: string, chestOpenAt?: number,
): Drop => ({ spawn, dur, col, w, label, color, chestOpenAt });

const { cyan, pink, yellow, green, purple, orange, gold } = NEON;

export const LEVEL_UPS = [276, 366];
export const CHEST_OPEN = 535;
export const PAUSE_AT = 692;
export const CONTINUE_AT = 740;
export const TOTAL = 840;

const DROPS: Drop[] = [
  // LV1 — calm, every row clears
  drop(96, 20, 0, 3, "보고서", cyan),
  drop(118, 20, 3, 2, "회의", pink),
  drop(140, 20, 5, 3, "기획안", yellow),
  drop(176, 18, 0, 4, "엑셀", green),
  drop(196, 18, 4, 4, "메일", purple),
  drop(226, 16, 0, 2, "보고", orange),
  drop(242, 16, 2, 3, "회의록", cyan),
  drop(258, 16, 5, 3, "발표", pink),
  // LV2 / LV3 — faster, starts piling up
  drop(288, 12, 0, 4, "주간보고", yellow),
  drop(298, 12, 4, 2, "회의", green),
  drop(308, 12, 6, 2, "엑셀", purple),
  drop(318, 12, 0, 3, "기획안", orange),
  drop(328, 12, 3, 3, "보고서", cyan),
  drop(338, 12, 1, 2, "메일", pink),
  drop(348, 12, 5, 3, "발표", yellow),
  drop(358, 12, 6, 2, "야근", green),
  drop(368, 8, 0, 2, "회의록", purple),
  drop(376, 8, 3, 2, "일", orange),
  drop(384, 8, 2, 4, "수정요청", cyan),
  drop(392, 8, 6, 2, "보고", pink),
  drop(400, 8, 0, 3, "엑셀", yellow),
  drop(408, 8, 4, 4, "긴급", green),
  drop(416, 8, 1, 2, "메일", purple),
  drop(424, 8, 5, 3, "회의", orange),
  drop(432, 8, 0, 2, "일", cyan),
  drop(440, 8, 3, 2, "검토", pink),
  // Reward chest
  drop(456, 34, 2, 4, "보상?", gold, CHEST_OPEN),
  drop(548, 12, 0, 2, "일", cyan),
  drop(560, 12, 6, 2, "일", green),
  drop(574, 12, 3, 2, "또 일", pink),
  drop(586, 12, 5, 3, "야근", purple),
  // Crisis — relentless
  ...[
    [0, 2], [5, 3], [2, 3], [6, 2], [0, 3], [3, 2], [5, 2], [1, 3],
    [4, 4], [0, 2], [6, 2], [2, 2], [4, 3], [0, 3], [5, 3],
  ].map(([col, w], k) =>
    drop(600 + k * 6, 7, col, w, ["일", "또 일", "야근", "일", "급함"][k % 5],
      [cyan, pink, yellow, green, purple, orange][k % 6]),
  ),
];

export const rowAt = (b: Block, f: number) => {
  let r = b.hist[0].row;
  for (const h of b.hist) if (h.f <= f) r = h.row;
  return r;
};

const simulate = (drops: Drop[]) => {
  const blocks: Block[] = [];
  const clears: ClearEvent[] = [];
  let pending: { at: number; row: number }[] = [];

  const flush = (upTo: number) => {
    pending.sort((a, b) => a.at - b.at);
    const keep: typeof pending = [];
    for (const p of pending) {
      if (p.at > upTo) { keep.push(p); continue; }
      for (const b of blocks) {
        if (b.removedAt !== undefined) continue;
        const r = rowAt(b, p.at);
        if (r > p.row) b.hist.push({ f: p.at, row: r - 1 });
      }
    }
    pending = keep;
  };

  const ordered = [...drops].sort((a, b) => a.spawn + a.dur - (b.spawn + b.dur));
  ordered.forEach((dr, id) => {
    const land = dr.spawn + dr.dur;
    flush(land);
    let row = 0;
    for (const b of blocks) {
      if (b.removedAt !== undefined && b.removedAt <= land) continue;
      if (b.col < dr.col + dr.w && dr.col < b.col + b.w) row = Math.max(row, rowAt(b, land) + 1);
    }
    blocks.push({ ...dr, id, land, hist: [{ f: land, row }] });
    const inRow = blocks.filter((b) => b.removedAt === undefined && rowAt(b, land) === row);
    if (inRow.reduce((s, b) => s + b.w, 0) === COLS) {
      for (const b of inRow) { b.flashFrom = land; b.removedAt = land + CLEAR_DELAY; }
      pending.push({ at: land + CLEAR_DELAY, row });
      clears.push({ f: land, row });
    }
  });
  flush(Infinity);
  return { blocks, clears };
};

export const SIM = simulate(DROPS);

export const stackHeight = (f: number) => {
  let h = 0;
  for (const b of SIM.blocks) {
    if (b.land > f) continue;
    if (b.removedAt !== undefined && b.removedAt <= f) continue;
    h = Math.max(h, rowAt(b, f) + 1);
  }
  return h;
};
