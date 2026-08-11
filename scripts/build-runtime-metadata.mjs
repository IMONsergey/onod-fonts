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

const independentRepoSource = resolve(process.cwd(), 'src/app/data/verified/independent-sources.json');
const independentWebSource = resolve(process.cwd(), 'src/app/data/verified/independent-web-sources.json');
const independentTarget = resolve(generatedDir, 'independent-runtime.json');
const independentRepoEvidence = JSON.parse(readFileSync(independentRepoSource, 'utf8'));
const independentWebEvidence = JSON.parse(readFileSync(independentWebSource, 'utf8'));
const independentCollisions = Object.keys(independentWebEvidence).filter(name => Object.prototype.hasOwnProperty.call(independentRepoEvidence, name));
if (independentCollisions.length) throw new Error(`Independent evidence identity collision: ${independentCollisions.join(', ')}`);
const independentEvidence = { ...independentRepoEvidence, ...independentWebEvidence };

const artifactSource = resolve(process.cwd(), 'src/app/data/verified/artifacts/open-fonts.json');
const artifactEvidence = JSON.parse(readFileSync(artifactSource, 'utf8'));

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
      ...(metadata.identity.publisher ? { publisher: metadata.identity.publisher } : {}),
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

const intersects = (ranges, start, end) => (ranges || []).some(range => Array.isArray(range) && Number(range[0]) <= end && Number(range[1]) >= start);
const inferScriptsFromCmap = ranges => {
  const definitions = [
    ['Latin', [[0x0041, 0x024f], [0x1e00, 0x1eff]]],
    ['Greek', [[0x0370, 0x03ff], [0x1f00, 0x1fff]]],
    ['Cyrillic', [[0x0400, 0x052f], [0x2de0, 0x2dff], [0xa640, 0xa69f]]],
    ['Armenian', [[0x0530, 0x058f]]],
    ['Hebrew', [[0x0590, 0x05ff]]],
    ['Arabic', [[0x0600, 0x06ff], [0x0750, 0x077f], [0x08a0, 0x08ff]]],
    ['Devanagari', [[0x0900, 0x097f]]],
    ['Bengali', [[0x0980, 0x09ff]]],
    ['Gurmukhi', [[0x0a00, 0x0a7f]]],
    ['Gujarati', [[0x0a80, 0x0aff]]],
    ['Odia', [[0x0b00, 0x0b7f]]],
    ['Tamil', [[0x0b80, 0x0bff]]],
    ['Telugu', [[0x0c00, 0x0c7f]]],
    ['Kannada', [[0x0c80, 0x0cff]]],
    ['Malayalam', [[0x0d00, 0x0d7f]]],
    ['Sinhala', [[0x0d80, 0x0dff]]],
    ['Thai', [[0x0e00, 0x0e7f]]],
    ['Lao', [[0x0e80, 0x0eff]]],
    ['Tibetan', [[0x0f00, 0x0fff]]],
    ['Myanmar', [[0x1000, 0x109f]]],
    ['Georgian', [[0x10a0, 0x10ff]]],
    ['Khmer', [[0x1780, 0x17ff]]],
    ['Japanese', [[0x3040, 0x30ff]]],
    ['Chinese', [[0x3400, 0x4dbf], [0x4e00, 0x9fff]]],
    ['Korean', [[0xac00, 0xd7af]]],
  ];
  return definitions
    .filter(([, blocks]) => blocks.some(([start, end]) => intersects(ranges, start, end)))
    .map(([script]) => script);
};

let artifactUpgraded = 0;
for (const [name, artifact] of Object.entries(artifactEvidence)) {
  const runtime = independentRuntime[name];
  if (!runtime) continue;

  const artifactAxes = Object.fromEntries((artifact.fvar?.axes || [])
    .filter(axis => typeof axis?.tag === 'string' && axis.tag.length === 4)
    .filter(axis => [axis.min, axis.default, axis.max].every(value => Number.isFinite(Number(value))))
    .map(axis => [axis.tag, { min: Number(axis.min), default: Number(axis.default), max: Number(axis.max) }]));
  const weightAxis = artifactAxes.wght;
  const scripts = inferScriptsFromCmap(artifact.cmap?.ranges);

  runtime.technical = {
    ...runtime.technical,
    ...(Object.keys(artifactAxes).length ? { axes: artifactAxes, variable: true } : {}),
    ...(weightAxis ? { weightsVerified: true } : {}),
    ...(Object.keys(artifactAxes).length ? { variableVerified: true } : {}),
    ...(scripts.length ? { scripts, scriptsVerified: true } : {}),
  };
  artifactUpgraded += 1;
}

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
console.log(`Generated compact independent-source runtime metadata: ${Object.keys(independentRuntime).length} identities / ${independentLicenseVerified} verified licenses; ${artifactUpgraded} identities upgraded by inspected binaries, ${independentStat.runtimeBytes} bytes (${independentStat.reduction}% smaller than evidence payload).`);
