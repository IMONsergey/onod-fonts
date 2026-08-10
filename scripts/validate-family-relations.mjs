import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockFonts } from '../src/app/data/mockFonts.ts';

const relations = JSON.parse(readFileSync(resolve(process.cwd(), 'src/app/data/verified/family-relations.json'), 'utf8'));
const catalog = new Set(mockFonts.map(font => font.name));
const errors = [];
const allowedKinds = new Set(['historical-successor', 'provider-rename', 'collection-member']);
const sha1 = value => /^[0-9a-f]{40}$/i.test(value || '');
const httpUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

for (const [name, record] of Object.entries(relations)) {
  if (!catalog.has(name)) errors.push(`${name}: catalog family does not exist.`);
  if (record?.catalogFamily !== name) errors.push(`${name}: catalogFamily must match relation key exactly.`);
  if (record?.status !== 'verified') errors.push(`${name}: only status=verified relations are allowed in canonical relation evidence.`);
  if (!allowedKinds.has(record?.relation)) errors.push(`${name}: unsupported relation '${record?.relation}'.`);
  if (typeof record?.provider !== 'string' || !record.provider.trim()) errors.push(`${name}: provider is required.`);
  if (record?.loadReplacementAllowed !== false) errors.push(`${name}: silent replacement is forbidden; loadReplacementAllowed must remain false until a separate explicit migration policy exists.`);

  const historical = record?.historical;
  if (!historical || historical.family !== name) errors.push(`${name}: historical family must exactly match the recovered catalog identity.`);
  if (!httpUrl(historical?.sourceUrl)) errors.push(`${name}: historical sourceUrl must be an HTTP(S) primary source.`);
  if (typeof historical?.designer !== 'string' || !historical.designer.trim()) errors.push(`${name}: historical designer is required.`);

  const proof = historical?.evidence;
  if (!proof || typeof proof !== 'object') errors.push(`${name}: historical evidence is required.`);
  else {
    if (typeof proof.repository !== 'string' || !/^[^/]+\/[^/]+$/.test(proof.repository)) errors.push(`${name}: historical evidence repository is invalid.`);
    if (!sha1(proof.commitSha)) errors.push(`${name}: historical evidence commitSha must be a Git commit SHA.`);
    if (!Array.isArray(proof.facts) || proof.facts.length === 0 || proof.facts.some(fact => typeof fact !== 'string' || !fact.trim())) errors.push(`${name}: historical evidence needs reviewed facts.`);
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
    if (!Array.isArray(successorProof?.facts) || successorProof.facts.length === 0) errors.push(`${name}: successor relation requires reviewed facts.`);
  }
}

console.log(`Family relation evidence validation: ${Object.keys(relations).length} verified relations.`);
if (errors.length) {
  console.error(`Errors: ${errors.length}`);
  errors.forEach(error => console.error(`  ERROR ${error}`));
  process.exit(1);
}
console.log('Family relation evidence validation passed; silent replacement remains disabled.');
