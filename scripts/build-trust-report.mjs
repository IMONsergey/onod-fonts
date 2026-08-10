import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockFonts } from '../src/app/data/mockFonts.ts';
import { getFontTrustReport } from '../src/app/lib/fontTrust.ts';

const rows = mockFonts.map(font => ({ font, trust: getFontTrustReport(font) }));
const sourceDebt = rows
  .filter(({ trust }) => !trust.identityVerified || !trust.licenseVerified)
  .sort((a, b) => a.font.source.localeCompare(b.font.source) || a.font.name.localeCompare(b.font.name));
const weightDebt = rows.filter(({ trust }) => !trust.weightsVerified);
const variableDebt = rows.filter(({ trust }) => !trust.variableVerified);
const scriptDebt = rows.filter(({ trust }) => !trust.scriptsVerified);

const groups = new Map();
for (const item of sourceDebt) {
  const key = item.font.source || 'Unknown source';
  const values = groups.get(key) || [];
  values.push(item);
  groups.set(key, values);
}

const lines = [
  '# ONOD Fonts — trust debt report',
  '',
  '> Generated from the canonical runtime trust layer. Do not edit counts manually.',
  '',
  `Catalog families: **${mockFonts.length}**`,
  `Source/license trust debt: **${sourceDebt.length}**`,
  `Source/license clear: **${mockFonts.length - sourceDebt.length}**`,
  '',
  '## Field-level technical debt',
  '',
  `- exact weights pending: **${weightDebt.length}** families`,
  `- variable capability pending: **${variableDebt.length}** families`,
  `- script/language metadata pending: **${scriptDebt.length}** families`,
  '',
  'A family can be source/license verified while some technical fields remain pending. Technical debt must stay conservative at runtime; it must not be converted back into source/license debt merely to preserve a single all-or-nothing status.',
  '',
  '## Source/license queue by recovered source',
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

for (const { font, trust } of sourceDebt) {
  const status = value => value ? 'verified' : 'pending';
  lines.push(`| ${font.name.replaceAll('|', '\\|')} | ${font.source.replaceAll('|', '\\|')} | ${status(trust.identityVerified)} | ${status(trust.licenseVerified)} | ${status(trust.weightsVerified)} | ${status(trust.variableVerified)} | ${status(trust.scriptsVerified)} | ${trust.licenseLabel.replaceAll('|', '\\|')} |`);
}

lines.push('');
lines.push('## Source/license verified but technically partial');
lines.push('');
lines.push('| Family | Provider | Weights | Variable | Scripts |');
lines.push('|---|---|---|---|---|');
for (const { font, trust } of rows
  .filter(({ trust }) => trust.identityVerified && trust.licenseVerified && (!trust.weightsVerified || !trust.variableVerified || !trust.scriptsVerified))
  .sort((a, b) => a.font.name.localeCompare(b.font.name))) {
  const status = value => value ? 'verified' : 'pending';
  lines.push(`| ${font.name.replaceAll('|', '\\|')} | ${(trust.provider || font.source).replaceAll('|', '\\|')} | ${status(trust.weightsVerified)} | ${status(trust.variableVerified)} | ${status(trust.scriptsVerified)} |`);
}

lines.push('');
writeFileSync(resolve(process.cwd(), 'docs/TRUST-DEBT.md'), `${lines.join('\n')}\n`);
console.log(`Trust report generated: ${sourceDebt.length} source/license debt; field debt weights=${weightDebt.length}, variable=${variableDebt.length}, scripts=${scriptDebt.length}.`);
