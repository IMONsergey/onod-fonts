import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sources = JSON.parse(readFileSync(resolve(process.cwd(), 'src/app/data/verified/independent-sources.json'), 'utf8'));
const artifacts = JSON.parse(readFileSync(resolve(process.cwd(), 'src/app/data/verified/artifacts/open-fonts.json'), 'utf8'));
const reviewedAliases = JSON.parse(readFileSync(resolve(process.cwd(), 'src/app/data/verified/artifacts/family-aliases.json'), 'utf8'));
const errors = [];

const canonical = value => String(value || '')
  .normalize('NFKD')
  .replace(/\p{Diacritic}/gu, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

const isSha1 = value => /^[0-9a-f]{40}$/i.test(value || '');
const isSha256 = value => /^[0-9a-f]{64}$/i.test(value || '');

const eligible = new Set(Object.entries(sources)
  .filter(([, record]) => record?.identity?.status === 'verified')
  .filter(([, record]) => record?.identity?.sourceType === 'official-github')
  .filter(([, record]) => record?.license?.status === 'verified' && record?.license?.id === 'OFL-1.1')
  .map(([name]) => name));

const aliasUsage = new Set();
for (const [family, aliases] of Object.entries(reviewedAliases)) {
  if (!eligible.has(family)) errors.push(`alias:${family}: reviewed artifact alias exists for a family that is not eligible for OFL artifact inspection.`);
  if (!Array.isArray(aliases) || aliases.length === 0) {
    errors.push(`alias:${family}: aliases must be a non-empty array.`);
    continue;
  }
  const seen = new Set();
  for (const alias of aliases) {
    if (typeof alias !== 'string' || !alias.trim()) errors.push(`alias:${family}: alias must be a non-empty string.`);
    if (canonical(alias) === canonical(family)) errors.push(`alias:${family}: '${alias}' is redundant with the catalog family.`);
    const key = canonical(alias);
    if (seen.has(key)) errors.push(`alias:${family}: duplicate alias '${alias}'.`);
    seen.add(key);
  }
}

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

  const internalNames = [record.name?.typographicFamily, record.name?.family].filter(Boolean);
  const accepted = [family, ...(reviewedAliases[family] || [])];
  const acceptedByCanonical = new Map(accepted.map(value => [canonical(value), value]));
  if (internalNames.length === 0) errors.push(`${family}: no family identity found in name table.`);
  else {
    const matchedName = internalNames.find(name => acceptedByCanonical.has(canonical(name)));
    if (!matchedName) {
      errors.push(`${family}: selected binary identifies as [${internalNames.join(' / ')}], not the catalog family or a reviewed artifact alias.`);
    } else if (canonical(matchedName) !== canonical(family)) {
      aliasUsage.add(`${family}:${canonical(matchedName)}`);
    }
  }

  if (!Number.isFinite(Number(record.head?.unitsPerEm)) || Number(record.head.unitsPerEm) <= 0) errors.push(`${family}: invalid head.unitsPerEm.`);
  if (!Number.isInteger(record.maxp?.numGlyphs) || record.maxp.numGlyphs <= 0) errors.push(`${family}: invalid maxp.numGlyphs.`);
  if (!Number.isInteger(record.cmap?.codepointCount) || record.cmap.codepointCount <= 0) errors.push(`${family}: cmap codepoint coverage is empty.`);

  const tags = Array.isArray(record.tables) ? record.tables.map(table => table.tag) : [];
  for (const required of ['cmap', 'head', 'hhea', 'maxp', 'name']) if (!tags.includes(required)) errors.push(`${family}: required SFNT table '${required}' missing.`);

  if (record.fvar?.axes) {
    for (const axis of record.fvar.axes) {
      if (!/^[\x20-\x7e]{4}$/.test(axis.tag || '')) errors.push(`${family}: invalid fvar axis tag '${axis.tag}'.`);
      if (![axis.min, axis.default, axis.max].every(value => Number.isFinite(Number(value)))) errors.push(`${family}: fvar axis '${axis.tag}' contains non-numeric range.`);
      if (Number(axis.min) > Number(axis.default) || Number(axis.default) > Number(axis.max)) errors.push(`${family}: fvar axis '${axis.tag}' has invalid min/default/max ordering.`);
    }
  }
}

for (const [family, aliases] of Object.entries(reviewedAliases)) {
  for (const alias of aliases) {
    if (!aliasUsage.has(`${family}:${canonical(alias)}`)) errors.push(`alias:${family}: reviewed alias '${alias}' does not match the currently selected artifact identity.`);
  }
}

console.log(`Strict artifact validation: eligible=${eligible.size}; inspected=${Object.keys(artifacts).length}; reviewed aliases=${Object.values(reviewedAliases).reduce((sum, values) => sum + values.length, 0)}.`);
if (errors.length) {
  console.error(`Errors: ${errors.length}`);
  errors.forEach(error => console.error(`  ERROR ${error}`));
  process.exit(1);
}
console.log('Artifact-internal identity and SFNT integrity validation passed.');
