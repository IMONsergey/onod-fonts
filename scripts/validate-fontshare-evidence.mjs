import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockFonts } from '../src/app/data/mockFonts.ts';

const MIN_BOOTSTRAP_EVIDENCE = 40;
const evidence = JSON.parse(readFileSync(resolve(process.cwd(), 'src/app/data/verified/fontshare.json'), 'utf8'));
const aliases = JSON.parse(readFileSync(resolve(process.cwd(), 'src/app/data/verified/fontshare-aliases.json'), 'utf8'));
const requireCoverage = process.argv.includes('--require-coverage');
const errors = [];
const warnings = [];
const fontshareFonts = mockFonts.filter(font => font.source === 'Fontshare');
const catalogByName = new Map(fontshareFonts.map(font => [font.name, font]));
const upstreamIds = new Set();

const isHttpUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

for (const [catalogName, upstreamName] of Object.entries(aliases)) {
  if (!catalogByName.has(catalogName)) errors.push(`alias:${catalogName}: catalog family does not exist in Fontshare source set.`);
  if (typeof upstreamName !== 'string' || !upstreamName.trim()) errors.push(`alias:${catalogName}: upstream family must be a non-empty string.`);
  if (catalogName === upstreamName) errors.push(`alias:${catalogName}: exact identities must not be stored as aliases.`);
}

for (const [catalogName, record] of Object.entries(evidence)) {
  if (!catalogByName.has(catalogName)) warnings.push(`evidence:${catalogName}: family is not currently in the Fontshare catalog subset.`);
  if (!record || typeof record !== 'object') {
    errors.push(`evidence:${catalogName}: record must be an object.`);
    continue;
  }

  const reviewedIdentity = record.family === catalogName || aliases[catalogName] === record.family;
  if (!reviewedIdentity) errors.push(`evidence:${catalogName}: upstream family '${record.family}' is neither exact nor a reviewed alias.`);

  if (typeof record.upstreamId !== 'string' || !record.upstreamId) errors.push(`evidence:${catalogName}: missing upstreamId.`);
  else if (upstreamIds.has(record.upstreamId)) errors.push(`evidence:${catalogName}: duplicate upstreamId ${record.upstreamId}.`);
  else upstreamIds.add(record.upstreamId);

  if (typeof record.slug !== 'string' || !record.slug) errors.push(`evidence:${catalogName}: missing slug.`);
  if (typeof record.licenseType !== 'string' || !record.licenseType) errors.push(`evidence:${catalogName}: missing licenseType.`);
  if (!isHttpUrl(record.sourceUrl) || !record.sourceUrl.startsWith('https://fontshare.com/fonts/')) errors.push(`evidence:${catalogName}: invalid primary source URL ${record.sourceUrl}.`);
  if (!/^[0-9a-f]{64}$/i.test(record.sourceHash || '')) errors.push(`evidence:${catalogName}: invalid SHA-256 sourceHash.`);
  if (!record.capturedAt || Number.isNaN(Date.parse(record.capturedAt))) errors.push(`evidence:${catalogName}: invalid capturedAt timestamp.`);

  if (!Array.isArray(record.designers)) errors.push(`evidence:${catalogName}: designers must be an array.`);
  if (!Array.isArray(record.languages)) errors.push(`evidence:${catalogName}: languages must be an array.`);
  if (!Array.isArray(record.features)) errors.push(`evidence:${catalogName}: features must be an array.`);
  if (!Array.isArray(record.axes)) errors.push(`evidence:${catalogName}: axes must be an array.`);
  else {
    for (const axis of record.axes) {
      if (!axis?.tag) errors.push(`evidence:${catalogName}: axis missing tag.`);
      for (const field of ['min', 'default', 'max']) if (!Number.isFinite(Number(axis?.[field]))) errors.push(`evidence:${catalogName}: axis ${axis?.tag || '?'} has invalid ${field}.`);
      if (Number(axis?.min) > Number(axis?.max)) errors.push(`evidence:${catalogName}: axis ${axis?.tag || '?'} has min > max.`);
    }
  }

  if (!Array.isArray(record.styles) || record.styles.length === 0) errors.push(`evidence:${catalogName}: styles must be a non-empty array.`);
  else {
    const styleIds = new Set();
    for (const style of record.styles) {
      if (!style?.id) errors.push(`evidence:${catalogName}: style missing id.`);
      else if (styleIds.has(style.id)) errors.push(`evidence:${catalogName}: duplicate style id ${style.id}.`);
      else styleIds.add(style.id);

      if (style.providerFileUrl && (!isHttpUrl(style.providerFileUrl) || !style.providerFileUrl.includes('cdn.fontshare.com/'))) {
        errors.push(`evidence:${catalogName}: style ${style.id || '?'} has unexpected providerFileUrl.`);
      }
      if (!style.variable && (!Number.isFinite(Number(style.weight)) || Number(style.weight) < 1 || Number(style.weight) > 1000)) {
        errors.push(`evidence:${catalogName}: static style ${style.id || '?'} has invalid weight ${style.weight}.`);
      }
    }
  }
}

const evidenceCount = Object.keys(evidence).length;
if (requireCoverage && evidenceCount < Math.min(fontshareFonts.length, MIN_BOOTSTRAP_EVIDENCE)) {
  errors.push(`coverage: only ${evidenceCount}/${fontshareFonts.length} Fontshare-tagged catalog families have exact/reviewed current-provider evidence; expected at least ${MIN_BOOTSTRAP_EVIDENCE}.`);
}

const licenseTypes = Object.values(evidence).reduce((counts, record) => {
  const key = record?.licenseType || 'missing';
  counts[key] = (counts[key] || 0) + 1;
  return counts;
}, {});

console.log(`Fontshare evidence validation: ${evidenceCount}/${fontshareFonts.length} recovered Fontshare-tagged families; ${upstreamIds.size} unique current upstream ids.`);
console.log(`Fontshare license_type distribution: ${JSON.stringify(licenseTypes)}.`);
if (fontshareFonts.length > evidenceCount) console.log(`Legacy/unmatched Fontshare-tagged records intentionally remain trust debt: ${fontshareFonts.length - evidenceCount}.`);

if (warnings.length) {
  console.warn(`Warnings: ${warnings.length}`);
  warnings.slice(0, 30).forEach(value => console.warn(`  WARN ${value}`));
}

if (errors.length) {
  console.error(`Errors: ${errors.length}`);
  errors.slice(0, 100).forEach(value => console.error(`  ERROR ${value}`));
  process.exit(1);
}

console.log('Fontshare primary-source evidence validation passed.');
