import React, { memo } from "react";
import { Heart } from "lucide-react";
import { Font, hasInteractiveSpecimen } from "@/data/mockFonts";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { useFontRuntimeStatus } from "@/lib/fontRuntime";
import { getEffectiveAuthor, getEffectiveCssStack, getEffectiveFamilyName } from "@/lib/fontTrust";
import { resolveCatalogWeight } from "@/lib/catalogWeight";

interface FontCardProps {
  font: Font;
  previewText: string;
  isFavorite: boolean;
  isCompared?: boolean;
  layout?: "grid" | "list";
  fontSize: number;
  letterSpacing: number;
  requestedWeight?: number;
  onToggleFavorite: (id: string) => void;
  onToggleCompare?: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export const FontCard: React.FC<FontCardProps> = memo(({
  font,
  previewText,
  isFavorite,
  layout = "list",
  fontSize,
  letterSpacing,
  requestedWeight = 400,
  onToggleFavorite,
  onViewDetails,
}) => {
  const { t } = useLanguage();
  const runtime = useFontRuntimeStatus(font.id);
  const familyName = getEffectiveFamilyName(font);
  const author = getEffectiveAuthor(font);
  const specimenWeight = resolveCatalogWeight(font, requestedWeight);
  const displayPreview = previewText || font.commercialPackage?.sample || familyName;
  const interactive = hasInteractiveSpecimen(font);
  const staticSpecimen = font.commercialPackage?.previewImageUrl;
  const categories = font.categories.slice(0, 2).join(" · ");

  const previewStyle = {
    fontFamily: getEffectiveCssStack(font, specimenWeight),
    fontSynthesis: "none",
    fontWeight: specimenWeight,
    fontSize: `${fontSize}px`,
    letterSpacing: `${letterSpacing}em`,
  };

  function renderSpecimen() {
    if (!interactive) {
      return staticSpecimen
        ? <img src={staticSpecimen} alt={familyName} loading="lazy" className="max-h-40 w-full object-contain" />
        : <span className="font-mono text-xs text-neutral-500">{t("details.sourceSpecimen")}</span>;
    }
    return <p className="w-full text-center leading-tight break-words" style={previewStyle}>{displayPreview}</p>;
  }

  const FavoriteButton = ({ compact = false }: { compact?: boolean }) => (
    <button
      type="button"
      onClick={event => {
        event.stopPropagation();
        onToggleFavorite(font.id);
      }}
      className={cn(
        "shrink-0 flex items-center justify-center border border-neutral-200 bg-white hover:bg-neutral-100 transition-colors",
        compact ? "w-8 h-8" : "w-9 h-9",
      )}
      aria-label={isFavorite ? t('card.removeFromFavorites') : t('card.addToFavorites')}
    >
      <Heart className={cn(compact ? "w-3.5 h-3.5" : "w-4 h-4", isFavorite ? "fill-black" : "stroke-black")} />
    </button>
  );

  if (layout === "grid") {
    return (
      <article data-onod-family={font.id} className="group bg-white border-b border-r border-neutral-200 flex flex-col min-h-[320px]">
        <div className="p-4 flex items-start justify-between gap-4 border-b border-neutral-100">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => onViewDetails(font.id)}
              className="block max-w-full text-left text-base font-semibold tracking-tight truncate hover:underline underline-offset-4"
            >
              {familyName}
            </button>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-wide text-neutral-400 truncate">{author}</p>
          </div>
          <FavoriteButton compact />
        </div>

        <button
          type="button"
          onClick={() => onViewDetails(font.id)}
          className="relative flex-1 min-h-[220px] p-5 flex items-center justify-center overflow-hidden text-left hover:bg-neutral-50 transition-colors"
          aria-label={`Open ${familyName} details`}
        >
          {renderSpecimen()}
          {runtime.status === "error" && (
            <span className="absolute bottom-3 left-4 right-4 text-center font-mono text-[8px] uppercase tracking-widest text-neutral-400">Fallback preview</span>
          )}
        </button>

        <div className="h-10 px-4 border-t border-neutral-100 flex items-center justify-between gap-3 font-mono text-[9px] uppercase text-neutral-400">
          <span className="truncate">{categories || "Typeface"}</span>
          <span className="shrink-0">Open ↗</span>
        </div>
      </article>
    );
  }

  return (
    <article data-onod-family={font.id} className="group bg-white border-b border-neutral-200 flex flex-col md:flex-row min-h-[230px]">
      <div className="w-full md:w-64 shrink-0 p-5 md:p-6 md:border-r border-neutral-200 flex flex-col justify-between gap-8">
        <div>
          <button
            type="button"
            onClick={() => onViewDetails(font.id)}
            className="block text-left text-2xl md:text-3xl font-semibold tracking-tighter leading-none hover:underline underline-offset-4"
          >
            {familyName}
          </button>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-neutral-500">{author}</p>
          {categories && <p className="mt-1 font-mono text-[9px] uppercase tracking-wide text-neutral-400">{categories}</p>}
        </div>

        <div className="flex items-center justify-between gap-3">
          <FavoriteButton />
          {runtime.status === "error" && <span className="font-mono text-[8px] uppercase tracking-widest text-neutral-400">Fallback</span>}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onViewDetails(font.id)}
        className="relative flex-1 min-h-[230px] p-6 md:p-8 flex items-center justify-center overflow-hidden hover:bg-neutral-50 transition-colors"
        aria-label={`Open ${familyName} details`}
      >
        {renderSpecimen()}
        <span className="absolute top-4 right-5 font-mono text-[8px] uppercase tracking-widest text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity">Open details ↗</span>
      </button>
    </article>
  );
});
