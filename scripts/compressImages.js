const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.join(__dirname, '..', 'assets', 'popular-services');
const MAX_WIDTH = 800;
const QUALITY = 75;

async function compressImages() {
  const files = fs.readdirSync(TARGET_DIR)
    .filter(f => /\.(png|jpg|jpeg)$/i.test(f));

  let totalBefore = 0;
  let totalAfter = 0;
  let count = 0;

  console.log(`Found ${files.length} images to compress...\n`);

  for (const file of files) {
    const filePath = path.join(TARGET_DIR, file);
    const stats = fs.statSync(filePath);
    const sizeBefore = stats.size;
    totalBefore += sizeBefore;

    // Skip if already small (under 300KB)
    if (sizeBefore < 300 * 1024) {
      console.log(`SKIP ${file}: ${(sizeBefore / 1024).toFixed(0)}KB (already small)`);
      totalAfter += sizeBefore;
      continue;
    }

    const baseName = path.basename(file, path.extname(file));
    const outputPath = path.join(TARGET_DIR, baseName + '_compressed.jpg');

    try {
      await sharp(filePath)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toFile(outputPath);

      const sizeAfter = fs.statSync(outputPath).size;
      totalAfter += sizeAfter;
      count++;

      // Remove original
      fs.unlinkSync(filePath);

      // If original was .png, rename compressed to .jpg
      const finalPath = path.join(TARGET_DIR, baseName + '.jpg');
      fs.renameSync(outputPath, finalPath);

      const beforeMB = (sizeBefore / 1024 / 1024).toFixed(2);
      const afterKB = (sizeAfter / 1024).toFixed(0);
      const pct = ((1 - sizeAfter / sizeBefore) * 100).toFixed(0);
      console.log(`${file}: ${beforeMB}MB -> ${afterKB}KB (${pct}% smaller)`);
    } catch (err) {
      console.error(`ERROR processing ${file}: ${err.message}`);
      totalAfter += sizeBefore;
    }
  }

  console.log(`\n========================================`);
  console.log(`TOTAL BEFORE: ${(totalBefore / 1024 / 1024).toFixed(2)} MB`);
  console.log(`TOTAL AFTER:  ${(totalAfter / 1024 / 1024).toFixed(2)} MB`);
  console.log(`SAVINGS:      ${((1 - totalAfter / totalBefore) * 100).toFixed(0)}%`);
  console.log(`COMPRESSED:   ${count} images`);
  console.log(`========================================`);
}

compressImages().catch(console.error);
