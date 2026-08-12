import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = process.cwd();
const html = readFileSync(resolve(root, 'dist/index.html'), 'utf8');
const match = html.match(/<script[^>]+type=["']module["'][^>]+src=["']([^"']+\.js)["']/i) || html.match(/<script[^>]+src=["']([^"']+\.js)["'][^>]+type=["']module["']/i);
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

// Pre-audit production baseline: 912.25 kB raw / 237.93 kB gzip.
// Audited platform overhaul: ~660.7 kB raw / 168.8 kB gzip.
// Keep modest headroom while blocking regression toward the old baseline.
const MAX_ENTRY_RAW_BYTES = 700_000;
const MAX_ENTRY_GZIP_BYTES = 180_000;
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
