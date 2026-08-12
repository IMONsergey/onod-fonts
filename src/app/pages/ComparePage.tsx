import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Copy, Plus, Search, Share2, X } from "lucide-react";
import { Font } from "@/data/mockFonts";
import { toast } from "sonner";
import { FontLoader } from "@/components/FontLoader";
import { useLanguage } from "@/lib/i18n";
import { copyToClipboard } from "@/lib/clipboard";
import { getEffectiveCssStack, getEffectiveFamilyName } from "@/lib/fontTrust";
import { useSearchParams } from "react-router";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CompareProps {
  fonts: Font[];
  allFonts?: Font[];
  previewText: string;
  setPreviewText: (text: string) => void;
  removeFromCompare: (id: string) => void;
  toggleCompare?: (id: string) => void;
  onBack: () => void;
}

const validNumber = (value: string | null, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
};

const fallbackFamily = (font?: Font) => {
  if (!font) return "sans-serif";
  if (font.categories.includes("serif")) return "serif";
  if (font.categories.includes("monospaced")) return "monospace";
  return "sans-serif";
};

export const ComparePage: React.FC<CompareProps> = ({ fonts, allFonts = [], previewText, setPreviewText, removeFromCompare, toggleCompare, onBack }) => {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const hydratedFromUrl = useRef(false);
  const [baseSize, setBaseSize] = useState(16);
  const [scaleRatio, setScaleRatio] = useState(1.25);
  const [customContent, setCustomContent] = useState("");
  const [headingFontId, setHeadingFontId] = useState("");
  const [bodyFontId, setBodyFontId] = useState("");
  const [fontQuery, setFontQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [configCode, setConfigCode] = useState("");

  useEffect(() => {
    if (hydratedFromUrl.current || !fonts.length) return;
    const urlHeading = searchParams.get('heading') || searchParams.get('h');
    const urlBody = searchParams.get('body') || searchParams.get('b');
    setHeadingFontId(fonts.find(font => font.id === urlHeading)?.id || fonts[0].id);
    setBodyFontId(fonts.find(font => font.id === urlBody)?.id || fonts[1]?.id || fonts[0].id);
    setBaseSize(validNumber(searchParams.get('base'), 16, 8, 96));
    setScaleRatio(validNumber(searchParams.get('ratio'), 1.25, 1, 2));
    const urlContent = searchParams.get('content');
    if (urlContent) {
      setCustomContent(urlContent.slice(0, 1000));
      setPreviewText(urlContent.slice(0, 1000));
    } else if (previewText) {
      setCustomContent(previewText);
    }
    hydratedFromUrl.current = true;
  }, [fonts, previewText, searchParams, setPreviewText]);

  useEffect(() => {
    if (!fonts.length) {
      setHeadingFontId("");
      setBodyFontId("");
      return;
    }
    setHeadingFontId(previous => fonts.some(font => font.id === previous) ? previous : fonts[0].id);
    setBodyFontId(previous => fonts.some(font => font.id === previous) ? previous : (fonts[1]?.id || fonts[0].id));
  }, [fonts]);

  useEffect(() => {
    setSearchParams(current => {
      const next = new URLSearchParams(current);
      if (fonts.length) next.set('fonts', fonts.map(font => font.id).join(',')); else next.delete('fonts');
      if (headingFontId) next.set('heading', headingFontId); else next.delete('heading');
      if (bodyFontId) next.set('body', bodyFontId); else next.delete('body');
      next.set('base', String(baseSize));
      next.set('ratio', String(scaleRatio));
      next.delete('h');
      next.delete('b');
      if (customContent) next.set('content', customContent.slice(0, 1000)); else next.delete('content');
      return next.toString() === current.toString() ? current : next;
    }, { replace: true });
  }, [fonts, headingFontId, bodyFontId, baseSize, scaleRatio, customContent, setSearchParams]);

  const scaleSteps = ["base", "lg", "xl", "2xl", "3xl", "4xl"];
  const calculatedSizes = useMemo(() => scaleSteps.map((_, index) => Math.round(baseSize * Math.pow(scaleRatio, index))), [baseSize, scaleRatio]);
  const headingFont = fonts.find(font => font.id === headingFontId) || fonts[0];
  const bodyFont = fonts.find(font => font.id === bodyFontId) || fonts[0];
  const headingName = headingFont ? getEffectiveFamilyName(headingFont) : "";
  const bodyName = bodyFont ? getEffectiveFamilyName(bodyFont) : "";
  const headingStack = headingFont ? getEffectiveCssStack(headingFont) : "sans-serif";
  const bodyStack = bodyFont ? getEffectiveCssStack(bodyFont) : "sans-serif";
  const sample = customContent || previewText || (language === 'ru' ? 'Типографика задаёт голос интерфейса.' : 'Typography gives the interface its voice.');

  const suggestions = useMemo(() => {
    const query = fontQuery.trim().toLowerCase();
    if (!query || fonts.length >= 3) return [];
    return allFonts.filter(font => !fonts.some(selected => selected.id === font.id)).filter(font => getEffectiveFamilyName(font).toLowerCase().includes(query)).slice(0, 8);
  }, [allFonts, fontQuery, fonts]);

  const addFont = (id: string) => {
    if (!toggleCompare || fonts.length >= 3) return;
    toggleCompare(id);
    setFontQuery("");
  };

  const generateConfig = () => `fontFamily: {\n  body: ['"${bodyName}"', '${fallbackFamily(bodyFont)}'],\n  display: ['"${headingName}"', '${fallbackFamily(headingFont)}'],\n},\nfontSize: {\n  base: '${baseSize}px',\n  lg: '${calculatedSizes[1]}px',\n  xl: '${calculatedSizes[2]}px',\n  '2xl': '${calculatedSizes[3]}px',\n  '3xl': '${calculatedSizes[4]}px',\n  '4xl': '${calculatedSizes[5]}px',\n}`;

  const copyConfig = async () => {
    if (!fonts.length) return;
    const config = generateConfig();
    if (await copyToClipboard(config)) toast.info(language === 'ru' ? 'Конфиг скопирован' : 'Config copied');
    else {
      setConfigCode(config);
      setIsDialogOpen(true);
    }
  };

  const canonicalWorkbenchUrl = () => {
    const url = new URL(window.location.href);
    if (fonts.length) url.searchParams.set('fonts', fonts.map(font => font.id).join(','));
    if (headingFont?.id) url.searchParams.set('heading', headingFont.id);
    if (bodyFont?.id) url.searchParams.set('body', bodyFont.id);
    url.searchParams.set('base', String(baseSize));
    url.searchParams.set('ratio', String(scaleRatio));
    url.searchParams.delete('h');
    url.searchParams.delete('b');
    if (customContent) url.searchParams.set('content', customContent.slice(0, 1000)); else url.searchParams.delete('content');
    return url.toString();
  };

  const shareUrl = async () => {
    const url = canonicalWorkbenchUrl();
    if (await copyToClipboard(url)) toast.info(language === 'ru' ? 'Ссылка скопирована' : 'Workbench link copied');
    else toast.info(url);
  };

  const updateContent = (value: string) => {
    setCustomContent(value);
    setPreviewText(value);
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <FontLoader fonts={fonts} />
      <div className="sticky top-16 z-40 h-16 bg-white/95 backdrop-blur-md border-b border-neutral-200 flex items-center justify-between">
        <div className="h-full flex items-center min-w-0">
          <button type="button" onClick={onBack} className="h-full px-5 border-r border-neutral-200 flex items-center gap-2 text-neutral-500 hover:text-black hover:bg-neutral-50 transition-colors"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline text-sm">{t('back')}</span></button>
          <div className="px-4 md:px-6 min-w-0"><span className="font-semibold tracking-tight">Workbench</span><span className="ml-2 font-mono text-[9px] text-neutral-400">{fonts.length}/3</span></div>
        </div>
        <div className="h-full flex shrink-0">
          <button type="button" onClick={shareUrl} className="h-full px-4 md:px-5 border-l border-neutral-200 flex items-center gap-2 text-sm hover:bg-neutral-50" aria-label={t('share')}><Share2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">{t('share')}</span></button>
          <button type="button" onClick={copyConfig} disabled={!fonts.length} className="h-full px-4 md:px-5 border-l border-neutral-200 bg-neutral-900 text-white flex items-center gap-2 text-sm hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed" aria-label={t('compare.export')}><Copy className="w-3.5 h-3.5" /><span className="hidden sm:inline">{t('compare.export')}</span></button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[360px_minmax(0,1fr)] min-h-[calc(100vh-128px)]">
        <aside className="bg-neutral-50 border-b lg:border-b-0 lg:border-r border-neutral-200 p-5 md:p-6 space-y-7">
          <section>
            <div className="flex items-center justify-between mb-3"><h2 className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">{language === 'ru' ? 'Гарнитуры' : 'Typefaces'}</h2><span className="font-mono text-[9px] text-neutral-400">{fonts.length}/3</span></div>
            <div className="space-y-2">
              {fonts.map(font => <div key={font.id} className="bg-white border border-neutral-200 px-3 py-3 flex items-center justify-between gap-3"><div className="min-w-0"><div className="text-sm font-medium truncate">{getEffectiveFamilyName(font)}</div><div className="mt-1 font-mono text-[8px] uppercase text-neutral-400 truncate">{font.categories[0]}</div></div><button type="button" onClick={() => removeFromCompare(font.id)} className="w-7 h-7 flex items-center justify-center border border-neutral-200 hover:bg-neutral-100" aria-label={`Remove ${getEffectiveFamilyName(font)}`}><X className="w-3 h-3" /></button></div>)}
            </div>
            {fonts.length < 3 && <div className="mt-3 relative"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" /><input aria-label={language === 'ru' ? 'Добавить шрифт' : 'Add typeface'} value={fontQuery} onChange={event => setFontQuery(event.target.value)} placeholder={language === 'ru' ? 'Добавить шрифт…' : 'Add typeface…'} className="w-full h-10 pl-9 pr-3 border border-neutral-200 bg-white outline-none text-sm focus:border-neutral-400" /></div>{suggestions.length > 0 && <div className="absolute z-20 left-0 right-0 top-full bg-white border-x border-b border-neutral-200 shadow-lg">{suggestions.map(font => <button key={font.id} type="button" onClick={() => addFont(font.id)} className="w-full px-3 py-2.5 flex items-center justify-between gap-3 text-left border-t border-neutral-100 hover:bg-neutral-50"><span className="text-sm truncate">{getEffectiveFamilyName(font)}</span><Plus className="w-3.5 h-3.5 shrink-0" /></button>)}</div>}</div>}
          </section>

          {fonts.length > 0 && <>
            <section><h2 className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mb-3">{t('compare.roles')}</h2><div className="space-y-3"><label className="block text-xs font-medium">{t('compare.heading')}<select id="workbench-heading" value={headingFont?.id || ''} onChange={event => setHeadingFontId(event.target.value)} className="mt-2 w-full h-10 bg-white border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-400">{fonts.map(font => <option key={font.id} value={font.id}>{getEffectiveFamilyName(font)}</option>)}</select></label><label className="block text-xs font-medium">{t('compare.body')}<select id="workbench-body" value={bodyFont?.id || ''} onChange={event => setBodyFontId(event.target.value)} className="mt-2 w-full h-10 bg-white border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-400">{fonts.map(font => <option key={font.id} value={font.id}>{getEffectiveFamilyName(font)}</option>)}</select></label></div></section>
            <section><h2 className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mb-3">{t('compare.customContent')}</h2><textarea aria-label={t('compare.customContent')} value={customContent} onChange={event => updateContent(event.target.value)} placeholder={t('preview.placeholder')} className="w-full h-24 resize-none bg-white border border-neutral-200 p-3 text-sm outline-none focus:border-neutral-400" /></section>
            <section><h2 className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mb-3">{t('compare.scale')}</h2><div className="grid grid-cols-2 gap-3"><label className="text-xs">{t('compare.base')}<input id="workbench-base" type="number" min="8" max="96" value={baseSize} onChange={event => setBaseSize(validNumber(event.target.value, 16, 8, 96))} className="mt-2 w-full h-10 border border-neutral-200 px-3 text-sm outline-none" /></label><label className="text-xs">{t('compare.ratio')}<select id="workbench-ratio" value={scaleRatio} onChange={event => setScaleRatio(Number(event.target.value))} className="mt-2 w-full h-10 border border-neutral-200 px-2 text-sm bg-white outline-none"><option value="1.125">1.125</option><option value="1.2">1.200</option><option value="1.25">1.250</option><option value="1.333">1.333</option><option value="1.414">1.414</option><option value="1.5">1.500</option><option value="1.618">1.618</option></select></label></div></section>
          </>}
        </aside>

        <main className="min-w-0 bg-white p-6 md:p-10 lg:p-14">
          {!fonts.length ? <div className="min-h-[55vh] flex flex-col items-center justify-center text-center"><div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mb-4">Workbench</div><h1 className="text-4xl md:text-6xl font-semibold tracking-tighter">{language === 'ru' ? 'Добавьте гарнитуры' : 'Add typefaces'}</h1><p className="mt-4 max-w-md text-sm leading-relaxed text-neutral-500">{language === 'ru' ? 'Начните с поиска слева. Можно выбрать до трёх шрифтов и назначить роли заголовка и текста.' : 'Use the search on the left. Choose up to three typefaces and assign heading and body roles.'}</p></div> : <div className="max-w-5xl mx-auto"><div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mb-10">{headingName} / {bodyName}</div><h1 style={{ fontFamily: headingStack, fontSize: `${calculatedSizes[5]}px`, lineHeight: 0.95 }} className="tracking-tight break-words">{sample}</h1><div className="mt-12 border-t border-neutral-200 pt-10 grid md:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)] gap-10"><div style={{ fontFamily: bodyStack, fontSize: `${baseSize}px`, lineHeight: 1.65 }}><p>{sample}</p><p className="mt-5 text-neutral-500">{language === 'ru' ? 'Этот блок показывает рабочую иерархию заголовка и основного текста без декоративной имитации готового макета.' : 'This block tests the working hierarchy between display and body roles without pretending to be a finished layout.'}</p></div><div className="space-y-2">{calculatedSizes.slice().reverse().map((size, index) => <div key={size} className="h-9 border-b border-neutral-100 flex items-center justify-between font-mono text-[9px]"><span className="text-neutral-400">{scaleSteps[5 - index]}</span><span>{size}px</span></div>)}</div></div></div>}
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogContent><DialogHeader><DialogTitle>{language === 'ru' ? 'Конфигурация' : 'Configuration'}</DialogTitle><DialogDescription>{language === 'ru' ? 'Скопируйте конфигурацию вручную.' : 'Copy the configuration manually.'}</DialogDescription></DialogHeader><pre className="max-h-80 overflow-auto bg-neutral-50 border border-neutral-200 p-4 text-xs whitespace-pre-wrap">{configCode}</pre></DialogContent></Dialog>
    </div>
  );
};
