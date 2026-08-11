import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sources = JSON.parse(readFileSync(resolve(process.cwd(), 'src/app/data/verified/independent-sources.json'), 'utf8'));
const artifacts = JSON.parse(readFileSync(resolve(process.cwd(), 'src/app/data/verified/artifacts/open-fonts.json'), 'utf8'));
const errors = [];

const isSha1 = value => /^[0-9a-f]{40}$/i.test(value || '');
const isSha256 = value => /^[0-9a-f]{64}$/i.test(value || '');

const eligible = new Set(Object.entries(sources)
  .filter(([, record]) => record?.identity?.status === 'verified')
  .filter(([, record]) => record?.identity?.sourceType === 'official-github')
  .filter(([, record]) => record?.license?.status === 'verified' && record?.license?.id === 'OFL-1.1')
  .map(([name]) => name));

for (const [family, record] of Object.entries(artifacts)) {
  const source = sources[family];
  if (!eligible.has(family)) errors.push(`${family}: artifact evidence exists without a verified OFL-1.1 official-GitHub source policy.`);
  if (!source) continue;

  if (record.family !== family) errors.push(`${family}: artifact family must match evidence key.`);
  if (record.repository !== source.identity.repository) errors.push(`${family}: artifact repository '${record.repository}' does not match reviewed source '${source.identity.repository}'.`);
  if (record.ref !== source.identity.evidence.ref) errors.push(`${family}: artifact ref '${record.ref}' does not match reviewed identity ref '${source.identity.evidence.ref}'.`);
  if (record.licenseId !== source.license.id) errors.push(`${family}: artifact license id '${record.licenseId}' does not match reviewed source license '${source.license.id}'.`);
  if (!isSha1(record.gitBlobSha)) errors.push(`${family}: gitBlobSha must be a Git blob SHA.`);
  if (!isSha256(record.sha256)) errors.push(`${family}: sha256 must be a SHA-256 digest.`);
  if (!record.capturedAt || Number.isNaN(Date.parse(record.capturedAt))) errors.push(`${family}: capturedAt is invalid.`);

  try {
    const url = new URL(record.sourceUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'raw.githubusercontent.com') errors.push(`${family}: sourceUrl must be raw.githubusercontent.com HTTPS.`);
  } catch {
    errors.push(`${family}: sourceUrl is invalid.`);
  }

  if (typeof record.path !== 'string' || !/\.(ttf|otf)$/i.test(record.path)) errors.push(`${family}: inspected artifact path must be TTF/OTF.`);
  if (!Number.isInteger(record.size) || record.size <= 0) errors.push(`${family}: artifact size must be positive integer.`);
  if (!['ttf-sfnt', 'otf-cff'].includes(record.sfntFormat)) errors.push(`${family}: unsupported sfntFormat '${record.sfntFormat}'.`);

  if (!Array.isArray(record.tables) || record.tables.length === 0) errors.push(`${family}: table directory is missing.`);
  else {
    const tags = record.tables.map(table => table.tag);
    if (new Set(tags).size !== tags.length) errors.push(`${family}: duplicate SFNT table tags.`);
    for (const required of ['cmap', 'head', 'hhea', 'maxp', 'name']) if (!tags.includes(required)) errors.push(`${family}: required SFNT table '${required}' missing.`);
  }

  if (!record.name?.family && !record.name?.typographicFamily) errors.push(`${family}: no family identity found in name table.`);
  if (!Number.isFinite(Number(record.head?.unitsPerEm)) || Number(record.head.unitsPerEm) <= 0) errors.push(`${family}: invalid head.unitsPerEm.`);
  if (!Number.isInteger(record.maxp?.numGlyphs) || record.maxp.numGlyphs <= 0) errors.push(`${family}: invalid maxp.numGlyphs.`);
  if (!Number.isInteger(record.cmap?.codepointCount) || record.cmap.codepointCount <= 0) errors.push(`${family}: cmap codepoint coverage is empty.`);
  if (!Array.isArray(record.cmap?.ranges)) errors.push(`${family}: cmap ranges missing.`);

  if (record.fvar?.axes) {
    for (const axis of record.fvar.axes) {
      if (!/^[\x20-\x7e]{4}$/.test(axis.tag || '')) errors.push(`${family}: invalid fvar axis tag '${axis.tag}'.`);
      if (![axis.min, axis.default, axis.max].every(value => Number.isFinite(Number(value)))) errors.push(`${family}: fvar axis '${axis.tag}' contains non-numeric range.`);
      if (Number(axis.min) > Number(axis.default) || Number(axis.default) > Number(axis.max)) errors.push(`${family}: fvar axis '${axis.tag}' has invalid min/default/max ordering.`);
    }
  }

  for (const table of ['gsub', 'gpos']) {
    if (!Array.isArray(record.openTypeFeatures?.[table])) errors.push(`${family}: ${table.toUpperCase()} feature list must be an array.`);
    else if (record.openTypeFeatures[table].some(tag => typeof tag !== 'string' || tag.length !== 4)) errors.push(`${family}: invalid ${table.toUpperCase()} feature tag.`);
  }
}

const inspected = Object.keys(artifacts).length;
console.log(`Open artifact evidence validation: eligible=${eligible.size}; inspected=${inspected}.`);
if (errors.length) {
  console.error(`Errors: ${errors.length}`);
  errors.forEach(error => console.error(`  ERROR ${error}`));
  process.exit(1);
}
console.log('Hash-addressed open font artifact evidence validation passed.');
