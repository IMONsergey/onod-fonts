import React, { useState, memo } from "react";
import { Font } from "@/data/mockFonts";
import { Heart, Scale, Download, Check, Plus, Copy, Code } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";

interface FontCardProps {
  font: Font;
  previewText: string;
  isFavorite: boolean;
  isCompared: boolean;
  layout?: "grid" | "list";
  fontSize: number;
  letterSpacing: number;
  onToggleFavorite: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export const FontCard: React.FC<FontCardProps> = memo(({
  font,
  previewText,
  isFavorite,
  isCompared,
  layout = "list",
  fontSize,
  letterSpacing,
  onToggleFavorite,
  onToggleCompare,
  onViewDetails,
}) => {
  const { t } = useLanguage();
  const [localWeight, setLocalWeight] = useState(400);
  const [cssCopied, setCssCopied] = useState(false);

  const style = { 
      fontFamily: font.cssStack,
      fontWeight: font.variable ? localWeight : font.weights[0], 
      fontSize: `${fontSize}px`,
      letterSpacing: `${letterSpacing}em`
  };
  
  const displayPreview = previewText || font.name;

  const copyCss = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const css = `font-family: ${font.cssStack};`;
    const ok = await copyToClipboard(css);
    if (ok) {
      setCssCopied(true);
      toast.success(t('card.cssCopied'));
      setTimeout(() => setCssCopied(false), 2000);
    } else {
      toast.error('Copy failed');
    }
  };

  // Industrial List View
  if (layout === "list") {
    return (
      <div className="group border-b border-neutral-200 bg-white min-h-[300px] flex flex-col md:flex-row transition-colors hover:bg-neutral-50">
        {/* Left: Technical Specs */}
        <div className="w-full md:w-72 flex-shrink-0 p-4 md:p-6 border-r border-neutral-200 flex flex-col justify-between relative">
           <div>
              <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[10px] uppercase tracking-tighter text-neutral-500">ID: {(font.id.split('-')[1] || font.id).substring(0, 4).padStart(3, '0')}</span>
                  <div className="flex gap-1">
                      {font.languages.includes("Cyrillic") && <span className="font-mono text-[9px] uppercase border border-neutral-300 px-1 pt-0.5">CYR</span>}
                      {font.variable && <span className="font-mono text-[9px] uppercase bg-neutral-800 text-white px-1 pt-0.5">VAR</span>}
                  </div>
              </div>
              
              <h3 
                  className="text-xl md:text-3xl tracking-tighter leading-none mb-1 cursor-pointer hover:underline decoration-2 underline-offset-4"
                  onClick={() => onViewDetails(font.id)}
                  style={{ fontWeight: 700 }}
              >
                  {font.name}
              </h3>
              <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-wide mb-1">
                  {font.author}
              </p>
              <p className="font-mono text-[9px] text-neutral-400 uppercase tracking-wide mb-6">
                  {font.source}
              </p>

              {/* Technical Controls (Variable only here, size is global) */}
              <div className="space-y-6 opacity-20 group-hover:opacity-100 transition-opacity duration-300">
                  {font.variable && (
                      <div className="space-y-2">
                          <div className="flex justify-between font-mono text-[9px] uppercase">
                              <span>Wt</span>
                              <span>{localWeight}</span>
                          </div>
                          <input 
                              type="range" min="100" max="900" step="100" value={localWeight} onChange={(e) => setLocalWeight(Number(e.target.value))}
                              className="w-full h-px bg-black appearance-none cursor-pointer accent-black"
                          />
                      </div>
                  )}
                  <div className="font-mono text-[9px] uppercase text-neutral-400">
                      {font.weights.length} {t('styles.available')}
                  </div>
              </div>
           </div>

           {/* Actions - Minimal Icons */}
           <div className="flex gap-4 pt-6 border-t border-neutral-200 mt-auto">
               <button 
                   onClick={(e) => { e.stopPropagation(); onToggleFavorite(font.id); }} 
                   className="hover:opacity-50 transition-opacity"
                   aria-label={isFavorite ? t('card.removeFromFavorites') : t('card.addToFavorites')}
               >
                   <Heart className={cn("w-4 h-4", isFavorite ? "fill-black" : "stroke-black")} />
               </button>
               <button 
                   onClick={(e) => { e.stopPropagation(); onToggleCompare(font.id); }} 
                   className="hover:opacity-50 transition-opacity flex items-center gap-1 group/btn"
                   aria-label={isCompared ? t('card.removeFromCompare') : t('card.addToCompare')}
               >
                   {isCompared ? (
                        <div className="bg-neutral-800 text-white p-0.5"><Check className="w-3 h-3" /></div>
                   ) : (
                        <Plus className="w-4 h-4 stroke-black group-hover/btn:stroke-neutral-500" />
                   )}
                   <span className="font-mono text-[9px] uppercase hidden group-hover/btn:inline">
                       {isCompared ? t('card.inStack') : t('card.addToStack')}
                   </span>
               </button>
               <button 
                   onClick={copyCss} 
                   className="hover:opacity-50 transition-opacity" 
                   title="Copy CSS"
                   aria-label="Copy CSS"
               >
                   {cssCopied ? <Check className="w-4 h-4 text-green-600" /> : <Code className="w-4 h-4 stroke-neutral-400" />}
               </button>
               <button 
                   onClick={(e) => { e.stopPropagation(); window.open(font.sourceUrl, '_blank'); }} 
                   className="hover:opacity-50 transition-opacity ml-auto"
                   aria-label={t('details.download')}
               >
                   <Download className="w-4 h-4 stroke-black" />
               </button>
           </div>
        </div>

        {/* Right: The Canvas */}
        <div 
            className="flex-grow flex flex-col relative p-4 md:p-6 cursor-pointer group-hover:bg-neutral-50/50 transition-colors overflow-hidden"
            onClick={() => onViewDetails(font.id)}
        >
            {/* Grid Markers */}
            <div className="absolute top-2 right-2 font-mono text-[9px] text-neutral-300 uppercase">+ Preview</div>
            
            <div className="flex-grow flex items-center justify-center overflow-hidden">
                <p className="text-black leading-tight text-center break-words w-full transition-all duration-200" style={style}>
                    {displayPreview}
                </p>
            </div>
        </div>
      </div>
    );
  }

  // Industrial Grid View
  return (
    <div className="group bg-white border-b border-r border-neutral-200 flex flex-col h-[350px] relative hover:bg-neutral-50 transition-colors">
       {/* Header */}
       <div className="p-3 flex justify-between items-start border-b border-neutral-100">
           <div>
               <h3 className="text-sm text-black tracking-tight" style={{ fontWeight: 700 }}>{font.name}</h3>
               <p className="font-mono text-[9px] text-neutral-500 uppercase">{font.source}</p>
           </div>
           <div className="flex items-center gap-1.5">
               <button onClick={copyCss} className="opacity-0 group-hover:opacity-100 transition-opacity" title="Copy CSS">
                   {cssCopied ? <Check className="w-3 h-3 text-green-600" /> : <Code className="w-3 h-3 text-neutral-400" />}
               </button>
               <button onClick={() => onToggleFavorite(font.id)}>
                   <Heart className={cn("w-3 h-3", isFavorite ? "fill-black" : "stroke-black")} />
               </button>
           </div>
       </div>

       {/* Canvas */}
       <div 
           className="flex-grow flex items-center justify-center p-4 cursor-pointer overflow-hidden"
           onClick={() => onViewDetails(font.id)}
       >
           <p className="text-center leading-tight transition-all duration-200" style={{ ...style, fontSize: `${Math.min(fontSize, 60)}px` }}>
               {displayPreview}
           </p>
       </div>

       {/* Footer Stats - Unified */}
       <div className="h-10 px-4 border-t border-neutral-100 flex justify-between items-center">
            <button 
                onClick={(e) => { e.stopPropagation(); onToggleCompare(font.id); }} 
                className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 hover:text-black transition-colors flex items-center gap-2"
            >
                {isCompared ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                <span>{isCompared ? t('card.stacked') : t('card.stack')}</span>
            </button>
            
            <div className="flex items-center gap-2">
                {font.variable && (
                    <span className="font-mono text-[9px] text-neutral-400 uppercase">VAR</span>
                )}
                {font.languages.includes("Cyrillic") && (
                    <span className="font-mono text-[10px] text-black uppercase tracking-widest" style={{ fontWeight: 700 }}>
                        CYR
                    </span>
                )}
                <span className="font-mono text-[9px] text-neutral-400">{font.weights.length}w</span>
            </div>
       </div>
    </div>
  );
});
