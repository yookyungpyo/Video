// Image map — verified by content (not by attachment order or file name).
// Originals: repo/assets/carrot-trust/*.png (kept untouched).
// Working copies: remotion-composer/public/images/*.png (copied by scripts/carrot-trust/prepare.mjs).
// Coordinates are normalized to the source image (x: 0–1 of width, y: 0–1 of height).
export const IMG = {
  messy: "images/01_messy_listing.png", //  man shoots the laptop on a messy bed (blanket, snack bag, tangled cable)
  hesitate: "images/02_buyer_hesitates.png", // woman frowns at her phone
  clean: "images/03_clean_listing.png", //  same man, same laptop, same framing, on a tidy desk
  interested: "images/04_buyer_interested.png", // same woman, interested
  neat: "images/05_neat_appearance.png", // man straightens his collar
  docs: "images/06_prepared_documents.png", // man files documents into a navy folder
  ready: "images/07_ready_for_meeting.png", // man waits, ready, at the meeting table
  listen: "images/08_attentive_listening.png", // man listens and takes notes
  explain: "images/09_opportunity_to_explain.png", // man explains, the other person listens with interest
} as const;

// Points of interest in 01 / 03 (identical framing — the laptop sits in the same place)
export const LISTING = {
  laptop: { x: 0.615, y: 0.67, r: 0.36 },
  blanket: { x: 0.8, y: 0.86, r: 0.15 },
  chips: { x: 0.1, y: 0.705, r: 0.1 },
  cable: { x: 0.14, y: 0.87, r: 0.12 },
  photoCrop: [0.4, 0.965] as [number, number], // listing photo: laptop + its surroundings (full width)
};

export const LISTING_TEXT = {
  title: "사용하던 노트북 판매합니다",
  price: "350,000원", // example price for the video — not a market price claim
  disclaimer: "중고거래 상황을 재구성한 이야기",
};
