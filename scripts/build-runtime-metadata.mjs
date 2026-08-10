import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const source = resolve(process.cwd(), 'src/app/data/verified/google-fonts.json');
const aliasesSource = resolve(process.cwd(), 'src/app/data/verified/google-fonts-aliases.json');
const target = resolve(process.cwd(), 'src/app/data/verified/.generated/google-fonts-runtime.json');
const evidence = JSON.parse(readFileSync(source, 'utf8'));
const aliases = JSON.parse(readFileSync(aliasesSource, 'utf8'));

const isReviewedIdentity = (catalogName, metadata) =>
  metadata?.family === catalogName || aliases[catalogName] === metadata?.family;

const runtime = Object.fromEntries(Object.entries(evidence)
  .filter(([name, metadata]) => isReviewedIdentity(name, metadata))
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, metadata]) => [name, {
    // Runtime identity always uses the catalog family name. The canonical evidence
    // retains the exact upstream family string and the reviewed alias registry
    // records the mapping when they differ.
    family: name,
    ...(metadata.family !== name ? { upstreamFamily: metadata.family } : {}),
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
const aliasCount = Object.keys(aliases).filter(name => evidence[name]?.family === aliases[name]).length;
console.log(`Generated compact Google Fonts runtime metadata: ${Object.keys(runtime).length} families (${aliasCount} reviewed aliases), ${runtimeBytes} bytes (${reduction}% smaller than evidence payload).`);
