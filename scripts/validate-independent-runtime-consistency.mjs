import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = path => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const githubEvidence = read('src/app/data/verified/independent-sources.json');
const webEvidence = read('src/app/data/verified/independent-web-sources.json');
const runtime = read('src/app/data/verified/.generated/independent-runtime.json');
const errors = [];

const expected = new Map();
for (const [family, record] of Object.entries(githubEvidence)) {
  if (record?.family !== family || record?.identity?.status !== 'verified') continue;
  expected.set(family, record);
}
for (const [family, record] of Object.entries(webEvidence)) {
  if (record?.family !== family || record?.identity?.status !== 'verified') continue;
  if (expected.has(family)) errors.push(`${family}: canonical identity exists in both GitHub and web evidence stores.`);
  expected.set(family, record);
}

for (const [family, evidence] of expected) {
  const projected = runtime[family];
  if (!projected) {
    errors.push(`${family}: verified canonical identity is missing from independent runtime projection.`);
    continue;
  }
  if (projected.family !== family) errors.push(`${family}: runtime family identity changed to '${projected.family}'.`);
  if (projected.identity?.sourceUrl !== evidence.identity.sourceUrl) errors.push(`${family}: runtime sourceUrl does not match canonical identity evidence.`);
  if (projected.identity?.designer !== evidence.identity.designer) errors.push(`${family}: runtime designer does not match canonical identity evidence.`);

  const expectedLicenseStatus = evidence.license?.status === 'verified' ? 'verified' : 'pending';
  if (projected.license?.status !== expectedLicenseStatus) errors.push(`${family}: runtime license status '${projected.license?.status}' does not match canonical '${expectedLicenseStatus}'.`);
  if (expectedLicenseStatus === 'verified' && projected.license?.id !== evidence.license.id) errors.push(`${family}: runtime exact license id does not match canonical evidence.`);
  if (expectedLicenseStatus === 'pending' && projected.license?.id) errors.push(`${family}: pending canonical license leaked a definitive runtime id.`);
}

for (const family of Object.keys(runtime)) {
  if (!expected.has(family)) errors.push(`${family}: independent runtime contains a family with no canonical verified identity evidence.`);
}

const githubCount = Object.values(githubEvidence).filter(record => record?.identity?.status === 'verified').length;
const webCount = Object.values(webEvidence).filter(record => record?.identity?.status === 'verified').length;
const verifiedLicenses = Object.values(runtime).filter(record => record?.license?.status === 'verified').length;
const pendingLicenses = Object.values(runtime).filter(record => record?.license?.status === 'pending').length;
console.log(`Independent runtime consistency: github=${githubCount}, web=${webCount}, runtime=${Object.keys(runtime).length}, verified licenses=${verifiedLicenses}, pending licenses=${pendingLicenses}.`);

if (errors.length) {
  console.error(`Errors: ${errors.length}`);
  errors.forEach(error => console.error(`  ERROR ${error}`));
  process.exit(1);
}
console.log('Independent canonical evidence/runtime consistency passed.');
