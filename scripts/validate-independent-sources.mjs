import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockFonts } from '../src/app/data/mockFonts.ts';

const evidence = JSON.parse(readFileSync(resolve(process.cwd(), 'src/app/data/verified/independent-sources.json'), 'utf8'));
const catalogByName = new Map(mockFonts.map(font => [font.name, font]));
const errors = [];
const repositories = new Set();
const allowedLicenses = new Set(['OFL-1.1']);
const allowedSourceTypes = new Set(['official-github', 'official-web']);

const isSha = value => /^[0-9a-f]{40}$/i.test(value || '');
const isHttpUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

const validateEvidence = (catalogName, label, proof, sourceType) => {
  if (!proof || typeof proof !== 'object') {
    errors.push(`${catalogName}: ${label} evidence is required.`);
    return;
  }

  if (sourceType === 'official-github') {
    if (proof.kind !== 'github-blob') errors.push(`${catalogName}: ${label} GitHub evidence must use kind=github-blob.`);
    if (typeof proof.ref !== 'string' || !proof.ref) errors.push(`${catalogName}: ${label} evidence ref missing.`);
    if (typeof proof.path !== 'string' || !proof.path) errors.push(`${catalogName}: ${label} evidence path missing.`);
    if (!isSha(proof.blobSha)) errors.push(`${catalogName}: ${label} evidence blobSha must be a Git blob SHA.`);
    return;
  }

  if (sourceType === 'official-web') {
    if (proof.kind !== 'official-web') errors.push(`${catalogName}: ${label} web evidence must use kind=official-web.`);
    if (!isHttpUrl(proof.url)) errors.push(`${catalogName}: ${label} web evidence URL is invalid.`);
    if (!proof.capturedAt || Number.isNaN(Date.parse(proof.capturedAt))) errors.push(`${catalogName}: ${label} web evidence capturedAt is invalid.`);
    return;
  }

  errors.push(`${catalogName}: cannot validate ${label} evidence for unsupported source type '${sourceType}'.`);
};

for (const [catalogName, record] of Object.entries(evidence)) {
  if (!catalogByName.has(catalogName)) errors.push(`${catalogName}: family is not present in catalog.`);
  if (record?.family !== catalogName) errors.push(`${catalogName}: family identity must match evidence key exactly.`);

  const identity = record?.identity;
  if (!identity || typeof identity !== 'object') {
    errors.push(`${catalogName}: identity block is required.`);
    continue;
  }
  if (identity.status !== 'verified') errors.push(`${catalogName}: independent evidence records must have identity.status=verified.`);
  if (!allowedSourceTypes.has(identity.sourceType)) errors.push(`${catalogName}: unsupported identity sourceType '${identity.sourceType}'.`);
  if (!isHttpUrl(identity.sourceUrl)) errors.push(`${catalogName}: invalid identity sourceUrl '${identity.sourceUrl}'.`);
  if (typeof identity.designer !== 'string' || !identity.designer.trim()) errors.push(`${catalogName}: reviewed designer/publisher identity is required.`);

  if (identity.sourceType === 'official-github') {
    if (typeof identity.repository !== 'string' || !/^[^/]+\/[^/]+$/.test(identity.repository)) errors.push(`${catalogName}: invalid repository '${identity.repository}'.`);
    else {
      repositories.add(identity.repository);
      if (identity.sourceUrl !== `https://github.com/${identity.repository}`) errors.push(`${catalogName}: GitHub sourceUrl must exactly match reviewed repository.`);
    }
  }
  validateEvidence(catalogName, 'identity', identity.evidence, identity.sourceType);

  const license = record?.license;
  if (!license || typeof license !== 'object') {
    errors.push(`${catalogName}: license block is required.`);
  } else if (license.status === 'verified') {
    if (!allowedLicenses.has(license.id)) errors.push(`${catalogName}: license '${license.id}' has no reviewed independent-source policy.`);
    validateEvidence(catalogName, 'license', license.evidence, identity.sourceType);
  } else if (license.status === 'pending') {
    if (license.id) errors.push(`${catalogName}: pending license must not expose a definitive id.`);
    if (license.evidence) errors.push(`${catalogName}: pending license must not attach evidence as if it were verified.`);
  } else {
    errors.push(`${catalogName}: license.status must be verified or pending.`);
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

const identityVerified = Object.values(evidence).filter(record => record?.identity?.status === 'verified').length;
const licenseVerified = Object.values(evidence).filter(record => record?.license?.status === 'verified').length;
const licensePending = Object.values(evidence).filter(record => record?.license?.status === 'pending').length;
console.log(`Independent-source evidence validation: ${Object.keys(evidence).length} families; identity verified=${identityVerified}; license verified=${licenseVerified}; license pending=${licensePending}; GitHub repos=${repositories.size}.`);
if (errors.length) {
  console.error(`Errors: ${errors.length}`);
  errors.forEach(error => console.error(`  ERROR ${error}`));
  process.exit(1);
}
console.log('Independent-source identity/license evidence validation passed.');
