import React, { useState } from "react";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export const AlignmentModule = () => {
  const { t } = useLanguage();
  const [align, setAlign] = useState<"left" | "center" | "right" | "justify">("left");

  return (
    <div className="w-full border border-neutral-200 p-4 md:p-8 flex flex-col gap-6 md:gap-8 bg-white">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 border-b border-neutral-200 pb-4">
        <div>
          <h3 className="font-mono text-[10px] md:text-xs uppercase tracking-widest mb-2">Module 09 // Alignment</h3>
          <h4 className="text-xl md:text-2xl font-bold uppercase tracking-tighter">The Axis of Power</h4>
        </div>
        <div className="font-mono text-[10px] md:text-xs md:text-right">
           <div>{t('module.alignment.mode')}</div>
           <div>{t('module.alignment.control')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          <div className="lg:col-span-4 flex flex-col gap-2">
              {[
                  { id: "left" as const, icon: AlignLeft, label: t('module.alignment.flushLeft') },
                  { id: "center" as const, icon: AlignCenter, label: t('module.alignment.centered') },
                  { id: "right" as const, icon: AlignRight, label: t('module.alignment.flushRight') },
                  { id: "justify" as const, icon: AlignJustify, label: t('module.alignment.justified') },
              ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setAlign(opt.id)}
                    className={`flex items-center gap-4 px-4 py-3 border text-left font-mono text-[10px] md:text-xs uppercase tracking-widest transition-colors ${align === opt.id ? 'bg-black text-white border-black' : 'bg-white text-black border-neutral-200 hover:border-black'}`}
                  >
                      <opt.icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{opt.label}</span>
                  </button>
              ))}
          </div>

          <div className="lg:col-span-8 p-4 md:p-8 border border-neutral-200 bg-neutral-50 min-h-[300px]">
              <p 
                className="text-base md:text-lg leading-relaxed max-w-md mx-auto" 
                style={{ textAlign: align }}
              >
                  {t('module.alignment.sampleText')}
              </p>
              
              <div className="mt-8 pt-8 border-t border-neutral-200 text-[10px] md:text-xs text-neutral-500 font-mono">
                  {align === "left" && t('module.alignment.leftDesc')}
                  {align === "center" && t('module.alignment.centerDesc')}
                  {align === "right" && t('module.alignment.rightDesc')}
                  {align === "justify" && t('module.alignment.justifyDesc')}
              </div>
          </div>
      </div>
    </div>
  );
};