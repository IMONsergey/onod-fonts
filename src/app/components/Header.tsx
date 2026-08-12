import React from "react";
import { Globe, Heart, Layers, LayoutGrid, Menu, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { useNavigate } from "react-router";

interface HeaderProps {
  activePage: string;
  setActivePage: (page: string) => void;
  favoritesCount: number;
  compareCount: number;
}

const FOCUSABLE_SELECTOR = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])', 'select:not([disabled])',
  'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

export const Header: React.FC<HeaderProps> = ({ activePage, setActivePage, favoritesCount, compareCount }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const mobileMenuRef = React.useRef<HTMLDivElement>(null);
  const menuTriggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => setIsMobileMenuOpen(false), [activePage]);

  React.useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() => mobileMenuRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsMobileMenuOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !mobileMenuRef.current) return;
      const focusable = Array.from(mobileMenuRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(element => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      window.requestAnimationFrame(() => menuTriggerRef.current?.focus());
    };
  }, [isMobileMenuOpen]);

  const goToPage = (page: string) => {
    setActivePage(page);
    setIsMobileMenuOpen(false);
  };

  const NavItem = ({ page, label, icon: Icon, count }: { page: string; label: string; icon: LucideIcon; count?: number }) => {
    const active = activePage === page;
    return (
      <button type="button" onClick={() => goToPage(page)} aria-current={active ? 'page' : undefined} className={cn(
        "h-full px-5 flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-800",
        active ? "bg-neutral-100 text-neutral-900" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50",
      )}>
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{label}</span>
        {Boolean(count) && <span className="min-w-4 h-4 px-1 flex items-center justify-center bg-neutral-900 text-white text-[8px] rounded-full">{count}</span>}
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-[60] w-full h-16 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      <div className="h-full flex items-stretch justify-between max-w-[1920px] mx-auto">
        <button type="button" aria-label="ONOD Fonts — catalog" onClick={() => navigate('/')} className="h-full px-5 md:px-6 flex items-center text-neutral-900 hover:bg-neutral-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-800">
          <svg width="100" height="20" viewBox="0 0 215 42" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M95.6187 0.572388H105.919V40.6288H91.8992L64.6036 10.5865V40.6288H54.3033V0.572388H68.2659L95.6187 30.6719V0.572388Z" />
            <path d="M25.1783 41.2009C7.5535 41.2009 0 33.8763 0 20.5432C0 7.26738 7.5535 0 25.1783 0C42.7459 0 50.3567 7.32461 50.3567 20.5432C50.3567 33.8191 42.7459 41.2009 25.1783 41.2009ZM25.1783 32.5602C35.8791 32.5602 40.0564 28.7262 40.0564 20.5432C40.0564 12.4175 35.9363 8.64075 25.1783 8.64075C14.4203 8.64075 10.3002 12.3603 10.3002 20.5432C10.3002 28.7834 14.4775 32.5602 25.1783 32.5602Z" />
            <path d="M194.62 0C205.469 0 215 6.50638 215 20.3324C215 34.1585 205.469 40.6648 194.62 40.6648H164.169V0H194.62ZM190.544 31.8929C198.696 31.8929 204.21 30.2082 204.21 20.3324C204.21 10.4567 198.696 8.77199 190.544 8.77199H174.959V31.8929H190.544Z" />
            <path d="M160.216 21.1173C160.001 33.8904 152.523 41.042 135.609 41.197C137.8 30.5317 146.715 22.4077 157.717 21.3565L160.216 21.1173ZM111.804 21.3565C122.803 22.4076 131.715 30.5278 133.909 41.1889C117.366 40.8831 110.102 33.8208 109.871 21.1718L111.804 21.3565ZM135.7 0.00402832C152.412 0.180978 159.878 7.1619 160.209 19.6622L157.717 19.4246C146.86 18.3872 138.036 10.462 135.7 0.00402832ZM133.818 0.0129801C131.478 10.4663 122.658 18.3874 111.804 19.4246L109.879 19.6077C110.223 7.23158 117.476 0.337704 133.818 0.0129801Z" />
          </svg>
        </button>

        <nav className="hidden md:flex ml-auto items-stretch" aria-label="Primary">
          <NavItem page="catalog" label={t('nav.catalog')} icon={LayoutGrid} />
          <NavItem page="favorites" label={t('nav.favorites')} icon={Heart} count={favoritesCount} />
          <NavItem page="compare" label={t('nav.compare')} icon={Layers} count={compareCount} />
          <div className="w-px my-3 bg-neutral-200" aria-hidden="true" />
          <button type="button" onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')} className="h-full px-4 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-800" aria-label={language === 'en' ? 'Switch language to Russian' : 'Переключить язык на английский'}>
            <Globe className="w-3.5 h-3.5" aria-hidden="true" />{language === 'en' ? 'RU' : 'EN'}
          </button>
        </nav>

        <div className="flex md:hidden ml-auto">
          <button type="button" onClick={() => goToPage('favorites')} className="w-14 h-full relative flex items-center justify-center text-neutral-500 hover:bg-neutral-50" aria-label={t('nav.favorites')}>
            <Heart className={cn("w-4 h-4", favoritesCount > 0 && "fill-current")} aria-hidden="true" />
            {favoritesCount > 0 && <span className="absolute top-3 right-2 min-w-4 h-4 px-1 rounded-full bg-neutral-900 text-white text-[8px] flex items-center justify-center">{favoritesCount}</span>}
          </button>
          <button ref={menuTriggerRef} type="button" onClick={() => setIsMobileMenuOpen(value => !value)} className="w-14 h-full flex items-center justify-center text-neutral-600 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-800" aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={isMobileMenuOpen} aria-controls="onod-mobile-navigation">
            {isMobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div ref={mobileMenuRef} id="onod-mobile-navigation" className="fixed inset-x-0 top-16 bottom-0 z-[61] bg-white md:hidden overflow-y-auto" role="dialog" aria-modal="true" aria-label="Navigation">
          <nav className="border-t border-neutral-100" aria-label="Mobile primary">
            {[
              { page: 'catalog', label: t('nav.catalog'), count: 0 },
              { page: 'favorites', label: t('nav.favorites'), count: favoritesCount },
              { page: 'compare', label: t('nav.compare'), count: compareCount },
            ].map(item => (
              <button key={item.page} type="button" onClick={() => goToPage(item.page)} aria-current={activePage === item.page ? 'page' : undefined} className={cn(
                "w-full min-h-20 px-6 flex items-center justify-between text-left border-b border-neutral-200 text-2xl tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-800",
                activePage === item.page ? "bg-neutral-900 text-white" : "bg-white text-neutral-900 active:bg-neutral-100",
              )}>
                <span>{item.label}</span>{item.count > 0 && <span className="font-mono text-[10px]">{item.count}</span>}
              </button>
            ))}
          </nav>
          <div className="p-6 border-b border-neutral-200">
            <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mb-4">{language === 'ru' ? 'Информация' : 'Information'}</div>
            <div className="flex flex-col items-start gap-3">
              <button type="button" onClick={() => goToPage('protocol')} className="text-sm text-neutral-600 hover:text-black">{t('nav.protocol')}</button>
              <button type="button" onClick={() => goToPage('about')} className="text-sm text-neutral-600 hover:text-black">{t('nav.about')}</button>
            </div>
          </div>
          <div className="p-6 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">Language</span>
            <button type="button" onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')} className="px-4 py-2 border border-neutral-200 font-mono text-[10px] uppercase tracking-widest hover:bg-neutral-100">{language === 'en' ? 'Русский' : 'English'}</button>
          </div>
        </div>
      )}
    </header>
  );
};
