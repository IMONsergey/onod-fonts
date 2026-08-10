import React, { useState, useEffect, useRef, useCallback } from "react";
import { Font } from "@/data/mockFonts";
import { FontCard } from "@/components/FontCard";
import { FilterPanel, FilterState } from "@/components/FilterPanel";
import { useFontFilter } from "@/hooks/useFontFilter";
import { Search, LayoutGrid, List as ListIcon, Settings2, X, ArrowRight, MoveHorizontal, ArrowUp, ArrowDownAZ } from "lucide-react";
import { FontLoader } from "@/components/FontLoader";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "react-router";

interface FontCatalogPageProps {
  fonts: Font[];
  previewText: string;
  setPreviewText: (text: string) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  compareList: string[];
  toggleCompare: (id: string) => void;
  viewDetails: (id: string) => void;
  onOpenStack: () => void;
}

const PANGRAMS = {
  standard: "The quick brown fox jumps over the lazy dog.",
  ui: "Dashboard Settings Profile Logout Submit Cancel",
  editorial: "Typography is the craft of endowing human language with a durable visual form.",
  code: "function render(props: Props) { return <Component /> }",
  digits: "0123456789 £$€%&@+-=*",
};

type PangramMode = keyof typeof PANGRAMS;
type ViewMode = "grid" | "list";
type SortMode = "default" | "alpha" | "weights";

const parseList = (params: URLSearchParams, key: string) => (params.get(key) || "").split(",").map(item => item.trim()).filter(Boolean);
const parseNumber = (value: string | null, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
};

const initialFilters = (params: URLSearchParams): FilterState => {
  const minWeightsValue = Number(params.get("minw"));
  const minWeights = [3, 5, 7, 9].includes(minWeightsValue) ? minWeightsValue : undefined;
  return {
    search: params.get("q") || "",
    categories: parseList(params, "cat"),
    languages: parseList(params, "script"),
    variableOnly: params.get("variable") === "1",
    licenses: parseList(params, "license"),
    sources: parseList(params, "source"),
    minWeights,
  };
};

export const FontCatalogPage: React.FC<FontCatalogPageProps> = ({ fonts, previewText, setPreviewText, favorites, toggleFavorite, compareList, toggleCompare, viewDetails, onOpenStack }) => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialParams = useRef(new URLSearchParams(searchParams));
  const [filters, setFilters] = useState<FilterState>(() => initialFilters(initialParams.current));
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => initialParams.current.get("view") === "grid" ? "grid" : "list");
  const [pangramMode, setPangramMode] = useState<PangramMode>(() => {
    const value = initialParams.current.get("pangram") as PangramMode | null;
    return value && value in PANGRAMS ? value : "standard";
  });
  const [globalFontSize, setGlobalFontSize] = useState(() => parseNumber(initialParams.current.get("size"), 64, 16, 120));
  const [globalTracking, setGlobalTracking] = useState(() => parseNumber(initialParams.current.get("tracking"), 0, -5, 20) / 100);
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    const value = initialParams.current.get("sort");
    return value === "alpha" || value === "weights" ? value : "default";
  });

  useEffect(() => {
    const urlPreview = initialParams.current.get("preview");
    if (urlPreview && !previewText) setPreviewText(urlPreview.slice(0, 500));
  }, [previewText, setPreviewText]);

  useEffect(() => {
    setSearchParams(current => {
      const next = new URLSearchParams(current);
      const setList = (key: string, values: string[]) => values.length ? next.set(key, values.join(",")) : next.delete(key);
      filters.search ? next.set("q", filters.search) : next.delete("q");
      setList("cat", filters.categories);
      setList("script", filters.languages);
      setList("license", filters.licenses);
      setList("source", filters.sources);
      filters.variableOnly ? next.set("variable", "1") : next.delete("variable");
      filters.minWeights ? next.set("minw", String(filters.minWeights)) : next.delete("minw");
      sortMode !== "default" ? next.set("sort", sortMode) : next.delete("sort");
      viewMode !== "list" ? next.set("view", viewMode) : next.delete("view");
      pangramMode !== "standard" ? next.set("pangram", pangramMode) : next.delete("pangram");
      globalFontSize !== 64 ? next.set("size", String(globalFontSize)) : next.delete("size");
      globalTracking !== 0 ? next.set("tracking", String(Math.round(globalTracking * 100))) : next.delete("tracking");
      previewText ? next.set("preview", previewText.slice(0, 500)) : next.delete("preview");
      return next.toString() === current.toString() ? current : next;
    }, { replace: true });
  }, [filters, sortMode, viewMode, pangramMode, globalFontSize, globalTracking, previewText, setSearchParams]);

  const filteredFonts = useFontFilter(fonts, filters);
  const sortedFonts = React.useMemo(() => {
    const sorted = [...filteredFonts];
    if (sortMode === "alpha") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sortMode === "weights") sorted.sort((a, b) => b.weights.length - a.weights.length);
    return sorted;
  }, [filteredFonts, sortMode]);

  const BATCH_SIZE = 15;
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const currentFonts = sortedFonts.slice(0, visibleCount);
  const loadMore = useCallback(() => {
    if (visibleCount < sortedFonts.length) setVisibleCount(prev => Math.min(prev + BATCH_SIZE, sortedFonts.length));
  }, [visibleCount, sortedFonts.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => { if (entries[0]?.isIntersecting) loadMore(); }, { threshold: 0.1 });
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  useEffect(() => { setVisibleCount(BATCH_SIZE); }, [filters, sortMode]);

  const handlePangramChange = (mode: PangramMode) => {
    setPangramMode(mode);
    setPreviewText(PANGRAMS[mode]);
  };

  const clearFilters = () => setFilters({ search: "", categories: [], languages: [], variableOnly: false, licenses: [], sources: [], minWeights: undefined });
  const removeCategory = (cat: string) => setFilters(prev => ({ ...prev, categories: prev.categories.filter(item => item !== cat) }));
  const removeLanguage = (lang: string) => setFilters(prev => ({ ...prev, languages: prev.languages.filter(item => item !== lang) }));
  const removeSource = (source: string) => setFilters(prev => ({ ...prev, sources: prev.sources.filter(item => item !== source) }));
  const removeLicense = (license: string) => setFilters(prev => ({ ...prev, licenses: prev.licenses.filter(item => item !== license) }));
  const hasFilters = Boolean(filters.search || filters.categories.length || filters.languages.length || filters.variableOnly || filters.licenses.length || filters.sources.length || filters.minWeights);
  const stackFonts = fonts.filter(font => compareList.includes(font.id));

  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white w-full font-sans text-black pb-20">
      <FontLoader fonts={currentFonts} />

      <div className="sticky top-16 z-40 bg-white border-b border-neutral-200">
        <div className="flex flex-row items-stretch h-14 md:h-auto">
          <div className="flex items-center w-[42%] md:w-72 flex-shrink-0 border-r border-neutral-200 p-2 md:p-4">
            <button type="button" className="md:hidden mr-2 p-1.5 border border-neutral-300 hover:bg-neutral-100 transition-colors flex-shrink-0" onClick={() => setIsFilterOpen(!isFilterOpen)} aria-label={isFilterOpen ? "Close filters" : "Open filters"} aria-expanded={isFilterOpen}><Settings2 className="w-3.5 h-3.5" /></button>
            <div className="relative flex-grow min-w-0"><Search className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" /><input type="search" placeholder={t('search.placeholder').toUpperCase()} value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} className="h-8 md:h-10 w-full bg-transparent border-b border-transparent focus:border-neutral-400 pl-5 pr-1 text-[10px] md:text-sm font-mono uppercase placeholder:text-neutral-400 focus:outline-none transition-all truncate" /></div>
          </div>

          <div className="relative flex-grow md:border-r border-neutral-200 p-2 md:p-4 flex items-center gap-3 min-w-0">
            <input type="text" placeholder={t('preview.placeholder').toUpperCase()} value={previewText} onChange={(e) => setPreviewText(e.target.value)} className="h-8 md:h-10 flex-grow bg-transparent text-sm md:text-2xl font-light placeholder:text-neutral-200 focus:outline-none min-w-0" />
            <label className="sr-only" htmlFor="pangram-mode">Preview preset</label>
            <select id="pangram-mode" value={pangramMode} onChange={e => handlePangramChange(e.target.value as PangramMode)} className="h-8 md:h-10 max-w-24 md:max-w-32 bg-white border border-neutral-200 px-2 font-mono text-[9px] md:text-[10px] uppercase focus:outline-none focus:border-neutral-400">
              {(Object.keys(PANGRAMS) as PangramMode[]).map(mode => <option key={mode} value={mode}>{mode}</option>)}
            </select>
          </div>

          <div className="hidden md:flex items-center justify-center p-4 gap-2 bg-white">
            <button type="button" onClick={() => setViewMode("list")} className={cn("p-2 border border-neutral-300 transition-all", viewMode === "list" ? "bg-neutral-800 text-white border-neutral-800" : "hover:bg-neutral-100")} aria-label="List view" aria-pressed={viewMode === "list"}><ListIcon className="w-4 h-4" /></button>
            <button type="button" onClick={() => setViewMode("grid")} className={cn("p-2 border border-neutral-300 transition-all", viewMode === "grid" ? "bg-neutral-800 text-white border-neutral-800" : "hover:bg-neutral-100")} aria-label="Grid view" aria-pressed={viewMode === "grid"}><LayoutGrid className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex md:hidden h-12 border-t border-neutral-100 items-center gap-4 px-3">
          <div className="flex items-center gap-2 flex-1"><span className="font-mono text-[8px] uppercase text-neutral-400 whitespace-nowrap">{globalFontSize}px</span><input aria-label="Preview size" type="range" min="16" max="120" value={globalFontSize} onChange={(e) => setGlobalFontSize(Number(e.target.value))} className="w-full h-px bg-black appearance-none cursor-pointer accent-black" /></div>
          <div className="flex items-center gap-2 flex-1"><MoveHorizontal className="w-3 h-3 text-neutral-400 shrink-0" /><span className="font-mono text-[8px] text-neutral-400 w-5">{Math.round(globalTracking * 100)}</span><input aria-label="Preview tracking" type="range" min="-5" max="20" step="1" value={globalTracking * 100} onChange={(e) => setGlobalTracking(Number(e.target.value) / 100)} className="w-full h-px bg-black appearance-none cursor-pointer accent-black" /></div>
          <div className="flex gap-1"><button type="button" onClick={() => setViewMode("list")} className={cn("p-1.5 border border-neutral-300", viewMode === "list" && "bg-neutral-800 text-white")} aria-label="List view" aria-pressed={viewMode === "list"}><ListIcon className="w-3 h-3" /></button><button type="button" onClick={() => setViewMode("grid")} className={cn("p-1.5 border border-neutral-300", viewMode === "grid" && "bg-neutral-800 text-white")} aria-label="Grid view" aria-pressed={viewMode === "grid"}><LayoutGrid className="w-3 h-3" /></button></div>
        </div>

        <div className="hidden md:flex items-center gap-8 px-4 pb-3 -mt-1 justify-end">
          <div className="flex items-center gap-3 w-40"><span className="font-mono text-[9px] uppercase text-neutral-400 whitespace-nowrap">Size {globalFontSize}</span><input aria-label="Preview size" type="range" min="16" max="120" value={globalFontSize} onChange={(e) => setGlobalFontSize(Number(e.target.value))} className="w-full h-px bg-black appearance-none cursor-pointer accent-black" /></div>
          <div className="flex items-center gap-3 w-40"><MoveHorizontal className="w-3 h-3 text-neutral-400" /><span className="font-mono text-[9px] text-neutral-400 w-5">{Math.round(globalTracking * 100)}</span><input aria-label="Preview tracking" type="range" min="-5" max="20" step="1" value={globalTracking * 100} onChange={(e) => setGlobalTracking(Number(e.target.value) / 100)} className="w-full h-px bg-black appearance-none cursor-pointer accent-black" /></div>
        </div>
      </div>

      <div className="flex flex-grow w-full relative">
        <aside className={cn("fixed left-0 bottom-0 top-[168px] md:top-[153px] z-30 w-72 bg-white border-r border-neutral-200 transform transition-transform duration-300 ease-in-out", isFilterOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0")} aria-label="Font filters"><FilterPanel filters={filters} setFilters={setFilters} /></aside>

        <div className="flex-grow w-full transition-all duration-300 min-h-screen md:pl-72">
          <div className="border-b border-neutral-200 px-4 md:px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2 items-center min-h-[24px]">
                {filters.search && <button type="button" onClick={() => setFilters(prev => ({ ...prev, search: "" }))} className="flex items-center gap-1 border border-neutral-300 px-2.5 py-1 font-mono text-[10px] uppercase hover:border-red-400 hover:text-red-500">Q: {filters.search.slice(0, 22)} <X className="w-3 h-3" /></button>}
                {filters.categories.map(cat => <button type="button" key={`cat-${cat}`} onClick={() => removeCategory(cat)} className="flex items-center gap-1 bg-neutral-800 text-white px-2.5 py-1 font-mono text-[10px] uppercase hover:bg-red-500">{cat} <X className="w-3 h-3" /></button>)}
                {filters.languages.map(lang => <button type="button" key={`lang-${lang}`} onClick={() => removeLanguage(lang)} className="flex items-center gap-1 border border-neutral-300 px-2.5 py-1 font-mono text-[10px] uppercase hover:border-red-400 hover:text-red-500">{lang} <X className="w-3 h-3" /></button>)}
                {filters.sources.map(source => <button type="button" key={`source-${source}`} onClick={() => removeSource(source)} className="flex items-center gap-1 border border-neutral-300 px-2.5 py-1 font-mono text-[10px] uppercase hover:border-red-400 hover:text-red-500 max-w-48"><span className="truncate">{source}</span><X className="w-3 h-3 shrink-0" /></button>)}
                {filters.licenses.map(license => <button type="button" key={`license-${license}`} onClick={() => removeLicense(license)} className="flex items-center gap-1 border border-neutral-300 px-2.5 py-1 font-mono text-[10px] uppercase hover:border-red-400 hover:text-red-500">{license} <X className="w-3 h-3" /></button>)}
                {filters.variableOnly && <button type="button" onClick={() => setFilters(prev => ({ ...prev, variableOnly: false }))} className="flex items-center gap-1 bg-neutral-200 px-2.5 py-1 font-mono text-[10px] uppercase hover:bg-red-500 hover:text-white">VAR ONLY <X className="w-3 h-3" /></button>}
                {filters.minWeights && <button type="button" onClick={() => setFilters(prev => ({ ...prev, minWeights: undefined }))} className="flex items-center gap-1 bg-neutral-200 px-2.5 py-1 font-mono text-[10px] uppercase hover:bg-red-500 hover:text-white">{filters.minWeights}+ WEIGHTS <X className="w-3 h-3" /></button>}
                {hasFilters ? <button type="button" onClick={clearFilters} className="text-[10px] font-mono uppercase underline decoration-neutral-300 hover:decoration-black underline-offset-2 text-neutral-400 hover:text-black ml-1">{t('compare.clear')}</button> : <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">{t('filters.index')}</span>}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <ArrowDownAZ className="w-3 h-3 text-neutral-400" />
                <label className="sr-only" htmlFor="catalog-sort">Sort</label>
                <select id="catalog-sort" value={sortMode} onChange={e => setSortMode(e.target.value as SortMode)} className="bg-white border border-neutral-200 px-2 py-1.5 font-mono text-[9px] uppercase focus:outline-none focus:border-neutral-400"><option value="default">{t('sort.popularity')}</option><option value="alpha">{t('sort.alpha')}</option><option value="weights">{t('sort.styles')}</option></select>
                <span className="font-mono text-xs shrink-0" style={{ fontWeight: 700 }}>{filteredFonts.length} {t('fonts.label').toUpperCase()}</span>
              </div>
            </div>
          </div>

          {filteredFonts.length === 0 && <div className="flex flex-col items-center justify-center py-32 px-8 text-center"><div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-6">0 {t('fonts.count')}</div><h3 className="text-4xl md:text-6xl tracking-tighter mb-6 leading-none" style={{ fontWeight: 700 }}>{t('fonts.notFound')}</h3><p className="font-mono text-xs uppercase tracking-[0.15em] text-neutral-500 mb-8 max-w-sm leading-relaxed">{t('filters.platform.note')}</p><button type="button" onClick={clearFilters} className="px-8 py-3 bg-neutral-800 text-white font-mono text-xs uppercase tracking-widest hover:bg-neutral-700 transition-colors">{t('filters.reset')}</button></div>}

          {filteredFonts.length > 0 && <div className={cn(viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col")}>{currentFonts.map(font => <FontCard key={font.id} font={font} previewText={previewText} isFavorite={favorites.includes(font.id)} isCompared={compareList.includes(font.id)} fontSize={globalFontSize} letterSpacing={globalTracking} onToggleFavorite={toggleFavorite} onToggleCompare={toggleCompare} onViewDetails={viewDetails} layout={viewMode} />)}</div>}
          <div ref={loadMoreRef} className="h-32 flex items-center justify-center border-t border-neutral-200">{visibleCount < sortedFonts.length && <div className="font-mono text-xs animate-pulse">{t('status.loading').toUpperCase()}</div>}</div>
        </div>
      </div>

      {compareList.length > 0 && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white p-2.5 shadow-2xl w-[92vw] max-w-2xl flex items-center justify-between"><div className="flex items-center gap-2 md:gap-4 overflow-x-auto px-2"><span className="font-mono text-[10px] uppercase tracking-widest whitespace-nowrap text-neutral-400 hidden sm:inline">{t('compare.stack')} ({compareList.length}/3)</span>{stackFonts.map(font => <div key={font.id} className="flex items-center gap-2 bg-neutral-800 px-3 py-1"><span className="font-bold text-xs whitespace-nowrap">{font.name}</span><button type="button" onClick={() => toggleCompare(font.id)} className="hover:text-red-400" aria-label={`Remove ${font.name}`}><X className="w-3 h-3" /></button></div>)}</div><button type="button" onClick={onOpenStack} className="ml-3 md:ml-4 bg-white text-black px-4 md:px-5 py-2.5 font-mono text-xs font-bold uppercase hover:bg-neutral-200 transition-colors flex items-center gap-2 whitespace-nowrap"><span>{t('compare.construct')}</span><ArrowRight className="w-3 h-3" /></button></div>}

      {isFilterOpen && <button type="button" className="fixed inset-0 bg-black/20 z-20 md:hidden backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} aria-label="Close filters" />}

      <AnimatePresence>{showScrollTop && <motion.button type="button" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className={cn("fixed right-5 z-40 w-10 h-10 border border-neutral-200 bg-white shadow-sm flex items-center justify-center hover:bg-neutral-100", compareList.length ? "bottom-24" : "bottom-6")} aria-label="Scroll to top"><ArrowUp className="w-4 h-4" /></motion.button>}</AnimatePresence>
    </div>
  );
};
