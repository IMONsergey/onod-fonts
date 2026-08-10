import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockFonts } from '../src/app/data/mockFonts.ts';
import { getEffectiveLanguages, getEffectiveWeights, getFontTrustReport, getVerifiedGoogleFont, isEffectivelyVariable } from '../src/app/lib/fontTrust.ts';

const errors = [];
const warnings = [];
const seenIds = new Set();
const seenNames = new Set();
const allowedCategories = new Set(['sans-serif', 'serif', 'display', 'handwriting', 'monospaced']);
const evidencePath = resolve(process.cwd(), 'src/app/data/verified/google-fonts.json');
const googleEvidence = JSON.parse(readFileSync(evidencePath, 'utf8'));

const isHttpUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

const addError = (font, message) => errors.push(`${font?.id || 'catalog'}: ${message}`);
const addWarning = (font, message) => warnings.push(`${font?.id || 'catalog'}: ${message}`);

if (!Array.isArray(mockFonts)) {
  addError(null, 'mockFonts must export an array.');
} else {
  if (mockFonts.length < 1346) addError(null, `catalog regressed below the recovered 1,346-family baseline (${mockFonts.length}).`);

  for (const font of mockFonts) {
    for (const key of ['id', 'name', 'author', 'source', 'sourceUrl', 'license', 'cssStack']) {
      if (typeof font[key] !== 'string' || !font[key].trim()) addError(font, `missing required string field: ${key}`);
    }

    if (seenIds.has(font.id)) addError(font, `duplicate id: ${font.id}`);
    if (seenNames.has(font.name)) addError(font, `duplicate family name: ${font.name}`);
    seenIds.add(font.id);
    seenNames.add(font.name);

    if (!Array.isArray(font.categories) || font.categories.length === 0) addError(font, 'categories must be a non-empty array.');
    else for (const category of font.categories) if (!allowedCategories.has(category)) addWarning(font, `unrecognized category: ${category}`);

    if (!Array.isArray(font.languages) || font.languages.length === 0) addError(font, 'languages must be a non-empty array.');
    if (!Array.isArray(font.weights) || font.weights.length === 0) addError(font, 'weights must be a non-empty array.');
    else {
      const numericWeights = font.weights.map(value => Number(value));
      if (numericWeights.some(value => !Number.isFinite(value) || value < 1 || value > 1000)) addError(font, `invalid weight list: ${font.weights.join(', ')}`);
      if (new Set(font.weights).size !== font.weights.length) addError(font, 'weight list contains duplicates.');
      for (let i = 1; i < numericWeights.length; i += 1) if (numericWeights[i] < numericWeights[i - 1]) addWarning(font, 'weights are not sorted ascending.');
    }

    if (!isHttpUrl(font.sourceUrl)) addError(font, `invalid sourceUrl: ${font.sourceUrl}`);
    if (font.customCssUrl && !isHttpUrl(font.customCssUrl)) addError(font, `invalid customCssUrl: ${font.customCssUrl}`);
    if (font.downloadUrl && !isHttpUrl(font.downloadUrl)) addError(font, `invalid downloadUrl: ${font.downloadUrl}`);

    const trust = getFontTrustReport(font);
    const effectiveWeights = getEffectiveWeights(font);
    const effectiveLanguages = getEffectiveLanguages(font);
    const runtimeUpstream = getVerifiedGoogleFont(font);

    if (trust.confidence === 'derived') {
      addWarning(font, 'metadata is generated/derived and requires upstream verification.');
      if (effectiveWeights.length !== 1 || effectiveWeights[0] !== '400') addError(font, 'derived metadata must be constrained to conservative weight 400 at runtime.');
      if (isEffectivelyVariable(font)) addError(font, 'derived metadata must not expose variable axes as verified.');
    }

    if (trust.licenseLabel === 'Verify at source') addWarning(font, 'generic license label requires exact upstream license enrichment.');
    if (effectiveLanguages.length === 0) addError(font, 'effective language list must not be empty.');

    if (runtimeUpstream) {
      if (runtimeUpstream.family !== font.name) addError(font, 'runtime upstream family name does not match catalog name.');
      if (!runtimeUpstream.license || runtimeUpstream.license === 'Open Source') addError(font, 'runtime upstream metadata must contain an exact license identifier.');
      if (!/^(ofl|apache|ufl)\/.+\/METADATA\.pb$/.test(runtimeUpstream.metadataPath)) addError(font, `invalid runtime upstream metadata path: ${runtimeUpstream.metadataPath}`);
      if (runtimeUpstream.repositoryUrl && !isHttpUrl(runtimeUpstream.repositoryUrl)) addError(font, `invalid runtime upstream repository URL: ${runtimeUpstream.repositoryUrl}`);
    }
  }
}

const catalogNames = new Set(mockFonts.map(font => font.name));
let validEvidenceRecords = 0;
for (const [name, evidence] of Object.entries(googleEvidence)) {
  if (!evidence || typeof evidence !== 'object') {
    errors.push(`evidence:${name}: record must be an object.`);
    continue;
  }
  if (evidence.family !== name) errors.push(`evidence:${name}: family must exactly match evidence key.`);
  if (!catalogNames.has(name)) warnings.push(`evidence:${name}: verified family is not present in the current catalog.`);
  if (!evidence.license || evidence.license === 'Open Source') errors.push(`evidence:${name}: exact upstream license is required.`);
  if (!/^(ofl|apache|ufl)\/.+\/METADATA\.pb$/.test(evidence.metadataPath || '')) errors.push(`evidence:${name}: invalid metadata path: ${evidence.metadataPath}`);
  if (!/^[0-9a-f]{40}$/i.test(evidence.metadataSha || '')) errors.push(`evidence:${name}: invalid metadata blob SHA: ${evidence.metadataSha}`);
  if (evidence.repositoryUrl && !isHttpUrl(evidence.repositoryUrl)) errors.push(`evidence:${name}: invalid repository URL: ${evidence.repositoryUrl}`);
  if (!Array.isArray(evidence.subsets)) errors.push(`evidence:${name}: subsets must be an array.`);
  if (!Array.isArray(evidence.weights)) errors.push(`evidence:${name}: weights must be an array.`);
  if (!evidence.axes || typeof evidence.axes !== 'object' || Array.isArray(evidence.axes)) errors.push(`evidence:${name}: axes must be an object.`);
  validEvidenceRecords += 1;
}

const findByName = name => mockFonts.find(font => font.name === name);
for (const [name, script] of [['Noto Sans JP', 'Japanese'], ['Noto Serif JP', 'Japanese'], ['Noto Sans KR', 'Korean'], ['Noto Serif KR', 'Korean'], ['Noto Sans TC', 'Chinese'], ['Noto Serif TC', 'Chinese']]) {
  const font = findByName(name);
  if (font && !getEffectiveLanguages(font).includes(script)) addError(font, `legacy script repair failed: expected ${script}.`);
}

const derivedWarnings = warnings.filter(item => item.includes('generated/derived')).length;
const genericLicenseWarnings = warnings.filter(item => item.includes('generic license')).length;
const verifiedVariable = mockFonts.filter(isEffectivelyVariable).length;
const runtimeVerified = mockFonts.filter(font => getFontTrustReport(font).upstreamVerified).length;

console.log(`Catalog validation: ${mockFonts.length} families, ${seenIds.size} unique ids, ${seenNames.size} unique names.`);
console.log(`Canonical evidence: ${validEvidenceRecords} Google Fonts METADATA.pb records with path/SHA provenance.`);
console.log(`Runtime verification: ${runtimeVerified} catalog families backed by compact generated metadata.`);
console.log(`Runtime trust policy: ${verifiedVariable} verified variable families; remaining derived records are constrained to Regular 400.`);
console.log(`Trust debt: ${derivedWarnings} derived metadata records, ${genericLicenseWarnings} generic license labels.`);

if (warnings.length) {
  console.warn(`Warnings: ${warnings.length}`);
  warnings.slice(0, 25).forEach(item => console.warn(`  WARN ${item}`));
  if (warnings.length > 25) console.warn(`  ... ${warnings.length - 25} more warnings omitted`);
}

if (errors.length) {
  console.error(`Errors: ${errors.length}`);
  errors.slice(0, 100).forEach(item => console.error(`  ERROR ${item}`));
  if (errors.length > 100) console.error(`  ... ${errors.length - 100} more errors omitted`);
  process.exit(1);
}

console.log('Catalog structural, evidence and runtime trust-policy validation passed.');
