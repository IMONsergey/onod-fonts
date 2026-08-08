import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import en from './translations/en.json';
import ru from './translations/ru.json';
import protocolEn from './translations/protocol-en.json';
import protocolRu from './translations/protocol-ru.json';

type Language = 'en' | 'ru';
const translations: Record<Language, Record<string, string>> = { en: { ...en, ...protocolEn }, ru: { ...ru, ...protocolRu } };
interface LanguageContextType { language: Language; setLanguage: (lang: Language) => void; t: (key: string) => string; }
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'ru';
    const saved = window.localStorage.getItem('app-language');
    return saved === 'en' || saved === 'ru' ? saved : 'ru';
  });
  useEffect(() => { window.localStorage.setItem('app-language', language); }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t: (key: string) => translations[language][key] ?? translations.en[key] ?? key }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
export const useLanguage = () => { const context = useContext(LanguageContext); if (!context) throw new Error('useLanguage must be used within a LanguageProvider'); return context; };
