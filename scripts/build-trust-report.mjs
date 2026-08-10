import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockFonts } from '../src/app/data/mockFonts.ts';
import { getFontTrustReport } from '../src/app/lib/fontTrust.ts';

const rows = mockFonts.map(font => ({ font, trust: getFontTrustReport(font) }));
const identityDebt = rows.filter(({ trust }) => !trust.identityVerified);
const licenseDebt = rows.filter(({ trust }) => !trust.licenseVerified);
const sourceLicenseDebt = rows
  .filter(({ trust }) => !trust.identityVerified || !trust.licenseVerified)
  .sort((a, b) => a.font.source.localeCompare(b.font.source) || a.font.name.localeCompare(b.font.name));
const weightDebt = rows.filter(({ trust }) => !trust.weightsVerified);
const variableDebt = rows.filter(({ trust }) => !trust.variableVerified);
const scriptDebt = rows.filter(({ trust }) => !trust.scriptsVerified);

const groups = new Map();
for (const item of sourceLicenseDebt) {
  const key = item.font.source || 'Unknown source';
  const values = groups.get(key) || [];
  values.push(item);
  groups.set(key, values);
}

const status = value => value ? 'verified' : 'pending';
const lines = [
  '# ONOD Fonts — trust debt report',
  '',
  '> Generated from the canonical runtime trust layer. Do not edit counts manually.',
  '',
  `Catalog families: **${mockFonts.length}**`,
  `Identity trust debt: **${identityDebt.length}**`,
  `License trust debt: **${licenseDebt.length}**`,
  `Source/license union debt: **${sourceLicenseDebt.length}**`,
  `Source + license clear: **${mockFonts.length - sourceLicenseDebt.length}**`,
  '',
  'Identity and license are independent facts. A family can have a verified primary source while its exact license remains pending; this state must not be collapsed back into “unverified source”.',
  '',
  '## Field-level technical debt',
  '',
  `- exact weights pending: **${weightDebt.length}** families`,
  `- variable capability pending: **${variableDebt.length}** families`,
  `- script coverage pending: **${scriptDebt.length}** families`,
  '',
  'Technical debt is also independent from source/license trust. Inspected font binaries may clear technical fields without changing provider/legal facts.',
  '',
  '## Source/license union queue by recovered source',
  '',
  '| Recovered source | Families pending |',
  '|---|---:|',
  ...Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])).map(([source, items]) => `| ${source.replaceAll('|', '\\|')} | ${items.length} |`),
  '',
  '## Source/license verification queue',
  '',
  '| Family | Recovered source | Identity | License | Weights | Variable | Scripts | Current label |',
  '|---|---|---|---|---|---|---|---|',
];

for (const { font, trust } of sourceLicenseDebt) {
  lines.push(`| ${font.name.replaceAll('|', '\\|')} | ${font.source.replaceAll('|', '\\|')} | ${status(trust.identityVerified)} | ${status(trust.licenseVerified)} | ${status(trust.weightsVerified)} | ${status(trust.variableVerified)} | ${status(trust.scriptsVerified)} | ${trust.licenseLabel.replaceAll('|', '\\|')} |`);
}

const identityOnly = rows
  .filter(({ trust }) => trust.identityVerified && !trust.licenseVerified)
  .sort((a, b) => a.font.name.localeCompare(b.font.name));
lines.push('');
lines.push('## Identity verified / license pending');
lines.push('');
lines.push('| Family | Provider | Primary source | License status |');
lines.push('|---|---|---|---|');
for (const { font, trust } of identityOnly) {
  lines.push(`| ${font.name.replaceAll('|', '\\|')} | ${(trust.provider || font.source).replaceAll('|', '\\|')} | ${(trust.verificationSource || '—').replaceAll('|', '\\|')} | pending |`);
}
if (!identityOnly.length) lines.push('| — | — | — | — |');

lines.push('');
lines.push('## Source/license verified but technically partial');
lines.push('');
lines.push('| Family | Provider | Weights | Variable | Scripts |');
lines.push('|---|---|---|---|---|');
for (const { font, trust } of rows
  .filter(({ trust }) => trust.identityVerified && trust.licenseVerified && (!trust.weightsVerified || !trust.variableVerified || !trust.scriptsVerified))
  .sort((a, b) => a.font.name.localeCompare(b.font.name))) {
  lines.push(`| ${font.name.replaceAll('|', '\\|')} | ${(trust.provider || font.source).replaceAll('|', '\\|')} | ${status(trust.weightsVerified)} | ${status(trust.variableVerified)} | ${status(trust.scriptsVerified)} |`);
}

lines.push('');
writeFileSync(resolve(process.cwd(), 'docs/TRUST-DEBT.md'), `${lines.join('\n')}\n`);
console.log(`Trust report generated: identity=${identityDebt.length}, license=${licenseDebt.length}, union=${sourceLicenseDebt.length}; field debt weights=${weightDebt.length}, variable=${variableDebt.length}, scripts=${scriptDebt.length}.`);
