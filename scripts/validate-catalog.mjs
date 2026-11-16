import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { hasInteractiveSpecimen, mockFonts } from '../src/app/data/mockFonts.ts';
import { editorialFamilies, orderCatalog } from '../src/app/data/editorialOrder.ts';
import { getEffectiveLanguages, getEffectiveWeights, getFontTrustReport, getVerifiedGoogleFont, isEffectivelyVariable } from '../src/app/lib/fontTrust.ts';

const errors = [];
const warnings = [];
const seenIds = new Set();
const seenNames = new Set();
const allowedCategories = new Set(['sans-serif', 'serif', 'display', 'handwriting', 'monospaced']);
const evidencePath = resolve(process.cwd(), 'src/app/data/verified/google-fonts.json');
const aliasesPath = resolve(process.cwd(), 'src/app/data/verified/google-fonts-aliases.json');
const googleEvidence = JSON.parse(readFileSync(evidencePath, 'utf8'));
const reviewedAliases = JSON.parse(readFileSync(aliasesPath, 'utf8'));

const isHttpUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

const isReviewedEvidenceIdentity = (catalogName, evidence) =>
  evidence?.family === catalogName || reviewedAliases[catalogName] === evidence?.family;

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

    const expanded = font.commercialPackage?.collection === 'expanded';
    if (!Array.isArray(font.languages) || (!expanded && font.languages.length === 0)) addError(font, 'missing script metadata.');
    if (!Array.isArray(font.weights) || (font.weights.length === 0 && !font.commercialPackage?.sourceOnly)) addError(font, 'weights must be a non-empty array.');
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

    if (!trust.identityVerified) addWarning(font, 'source/family identity still requires primary-source verification.');
    if (!trust.licenseVerified) addWarning(font, 'exact license still requires primary-source verification.');

    if (!trust.weightsVerified) {
      if (effectiveWeights.length !== 1 || effectiveWeights[0] !== '400') addError(font, 'unverified weight metadata must be constrained to conservative weight 400 at runtime.');
    } else {
      if (effectiveWeights.length === 0) addError(font, 'verified weights must produce at least one runtime weight.');
    }

    if (!trust.variableVerified && isEffectivelyVariable(font)) addError(font, 'unverified variable capability must not be exposed as verified runtime behavior.');
    if (!trust.scriptsVerified) addWarning(font, 'script/language metadata remains unverified.');
    if (trust.licenseLabel === 'Verify at source') addWarning(font, 'generic license label requires exact upstream license enrichment.');
    if (effectiveLanguages.length === 0) addWarning(font, 'effective language list is empty; script filters must not infer unsupported coverage.');

    if (runtimeUpstream) {
      if (runtimeUpstream.family !== font.name) addError(font, 'runtime upstream family name does not match catalog identity.');
      if (!runtimeUpstream.license || runtimeUpstream.license === 'Open Source') addError(font, 'runtime upstream metadata must contain an exact license identifier.');
      if (!/^(ofl|apache|ufl)\/.+\/METADATA\.pb$/.test(runtimeUpstream.metadataPath)) addError(font, `invalid runtime upstream metadata path: ${runtimeUpstream.metadataPath}`);
      if (runtimeUpstream.repositoryUrl && !isHttpUrl(runtimeUpstream.repositoryUrl)) addError(font, `invalid runtime upstream repository URL: ${runtimeUpstream.repositoryUrl}`);
    }
  }
}

// Packaged families use exact upstream licenses and stable URLs independent of the application build.
const normalizeName = value => value.normalize('NFKD').replace(/\p{Mark}/gu, '').toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, '');
const legacyNames = mockFonts.filter(font => !font.commercialPackage).map(font => font.name);
const normalizedFamilies = new Set([...legacyNames, ...Object.values(reviewedAliases)].map(normalizeName));
const packageKeys = new Set();
for (const font of mockFonts.filter(font => font.commercialPackage)) {
  const { collection, key, licenseUrl, sourceOnly, usage, previewImageUrl, cssFamily, previewFaces } = font.commercialPackage;
  const canonicalName = normalizeName(font.name);
  if (normalizedFamilies.has(canonicalName)) addError(font, 'packaged family duplicates a catalog family or alias.');
  normalizedFamilies.add(canonicalName);
  if (packageKeys.has(key)) addError(font, 'duplicate immutable package key.');
  packageKeys.add(key);
  if (collection === 'expanded') {
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(key) || !/^[a-z0-9][a-z0-9_-]*$/.test(font.id)) {
      addError(font, 'invalid collection key or route id.');
    }
    if (!isHttpUrl(licenseUrl) || !licenseUrl.startsWith('https://')) addError(font, 'missing secure license evidence.');
    if (!font.license || /personal.use.only|non.?commercial|^CC-BY-NC|^unknown$|^free$/i.test(font.license)) {
      addError(font, 'missing or incompatible commercial-use license.');
    }
    if (usage && (!usage.ru?.trim() || !usage.en?.trim())) addError(font, 'commercial usage summary is missing a translation.');
    if (previewImageUrl && !/^https:\/\//.test(previewImageUrl) && !/^\/assets\/type\//.test(previewImageUrl)) addError(font, 'invalid specimen image URL.');
    if (previewFaces && (!cssFamily || !Array.isArray(previewFaces) || previewFaces.some(face =>
      !face.cssFamily?.trim() || !Number.isInteger(face.weight) || face.weight < 1 || face.weight > 1000 || !['normal', 'italic', 'oblique'].includes(face.style)
    ))) addError(font, 'invalid per-style preview aliases.');
    if (cssFamily && (!sourceOnly || !font.customCssUrl || !cssFamily.trim())) addError(font, 'CSS family alias requires an authorized external specimen stylesheet.');
    if (sourceOnly) {
      if (!isHttpUrl(font.downloadUrl) || !font.downloadUrl.startsWith('https://')) addError(font, 'missing original download source.');
    } else {
      const base = `https://onod.space/assets/type/${key}`;
      if (font.downloadUrl !== `${base}/family.zip` || font.customCssUrl !== `${base}/preview.css`) {
        addError(font, 'missing self-hosted family package or specimen.');
      }
    }
    continue;
  }
  if (!/^(?:gf|it)-[a-z0-9][a-z0-9-]*-[0-9a-f]{12}$/.test(key) || font.id !== `ofl-${key.slice(0, -13)}`) {
    addError(font, 'invalid versioned package or unstable route ID.');
  }
  if (!isHttpUrl(licenseUrl) || !licenseUrl.startsWith('https://') || !licenseUrl.includes(key.slice(-12))) {
    addError(font, 'the original license must link to the upstream revision.');
  }
  const base = `https://onod.space/assets/type/${key}`;
  if (font.license !== 'OFL-1.1' || font.downloadUrl !== `${base}/family.zip` || font.customCssUrl !== `${base}/preview.css`) {
    addError(font, 'missing licensed download or preview.');
  }
}

const catalogNames = new Set(mockFonts.map(font => font.name));
const editorialNames = new Set(editorialFamilies);
if (editorialNames.size !== editorialFamilies.length) addError(null, 'Duplicate name in the editorial selection.');
for (const name of editorialNames) {
  const font = mockFonts.find(candidate => candidate.name === name);
  if (!font || !hasInteractiveSpecimen(font)) addError(null, `Editorial family lacks a catalog entry or live specimen: ${name}.`);
}
const localPreviews = JSON.parse(readFileSync('src/app/data/verified/editorial-previews.json', 'utf8'));
for (const [name, directory] of Object.entries(localPreviews)) {
  if (!editorialNames.has(name) || !/^[a-z0-9]+-[a-f0-9]{12}$/.test(directory)) {
    addError(null, `Invalid editorial specimen entry: ${name}`);
    continue;
  }
  const root = resolve('public/assets/editorial', directory);
  const sheet = readFileSync(resolve(root, 'regular.css'), 'utf8');
  const notice = readFileSync(resolve(root, 'OFL.txt'), 'utf8');
  const urls = [...sheet.matchAll(/src:\s*url\(([^)]+)\)/g)].map(match => match[1]);
  if (!urls.length || !notice.includes('SIL OPEN FONT LICENSE') || !sheet.includes(`font-family: '${name}'`)) {
    addError(null, `Missing editorial font or license for ${name}.`);
  }
  const declarations = new Set([...sheet.matchAll(/font-weight:\s*([\d ]+);/g)].map(match => match[1]));
  const metadata = googleEvidence[name];
  const axis = metadata?.axes.wght;
  const normalWeights = axis ? [`${axis.min} ${axis.max}`] : (metadata?.weights || []).map(String);
  if (!normalWeights.length || declarations.size !== normalWeights.length || normalWeights.some(weight => !declarations.has(weight))) {
    addError(null, `Local editorial specimens disagree with verified upright weights: ${name}.`);
  }
  for (const url of urls) {
    if (!/^[a-f0-9]{16}\.woff2$/.test(url) || readFileSync(resolve(root, url)).subarray(0, 4).toString() !== 'wOF2') {
      addError(null, `Invalid webfont for ${name}: ${url}`);
    }
  }
}
const defaultOrder = orderCatalog(mockFonts, 'default', '');
if (editorialFamilies.some((name, index) => defaultOrder[index]?.name !== name)) {
  addError(null, 'The default catalog must open in editorial order.');
}
if (orderCatalog(defaultOrder, 'alpha', '')[0]?.id !== mockFonts[0]?.id) {
  addError(null, 'Alphabetical sorting must restore the alphabetical catalog.');
}

let validEvidenceRecords = 0;
let reviewedAliasRecords = 0;
for (const [name, evidence] of Object.entries(googleEvidence)) {
  if (!evidence || typeof evidence !== 'object') {
    errors.push(`evidence:${name}: record must be an object.`);
    continue;
  }

  if (!isReviewedEvidenceIdentity(name, evidence)) {
    errors.push(`evidence:${name}: upstream family '${evidence.family}' does not match catalog identity and has no reviewed alias.`);
  } else if (evidence.family !== name) {
    reviewedAliasRecords += 1;
  }

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

for (const [catalogName, upstreamName] of Object.entries(reviewedAliases)) {
  if (!catalogNames.has(catalogName)) errors.push(`alias:${catalogName}: catalog family does not exist.`);
  const evidence = googleEvidence[catalogName];
  if (!evidence) errors.push(`alias:${catalogName}: canonical evidence record is missing.`);
  else if (evidence.family !== upstreamName) errors.push(`alias:${catalogName}: expected upstream family '${upstreamName}', evidence contains '${evidence.family}'.`);
  if (catalogName === upstreamName) errors.push(`alias:${catalogName}: alias is redundant; exact matches must not be stored in alias registry.`);
}

const findByName = name => mockFonts.find(font => font.name === name);
for (const [name, script] of [['Noto Sans JP', 'Japanese'], ['Noto Serif JP', 'Japanese'], ['Noto Sans KR', 'Korean'], ['Noto Serif KR', 'Korean'], ['Noto Sans TC', 'Chinese'], ['Noto Serif TC', 'Chinese']]) {
  const font = findByName(name);
  if (font && !getEffectiveLanguages(font).includes(script)) addError(font, `legacy script repair failed: expected ${script}.`);
}

const sourceDebt = mockFonts.filter(font => {
  const trust = getFontTrustReport(font);
  return !trust.identityVerified || !trust.licenseVerified;
}).length;
const weightDebt = mockFonts.filter(font => !getFontTrustReport(font).weightsVerified).length;
const variableDebt = mockFonts.filter(font => !getFontTrustReport(font).variableVerified).length;
const scriptDebt = mockFonts.filter(font => !getFontTrustReport(font).scriptsVerified).length;
const verifiedVariable = mockFonts.filter(isEffectivelyVariable).length;
const runtimeVerified = mockFonts.filter(font => {
  const trust = getFontTrustReport(font);
  return trust.identityVerified && trust.licenseVerified;
}).length;

console.log(`Catalog validation: ${mockFonts.length} families, ${seenIds.size} unique ids, ${seenNames.size} unique names.`);
console.log(`Canonical Google evidence: ${validEvidenceRecords} METADATA.pb records with path/SHA provenance (${reviewedAliasRecords} reviewed aliases).`);
console.log(`Runtime source/license verification: ${runtimeVerified}/${mockFonts.length}.`);
console.log(`Field-level debt: source/license ${sourceDebt}; weights ${weightDebt}; variable ${variableDebt}; scripts ${scriptDebt}.`);
console.log(`Verified variable families exposed at runtime: ${verifiedVariable}.`);

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

console.log('Catalog structural, evidence, reviewed-alias and field-level runtime trust validation passed.');
