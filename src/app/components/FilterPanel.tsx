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

export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, setFilters }) => {
  const { t } = useLanguage();

  // Dynamic Source Calculation
  const { mainSources, otherSources, fontCounts } = useMemo(() => {
      const activeFonts = mockFonts;
      const counts: Record<string, number> = {};
      activeFonts.forEach(f => {
          counts[f.source] = (counts[f.source] || 0) + 1;
      });
      
      const MIN_COUNT = 10;
      const main = Object.keys(counts).filter(s => counts[s] >= MIN_COUNT);
      const other = Object.keys(counts).filter(s => counts[s] < MIN_COUNT);
      
      // Also count categories and languages
      const catCounts: Record<string, number> = {};
      const langCounts: Record<string, number> = {};
      let variableCount = 0;
      activeFonts.forEach(f => {
          f.categories.forEach(c => { catCounts[c] = (catCounts[c] || 0) + 1; });
          f.languages.forEach(l => { langCounts[l] = (langCounts[l] || 0) + 1; });
          if (f.variable) variableCount++;
      });
      
      return { 
          mainSources: main, 
          otherSources: other, 
          fontCounts: { sources: counts, categories: catCounts, languages: langCounts, variable: variableCount, otherTotal: other.reduce((sum, s) => sum + counts[s], 0) } 
      };
  }, []);

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: "categories" | "languages" | "licenses" | "sources", value: string) => {
    setFilters((prev) => {
      const current = prev[key];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  // Logic for "Other" group
  // We consider "Other" selected if AT LEAST ONE of the other sources is selected. 
  // But for a clean toggle behavior:
  // - If unchecked: select ALL other sources
  // - If checked (even partially): deselect ALL other sources
  const isOtherSelected = otherSources.some(s => filters.sources.includes(s));
  
  const toggleOther = () => {
      if (isOtherSelected) {
          // Deselect all
          const newSources = filters.sources.filter(s => !otherSources.includes(s));
          updateFilter("sources", newSources);
      } else {
          // Select all
          const newSources = Array.from(new Set([...filters.sources, ...otherSources]));
          updateFilter("sources", newSources);
      }
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      categories: [],
      languages: [],
      variableOnly: false,
      licenses: [],
      sources: [],
      minWeights: undefined,
    });
  };

  const categories = ["sans-serif", "serif", "display", "handwriting", "monospaced"];
  const languages = ["Cyrillic", "Latin"];

  return (
    <div className="h-full w-full flex-shrink-0 bg-white p-6 overflow-y-auto font-sans">
      <div className="mb-8 flex items-center justify-between pb-4 border-b border-neutral-200">
        <h2 className="text-xs font-mono font-bold text-black uppercase tracking-widest">{t('filters.title')}</h2>
        <button 
            onClick={resetFilters} 
            className="text-[10px] font-mono font-bold text-neutral-400 hover:text-black flex items-center gap-1.5 transition-colors uppercase"
        >
          <RotateCcw className="w-3 h-3" /> {t('filters.reset')}
        </button>
      </div>

      <div className="space-y-8">
        {/* Variable Toggle */}
        <div className="flex items-center justify-between py-2">
            <Label htmlFor="var-mode" className="font-mono text-xs uppercase font-medium text-black cursor-pointer select-none">
                {t('filters.variable')}
                <span className="ml-2 text-[9px] text-neutral-400" style={{ fontWeight: 400 }}>{fontCounts.variable}</span>
            </Label>
            <Switch 
                id="var-mode" 
                checked={filters.variableOnly} 
                onCheckedChange={(c) => updateFilter("variableOnly", c)}
                className="data-[state=checked]:bg-neutral-800 border border-neutral-300"
            />
        </div>

        <div className="space-y-8">
            {/* Sources */}
            <div className="space-y-4">
                <h3 className="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{t('filters.platform')}</h3>
                <div className="space-y-2">
                    {mainSources.map((src) => (
                        <div key={src} className="flex items-center space-x-3 group">
                            <Checkbox 
                                id={src} 
                                checked={filters.sources.includes(src)}
                                onCheckedChange={() => toggleArrayFilter("sources", src)}
                                className="h-3 w-3 border-neutral-400 rounded-none data-[state=checked]:bg-neutral-800 data-[state=checked]:text-white"
                            />
                            <Label htmlFor={src} className="font-mono text-xs text-neutral-600 uppercase cursor-pointer group-hover:text-black transition-colors select-none truncate flex-grow">{src}</Label>
                            <span className="font-mono text-[9px] text-neutral-400 shrink-0">{fontCounts.sources[src]}</span>
                        </div>
                    ))}

                    {/* Other Group */}
                    {otherSources.length > 0 && (
                        <div className="flex items-center space-x-3 group pt-2 border-t border-dashed border-neutral-200 mt-2">
                            <Checkbox 
                                id="source-other" 
                                checked={isOtherSelected}
                                onCheckedChange={toggleOther}
                                className="h-3 w-3 border-neutral-400 rounded-none data-[state=checked]:bg-neutral-800 data-[state=checked]:text-white"
                            />
                            <Label htmlFor="source-other" className="font-mono text-xs text-neutral-600 uppercase cursor-pointer group-hover:text-black transition-colors select-none truncate flex-grow">
                                {t('filters.other')}
                            </Label>
                            <span className="font-mono text-[9px] text-neutral-400 shrink-0">{fontCounts.otherTotal}</span>
                        </div>
                    )}
                </div>
                <div className="pt-2 border-t border-dashed border-neutral-200">
                    <p className="font-mono text-[9px] text-neutral-400 uppercase leading-normal">
                        {t('filters.platform.note')}
                    </p>
                </div>
            </div>
            
            {/* Categories */}
            <div className="space-y-4">
                <h3 className="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{t('filters.categories')}</h3>
                <div className="space-y-2">
                    {categories.map((cat) => (
                        <div key={cat} className="flex items-center space-x-3 group">
                            <Checkbox 
                                id={cat} 
                                checked={filters.categories.includes(cat)}
                                onCheckedChange={() => toggleArrayFilter("categories", cat)}
                                className="h-3 w-3 border-neutral-400 rounded-none data-[state=checked]:bg-neutral-800 data-[state=checked]:text-white"
                            />
                            <Label htmlFor={cat} className="font-mono text-xs text-neutral-600 uppercase cursor-pointer group-hover:text-black transition-colors select-none flex-grow">{cat}</Label>
                            <span className="font-mono text-[9px] text-neutral-400 shrink-0">{fontCounts.categories[cat] || 0}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Languages */}
            <div className="space-y-4">
                <h3 className="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{t('filters.languages')}</h3>
                <div className="space-y-2">
                    {languages.map((lang) => (
                        <div key={lang} className="flex items-center space-x-3 group">
                            <Checkbox 
                                id={lang} 
                                checked={filters.languages.includes(lang)}
                                onCheckedChange={() => toggleArrayFilter("languages", lang)}
                                className="h-3 w-3 border-neutral-400 rounded-none data-[state=checked]:bg-neutral-800 data-[state=checked]:text-white"
                            />
                            <Label htmlFor={lang} className="font-mono text-xs text-neutral-600 uppercase cursor-pointer group-hover:text-black transition-colors select-none flex-grow">{lang}</Label>
                            <span className="font-mono text-[9px] text-neutral-400 shrink-0">{fontCounts.languages[lang] || 0}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Minimum Weights */}
            <div className="space-y-4">
                <h3 className="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{t('filters.minWeights')}</h3>
                <div className="space-y-2">
                    {[
                        { value: undefined, label: t('filters.anyWeights') },
                        { value: 3, label: "3+" },
                        { value: 5, label: "5+" },
                        { value: 7, label: "7+" },
                        { value: 9, label: "9 (Full)" },
                    ].map((opt) => (
                        <button
                            key={opt.value ?? 'any'}
                            onClick={() => updateFilter("minWeights", opt.value)}
                            className={cn(
                                "w-full text-left px-3 py-1.5 font-mono text-xs uppercase transition-colors",
                                filters.minWeights === opt.value
                                    ? "bg-neutral-800 text-white"
                                    : "text-neutral-600 hover:bg-neutral-100"
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
