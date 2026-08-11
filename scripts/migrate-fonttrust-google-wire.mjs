import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const path = resolve(process.cwd(), 'src/app/lib/fontTrust.ts');
let source = readFileSync(path, 'utf8');

const replacements = [
  [
    'import verifiedGoogleFontsJson from "../data/verified/.generated/google-fonts-runtime.json" with { type: "json" };',
    'import { getGoogleRuntimeFont, type VerifiedGoogleRuntimeFont } from "./googleRuntimeWire";',
  ],
  [
`interface VerifiedGoogleFont {
  family: string;
  designer: string;
  license: string;
  subsets: string[];
  axes: Record<string, { min: number; default?: number; max: number }>;
  weights: number[];
  repositoryUrl?: string;
  metadataPath: string;
}`,
    'type VerifiedGoogleFont = VerifiedGoogleRuntimeFont;',
  ],
  [
    'const verifiedGoogleFonts = verifiedGoogleFontsJson as Record<string, VerifiedGoogleFont>;\n',
    '',
  ],
  [
`export function getVerifiedGoogleFont(font: Font): VerifiedGoogleFont | undefined {
  const candidate = verifiedGoogleFonts[font.name];
  if (!candidate || candidate.family !== font.name) return undefined;
  return candidate;
}`,
`export function getVerifiedGoogleFont(font: Font): VerifiedGoogleFont | undefined {
  const candidate = getGoogleRuntimeFont(font.name);
  if (!candidate || candidate.family !== font.name) return undefined;
  return candidate;
}`,
  ],
];

for (const [before, after] of replacements) {
  if (!source.includes(before)) throw new Error(`Migration pattern not found:\n${before}`);
  source = source.replace(before, after);
}

writeFileSync(path, source);
console.log('fontTrust.ts now reads Google metadata through the compact runtime wire adapter.');
