import React from "react";
import { FilterState } from "@/components/FilterPanel";
import { Font } from "@/data/mockFonts";
import { getEffectiveAuthor, getEffectiveFamilyName, getEffectiveLanguages, getEffectiveSourceLabel, getEffectiveSourceUrl, getEffectiveWeights, getFontTrustReport, isEffectivelyVariable } from "@/lib/fontTrust";

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
    const searchLower = filters.search?.trim().toLowerCase() || "";

    return fonts
      .filter((font) => {
        const familyName = getEffectiveFamilyName(font);
        const author = getEffectiveAuthor(font);
        const source = getEffectiveSourceLabel(font);
        const sourceUrl = getEffectiveSourceUrl(font);
        const trust = getFontTrustReport(font);

        if (searchLower) {
          const haystack = `${familyName} ${font.name} ${author} ${source} ${sourceUrl} ${trust.licenseLabel} ${font.description} ${font.tags?.join(" ") || ""}`.toLowerCase();
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

        if (filters.sources.length > 0 && !filters.sources.includes(source)) return false;
        if (filters.variableOnly && !isEffectivelyVariable(font)) return false;

        if (filters.licenses.length > 0) {
          const label = trust.licenseLabel.toLowerCase();
          const hasLicense = filters.licenses.some(license => label === license.toLowerCase() || label.includes(license.toLowerCase()));
          if (!hasLicense) return false;
        }

        if (filters.minWeights && getEffectiveWeights(font).length < filters.minWeights) return false;
        return true;
      })
      .map(toRuntimeSafeFont);
  }, [fonts, filters]);
};
