import React, { useState } from "react";
import { Scaling } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export const ScaleModule = () => {
  const { t } = useLanguage();
  const [ratio, setRatio] = useState(1.25);

  const baseSize = 16;
  const scales = [
    { name: t('module.scale.minorSecond'), value: 1.067 },
    { name: t('module.scale.majorSecond'), value: 1.125 },
    { name: t('module.scale.minorThird'), value: 1.200 },
    { name: t('module.scale.majorThird'), value: 1.250 },
    { name: t('module.scale.perfectFourth'), value: 1.333 },
    { name: t('module.scale.goldenRatio'), value: 1.618 },
  ];

  return (
    <div className="w-full border border-neutral-200 p-4 md:p-8 flex flex-col gap-6 md:gap-8 bg-white">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 border-b border-neutral-200 pb-4">
        <div>
          <h3 className="font-mono text-[10px] md:text-xs uppercase tracking-widest mb-2">Module 06 // Hierarchy</h3>
          <h4 className="text-xl md:text-2xl font-bold uppercase tracking-tighter">Modular Scale</h4>
        </div>
        <div className="font-mono text-[10px] md:text-xs md:text-right">
           <div>{t('module.scale.base')}</div>
           <div>{t('module.scale.method')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 min-h-[300px]">
          <div className="flex flex-col justify-center gap-3 md:gap-4 overflow-hidden">
              <div style={{ fontSize: baseSize * Math.pow(ratio, 4) }} className="font-bold leading-none truncate">{t('module.scale.heading1')}</div>
              <div style={{ fontSize: baseSize * Math.pow(ratio, 3) }} className="font-bold leading-none truncate">{t('module.scale.heading2')}</div>
              <div style={{ fontSize: baseSize * Math.pow(ratio, 2) }} className="font-bold leading-none truncate">{t('module.scale.heading3')}</div>
              <div style={{ fontSize: baseSize * Math.pow(ratio, 1) }} className="font-bold leading-none truncate">{t('module.scale.heading4')}</div>
              <div style={{ fontSize: baseSize }} className="truncate">{t('module.scale.bodyText')}</div>
          </div>

          <div className="lg:border-l border-dashed border-neutral-200 lg:pl-8 flex flex-col justify-center gap-4 font-mono text-xs">
              <label className="uppercase tracking-widest font-bold mb-2 text-[10px] md:text-xs">{t('module.scale.selectRatio')}</label>
              <div className="flex flex-col gap-2">
                  {scales.map(s => (
                      <button
                        key={s.name}
                        onClick={() => setRatio(s.value)}
                        className={`text-left px-4 py-2 border transition-colors flex justify-between text-[10px] md:text-xs ${ratio === s.value ? 'bg-black text-white border-black' : 'bg-white text-black border-neutral-200 hover:border-black'}`}
                      >
                          <span className="truncate pr-2">{s.name}</span>
                          <span className="shrink-0">{s.value}</span>
                      </button>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};