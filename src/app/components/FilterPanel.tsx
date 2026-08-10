import React, { useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/lib/i18n";
import { mockFonts } from "@/data/mockFonts";
import { cn } from "@/lib/utils";

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
    let variableCount = 0;

    mockFonts.forEach(font => {
      sourceCounts[font.source] = (sourceCounts[font.source] || 0) + 1;
      font.categories.forEach(category => { categoryCounts[category] = (categoryCounts[category] || 0) + 1; });
      font.languages.forEach(script => { languageCounts[script] = (languageCounts[script] || 0) + 1; });
      licenseCounts[font.license] = (licenseCounts[font.license] || 0) + 1;
      if (font.variable) variableCount += 1;
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
    return (
      <div className="flex items-center space-x-3 group min-w-0">
        <Checkbox id={id} checked={checked} onCheckedChange={onChange} className="h-3 w-3 border-neutral-400 rounded-none data-[state=checked]:bg-neutral-800 data-[state=checked]:text-white" />
        <Label htmlFor={id} className="font-mono text-xs text-neutral-600 uppercase cursor-pointer group-hover:text-black transition-colors select-none truncate flex-grow">{value}</Label>
        <span className="font-mono text-[9px] text-neutral-400 shrink-0">{count}</span>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex-shrink-0 bg-white p-6 overflow-y-auto font-sans">
      <div className="mb-8 flex items-center justify-between pb-4 border-b border-neutral-200">
        <h2 className="text-xs font-mono font-bold text-black uppercase tracking-widest">{t('filters.title')}</h2>
        <button type="button" onClick={resetFilters} className="text-[10px] font-mono font-bold text-neutral-400 hover:text-black flex items-center gap-1.5 transition-colors uppercase"><RotateCcw className="w-3 h-3" /> {t('filters.reset')}</button>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between py-2">
          <Label htmlFor="var-mode" className="font-mono text-xs uppercase font-medium text-black cursor-pointer select-none">{t('filters.variable')}<span className="ml-2 text-[9px] text-neutral-400" style={{ fontWeight: 400 }}>{fontCounts.variable}</span></Label>
          <Switch id="var-mode" checked={filters.variableOnly} onCheckedChange={checked => updateFilter("variableOnly", checked)} className="data-[state=checked]:bg-neutral-800 border border-neutral-300" />
        </div>

        <section className="space-y-4">
          <h3 className="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{t('filters.platform')}</h3>
          <div className="space-y-2">
            {mainSources.map(source => <FilterCheckbox key={source} group="source" value={source} checked={filters.sources.includes(source)} count={fontCounts.sources[source]} onChange={() => toggleArrayFilter("sources", source)} />)}
            {otherSources.length > 0 && <div className="flex items-center space-x-3 group pt-2 border-t border-dashed border-neutral-200 mt-2"><Checkbox id="source-other" checked={isOtherSelected} onCheckedChange={toggleOther} className="h-3 w-3 border-neutral-400 rounded-none data-[state=checked]:bg-neutral-800 data-[state=checked]:text-white" /><Label htmlFor="source-other" className="font-mono text-xs text-neutral-600 uppercase cursor-pointer group-hover:text-black transition-colors select-none truncate flex-grow">{language === 'ru' ? 'Другие источники' : 'Other sources'}</Label><span className="font-mono text-[9px] text-neutral-400 shrink-0">{fontCounts.otherTotal}</span></div>}
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
          {fontCounts.licenses["Open Source"] > 0 && <p className="font-mono text-[8px] text-amber-700 leading-relaxed border border-amber-200 bg-amber-50 p-2">{language === 'ru' ? 'OPEN SOURCE — временная общая метка. Точный идентификатор лицензии для этих записей ещё проверяется по первоисточнику.' : 'OPEN SOURCE is a temporary generic label. Exact license identifiers for these records are still being verified upstream.'}</p>}
        </section>

        <section className="space-y-4">
          <h3 className="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{t('filters.minWeights')}</h3>
          <div className="space-y-2">{[{ value: undefined, label: t('filters.anyWeights') }, { value: 3, label: "3+" }, { value: 5, label: "5+" }, { value: 7, label: "7+" }, { value: 9, label: "9 (Full)" }].map(option => <button type="button" key={option.value ?? 'any'} onClick={() => updateFilter("minWeights", option.value)} className={cn("w-full text-left px-3 py-1.5 font-mono text-xs uppercase transition-colors", filters.minWeights === option.value ? "bg-neutral-800 text-white" : "text-neutral-600 hover:bg-neutral-100")}>{option.label}</button>)}</div>
        </section>
      </div>
    </div>
  );
};
