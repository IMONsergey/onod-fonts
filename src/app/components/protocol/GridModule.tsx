import React, { useState } from "react";
import { Grid, AlignJustify } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export const GridModule = () => {
  const { t } = useLanguage();
  const [showGrid, setShowGrid] = useState(true);
  const [lineHeight, setLineHeight] = useState(1.5);

  return (
    <div className="w-full border border-neutral-200 p-4 md:p-8 flex flex-col gap-6 md:gap-8 bg-white">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 border-b border-neutral-200 pb-4">
        <div>
          <h3 className="font-mono text-[10px] md:text-xs uppercase tracking-widest mb-2">Module 04 // The Grid</h3>
          <h4 className="text-xl md:text-2xl font-bold uppercase tracking-tighter">Vertical Rhythm</h4>
        </div>
        <div className="font-mono text-[10px] md:text-xs md:text-right">
           <div>{t('module.grid.unit')}</div>
           <div>{t('module.grid.baseline')}</div>
        </div>
      </div>

      <div className="relative h-64 md:h-80 overflow-hidden border border-neutral-200 bg-white">
         {showGrid && (
             <div 
                className="absolute inset-0 pointer-events-none z-10"
                style={{ 
                    backgroundImage: `linear-gradient(to bottom, rgba(0,0,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: `100% ${16 * lineHeight}px`
                }}
             />
         )}

         <div className="p-4 md:p-8" style={{ lineHeight: lineHeight }}>
            <h1 className="text-2xl md:text-4xl font-bold mb-4" style={{ marginBottom: `${lineHeight}em` }}>{t('module.grid.law')}</h1>
            <p className="mb-4 max-w-md text-sm md:text-base" style={{ marginBottom: `${lineHeight}em` }}>
                {t('module.grid.text1')}
            </p>
            <p className="max-w-md text-sm md:text-base">
                {t('module.grid.text2')}
            </p>
         </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-8 font-mono text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full md:w-auto">
            <label className="uppercase tracking-widest whitespace-nowrap text-[10px] md:text-xs">{t('module.grid.lineHeight')}: {lineHeight}</label>
            <input 
                type="range" 
                min="1" 
                max="2" 
                step="0.1"
                value={lineHeight} 
                onChange={(e) => setLineHeight(Number(e.target.value))}
                className="w-full sm:w-32 h-2 bg-neutral-200 appearance-none cursor-pointer accent-black"
            />
          </div>

          <button 
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center justify-center gap-2 px-4 py-2 border border-neutral-300 uppercase tracking-widest transition-colors w-full md:w-auto text-[10px] md:text-xs ${showGrid ? 'bg-black text-white border-black' : 'bg-white text-black'}`}
          >
            <Grid className="w-4 h-4" />
            <span className="truncate">{showGrid ? t('module.grid.hideGrid') : t('module.grid.showGrid')}</span>
          </button>
      </div>
    </div>
  );
};