import React, { useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/lib/i18n";
import { mockFonts } from "@/data/mockFonts";
import { getEffectiveLanguages, isEffectivelyVariable } from "@/lib/fontTrust";

export interface FilterState {
  search: string;
  categories: string[];
  languages: string[];
  variableOnly: boolean;
  licenses: string[];
  sources: string[];
  minWeights?: number;
}

interface FilterPanelProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

const safeId = (prefix: string, value: string) => `${prefix}-${value.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, setFilters }) => {
  const { t } = useLanguage();

  const { categories, languages, categoryCounts, languageCounts, variableCount } = useMemo(() => {
    const nextCategoryCounts: Record<string, number> = {};
    const nextLanguageCounts: Record<string, number> = {};
    let nextVariableCount = 0;

    mockFonts.forEach(font => {
      font.categories.forEach(category => {
        nextCategoryCounts[category] = (nextCategoryCounts[category] || 0) + 1;
      });
      getEffectiveLanguages(font).forEach(script => {
        nextLanguageCounts[script] = (nextLanguageCounts[script] || 0) + 1;
      });
      if (isEffectivelyVariable(font)) nextVariableCount += 1;
    });

    const categoryOrder = ["sans-serif", "serif", "display", "handwriting", "monospaced"];
    const categoryList = categoryOrder.filter(category => nextCategoryCounts[category]);
    const languageList = Object.keys(nextLanguageCounts).sort((a, b) => {
      const priority = (value: string) => value === "Latin" ? 0 : value === "Cyrillic" ? 1 : 2;
      return priority(a) - priority(b) || nextLanguageCounts[b] - nextLanguageCounts[a] || a.localeCompare(b);
    });

    return {
      categories: categoryList,
      languages: languageList,
      categoryCounts: nextCategoryCounts,
      languageCounts: nextLanguageCounts,
      variableCount: nextVariableCount,
    };
  }, []);

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
    setFilters(previous => {
      const current = previous[key];
      return {
        ...previous,
        [key]: current.includes(value) ? current.filter(item => item !== value) : [...current, value],
      };
    });
  };

  const FilterCheckbox = ({ group, value, checked, count }: { group: string; value: string; checked: boolean; count: number }) => {
    const id = safeId(group, value);
    return (
      <div className="flex items-center gap-3 min-w-0 group">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={() => toggleArrayFilter(group as "categories" | "languages", value)}
          className="h-3.5 w-3.5 border-neutral-400 rounded-none data-[state=checked]:bg-neutral-900 data-[state=checked]:text-white"
        />
        <Label htmlFor={id} className="min-w-0 flex-1 cursor-pointer select-none truncate font-mono text-[11px] uppercase text-neutral-600 group-hover:text-black transition-colors">
          {value}
        </Label>
        <span className="shrink-0 font-mono text-[9px] text-neutral-400">{count}</span>
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-white px-5 py-6 overflow-y-auto">
      <div className="flex items-center justify-between pb-5 border-b border-neutral-200">
        <h2 className="font-mono text-[11px] font-bold uppercase tracking-widest">{t('filters.title')}</h2>
        <button type="button" onClick={resetFilters} className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wide text-neutral-400 hover:text-black transition-colors">
          <RotateCcw className="w-3 h-3" />
          {t('filters.reset')}
        </button>
      </div>

      <div className="py-5 border-b border-neutral-200 flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="var-mode" className="cursor-pointer font-mono text-[11px] uppercase text-neutral-700">{t('filters.variable')}</Label>
          <div className="mt-1 font-mono text-[9px] text-neutral-400">{variableCount}</div>
        </div>
        <Switch
          id="var-mode"
          checked={filters.variableOnly}
          onCheckedChange={checked => setFilters(previous => ({ ...previous, variableOnly: checked }))}
          className="data-[state=checked]:bg-neutral-900 border border-neutral-300"
        />
      </div>

      <section className="py-6 border-b border-neutral-200">
        <h3 className="mb-4 font-mono text-[9px] font-bold uppercase tracking-widest text-neutral-400">{t('filters.categories')}</h3>
        <div className="space-y-3">
          {categories.map(category => (
            <FilterCheckbox
              key={category}
              group="categories"
              value={category}
              checked={filters.categories.includes(category)}
              count={categoryCounts[category] || 0}
            />
          ))}
        </div>
      </section>

      <section className="py-6">
        <h3 className="mb-4 font-mono text-[9px] font-bold uppercase tracking-widest text-neutral-400">{t('filters.languages')}</h3>
        <div className="space-y-3">
          {languages.map(script => (
            <FilterCheckbox
              key={script}
              group="languages"
              value={script}
              checked={filters.languages.includes(script)}
              count={languageCounts[script] || 0}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
