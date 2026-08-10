import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const generatedDir = resolve(process.cwd(), 'src/app/data/verified/.generated');

const googleSource = resolve(process.cwd(), 'src/app/data/verified/google-fonts.json');
const googleAliasesSource = resolve(process.cwd(), 'src/app/data/verified/google-fonts-aliases.json');
const googleTarget = resolve(generatedDir, 'google-fonts-runtime.json');
const googleEvidence = JSON.parse(readFileSync(googleSource, 'utf8'));
const googleAliases = JSON.parse(readFileSync(googleAliasesSource, 'utf8'));

const fontshareSource = resolve(process.cwd(), 'src/app/data/verified/fontshare.json');
const fontshareAliasesSource = resolve(process.cwd(), 'src/app/data/verified/fontshare-aliases.json');
const fontshareTarget = resolve(generatedDir, 'fontshare-runtime.json');
const fontshareEvidence = JSON.parse(readFileSync(fontshareSource, 'utf8'));
const fontshareAliases = JSON.parse(readFileSync(fontshareAliasesSource, 'utf8'));

const isReviewedIdentity = (catalogName, metadata, aliases) =>
  metadata?.family === catalogName || aliases[catalogName] === metadata?.family;

const googleRuntime = Object.fromEntries(Object.entries(googleEvidence)
  .filter(([name, metadata]) => isReviewedIdentity(name, metadata, googleAliases))
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, metadata]) => [name, {
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

const styleWeights = styles => Array.from(new Set((styles || [])
  .filter(style => !style.variable)
  .map(style => Number(style.weight))
  .filter(weight => Number.isFinite(weight) && weight >= 1 && weight <= 1000)))
  .sort((a, b) => a - b);

const axisMap = axes => Object.fromEntries((axes || [])
  .filter(axis => axis?.tag && Number.isFinite(Number(axis.min)) && Number.isFinite(Number(axis.max)))
  .map(axis => [axis.tag, {
    min: Number(axis.min),
    ...(Number.isFinite(Number(axis.default)) ? { default: Number(axis.default) } : {}),
    max: Number(axis.max),
  }]));

const verifiedDesigner = metadata => {
  if (metadata.displayPublisherAsDesigner && metadata.publisher?.name) return metadata.publisher.name;
  const names = (metadata.designers || []).map(designer => designer?.name).filter(Boolean);
  if (names.length) return names.join(', ');
  return metadata.publisher?.name || '';
};

const fontshareRuntime = Object.fromEntries(Object.entries(fontshareEvidence)
  .filter(([name, metadata]) => isReviewedIdentity(name, metadata, fontshareAliases))
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, metadata]) => [name, {
    family: name,
    ...(metadata.family !== name ? { upstreamFamily: metadata.family } : {}),
    upstreamId: metadata.upstreamId,
    slug: metadata.slug,
    licenseType: metadata.licenseType,
    designer: verifiedDesigner(metadata),
    publisher: metadata.publisher?.name || undefined,
    script: metadata.script || undefined,
    axes: axisMap(metadata.axes),
    weights: styleWeights(metadata.styles),
    variable: (metadata.styles || []).some(style => Boolean(style.variable)) || (metadata.axes || []).length > 0,
    sourceUrl: metadata.sourceUrl,
  }]));

mkdirSync(generatedDir, { recursive: true });
writeFileSync(googleTarget, `${JSON.stringify(googleRuntime)}\n`);
writeFileSync(fontshareTarget, `${JSON.stringify(fontshareRuntime)}\n`);

const googleEvidenceBytes = Buffer.byteLength(JSON.stringify(googleEvidence));
const googleRuntimeBytes = Buffer.byteLength(JSON.stringify(googleRuntime));
const googleReduction = googleEvidenceBytes ? Math.round((1 - googleRuntimeBytes / googleEvidenceBytes) * 100) : 0;
const googleAliasCount = Object.keys(googleAliases).filter(name => googleEvidence[name]?.family === googleAliases[name]).length;

const fontshareEvidenceBytes = Buffer.byteLength(JSON.stringify(fontshareEvidence));
const fontshareRuntimeBytes = Buffer.byteLength(JSON.stringify(fontshareRuntime));
const fontshareReduction = fontshareEvidenceBytes ? Math.round((1 - fontshareRuntimeBytes / fontshareEvidenceBytes) * 100) : 0;
const fontshareAliasCount = Object.keys(fontshareAliases).filter(name => fontshareEvidence[name]?.family === fontshareAliases[name]).length;

console.log(`Generated compact Google Fonts runtime metadata: ${Object.keys(googleRuntime).length} families (${googleAliasCount} reviewed aliases), ${googleRuntimeBytes} bytes (${googleReduction}% smaller than evidence payload).`);
console.log(`Generated compact Fontshare runtime metadata: ${Object.keys(fontshareRuntime).length} families (${fontshareAliasCount} reviewed aliases), ${fontshareRuntimeBytes} bytes (${fontshareReduction}% smaller than evidence payload).`);
