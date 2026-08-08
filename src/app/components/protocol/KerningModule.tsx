import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { RefreshCcw, Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export const KerningModule = () => {
  const { t } = useLanguage();
  const [offset, setOffset] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  
  const targetOffset = -15; 
  const tolerance = 5;

  const checkResult = () => {
    const diff = Math.abs(offset - targetOffset);
    if (diff <= tolerance) {
      setScore(100);
    } else {
      const calculatedScore = Math.max(0, 100 - (diff * 2));
      setScore(Math.round(calculatedScore));
    }
  };

  const reset = () => {
    setOffset(20);
    setScore(null);
  };

  useEffect(() => {
    reset();
  }, []);

  return (
    <div className="w-full border border-neutral-200 p-4 md:p-8 flex flex-col gap-6 md:gap-8 bg-white">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 border-b border-neutral-200 pb-4">
        <div>
          <h3 className="font-mono text-[10px] md:text-xs uppercase tracking-widest mb-2">Module 01 // Spacing</h3>
          <h4 className="text-xl md:text-2xl font-bold uppercase tracking-tighter">Optical Kerning</h4>
        </div>
        <div className="font-mono text-[10px] md:text-xs md:text-right">
          <div>{t('module.kerning.target')}</div>
          <div className="truncate">{t('module.kerning.status')}: {score !== null ? (score === 100 ? t('module.kerning.optimal') : t('module.kerning.suboptimal')) : t('module.kerning.pending')}</div>
        </div>
      </div>

      <div className="relative h-48 md:h-64 bg-neutral-50 border border-neutral-200 flex items-center justify-center overflow-hidden select-none">
        <div className="flex items-baseline text-[80px] sm:text-[120px] md:text-[180px] leading-none font-bold font-sans tracking-tighter mix-blend-multiply">
          <span>A</span>
          <motion.span
            drag="x"
            dragConstraints={{ left: -60, right: 60 }}
            dragElastic={0}
            dragMomentum={false}
            animate={{ x: offset }}
            style={{ x: offset, cursor: 'ew-resize' }}
            onDragEnd={(e, info) => {
                setOffset(prev => prev + info.offset.x);
            }}
            className="text-blue-600 relative z-10 hover:text-blue-700 transition-colors"
          >
            V
          </motion.span>
        </div>
        
        <div className="absolute inset-0 pointer-events-none opacity-10 flex justify-center">
             <div className="w-px h-full bg-black dashed" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-stretch lg:items-end justify-between">
        <div className="flex-1 w-full">
             <label className="font-mono text-[10px] uppercase tracking-widest mb-2 block">{t('module.kerning.adjust')}</label>
             <input 
                type="range" 
                min="-60" 
                max="60" 
                value={offset} 
                onChange={(e) => {
                    setOffset(Number(e.target.value));
                    setScore(null);
                }}
                className="w-full h-2 bg-neutral-200 appearance-none cursor-pointer accent-black"
             />
             <div className="flex justify-between font-mono text-[10px] mt-2 text-neutral-400">
                <span>{t('module.kerning.tight')}</span>
                <span>{t('module.kerning.loose')}</span>
             </div>
        </div>

        <div className="flex gap-2">
             <button 
                onClick={checkResult}
                disabled={score !== null}
                className="flex-1 lg:flex-initial h-12 px-4 lg:px-8 bg-black text-white font-mono text-[10px] md:text-xs uppercase tracking-widest hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
             >
                {score !== null ? (
                    <span className="flex items-center gap-2">
                        {score}% <Check className="w-4 h-4" />
                    </span>
                ) : (
                    <span className="truncate">{t('module.kerning.analyze')}</span>
                )}
             </button>
             <button 
                onClick={reset}
                className="h-12 w-12 border border-neutral-300 flex items-center justify-center hover:bg-neutral-100 shrink-0"
             >
                <RefreshCcw className="w-4 h-4" />
             </button>
        </div>
      </div>

      <div className="bg-neutral-100 p-4 text-xs font-mono leading-relaxed">
        <strong className="block mb-1 uppercase tracking-widest text-[10px] md:text-xs">{t('module.kerning.theory')}</strong>
        <span className="text-[10px] md:text-xs">{t('module.kerning.theoryText')}</span>
      </div>
    </div>
  );
};