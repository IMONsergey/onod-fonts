import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve(process.cwd(), 'dist');
const indexPath = resolve(dist, 'index.html');
const errors = [];

if (!existsSync(indexPath)) {
  errors.push('dist/index.html is missing.');
} else {
  const html = readFileSync(indexPath, 'utf8');
  if (html.includes('/src/main.tsx')) errors.push('production HTML still references the Vite development entry.');
  if (!html.includes('/onod-fonts/assets/')) errors.push('production HTML does not contain the expected GitHub Pages base path /onod-fonts/assets/.');
  if (/\b(?:src|href)="\/assets\//.test(html)) errors.push('root-absolute /assets paths would break on project GitHub Pages.');
}

const assetsDir = resolve(dist, 'assets');
if (!existsSync(assetsDir)) errors.push('dist/assets is missing.');
else if (readdirSync(assetsDir).length === 0) errors.push('dist/assets is empty.');

if (errors.length) {
  console.error('Production bundle validation failed:');
  errors.forEach(error => console.error(`  ERROR ${error}`));
  process.exit(1);
}

console.log('Production bundle validation passed for /onod-fonts/ GitHub Pages base path.');
