import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const artifacts = JSON.parse(readFileSync(resolve(process.cwd(), 'src/app/data/verified/artifacts/open-fonts.json'), 'utf8'));
const lines = [
  '# ONOD Fonts — open font artifact inspection',
  '',
  '> Generated from hash-addressed TTF/OTF evidence acquired only from independently verified OFL-1.1 official repositories. Font binaries are inspected in CI but are not mirrored into this repository.',
  '',
  `Inspected representative artifacts: **${Object.keys(artifacts).length}**`,
  '',
  '| Family | Artifact | SHA-256 | Glyphs | Codepoints | Variable axes | GSUB | GPOS |',
  '|---|---|---|---:|---:|---|---:|---:|',
];

for (const [family, record] of Object.entries(artifacts).sort(([a], [b]) => a.localeCompare(b))) {
  const axes = (record.fvar?.axes || []).map(axis => `${axis.tag} ${axis.min}–${axis.max}`).join(', ') || '—';
  lines.push(`| ${family.replaceAll('|', '\\|')} | ${record.path.replaceAll('|', '\\|')} | \`${String(record.sha256).slice(0, 16)}…\` | ${record.maxp?.numGlyphs || 0} | ${record.cmap?.codepointCount || 0} | ${axes.replaceAll('|', '\\|')} | ${(record.openTypeFeatures?.gsub || []).length} | ${(record.openTypeFeatures?.gpos || []).length} |`);
}

lines.push('');
lines.push('## Evidence rules');
lines.push('');
lines.push('- Artifact identity must agree with the catalog family through the font `name` table.');
lines.push('- Each artifact stores both Git blob SHA and content SHA-256.');
lines.push('- Provider/source license evidence remains authoritative for legal semantics; embedded font metadata does not silently override it.');
lines.push('- ITF FFL / permission-required binaries are excluded from this acquisition pipeline.');
lines.push('- `cmap`/OpenType extraction here is technical evidence; user-facing language intelligence remains a later dedicated phase.');
lines.push('');

writeFileSync(resolve(process.cwd(), 'docs/ARTIFACT-INSPECTION.md'), `${lines.join('\n')}\n`);
console.log(`Artifact inspection report generated for ${Object.keys(artifacts).length} representative binaries.`);
