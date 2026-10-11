import type { Font } from "@/data/mockFonts";
import googleAliasesJson from "@/data/verified/google-fonts-aliases.json";
import fontshareAliasesJson from "@/data/verified/fontshare-aliases.json";
import artifactAliasesJson from "@/data/verified/artifacts/family-aliases.json";
import {
  getEffectiveAuthor,
  getEffectiveFamilyName,
  getEffectiveLanguages,
  getEffectiveSourceLabel,
  getEffectiveWeights,
  getFontTrustReport,
  isEffectivelyVariable,
} from "@/lib/fontTrust";
import { rankCatalogEntry } from "@/lib/catalogRanking";

export interface CatalogFilterState {
  search: string;
  categories: string[];
  languages: string[];
  variableOnly: boolean;
  licenses: string[];
  sources: string[];
  minWeights?: number;
}

export type FilterGroup = "search" | "categories" | "languages" | "variable" | "licenses" | "sources" | "weights";

const aliasesByFamily = new Map<string, string[]>();

function addAlias(family: string, alias: string) {
  const current = aliasesByFamily.get(family) || [];
  if (!current.includes(alias)) aliasesByFamily.set(family, [...current, alias]);
}

Object.entries(googleAliasesJson as Record<string, string>).forEach(([alias, family]) => addAlias(family, alias));
Object.entries(fontshareAliasesJson as Record<string, string>).forEach(([alias, family]) => addAlias(family, alias));
Object.entries(artifactAliasesJson as Record<string, string[]>).forEach(([family, aliases]) => {
  aliases.forEach(alias => addAlias(family, alias));
});

export function getCatalogAliases(font: Font) {
  const familyName = getEffectiveFamilyName(font);
  return Array.from(new Set([
    ...(aliasesByFamily.get(familyName) || []),
    ...(aliasesByFamily.get(font.name) || []),
    ...(familyName !== font.name ? [font.name] : []),
  ]));
}

export function getCatalogSearchRank(font: Font, query: string) {
  return rankCatalogEntry({
    id: font.id,
    name: font.name,
    canonicalName: getEffectiveFamilyName(font),
    aliases: getCatalogAliases(font),
    author: getEffectiveAuthor(font),
    description: font.description,
    tags: font.tags,
    source: getEffectiveSourceLabel(font),
    categories: font.categories,
  }, query);
}

export function fontMatchesCatalogFilters(font: Font, filters: CatalogFilterState, ignored?: FilterGroup) {
  if (ignored !== "search" && filters.search.trim() && !getCatalogSearchRank(font, filters.search)) return false;

  if (ignored !== "categories" && filters.categories.length > 0) {
    if (!filters.categories.some(category => font.categories.includes(category))) return false;
  }

  if (ignored !== "languages" && filters.languages.length > 0) {
    const languages = getEffectiveLanguages(font).map(language => language.toLocaleLowerCase());
    if (!filters.languages.some(language => languages.includes(language.toLocaleLowerCase()))) return false;
  }

  if (ignored !== "sources" && filters.sources.length > 0) {
    if (!filters.sources.includes(getEffectiveSourceLabel(font))) return false;
  }

  if (ignored !== "variable" && filters.variableOnly && !isEffectivelyVariable(font)) return false;

  if (ignored !== "licenses" && filters.licenses.length > 0) {
    const license = getFontTrustReport(font).licenseLabel.toLocaleLowerCase();
    if (!filters.licenses.some(candidate => license.includes(candidate.toLocaleLowerCase()))) return false;
  }

  if (ignored !== "weights" && filters.minWeights && getEffectiveWeights(font).length < filters.minWeights) return false;
  return true;
}
