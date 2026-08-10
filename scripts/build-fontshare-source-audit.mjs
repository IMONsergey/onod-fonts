import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockFonts } from '../src/app/data/mockFonts.ts';

const evidence = JSON.parse(readFileSync(resolve(process.cwd(), 'src/app/data/verified/fontshare.json'), 'utf8'));
const recovered = mockFonts.filter(font => font.source === 'Fontshare');
const current = recovered.filter(font => Boolean(evidence[font.name]));
const legacy = recovered.filter(font => !evidence[font.name]).sort((a, b) => a.name.localeCompare(b.name));

const lines = [
  '# ONOD Fonts — Fontshare source identity audit',
  '',
  '> Generated from the recovered catalog and current official Fontshare API evidence. Do not treat an unmatched recovered `source: Fontshare` label as current provider identity.',
  '',
  `Recovered Fontshare-tagged families: **${recovered.length}**`,
  `Current exact/reviewed Fontshare evidence: **${current.length}**`,
  `Legacy/unmatched source-identity queue: **${legacy.length}**`,
  '',
  '## Interpretation',
  '',
  '- Current evidence means the family identity was found exactly (or through an explicitly reviewed alias) in the official Fontshare API.',
  '- Unmatched means only that the recovered catalog called the family “Fontshare”; it does **not** prove the current source, current license, or even that the family ever belonged to Fontshare.',
  '- Re-source each unmatched family from a primary source. Do not assign an OFL/FFL license through name similarity or historical memory.',
  '',
  '## Legacy / unmatched queue',
  '',
  '| Family | Recovered author | Recovered source URL | Raw license | Status |',
  '|---|---|---|---|---|',
];

for (const font of legacy) {
  lines.push(`| ${font.name.replaceAll('|', '\\|')} | ${font.author.replaceAll('|', '\\|')} | ${font.sourceUrl} | ${font.license.replaceAll('|', '\\|')} | Re-source from primary evidence |`);
}

lines.push('');
lines.push('## Current exact/reviewed Fontshare families');
lines.push('');
lines.push('These families have current official API evidence and are handled by the Fontshare canonical evidence/runtime pipeline:');
lines.push('');
lines.push(current.map(font => `- ${font.name}`).sort((a, b) => a.localeCompare(b)).join('\n'));
lines.push('');

writeFileSync(resolve(process.cwd(), 'docs/FONTSHARE-SOURCE-AUDIT.md'), `${lines.join('\n')}\n`);
console.log(`Fontshare source audit generated: ${current.length} current / ${legacy.length} legacy-unmatched from ${recovered.length} recovered Fontshare-tagged families.`);
