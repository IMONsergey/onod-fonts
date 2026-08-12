import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams } from 'react-router';
import { AnimatePresence } from 'motion/react';
import { PageTransition } from './components/PageTransition';
import { Header } from './components/Header';
import { FontCatalogPage } from './pages/FontCatalogPage';
import { FontDetailsPage } from './pages/FontDetailsPage';
import { ComparePage } from './pages/ComparePage';
import { FavoritesPage } from './pages/FavoritesPage';
import { AboutPage } from './pages/AboutPage';
import { ProtocolPage } from './pages/ProtocolPage';
import { PrivacyPage } from './pages/policies/PrivacyPage';
import { TermsPage } from './pages/policies/TermsPage';
import { LicensePage } from './pages/policies/LicensePage';
import { mockFonts } from './data/mockFonts';
import type { Font } from './data/mockFonts';
import { getEffectiveFamilyName } from './lib/fontTrust';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { LanguageProvider, useLanguage } from './lib/i18n';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import faviconImg from '../assets/favicon.png';

function readStoredFontIds(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem(key);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && mockFonts.some(font => font.id === id));
  } catch {
    window.localStorage.removeItem(key);
    return [];
  }
}

function validFontIds(ids: string[]) {
  return Array.from(new Set(ids.filter(id => mockFonts.some(font => font.id === id)))).slice(0, 3);
}

function sameIds(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [previewText, setPreviewText] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => readStoredFontIds('font-catalog-favorites'));
  const [compareList, setCompareList] = useState<string[]>(() => readStoredFontIds('font-catalog-compare'));
  const { t } = useLanguage();

  useEffect(() => {
    localStorage.setItem('font-catalog-favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('font-catalog-compare', JSON.stringify(compareList));
  }, [compareList]);

  // A shared Workbench URL is authoritative over localStorage when it contains font ids.
  useEffect(() => {
    if (location.pathname !== '/compare') return;
    const params = new URLSearchParams(location.search);
    const encoded = params.get('fonts');
    if (!encoded) return;
    const ids = validFontIds(encoded.split(',').map(item => item.trim()).filter(Boolean));
    if (ids.length > 0) setCompareList(previous => sameIds(previous, ids) ? previous : ids);
  }, [location.pathname, location.search]);

  const prevPathRef = React.useRef(location.pathname);
  useEffect(() => {
    const previousPath = prevPathRef.current;
    const currentPath = location.pathname;
    const knownRoutes = ['/compare', '/favorites', '/protocol', '/about', '/privacy', '/terms', '/license'];
    const returningToCatalog = currentPath === '/' && !knownRoutes.includes(previousPath) && previousPath !== '/';
    if (!returningToCatalog) window.scrollTo(0, 0);
    prevPathRef.current = currentPath;
  }, [location.pathname]);

  useEffect(() => {
    const path = location.pathname;
    let pageTitle = 'ONOD Fonts';
    if (path === '/') pageTitle = `${t('page.catalog')} — ONOD Fonts`;
    else if (path === '/compare') pageTitle = `${t('page.compare')} — ONOD Fonts`;
    else if (path === '/favorites') pageTitle = `${t('page.favorites')} — ONOD Fonts`;
    else if (path === '/protocol') pageTitle = `${t('page.protocol')} — ONOD Fonts`;
    else if (path === '/about') pageTitle = `${t('page.about')} — ONOD Fonts`;
    else if (path === '/privacy') pageTitle = 'Privacy — ONOD Fonts';
    else if (path === '/terms') pageTitle = 'Terms — ONOD Fonts';
    else if (path === '/license') pageTitle = 'License — ONOD Fonts';
    else {
      const fontId = path.slice(1);
      const font = mockFonts.find(candidate => candidate.id === fontId);
      pageTitle = font ? `${getEffectiveFamilyName(font)} — ONOD Fonts` : `${t('page.fontDetails')} — ONOD Fonts`;
    }
    document.title = pageTitle;
  }, [location.pathname, t]);

  useEffect(() => {
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    link.rel = 'shortcut icon';
    link.href = faviconImg;
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(previous => {
      const isFavorite = previous.includes(id);
      if (isFavorite) {
        toast.info(t('toast.removedFromFavorites'));
        return previous.filter(fontId => fontId !== id);
      }
      toast.success(t('toast.addedToFavorites'));
      return [...previous, id];
    });
  }, [t]);

  const toggleCompare = useCallback((id: string) => {
    setCompareList(previous => {
      const isComparing = previous.includes(id);
      if (isComparing) return previous.filter(fontId => fontId !== id);
      if (previous.length >= 3) {
        toast.error(t('toast.compareLimitReached'));
        return previous;
      }
      toast.success(t('toast.addedToCompare'));
      return [...previous, id];
    });
  }, [t]);

  const viewDetails = useCallback((id: string) => {
    navigate(`/${id}`, { state: { from: `${location.pathname}${location.search}` } });
  }, [navigate, location.pathname, location.search]);

  const openWorkbench = useCallback((ids = compareList) => {
    const valid = validFontIds(ids);
    const query = valid.length ? `?fonts=${encodeURIComponent(valid.join(','))}` : '';
    navigate(`/compare${query}`);
  }, [compareList, navigate]);

  const getActivePage = () => {
    if (location.pathname === '/') return 'catalog';
    if (location.pathname === '/compare') return 'compare';
    if (location.pathname === '/favorites') return 'favorites';
    if (location.pathname === '/protocol') return 'protocol';
    if (location.pathname === '/about') return 'about';
    return 'catalog';
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-neutral-800 selection:bg-neutral-200">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-neutral-800 focus:text-white focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest">
        Skip to content
      </a>
      <Header
        activePage={getActivePage()}
        setActivePage={page => {
          if (page === 'catalog') navigate('/');
          else if (page === 'favorites') navigate('/favorites');
          else if (page === 'compare') openWorkbench();
          else if (page === 'protocol') navigate('/protocol');
          else if (page === 'about') navigate('/about');
        }}
        favoritesCount={favorites.length}
        compareCount={compareList.length}
      />
      <main id="main-content" className="min-h-screen">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><FontCatalogPage fonts={mockFonts} previewText={previewText} setPreviewText={setPreviewText} favorites={favorites} toggleFavorite={toggleFavorite} compareList={compareList} toggleCompare={toggleCompare} viewDetails={viewDetails} onOpenStack={() => openWorkbench()} /></PageTransition>} />
            <Route path="/compare" element={<PageTransition><ComparePage fonts={mockFonts.filter(font => compareList.includes(font.id))} allFonts={mockFonts} previewText={previewText} setPreviewText={setPreviewText} removeFromCompare={toggleCompare} toggleCompare={toggleCompare} onBack={() => navigate('/')} /></PageTransition>} />
            <Route path="/favorites" element={<PageTransition><FavoritesPage fonts={mockFonts.filter(font => favorites.includes(font.id))} previewText={previewText} setPreviewText={setPreviewText} toggleFavorite={toggleFavorite} compareList={compareList} toggleCompare={toggleCompare} viewDetails={viewDetails} onGoToCatalog={() => navigate('/')} /></PageTransition>} />
            <Route path="/about" element={<PageTransition><AboutPage onNavigateHome={() => navigate('/')} /></PageTransition>} />
            <Route path="/protocol" element={<PageTransition><ProtocolPage /></PageTransition>} />
            <Route path="/privacy" element={<PageTransition><PrivacyPage /></PageTransition>} />
            <Route path="/terms" element={<PageTransition><TermsPage /></PageTransition>} />
            <Route path="/license" element={<PageTransition><LicensePage /></PageTransition>} />
            <Route path="/:id" element={<PageTransition><FontDetailsWrapper mockFonts={mockFonts} previewText={previewText} favorites={favorites} toggleFavorite={toggleFavorite} compareList={compareList} toggleCompare={toggleCompare} testPairing={(ids: string[]) => { setCompareList(validFontIds(ids)); openWorkbench(ids); }} /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
      <Toaster position="bottom-right" />
    </div>
  );
}

const FontDetailsWrapper = ({ mockFonts: fontList, ...props }: { mockFonts: Font[]; [key: string]: any }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const font = fontList.find(candidate => candidate.id === id);
  const routeState = location.state as { from?: string } | null;
  const onBack = () => navigate(routeState?.from || '/');

  if (!font) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-8 bg-white">
        <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-8">ERROR 404</div>
        <h2 className="text-6xl md:text-8xl tracking-tighter mb-8 uppercase leading-none" style={{ fontWeight: 700 }}>{t('fonts.notFound')}</h2>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500 mb-12 max-w-md leading-relaxed">
          {language === 'ru' ? 'Запрошенная гарнитура не найдена в индексе.' : 'The requested typeface could not be located in the index.'}
        </p>
        <button type="button" onClick={() => navigate('/')} className="px-12 py-5 bg-neutral-800 text-white font-mono text-xs uppercase tracking-widest hover:bg-neutral-700 transition-colors">
          {t('details.back')}
        </button>
      </div>
    );
  }

  return <FontDetailsPage font={font} onBack={onBack} toggleFavorite={props.toggleFavorite} isFavorite={props.favorites.includes(font.id)} toggleCompare={props.toggleCompare} isCompare={props.compareList.includes(font.id)} testPairing={props.testPairing} previewText={props.previewText} />;
};

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ErrorBoundary><AppContent /></ErrorBoundary>
      </BrowserRouter>
    </LanguageProvider>
  );
}
