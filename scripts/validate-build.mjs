import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve(process.cwd(), 'dist');
const indexPath = resolve(dist, 'index.html');
const errors = [];
const base = process.env.ONOD_BASE_PATH || '/onod-fonts/';
const assetPrefix = `${base}assets/`;

if (!existsSync(indexPath)) {
  errors.push('dist/index.html is missing.');
} else {
  const html = readFileSync(indexPath, 'utf8');
  if (html.includes('/src/main.tsx')) errors.push('production HTML still references the Vite development entry.');
  if (!html.includes(assetPrefix)) errors.push(`production HTML does not contain the expected asset prefix ${assetPrefix}.`);
  if (base !== '/' && /\b(?:src|href)="\/assets\//.test(html)) errors.push('root-absolute /assets paths would break on project GitHub Pages.');
}

const assetsDir = resolve(dist, 'assets');
if (!existsSync(assetsDir)) errors.push('dist/assets is missing.');
else if (readdirSync(assetsDir).length === 0) errors.push('dist/assets is empty.');

if (errors.length) {
  console.error('Production bundle validation failed:');
  errors.forEach(error => console.error(`  ERROR ${error}`));
  process.exit(1);
}

console.log(`Production bundle validation passed for base path ${base}.`);
