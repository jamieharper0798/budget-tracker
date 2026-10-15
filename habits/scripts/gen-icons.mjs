import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptsDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = path.join(scriptsDir, '../public/icons/');
mkdirSync(outDir, { recursive: true });

const jobs = [
  { src: 'icon.svg', out: 'icon-192.png', size: 192 },
  { src: 'icon.svg', out: 'icon-512.png', size: 512 },
  { src: 'icon.svg', out: 'apple-touch-icon.png', size: 180 },
  { src: 'icon-maskable.svg', out: 'icon-maskable-192.png', size: 192 },
  { src: 'icon-maskable.svg', out: 'icon-maskable-512.png', size: 512 },
];

for (const job of jobs) {
  const src = path.join(scriptsDir, job.src);
  const out = path.join(outDir, job.out);
  await sharp(src, { density: 384 }).resize(job.size, job.size).png().toFile(out);
  console.log('wrote', job.out);
}
