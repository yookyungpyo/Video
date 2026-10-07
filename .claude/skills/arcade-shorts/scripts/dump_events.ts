// Usage: node --experimental-strip-types --no-warnings dump_events.ts <abs path to engine.ts> > events.json
// Prints the timeline the soundtrack syncs to, plus a stack-height report on stderr
// so you can confirm the board never overflows before rendering.
const engine = await import(process.argv[2]);
const { SIM, stackHeight, ROWS, LEVEL_UPS, CHEST_OPEN, PAUSE_AT, CONTINUE_AT, TOTAL } = engine;

const chest = SIM.blocks.find((b: { chestOpenAt?: number }) => b.chestOpenAt !== undefined);
const heights: string[] = [];
for (let f = 0; f <= PAUSE_AT; f += 20) heights.push(`${f}:${stackHeight(f)}`);
const maxRow = Math.max(...SIM.blocks.map((b: { hist: { row: number }[] }) => b.hist[0].row));

console.error("clears", JSON.stringify(SIM.clears));
console.error("heights", heights.join(" "));
console.error(`max landing row ${maxRow} of ${ROWS - 1}${maxRow > ROWS - 1 ? "  <-- OVERFLOW, fix DROPS" : ""}`);

console.log(JSON.stringify({
  total: TOTAL,
  lands: SIM.blocks.map((b: { land: number }) => b.land),
  clears: SIM.clears.map((c: { f: number }) => c.f),
  levelUps: LEVEL_UPS,
  chestLand: chest?.land ?? null,
  chestOpen: CHEST_OPEN ?? null,
  pause: PAUSE_AT,
  continueAt: CONTINUE_AT,
}));
