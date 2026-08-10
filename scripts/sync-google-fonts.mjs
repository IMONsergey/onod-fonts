import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockFonts } from '../src/app/data/mockFonts.ts';

const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('GITHUB_TOKEN is required for Google Fonts metadata sync.');

const target = resolve(process.cwd(), 'src/app/data/verified/google-fonts.json');
const previous = JSON.parse(readFileSync(target, 'utf8'));

const NON_GOOGLE_SOURCES = new Set([
  'Fontshare', 'Velvetyne', 'Collletttivo', 'Font Library', 'iA', 'GNU', 'DejaVu', 'Liberation', 'GitHub', 'GitHub Next',
]);

const candidates = mockFonts.filter(font =>
  !font.customCssUrl &&
  font.source !== 'Fontshare' &&
  !NON_GOOGLE_SOURCES.has(font.source),
);

const slugify = name => name
  .normalize('NFKD')
  .replace(/\p{Diacritic}/gu, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

const allQuoted = (text, key) => Array.from(text.matchAll(new RegExp(`^${key}:\\s*"([^"]*)"`, 'gm')), match => match[1]);
const firstQuoted = (text, key) => allQuoted(text, key)[0] || '';
const firstNumber = (text, key) => {
  const match = text.match(new RegExp(`^${key}:\\s*(-?\\d+(?:\\.\\d+)?)`, 'm'));
  return match ? Number(match[1]) : undefined;
};
const blocks = (text, blockName) => Array.from(text.matchAll(new RegExp(`${blockName}\\s*\\{([\\s\\S]*?)\\n\\}`, 'g')), match => match[1]);

const parseMetadata = (text, metadataPath, metadataSha) => {
  const axes = {};
  for (const block of blocks(text, 'axes')) {
    const tag = firstQuoted(block, 'tag');
    const min = firstNumber(block, 'min_value');
    const max = firstNumber(block, 'max_value');
    if (tag && Number.isFinite(min) && Number.isFinite(max)) axes[tag] = { min, max };
  }

  const weights = [];
  const styles = [];
  for (const block of blocks(text, 'fonts')) {
    const weight = firstNumber(block, 'weight');
    const style = firstQuoted(block, 'style');
    if (Number.isFinite(weight)) weights.push(weight);
    if (style) styles.push(style);
  }

  const repositoryUrl = firstQuoted(text, 'repository_url') || undefined;
  return {
    family: firstQuoted(text, 'name'),
    designer: firstQuoted(text, 'designer'),
    license: firstQuoted(text, 'license'),
    categories: Array.from(new Set(allQuoted(text, 'category'))),
    subsets: Array.from(new Set(allQuoted(text, 'subsets'))),
    axes,
    weights: Array.from(new Set(weights)).sort((a, b) => a - b),
    styles: Array.from(new Set(styles)).sort(),
    ...(repositoryUrl ? { repositoryUrl } : {}),
    metadataPath,
    metadataSha,
  };
};

const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'onod-fonts-metadata-sync',
};

async function fetchFamily(font) {
  const slug = slugify(font.name);
  for (const bucket of ['ofl', 'apache', 'ufl']) {
    const metadataPath = `${bucket}/${slug}/METADATA.pb`;
    const url = `https://api.github.com/repos/google/fonts/contents/${metadataPath}?ref=main`;
    const response = await fetch(url, { headers });
    if (response.status === 404) continue;
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`${font.name}: Google Fonts API ${response.status}: ${body.slice(0, 300)}`);
    }
    const payload = await response.json();
    if (!payload.content || payload.encoding !== 'base64') throw new Error(`${font.name}: unexpected GitHub contents payload for ${metadataPath}`);
    const text = Buffer.from(payload.content.replace(/\n/g, ''), 'base64').toString('utf8');
    const parsed = parseMetadata(text, metadataPath, payload.sha);
    if (!parsed.family || !parsed.license) throw new Error(`${font.name}: incomplete METADATA.pb at ${metadataPath}`);
    return parsed;
  }
  return null;
}

let cursor = 0;
let success = 0;
const misses = [];
const failures = [];
const fetched = {};

async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= candidates.length) return;
    const font = candidates[index];
    try {
      const metadata = await fetchFamily(font);
      if (metadata) {
        fetched[font.name] = metadata;
        success += 1;
      } else {
        misses.push(font.name);
      }
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }

    if ((index + 1) % 100 === 0) console.log(`Processed ${index + 1}/${candidates.length} candidates...`);
  }
}

await Promise.all(Array.from({ length: 8 }, () => worker()));

if (failures.length > 20) {
  console.error(`Metadata sync aborted: ${failures.length} upstream/API failures.`);
  failures.slice(0, 20).forEach(item => console.error(`  ${item}`));
  process.exit(1);
}

const minimumCoverage = Math.min(600, Math.ceil(candidates.length * 0.5));
if (success < minimumCoverage && Object.keys(previous).length === 0) {
  console.error(`Metadata sync coverage too low for first import: ${success}/${candidates.length}; expected at least ${minimumCoverage}.`);
  console.error(`First misses: ${misses.slice(0, 50).join(', ')}`);
  process.exit(1);
}

const candidateNames = new Set(candidates.map(font => font.name));
const next = {};
for (const [name, metadata] of Object.entries(previous)) if (candidateNames.has(name)) next[name] = metadata;
Object.assign(next, fetched);

const ordered = Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(target, `${JSON.stringify(ordered, null, 2)}\n`);

console.log(`Google Fonts metadata sync complete: ${success}/${candidates.length} refreshed; ${Object.keys(ordered).length} versioned verified records total.`);
console.log(`Not found in google/fonts by normalized family slug: ${misses.length}.`);
if (misses.length) console.log(`Sample misses: ${misses.slice(0, 40).join(', ')}`);
if (failures.length) {
  console.warn(`Transient/API failures preserved from previous overlay: ${failures.length}.`);
  failures.slice(0, 10).forEach(item => console.warn(`  ${item}`));
}
