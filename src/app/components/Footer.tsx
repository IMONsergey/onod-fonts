import React from "react";
import { Link, useLocation } from "react-router";
import { useLanguage } from "@/lib/i18n";

export const Footer: React.FC = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const isCatalog = location.pathname === "/";

  return (
    <footer className={`${isCatalog ? "md:ml-72" : ""} bg-white border-t border-neutral-200 text-neutral-500`}>
      <div className="px-6 md:px-8 lg:px-10 py-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="max-w-md">
            <div className="text-neutral-900 text-sm font-semibold tracking-tight">ONOD Fonts</div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-neutral-400">
              {language === "ru"
                ? "Каталог шрифтов для поиска, просмотра и сохранения гарнитур. Подробная информация доступна на странице каждого шрифта."
                : "A focused font catalog for discovery, preview and saving. Detailed information lives on each typeface page."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-8 font-mono text-[10px] uppercase tracking-widest">
            <div>
              <div className="mb-4 text-neutral-800 font-semibold">{language === "ru" ? "Разделы" : "Sections"}</div>
              <ul className="space-y-2.5">
                <li><Link to="/" className="hover:text-neutral-900 transition-colors">{t('nav.catalog')}</Link></li>
                <li><Link to="/favorites" className="hover:text-neutral-900 transition-colors">{t('nav.favorites')}</Link></li>
                <li><Link to="/compare" className="hover:text-neutral-900 transition-colors">{t('nav.compare')}</Link></li>
                <li><Link to="/about" className="hover:text-neutral-900 transition-colors">{t('nav.about')}</Link></li>
              </ul>
            </div>

            <div>
              <div className="mb-4 text-neutral-800 font-semibold">{language === "ru" ? "Информация" : "Information"}</div>
              <ul className="space-y-2.5">
                <li><Link to="/protocol" className="hover:text-neutral-900 transition-colors">{t('nav.protocol')}</Link></li>
                <li><Link to="/privacy" className="hover:text-neutral-900 transition-colors">{language === "ru" ? "Конфиденциальность" : "Privacy"}</Link></li>
                <li><Link to="/terms" className="hover:text-neutral-900 transition-colors">{language === "ru" ? "Условия" : "Terms"}</Link></li>
                <li><Link to="/license" className="hover:text-neutral-900 transition-colors">{language === "ru" ? "Лицензия" : "License"}</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-5 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 font-mono text-[9px] uppercase tracking-widest text-neutral-300">
          <span>&copy; {new Date().getFullYear()} ONOD</span>
          <span>{language === "ru" ? "Typography index" : "Typography index"}</span>
        </div>
      </div>
    </footer>
  );
};
