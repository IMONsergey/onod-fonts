import React from "react";
import { createPortal } from "react-dom";
import { Menu, Heart, X, type LucideIcon, Info, LayoutGrid, Globe, BookOpen, Layers } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { useNavigate } from "react-router";

interface HeaderProps {
  activePage: string;
  setActivePage: (page: string) => void;
  favoritesCount: number;
  compareCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  setActivePage,
  favoritesCount,
  compareCount,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activePage]);

  React.useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isMobileMenuOpen]);

  const goToPage = (page: string) => {
    setActivePage(page);
    setIsMobileMenuOpen(false);
  };

  const NavItem = ({ page, label, icon: Icon, count }: { page: string; label: string; icon?: LucideIcon; count?: number }) => {
    const isActive = activePage === page;
    return (
      <button
        type="button"
        onClick={() => goToPage(page)}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          "h-full px-5 flex items-center gap-2 text-[12px] uppercase tracking-[0.12em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-800",
          isActive ? "text-neutral-800 bg-neutral-100" : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50",
        )}
        style={{ fontWeight: isActive ? 600 : 450 }}
      >
        {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
        <span>{label}</span>
        {count !== undefined && count > 0 && (
          <span
            className={cn(
              "ml-1 px-1.5 py-0.5 text-[10px] rounded-full",
              isActive ? "bg-neutral-200 text-neutral-700" : "bg-neutral-100 text-neutral-500",
            )}
            style={{ fontWeight: 600 }}
          >
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-[60] w-full bg-white/90 backdrop-blur-lg border-b border-neutral-200/60">
      <div className="flex h-16 items-stretch justify-between max-w-[1800px] mx-auto">
        <div className="flex items-center">
          <button
            type="button"
            aria-label="ONOD Fonts — catalog"
            onClick={() => navigate("/")}
            className="flex items-center px-6 hover:bg-neutral-50 transition-colors h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-800"
          >
            <span className="flex items-center text-neutral-800">
              <svg width="100" height="20" viewBox="0 0 215 42" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M95.6187 0.572388H105.919V40.6288H91.8992L64.6036 10.5865V40.6288H54.3033V0.572388H68.2659L95.6187 30.6719V0.572388Z" />
                <path d="M25.1783 41.2009C7.5535 41.2009 0 33.8763 0 20.5432C0 7.26738 7.5535 0 25.1783 0C42.7459 0 50.3567 7.32461 50.3567 20.5432C50.3567 33.8191 42.7459 41.2009 25.1783 41.2009ZM25.1783 32.5602C35.8791 32.5602 40.0564 28.7262 40.0564 20.5432C40.0564 12.4175 35.9363 8.64075 25.1783 8.64075C14.4203 8.64075 10.3002 12.3603 10.3002 20.5432C10.3002 28.7834 14.4775 32.5602 25.1783 32.5602Z" />
                <path d="M194.62 0C205.469 0 215 6.50638 215 20.3324C215 34.1585 205.469 40.6648 194.62 40.6648H164.169V0H194.62ZM190.544 31.8929C198.696 31.8929 204.21 30.2082 204.21 20.3324C204.21 10.4567 198.696 8.77199 190.544 8.77199H174.959V31.8929H190.544Z" />
                <path d="M160.216 21.1173C160.001 33.8904 152.523 41.042 135.609 41.197C137.8 30.5317 146.715 22.4077 157.717 21.3565L160.216 21.1173ZM111.804 21.3565C122.803 22.4076 131.715 30.5278 133.909 41.1889C117.366 40.8831 110.102 33.8208 109.871 21.1718L111.804 21.3565ZM135.7 0.00402832C152.412 0.180978 159.878 7.1619 160.209 19.6622L157.717 19.4246C146.86 18.3872 138.036 10.462 135.7 0.00402832ZM133.818 0.0129801C131.478 10.4663 122.658 18.3874 111.804 19.4246L109.879 19.6077C110.223 7.23158 117.476 0.337704 133.818 0.0129801Z" />
              </svg>
            </span>
          </button>
        </div>

        <nav className="hidden md:flex items-stretch h-full ml-auto" aria-label="Primary">
          <NavItem page="catalog" label={t('nav.catalog')} icon={LayoutGrid} />
          <NavItem page="compare" label={t('nav.compare')} icon={Layers} count={compareCount} />
          <NavItem page="favorites" label={t('nav.favorites')} icon={Heart} count={favoritesCount} />
          <div className="w-px bg-neutral-200/60 my-3" aria-hidden="true" />
          <NavItem page="protocol" label={t('nav.protocol')} icon={BookOpen} />
          <NavItem page="about" label={t('nav.about')} icon={Info} />
          <div className="w-px bg-neutral-200/60 my-3" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}
            className="h-full px-4 flex items-center gap-1.5 text-[12px] uppercase tracking-[0.12em] text-neutral-400 hover:text-neutral-800 hover:bg-neutral-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-800"
            style={{ fontWeight: 450 }}
            aria-label={language === 'en' ? 'Switch language to Russian' : 'Переключить язык на английский'}
          >
            <Globe className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{language === 'en' ? 'RU' : 'EN'}</span>
          </button>
        </nav>

        <div className="flex md:hidden">
          <button
            type="button"
            className={cn(
              "px-4 flex items-center justify-center transition-all relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-800",
              activePage === "compare" ? "text-neutral-800" : "text-neutral-400 hover:text-neutral-800 hover:bg-neutral-50",
            )}
            onClick={() => goToPage("compare")}
            aria-label={t('nav.compare')}
            aria-current={activePage === 'compare' ? 'page' : undefined}
          >
            <Layers className="w-5 h-5" aria-hidden="true" />
            {compareCount > 0 && <span className="absolute top-3 right-2.5 min-w-[16px] h-[16px] flex items-center justify-center px-1 text-[9px] rounded-full bg-neutral-800 text-white">{compareCount}</span>}
          </button>
          <button
            type="button"
            className={cn(
              "px-4 flex items-center justify-center transition-all relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-800",
              activePage === "favorites" ? "text-neutral-800" : "text-neutral-400 hover:text-neutral-800 hover:bg-neutral-50",
            )}
            onClick={() => goToPage("favorites")}
            aria-label={t('nav.favorites')}
            aria-current={activePage === 'favorites' ? 'page' : undefined}
          >
            <Heart className={cn("w-5 h-5", favoritesCount > 0 && "fill-current")} aria-hidden="true" />
            {favoritesCount > 0 && <span className="absolute top-3 right-2.5 min-w-[16px] h-[16px] flex items-center justify-center px-1 text-[9px] rounded-full bg-neutral-800 text-white">{favoritesCount}</span>}
          </button>
          <button
            type="button"
            className="px-5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-800"
            onClick={() => setIsMobileMenuOpen(open => !open)}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="onod-mobile-navigation"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              id="onod-mobile-navigation"
              key="mobile-menu"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className="fixed inset-0 top-16 z-[59] md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
            >
              <motion.div
                className="absolute inset-0 bg-white"
                initial={prefersReducedMotion ? false : { y: '-100%' }}
                animate={{ y: 0 }}
                exit={{ y: '-100%' }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
              />

              <div className="relative h-full flex flex-col justify-between overflow-y-auto">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[40vw] leading-none tracking-tighter text-neutral-100 pointer-events-none select-none" style={{ fontWeight: 900 }} aria-hidden="true">F</div>

                <nav className="relative z-10 flex flex-col pt-4" aria-label="Mobile primary">
                  {[
                    { page: "catalog", label: t('nav.catalog'), count: undefined },
                    { page: "compare", label: t('nav.compare'), count: compareCount },
                    { page: "favorites", label: t('nav.favorites'), count: favoritesCount },
                    { page: "protocol", label: t('nav.protocol'), count: undefined },
                    { page: "about", label: t('nav.about'), count: undefined },
                  ].map((item, index) => {
                    const isActive = activePage === item.page;
                    return (
                      <motion.button
                        type="button"
                        key={item.page}
                        initial={prefersReducedMotion ? false : { opacity: 0, x: -24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 24 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.3, delay: prefersReducedMotion ? 0 : index * 0.04, ease: [0.22, 1, 0.36, 1] }}
                        onClick={() => goToPage(item.page)}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          "group relative text-left transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-800",
                          isActive ? "bg-neutral-900 text-white" : "text-neutral-800 active:bg-neutral-100",
                        )}
                      >
                        <span className={cn("absolute top-0 left-0 right-0 h-px", isActive ? "bg-neutral-800" : "bg-neutral-200")} aria-hidden="true" />
                        <span className="flex items-baseline justify-between px-6 py-5">
                          <span className="flex items-baseline gap-4 overflow-hidden">
                            <span className={cn("font-mono text-[11px] tracking-widest shrink-0", isActive ? "text-neutral-500" : "text-neutral-300")} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                            <span className="text-[11vw] leading-[0.85] tracking-[-0.04em] uppercase block" style={{ fontWeight: isActive ? 800 : 400 }}>{item.label}</span>
                          </span>
                          {item.count !== undefined && item.count > 0 && <span className="font-mono text-[11px] tracking-widest ml-3 shrink-0 text-neutral-400">[{item.count}]</span>}
                        </span>
                      </motion.button>
                    );
                  })}
                  <div className="h-px bg-neutral-200" aria-hidden="true" />
                </nav>

                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.3, delay: prefersReducedMotion ? 0 : 0.18 }}
                  className="relative z-10 px-6 py-8 mt-auto"
                >
                  <div className="mb-6">
                    <button
                      type="button"
                      onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}
                      className="w-full py-3 border border-neutral-200 text-neutral-500 hover:text-neutral-800 hover:border-neutral-400 transition-all font-mono text-[11px] uppercase tracking-[0.15em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800"
                    >
                      {language === 'en' ? 'Русский' : 'English'}
                    </button>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-1.5">
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-300">ONOD Fonts © 2026</span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-300">{language === 'ru' ? 'Типографический дизайн-инструмент' : 'Typography design instrument'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-300">{language === 'ru' ? 'Онлайн' : 'Online'}</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </header>
  );
};
