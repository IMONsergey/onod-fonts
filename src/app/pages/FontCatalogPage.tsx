import React, { useState, useEffect, useRef, useCallback } from "react";
import { Font } from "@/data/mockFonts";
import { FontCard } from "@/components/FontCard";
import { FilterPanel, FilterState } from "@/components/FilterPanel";
import { useFontFilter } from "@/hooks/useFontFilter";
import { Search, LayoutGrid, List as ListIcon, Settings2, X, ArrowRight, MoveHorizontal, ChevronDown, ArrowUp, ArrowDownAZ } from "lucide-react";
import { FontLoader } from "@/components/FontLoader";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { AnimatePresence, motion } from "motion/react";
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
export const FontCatalogPage: React.FC<FontCatalogPageProps> = ({ fonts, previewText, setPreviewText, favorites, toggleFavorite, compareList, toggleCompare, viewDetails, onOpenStack, }) => {
    const { t } = useLanguage();
    const [filters, setFilters] = React.useState<FilterState>({ search: "", categories: [], languages: [], variableOnly: false, licenses: [], sources: [], minWeights: undefined });
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);
    const [viewMode, setViewMode] = React.useState<"grid" | "list">("list");
    const [pangramMode, setPangramMode] = React.useState<keyof typeof PANGRAMS>("standard");
    const [globalFontSize, setGlobalFontSize] = useState(64);
    const [globalTracking, setGlobalTracking] = useState(0);
    const [sortMode, setSortMode] = useState<"default" | "alpha" | "weights">("default");
    const filteredFonts = useFontFilter(fonts, filters);
    const sortedFonts = React.useMemo(() => {
        const sorted = [...filteredFonts];
        if (sortMode === "alpha") sorted.sort((a, b) => a.name.localeCompare(b.name));
        if (sortMode === "weights") sorted.sort((a, b) => b.weights.length - a.weights.length);
        return sorted;
    }, [filteredFonts, sortMode]);
    const [visibleCount, setVisibleCount] = useState(15);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const BATCH_SIZE = 15;
    const currentFonts = sortedFonts.slice(0, visibleCount);
    const loadMore = useCallback(() => { if (visibleCount < sortedFonts.length) setVisibleCount(prev => Math.min(prev + BATCH_SIZE, sortedFonts.length)); }, [visibleCount, sortedFonts.length]);
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) loadMore(); }, { threshold: 0.1 });
        if (loadMoreRef.current) observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [loadMore]);
    useEffect(() => { setVisibleCount(BATCH_SIZE); }, [filters, sortMode]);
    const handlePangramChange = (mode: keyof typeof PANGRAMS) => { setPangramMode(mode); setPreviewText(PANGRAMS[mode]); };
    const removeCategory = (cat: string) => setFilters(prev => ({ ...prev, categories: prev.categories.filter(c => c !== cat) }));
    const removeLanguage = (lang: string) => setFilters(prev => ({ ...prev, languages: prev.languages.filter(l => l !== lang) }));
    const [showScrollTop, setShowScrollTop] = useState(false);
    useEffect(() => { const handleScroll = () => setShowScrollTop(window.scrollY > 400); window.addEventListener("scroll", handleScroll); return () => window.removeEventListener("scroll", handleScroll); }, []);
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
    const stackFonts = fonts.filter(f => compareList.includes(f.id));
    const clearFilters = () => setFilters({ search: "", categories: [], languages: [], variableOnly: false, licenses: [], sources: [], minWeights: undefined });
    return (<div className="flex flex-col min-h-screen bg-white w-full font-sans text-black pb-20">
      <FontLoader fonts={currentFonts}/>
      <div className="sticky top-16 z-40 bg-white border-b border-neutral-200">
         <div className="flex flex-row items-stretch h-14 md:h-auto">
            <div className="flex items-center w-[40%] md:w-72 flex-shrink-0 border-r border-neutral-200 p-2 md:p-4">
                <button className="md:hidden mr-2 p-1.5 border border-neutral-300 hover:bg-neutral-100 transition-colors flex-shrink-0" onClick={() => setIsFilterOpen(!isFilterOpen)} aria-label={isFilterOpen ? "Close filters" : "Open filters"} aria-expanded={isFilterOpen}><Settings2 className="w-3.5 h-3.5"/></button>
                <div className="relative flex-grow min-w-0"><Search className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"/><input type="text" placeholder={t('search.placeholder').toUpperCase()} value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} className="h-8 md:h-10 w-full bg-transparent border-b border-transparent focus:border-neutral-400 pl-5 pr-1 text-[10px] md:text-sm font-mono uppercase placeholder:text-neutral-400 focus:outline-none transition-all truncate"/></div>
            </div>
            <div className="relative flex-grow md:border-r border-neutral-200 p-2 md:p-4 flex flex-col xl:flex-row items-center gap-6 justify-center">
                <div className="flex-grow relative w-full flex items-center gap-2">
                     <input type="text" placeholder={t('preview.placeholder').toUpperCase()} value={previewText} onChange={(e) => setPreviewText(e.target.value)} className="h-8 md:h-10 flex-grow bg-transparent text-sm md:text-2xl font-light placeholder:text-neutral-200 focus:outline-none min-w-0"/>
                    <div className="relative group shrink-0"><button className="h-8 md:h-10 px-2 md:px-3 border border-transparent hover:border-neutral-300 hover:bg-neutral-50 transition-all flex items-center gap-2 font-mono text-[10px] uppercase"><span className="hidden sm:inline">{pangramMode}</span><ChevronDown className="w-3 h-3"/></button><div className="absolute top-full right-0 bg-white border border-neutral-200 w-40 hidden group-hover:block z-50 shadow-lg overflow-hidden">{(Object.keys(PANGRAMS) as Array<keyof typeof PANGRAMS>).map((mode) => (<button key={mode} onClick={() => handlePangramChange(mode)} className="w-full text-left px-4 py-2 text-xs font-mono uppercase hover:bg-neutral-100 transition-colors">{mode}</button>))}</div></div>
                </div>
                <div className="hidden md:flex flex-col sm:flex-row gap-6 w-full xl:w-auto shrink-0">
                    <div className="flex items-center gap-3 w-full sm:w-40"><span className="font-mono text-[10px] uppercase text-neutral-400 whitespace-nowrap w-12">Size {globalFontSize}</span><input type="range" min="16" max="120" value={globalFontSize} onChange={(e) => setGlobalFontSize(Number(e.target.value))} className="w-full h-px bg-black appearance-none cursor-pointer accent-black"/></div>
                    <div className="flex items-center gap-3 w-full sm:w-40"><div className="flex items-center gap-1 w-12"><MoveHorizontal className="w-3 h-3 text-neutral-400"/><span className="font-mono text-[10px] uppercase text-neutral-400 whitespace-nowrap">{(globalTracking * 100).toFixed(0)}</span></div><input type="range" min="-5" max="20" step="1" value={globalTracking * 100} onChange={(e) => setGlobalTracking(Number(e.target.value) / 100)} className="w-full h-px bg-black appearance-none cursor-pointer accent-black"/></div>
                </div>
            </div>
            <div className="hidden md:flex w-auto items-center justify-center p-4 gap-2 bg-white"><button onClick={() => setViewMode("list")} className={cn("p-2 border border-neutral-300 transition-all", viewMode === "list" ? "bg-neutral-800 text-white border-neutral-800" : "hover:bg-neutral-100")} aria-label="List view"><ListIcon className="w-4 h-4"/></button><button onClick={() => setViewMode("grid")} className={cn("p-2 border border-neutral-300 transition-all", viewMode === "grid" ? "bg-neutral-800 text-white border-neutral-800" : "hover:bg-neutral-100")} aria-label="Grid view"><LayoutGrid className="w-4 h-4"/></button></div>
         </div>
      </div>
      <div className="flex flex-grow w-full relative">
         <div className={cn("fixed inset-y-0 left-0 z-30 w-72 bg-white border-r border-neutral-200 transform transition-transform duration-300 ease-in-out pt-32 md:pt-[137px] pb-10", isFilterOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0")}><div className="h-full"><FilterPanel filters={filters} setFilters={setFilters}/></div></div>
         <div className={cn("flex-grow w-full transition-all duration-300 min-h-screen", "md:pl-72")}>
             <div className="border-b border-neutral-200 px-6 py-4"><div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="flex flex-wrap gap-2 items-center min-h-[24px]">
                     {filters.categories.map(cat => (<button key={cat} onClick={() => removeCategory(cat)} className="flex items-center gap-1 bg-neutral-800 text-white px-2.5 py-1 font-mono text-[10px] uppercase hover:bg-red-500 transition-colors group">{cat} <X className="w-3 h-3 group-hover:scale-110"/></button>))}
                     {filters.languages.map(lang => (<button key={lang} onClick={() => removeLanguage(lang)} className="flex items-center gap-1 border border-neutral-300 px-2.5 py-1 font-mono text-[10px] uppercase hover:border-red-400 hover:text-red-500 transition-colors group">{lang} <X className="w-3 h-3 group-hover:scale-110"/></button>))}
                     {filters.variableOnly && (<button onClick={() => setFilters(prev => ({ ...prev, variableOnly: false }))} className="flex items-center gap-1 bg-neutral-200 px-2.5 py-1 font-mono text-[10px] uppercase hover:bg-red-500 hover:text-white transition-colors group">VAR ONLY <X className="w-3 h-3"/></button>)}
                     {(filters.categories.length > 0 || filters.languages.length > 0 || filters.variableOnly) && (<button onClick={clearFilters} className="text-[10px] font-mono uppercase underline decoration-neutral-300 hover:decoration-black underline-offset-2 text-neutral-400 hover:text-black ml-2">{t('compare.clear')}</button>)}
                     {!filters.categories.length && !filters.languages.length && !filters.variableOnly && (<span className="font-mono text-xs uppercase tracking-widest text-neutral-400">{t('filters.index')}</span>)}
                 </div>
                 <div className="flex items-center gap-4 shrink-0"><div className="relative group"><button className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-neutral-400 hover:text-black transition-colors" aria-label="Sort options" aria-haspopup="true"><ArrowDownAZ className="w-3 h-3"/><span className="hidden sm:inline">{sortMode === "default" ? t('sort.popularity') : sortMode === "alpha" ? t('sort.alpha') : t('sort.styles')}</span><ChevronDown className="w-3 h-3"/></button><div className="absolute top-full right-0 bg-white border border-neutral-200 w-44 hidden group-hover:block z-50 shadow-lg overflow-hidden">{([{ key: "default" as const, label: t('sort.popularity') }, { key: "alpha" as const, label: t('sort.alpha') }, { key: "weights" as const, label: t('sort.styles') }]).map((opt) => (<button key={opt.key} onClick={() => setSortMode(opt.key)} className={cn("w-full text-left px-4 py-2 text-xs font-mono uppercase hover:bg-neutral-100 transition-colors", sortMode === opt.key && "bg-neutral-100")}>{opt.label}</button>))}</div></div><span className="font-mono text-xs shrink-0" style={{ fontWeight: 700 }}>{filteredFonts.length} {t('fonts.label').toUpperCase()}</span></div>
             </div></div>
             {filteredFonts.length === 0 && (<div className="flex flex-col items-center justify-center py-32 px-8 text-center"><div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-6">0 {t('fonts.count')}</div><h3 className="text-4xl md:text-6xl tracking-tighter mb-6 leading-none" style={{ fontWeight: 700 }}>{t('fonts.notFound')}</h3><p className="font-mono text-xs uppercase tracking-[0.15em] text-neutral-500 mb-8 max-w-sm leading-relaxed">{t('filters.platform.note')}</p><button onClick={clearFilters} className="px-8 py-3 bg-neutral-800 text-white font-mono text-xs uppercase tracking-widest hover:bg-neutral-700 transition-colors">{t('filters.reset')}</button></div>)}
             {filteredFonts.length > 0 && (<div className={cn(viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col")}>{currentFonts.map((font) => (<FontCard key={font.id} font={font} previewText={previewText} isFavorite={favorites.includes(font.id)} isCompared={compareList.includes(font.id)} fontSize={globalFontSize} letterSpacing={globalTracking} onToggleFavorite={toggleFavorite} onToggleCompare={toggleCompare} onViewDetails={viewDetails} layout={viewMode}/>))}</div>)}
             <div ref={loadMoreRef} className="h-32 flex items-center justify-center border-t border-neutral-200">{visibleCount < sortedFonts.length && (<div className="font-mono text-xs animate-pulse">{t('status.loading').toUpperCase()}</div>)}</div>
         </div>
      </div>
      {compareList.length > 0 && (<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white p-2.5 shadow-2xl w-[90vw] max-w-2xl flex items-center justify-between"><div className="flex items-center gap-4 overflow-x-auto px-2"><span className="font-mono text-[10px] uppercase tracking-widest whitespace-nowrap text-neutral-400 hidden sm:inline">{t('compare.stack')} ({compareList.length}/3)</span>{stackFonts.map(f => (<div key={f.id} className="flex items-center gap-2 bg-neutral-800 px-3 py-1"><span className="font-bold text-xs whitespace-nowrap">{f.name}</span><button onClick={() => toggleCompare(f.id)} className="hover:text-red-400"><X className="w-3 h-3"/></button></div>))}</div><button onClick={onOpenStack} className="ml-4 bg-white text-black px-5 py-2.5 font-mono text-xs font-bold uppercase hover:bg-neutral-200 transition-colors flex items-center gap-2 whitespace-nowrap"><span>{t('compare.construct')}</span><ArrowRight className="w-3 h-3"/></button></div>)}
      {isFilterOpen && (<div className="fixed inset-0 bg-black/20 z-20 md:hidden backdrop-blur-sm" onClick={() => setIsFilterOpen(false)}/>)}
      <AnimatePresence>{showScrollTop && (<motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} onClick={scrollToTop} className={cn("fixed right-6 z-40 p-3 bg-neutral-800 text-white hover:bg-neutral-700 transition-colors shadow-lg", compareList.length > 0 ? "bottom-24" : "bottom-6")} aria-label="Scroll to top"><ArrowUp className="w-5 h-5"/></motion.button>)}</AnimatePresence>
    </div>);
};