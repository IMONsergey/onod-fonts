import React from "react";
import { FilterState } from "@/components/FilterPanel";
import { Font } from "@/data/mockFonts";

export const useFontFilter = (fonts: Font[], filters: FilterState) => {
  return React.useMemo(() => {
    const searchLower = filters.search?.toLowerCase() || "";

    return fonts.filter((font) => {
      // Search — match name, author, source, description, tags
      if (searchLower) {
        const haystack = `${font.name} ${font.author} ${font.source} ${font.description} ${font.tags?.join(" ") || ""}`.toLowerCase();
        if (!haystack.includes(searchLower)) return false;
      }
      // Categories (Array check)
      if (filters.categories.length > 0) {
        const hasCategory = filters.categories.some(filterCat => 
            font.categories.some(fontCat => fontCat.includes(filterCat) || filterCat.includes(fontCat))
        );
        if (!hasCategory) return false;
      }
      // Languages
      if (filters.languages.length > 0) {
        const hasLanguage = filters.languages.some((lang) => 
             font.languages.some(l => l.toLowerCase().includes(lang.toLowerCase()))
        );
        if (!hasLanguage) return false;
      }
      // Sources
      if (filters.sources.length > 0) {
          if (!filters.sources.includes(font.source)) {
              return false;
          }
      }
      // Variable
      if (filters.variableOnly && !font.variable) {
        return false;
      }
      // Licenses
      if (filters.licenses.length > 0 && !filters.licenses.includes(font.license)) {
        const hasLicense = filters.licenses.some(l => font.license.includes(l));
        if (!hasLicense) return false;
      }
      // Min Weights
      if (filters.minWeights && font.weights.length < filters.minWeights) {
        return false;
      }
      return true;
    });
  }, [fonts, filters]);
};