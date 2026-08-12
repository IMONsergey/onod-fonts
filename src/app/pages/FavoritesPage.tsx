import React, { useState } from "react";
import { Font } from "@/data/mockFonts";
import { Heart, ArrowLeft, MoveHorizontal } from "lucide-react";
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
}

export const FavoritesPage: React.FC<FavoritesProps> = ({
  fonts,
  previewText,
  setPreviewText,
  toggleFavorite,
  toggleCompare,
  compareList,
  viewDetails,
  onGoToCatalog,
}) => {
  const { t } = useLanguage();
  const [globalFontSize, setGlobalFontSize] = useState(64);
  const [globalTracking, setGlobalTracking] = useState(0);

  if (fonts.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-8 bg-white">
             <div className="w-24 h-24 border border-neutral-200 rounded-full flex items-center justify-center mb-8">
                <Heart className="w-8 h-8 text-neutral-400" />
             </div>
             <h2 className="text-6xl md:text-8xl tracking-tighter mb-8 uppercase leading-none" style={{ fontWeight: 700 }}>{t('favorites.noItemsTitle')}</h2>
             <p className="font-mono text-xs md:text-sm uppercase tracking-[0.2em] text-neutral-500 mb-12 max-w-md leading-relaxed">{t('favorites.noItemsDesc')}</p>
             <button 
                onClick={onGoToCatalog} 
                className="px-12 py-5 bg-neutral-800 text-white font-mono text-xs uppercase tracking-widest hover:bg-neutral-700 transition-colors"
             >
                {t('favorites.browse')}
             </button>
        </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-white text-black font-sans">
        <FontLoader fonts={fonts} />
        
        {/* Header */}
        <div className="sticky top-16 z-40 bg-white border-b border-neutral-200 px-6 py-6 flex justify-between items-end">
            <div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-none">{t('favorites.collection')}</h1>
            </div>
            <div className="flex flex-col items-end">
                 <button onClick={onGoToCatalog} className="flex items-center gap-2 hover:underline decoration-1 underline-offset-4 mb-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-mono text-xs uppercase tracking-widest">{t('details.back')}</span>
                </button>
                <div className="font-mono text-xs font-bold bg-neutral-800 text-white px-2.5 py-1">
                    {fonts.length} {t('favorites.items')}
                </div>
            </div>
        </div>

        {/* Utilities Bar */}
        <div className="sticky top-[152px] z-30 bg-white border-b border-neutral-200">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                 
                 {/* Input Section */}
                 <div className="md:col-span-2 lg:col-span-1 xl:col-span-2 p-4 md:p-6 border-b md:border-b-0 border-r border-neutral-200 relative group flex flex-col justify-center min-h-[80px]">
                      <span className="absolute top-2 left-4 md:left-6 font-mono text-[8px] uppercase text-neutral-400 tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                          {t('favorites.preview')}
                      </span>
                      <input
                        type="text"
                        placeholder={t('favorites.preview')}
                        value={previewText}
                        onChange={(e) => setPreviewText(e.target.value)}
                        className="w-full bg-transparent focus:outline-none font-light text-2xl md:text-3xl placeholder:text-neutral-200"
                      />
                 </div>
                 
                 {/* Size Control */}
                 <div className="col-span-1 p-4 md:p-6 border-b md:border-b-0 border-r border-neutral-200 flex flex-col justify-center gap-2 group hover:bg-neutral-50 transition-colors">
                     <div className="flex justify-between items-center">
                        <span className="font-mono text-[10px] uppercase tracking-widest">{t('details.size')}</span>
                        <span className="font-mono text-[10px]">{globalFontSize}px</span>
                     </div>
                     <input 
                        type="range" 
                        min="16" 
                        max="120" 
                        value={globalFontSize} 
                        onChange={(e) => setGlobalFontSize(Number(e.target.value))}
                        className="w-full h-px bg-neutral-200 appearance-none cursor-pointer accent-black hover:bg-neutral-400 transition-colors"
                     />
                 </div>

                 {/* Tracking Control */}
                 <div className="col-span-1 p-4 md:p-6 border-r border-neutral-200 flex flex-col justify-center gap-2 group hover:bg-neutral-50 transition-colors">
                     <div className="flex justify-between items-center">
                         <span className="font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
                            <MoveHorizontal className="w-3 h-3" /> Spacing
                         </span>
                         <span className="font-mono text-[10px]">{(globalTracking * 100).toFixed(0)}</span>
                     </div>
                     <input 
                        type="range" 
                        min="-5" 
                        max="20" 
                        step="1"
                        value={globalTracking * 100} 
                        onChange={(e) => setGlobalTracking(Number(e.target.value) / 100)}
                        className="w-full h-px bg-neutral-200 appearance-none cursor-pointer accent-black hover:bg-neutral-400 transition-colors"
                     />
                 </div>
             </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {fonts.map((font) => (
                <FontCard
                    key={font.id}
                    font={font}
                    previewText={previewText}
                    isFavorite={true}
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
    </div>
  );
};