import React, { useState } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { Font } from "@/data/mockFonts";
import { FontCard } from "@/components/FontCard";
import { FontLoader } from "@/components/FontLoader";
import { useLanguage } from "@/lib/i18n";

interface FavoritesProps {
  fonts: Font[];
  previewText: string;
  setPreviewText: (text: string) => void;
  toggleFavorite: (id: string) => void;
  viewDetails: (id: string) => void;
  onGoToCatalog: () => void;
}

export const FavoritesPage: React.FC<FavoritesProps> = ({ fonts, previewText, setPreviewText, toggleFavorite, viewDetails, onGoToCatalog }) => {
  const { t, language } = useLanguage();
  const [fontSize, setFontSize] = useState(64);

  if (fonts.length === 0) {
    return (
      <div className="min-h-[70vh] bg-white px-6 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 border border-neutral-200 flex items-center justify-center mb-6"><Heart className="w-5 h-5 text-neutral-400" /></div>
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tighter leading-none">{t('favorites.noItemsTitle')}</h1>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-neutral-500">{t('favorites.noItemsDesc')}</p>
        <button type="button" onClick={onGoToCatalog} className="mt-8 px-6 py-3 bg-neutral-900 text-white font-mono text-[10px] uppercase tracking-widest hover:bg-neutral-700 transition-colors">{t('favorites.browse')}</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <FontLoader fonts={fonts} />

      <section className="px-5 md:px-8 lg:px-10 py-8 md:py-10 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mb-3">{language === 'ru' ? 'Сохранённое' : 'Saved'}</div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter leading-none">{t('favorites.collection')}</h1>
          <p className="mt-3 text-sm text-neutral-400">{fonts.length} {t('favorites.items')}</p>
        </div>
        <button type="button" onClick={onGoToCatalog} className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black transition-colors self-start sm:self-auto">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />{t('details.back')}
        </button>
      </section>

      <div className="sticky top-16 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-neutral-200 px-4 md:px-6 flex items-center gap-4">
        <input
          type="text"
          aria-label={t('favorites.preview')}
          placeholder={t('favorites.preview')}
          value={previewText}
          onChange={event => setPreviewText(event.target.value)}
          className="min-w-0 flex-1 bg-transparent outline-none text-base md:text-xl font-light placeholder:text-neutral-300"
        />
        <div className="hidden sm:flex items-center gap-3 w-44 shrink-0">
          <span className="font-mono text-[9px] text-neutral-400 tabular-nums">{fontSize}px</span>
          <input aria-label={t('details.size')} type="range" min="24" max="120" value={fontSize} onChange={event => setFontSize(Number(event.target.value))} className="w-full h-px bg-black appearance-none cursor-pointer accent-black" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {fonts.map(font => (
          <FontCard
            key={font.id}
            font={font}
            previewText={previewText}
            isFavorite
            fontSize={fontSize}
            onToggleFavorite={toggleFavorite}
            onViewDetails={viewDetails}
            layout="grid"
          />
        ))}
      </div>
    </div>
  );
};
