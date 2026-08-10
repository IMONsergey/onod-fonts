import { mockFonts } from '../src/app/data/mockFonts.ts';
import { getEffectiveLanguages, getEffectiveWeights, getFontTrustReport, isEffectivelyVariable } from '../src/app/lib/fontTrust.ts';

const errors = [];
const warnings = [];
const seenIds = new Set();
const seenNames = new Set();
const allowedCategories = new Set(['sans-serif', 'serif', 'display', 'handwriting', 'monospaced']);

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

    if (trust.confidence === 'derived') {
      addWarning(font, 'metadata is generated/derived and requires upstream verification.');
      if (effectiveWeights.length !== 1 || effectiveWeights[0] !== '400') addError(font, 'derived metadata must be constrained to conservative weight 400 at runtime.');
      if (isEffectivelyVariable(font)) addError(font, 'derived metadata must not expose variable axes as verified.');
    }

    if (font.license === 'Open Source') addWarning(font, 'generic license label requires exact upstream license enrichment.');
    if (effectiveLanguages.length === 0) addError(font, 'effective language list must not be empty.');
  }
}

const findByName = name => mockFonts.find(font => font.name === name);
for (const [name, script] of [['Noto Sans JP', 'Japanese'], ['Noto Serif JP', 'Japanese'], ['Noto Sans KR', 'Korean'], ['Noto Serif KR', 'Korean'], ['Noto Sans TC', 'Chinese'], ['Noto Serif TC', 'Chinese']]) {
  const font = findByName(name);
  if (font && !getEffectiveLanguages(font).includes(script)) addError(font, `legacy script repair failed: expected ${script}.`);
}

const derivedWarnings = warnings.filter(item => item.includes('generated/derived')).length;
const genericLicenseWarnings = warnings.filter(item => item.includes('generic license')).length;
const verifiedVariable = mockFonts.filter(isEffectivelyVariable).length;

console.log(`Catalog validation: ${mockFonts.length} families, ${seenIds.size} unique ids, ${seenNames.size} unique names.`);
console.log(`Runtime trust policy: ${verifiedVariable} verified variable families; derived records are constrained to Regular 400.`);
console.log(`Trust debt: ${derivedWarnings} derived metadata records, ${genericLicenseWarnings} generic license labels.`);

if (warnings.length) {
  console.warn(`Warnings: ${warnings.length}`);
  warnings.slice(0, 25).forEach(item => console.warn(`  WARN ${item}`));
  if (warnings.length > 25) console.warn(`  ... ${warnings.length - 25} more warnings omitted`);
}

if (errors.length) {
  console.error(`Errors: ${errors.length}`);
  errors.forEach(item => console.error(`  ERROR ${item}`));
  process.exit(1);
}

console.log('Catalog structural and trust-policy validation passed.');
