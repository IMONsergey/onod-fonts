import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const evidencePath = resolve(process.cwd(), 'src/app/data/verified/artifacts/historical-fonts.json');
if (!existsSync(evidencePath)) {
  console.error('Historical artifact evidence is missing.');
  process.exit(1);
}

const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'));
const relations = JSON.parse(readFileSync(resolve(process.cwd(), 'src/app/data/verified/family-relations.json'), 'utf8'));
const errors = [];
const sha1 = value => /^[0-9a-f]{40}$/i.test(value || '');
const sha256 = value => /^[0-9a-f]{64}$/i.test(value || '');
const normalize = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g, '');

for (const [family, record] of Object.entries(evidence)) {
  const relation = relations[family];
  if (!relation || relation.status !== 'verified' || !String(relation.relation || '').startsWith('historical-')) errors.push(`${family}: artifact has no verified historical relation.`);
  if (record?.family !== family) errors.push(`${family}: evidence family key mismatch.`);
  if (record?.relation !== relation?.relation) errors.push(`${family}: artifact relation '${record?.relation}' differs from canonical relation '${relation?.relation}'.`);
  if (record?.licenseId !== relation?.historical?.licenseId) errors.push(`${family}: artifact license does not match relation license.`);
  if (typeof record?.repository !== 'string' || !/^[^/]+\/[^/]+$/.test(record.repository)) errors.push(`${family}: invalid repository.`);
  if (!sha1(record?.ref)) errors.push(`${family}: historical artifact ref must resolve to an exact commit SHA.`);
  if (!sha1(record?.gitBlobSha)) errors.push(`${family}: gitBlobSha must be a Git blob SHA.`);
  if (!sha256(record?.sha256)) errors.push(`${family}: sha256 is invalid.`);
  if (!Number.isInteger(record?.size) || record.size < 1000) errors.push(`${family}: artifact size is implausible.`);
  if (typeof record?.path !== 'string' || !/\.(ttf|otf)$/i.test(record.path)) errors.push(`${family}: inspected artifact must be TTF/OTF.`);
  if (typeof record?.sourceUrl !== 'string' || !record.sourceUrl.startsWith('https://raw.githubusercontent.com/')) errors.push(`${family}: artifact sourceUrl must be a pinned raw GitHub URL.`);

  const tables = new Set(Array.isArray(record?.tables) ? record.tables : []);
  for (const tag of ['name', 'cmap', 'head', 'maxp']) if (!tables.has(tag)) errors.push(`${family}: required SFNT table '${tag}' is missing.`);
  if (!Number.isInteger(record?.cmap?.count) || record.cmap.count < 50) errors.push(`${family}: cmap coverage is missing or implausibly small.`);
  if (!Number.isInteger(record?.metrics?.glyphCount) || record.metrics.glyphCount < 50) errors.push(`${family}: glyph count is missing or implausibly small.`);
  if (!Number.isInteger(record?.metrics?.weightClass) || record.metrics.weightClass < 1 || record.metrics.weightClass > 1000) errors.push(`${family}: OS/2 weightClass is invalid.`);

  const internalFamilies = [
    ...(record?.names?.family || []),
    ...(record?.names?.typographicFamily || []),
  ];
  const expected = normalize(family);
  if (!internalFamilies.some(value => normalize(value) === expected)) {
    errors.push(`${family}: internal family names do not prove exact identity; got [${internalFamilies.join(', ')}].`);
  }

  if (!Array.isArray(record?.features?.GSUB) || !Array.isArray(record?.features?.GPOS)) errors.push(`${family}: GSUB/GPOS feature inventory must be arrays.`);
  if (!Array.isArray(record?.axes)) errors.push(`${family}: fvar axes must be an array.`);
}

console.log(`Historical artifact validation: ${Object.keys(evidence).length} exact historical binaries.`);
if (errors.length) {
  console.error(`Errors: ${errors.length}`);
  errors.forEach(error => console.error(`  ERROR ${error}`));
  process.exit(1);
}
console.log('Historical artifact evidence validation passed.');
