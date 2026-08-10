import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockFonts } from '../src/app/data/mockFonts.ts';
import { getFontTrustReport } from '../src/app/lib/fontTrust.ts';

const debt = mockFonts.filter(font => {
  const trust = getFontTrustReport(font);
  return trust.confidence === 'derived' || trust.licenseLabel === 'Verify at source';
});

const bySource = new Map();
for (const font of debt) {
  const bucket = bySource.get(font.source) || [];
  bucket.push(font);
  bySource.set(font.source, bucket);
}

const lines = [
  '# ONOD Fonts — trust debt',
  '',
  '> Generated from the canonical catalog and runtime trust layer. Do not hand-edit counts; regenerate after metadata enrichment.',
  '',
  `Total catalog families: **${mockFonts.length}**`,
  `Remaining trust-debt families: **${debt.length}**`,
  `Fully clear families: **${mockFonts.length - debt.length}**`,
  '',
  'A family stays in this report when metadata is still derived or when the exact license identifier must still be verified at the primary source.',
  '',
  '## Sources',
  '',
];

for (const [source, fonts] of Array.from(bySource.entries()).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))) {
  lines.push(`### ${source} — ${fonts.length}`);
  lines.push('');
  lines.push('| Family | Raw license | Source URL |');
  lines.push('|---|---|---|');
  for (const font of fonts.sort((a, b) => a.name.localeCompare(b.name))) {
    lines.push(`| ${font.name.replaceAll('|', '\\|')} | ${font.license.replaceAll('|', '\\|')} | ${font.sourceUrl} |`);
  }
  lines.push('');
}

writeFileSync(resolve(process.cwd(), 'docs/TRUST-DEBT.md'), `${lines.join('\n')}\n`);
console.log(`Trust debt report generated: ${debt.length}/${mockFonts.length} families across ${bySource.size} sources.`);
