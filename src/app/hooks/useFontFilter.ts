import React from "react";
import { FilterState } from "@/components/FilterPanel";
import { Font } from "@/data/mockFonts";
import { getEffectiveAuthor, getEffectiveLanguages, getEffectiveSourceLabel, getEffectiveSourceUrl, getEffectiveWeights, getFontTrustReport, isEffectivelyVariable } from "@/lib/fontTrust";
import { compareCatalogRanks } from "@/lib/catalogRanking";
import { fontMatchesCatalogFilters, getCatalogSearchRank } from "@/lib/catalogFilter";

const toRuntimeSafeFont = (font: Font): Font => {
  const trust = getFontTrustReport(font);
  return {
    ...font,
    author: getEffectiveAuthor(font),
    source: getEffectiveSourceLabel(font),
    sourceUrl: getEffectiveSourceUrl(font),
    license: trust.licenseLabel,
    weights: getEffectiveWeights(font),
    variable: isEffectivelyVariable(font),
    languages: getEffectiveLanguages(font),
  };
};

export const useFontFilter = (fonts: Font[], filters: FilterState) => {
  return React.useMemo(() => {
    const filtered = fonts.filter(font => fontMatchesCatalogFilters(font, filters));
    const query = filters.search.trim();
    if (query) {
      filtered.sort((a, b) => {
        const aRank = getCatalogSearchRank(a, query);
        const bRank = getCatalogSearchRank(b, query);
        if (!aRank || !bRank) return aRank ? -1 : bRank ? 1 : 0;
        return compareCatalogRanks(aRank, bRank);
      });
    }
    return filtered.map(toRuntimeSafeFont);
  }, [fonts, filters]);
};
