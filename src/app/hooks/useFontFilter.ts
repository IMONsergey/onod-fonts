import React from "react";
import { FilterState } from "@/components/FilterPanel";
import { Font } from "@/data/mockFonts";
import { getEffectiveLanguages, getEffectiveWeights, isEffectivelyVariable } from "@/lib/fontTrust";

export const useFontFilter = (fonts: Font[], filters: FilterState) => {
  return React.useMemo(() => {
    const searchLower = filters.search?.trim().toLowerCase() || "";

    return fonts.filter((font) => {
      if (searchLower) {
        const haystack = `${font.name} ${font.author} ${font.source} ${font.description} ${font.tags?.join(" ") || ""}`.toLowerCase();
        if (!haystack.includes(searchLower)) return false;
      }

      if (filters.categories.length > 0) {
        const hasCategory = filters.categories.some(filterCategory => font.categories.includes(filterCategory));
        if (!hasCategory) return false;
      }

      if (filters.languages.length > 0) {
        const effectiveLanguages = getEffectiveLanguages(font);
        const hasLanguage = filters.languages.some(language =>
          effectiveLanguages.some(candidate => candidate.toLowerCase() === language.toLowerCase()),
        );
        if (!hasLanguage) return false;
      }

      if (filters.sources.length > 0 && !filters.sources.includes(font.source)) return false;

      if (filters.variableOnly && !isEffectivelyVariable(font)) return false;

      if (filters.licenses.length > 0) {
        const hasLicense = filters.licenses.some(license =>
          font.license === license || font.license.toLowerCase().includes(license.toLowerCase()),
        );
        if (!hasLicense) return false;
      }

      if (filters.minWeights && getEffectiveWeights(font).length < filters.minWeights) return false;

      return true;
    });
  }, [fonts, filters]);
};
