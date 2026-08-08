import React from "react";
import { Link } from "react-router";
import { useLanguage } from "@/lib/i18n";
import { mockFonts } from "@/data/mockFonts";

export const Footer: React.FC = () => {
  const { t, language } = useLanguage();
  const totalFonts = mockFonts.length;
  const variableFonts = mockFonts.filter(f => f.variable).length;
  const cyrillicFonts = mockFonts.filter(f => f.languages.includes("Cyrillic")).length;

  return (
    <footer className="bg-white border-t border-neutral-200 text-neutral-500 font-mono text-[10px] uppercase tracking-widest">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="text-neutral-800 mb-4" style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '-0.02em' }}>
              ONOD Fonts
            </div>
            <p className="text-[10px] leading-relaxed normal-case tracking-normal text-neutral-400 max-w-xs">
              {language === 'ru'
                ? 'Курируемый индекс типографики с открытым исходным кодом.'
                : 'Curated open-source typography index.'
              }
            </p>
          </div>

          {/* Navigation */}
          <div>
            <div className="text-neutral-800 mb-4" style={{ fontWeight: 600 }}>
              {language === 'ru' ? 'Навигация' : 'Navigate'}
            </div>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-neutral-800 transition-colors">{t('nav.catalog')}</Link></li>
              <li><Link to="/compare" className="hover:text-neutral-800 transition-colors">{t('nav.compare')}</Link></li>
              <li><Link to="/favorites" className="hover:text-neutral-800 transition-colors">{t('nav.favorites')}</Link></li>
              <li><Link to="/protocol" className="hover:text-neutral-800 transition-colors">{t('nav.protocol')}</Link></li>
              <li><Link to="/about" className="hover:text-neutral-800 transition-colors">{t('nav.about')}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="text-neutral-800 mb-4" style={{ fontWeight: 600 }}>
              {language === 'ru' ? 'Правовая' : 'Legal'}
            </div>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="hover:text-neutral-800 transition-colors">
                {language === 'ru' ? 'Конфиденциальность' : 'Privacy'}
              </Link></li>
              <li><Link to="/terms" className="hover:text-neutral-800 transition-colors">
                {language === 'ru' ? 'Условия' : 'Terms'}
              </Link></li>
              <li><Link to="/license" className="hover:text-neutral-800 transition-colors">
                {language === 'ru' ? 'Лицензия' : 'License'}
              </Link></li>
            </ul>
          </div>

          {/* Stats */}
          <div>
            <div className="text-neutral-800 mb-4" style={{ fontWeight: 600 }}>
              {language === 'ru' ? 'Система' : 'System'}
            </div>
            <ul className="space-y-2 text-neutral-400">
              <li>{totalFonts} {language === 'ru' ? 'гарнитур' : 'typefaces'}</li>
              <li>{variableFonts} variable</li>
              <li>{cyrillicFonts} cyrillic</li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                {t('footer.rights')}
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neutral-100 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-neutral-300">
            &copy; {new Date().getFullYear()} ONOD Systems
          </span>
          <span className="text-neutral-300">
            {language === 'ru' ? 'Открытый дизайн-инструмент' : 'Open design tool'}
          </span>
        </div>
      </div>
    </footer>
  );
};