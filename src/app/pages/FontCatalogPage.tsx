import React, { useCallback, useEffect, useRef, useState } from "react";
import { LayoutGrid, List as ListIcon, RotateCcw, Search, Settings2, X } from "lucide-react";
import { useSearchParams } from "react-router";
import { Font } from "@/data/mockFonts";
import { orderCatalog, type CatalogSort } from "@/data/editorialOrder";
import { FontCard } from "@/components/FontCard";
import { FilterPanel, FilterState } from "@/components/FilterPanel";
import { Dropdown } from "@/components/ui/Dropdown";
import { FontLoader } from "@/components/FontLoader";
import { useFontFilter } from "@/hooks/useFontFilter";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import "../../styles/catalog-preview.css";

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

type ViewMode = "grid" | "list";

interface CatalogSliderProps {
  id: string;
  label: string;
  min: number;
  max: number;
  value: number;
  unit?: string;
  step?: number;
  onChange: (value: number) => void;
}

function CatalogSlider({ id, label, min, max, value, unit = "", step = 1, onChange }: CatalogSliderProps) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-1 font-mono text-[10px] leading-tight">
        <label htmlFor={id} className="truncate text-[10px] leading-tight font-normal text-neutral-600">{label}</label>
        <output htmlFor={id} aria-live="off" className="shrink-0 tabular-nums text-neutral-900">{value}{unit}</output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value}
        aria-valuetext={`${value}${unit}`} onChange={event => onChange(event.currentTarget.valueAsNumber)}
        className="catalog-preview-range" />
    </div>
  );
}

const parseList = (params: URLSearchParams, key: string) => (params.get(key) || "")
  .split(",")
  .map(item => item.trim())
  .filter(Boolean);

const parseNumber = (value: string | null, fallback: number, min: number, max: number, step = 1) => {
  if (!value?.trim()) return fallback;
  const parsed = Math.round(Number(value) / step) * step;
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
};

const initialFilters = (params: URLSearchParams): FilterState => ({
  search: params.get("q") || "",
  categories: parseList(params, "cat"),
  languages: parseList(params, "script"),
  variableOnly: params.get("variable") === "1",
  collection: params.get("collection") === "expanded" ? "expanded" : params.get("collection") === "ofl" ? "ofl" : null,
  licenses: [],
  sources: [],
  minWeights: undefined,
});

export const FontCatalogPage: React.FC<FontCatalogPageProps> = ({
  fonts,
  previewText,
  setPreviewText,
  favorites,
  toggleFavorite,
  viewDetails,
}) => {
  const { language, t } = useLanguage();
  const pluralRules = React.useMemo(() => new Intl.PluralRules(language), [language]);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialParams = useRef(new URLSearchParams(searchParams));
  const [filters, setFilters] = useState<FilterState>(() => initialFilters(initialParams.current));
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => initialParams.current.get("view") === "grid" ? "grid" : "list");
  const [sortMode, setSortMode] = useState<CatalogSort>(() => initialParams.current.get("sort") === "alpha" ? "alpha" : "default");
  const [globalFontSize, setGlobalFontSize] = useState(() => parseNumber(initialParams.current.get("size"), 64, 24, 120));
  const [tracking, setTracking] = useState(() => parseNumber(initialParams.current.get("tracking"), 0, -5, 20));
  const [weight, setWeight] = useState(() => parseNumber(initialParams.current.get("weight"), 400, 100, 900, 10));
  const previewChanged = globalFontSize !== 64 || tracking !== 0 || weight !== 400;

  const resetPreview = () => {
    setGlobalFontSize(64);
    setTracking(0);
    setWeight(400);
  };

  useEffect(() => {
    const urlPreview = initialParams.current.get("preview");
    if (urlPreview && !previewText) setPreviewText(urlPreview.slice(0, 500));
  }, [previewText, setPreviewText]);

  useEffect(() => {
    setSearchParams(current => {
      const next = new URLSearchParams(current);
      const setList = (key: string, values: string[]) => values.length ? next.set(key, values.join(",")) : next.delete(key);

      filters.search ? next.set("q", filters.search) : next.delete("q");
      filters.collection ? next.set("collection", filters.collection) : next.delete("collection");
      setList("cat", filters.categories);
      setList("script", filters.languages);
      filters.variableOnly ? next.set("variable", "1") : next.delete("variable");
      sortMode === "alpha" ? next.set("sort", "alpha") : next.delete("sort");
      viewMode === "grid" ? next.set("view", "grid") : next.delete("view");
      globalFontSize !== 64 ? next.set("size", String(globalFontSize)) : next.delete("size");
      tracking !== 0 ? next.set("tracking", String(tracking)) : next.delete("tracking");
      weight !== 400 ? next.set("weight", String(weight)) : next.delete("weight");
      previewText ? next.set("preview", previewText.slice(0, 500)) : next.delete("preview");

      next.delete("source");
      next.delete("license");
      next.delete("minw");
      next.delete("pangram");

      return next.toString() === current.toString() ? current : next;
    }, { replace: true });
  }, [filters, sortMode, viewMode, globalFontSize, tracking, weight, previewText, setSearchParams]);

  const filteredFonts = useFontFilter(fonts, filters);
  const sortedFonts = React.useMemo(
    () => orderCatalog(filteredFonts, sortMode, filters.search),
    [filteredFonts, sortMode, filters.search],
  );

  const BATCH_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const currentFonts = React.useMemo(() => sortedFonts.slice(0, visibleCount), [sortedFonts, visibleCount]);

  const loadMore = useCallback(() => {
    if (visibleCount < sortedFonts.length) {
      setVisibleCount(previous => Math.min(previous + BATCH_SIZE, sortedFonts.length));
    }
  }, [visibleCount, sortedFonts.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) loadMore();
    }, { threshold: 0.1 });
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [filters, sortMode, viewMode]);

  const resetFilters = () => setFilters({
    search: "",
    categories: [],
    languages: [],
    variableOnly: false,
    collection: null,
    licenses: [],
    sources: [],
    minWeights: undefined,
  });

  const hasFilters = Boolean(filters.search || filters.categories.length || filters.languages.length || filters.variableOnly || filters.collection);

  return (
    <div className="min-h-screen bg-white text-black">
      <FontLoader fonts={currentFonts} />

      <div className="sticky top-16 z-40 bg-white border-b border-neutral-200">
        <div className="md:grid md:grid-cols-[18rem_minmax(0,1fr)]">
          <div className="h-14 md:h-16 pl-3 pr-36 sm:pr-3 md:px-5 flex items-center gap-3 md:border-r border-neutral-200">
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="md:hidden w-9 h-9 shrink-0 border border-neutral-200 flex items-center justify-center hover:bg-neutral-100 transition-colors"
              aria-label="Open filters"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <input
                type="search"
                placeholder={t('search.placeholder').toUpperCase()}
                value={filters.search}
                onChange={event => setFilters(previous => ({ ...previous, search: event.target.value }))}
                className="w-full h-10 pl-6 bg-transparent border-0 outline-none font-mono text-[11px] uppercase placeholder:text-neutral-400"
              />
            </div>
          </div>

          <div className="h-14 md:h-16 px-3 md:px-5 flex items-center gap-3 border-t md:border-t-0 border-neutral-100 min-w-0">
            <input
              type="text"
              placeholder={t('preview.placeholder')}
              value={previewText}
              onChange={event => setPreviewText(event.target.value)}
              className="min-w-0 flex-1 bg-transparent outline-none text-base md:text-xl font-light placeholder:text-neutral-300"
            />

            <Dropdown<CatalogSort>
              id="catalog-sort" label={t("sort.label")} value={sortMode} onChange={setSortMode}
              options={[
                { value: "default", label: t("sort.editorial") },
                { value: "alpha", label: t("sort.alpha") },
              ]}
              align="end"
              className="absolute right-3 top-2 h-10 w-32 sm:static sm:h-9 shrink-0 font-mono text-[10px] uppercase"
            />

            <div className="flex shrink-0 border border-neutral-200">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn("w-9 h-9 flex items-center justify-center transition-colors", viewMode === "list" ? "bg-neutral-900 text-white" : "bg-white hover:bg-neutral-100")}
                aria-label="List view"
                aria-pressed={viewMode === "list"}
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn("w-9 h-9 flex items-center justify-center border-l border-neutral-200 transition-colors", viewMode === "grid" ? "bg-neutral-900 text-white" : "bg-white hover:bg-neutral-100")}
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative min-h-screen">
        <aside className="hidden md:block fixed left-0 top-32 bottom-0 z-30 w-72 bg-white border-r border-neutral-200" aria-label="Font filters">
          <FilterPanel filters={filters} setFilters={setFilters} />
        </aside>

        <div className="md:pl-72 min-h-screen">
          <div className="sticky top-44 z-20 border-b border-neutral-200 bg-white md:top-32 lg:flex lg:items-center lg:justify-between">
            <div className="grid grid-cols-3 gap-4 px-3 pt-3 sm:gap-6 md:px-6 lg:order-2 lg:w-3/5 lg:max-w-2xl lg:pb-1">
              <CatalogSlider id="catalog-size" label={t("catalog.size")} value={globalFontSize} unit=" px"
                min={24} max={120} onChange={setGlobalFontSize} />
              <CatalogSlider id="catalog-tracking" label={t("catalog.tracking")} value={tracking} unit="%"
                min={-5} max={20} onChange={setTracking} />
              <CatalogSlider id="catalog-weight" label={t("catalog.weight")} value={weight}
                min={100} max={900} step={10} onChange={setWeight} />
            </div>

            <div className="flex min-h-9 items-center gap-3 px-3 md:px-6 lg:min-h-12">
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                {filteredFonts.length} {t('fonts.count.' + pluralRules.select(filteredFonts.length))}
              </span>
              {previewChanged && (
                <button type="button" id="catalog-reset-preview" onClick={resetPreview}
                  aria-label={t("catalog.resetPreview")} title={t("catalog.resetPreview")}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-neutral-500 hover:text-black focus-visible:outline">
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
              {hasFilters && (
                <button type="button" onClick={resetFilters} className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 hover:text-black">
                  {t('filters.reset')}
                </button>
              )}
            </div>
          </div>

          {filteredFonts.length === 0 ? (
            <div className="min-h-[60vh] px-8 flex flex-col items-center justify-center text-center">
              <div className="mb-5 font-mono text-[9px] uppercase tracking-widest text-neutral-400">0 {t('fonts.count')}</div>
              <h2 className="text-4xl md:text-6xl font-semibold tracking-tighter leading-none">{t('fonts.notFound')}</h2>
              <button type="button" onClick={resetFilters} className="mt-8 px-6 py-3 bg-neutral-900 text-white font-mono text-[10px] uppercase tracking-widest hover:bg-neutral-700 transition-colors">
                {t('filters.reset')}
              </button>
            </div>
          ) : (
            <div className={cn(viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "flex flex-col")}>
              {currentFonts.map(font => (
                <FontCard
                  key={font.id}
                  font={font}
                  previewText={previewText}
                  isFavorite={favorites.includes(font.id)}
                  fontSize={globalFontSize}
                  letterSpacing={tracking / 100}
                  requestedWeight={weight}
                  onToggleFavorite={toggleFavorite}
                  onViewDetails={viewDetails}
                  layout={viewMode}
                />
              ))}
            </div>
          )}

          <div ref={loadMoreRef} className="h-24 border-t border-neutral-200 flex items-center justify-center">
            {visibleCount < sortedFonts.length && <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">{t('status.loading')}</span>}
          </div>
        </div>
      </div>

      {isFilterOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-16 z-[70] bg-black/20 md:hidden"
            onClick={() => setIsFilterOpen(false)}
            aria-label="Close filters"
          />
          <aside className="fixed left-0 top-16 bottom-0 z-[71] w-[min(88vw,20rem)] bg-white border-r border-neutral-200 md:hidden flex flex-col" aria-label="Font filters">
            <div className="h-12 shrink-0 border-b border-neutral-200 px-3 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="w-8 h-8 border border-neutral-200 bg-white flex items-center justify-center hover:bg-neutral-100 transition-colors"
                aria-label="Close filters"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <FilterPanel filters={filters} setFilters={setFilters} />
            </div>
          </aside>
        </>
      )}
    </div>
  );
};
