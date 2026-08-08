import React, { useState } from "react";
import { useLanguage } from "@/lib/i18n";

export const TrackingModule = () => {
  const { t } = useLanguage();
  const [tracking, setTracking] = useState(0);

  return (
    <div className="w-full border border-neutral-200 p-4 md:p-8 flex flex-col gap-6 md:gap-8 bg-white">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 border-b border-neutral-200 pb-4">
        <div>
          <h3 className="font-mono text-[10px] md:text-xs uppercase tracking-widest mb-2">Module 08 // Macro-Space</h3>
          <h4 className="text-xl md:text-2xl font-bold uppercase tracking-tighter">Tracking & Legibility</h4>
        </div>
        <div className="font-mono text-[10px] md:text-xs md:text-right">
           <div>{t('module.tracking.relation')}</div>
           <div>{t('module.tracking.unit')}</div>
        </div>
      </div>

      <div className="flex flex-col gap-6 md:gap-8 min-h-[300px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-center">
              <div className="space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">{t('module.tracking.captionSize')}</p>
                  <p className="text-[10px] border border-neutral-200 p-4 uppercase" style={{ letterSpacing: `${tracking * 0.02}em` }}>
                      {t('module.tracking.sampleText')}
                  </p>
              </div>
              <div className="text-xs font-mono text-neutral-500">
                 {t('module.tracking.captionDesc')}
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-center">
               <div className="space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">{t('module.tracking.displaySize')}</p>
                  <h2 className="text-4xl md:text-6xl font-bold border border-neutral-200 p-4 overflow-hidden whitespace-nowrap" style={{ letterSpacing: `${tracking * -0.01}em` }}>
                      {t('module.tracking.headline')}
                  </h2>
              </div>
              <div className="text-xs font-mono text-neutral-500">
                 {t('module.tracking.displayDesc')}
              </div>
          </div>
      </div>

      <div className="space-y-4 font-mono text-xs border-t border-dashed border-neutral-200 pt-4">
          <label className="flex justify-between uppercase tracking-widest text-[10px] md:text-xs">
             <span>{t('module.tracking.spacingFactor')}</span>
             <span>{(tracking).toFixed(0)}</span>
          </label>
          <input 
            type="range" 
            min="0" 
            max="10" 
            value={tracking} 
            onChange={(e) => setTracking(Number(e.target.value))}
            className="w-full h-2 bg-neutral-200 appearance-none cursor-pointer accent-black"
          />
      </div>
    </div>
  );
};