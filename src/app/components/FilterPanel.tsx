import React from "react";
import { ChevronDown, RotateCcw, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/lib/i18n";
import { mockFonts, type Font } from "@/data/mockFonts";
import { getEffectiveLanguages, isEffectivelyVariable } from "@/lib/fontTrust";
import { fontMatchesCatalogFilters, type CatalogFilterState } from "@/lib/catalogFilter";

export interface FilterState extends CatalogFilterState {}

interface FilterPanelProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  fonts?: Font[];
}

interface FilterCheckboxProps {
  id: string;
  value: string;
  checked: boolean;
  count: number;
  onToggle: () => void;
}

const CATEGORY_ORDER = ["sans-serif", "serif", "display", "handwriting", "monospaced"];
const COMMON_SCRIPTS = ["Latin", "Cyrillic"];

function safeId(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function FilterCheckbox({ id, value, checked, count, onToggle }: FilterCheckboxProps) {
  return (
    <div className="group flex min-h-10 min-w-0 items-center gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onToggle}
        disabled={!checked && count === 0}
        className="size-[18px] rounded-none border-neutral-500 data-[state=checked]:bg-neutral-900 data-[state=checked]:text-white"
      />
      <Label htmlFor={id} className="min-w-0 flex-1 cursor-pointer select-none truncate font-mono text-[11px] uppercase text-neutral-700 transition-colors group-hover:text-black">
        {value}
      </Label>
      <span className="shrink-0 font-mono text-[11px] tabular-nums text-neutral-500" aria-label={`${count} results`}>
        {count}
      </span>
    </div>
  );
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, setFilters, fonts = mockFonts }) => {
  const { t, language } = useLanguage();
  const idPrefix = React.useId();
  const [showOtherScripts, setShowOtherScripts] = React.useState(false);
  const [scriptSearch, setScriptSearch] = React.useState("");

  const facets = React.useMemo(() => {
    const allCategories = new Set<string>();
    const allLanguages = new Set<string>();
    fonts.forEach(font => {
      font.categories.forEach(category => allCategories.add(category));
      getEffectiveLanguages(font).forEach(script => allLanguages.add(script));
    });

    const categoryContext = fonts.filter(font => fontMatchesCatalogFilters(font, filters, "categories"));
    const languageContext = fonts.filter(font => fontMatchesCatalogFilters(font, filters, "languages"));
    const variableContext = fonts.filter(font => fontMatchesCatalogFilters(font, filters, "variable"));
    const categoryCounts: Record<string, number> = {};
    const languageCounts: Record<string, number> = {};

    allCategories.forEach(category => {
      categoryCounts[category] = categoryContext.filter(font => font.categories.includes(category)).length;
    });
    allLanguages.forEach(script => {
      languageCounts[script] = languageContext.filter(font => (
        getEffectiveLanguages(font).some(candidate => candidate.toLocaleLowerCase() === script.toLocaleLowerCase())
      )).length;
    });

    const categories = Array.from(allCategories).sort((a, b) => {
      const aIndex = CATEGORY_ORDER.indexOf(a);
      const bIndex = CATEGORY_ORDER.indexOf(b);
      return (aIndex < 0 ? 99 : aIndex) - (bIndex < 0 ? 99 : bIndex) || a.localeCompare(b);
    });
    const languages = Array.from(allLanguages).sort((a, b) => {
      const aIndex = COMMON_SCRIPTS.indexOf(a);
      const bIndex = COMMON_SCRIPTS.indexOf(b);
      return (aIndex < 0 ? 99 : aIndex) - (bIndex < 0 ? 99 : bIndex)
        || (languageCounts[b] || 0) - (languageCounts[a] || 0)
        || a.localeCompare(b);
    });

    return {
      categories,
      languages,
      categoryCounts,
      languageCounts,
      variableCount: variableContext.filter(isEffectivelyVariable).length,
    };
  }, [filters, fonts]);

  const resetFilters = () => setFilters({
    search: "",
    categories: [],
    languages: [],
    variableOnly: false,
    licenses: [],
    sources: [],
    minWeights: undefined,
  });

  const toggleArrayFilter = (key: "categories" | "languages", value: string) => {
    setFilters(previous => ({
      ...previous,
      [key]: previous[key].includes(value)
        ? previous[key].filter(item => item !== value)
        : [...previous[key], value],
    }));
  };

  const commonScripts = facets.languages.filter(script => (
    COMMON_SCRIPTS.includes(script) || filters.languages.includes(script)
  ));
  const otherScripts = facets.languages.filter(script => !COMMON_SCRIPTS.includes(script) && !filters.languages.includes(script));
  const visibleOtherScripts = otherScripts.filter(script => script.toLocaleLowerCase().includes(scriptSearch.trim().toLocaleLowerCase()));

  return (
    <form className="h-full w-full overflow-y-auto bg-white px-5 py-5" onSubmit={event => event.preventDefault()}>
      <div className="flex min-h-11 items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <h2 className="font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-neutral-900">{t("filters.title")}</h2>
        <button type="button" onClick={resetFilters} className="onod-button onod-button--quiet px-2">
          <RotateCcw className="size-3.5" aria-hidden="true" />
          {t("filters.reset")}
        </button>
      </div>

      <div className="flex min-h-16 items-center justify-between gap-4 border-b border-neutral-200 py-3">
        <div>
          <Label htmlFor={`${idPrefix}-variable`} className="cursor-pointer font-mono text-[11px] uppercase text-neutral-800">
            {language === "ru" ? "Вариативные" : "Variable"}
          </Label>
          <div className="mt-1 font-mono text-[11px] tabular-nums text-neutral-500">{facets.variableCount}</div>
        </div>
        <Switch
          id={`${idPrefix}-variable`}
          checked={filters.variableOnly}
          onCheckedChange={checked => setFilters(previous => ({ ...previous, variableOnly: checked }))}
          className="h-6 w-10 rounded-none border-neutral-400 data-[state=checked]:bg-neutral-900"
        />
      </div>

      <fieldset className="border-b border-neutral-200 py-5">
        <legend className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-600">{t("filters.categories")}</legend>
        <div>
          {facets.categories.map(category => (
            <FilterCheckbox
              key={category}
              id={`${idPrefix}-category-${safeId(category)}`}
              value={category}
              checked={filters.categories.includes(category)}
              count={facets.categoryCounts[category] || 0}
              onToggle={() => toggleArrayFilter("categories", category)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="py-5">
        <legend className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-600">{t("filters.languages")}</legend>
        <div>
          {commonScripts.map(script => (
            <FilterCheckbox
              key={script}
              id={`${idPrefix}-script-${safeId(script)}`}
              value={script}
              checked={filters.languages.includes(script)}
              count={facets.languageCounts[script] || 0}
              onToggle={() => toggleArrayFilter("languages", script)}
            />
          ))}
        </div>

        {otherScripts.length > 0 && (
          <div className="mt-2 border-t border-neutral-100 pt-2">
            <button
              type="button"
              className="onod-button onod-button--quiet w-full justify-between px-0"
              aria-expanded={showOtherScripts}
              onClick={() => setShowOtherScripts(value => !value)}
            >
              <span>{language === "ru" ? "Другие письменности" : "Other scripts"} ({otherScripts.length})</span>
              <ChevronDown className={`size-4 transition-transform ${showOtherScripts ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            {showOtherScripts && (
              <div className="pt-2">
                {otherScripts.length > 6 && (
                  <label className="relative mb-2 block">
                    <span className="sr-only">{language === "ru" ? "Поиск письменности" : "Search scripts"}</span>
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
                    <input
                      type="search"
                      value={scriptSearch}
                      onChange={event => setScriptSearch(event.target.value)}
                      placeholder={language === "ru" ? "Поиск письменности" : "Search scripts"}
                      className="onod-input h-10 w-full pl-8 font-mono text-[11px] uppercase"
                    />
                  </label>
                )}
                {visibleOtherScripts.map(script => (
                  <FilterCheckbox
                    key={script}
                    id={`${idPrefix}-script-${safeId(script)}`}
                    value={script}
                    checked={false}
                    count={facets.languageCounts[script] || 0}
                    onToggle={() => toggleArrayFilter("languages", script)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </fieldset>
    </form>
  );
};
