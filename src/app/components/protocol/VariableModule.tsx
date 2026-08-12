import React, { useState } from "react";
import { motion } from "motion/react";
import { Maximize2, Minimize2, Type } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export const VariableModule = () => {
  const { t } = useLanguage();
  const [weight, setWeight] = useState(400);
  const [width, setWidth] = useState(100);
  const [slant, setSlant] = useState(0);

  return (
    <div className="w-full border border-neutral-200 p-4 md:p-8 flex flex-col gap-6 md:gap-8 bg-white">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 border-b border-neutral-200 pb-4">
        <div>
          <h3 className="font-mono text-[10px] md:text-xs uppercase tracking-widest mb-2">Module 03 // Fluidity</h3>
          <h4 className="text-xl md:text-2xl font-bold uppercase tracking-tighter">Variable Axes</h4>
        </div>
        <div className="font-mono text-[10px] md:text-xs md:text-right">
           <div>{t('module.variable.axis')}</div>
           <div>{t('module.variable.interpolation')}</div>
        </div>
      </div>

      <div className="min-h-[250px] md:min-h-[300px] flex items-center justify-center border border-neutral-200 bg-neutral-50 overflow-hidden relative">
        <motion.div 
            className="text-7xl sm:text-8xl md:text-9xl lg:text-[12rem] leading-none text-center mix-blend-darken z-10"
            style={{ 
                fontWeight: weight,
                fontStretch: `${width}%`,
                fontStyle: slant > 0 ? 'italic' : 'normal',
                transform: `scaleX(${width/100}) skewX(-${slant}deg)`
            }}
        >
            Aa
        </motion.div>
        
        <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 pointer-events-none opacity-5">
            {Array.from({ length: 100 }).map((_, i) => (
                <div key={i} className="border-[0.5px] border-black" />
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 font-mono text-xs">
          <div className="space-y-2">
              <label className="flex justify-between uppercase tracking-widest text-[10px] md:text-xs">
                  <span>{t('module.variable.weight')}</span>
                  <span>{weight}</span>
              </label>
              <input 
                type="range" 
                min="100" 
                max="900" 
                value={weight} 
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full h-2 bg-neutral-200 appearance-none cursor-pointer accent-black"
              />
          </div>
          <div className="space-y-2">
              <label className="flex justify-between uppercase tracking-widest text-[10px] md:text-xs">
                  <span>{t('module.variable.width')}</span>
                  <span>{width}%</span>
              </label>
              <input 
                type="range" 
                min="50" 
                max="150" 
                value={width} 
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full h-2 bg-neutral-200 appearance-none cursor-pointer accent-black"
              />
          </div>
          <div className="space-y-2">
              <label className="flex justify-between uppercase tracking-widest text-[10px] md:text-xs">
                  <span>{t('module.variable.slant')}</span>
                  <span>{slant}°</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="20" 
                value={slant} 
                onChange={(e) => setSlant(Number(e.target.value))}
                className="w-full h-2 bg-neutral-200 appearance-none cursor-pointer accent-black"
              />
          </div>
      </div>
    </div>
  );
};