import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockFonts } from '../src/app/data/mockFonts.ts';

const fontshareEvidence = JSON.parse(readFileSync(resolve(process.cwd(), 'src/app/data/verified/fontshare.json'), 'utf8'));
const independentRepo = JSON.parse(readFileSync(resolve(process.cwd(), 'src/app/data/verified/independent-sources.json'), 'utf8'));
const independentWeb = JSON.parse(readFileSync(resolve(process.cwd(), 'src/app/data/verified/independent-web-sources.json'), 'utf8'));
const independent = { ...independentRepo, ...independentWeb };

const recovered = mockFonts.filter(font => font.source === 'Fontshare');
const current = recovered.filter(font => Boolean(fontshareEvidence[font.name]));
const legacy = recovered.filter(font => !fontshareEvidence[font.name]).sort((a, b) => a.name.localeCompare(b.name));
const reSourced = legacy.filter(font => independent[font.name]?.identity?.status === 'verified');
const unresolved = legacy.filter(font => independent[font.name]?.identity?.status !== 'verified');

const evidenceStatus = font => {
  const record = independent[font.name];
  if (!record?.identity || record.identity.status !== 'verified') return null;
  return {
    source: record.identity.publisher || record.identity.designer || 'Independent primary source',
    sourceUrl: record.identity.sourceUrl,
    license: record.license?.status === 'verified' ? record.license.id : 'License pending',
  };
};

const lines = [
  '# ONOD Fonts — Fontshare source identity audit',
  '',
  '> Generated from the recovered catalog, current official Fontshare API evidence, and reviewed independent re-sourcing evidence. A recovered `source: Fontshare` label is historical input, not current provider truth.',
  '',
  `Recovered Fontshare-tagged families: **${recovered.length}**`,
  `Current exact/reviewed Fontshare evidence: **${current.length}**`,
  `Legacy/unmatched against current Fontshare API: **${legacy.length}**`,
  `Legacy records already re-sourced to another primary source: **${reSourced.length}**`,
  `Legacy source-identity queue still unresolved: **${unresolved.length}**`,
  '',
  '## Interpretation',
  '',
  '- Current Fontshare evidence means family identity is exact/reviewed in the current official Fontshare API.',
  '- A legacy mismatch only means the recovered catalog called the family “Fontshare” while the current API does not contain that exact/reviewed identity.',
  '- Re-sourced records have independent primary-source identity evidence and must use canonical effective source facts in UI/runtime.',
  '- Unresolved records stay source debt. Do not assign OFL/FFL or another provider/license through name similarity or historical memory.',
  '',
  '## Legacy records re-sourced elsewhere',
  '',
  '| Family | Canonical source | Primary URL | License state |',
  '|---|---|---|---|',
];

for (const font of reSourced) {
  const status = evidenceStatus(font);
  lines.push(`| ${font.name.replaceAll('|', '\\|')} | ${status.source.replaceAll('|', '\\|')} | ${status.sourceUrl} | ${status.license.replaceAll('|', '\\|')} |`);
}
if (!reSourced.length) lines.push('| — | — | — | — |');

lines.push('');
lines.push('## Unresolved legacy source-identity queue');
lines.push('');
lines.push('| Family | Recovered author | Recovered source URL | Raw license | Status |');
lines.push('|---|---|---|---|---|');
for (const font of unresolved) {
  lines.push(`| ${font.name.replaceAll('|', '\\|')} | ${font.author.replaceAll('|', '\\|')} | ${font.sourceUrl} | ${font.license.replaceAll('|', '\\|')} | Re-source from primary evidence |`);
}
if (!unresolved.length) lines.push('| — | — | — | — | — |');

lines.push('');
lines.push('## Current exact/reviewed Fontshare families');
lines.push('');
lines.push('These families have current official API evidence and are handled by the Fontshare canonical evidence/runtime pipeline:');
lines.push('');
lines.push(current.map(font => `- ${font.name}`).sort((a, b) => a.localeCompare(b)).join('\n'));
lines.push('');

writeFileSync(resolve(process.cwd(), 'docs/FONTSHARE-SOURCE-AUDIT.md'), `${lines.join('\n')}\n`);
console.log(`Fontshare source audit generated: ${current.length} current / ${reSourced.length} re-sourced / ${unresolved.length} unresolved from ${recovered.length} recovered Fontshare-tagged families.`);
