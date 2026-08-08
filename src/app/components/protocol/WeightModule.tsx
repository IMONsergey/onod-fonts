import React, { useState } from "react";
import { motion } from "motion/react";
import { useLanguage } from "@/lib/i18n";

export const WeightModule = () => {
  const { t } = useLanguage();
  const [weight, setWeight] = useState(400);

  return (
    <div className="w-full border border-neutral-200 p-4 md:p-8 flex flex-col gap-6 md:gap-8 bg-white">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 border-b border-neutral-200 pb-4">
        <div>
          <h3 className="font-mono text-[10px] md:text-xs uppercase tracking-widest mb-2">Module 07 // Mass</h3>
          <h4 className="text-xl md:text-2xl font-bold uppercase tracking-tighter">Typographic Color</h4>
        </div>
        <div className="font-mono text-[10px] md:text-xs md:text-right">
           <div>{t('module.weight.property')}</div>
           <div>{t('module.weight.impact')}</div>
        </div>
      </div>

      <div className="relative h-48 md:h-64 flex items-center justify-center overflow-hidden border border-neutral-200 bg-white">
         <motion.div 
            className="text-center p-4 md:p-8"
            animate={{ fontWeight: weight }}
         >
            <p className="text-3xl md:text-4xl lg:text-6xl font-sans" style={{ fontWeight: weight }}>
                Hamburgefontsiv
            </p>
         </motion.div>
      </div>

      <div className="space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row justify-between gap-2 uppercase tracking-widest text-[10px] md:text-xs">
            <span>{t('module.weight.light')}</span>
            <span>{t('module.weight.current')}: {weight}</span>
            <span>{t('module.weight.black')}</span>
          </div>
          <input 
            type="range" 
            min="100" 
            max="900" 
            step="100"
            value={weight} 
            onChange={(e) => setWeight(Number(e.target.value))}
            className="w-full h-2 bg-neutral-200 appearance-none cursor-pointer accent-black"
          />
          <p className="text-neutral-500 leading-relaxed text-[10px] md:text-xs">
            {t('module.weight.desc')}
          </p>
      </div>
    </div>
  );
};