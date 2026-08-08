import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export const MixModule = () => {
  const { t } = useLanguage();
  const [pairing, setPairing] = useState(0);

  const pairs = [
      {
          head: "Inter",
          body: "Inter",
          desc: t('module.mix.pair1Desc'),
          headClass: "font-sans",
          bodyClass: "font-sans"
      },
      {
          head: "Playfair Display",
          body: "Inter",
          desc: t('module.mix.pair2Desc'),
          headClass: "font-serif",
          bodyClass: "font-sans"
      },
      {
          head: "Oswald",
          body: "Merriweather",
          desc: t('module.mix.pair3Desc'),
          headClass: "font-sans",
          bodyClass: "font-serif"
      },
      {
          head: "Space Mono",
          body: "Inter",
          desc: t('module.mix.pair4Desc'),
          headClass: "font-mono",
          bodyClass: "font-sans"
      }
  ];

  return (
    <div className="w-full border border-neutral-200 p-4 md:p-8 flex flex-col gap-6 md:gap-8 bg-white">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 border-b border-neutral-200 pb-4">
        <div>
          <h3 className="font-mono text-[10px] md:text-xs uppercase tracking-widest mb-2">Module 11 // Synthesis</h3>
          <h4 className="text-xl md:text-2xl font-bold uppercase tracking-tighter">Typeface Pairing</h4>
        </div>
        <div className="font-mono text-[10px] md:text-xs md:text-right">
           <div>{t('module.mix.strategy')}</div>
           <div>{t('module.mix.ratio')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 min-h-[300px] md:min-h-[400px]">
          <div className="border border-neutral-200 bg-white p-4 md:p-8 flex flex-col justify-center space-y-4 md:space-y-6 order-2 lg:order-1">
              <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold leading-tight ${pairs[pairing].headClass}`}>
                  {t('module.mix.message')}
              </h2>
              <p className={`text-base md:text-lg text-neutral-600 leading-relaxed ${pairs[pairing].bodyClass}`}>
                  {t('module.mix.bodyText')}
              </p>
              <div className="pt-4 md:pt-8 border-t border-dashed border-neutral-300 font-mono text-[10px] md:text-xs text-neutral-400 uppercase tracking-widest flex flex-wrap gap-2">
                  <span>H1: {pairs[pairing].head}</span>
                  <span>P: {pairs[pairing].body}</span>
              </div>
          </div>

          <div className="flex flex-col gap-3 md:gap-4 order-1 lg:order-2">
              <h5 className="font-mono text-[10px] md:text-xs uppercase tracking-widest mb-2 md:mb-4">{t('module.mix.selectStrategy')}</h5>
              {pairs.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setPairing(i)}
                    className={`p-3 md:p-4 border text-left transition-all group hover:border-black ${pairing === i ? 'bg-black text-white border-black' : 'bg-white text-black border-neutral-200'}`}
                  >
                      <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs md:text-sm truncate pr-2">{p.head} + {p.body}</span>
                          {pairing === i && <ArrowRight className="w-4 h-4 shrink-0" />}
                      </div>
                      <div className={`text-[10px] md:text-xs ${pairing === i ? 'text-neutral-400' : 'text-neutral-500'}`}>
                          {p.desc}
                      </div>
                  </button>
              ))}
          </div>
      </div>
    </div>
  );
};