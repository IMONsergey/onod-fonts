import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inspectSfnt } from './inspect-sfnt.mjs';

const token = process.env.GITHUB_TOKEN;
const sourcePath = resolve(process.cwd(), 'src/app/data/verified/independent-sources.json');
const targetPath = resolve(process.cwd(), 'src/app/data/verified/artifacts/open-fonts.json');
const sources = JSON.parse(readFileSync(sourcePath, 'utf8'));
const previous = JSON.parse(readFileSync(targetPath, 'utf8'));

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'onod-fonts-artifact-inspector/1.0',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

const rawUrl = (repository, ref, path) => `https://raw.githubusercontent.com/${repository}/${encodeURIComponent(ref)}/${path.split('/').map(encodeURIComponent).join('/')}`;

const normalizedFamilyToken = value => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const scoreCandidate = (family, path) => {
  const lower = path.toLowerCase();
  const compact = lower.replace(/[^a-z0-9]/g, '');
  let score = 0;
  if (/\.(ttf|otf)$/i.test(path)) score += 100;
  if (lower.includes('/fonts/') || lower.startsWith('fonts/')) score += 30;
  if (/(variable|\bvf\b|\[.*\])/.test(lower)) score += 45;
  if (compact.includes(normalizedFamilyToken(family))) score += 35;
  if (/(regular|roman)/.test(lower)) score += 10;
  if (/(italic|oblique)/.test(lower)) score -= 8;
  if (/(test|demo|sample|specimen|subset|webfont)/.test(lower)) score -= 80;
  if (/(node_modules|vendor|dist|build)/.test(lower)) score -= 100;
  return score;
};

async function fetchJson(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`GitHub API ${response.status} for ${url}: ${(await response.text()).slice(0, 300)}`);
  return response.json();
}

async function fetchBuffer(url) {
  const response = await fetch(url, { headers: { 'User-Agent': headers['User-Agent'] } });
  if (!response.ok) throw new Error(`Raw artifact ${response.status} for ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function discoverArtifact(family, record) {
  const repository = record.identity.repository;
  const ref = record.identity.evidence.ref;
  const treeUrl = `https://api.github.com/repos/${repository}/git/trees/${encodeURIComponent(ref)}?recursive=1`;
  const tree = await fetchJson(treeUrl);
  if (!Array.isArray(tree.tree)) throw new Error(`${family}: GitHub tree response missing tree array.`);
  if (tree.truncated) throw new Error(`${family}: recursive GitHub tree is truncated; explicit artifact path is required before inspection.`);

  const candidates = tree.tree
    .filter(item => item.type === 'blob' && /\.(ttf|otf)$/i.test(item.path || ''))
    .map(item => ({ path: item.path, blobSha: item.sha, score: scoreCandidate(family, item.path) }))
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));

  if (!candidates.length) return null;
  return { repository, ref, ...candidates[0] };
}

const eligible = Object.entries(sources)
  .filter(([, record]) => record?.identity?.status === 'verified')
  .filter(([, record]) => record?.identity?.sourceType === 'official-github')
  .filter(([, record]) => record?.license?.status === 'verified' && record?.license?.id === 'OFL-1.1');

const output = {};
const failures = [];

for (const [family, record] of eligible) {
  try {
    const artifact = await discoverArtifact(family, record);
    if (!artifact) {
      failures.push(`${family}: no TTF/OTF artifact found in reviewed repository.`);
      continue;
    }

    const sourceUrl = rawUrl(artifact.repository, artifact.ref, artifact.path);
    const buffer = await fetchBuffer(sourceUrl);
    const inspected = inspectSfnt(buffer, {
      family,
      repository: artifact.repository,
      ref: artifact.ref,
      path: artifact.path,
      gitBlobSha: artifact.blobSha,
      sourceUrl,
      licenseId: record.license.id,
    });

    const old = previous[family];
    output[family] = {
      ...inspected,
      capturedAt: old?.sha256 === inspected.sha256 && old?.capturedAt ? old.capturedAt : new Date().toISOString(),
    };
    console.log(`${family}: ${artifact.path} -> ${inspected.sha256.slice(0, 12)} / ${inspected.cmap?.codepointCount || 0} codepoints / ${inspected.maxp?.numGlyphs || 0} glyphs.`);
  } catch (error) {
    failures.push(`${family}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const ordered = Object.fromEntries(Object.entries(output).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(targetPath, `${JSON.stringify(ordered, null, 2)}\n`);

const minimum = Math.min(eligible.length, 3);
console.log(`Open artifact acquisition: eligible=${eligible.length}; inspected=${Object.keys(ordered).length}; failures=${failures.length}.`);
if (failures.length) failures.forEach(value => console.warn(`  WARN ${value}`));
if (Object.keys(ordered).length < minimum) {
  console.error(`Artifact inspection coverage too low: ${Object.keys(ordered).length}/${eligible.length}; expected at least ${minimum}.`);
  process.exit(1);
}
