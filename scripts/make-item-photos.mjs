// Jewellery item close-ups — real catalog photos se hotspot position par crop.
// Client ke asli close-up milte hi in files ko replace kar dena (same naam).
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images');

// [out, src, x%, y%, box px] — positions photos dekhke verify ki hui
const CROPS = [
  ['item-jhumka.jpg', 'g-hero.webp', 56, 24, 240], // right earring + necklace edge
  ['item-kamarbandh.jpg', 'g-hero.webp', 50, 50, 340], // silver coin belt at waist
  ['item-kids-jhumka.jpg', 'g-girls1.webp', 47, 32, 220], // face + necklace + earring
  ['item-jewellery-set.jpg', 'g-combo1.jpg', 68, 36, 320], // maang-tikka + coin belt
];

for (const [out, src, px, py, box] of CROPS) {
  const meta = await sharp(path.join(dir, src)).metadata();
  const W = meta.width, H = meta.height;
  const left = Math.max(0, Math.min(W - box, Math.round((W * px) / 100 - box / 2)));
  const top = Math.max(0, Math.min(H - box, Math.round((H * py) / 100 - box / 2)));
  await sharp(path.join(dir, src))
    .extract({ left, top, width: Math.min(box, W - left), height: Math.min(box, H - top) })
    .resize(480, 480, { fit: 'cover' })
    .jpeg({ quality: 82 })
    .toFile(path.join(dir, out));
  console.log('OK', out, `${left},${top} ${box}x${box} from ${src} (${W}x${H})`);
}
