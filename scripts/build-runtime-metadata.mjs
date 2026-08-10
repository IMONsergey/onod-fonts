import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const source = resolve(process.cwd(), 'src/app/data/verified/google-fonts.json');
const target = resolve(process.cwd(), 'src/app/data/verified/.generated/google-fonts-runtime.json');
const evidence = JSON.parse(readFileSync(source, 'utf8'));

const runtime = Object.fromEntries(Object.entries(evidence)
  .filter(([name, metadata]) => metadata?.family === name)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, metadata]) => [name, {
    family: metadata.family,
    designer: metadata.designer,
    license: metadata.license,
    subsets: metadata.subsets,
    axes: metadata.axes,
    weights: metadata.weights,
    ...(metadata.repositoryUrl ? { repositoryUrl: metadata.repositoryUrl } : {}),
    metadataPath: metadata.metadataPath,
  }]));

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(runtime)}\n`);

const evidenceBytes = Buffer.byteLength(JSON.stringify(evidence));
const runtimeBytes = Buffer.byteLength(JSON.stringify(runtime));
const reduction = evidenceBytes ? Math.round((1 - runtimeBytes / evidenceBytes) * 100) : 0;
console.log(`Generated compact Google Fonts runtime metadata: ${Object.keys(runtime).length} families, ${runtimeBytes} bytes (${reduction}% smaller than evidence payload).`);
