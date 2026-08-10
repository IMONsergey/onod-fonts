import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockFonts } from '../src/app/data/mockFonts.ts';

const records = JSON.parse(readFileSync(resolve(process.cwd(), 'src/app/data/verified/independent-web-sources.json'), 'utf8'));
const catalog = new Set(mockFonts.map(font => font.name));
const errors = [];
const allowedHosts = new Set([
  'weltkern.com', 'www.weltkern.com',
  'rajputrajesh-4489b.web.app',
  'indiantypefoundry.com', 'www.indiantypefoundry.com',
  'fontfabric.com', 'www.fontfabric.com',
]);

const parseUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
};

for (const [name, record] of Object.entries(records)) {
  if (!catalog.has(name)) errors.push(`${name}: family is not present in catalog.`);
  if (record?.family !== name) errors.push(`${name}: family must match evidence key exactly.`);

  const identity = record?.identity;
  if (!identity || identity.status !== 'verified') errors.push(`${name}: identity.status must be verified.`);
  if (identity?.sourceType !== 'official-web') errors.push(`${name}: sourceType must be official-web.`);
  if (typeof identity?.designer !== 'string' || !identity.designer.trim()) errors.push(`${name}: designer/publisher identity is required.`);

  const sourceUrl = parseUrl(identity?.sourceUrl);
  if (!sourceUrl || !allowedHosts.has(sourceUrl.hostname)) errors.push(`${name}: sourceUrl must be an approved primary-source host.`);

  const proof = identity?.evidence;
  if (!proof || proof.kind !== 'official-web') errors.push(`${name}: identity evidence kind must be official-web.`);
  const proofUrl = parseUrl(proof?.url);
  if (!proofUrl || !allowedHosts.has(proofUrl.hostname)) errors.push(`${name}: evidence URL must be an approved primary-source host.`);
  if (identity?.sourceUrl !== proof?.url) errors.push(`${name}: identity sourceUrl and evidence URL must match exactly.`);
  if (!proof?.capturedAt || Number.isNaN(Date.parse(proof.capturedAt))) errors.push(`${name}: capturedAt must be a valid timestamp.`);
  if (!Array.isArray(proof?.facts) || proof.facts.length === 0 || proof.facts.some(fact => typeof fact !== 'string' || !fact.trim())) errors.push(`${name}: at least one reviewed primary-source fact is required.`);

  const license = record?.license;
  if (!license || license.status !== 'pending') errors.push(`${name}: official-web records require license.status=pending until an exact ONOD license policy is normalized.`);
  if (license?.id) errors.push(`${name}: pending license must not expose a definitive id.`);

  const technical = record?.technical || {};
  for (const flag of ['weightsVerified', 'variableVerified', 'scriptsVerified']) {
    if (typeof technical[flag] !== 'boolean') errors.push(`${name}: technical.${flag} must be boolean.`);
  }

  if (technical.weightsVerified) {
    if (!Array.isArray(technical.weights) || technical.weights.length === 0) errors.push(`${name}: weightsVerified requires explicit numeric weights.`);
    else if (technical.weights.some(weight => !Number.isFinite(Number(weight)) || Number(weight) < 1 || Number(weight) > 1000)) errors.push(`${name}: invalid verified weight list.`);
  } else if (technical.weights !== undefined) errors.push(`${name}: unverified weights must not be exposed.`);

  if (technical.variableVerified) {
    if (typeof technical.variable !== 'boolean') errors.push(`${name}: variableVerified requires explicit technical.variable.`);
  } else if (technical.variable !== undefined) errors.push(`${name}: unverified variable capability must not be exposed.`);

  if (technical.scriptsVerified) {
    if (!Array.isArray(technical.scripts) || technical.scripts.length === 0 || technical.scripts.some(script => typeof script !== 'string' || !script.trim())) errors.push(`${name}: scriptsVerified requires a non-empty reviewed scripts list.`);
  } else if (technical.scripts !== undefined) errors.push(`${name}: unverified scripts must not be exposed.`);
}

const scriptVerified = Object.values(records).filter(record => record?.technical?.scriptsVerified).length;
console.log(`Independent web identity evidence: ${Object.keys(records).length} families; license pending=${Object.keys(records).length}; script-verified=${scriptVerified}.`);
if (errors.length) {
  console.error(`Errors: ${errors.length}`);
  errors.forEach(error => console.error(`  ERROR ${error}`));
  process.exit(1);
}
console.log('Independent web identity/field evidence validation passed.');
