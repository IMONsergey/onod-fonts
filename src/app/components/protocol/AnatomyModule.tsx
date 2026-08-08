import React, { useState } from "react";
import { motion } from "motion/react";
import { MousePointer2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export const AnatomyModule = () => {
  const { t } = useLanguage();
  const [activePart, setActivePart] = useState<string | null>(null);

  const parts = [
    { id: "stem", label: t('module.anatomy.stem'), desc: t('module.anatomy.stemDesc'), x: 35, y: 50 },
    { id: "bowl", label: t('module.anatomy.bowl'), desc: t('module.anatomy.bowlDesc'), x: 60, y: 35 },
    { id: "leg", label: t('module.anatomy.leg'), desc: t('module.anatomy.legDesc'), x: 65, y: 75 },
    { id: "counter", label: t('module.anatomy.counter'), desc: t('module.anatomy.counterDesc'), x: 55, y: 35 },
  ];

  return (
    <div className="w-full border border-neutral-200 p-4 md:p-8 flex flex-col gap-6 md:gap-8 bg-white">
       <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 border-b border-neutral-200 pb-4">
        <div>
          <h3 className="font-mono text-[10px] md:text-xs uppercase tracking-widest mb-2">Module 02 // Geometry</h3>
          <h4 className="text-xl md:text-2xl font-bold uppercase tracking-tighter">The Anatomy of Type</h4>
        </div>
        <div className="font-mono text-[10px] md:text-xs md:text-right">
          <div>{t('module.anatomy.glyph')}</div>
          <div>{t('module.anatomy.analysis')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 min-h-[300px] md:min-h-[400px]">
        <div className="relative bg-neutral-900 rounded-sm flex items-center justify-center overflow-hidden group cursor-crosshair min-h-[300px]">
             <svg viewBox="0 0 100 100" className="w-full h-full max-w-[400px] text-white">
                <motion.rect 
                    x="20" y="10" width="15" height="80" 
                    fill="currentColor" 
                    className={`transition-opacity duration-300 ${activePart && activePart !== 'stem' ? 'opacity-20' : 'opacity-100'}`}
                    onMouseEnter={() => setActivePart('stem')}
                    onMouseLeave={() => setActivePart(null)}
                />
                <motion.path 
                    d="M 35 10 L 60 10 C 80 10 80 50 60 50 L 35 50" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="15"
                    className={`transition-opacity duration-300 ${activePart && activePart !== 'bowl' ? 'opacity-20' : 'opacity-100'}`}
                    onMouseEnter={() => setActivePart('bowl')}
                    onMouseLeave={() => setActivePart(null)}
                />
                 <circle 
                    cx="55" cy="30" r="10" 
                    fill="transparent" 
                    className="cursor-help"
                    onMouseEnter={() => setActivePart('counter')}
                    onMouseLeave={() => setActivePart(null)}
                />

                <motion.path 
                    d="M 50 50 L 80 90" 
                    stroke="currentColor" 
                    strokeWidth="15"
                    fill="none"
                    className={`transition-opacity duration-300 ${activePart && activePart !== 'leg' ? 'opacity-20' : 'opacity-100'}`}
                    onMouseEnter={() => setActivePart('leg')}
                    onMouseLeave={() => setActivePart(null)}
                />
             </svg>

             {parts.map(part => (
                 <div 
                    key={part.id}
                    className={`absolute w-3 h-3 rounded-full border-2 border-white bg-blue-600 transition-transform duration-300 ${activePart === part.id ? 'scale-150 z-20' : 'scale-100 z-10'}`}
                    style={{ left: `${part.x}%`, top: `${part.y}%` }}
                 />
             ))}
        </div>

        <div className="flex flex-col justify-center lg:border-l border-neutral-200 lg:pl-8">
            {activePart ? (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={activePart}
                    className="space-y-4"
                >
                    <span className="inline-block px-3 py-1 bg-blue-600 text-white font-mono text-[10px] uppercase tracking-widest mb-2">
                        {t('module.anatomy.part')}: {parts.find(p => p.id === activePart)?.label}
                    </span>
                    <h5 className="text-2xl md:text-4xl font-bold tracking-tighter uppercase">
                        {parts.find(p => p.id === activePart)?.label}
                    </h5>
                    <p className="font-mono text-xs md:text-sm text-neutral-600 leading-relaxed">
                        {parts.find(p => p.id === activePart)?.desc}
                    </p>
                </motion.div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400 space-y-4 py-8">
                    <MousePointer2 className="w-8 h-8 animate-bounce" />
                    <p className="font-mono text-[10px] uppercase tracking-widest">{t('module.anatomy.hover')}</p>
                </div>
            )}

            <div className="mt-auto pt-8 border-t border-dashed border-neutral-200 w-full">
                <h6 className="font-mono text-[10px] uppercase tracking-widest mb-4 text-neutral-500">{t('module.anatomy.index')}</h6>
                <div className="flex flex-wrap gap-2">
                    {parts.map(p => (
                        <button
                            key={p.id}
                            onMouseEnter={() => setActivePart(p.id)}
                            onMouseLeave={() => setActivePart(null)}
                            className={`px-3 py-1 border text-[10px] font-mono uppercase transition-colors ${activePart === p.id ? 'bg-black text-white border-black' : 'bg-white text-black border-neutral-300 hover:border-black'}`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};