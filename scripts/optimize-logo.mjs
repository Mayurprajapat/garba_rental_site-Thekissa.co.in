import { renameSync } from 'fs';
import sharp from 'sharp';

// logo.png (2.9MB mockup) -> backup + optimized 512px for web/navbar/favicon
renameSync('public/images/logo.png', 'public/images/logo-full.png');
await sharp('public/images/logo-full.png')
  .resize(512, 512, { fit: 'cover' })
  .png({ quality: 82, compressionLevel: 9 })
  .toFile('public/images/logo.png');
console.log('logo optimized');
