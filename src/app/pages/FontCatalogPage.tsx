import React from "react";
import { createPortal } from "react-dom";
import { LayoutGrid, List as ListIcon, Search, Settings2, X } from "lucide-react";
import { useSearchParams } from "react-router";
import { Font } from "@/data/mockFonts";
import { FontCard } from "@/components/FontCard";
import { FilterPanel, FilterState } from "@/components/FilterPanel";
import { Drawer } from "@/components/ui/Drawer";
import { FontLoader } from "@/components/FontLoader";
import { useFontFilter } from "@/hooks/useFontFilter";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

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
type SortMode = "default" | "alpha";

interface CatalogSession {
  pendingReturn: boolean;
  search: string;
  visibleCount: number;
  scrollY: number;
  anchorId?: string;
  anchorOffset?: number;
  focusKey?: string;
}

const BATCH_SIZE = 20;
const SESSION_KEY = "onod:catalog-browsing-session";

const EMPTY_FILTERS: FilterState = {
  search: "",
  categories: [],
  languages: [],
  variableOnly: false,
  licenses: [],
  sources: [],
  minWeights: undefined,
};

const parseList = (params: URLSearchParams, key: string) => (params.get(key) || "")
  .split(",")
  .map(item => item.trim())
  .filter(Boolean);

const parseNumber = (value: string | null, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
};

const filtersFromParams = (params: URLSearchParams): FilterState => ({
  ...EMPTY_FILTERS,
  search: params.get("q") || "",
  categories: parseList(params, "cat"),
  languages: parseList(params, "script"),
  variableOnly: params.get("variable") === "1",
});

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((value, index) => value === b[index]);
const sameFilters = (a: FilterState, b: FilterState) => (
  a.search === b.search
  && sameList(a.categories, b.categories)
  && sameList(a.languages, b.languages)
  && a.variableOnly === b.variableOnly
  && sameList(a.licenses, b.licenses)
  && sameList(a.sources, b.sources)
  && a.minWeights === b.minWeights
);

function readCatalogSession(): CatalogSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CatalogSession>;
    if (typeof parsed.visibleCount !== "number" || typeof parsed.scrollY !== "number") return null;
    return {
      pendingReturn: parsed.pendingReturn === true,
      search: typeof parsed.search === "string" ? parsed.search : "",
      visibleCount: Math.max(BATCH_SIZE, Math.floor(parsed.visibleCount)),
      scrollY: Math.max(0, parsed.scrollY),
      anchorId: typeof parsed.anchorId === "string" ? parsed.anchorId : undefined,
      anchorOffset: typeof parsed.anchorOffset === "number" ? parsed.anchorOffset : undefined,
      focusKey: typeof parsed.focusKey === "string" ? parsed.focusKey : undefined,
    };
  } catch {
    try { window.sessionStorage.removeItem(SESSION_KEY); } catch { /* Storage can be unavailable. */ }
    return null;
  }
}

function writeCatalogSession(value: CatalogSession) {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
  } catch {
    // Browsing state is an enhancement; private mode and quotas must not break the catalog.
  }
}

function canonicalSearch(params: URLSearchParams) {
  const next = new URLSearchParams(params);
  next.delete("preview");
  const value = next.toString();
  return value ? `?${value}` : "";
}

export const FontCatalogPage: React.FC<FontCatalogPageProps> = ({
  fonts,
  previewText,
  setPreviewText,
  favorites,
  toggleFavorite,
  compareList,
  toggleCompare,
  viewDetails,
  onOpenStack,
}) => {
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsString = searchParams.toString();
  const initialParams = React.useRef(new URLSearchParams(paramsString));
  const initialSession = React.useRef(readCatalogSession());
  const restorableSession = initialSession.current?.pendingReturn
    && initialSession.current.search === canonicalSearch(initialParams.current)
    ? initialSession.current
    : null;
  const [filters, setFilters] = React.useState<FilterState>(() => filtersFromParams(initialParams.current));
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<ViewMode>(() => initialParams.current.get("view") === "grid" ? "grid" : "list");
  const [sortMode, setSortMode] = React.useState<SortMode>(() => initialParams.current.get("sort") === "alpha" ? "alpha" : "default");
  const [globalFontSize, setGlobalFontSize] = React.useState(() => parseNumber(initialParams.current.get("size"), 64, 24, 160));
  const [visibleCount, setVisibleCount] = React.useState(() => restorableSession?.visibleCount || BATCH_SIZE);
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const filterTriggerRef = React.useRef<HTMLButtonElement>(null);
  const legacyPreviewHandledRef = React.useRef(false);
  const lastParamsRef = React.useRef(paramsString);
  const suppressUrlWriteRef = React.useRef(false);
  const navigatingToDetailsRef = React.useRef(false);
  const restorationRef = React.useRef(restorableSession);
  const catalogStateRef = React.useRef({ visibleCount, paramsString });

  if (lastParamsRef.current !== paramsString) {
    lastParamsRef.current = paramsString;
    suppressUrlWriteRef.current = true;
  }

  React.useEffect(() => {
    if (!isDesktop) return;
    setIsFilterOpen(false);
  }, [isDesktop]);

  React.useEffect(() => {
    const params = new URLSearchParams(paramsString);
    const nextFilters = filtersFromParams(params);
    setFilters(previous => sameFilters(previous, nextFilters) ? previous : nextFilters);
    setViewMode(params.get("view") === "grid" ? "grid" : "list");
    setSortMode(params.get("sort") === "alpha" ? "alpha" : "default");
    setGlobalFontSize(parseNumber(params.get("size"), 64, 24, 160));

    if (!legacyPreviewHandledRef.current) {
      legacyPreviewHandledRef.current = true;
      const legacyPreview = params.get("preview");
      if (legacyPreview && !previewText) setPreviewText(legacyPreview.slice(0, 500));
    }
  }, [paramsString, previewText, setPreviewText]);

  React.useEffect(() => {
    if (suppressUrlWriteRef.current) {
      suppressUrlWriteRef.current = false;
      return;
    }
    const next = new URLSearchParams(searchParams);
    const setList = (key: string, values: string[]) => values.length ? next.set(key, values.join(",")) : next.delete(key);

    filters.search ? next.set("q", filters.search) : next.delete("q");
    setList("cat", filters.categories);
    setList("script", filters.languages);
    filters.variableOnly ? next.set("variable", "1") : next.delete("variable");
    sortMode === "alpha" ? next.set("sort", "alpha") : next.delete("sort");
    viewMode === "grid" ? next.set("view", "grid") : next.delete("view");
    globalFontSize !== 64 ? next.set("size", String(globalFontSize)) : next.delete("size");

    next.delete("preview");
    next.delete("source");
    next.delete("license");
    next.delete("minw");
    next.delete("tracking");
    next.delete("pangram");

    if (next.toString() !== paramsString) setSearchParams(next, { replace: true });
  }, [filters, globalFontSize, paramsString, searchParams, setSearchParams, sortMode, viewMode]);

  const filteredFonts = useFontFilter(fonts, filters);
  const sortedFonts = React.useMemo(() => {
    if (sortMode !== "alpha") return filteredFonts;
    return [...filteredFonts].sort((a, b) => (
      a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true }) || a.id.localeCompare(b.id)
    ));
  }, [filteredFonts, sortMode]);
  const currentFonts = sortedFonts.slice(0, visibleCount);

  React.useEffect(() => {
    if (restorationRef.current) return;
    setVisibleCount(BATCH_SIZE);
  }, [filters, sortMode, viewMode]);

  catalogStateRef.current = { visibleCount, paramsString };

  const saveBrowsingState = React.useCallback((pendingReturn: boolean, preferredFontId?: string) => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-font-id]"));
    const anchor = cards.find(card => card.dataset.fontId === preferredFontId) || cards.find(card => card.getBoundingClientRect().bottom > 128) || cards[0];
    const focused = document.activeElement instanceof HTMLElement
      ? document.activeElement.closest<HTMLElement>("[data-catalog-focus-key]")
      : null;
    writeCatalogSession({
      pendingReturn,
      search: canonicalSearch(new URLSearchParams(catalogStateRef.current.paramsString)),
      visibleCount: catalogStateRef.current.visibleCount,
      scrollY: window.scrollY,
      anchorId: anchor?.dataset.fontId,
      anchorOffset: anchor?.getBoundingClientRect().top,
      focusKey: focused?.dataset.catalogFocusKey,
    });
  }, []);

  React.useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (!navigatingToDetailsRef.current) saveBrowsingState(false);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      if (!navigatingToDetailsRef.current) saveBrowsingState(false);
    };
  }, [saveBrowsingState]);

  React.useEffect(() => {
    const saved = restorationRef.current;
    if (!saved) return;
    restorationRef.current = null;
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        const anchor = saved.anchorId
          ? Array.from(document.querySelectorAll<HTMLElement>("[data-font-id]")).find(card => card.dataset.fontId === saved.anchorId)
          : null;
        if (anchor && typeof saved.anchorOffset === "number") {
          window.scrollBy(0, anchor.getBoundingClientRect().top - saved.anchorOffset);
        } else {
          window.scrollTo(0, saved.scrollY);
        }
        if (saved.focusKey) {
          const focusTarget = Array.from(document.querySelectorAll<HTMLElement>("[data-catalog-focus-key]"))
            .find(element => element.dataset.catalogFocusKey === saved.focusKey);
          focusTarget?.focus({ preventScroll: true });
        }
        writeCatalogSession({ ...saved, pendingReturn: false });
      });
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, []);

  const openDetails = (fontId: string) => {
    navigatingToDetailsRef.current = true;
    saveBrowsingState(true, fontId);
    viewDetails(fontId);
  };

  const resetFilters = () => setFilters({ ...EMPTY_FILTERS });
  const removeFilter = (group: "search" | "categories" | "languages" | "variable", value?: string) => {
    setFilters(previous => {
      if (group === "search") return { ...previous, search: "" };
      if (group === "variable") return { ...previous, variableOnly: false };
      return { ...previous, [group]: previous[group].filter(item => item !== value) };
    });
  };

  const activeChips = [
    ...(filters.search ? [{ group: "search" as const, value: filters.search, label: `“${filters.search}”` }] : []),
    ...filters.categories.map(value => ({ group: "categories" as const, value, label: value })),
    ...filters.languages.map(value => ({ group: "languages" as const, value, label: value })),
    ...(filters.variableOnly ? [{ group: "variable" as const, value: "variable", label: language === "ru" ? "Вариативные" : "Variable" }] : []),
  ];

  const labels = language === "ru"
    ? {
        filters: "Фильтры",
        search: "Поиск шрифтов",
        preview: "Образец",
        size: "Кегль",
        sort: "Сортировка",
        relevance: "Поиск",
        alpha: "А–Я",
        list: "Список",
        grid: "Сетка",
        reset: "Сбросить",
        loadMore: "Показать ещё",
        shown: "Найдено",
        of: "из",
        compare: "Сравнить",
        noMatches: "Шрифты не найдены",
      }
    : {
        filters: "Filters",
        search: "Search fonts",
        preview: "Sample",
        size: "Size",
        sort: "Sort",
        relevance: "Relevance",
        alpha: "A–Z",
        list: "List",
        grid: "Grid",
        reset: "Reset",
        loadMore: "Load more",
        shown: "Found",
        of: "of",
        compare: "Compare",
        noMatches: "No fonts found",
      };

  const filterPanel = <FilterPanel filters={filters} setFilters={setFilters} fonts={fonts} />;

  return (
    <div className="min-h-screen bg-white text-black">
      <FontLoader fonts={currentFonts} />

      <div className="sticky top-16 z-40 border-b border-neutral-200 bg-white">
        <div className="xl:grid xl:grid-cols-[18rem_minmax(0,1fr)]">
          <div className="flex h-14 items-center gap-3 border-b border-neutral-200 px-3 xl:h-16 xl:border-b-0 xl:border-r xl:px-5">
            {!isDesktop && (
              <button
                ref={filterTriggerRef}
                type="button"
                onClick={() => setIsFilterOpen(true)}
                className="onod-icon-button shrink-0"
                aria-label={labels.filters}
                aria-haspopup="dialog"
                aria-expanded={isFilterOpen}
              >
                <Settings2 className="size-4" aria-hidden="true" />
              </button>
            )}
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">{labels.search}</span>
              <Search className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
              <input
                type="search"
                placeholder={labels.search}
                value={filters.search}
                onChange={event => setFilters(previous => ({ ...previous, search: event.target.value }))}
                className="h-10 w-full min-w-0 border-0 bg-transparent pl-6 font-mono text-[12px] uppercase outline-none placeholder:text-neutral-500"
              />
            </label>
          </div>

          <div className="flex h-14 min-w-0 items-center gap-3 border-b border-neutral-200 px-3 xl:h-16 xl:border-b-0 xl:px-5">
            <label className="flex min-w-0 flex-1 items-center gap-3">
              <span className="shrink-0 font-mono text-[11px] uppercase tracking-wide text-neutral-600">{labels.preview}</span>
              <input
                type="text"
                placeholder={language === "ru" ? "Введите текст" : "Type a sample"}
                value={previewText}
                onChange={event => setPreviewText(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-base font-light outline-none placeholder:text-neutral-500 sm:text-lg"
              />
            </label>

            <div className="hidden xl:flex xl:items-center xl:gap-3">
              <label className="flex w-44 items-center gap-2">
                <span className="font-mono text-[11px] uppercase text-neutral-600">{labels.size}</span>
                <span className="w-10 text-right font-mono text-[11px] tabular-nums text-neutral-700">{globalFontSize}px</span>
                <input
                  aria-label={labels.size}
                  type="range"
                  min="24"
                  max="160"
                  value={globalFontSize}
                  onChange={event => setGlobalFontSize(Number(event.target.value))}
                  className="onod-range min-w-0 flex-1"
                />
              </label>
              <label>
                <span className="sr-only">{labels.sort}</span>
                <select value={sortMode} onChange={event => setSortMode(event.target.value as SortMode)} className="onod-select h-10">
                  <option value="default">{labels.relevance}</option>
                  <option value="alpha">{labels.alpha}</option>
                </select>
              </label>
              <ViewToggle viewMode={viewMode} setViewMode={setViewMode} labels={labels} />
              {compareList.length > 0 && (
                <button type="button" onClick={onOpenStack} className="onod-button">
                  {labels.compare} ({compareList.length})
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid h-12 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 px-3 xl:hidden">
          <label className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 font-mono text-[11px] uppercase text-neutral-600">{labels.size}</span>
            <span className="w-9 shrink-0 text-right font-mono text-[11px] tabular-nums">{globalFontSize}</span>
            <input
              aria-label={labels.size}
              type="range"
              min="24"
              max="160"
              value={globalFontSize}
              onChange={event => setGlobalFontSize(Number(event.target.value))}
              className="onod-range min-w-0"
            />
          </label>
          <label>
            <span className="sr-only">{labels.sort}</span>
            <select value={sortMode} onChange={event => setSortMode(event.target.value as SortMode)} className="onod-select h-10 w-[100px]">
              <option value="default">{labels.relevance}</option>
              <option value="alpha">{labels.alpha}</option>
            </select>
          </label>
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} labels={labels} />
        </div>
      </div>

      <div className="relative min-h-screen">
        {isDesktop && typeof document !== "undefined" && createPortal(
          <aside className="fixed bottom-0 left-0 top-32 z-30 w-72 border-r border-neutral-200 bg-white" aria-label={labels.filters}>
            {filterPanel}
          </aside>,
          document.body,
        )}

        <div className="min-h-screen xl:pl-72">
          <div className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-neutral-200 px-4 py-2 xl:px-6">
            <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-600" aria-live="polite">
              {labels.shown} {filteredFonts.length} {labels.of} {fonts.length}
              {activeChips.length > 0 ? ` · ${activeChips.length} ${labels.filters.toLocaleLowerCase()}` : ""}
            </span>
            {activeChips.length > 0 && (
              <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1.5">
                {activeChips.map(chip => (
                  <button
                    type="button"
                    key={`${chip.group}:${chip.value}`}
                    onClick={() => removeFilter(chip.group, chip.value)}
                    className="onod-chip"
                    aria-label={`${language === "ru" ? "Убрать фильтр" : "Remove filter"}: ${chip.label}`}
                  >
                    <span className="max-w-36 truncate">{chip.label}</span>
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                ))}
                <button type="button" onClick={resetFilters} className="onod-button onod-button--quiet px-2">{labels.reset}</button>
              </div>
            )}
          </div>

          {filteredFonts.length === 0 ? (
            <div className="flex min-h-[55vh] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 font-mono text-[11px] uppercase tracking-widest text-neutral-600">0 / {fonts.length}</div>
              <h2 className="text-4xl font-semibold leading-none tracking-tighter md:text-6xl">{labels.noMatches}</h2>
              <button type="button" onClick={resetFilters} className="onod-button onod-button--primary mt-8 px-6">{labels.reset}</button>
            </div>
          ) : (
            <div className={cn(viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3" : "flex flex-col")}>
              {currentFonts.map(font => (
                <FontCard
                  key={font.id}
                  font={font}
                  previewText={previewText}
                  isFavorite={favorites.includes(font.id)}
                  isCompared={compareList.includes(font.id)}
                  fontSize={globalFontSize}
                  letterSpacing={0}
                  onToggleFavorite={toggleFavorite}
                  onToggleCompare={toggleCompare}
                  onViewDetails={openDetails}
                  layout={viewMode}
                />
              ))}
            </div>
          )}

          {visibleCount < sortedFonts.length && (
            <div className="flex min-h-24 items-center justify-center border-t border-neutral-200 px-4">
              <button
                type="button"
                onClick={() => setVisibleCount(previous => Math.min(previous + BATCH_SIZE, sortedFonts.length))}
                className="onod-button px-6"
              >
                {labels.loadMore} ({Math.min(BATCH_SIZE, sortedFonts.length - visibleCount)})
              </button>
            </div>
          )}
        </div>
      </div>

      {!isDesktop && (
        <Drawer
          open={isFilterOpen}
          onOpenChange={setIsFilterOpen}
          title={labels.filters}
          description={`${filteredFonts.length} ${labels.of} ${fonts.length}`}
          returnFocusRef={filterTriggerRef}
        >
          {filterPanel}
        </Drawer>
      )}
    </div>
  );
};

interface ViewToggleProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  labels: { list: string; grid: string };
}

function ViewToggle({ viewMode, setViewMode, labels }: ViewToggleProps) {
  return (
    <div className="flex shrink-0 border border-neutral-300" role="group" aria-label={`${labels.list} / ${labels.grid}`}>
      <button
        type="button"
        onClick={() => setViewMode("list")}
        className={cn("onod-icon-button border-0", viewMode === "list" && "bg-neutral-900 text-white hover:bg-neutral-900")}
        aria-label={labels.list}
        aria-pressed={viewMode === "list"}
      >
        <ListIcon className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => setViewMode("grid")}
        className={cn("onod-icon-button border-y-0 border-r-0", viewMode === "grid" && "bg-neutral-900 text-white hover:bg-neutral-900")}
        aria-label={labels.grid}
        aria-pressed={viewMode === "grid"}
      >
        <LayoutGrid className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
