import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = process.cwd();
const htmlPath = resolve(root, 'dist/index.html');
const html = readFileSync(htmlPath, 'utf8');
const match = html.match(/<script[^>]+type=["']module["'][^>]+src=["']([^"']+\.js)["']/i)
  || html.match(/<script[^>]+src=["']([^"']+\.js)["'][^>]+type=["']module["']/i);

if (!match) {
  console.error('Performance budget: could not resolve the production entry module from dist/index.html.');
  process.exit(1);
}

const entryUrl = match[1];
const base = '/onod-fonts/';
const relative = entryUrl.startsWith(base) ? entryUrl.slice(base.length) : entryUrl.replace(/^\//, '');
const entryPath = resolve(root, 'dist', relative);
const rawBytes = statSync(entryPath).size;
const gzipBytes = gzipSync(readFileSync(entryPath), { level: 9 }).byteLength;

// Font Data Engine baseline: ~932 kB raw / ~242 kB gzip.
// Route splitting + safe Google runtime compaction now measure ~815 kB / 216 kB.
// Keep modest minifier/hash headroom while preventing regression to the earlier bundle.
const MAX_ENTRY_RAW_BYTES = 830_000;
const MAX_ENTRY_GZIP_BYTES = 220_000;

const kb = value => (value / 1000).toFixed(1);
console.log(`Startup entry: ${entryUrl}`);
console.log(`Startup entry size: ${kb(rawBytes)} kB raw / ${kb(gzipBytes)} kB gzip.`);
console.log(`Budget: <= ${kb(MAX_ENTRY_RAW_BYTES)} kB raw / <= ${kb(MAX_ENTRY_GZIP_BYTES)} kB gzip.`);

const failures = [];
if (rawBytes > MAX_ENTRY_RAW_BYTES) failures.push(`raw ${rawBytes} > ${MAX_ENTRY_RAW_BYTES}`);
if (gzipBytes > MAX_ENTRY_GZIP_BYTES) failures.push(`gzip ${gzipBytes} > ${MAX_ENTRY_GZIP_BYTES}`);

if (failures.length) {
  console.error(`Performance budget failed: ${failures.join('; ')}`);
  process.exit(1);
}

console.log('Performance budget passed.');
