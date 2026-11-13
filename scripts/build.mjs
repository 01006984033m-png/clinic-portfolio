import { copyFile, mkdir, rm, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'dist');
const published = [
  'index.html', 'styles.css', 'premium-light.css', 'cinematic-care.css', 'editorial-refine.css', 'app.js',
  'privacy.html', 'privacy.css', 'robots.txt',
  'assets/brand-board.png', 'assets/lymelva-mark.svg',
  'assets/lymelva-logo.svg', 'assets/lymelva-logo-white.svg',
  'assets/hero-treatment.webp', 'assets/care-assessment.webp', 'assets/care-decongestive.webp',
  'assets/care-manual.webp', 'assets/care-compression.webp', 'assets/care-movement.webp',
  'assets/care-selfcare.webp', 'assets/care-room.webp',
  'education/index.html', 'education/content.js',
  'education/education.css', 'education/education.js',
  'guides/brand-guidelines.pdf', 'guides/lymphedema-basics.pdf',
  'guides/visit-preparation.pdf', 'guides/self-care.pdf',
];
await rm(output, {recursive: true, force: true});
for (const path of published) {
  const src = join(root, path), dst = join(output, path);
  const info = await stat(src);
  if (!info.isFile() || info.size === 0) throw new Error(`Missing or empty release asset: ${path}`);
  await mkdir(dirname(dst), {recursive: true});
  await copyFile(src, dst);
}
console.log(`Release assembled: ${published.length} public artifacts in dist/ (documentation and internal tests excluded)`);
