import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const sourcePath = resolve(process.cwd(), 'src/app/data/verified/artifacts/historical-fonts.json');
const targetPath = resolve(process.cwd(), 'src/app/data/verified/.generated/historical-artifact-runtime.json');
const evidence = JSON.parse(readFileSync(sourcePath, 'utf8'));

const runtime = Object.fromEntries(Object.entries(evidence)
  .filter(([family, record]) => record?.family === family)
  .filter(([, record]) => typeof record?.sourceUrl === 'string' && /^https:\/\/raw\.githubusercontent\.com\//.test(record.sourceUrl))
  .filter(([, record]) => /^[0-9a-f]{64}$/i.test(record?.sha256 || ''))
  .filter(([, record]) => Number.isInteger(record?.metrics?.weightClass) && record.metrics.weightClass >= 1 && record.metrics.weightClass <= 1000)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([family, record]) => [family, {
    family,
    relation: record.relation,
    sourceUrl: record.sourceUrl,
    sha256: record.sha256,
    weightClass: record.metrics.weightClass,
    scripts: Array.isArray(record?.cmap?.scripts) ? record.cmap.scripts : [],
    axes: Object.fromEntries((record.axes || [])
      .filter(axis => typeof axis?.tag === 'string' && axis.tag.length === 4)
      .filter(axis => [axis.min, axis.default, axis.max].every(value => Number.isFinite(Number(value))))
      .map(axis => [axis.tag, {
        min: Number(axis.min),
        default: Number(axis.default),
        max: Number(axis.max),
      }])),
  }]));

mkdirSync(dirname(targetPath), { recursive: true });
writeFileSync(targetPath, `${JSON.stringify(runtime)}\n`);

const sourceBytes = Buffer.byteLength(JSON.stringify(evidence));
const runtimeBytes = Buffer.byteLength(JSON.stringify(runtime));
const reduction = sourceBytes ? Math.round((1 - runtimeBytes / sourceBytes) * 100) : 0;
console.log(`Generated compact historical-artifact runtime metadata: ${Object.keys(runtime).length} families, ${runtimeBytes} bytes (${reduction}% smaller than canonical historical evidence).`);
