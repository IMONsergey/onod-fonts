import { existsSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd(), 'src/app/data/verified');
const canonicalPath = resolve(root, 'independent-web-sources.json');
const shardPattern = /^independent-web-sources-.+\.json$/;

const parseObject = (path, label) => {
  const value = JSON.parse(readFileSync(path, 'utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must contain a JSON object.`);
  return value;
};

const canonical = existsSync(canonicalPath) ? parseObject(canonicalPath, 'Canonical independent web evidence') : {};
const shardNames = readdirSync(root).filter(name => shardPattern.test(name)).sort((a, b) => a.localeCompare(b));
let added = 0;
let identical = 0;

for (const shardName of shardNames) {
  const shardPath = resolve(root, shardName);
  const shard = parseObject(shardPath, shardName);
  for (const [family, record] of Object.entries(shard)) {
    if (Object.prototype.hasOwnProperty.call(canonical, family)) {
      if (JSON.stringify(canonical[family]) !== JSON.stringify(record)) {
        throw new Error(`${shardName}: family '${family}' collides with a different canonical evidence record.`);
      }
      identical += 1;
      continue;
    }
    canonical[family] = record;
    added += 1;
  }
  unlinkSync(shardPath);
}

const ordered = Object.fromEntries(Object.entries(canonical).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(canonicalPath, `${JSON.stringify(ordered, null, 2)}\n`);
console.log(`Independent web evidence ingestion: shards=${shardNames.length}, added=${added}, already-identical=${identical}, canonical=${Object.keys(ordered).length}.`);
