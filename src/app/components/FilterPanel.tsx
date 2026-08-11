import React, { useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/lib/i18n";
import { mockFonts } from "@/data/mockFonts";
import { cn } from "@/lib/utils";
import { getEffectiveLanguages, getEffectiveLicenseLabel, getEffectiveSourceLabel, getEffectiveWeights, isEffectivelyVariable } from "@/lib/fontTrust";

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
  const { t, language } = useLanguage();

  const { mainSources, otherSources, categories, languages, licenses, fontCounts } = useMemo(() => {
    const sourceCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    const languageCounts: Record<string, number> = {};
    const licenseCounts: Record<string, number> = {};
    const weightCounts: Record<number, number> = {};
    let variableCount = 0;

    mockFonts.forEach(font => {
      const source = getEffectiveSourceLabel(font);
      const license = getEffectiveLicenseLabel(font);
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      font.categories.forEach(category => { categoryCounts[category] = (categoryCounts[category] || 0) + 1; });
      getEffectiveLanguages(font).forEach(script => { languageCounts[script] = (languageCounts[script] || 0) + 1; });
      licenseCounts[license] = (licenseCounts[license] || 0) + 1;
      const weightCount = getEffectiveWeights(font).length;
      weightCounts[weightCount] = (weightCounts[weightCount] || 0) + 1;
      if (isEffectivelyVariable(font)) variableCount += 1;
    });

    const MIN_SOURCE_COUNT = 10;
    const main = Object.keys(sourceCounts).filter(source => sourceCounts[source] >= MIN_SOURCE_COUNT).sort((a, b) => sourceCounts[b] - sourceCounts[a] || a.localeCompare(b));
    const other = Object.keys(sourceCounts).filter(source => sourceCounts[source] < MIN_SOURCE_COUNT).sort((a, b) => a.localeCompare(b));
    const categoryOrder = ["sans-serif", "serif", "display", "handwriting", "monospaced"];
    const categoryList = categoryOrder.filter(category => categoryCounts[category]);
    const languageList = Object.keys(languageCounts).sort((a, b) => {
      const priority = (value: string) => value === "Latin" ? 0 : value === "Cyrillic" ? 1 : 2;
      return priority(a) - priority(b) || languageCounts[b] - languageCounts[a] || a.localeCompare(b);
    });
    const licenseList = Object.keys(licenseCounts).sort((a, b) => licenseCounts[b] - licenseCounts[a] || a.localeCompare(b));

    return {
      mainSources: main,
      otherSources: other,
      categories: categoryList,
      languages: languageList,
      licenses: licenseList,
      fontCounts: {
        sources: sourceCounts,
        categories: categoryCounts,
        languages: languageCounts,
        licenses: licenseCounts,
        weights: weightCounts,
        variable: variableCount,
        otherTotal: other.reduce((sum, source) => sum + sourceCounts[source], 0),
      },
    };
  }, []);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: "categories" | "languages" | "licenses" | "sources", value: string) => {
    setFilters(prev => {
      const current = prev[key];
      return { ...prev, [key]: current.includes(value) ? current.filter(item => item !== value) : [...current, value] };
    });
  };

  const isOtherSelected = otherSources.some(source => filters.sources.includes(source));
  const toggleOther = () => {
    if (isOtherSelected) updateFilter("sources", filters.sources.filter(source => !otherSources.includes(source)));
    else updateFilter("sources", Array.from(new Set([...filters.sources, ...otherSources])));
  };

  const resetFilters = () => setFilters({ search: "", categories: [], languages: [], variableOnly: false, licenses: [], sources: [], minWeights: undefined });

  const FilterCheckbox = ({ group, value, checked, count, onChange }: { group: string; value: string; checked: boolean; count: number; onChange: () => void }) => {
    const id = safeId(group, value);
    const accessibleGroup = group === "source"
      ? (language === 'ru' ? 'Источник' : 'Source')
      : group === "category"
        ? (language === 'ru' ? 'Категория' : 'Category')
        : group === "script"
          ? (language === 'ru' ? 'Письменность' : 'Script')
          : (language === 'ru' ? 'Лицензия' : 'License');
    return (
      <div className="flex items-center space-x-3 group min-w-0">
        <Checkbox id={id} checked={checked} onCheckedChange={onChange} aria-label={`${accessibleGroup}: ${value}`} className="h-3 w-3 border-neutral-400 rounded-none data-[state=checked]:bg-neutral-800 data-[state=checked]:text-white" />
        <Label htmlFor={id} className="font-mono text-xs text-neutral-600 uppercase cursor-pointer group-hover:text-black transition-colors select-none truncate flex-grow">{value}</Label>
        <span className="font-mono text-[9px] text-neutral-400 shrink-0">{count}</span>
      </div>
    );
  };

  const minWeightOptions = [
    { value: undefined, label: t('filters.anyWeights') },
    { value: 3, label: "3+" },
    { value: 5, label: "5+" },
    { value: 7, label: "7+" },
    { value: 9, label: "9 (Full)" },
  ];

  const countAtLeastWeights = (minimum: number) => mockFonts.reduce((count, font) => count + (getEffectiveWeights(font).length >= minimum ? 1 : 0), 0);

  return (
    <div className="h-full w-full flex-shrink-0 bg-white p-6 overflow-y-auto font-sans">
      <div className="mb-8 flex items-center justify-between pb-4 border-b border-neutral-200">
        <h2 className="text-xs font-mono font-bold text-black uppercase tracking-widest">{t('filters.title')}</h2>
        <button type="button" onClick={resetFilters} className="text-[10px] font-mono font-bold text-neutral-400 hover:text-black flex items-center gap-1.5 transition-colors uppercase"><RotateCcw className="w-3 h-3" /> {t('filters.reset')}</button>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between py-2">
          <Label htmlFor="var-mode" className="font-mono text-xs uppercase font-medium text-black cursor-pointer select-none">{t('filters.variable')}<span className="ml-2 text-[9px] text-neutral-400" style={{ fontWeight: 400 }}>{fontCounts.variable}</span></Label>
          <Switch id="var-mode" checked={filters.variableOnly} onCheckedChange={checked => updateFilter("variableOnly", checked)} aria-label={language === 'ru' ? 'Только вариативные шрифты' : 'Variable fonts only'} className="data-[state=checked]:bg-neutral-800 border border-neutral-300" />
        </div>
        <p className="-mt-6 font-mono text-[8px] leading-relaxed text-neutral-400">{language === 'ru' ? 'Счётчик учитывает только гарнитуры с подтверждёнными метриками variable-оси.' : 'Count includes only families whose variable-axis metadata is treated as verified.'}</p>

        <section className="space-y-4">
          <h3 className="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{t('filters.platform')}</h3>
          <div className="space-y-2">
            {mainSources.map(source => <FilterCheckbox key={source} group="source" value={source} checked={filters.sources.includes(source)} count={fontCounts.sources[source]} onChange={() => toggleArrayFilter("sources", source)} />)}
            {otherSources.length > 0 && <div className="flex items-center space-x-3 group pt-2 border-t border-dashed border-neutral-200 mt-2"><Checkbox id="source-other" checked={isOtherSelected} onCheckedChange={toggleOther} aria-label={language === 'ru' ? 'Другие источники' : 'Other sources'} className="h-3 w-3 border-neutral-400 rounded-none data-[state=checked]:bg-neutral-800 data-[state=checked]:text-white" /><Label htmlFor="source-other" className="font-mono text-xs text-neutral-600 uppercase cursor-pointer group-hover:text-black transition-colors select-none truncate flex-grow">{language === 'ru' ? 'Другие источники' : 'Other sources'}</Label><span className="font-mono text-[9px] text-neutral-400 shrink-0">{fontCounts.otherTotal}</span></div>}
          </div>
          <p className="pt-2 border-t border-dashed border-neutral-200 font-mono text-[9px] text-neutral-400 uppercase leading-normal">{t('filters.platform.note')}</p>
        </section>

        <section className="space-y-4">
          <h3 className="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{t('filters.categories')}</h3>
          <div className="space-y-2">{categories.map(category => <FilterCheckbox key={category} group="category" value={category} checked={filters.categories.includes(category)} count={fontCounts.categories[category] || 0} onChange={() => toggleArrayFilter("categories", category)} />)}</div>
        </section>

        <section className="space-y-4">
          <h3 className="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{t('filters.languages')}</h3>
          <div className="space-y-2">{languages.map(script => <FilterCheckbox key={script} group="script" value={script} checked={filters.languages.includes(script)} count={fontCounts.languages[script] || 0} onChange={() => toggleArrayFilter("languages", script)} />)}</div>
        </section>

        <section className="space-y-4">
          <h3 className="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{language === 'ru' ? 'Лицензия' : 'License'}</h3>
          <div className="space-y-2">{licenses.map(license => <FilterCheckbox key={license} group="license" value={license} checked={filters.licenses.includes(license)} count={fontCounts.licenses[license] || 0} onChange={() => toggleArrayFilter("licenses", license)} />)}</div>
          {(fontCounts.licenses["Verify at source"] || 0) > 0 && <p className="font-mono text-[8px] text-amber-700 leading-relaxed border border-amber-200 bg-amber-50 p-2">{language === 'ru' ? 'VERIFY AT SOURCE — источник или точная лицензия ещё не полностью подтверждены. Такие записи намеренно не объединяются с OFL/FFL.' : 'VERIFY AT SOURCE means source identity or the exact license is still pending. These records are intentionally not grouped with OFL/FFL.'}</p>}
        </section>

        <section className="space-y-4">
          <h3 className="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{t('filters.minWeights')}</h3>
          <div className="space-y-2">{minWeightOptions.map(option => <button type="button" key={option.value ?? 'any'} onClick={() => updateFilter("minWeights", option.value)} className={cn("w-full flex items-center justify-between px-3 py-1.5 font-mono text-xs uppercase transition-colors", filters.minWeights === option.value ? "bg-neutral-800 text-white" : "text-neutral-600 hover:bg-neutral-100")}><span>{option.label}</span>{option.value && <span className={cn("text-[9px]", filters.minWeights === option.value ? "text-neutral-300" : "text-neutral-400")}>{countAtLeastWeights(option.value)}</span>}</button>)}</div>
        </section>
      </div>
    </div>
  );
};
