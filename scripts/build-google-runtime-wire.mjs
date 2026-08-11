import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = process.cwd();
const evidencePath = resolve(root, 'src/app/data/verified/google-fonts.json');
const aliasesPath = resolve(root, 'src/app/data/verified/google-fonts-aliases.json');
const compatibilityTarget = resolve(root, 'src/app/data/verified/.generated/google-fonts-runtime.json');
const wireTarget = resolve(root, 'src/app/data/verified/.generated/google-fonts-wire.json');

const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'));
const aliases = JSON.parse(readFileSync(aliasesPath, 'utf8'));

const isReviewedIdentity = (catalogName, metadata) =>
  metadata?.family === catalogName || aliases[catalogName] === metadata?.family;

const subsetToScript = subset => {
  const normalized = String(subset || '').toLowerCase().replace(/-ext$/, '');
  const map = {
    latin: 'Latin', cyrillic: 'Cyrillic', greek: 'Greek', vietnamese: 'Vietnamese', arabic: 'Arabic', hebrew: 'Hebrew',
    devanagari: 'Devanagari', bengali: 'Bengali', gurmukhi: 'Gurmukhi', gujarati: 'Gujarati', oriya: 'Odia', odia: 'Odia',
    tamil: 'Tamil', telugu: 'Telugu', kannada: 'Kannada', malayalam: 'Malayalam', thai: 'Thai', lao: 'Lao', khmer: 'Khmer',
    myanmar: 'Myanmar', sinhala: 'Sinhala', tibetan: 'Tibetan', korean: 'Korean', japanese: 'Japanese',
  };
  if (map[normalized]) return map[normalized];
  if (normalized.startsWith('chinese')) return 'Chinese';
  return undefined;
};

const compactScripts = subsets => Array.from(new Set((subsets || []).map(subsetToScript).filter(Boolean))).sort();
const compactAxisObject = axes => Object.fromEntries(Object.entries(axes || {})
  .filter(([tag, axis]) => tag && Number.isFinite(Number(axis?.min)) && Number.isFinite(Number(axis?.max)))
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([tag, axis]) => [tag, { min: Number(axis.min), max: Number(axis.max) }]));
const compactAxes = axes => Object.entries(compactAxisObject(axes)).map(([tag, axis]) => [tag, axis.min, axis.max]);

const reviewed = Object.entries(evidence)
  .filter(([name, metadata]) => isReviewedIdentity(name, metadata))
  .sort(([a], [b]) => a.localeCompare(b));

// Compatibility runtime keeps the public shape consumed by fontTrust while
// removing browser-irrelevant repetition. Exact path provenance remains because
// the runtime-vs-canonical validator treats it as part of the trust contract.
const compatibilityRuntime = Object.fromEntries(reviewed.map(([name, metadata]) => [name, {
  family: name,
  ...(metadata.family !== name ? { upstreamFamily: metadata.family } : {}),
  designer: metadata.designer,
  license: metadata.license,
  subsets: compactScripts(metadata.subsets),
  axes: compactAxisObject(metadata.axes),
  weights: Array.from(new Set((metadata.weights || []).map(Number).filter(Number.isFinite))).sort((a, b) => a - b),
  ...(metadata.repositoryUrl ? { repositoryUrl: metadata.repositoryUrl } : {}),
  metadataPath: metadata.metadataPath,
}]));

// Short-key wire is generated alongside compatibility data as the next
// migration target and as a measurable upper bound on further data compaction.
const wire = Object.fromEntries(reviewed.map(([name, metadata]) => [name, {
  d: metadata.designer,
  l: metadata.license,
  s: compactScripts(metadata.subsets),
  w: Array.from(new Set((metadata.weights || []).map(Number).filter(Number.isFinite))).sort((a, b) => a - b),
  ...(compactAxes(metadata.axes).length ? { a: compactAxes(metadata.axes) } : {}),
  ...(metadata.repositoryUrl ? { r: metadata.repositoryUrl } : {}),
  ...(metadata.family !== name ? { u: metadata.family } : {}),
}]));

mkdirSync(dirname(compatibilityTarget), { recursive: true });
writeFileSync(compatibilityTarget, `${JSON.stringify(compatibilityRuntime)}\n`);
writeFileSync(wireTarget, `${JSON.stringify(wire)}\n`);

const originalVerboseBytes = Buffer.byteLength(JSON.stringify(Object.fromEntries(reviewed.map(([name, metadata]) => [name, {
  family: name,
  ...(metadata.family !== name ? { upstreamFamily: metadata.family } : {}),
  designer: metadata.designer,
  license: metadata.license,
  subsets: metadata.subsets,
  axes: metadata.axes,
  weights: metadata.weights,
  ...(metadata.repositoryUrl ? { repositoryUrl: metadata.repositoryUrl } : {}),
  metadataPath: metadata.metadataPath,
}]))));
const compatibilityBytes = Buffer.byteLength(JSON.stringify(compatibilityRuntime));
const wireBytes = Buffer.byteLength(JSON.stringify(wire));
const compatibilityReduction = originalVerboseBytes ? Math.round((1 - compatibilityBytes / originalVerboseBytes) * 100) : 0;
const wireReduction = originalVerboseBytes ? Math.round((1 - wireBytes / originalVerboseBytes) * 100) : 0;

console.log(`Generated compatible Google runtime: ${Object.keys(compatibilityRuntime).length} families, ${compatibilityBytes} bytes (${compatibilityReduction}% smaller than previous verbose browser runtime).`);
console.log(`Generated Google runtime wire target: ${Object.keys(wire).length} families, ${wireBytes} bytes (${wireReduction}% smaller than previous verbose browser runtime).`);
