import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockFonts } from '../src/app/data/mockFonts.ts';

const evidence = JSON.parse(readFileSync(resolve(process.cwd(), 'src/app/data/verified/independent-sources.json'), 'utf8'));
const catalogByName = new Map(mockFonts.map(font => [font.name, font]));
const errors = [];
const repositories = new Set();
const allowedLicenses = new Set(['OFL-1.1']);

const isSha = value => /^[0-9a-f]{40}$/i.test(value || '');
const isGitHubUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'github.com';
  } catch {
    return false;
  }
};

for (const [catalogName, record] of Object.entries(evidence)) {
  if (!catalogByName.has(catalogName)) errors.push(`${catalogName}: family is not present in catalog.`);
  if (record?.family !== catalogName) errors.push(`${catalogName}: family identity must match evidence key exactly.`);
  if (record?.sourceType !== 'official-github') errors.push(`${catalogName}: unsupported sourceType '${record?.sourceType}'.`);
  if (typeof record?.repository !== 'string' || !/^[^/]+\/[^/]+$/.test(record.repository)) errors.push(`${catalogName}: invalid repository '${record?.repository}'.`);
  else repositories.add(record.repository);
  if (!isGitHubUrl(record?.sourceUrl) || !record.sourceUrl.endsWith(record.repository)) errors.push(`${catalogName}: sourceUrl must point to the reviewed repository.`);
  if (typeof record?.designer !== 'string' || !record.designer.trim()) errors.push(`${catalogName}: reviewed designer/publisher identity is required.`);
  if (!allowedLicenses.has(record?.licenseId)) errors.push(`${catalogName}: license '${record?.licenseId}' has no reviewed independent-source policy.`);

  for (const [kind, proof] of [['identity', record?.identityEvidence], ['license', record?.licenseEvidence]]) {
    if (!proof || typeof proof !== 'object') {
      errors.push(`${catalogName}: ${kind} evidence is required.`);
      continue;
    }
    if (typeof proof.ref !== 'string' || !proof.ref) errors.push(`${catalogName}: ${kind} evidence ref missing.`);
    if (typeof proof.path !== 'string' || !proof.path) errors.push(`${catalogName}: ${kind} evidence path missing.`);
    if (!isSha(proof.blobSha)) errors.push(`${catalogName}: ${kind} evidence blobSha must be a Git blob SHA.`);
  }

  const technical = record?.technical || {};
  for (const flag of ['weightsVerified', 'variableVerified', 'scriptsVerified']) {
    if (typeof technical[flag] !== 'boolean') errors.push(`${catalogName}: technical.${flag} must be boolean.`);
  }

  if (technical.weightsVerified) {
    const hasWeights = Array.isArray(technical.weights) && technical.weights.length > 0;
    const hasWeightAxis = technical.axes?.wght && Number.isFinite(Number(technical.axes.wght.min)) && Number.isFinite(Number(technical.axes.wght.max));
    if (!hasWeights && !hasWeightAxis) errors.push(`${catalogName}: weightsVerified requires explicit weights or a wght axis range.`);
  }

  if (Array.isArray(technical.weights)) {
    const weights = technical.weights.map(Number);
    if (weights.some(value => !Number.isFinite(value) || value < 1 || value > 1000)) errors.push(`${catalogName}: invalid technical weight list.`);
    if (new Set(weights).size !== weights.length) errors.push(`${catalogName}: duplicate technical weights.`);
  }

  if (technical.variableVerified && typeof technical.variable !== 'boolean') errors.push(`${catalogName}: variableVerified requires explicit technical.variable.`);
  if (technical.scriptsVerified && (!Array.isArray(technical.scripts) || technical.scripts.length === 0)) errors.push(`${catalogName}: scriptsVerified requires non-empty technical.scripts.`);

  if (technical.axes) {
    for (const [tag, axis] of Object.entries(technical.axes)) {
      if (!/^[A-Za-z0-9]{4}$/.test(tag)) errors.push(`${catalogName}: invalid axis tag '${tag}'.`);
      if (!Number.isFinite(Number(axis?.min)) || !Number.isFinite(Number(axis?.max)) || Number(axis.min) > Number(axis.max)) errors.push(`${catalogName}: invalid axis range for ${tag}.`);
    }
  }
}

console.log(`Independent-source evidence validation: ${Object.keys(evidence).length} families across ${repositories.size} reviewed repositories.`);
if (errors.length) {
  console.error(`Errors: ${errors.length}`);
  errors.forEach(error => console.error(`  ERROR ${error}`));
  process.exit(1);
}
console.log('Independent-source evidence validation passed.');
