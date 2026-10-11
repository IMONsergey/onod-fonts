import React, { memo } from "react";
import { Heart, Layers3, RotateCcw } from "lucide-react";
import { FontCoverageNotice } from "./FontCoverageNotice";
import { Link } from "react-router";
import { Font } from "@/data/mockFonts";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { useFontRuntimeStatus } from "@/lib/fontRuntime";
import { getEffectiveAuthor, getEffectiveCssStack, getEffectiveFamilyName, getEffectiveWeights, isEffectivelyVariable, getFontTrustReport } from "@/lib/fontTrust";

interface FontCardProps {
  font: Font;
  previewText: string;
  isFavorite: boolean;
  isCompared?: boolean;
  layout?: "grid" | "list";
  fontSize: number;
  letterSpacing: number;
  onToggleFavorite: (id: string) => void;
  onToggleCompare?: (id: string) => void;
  onViewDetails: (id: string) => void;
}

function isPlainPrimaryClick(event: React.MouseEvent<HTMLAnchorElement>) {
  return event.button === 0
    && !event.metaKey
    && !event.ctrlKey
    && !event.shiftKey
    && !event.altKey;
}

export const FontCard: React.FC<FontCardProps> = memo(({
  font,
  previewText,
  isFavorite,
  isCompared = false,
  layout = "list",
  fontSize,
  letterSpacing,
  onToggleFavorite,
  onToggleCompare,
  onViewDetails,
}) => {
  const { language } = useLanguage();
  const runtime = useFontRuntimeStatus(font.id);
  const familyName = getEffectiveFamilyName(font);
  const cssStack = getEffectiveCssStack(font);
  const weights = getEffectiveWeights(font);
  const author = getEffectiveAuthor(font);
  const defaultWeight = weights.includes("400") ? 400 : Number(weights[0] || 400);
  const displayPreview = previewText || familyName;
  const categories = font.categories.slice(0, 2).join(" · ");
  const detailsHref = `/${encodeURIComponent(font.id)}`;
  const labels = language === "ru"
    ? {
        open: `Открыть ${familyName}`,
        compare: "Сравнить",
        removeCompare: "Убрать из сравнения",
        save: "Сохранить",
        removeSave: "Убрать из сохранённых",
        loading: "Шрифт загружается",
        error: "Шрифт недоступен — показан системный вариант",
        retry: "Повторить",
      }
    : {
        open: `Open ${familyName}`,
        compare: "Compare",
        removeCompare: "Remove from comparison",
        save: "Save",
        removeSave: "Remove from saved",
        loading: "Loading font",
        error: "Font unavailable — showing a system fallback",
        retry: "Retry",
      };

  const previewStyle: React.CSSProperties = {
    fontFamily: cssStack,
    fontWeight: defaultWeight,
    fontSize: `${fontSize}px`,
    letterSpacing: `${letterSpacing}em`,
    fontSynthesis: "none",
  };

  const openDetails = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainPrimaryClick(event)) return;
    event.preventDefault();
    onViewDetails(font.id);
  };

  const retryFont = () => {
    window.dispatchEvent(new CustomEvent("onod:font-retry", { detail: { fontId: font.id } }));
  };

  const actionButtons = (compact = false) => (
    <div className="flex shrink-0 items-center gap-1.5">
      {onToggleCompare && (
        <button
          type="button"
          onClick={() => onToggleCompare(font.id)}
          className={cn("onod-card-action onod-card-action--responsive", compact && "onod-card-action--compact", isCompared && "is-active")}
          aria-label={isCompared ? labels.removeCompare : labels.compare}
          aria-pressed={isCompared}
          title={labels.compare}
        >
          <Layers3 className="size-4" aria-hidden="true" />
          {!compact && <span className="hidden sm:inline">{labels.compare}</span>}
        </button>
      )}
      <button
        type="button"
        onClick={() => onToggleFavorite(font.id)}
        className={cn("onod-card-action onod-card-action--responsive", compact && "onod-card-action--compact", isFavorite && "is-active")}
        aria-label={isFavorite ? labels.removeSave : labels.save}
        aria-pressed={isFavorite}
        title={labels.save}
      >
        <Heart className={cn("size-4", isFavorite && "fill-current")} aria-hidden="true" />
        {!compact && <span className="hidden sm:inline">{labels.save}</span>}
      </button>
    </div>
  );

  const runtimeStatus = runtime.status === "loading" || runtime.status === "error" ? (
    <div
      className={cn(
        runtime.status === "loading" ? "absolute bottom-9 left-4 z-10 bg-white/95 px-2 py-1 text-xs pointer-events-none" : "flex min-h-9 items-center justify-between gap-3 border-t border-neutral-200 px-4 py-2 text-xs",
        runtime.status === "error" ? "bg-neutral-100 text-neutral-800" : "bg-white text-neutral-600",
      )}
      role={runtime.status === "error" ? "alert" : "status"}
    >
      <span>{runtime.status === "error" ? labels.error : labels.loading}</span>
      {runtime.status === "error" && (
        <button type="button" onClick={retryFont} className="onod-button onod-button--quiet h-9 shrink-0 px-2">
          <RotateCcw className="size-3.5" aria-hidden="true" />
          {labels.retry}
        </button>
      )}
    </div>
  ) : null;

  if (layout === "grid") {
    return (
      <article data-font-id={font.id} className="group relative flex min-h-[292px] flex-col border-b border-r border-neutral-200 bg-white">
        <div className="flex min-h-16 items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
          <div className="min-w-0">
            <Link
              to={detailsHref}
              onClick={openDetails}
              data-catalog-focus-key={`${font.id}:name`}
              className="block max-w-full truncate text-base font-semibold tracking-tight underline-offset-4 hover:underline"
            >
              {familyName}
            </Link>
            <p className="mt-0.5 truncate font-mono text-[11px] uppercase tracking-wide text-neutral-600">{author}</p>
          </div>
          {actionButtons(true)}
        </div>

        <Link
          to={detailsHref}
          onClick={openDetails}
          data-catalog-focus-key={`${font.id}:preview`}
          className="relative flex min-h-[180px] flex-1 items-center justify-center overflow-hidden p-4 text-left transition-colors hover:bg-neutral-50"
          aria-label={labels.open}
        >
          <p className="w-full break-words text-center leading-[1.05]" style={previewStyle}>{displayPreview}</p>
        </Link>

        {runtimeStatus}
        <FontCoverageNotice font={font} text={previewText} />
        <div className="flex min-h-9 items-center justify-between gap-3 border-t border-neutral-100 px-4 font-mono text-[11px] uppercase text-neutral-600">
          <span className="truncate">{categories || (language === "ru" ? "Гарнитура" : "Typeface")}</span>
          <span className="shrink-0">{!getFontTrustReport(font).weightsVerified ? (language === "ru" ? "Данные уточняются" : "Metadata pending") : isEffectivelyVariable(font) ? "Variable" : `${weights.length} ${language === "ru" ? "весов" : "weights"}`}</span>
        </div>
      </article>
    );
  }

  return (
    <article data-font-id={font.id} className="group flex min-h-[252px] flex-col border-b border-neutral-200 bg-white xl:min-h-[238px] xl:flex-row">
      <div className="flex min-h-16 w-full items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 xl:w-72 xl:shrink-0 xl:flex-col xl:items-stretch xl:justify-between xl:border-b-0 xl:border-r xl:p-6">
        <div className="min-w-0">
          <Link
            to={detailsHref}
            onClick={openDetails}
            data-catalog-focus-key={`${font.id}:name`}
            className="block truncate text-lg font-semibold leading-none tracking-tight underline-offset-4 hover:underline xl:whitespace-normal xl:text-3xl xl:tracking-tighter"
          >
            {familyName}
          </Link>
          <div className="mt-1 flex min-w-0 gap-2 font-mono text-[11px] uppercase tracking-wide text-neutral-600 xl:mt-3 xl:block">
            <span className="truncate">{author}</span>
            {categories && <span className="truncate text-neutral-500 xl:mt-1 xl:block">{categories}</span>}
          </div>
        </div>
        {actionButtons(false)}
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <Link
          to={detailsHref}
          onClick={openDetails}
          data-catalog-focus-key={`${font.id}:preview`}
          className="relative flex min-h-[188px] flex-1 items-center justify-center overflow-hidden p-4 transition-colors hover:bg-neutral-50 xl:min-h-[238px] xl:p-8"
          aria-label={labels.open}
        >
          <p className="w-full break-words text-center leading-[1.05]" style={previewStyle}>{displayPreview}</p>
          <span className="absolute right-4 top-3 font-mono text-[11px] uppercase tracking-widest text-neutral-500 opacity-0 transition-opacity group-hover:opacity-100">
            {language === "ru" ? "Открыть" : "Open"} ↗
          </span>
        </Link>
        {runtimeStatus}
        <FontCoverageNotice font={font} text={previewText} />
      </div>
    </article>
  );
});
