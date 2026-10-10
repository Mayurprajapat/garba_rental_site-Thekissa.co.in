// Single-rent item photos — real catalog close-up crops (scripts/make-item-photos.mjs).
// Naam se match hota hai; koi match na ho to dress photo fallback.
// Client ke asli close-up milte hi public/images/item-*.jpg replace kar dena.

const ITEM_IMG: [RegExp, string][] = [
  [/kids.*jhumka|jhumka.*kid/i, '/images/item-kids-jhumka.jpg'],
  [/jhumka|earring|bali/i, '/images/item-jhumka.jpg'],
  [/kamar|tagdi/i, '/images/item-kamarbandh.jpg'],
  [/jewell|necklace|haar/i, '/images/item-jewellery-set.jpg'],
];

export function itemImgFor(name: string, fallback: string): string {
  const hit = ITEM_IMG.find(([re]) => re.test(name));
  return hit ? hit[1] : fallback;
}
