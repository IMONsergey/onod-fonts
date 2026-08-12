import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "@/lib/i18n";

export const OpticalModule = () => {
  const { t } = useLanguage();
  const [overshoot, setOvershoot] = useState(true);

  return (
    <div className="w-full border border-neutral-200 p-4 md:p-8 flex flex-col gap-6 md:gap-8 bg-white">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 border-b border-neutral-200 pb-4">
        <div>
          <h3 className="font-mono text-[10px] md:text-xs uppercase tracking-widest mb-2">Module 05 // Optical Truth</h3>
          <h4 className="text-xl md:text-2xl font-bold uppercase tracking-tighter">Overshoot Correction</h4>
        </div>
        <div className="font-mono text-[10px] md:text-xs md:text-right">
           <div>{t('module.optical.phenomenon')}</div>
           <div>{t('module.optical.correction')}</div>
        </div>
      </div>

      <div className="relative h-48 md:h-64 flex items-center justify-center gap-4 md:gap-8 bg-neutral-50 border border-neutral-200 overflow-hidden">
         <div className="absolute inset-x-0 top-1/2 -translate-y-12 md:-translate-y-16 h-px bg-neutral-500 z-10 opacity-50" />
         <div className="absolute inset-x-0 top-1/2 translate-y-12 md:translate-y-16 h-px bg-neutral-500 z-10 opacity-50" />

         <div className="w-24 h-24 md:w-32 md:h-32 bg-black" />

         <motion.div 
            className="w-24 h-24 md:w-32 md:h-32 bg-black rounded-full"
            animate={{ scale: overshoot ? 1.05 : 1 }}
            transition={{ duration: 0.5 }}
         />
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 font-mono text-xs">
          <p className="max-w-md text-neutral-500 text-[10px] md:text-xs">
            {t('module.optical.desc')}
          </p>

          <button 
            onClick={() => setOvershoot(!overshoot)}
            className={`flex items-center justify-center gap-2 px-4 md:px-6 py-3 border border-neutral-300 uppercase tracking-widest transition-colors w-full lg:w-auto text-[10px] md:text-xs whitespace-nowrap ${overshoot ? 'bg-black text-white border-black' : 'bg-white text-black'}`}
          >
            {overshoot ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="truncate">{overshoot ? t('module.optical.correctionOn') : t('module.optical.correctionOff')}</span>
          </button>
      </div>
    </div>
  );
};