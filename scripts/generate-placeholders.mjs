/**
 * Generates the placeholder imagery used until BOBO PARIS supplies its own
 * photography.
 *
 * These are NOT fake photographs. Each one is a flat editorial plate — a paper
 * ground, the colourway as a block of cloth, a woven texture, and the model
 * name set in the brand's own typographic style. Read as a grid they look
 * deliberate; read individually they are obviously awaiting a real shot.
 *
 * Replace them by uploading real images through /admin/products.
 *
 *   node scripts/generate-placeholders.mjs
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

import { products } from '../data/seed/products.mjs';
import { collections } from '../data/seed/collections.mjs';

const OUT_DIR = path.join(process.cwd(), 'public', 'media');

const PAPER = ['#f3efe8', '#eee8df', '#f6f2ec', '#e9e2d7'];

/** Stable hash so a given slug always gets the same plate. */
function hash(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (char) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char],
  );
}

/**
 * One plate. `variantIndex` shifts the composition so a product's second image
 * reads as a different shot rather than a duplicate.
 */
function plate({ width, height, label, caption, swatch, seed, variantIndex = 0, style = 'plate' }) {
  if (style === 'field') return field({ width, height, swatch, seed });

  const rng = hash(seed + variantIndex);
  const paper = PAPER[rng % PAPER.length];
  const cloth = swatch ?? '#c9c1b4';

  const inset = Math.round(width * (0.12 + ((rng >> 3) % 5) * 0.012));
  const clothTop = Math.round(height * (0.14 + ((rng >> 6) % 4) * 0.02));
  const clothHeight = Math.round(height * (0.58 + ((rng >> 9) % 3) * 0.04));
  const clothWidth = width - inset * 2;
  const shiftX = variantIndex % 2 === 0 ? 0 : Math.round(width * 0.04);

  // A woven texture, drawn as thin lines rather than a raster: it stays crisp
  // and costs a few hundred bytes.
  const weave = [];
  const step = 9;
  for (let y = clothTop; y < clothTop + clothHeight; y += step) {
    weave.push(
      `<line x1="${inset + shiftX}" y1="${y}" x2="${inset + shiftX + clothWidth}" y2="${y}" stroke="#000" stroke-opacity="0.045" stroke-width="1"/>`,
    );
  }
  for (let x = inset + shiftX; x < inset + shiftX + clothWidth; x += step * 2) {
    weave.push(
      `<line x1="${x}" y1="${clothTop}" x2="${x}" y2="${clothTop + clothHeight}" stroke="#fff" stroke-opacity="0.05" stroke-width="1"/>`,
    );
  }

  const fontSize = Math.round(width * 0.028);

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${paper}"/>
  <rect x="${inset + shiftX}" y="${clothTop}" width="${clothWidth}" height="${clothHeight}" fill="${cloth}"/>
  ${weave.join('\n  ')}
  <rect x="${inset + shiftX}" y="${clothTop}" width="${clothWidth}" height="${clothHeight}" fill="none" stroke="#16130f" stroke-opacity="0.08"/>
  <text x="${inset}" y="${Math.round(height * 0.08)}" font-family="Helvetica,Arial,sans-serif" font-size="${fontSize}" letter-spacing="${fontSize * 0.35}" fill="#16130f" fill-opacity="0.55">BOBO PARIS</text>
  <text x="${inset}" y="${clothTop + clothHeight + Math.round(height * 0.06)}" font-family="Georgia,serif" font-size="${Math.round(width * 0.05)}" fill="#16130f">${escapeXml(label)}</text>
  ${caption ? `<text x="${inset}" y="${clothTop + clothHeight + Math.round(height * 0.095)}" font-family="Helvetica,Arial,sans-serif" font-size="${fontSize}" letter-spacing="${fontSize * 0.2}" fill="#16130f" fill-opacity="0.45">${escapeXml(caption.toUpperCase())}</text>` : ''}
</svg>`);
}


/**
 * Full-bleed tonal field for heroes and editorial banners.
 *
 * Deliberately wordless: the page sets its own headline over it. Darkened
 * towards the top and bottom so white navigation and white display type stay
 * legible without a heavy overlay.
 */
function field({ width, height, swatch, seed }) {
  const rng = hash(seed);
  const base = swatch ?? '#b3a894';
  const weave = [];
  const step = Math.max(Math.round(height / 150), 6);

  for (let y = 0; y < height; y += step) {
    weave.push(
      `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="#000" stroke-opacity="0.035" stroke-width="1"/>`,
    );
  }
  for (let x = (rng % step); x < width; x += step * 3) {
    weave.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="#fff" stroke-opacity="0.04" stroke-width="1"/>`,
    );
  }

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.34"/>
      <stop offset="42%" stop-color="#000" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.46"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="${base}"/>
  ${weave.join('\n  ')}
  <rect width="${width}" height="${height}" fill="url(#v)"/>
</svg>`);
}

async function write(relativePath, buffer) {
  const target = path.join(OUT_DIR, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await sharp(buffer).webp({ quality: 82 }).toFile(target);
  return `/media/${relativePath}`;
}

async function main() {
  let count = 0;

  for (const product of products) {
    const palette =
      product.colors.length > 0 ? product.colors.map((color) => color.hex) : ['#c9c1b4'];

    // Two plates per colourway: the grid's hover swap needs a second image.
    for (const [index, swatch] of palette.entries()) {
      for (const shot of [0, 1]) {
        await write(
          `products/${product.slug}-${index + 1}-${shot + 1}.webp`,
          plate({
            width: 1200,
            height: 1600,
            label: product.modelName ?? product.name,
            caption: product.colors.find((color) => color.hex === swatch)?.name ?? null,
            swatch,
            seed: product.slug,
            variantIndex: index * 2 + shot,
          }),
        );
        count += 1;
      }
    }
  }

  for (const collection of collections) {
    await write(
      `collections/${collection.slug}-cover.webp`,
      plate({
        width: 1400,
        height: 1750,
        label: collection.title,
        caption: 'Collection capsule',
        swatch: collection.swatch,
        seed: collection.slug,
      }),
    );
    await write(
      `collections/${collection.slug}-hero.webp`,
      plate({
        width: 2400,
        height: 1350,
        swatch: collection.swatch,
        seed: `${collection.slug}-hero`,
        style: 'field',
      }),
    );
    count += 2;
  }

  // Editorial plates used by the homepage and the brand pages.
  const editorial = [
    ['editorial/atelier.webp', "L'Atelier", 'Paris 11e', '#b9ada0', 2400, 1600],
    ['editorial/upcycling.webp', 'Upcycling', 'Stocks dormants', '#8f9c92', 1600, 2000],
    ['editorial/studio.webp', 'Le Studio', 'Sur mesure', '#c4a894', 1600, 2000],
    ['editorial/manifeste.webp', 'Le Manifeste', 'Produire moins, mieux', '#a8a094', 2400, 1350],
    ['editorial/femme.webp', 'Femme', 'Vestiaire', '#c9a9a0', 1400, 1750],
    ['editorial/homme.webp', 'Homme', 'Vestiaire', '#94a0ad', 1400, 1750],
    ['editorial/hero.webp', 'Les Jours Chauds', 'Collection capsule', '#cbb9a4', 2560, 1440],
  ];

  for (const [file, label, caption, swatch, width, height] of editorial) {
    // Anything the page writes its own headline over is a wordless field.
    const style = width > height ? 'field' : 'plate';
    await write(file, plate({ width, height, label, caption, swatch, seed: file, style }));
    count += 1;
  }

  console.log(`Generated ${count} placeholder images in public/media/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
