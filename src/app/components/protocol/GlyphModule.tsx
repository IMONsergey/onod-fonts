import React, { useState } from "react";
import { motion } from "motion/react";
import { useLanguage } from "@/lib/i18n";

export const GlyphModule = () => {
  const { t } = useLanguage();
  type GlyphCategory = "uppercase" | "lowercase" | "numerals" | "punct";
  const [category, setCategory] = useState<GlyphCategory>("uppercase");

  const glyphs = {
      uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      lowercase: "abcdefghijklmnopqrstuvwxyz",
      numerals: "0123456789",
      punct: "!@#$%^&*()_+-=[]{}|;':,./<>?"
  };

  const categories: { key: GlyphCategory; label: string }[] = [
    { key: "uppercase", label: t('module.glyph.uppercase') },
    { key: "lowercase", label: t('module.glyph.lowercase') },
    { key: "numerals", label: t('module.glyph.numerals') },
    { key: "punct", label: t('module.glyph.punct') },
  ];

  return (
    <div className="w-full border border-neutral-200 p-4 md:p-8 flex flex-col gap-6 md:gap-8 bg-white">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 border-b border-neutral-200 pb-4">
        <div>
          <h3 className="font-mono text-[10px] md:text-xs uppercase tracking-widest mb-2">Module 10 // Character Set</h3>
          <h4 className="text-xl md:text-2xl font-bold uppercase tracking-tighter">The Complete System</h4>
        </div>
        <div className="font-mono text-[10px] md:text-xs md:text-right">
           <div>{t('module.glyph.count')}</div>
           <div>{t('module.glyph.encoding')}</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`px-3 md:px-4 py-2 border font-mono text-[10px] md:text-xs uppercase tracking-widest whitespace-nowrap transition-colors ${category === cat.key ? 'bg-black text-white border-black' : 'bg-white text-black border-neutral-200 hover:border-black'}`}
              >
                  {cat.label}
              </button>
          ))}
      </div>

      <div className="min-h-[250px] md:min-h-[300px] bg-neutral-50 border border-neutral-200 p-4 md:p-8">
          <motion.div 
            key={category}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap gap-2 md:gap-4 justify-center"
          >
              {glyphs[category].split("").map((char, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.01 }}
                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center border border-neutral-200 bg-white text-xl md:text-2xl font-bold hover:bg-black hover:text-white transition-colors cursor-default"
                  >
                      {char}
                  </motion.div>
              ))}
          </motion.div>
      </div>
    </div>
  );
};