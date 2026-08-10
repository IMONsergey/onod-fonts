import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockFonts } from '../src/app/data/mockFonts.ts';

const API_URL = 'https://api.fontshare.com/v2/fonts';
const PAGE_SIZE = 100;
const evidencePath = resolve(process.cwd(), 'src/app/data/verified/fontshare.json');
const aliasesPath = resolve(process.cwd(), 'src/app/data/verified/fontshare-aliases.json');
const previous = JSON.parse(readFileSync(evidencePath, 'utf8'));
const reviewedAliases = JSON.parse(readFileSync(aliasesPath, 'utf8'));

const fontshareCatalog = mockFonts.filter(font => font.source === 'Fontshare');

const sortStrings = values => Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
const sha256 = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

const normalizeUrl = value => {
  if (!value) return undefined;
  if (value.startsWith('//')) return `https:${value}`;
  return value;
};

const publisherWebsite = publisher => publisher?.links?.find(link => link?.name?.toLowerCase() === 'website')?.url || undefined;

const normalizeFamily = family => {
  const designers = (family.designers || [])
    .map(designer => ({
      name: designer?.name || '',
      links: (designer?.links || [])
        .filter(link => link?.url)
        .map(link => ({ name: link.name || '', url: link.url }))
        .sort((a, b) => `${a.name}:${a.url}`.localeCompare(`${b.name}:${b.url}`)),
    }))
    .filter(designer => designer.name)
    .sort((a, b) => a.name.localeCompare(b.name));

  const axes = (family.axes || [])
    .map(axis => ({
      tag: axis.property || axis.name,
      min: axis.range_left,
      default: axis.range_default,
      max: axis.range_right,
    }))
    .filter(axis => axis.tag)
    .sort((a, b) => a.tag.localeCompare(b.tag));

  const styles = (family.styles || [])
    .map(style => ({
      id: style.id,
      name: style.weight?.name || style.weight?.label || '',
      label: style.weight?.label || style.weight?.name || '',
      weight: Number(style.weight?.weight) || 0,
      providerNumber: Number(style.weight?.number) || 0,
      italic: Boolean(style.is_italic),
      variable: Boolean(style.is_variable),
      default: Boolean(style.default),
      providerFileUrl: normalizeUrl(style.file),
      metrics: style.properties ? {
        ascender: style.properties.ascending_leading,
        descender: style.properties.descending_leading,
        capHeight: style.properties.cap_height,
        xHeight: style.properties.x_height,
        yMax: style.properties.y_max,
        yMin: style.properties.y_min,
        maxCharWidth: style.properties.max_char_width,
      } : undefined,
    }))
    .sort((a, b) => (a.variable === b.variable ? 0 : a.variable ? 1 : -1)
      || a.weight - b.weight
      || Number(a.italic) - Number(b.italic)
      || String(a.id).localeCompare(String(b.id)));

  const publisher = family.publisher ? {
    id: family.publisher.id,
    name: family.publisher.name || '',
    website: publisherWebsite(family.publisher),
  } : undefined;

  return {
    family: family.name,
    upstreamId: family.id,
    slug: family.slug,
    licenseType: family.license_type,
    category: family.category || undefined,
    script: family.script || undefined,
    languages: sortStrings(typeof family.languages === 'string' ? family.languages.split(',').map(value => value.trim()) : []),
    designers,
    publisher,
    displayPublisherAsDesigner: Boolean(family.display_publisher_as_designer),
    axes,
    styles,
    features: sortStrings((family.features || []).map(feature => feature?.tag)),
    tags: sortStrings((family.font_tags || []).map(tag => tag?.name)),
    version: family.version || undefined,
    sourceUrl: `https://fontshare.com/fonts/${family.slug}`,
  };
};

async function fetchAllFamilies() {
  const families = [];
  let offset = 0;

  while (true) {
    const url = `${API_URL}?offset=${offset}&limit=${PAGE_SIZE}&order_by=popularity`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'onod-fonts-data-engine/1.0',
      },
    });

    if (!response.ok) throw new Error(`Fontshare API ${response.status} for ${url}`);
    const payload = await response.json();
    if (!Array.isArray(payload.fonts)) throw new Error('Fontshare API response does not contain a fonts array.');

    families.push(...payload.fonts);
    if (!payload.has_more || payload.fonts.length === 0) break;
    offset += payload.fonts.length;

    if (offset > 1000) throw new Error('Fontshare pagination safety limit exceeded.');
  }

  return families;
}

const upstreamFamilies = await fetchAllFamilies();
const byName = new Map(upstreamFamilies.map(family => [family.name, family]));
const seenUpstreamIds = new Set();
const misses = [];
const collisions = [];
const next = {};
let exactMatches = 0;
let aliasMatches = 0;

for (const font of fontshareCatalog) {
  const reviewedUpstreamName = reviewedAliases[font.name];
  const candidate = byName.get(font.name) || (reviewedUpstreamName ? byName.get(reviewedUpstreamName) : undefined);

  if (!candidate) {
    misses.push(font.name);
    continue;
  }

  const identityIsExact = candidate.name === font.name;
  const identityIsReviewedAlias = reviewedUpstreamName === candidate.name;
  if (!identityIsExact && !identityIsReviewedAlias) {
    collisions.push(`${font.name} -> ${candidate.name}`);
    continue;
  }

  if (seenUpstreamIds.has(candidate.id)) {
    collisions.push(`${font.name} -> duplicate upstream id ${candidate.id}`);
    continue;
  }
  seenUpstreamIds.add(candidate.id);

  if (identityIsExact) exactMatches += 1;
  else aliasMatches += 1;

  const normalized = normalizeFamily(candidate);
  const sourceHash = sha256(normalized);
  const old = previous[font.name];
  next[font.name] = {
    ...normalized,
    sourceHash,
    capturedAt: old?.sourceHash === sourceHash && old?.capturedAt ? old.capturedAt : new Date().toISOString(),
  };
}

const minimumCoverage = Math.min(fontshareCatalog.length, 60);
if (Object.keys(next).length < minimumCoverage) {
  console.error(`Fontshare evidence coverage too low: ${Object.keys(next).length}/${fontshareCatalog.length}; expected at least ${minimumCoverage}.`);
  console.error(`Misses: ${misses.join(', ')}`);
  console.error(`Collisions: ${collisions.join(', ')}`);
  process.exit(1);
}

const ordered = Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(evidencePath, `${JSON.stringify(ordered, null, 2)}\n`);

const licenseTypes = Object.entries(ordered).reduce((counts, [, record]) => {
  const key = record.licenseType || 'missing';
  counts[key] = (counts[key] || 0) + 1;
  return counts;
}, {});

console.log(`Fontshare API returned ${upstreamFamilies.length} families.`);
console.log(`Catalog Fontshare queue: ${fontshareCatalog.length}; evidence: ${Object.keys(ordered).length}; exact: ${exactMatches}; reviewed aliases: ${aliasMatches}.`);
console.log(`License types in matched evidence: ${JSON.stringify(licenseTypes)}.`);
console.log(`Misses: ${misses.length}; unreviewed collisions: ${collisions.length}.`);
if (misses.length) console.log(`Missing families: ${misses.join(', ')}`);
if (collisions.length) collisions.forEach(value => console.warn(`COLLISION ${value}`));
