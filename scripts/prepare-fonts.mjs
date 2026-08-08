import { gunzipSync } from 'node:zlib';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'src/app/data/font-data/fonts.json.gz');
const target = resolve(root, 'src/app/data/font-data/fonts.generated.json');

const raw = gunzipSync(readFileSync(source)).toString('utf8');
const fonts = JSON.parse(raw);

if (!Array.isArray(fonts) || fonts.length !== 1346) {
  throw new Error(`ONOD Fonts catalog integrity error: expected 1346 fonts, got ${Array.isArray(fonts) ? fonts.length : 'non-array'}`);
}

const uniqueIds = new Set(fonts.map((font) => font?.id));
if (uniqueIds.size !== fonts.length) {
  throw new Error(`ONOD Fonts catalog integrity error: expected ${fonts.length} unique IDs, got ${uniqueIds.size}`);
}

writeFileSync(target, JSON.stringify(fonts));
console.log(`Prepared ${fonts.length} fonts -> ${target}`);
