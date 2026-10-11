export interface CatalogSearchEntry {
  id: string;
  name: string;
  canonicalName?: string;
  aliases?: string[];
  author?: string;
  description?: string;
  tags?: string[];
  source?: string;
  categories?: string[];
}

export interface CatalogRank {
  tier: number;
  name: string;
  id: string;
}

export function normalizeCatalogText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function rankCatalogEntry(entry: CatalogSearchEntry, rawQuery: string): CatalogRank | null {
  const query = normalizeCatalogText(rawQuery);
  const name = normalizeCatalogText(entry.canonicalName || entry.name);
  const originalName = normalizeCatalogText(entry.name);
  const aliases = (entry.aliases || []).map(normalizeCatalogText).filter(Boolean);
  const queryTokens = query.split(" ").filter(Boolean);
  const nameTokens = `${name} ${originalName}`.split(" ").filter(Boolean);

  if (!query) return { tier: 6, name, id: entry.id };
  if (name === query || originalName === query) return { tier: 0, name, id: entry.id };
  if (aliases.some(alias => alias === query)) return { tier: 1, name, id: entry.id };
  if (name.startsWith(query) || originalName.startsWith(query) || aliases.some(alias => alias.startsWith(query))) {
    return { tier: 2, name, id: entry.id };
  }
  if (queryTokens.every(token => nameTokens.some(candidate => candidate.startsWith(token)))) {
    return { tier: 3, name, id: entry.id };
  }

  const author = normalizeCatalogText(entry.author || "");
  if (author.includes(query)) return { tier: 4, name, id: entry.id };

  const supportingText = normalizeCatalogText([
    entry.description,
    entry.source,
    ...(entry.tags || []),
    ...(entry.categories || []),
    ...aliases,
  ].filter(Boolean).join(" "));
  if (supportingText.includes(query) || queryTokens.every(token => supportingText.includes(token))) {
    return { tier: 5, name, id: entry.id };
  }

  return null;
}

export function compareCatalogRanks(a: CatalogRank, b: CatalogRank) {
  return a.tier - b.tier
    || a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true })
    || a.id.localeCompare(b.id);
}
