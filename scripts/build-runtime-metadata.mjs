import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

const independentSource = resolve(process.cwd(), 'src/app/data/verified/independent-sources.json');
const independentTarget = resolve(generatedDir, 'independent-runtime.json');
const independentEvidence = JSON.parse(readFileSync(independentSource, 'utf8'));

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

const independentRuntime = Object.fromEntries(Object.entries(independentEvidence)
  .filter(([name, metadata]) => metadata?.family === name && metadata?.identity?.status === 'verified')
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, metadata]) => [name, {
    family: name,
    identity: {
      sourceType: metadata.identity.sourceType,
      ...(metadata.identity.repository ? { repository: metadata.identity.repository } : {}),
      sourceUrl: metadata.identity.sourceUrl,
      designer: metadata.identity.designer,
    },
    license: metadata.license?.status === 'verified'
      ? { status: 'verified', id: metadata.license.id }
      : { status: 'pending' },
    technical: {
      ...(metadata.technical?.variable !== undefined ? { variable: Boolean(metadata.technical.variable) } : {}),
      ...(Array.isArray(metadata.technical?.weights) ? { weights: metadata.technical.weights } : {}),
      ...(metadata.technical?.axes ? { axes: metadata.technical.axes } : {}),
      ...(Array.isArray(metadata.technical?.scripts) ? { scripts: metadata.technical.scripts } : {}),
      weightsVerified: Boolean(metadata.technical?.weightsVerified),
      variableVerified: Boolean(metadata.technical?.variableVerified),
      scriptsVerified: Boolean(metadata.technical?.scriptsVerified),
    },
  }]));

mkdirSync(generatedDir, { recursive: true });
writeFileSync(googleTarget, `${JSON.stringify(googleRuntime)}\n`);
writeFileSync(fontshareTarget, `${JSON.stringify(fontshareRuntime)}\n`);
writeFileSync(independentTarget, `${JSON.stringify(independentRuntime)}\n`);

const payloadStat = (evidence, runtime) => {
  const evidenceBytes = Buffer.byteLength(JSON.stringify(evidence));
  const runtimeBytes = Buffer.byteLength(JSON.stringify(runtime));
  const reduction = evidenceBytes ? Math.round((1 - runtimeBytes / evidenceBytes) * 100) : 0;
  return { runtimeBytes, reduction };
};

const googleStat = payloadStat(googleEvidence, googleRuntime);
const fontshareStat = payloadStat(fontshareEvidence, fontshareRuntime);
const independentStat = payloadStat(independentEvidence, independentRuntime);
const googleAliasCount = Object.keys(googleAliases).filter(name => googleEvidence[name]?.family === googleAliases[name]).length;
const fontshareAliasCount = Object.keys(fontshareAliases).filter(name => fontshareEvidence[name]?.family === fontshareAliases[name]).length;
const independentLicenseVerified = Object.values(independentRuntime).filter(record => record.license?.status === 'verified').length;

console.log(`Generated compact Google Fonts runtime metadata: ${Object.keys(googleRuntime).length} families (${googleAliasCount} reviewed aliases), ${googleStat.runtimeBytes} bytes (${googleStat.reduction}% smaller than evidence payload).`);
console.log(`Generated compact Fontshare runtime metadata: ${Object.keys(fontshareRuntime).length} families (${fontshareAliasCount} reviewed aliases), ${fontshareStat.runtimeBytes} bytes (${fontshareStat.reduction}% smaller than evidence payload).`);
console.log(`Generated compact independent-source runtime metadata: ${Object.keys(independentRuntime).length} identities / ${independentLicenseVerified} verified licenses, ${independentStat.runtimeBytes} bytes (${independentStat.reduction}% smaller than evidence payload).`);
