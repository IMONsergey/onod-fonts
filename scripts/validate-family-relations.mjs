import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockFonts } from '../src/app/data/mockFonts.ts';

const relations = JSON.parse(readFileSync(resolve(process.cwd(), 'src/app/data/verified/family-relations.json'), 'utf8'));
const catalog = new Set(mockFonts.map(font => font.name));
const errors = [];
const allowedKinds = new Set(['historical-successor', 'provider-rename', 'collection-member', 'catalog-correction']);
const sha1 = value => /^[0-9a-f]{40}$/i.test(value || '');
const httpUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};
const reviewedFacts = proof => Array.isArray(proof?.facts) && proof.facts.length > 0 && proof.facts.every(fact => typeof fact === 'string' && fact.trim());

for (const [name, record] of Object.entries(relations)) {
  if (!catalog.has(name)) errors.push(`${name}: catalog family does not exist.`);
  if (record?.catalogFamily !== name) errors.push(`${name}: catalogFamily must match relation key exactly.`);
  if (record?.status !== 'verified') errors.push(`${name}: only status=verified relations are allowed in canonical relation evidence.`);
  if (!allowedKinds.has(record?.relation)) errors.push(`${name}: unsupported relation '${record?.relation}'.`);
  if (typeof record?.provider !== 'string' || !record.provider.trim()) errors.push(`${name}: provider is required.`);

  if (record.relation === 'catalog-correction') {
    if (record.loadReplacementAllowed !== true) errors.push(`${name}: catalog-correction must explicitly allow canonical rendering replacement.`);
    if (record.historical || record.successor) errors.push(`${name}: catalog-correction must use canonical evidence, not historical/successor fields.`);

    const canonical = record.canonical;
    if (!canonical || typeof canonical !== 'object') {
      errors.push(`${name}: catalog-correction requires canonical evidence.`);
      continue;
    }
    if (typeof canonical.family !== 'string' || !canonical.family.trim() || canonical.family === name) errors.push(`${name}: canonical family must be a distinct non-empty corrected identity.`);
    if (!httpUrl(canonical.sourceUrl)) errors.push(`${name}: canonical sourceUrl must be HTTP(S).`);
    if (typeof canonical.designer !== 'string' || !canonical.designer.trim()) errors.push(`${name}: canonical designer is required.`);
    if (typeof canonical.licenseId !== 'string' || !canonical.licenseId.trim()) errors.push(`${name}: canonical exact license id is required.`);
    if (!Array.isArray(canonical.weights) || canonical.weights.length === 0 || canonical.weights.some(weight => !Number.isFinite(Number(weight)) || Number(weight) < 1 || Number(weight) > 1000)) errors.push(`${name}: canonical numeric weights are required.`);
    if (typeof canonical.variable !== 'boolean') errors.push(`${name}: canonical variable capability must be explicit.`);
    if (!Array.isArray(canonical.scripts) || canonical.scripts.length === 0 || canonical.scripts.some(script => typeof script !== 'string' || !script.trim())) errors.push(`${name}: canonical scripts are required.`);

    const proof = canonical.evidence;
    if (!proof || typeof proof !== 'object') errors.push(`${name}: canonical correction evidence is required.`);
    else {
      if (typeof proof.repository !== 'string' || !/^[^/]+\/[^/]+$/.test(proof.repository)) errors.push(`${name}: canonical evidence repository is invalid.`);
      if (typeof proof.path !== 'string' || !/^(ofl|apache|ufl)\/.+\/METADATA\.pb$/.test(proof.path)) errors.push(`${name}: canonical Google metadata path is invalid.`);
      if (!sha1(proof.blobSha)) errors.push(`${name}: canonical metadata blobSha must be a Git blob SHA.`);
      if (!reviewedFacts(proof)) errors.push(`${name}: canonical correction needs reviewed facts.`);
    }
    continue;
  }

  if (record.loadReplacementAllowed !== false) errors.push(`${name}: silent replacement is forbidden for ${record.relation}; loadReplacementAllowed must be false.`);

  const historical = record?.historical;
  if (!historical || historical.family !== name) errors.push(`${name}: historical family must exactly match the recovered catalog identity.`);
  if (!httpUrl(historical?.sourceUrl)) errors.push(`${name}: historical sourceUrl must be an HTTP(S) primary source.`);
  if (typeof historical?.designer !== 'string' || !historical.designer.trim()) errors.push(`${name}: historical designer is required.`);

  const proof = historical?.evidence;
  if (!proof || typeof proof !== 'object') errors.push(`${name}: historical evidence is required.`);
  else {
    if (typeof proof.repository !== 'string' || !/^[^/]+\/[^/]+$/.test(proof.repository)) errors.push(`${name}: historical evidence repository is invalid.`);
    if (!sha1(proof.commitSha)) errors.push(`${name}: historical evidence commitSha must be a Git commit SHA.`);
    if (!reviewedFacts(proof)) errors.push(`${name}: historical evidence needs reviewed facts.`);
    if (historical.licenseId) {
      if (typeof proof.licensePath !== 'string' || !proof.licensePath) errors.push(`${name}: verified historical license requires licensePath.`);
      if (!sha1(proof.licenseBlobSha)) errors.push(`${name}: verified historical license requires licenseBlobSha.`);
    }
  }

  if (record.relation === 'historical-successor') {
    const successor = record.successor;
    if (!successor || typeof successor.family !== 'string' || !successor.family.trim() || successor.family === name) errors.push(`${name}: historical-successor relation requires a distinct successor family.`);
    if (!httpUrl(successor?.sourceUrl)) errors.push(`${name}: successor sourceUrl is invalid.`);
    const successorProof = successor?.evidence;
    if (!successorProof || !sha1(successorProof.commitSha)) errors.push(`${name}: successor relation requires a Git commit SHA.`);
    if (successorProof && (typeof successorProof.repository !== 'string' || !/^[^/]+\/[^/]+$/.test(successorProof.repository))) errors.push(`${name}: successor evidence repository is invalid.`);
    if (!reviewedFacts(successorProof)) errors.push(`${name}: successor relation requires reviewed facts.`);
  }
}

const corrections = Object.values(relations).filter(record => record.relation === 'catalog-correction').length;
console.log(`Family relation evidence validation: ${Object.keys(relations).length} verified relations (${corrections} canonical corrections).`);
if (errors.length) {
  console.error(`Errors: ${errors.length}`);
  errors.forEach(error => console.error(`  ERROR ${error}`));
  process.exit(1);
}
console.log('Family relation evidence validation passed; replacement is allowed only for explicit canonical corrections.');
