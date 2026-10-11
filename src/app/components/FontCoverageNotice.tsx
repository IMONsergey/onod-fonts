import React from 'react';
import type { Font } from '../data/mockFonts';
import { getEffectiveLanguages, getFontTrustReport } from '../lib/fontTrust';
import { useLanguage } from '../lib/i18n';

/** A script warning, not a claim to have inspected every glyph in a cmap. */
export function FontCoverageNotice({ font, text }: { font: Font; text: string }) {
  const { language } = useLanguage();
  if (!text.trim()) return null;
  const scripts = getEffectiveLanguages(font);
  const tested: [string, RegExp, string][] = [
    ['Cyrillic', /\p{Script=Cyrillic}/u, 'кириллица'],
    ['Latin', /\p{Script=Latin}/u, 'латиница'],
    ['Greek', /\p{Script=Greek}/u, 'греческая'],
    ['Arabic', /\p{Script=Arabic}/u, 'арабская'],
    ['Hebrew', /\p{Script=Hebrew}/u, 'иврит'],
    ['Devanagari', /\p{Script=Devanagari}/u, 'деванагари'],
  ];
  const unconfirmed = tested.filter(([script, pattern]) => pattern.test(text) && (!getFontTrustReport(font).scriptsVerified || !scripts.includes(script)));
  if (!unconfirmed.length) return null;
  return <p role="status" className="border-t border-neutral-300 bg-neutral-100 px-4 py-2 text-xs leading-relaxed text-neutral-800">
    {language === 'ru'
      ? `Письменность не подтверждена: ${unconfirmed.map(item=>item[2]).join(', ')}. Часть текста может отображаться системным шрифтом.`
      : `Script coverage is unconfirmed: ${unconfirmed.map(item=>item[0]).join(', ')}. Part of the text may use a system fallback.`}
  </p>;
}
