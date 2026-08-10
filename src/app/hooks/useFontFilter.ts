import React from "react";
import { FilterState } from "@/components/FilterPanel";
import { Font } from "@/data/mockFonts";
import { getEffectiveLanguages, getEffectiveWeights, isEffectivelyVariable } from "@/lib/fontTrust";

const toRuntimeSafeFont = (font: Font): Font => ({
  ...font,
  weights: getEffectiveWeights(font),
  variable: isEffectivelyVariable(font),
  languages: getEffectiveLanguages(font),
});

export const useFontFilter = (fonts: Font[], filters: FilterState) => {
  return React.useMemo(() => {
    const searchLower = filters.search?.trim().toLowerCase() || "";

    return fonts.filter((font) => {
      if (searchLower) {
        const haystack = `${font.name} ${font.author} ${font.source} ${font.description} ${font.tags?.join(" ") || ""}`.toLowerCase();
        if (!haystack.includes(searchLower)) return false;
      }

      if (filters.categories.length > 0 && !filters.categories.some(category => font.categories.includes(category))) return false;

      if (filters.languages.length > 0) {
        const languages = getEffectiveLanguages(font);
        if (!filters.languages.some(language => languages.some(candidate => candidate.toLowerCase() === language.toLowerCase()))) return false;
      }

      if (filters.sources.length > 0 && !filters.sources.includes(font.source)) return false;
      if (filters.variableOnly && !isEffectivelyVariable(font)) return false;

      if (filters.licenses.length > 0 && !filters.licenses.some(license => font.license === license || font.license.toLowerCase().includes(license.toLowerCase()))) return false;
      if (filters.minWeights && getEffectiveWeights(font).length < filters.minWeights) return false;

      return true;
    }).map(toRuntimeSafeFont);
  }, [fonts, filters]);
};
