import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  MoveHorizontal,
  Search,
  Upload,
} from "lucide-react";
import { Font, mockFonts } from "@/data/mockFonts";
import { FontCard } from "@/components/FontCard";
import { FontLoader } from "@/components/FontLoader";
import { useLanguage } from "@/lib/i18n";

interface FavoritesProps {
  fonts: Font[];
  previewText: string;
  setPreviewText: (text: string) => void;
  toggleFavorite: (id: string) => void;
  toggleCompare: (id: string) => void;
  compareList: string[];
  viewDetails: (id: string) => void;
  onGoToCatalog: () => void;
  /**
   * Optional bulk import hook. It receives the complete merged ID set so the
   * parent can replace its saved state without removing saves made previously.
   */
  onImportFavorites?: (ids: string[]) => void;
}

type SortMode = "recent" | "alpha";
type ImportNotice = {
  kind: "success" | "error" | "info";
  message: string;
  unknownIds?: string[];
};

interface SavedBackup {
  version: 1;
  fontIds: string[];
}

const PAGE_SIZE = 24;
const MAX_IMPORT_BYTES = 64 * 1024;
const MAX_IMPORT_IDS = 2_000;
const FAVORITES_STORAGE_KEY = "font-catalog-favorites";

const uniqueIds = (ids: string[]) => Array.from(new Set(ids));

const sameIds = (left: string[], right: string[]) =>
  left.length === right.length && left.every((id, index) => id === right[index]);

const readRecentOrder = () => {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return uniqueIds(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return [];
  }
};

const parseBackup = (raw: string): SavedBackup => {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Backup must be a JSON object.");
  }

  const candidate = parsed as Record<string, unknown>;
  if (candidate.version !== 1) throw new Error("Unsupported backup version.");
  if (!Array.isArray(candidate.fontIds)) throw new Error("Backup must contain a fontIds array.");
  if (candidate.fontIds.length > MAX_IMPORT_IDS) throw new Error("Backup contains too many IDs.");
  if (!candidate.fontIds.every(id => typeof id === "string" && id.length > 0 && id.length <= 128 && id.trim() === id)) {
    throw new Error("Every font ID must be a non-empty string of at most 128 characters.");
  }

  return { version: 1, fontIds: uniqueIds(candidate.fontIds as string[]) };
};

const controlClass = "h-9 border border-neutral-200 bg-white px-3 font-mono text-[11px] uppercase tracking-wider hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-colors";

export const FavoritesPage: React.FC<FavoritesProps> = ({
  fonts,
  previewText,
  setPreviewText,
  toggleFavorite,
  toggleCompare,
  compareList,
  viewDetails,
  onGoToCatalog,
  onImportFavorites,
}) => {
  const { t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [globalFontSize, setGlobalFontSize] = useState(64);
  const [globalTracking, setGlobalTracking] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [importNotice, setImportNotice] = useState<ImportNotice | null>(null);
  const [recentOrder, setRecentOrder] = useState<string[]>(() => {
    const currentIds = new Set(fonts.map(font => font.id));
    const stored = readRecentOrder().filter(id => currentIds.has(id));
    return [...stored, ...fonts.map(font => font.id).filter(id => !stored.includes(id))];
  });

  const copy = language === "ru" ? {
    saved: "Сохранённые",
    search: "Поиск в сохранённых...",
    recent: "Сначала новые",
    alpha: "По алфавиту",
    backup: "Скачать JSON",
    restore: "Импорт JSON",
    localOnly: "Список хранится только в этом браузере. JSON содержит лишь версию и ID гарнитур — без файлов шрифтов и ссылок на источники.",
    emptyTitle: "Пока ничего не сохранено",
    emptyBody: "Сохраняйте гарнитуры из каталога или восстановите резервную копию JSON.",
    noMatches: "В сохранённых ничего не найдено",
    clearSearch: "Очистить поиск",
    result: "гарнитур",
    page: "Страница",
    previous: "Предыдущая страница",
    next: "Следующая страница",
    exportReady: "Резервная копия сохранена. Файлы шрифтов в неё не включены.",
    fileTooLarge: "Файл слишком большой. Максимальный размер — 64 КБ.",
    importFailed: "Не удалось импортировать JSON",
    imported: "Добавлено гарнитур",
    alreadySaved: "Все известные гарнитуры из копии уже сохранены.",
    unknown: "Неизвестные ID пропущены",
    previewSize: "Размер превью",
    spacing: "Интервал",
    sortLabel: "Сортировка сохранённых гарнитур",
    pagesLabel: "Страницы сохранённых гарнитур",
  } : {
    saved: "Saved",
    search: "Search saved typefaces...",
    recent: "Recently saved",
    alpha: "Alphabetical",
    backup: "Download JSON",
    restore: "Import JSON",
    localOnly: "This list lives only in this browser. JSON includes only a version and typeface IDs—never font files or source links.",
    emptyTitle: "Nothing saved yet",
    emptyBody: "Save typefaces from the index or restore a JSON backup.",
    noMatches: "No saved typefaces match",
    clearSearch: "Clear search",
    result: "typefaces",
    page: "Page",
    previous: "Previous page",
    next: "Next page",
    exportReady: "Backup downloaded. No font files were included.",
    fileTooLarge: "That file is too large. The limit is 64 KB.",
    importFailed: "Could not import JSON",
    imported: "Typefaces added",
    alreadySaved: "Every known typeface in this backup is already saved.",
    unknown: "Unknown IDs skipped",
    previewSize: "Preview size",
    spacing: "Spacing",
    sortLabel: "Sort saved typefaces",
    pagesLabel: "Saved typeface pages",
  };

  useEffect(() => {
    const currentIds = new Set(fonts.map(font => font.id));
    setRecentOrder(previous => {
      const next = previous.filter(id => currentIds.has(id));
      for (const font of fonts) if (!next.includes(font.id)) next.push(font.id);
      return sameIds(previous, next) ? previous : next;
    });
  }, [fonts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, sortMode]);

  const knownFontIds = useMemo(() => new Set(mockFonts.map(font => font.id)), []);
  const currentIds = useMemo(() => new Set(fonts.map(font => font.id)), [fonts]);
  const recentRank = useMemo(() => new Map(recentOrder.map((id, index) => [id, index])), [recentOrder]);
  const collator = useMemo(() => new Intl.Collator(language, { sensitivity: "base" }), [language]);

  const filteredFonts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(language);
    const matches = normalizedQuery
      ? fonts.filter(font => [font.name, font.author, ...font.categories, ...font.tags]
        .join(" ")
        .toLocaleLowerCase(language)
        .includes(normalizedQuery))
      : fonts;

    return [...matches].sort((left, right) => {
      if (sortMode === "alpha") return collator.compare(left.name, right.name) || left.id.localeCompare(right.id);
      return (recentRank.get(right.id) ?? -1) - (recentRank.get(left.id) ?? -1);
    });
  }, [collator, fonts, language, query, recentRank, sortMode]);

  const pageCount = Math.max(1, Math.ceil(filteredFonts.length / PAGE_SIZE));
  const visiblePage = Math.min(currentPage, pageCount);
  const displayedFonts = filteredFonts.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [currentPage, pageCount]);

  const orderedCurrentIds = () => {
    const ordered = recentOrder.filter(id => currentIds.has(id));
    return [...ordered, ...fonts.map(font => font.id).filter(id => !ordered.includes(id))];
  };

  const downloadBackup = () => {
    const backup: SavedBackup = { version: 1, fontIds: orderedCurrentIds() };
    const blob = new Blob([`${JSON.stringify(backup, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `onod-fonts-saved-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setImportNotice({ kind: "success", message: copy.exportReady });
  };

  const importBackup = async (file: File) => {
    if (file.size > MAX_IMPORT_BYTES) {
      setImportNotice({ kind: "error", message: copy.fileTooLarge });
      return;
    }

    try {
      const backup = parseBackup(await file.text());
      const knownIds = backup.fontIds.filter(id => knownFontIds.has(id));
      const unknownIds = backup.fontIds.filter(id => !knownFontIds.has(id));
      const missingIds = knownIds.filter(id => !currentIds.has(id));

      if (missingIds.length > 0) {
        const mergedIds = uniqueIds([...orderedCurrentIds(), ...knownIds]);
        setRecentOrder(mergedIds);
        if (onImportFavorites) onImportFavorites(mergedIds);
        else missingIds.forEach(toggleFavorite);
      }

      setImportNotice({
        kind: missingIds.length > 0 ? "success" : "info",
        message: missingIds.length > 0 ? `${copy.imported}: ${missingIds.length}.` : copy.alreadySaved,
        unknownIds,
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Invalid file.";
      setImportNotice({ kind: "error", message: `${copy.importFailed}: ${detail}` });
    }
  };

  return (
    <div className="w-full min-h-screen bg-white text-black font-sans">
      <FontLoader fonts={displayedFonts} />

      <section className="sticky top-16 z-40 bg-white border-b border-neutral-200" aria-label={copy.saved}>
        <div className="min-h-14 px-3 md:px-5 flex flex-wrap items-center gap-2 md:gap-3">
          <div className="mr-auto flex items-center gap-3 min-w-0">
            <h1 className="text-lg md:text-xl font-bold tracking-tight whitespace-nowrap">{copy.saved}</h1>
            <span className="font-mono text-[11px] uppercase tracking-wider bg-neutral-900 text-white px-2 py-1 tabular-nums">
              {fonts.length}
            </span>
          </div>

          <div className="relative order-last md:order-none basis-full md:basis-auto md:w-64 min-w-0 border-t md:border border-neutral-200 md:h-9">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={copy.search}
              aria-label={copy.search}
              className="w-full h-9 pl-9 pr-3 bg-transparent outline-none font-mono text-sm placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black"
            />
          </div>

          <label className="sr-only" htmlFor="saved-sort">{copy.sortLabel}</label>
          <select
            id="saved-sort"
            value={sortMode}
            onChange={event => setSortMode(event.target.value as SortMode)}
            className={`${controlClass} max-w-36 px-2 outline-none`}
          >
            <option value="recent">{copy.recent}</option>
            <option value="alpha">{copy.alpha}</option>
          </select>

          <button type="button" onClick={onGoToCatalog} aria-label={t("details.back")} className={`${controlClass} inline-flex items-center gap-2`}>
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">{t("details.back")}</span>
          </button>
        </div>

        <div className="px-3 md:px-5 py-2 border-t border-neutral-100 flex flex-wrap items-center gap-2 md:gap-4">
          <input
            type="text"
            value={previewText}
            onChange={event => setPreviewText(event.target.value)}
            placeholder={t("favorites.preview")}
            aria-label={t("favorites.preview")}
            className="h-9 min-w-40 flex-1 bg-transparent border-b border-neutral-200 outline-none text-base md:text-lg font-light placeholder:text-neutral-300 focus:border-black"
          />

          <label className="hidden sm:flex w-36 items-center gap-2 font-mono text-[11px] uppercase tracking-wider">
            <span className="sr-only">{copy.previewSize}</span>
            <span className="w-9 tabular-nums text-neutral-500">{globalFontSize}px</span>
            <input
              type="range"
              min="24"
              max="120"
              value={globalFontSize}
              onChange={event => setGlobalFontSize(Number(event.target.value))}
              aria-label={copy.previewSize}
              className="w-full h-px bg-neutral-300 appearance-none cursor-pointer accent-black"
            />
          </label>

          <label className="hidden lg:flex w-32 items-center gap-2 font-mono text-[11px] uppercase tracking-wider">
            <MoveHorizontal className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
            <span className="sr-only">{copy.spacing}</span>
            <input
              type="range"
              min="-5"
              max="20"
              step="1"
              value={globalTracking * 100}
              onChange={event => setGlobalTracking(Number(event.target.value) / 100)}
              aria-label={copy.spacing}
              className="w-full h-px bg-neutral-300 appearance-none cursor-pointer accent-black"
            />
          </label>

          <button type="button" onClick={downloadBackup} aria-label={copy.backup} className={`${controlClass} inline-flex items-center gap-2`}>
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{copy.backup}</span>
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} aria-label={copy.restore} className={`${controlClass} inline-flex items-center gap-2`}>
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{copy.restore}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file" aria-label={language === "ru" ? "Импорт сохранённых шрифтов" : "Import saved fonts"}
            accept=".json,application/json"
            className="sr-only"
            onChange={event => {
              const file = event.target.files?.[0];
              if (file) void importBackup(file);
              event.target.value = "";
            }}
          />
        </div>

      </section>

      <div className="px-3 md:px-5 py-2 border-b border-neutral-200 flex flex-col md:flex-row md:items-center gap-1 md:gap-4 font-mono text-[11px] leading-relaxed text-neutral-500">
        <p>{copy.localOnly}</p>
        {importNotice && (
          <p
            role="status"
            className={importNotice.kind === "error" ? "text-black font-semibold" : "md:ml-auto text-neutral-700"}
          >
            {importNotice.message}
            {importNotice.unknownIds && importNotice.unknownIds.length > 0 && (
              <> {copy.unknown}: {importNotice.unknownIds.slice(0, 5).join(", ")}{importNotice.unknownIds.length > 5 ? ` +${importNotice.unknownIds.length - 5}` : ""}.</>
            )}
          </p>
        )}
      </div>

      {fonts.length === 0 ? (
        <div className="min-h-[60vh] px-6 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 border border-neutral-200 rounded-full flex items-center justify-center mb-6">
            <Heart className="w-6 h-6 text-neutral-400" aria-hidden="true" />
          </div>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tighter leading-none">{copy.emptyTitle}</h2>
          <p className="mt-5 max-w-md font-mono text-[11px] uppercase tracking-wider leading-relaxed text-neutral-500">{copy.emptyBody}</p>
          <button type="button" onClick={onGoToCatalog} className="mt-8 px-6 py-3 bg-neutral-900 text-white font-mono text-[11px] uppercase tracking-wider hover:bg-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-colors">
            {t("favorites.browse")}
          </button>
        </div>
      ) : filteredFonts.length === 0 ? (
        <div className="min-h-[52vh] px-6 flex flex-col items-center justify-center text-center">
          <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">0 {copy.result}</p>
          <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tighter">{copy.noMatches}</h2>
          <button type="button" onClick={() => setQuery("")} className="mt-7 px-5 py-3 bg-neutral-900 text-white font-mono text-[11px] uppercase tracking-wider hover:bg-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-colors">
            {copy.clearSearch}
          </button>
        </div>
      ) : (
        <>
          <div className="h-11 px-4 md:px-6 border-b border-neutral-200 flex items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
            <span>{filteredFonts.length} {copy.result}</span>
            <span>{copy.page} {visiblePage} / {pageCount}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {displayedFonts.map(font => (
              <FontCard
                key={font.id}
                font={font}
                previewText={previewText}
                isFavorite
                isCompared={compareList.includes(font.id)}
                fontSize={globalFontSize}
                letterSpacing={globalTracking}
                onToggleFavorite={toggleFavorite}
                onToggleCompare={toggleCompare}
                onViewDetails={viewDetails}
                layout="grid"
              />
            ))}
          </div>
        </>
      )}

      {filteredFonts.length > PAGE_SIZE && (
        <nav className="min-h-16 px-4 py-3 border-t border-neutral-200 flex items-center justify-center gap-2" aria-label={copy.pagesLabel}>
          <button
            type="button"
            onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
            disabled={visiblePage === 1}
            aria-label={copy.previous}
            className={`${controlClass} w-9 px-0 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none`}
          >
            <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map(page => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              aria-current={page === visiblePage ? "page" : undefined}
              aria-label={`${copy.page} ${page}`}
              className={`${controlClass} min-w-9 px-2 ${page === visiblePage ? "bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800" : ""}`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCurrentPage(page => Math.min(pageCount, page + 1))}
            disabled={visiblePage === pageCount}
            aria-label={copy.next}
            className={`${controlClass} w-9 px-0 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none`}
          >
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
};
