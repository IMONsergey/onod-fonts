import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = process.cwd();
const evidencePath = resolve(root, 'src/app/data/verified/google-fonts.json');
const aliasesPath = resolve(root, 'src/app/data/verified/google-fonts-aliases.json');
const compatibilityTarget = resolve(root, 'src/app/data/verified/.generated/google-fonts-runtime.json');
const wireTarget = resolve(root, 'src/app/data/verified/.generated/google-fonts-wire.json');
const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'));
const aliases = JSON.parse(readFileSync(aliasesPath, 'utf8'));

const isReviewedIdentity = (catalogName, metadata) => metadata?.family === catalogName || aliases[catalogName] === metadata?.family;
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
const reviewed = Object.entries(evidence).filter(([name, metadata]) => isReviewedIdentity(name, metadata)).sort(([a], [b]) => a.localeCompare(b));

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

const verboseBytes = Buffer.byteLength(JSON.stringify(Object.fromEntries(reviewed.map(([name, metadata]) => [name, {
  family: name, designer: metadata.designer, license: metadata.license, subsets: metadata.subsets, axes: metadata.axes,
  weights: metadata.weights, ...(metadata.repositoryUrl ? { repositoryUrl: metadata.repositoryUrl } : {}), metadataPath: metadata.metadataPath,
}]))));
const compatibilityBytes = Buffer.byteLength(JSON.stringify(compatibilityRuntime));
const wireBytes = Buffer.byteLength(JSON.stringify(wire));
const reduction = (bytes) => verboseBytes ? Math.round((1 - bytes / verboseBytes) * 100) : 0;
console.log(`Generated compatible Google runtime: ${Object.keys(compatibilityRuntime).length} families, ${compatibilityBytes} bytes (${reduction(compatibilityBytes)}% smaller than verbose browser runtime).`);
console.log(`Generated Google wire target: ${Object.keys(wire).length} families, ${wireBytes} bytes (${reduction(wireBytes)}% smaller than verbose browser runtime).`);
