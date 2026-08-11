import React, { useState, useMemo, useEffect, useRef } from "react";
import { Font } from "@/data/mockFonts";
import { X, ArrowLeft, Type, Copy, Share2, Scale } from "lucide-react";
import { toast } from "sonner";
import { FontLoader } from "@/components/FontLoader";
import { useLanguage } from "@/lib/i18n";
import { copyToClipboard } from "@/lib/clipboard";
import { getEffectiveAuthor, getEffectiveCssStack, getEffectiveFamilyName } from "@/lib/fontTrust";
import { useSearchParams } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export const ComparePage: React.FC<CompareProps> = ({
  fonts,
  allFonts = [],
  previewText,
  setPreviewText,
  removeFromCompare,
  toggleCompare,
  onBack,
}) => {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const hydratedFromUrl = useRef(false);
  const [baseSize, setBaseSize] = useState(16);
  const [scaleRatio, setScaleRatio] = useState(1.25);
  const [customContent, setCustomContent] = useState("");
  const [headingFontId, setHeadingFontId] = useState("");
  const [bodyFontId, setBodyFontId] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [configCode, setConfigCode] = useState("");

  useEffect(() => {
    if (hydratedFromUrl.current || fonts.length === 0) return;
    const urlHeading = searchParams.get('heading') || searchParams.get('h');
    const urlBody = searchParams.get('body') || searchParams.get('b');
    const heading = fonts.find(font => font.id === urlHeading)?.id || fonts[0].id;
    const body = fonts.find(font => font.id === urlBody)?.id || fonts[1]?.id || fonts[0].id;
    setHeadingFontId(heading);
    setBodyFontId(body);
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
    if (!fonts.length) return;
    setHeadingFontId(previous => fonts.some(font => font.id === previous) ? previous : fonts[0].id);
    setBodyFontId(previous => fonts.some(font => font.id === previous) ? previous : (fonts[1]?.id || fonts[0].id));
  }, [fonts]);

  useEffect(() => {
    if (!hydratedFromUrl.current || !fonts.length || !headingFontId || !bodyFontId) return;
    setSearchParams(current => {
      const next = new URLSearchParams(current);
      next.set('fonts', fonts.map(font => font.id).join(','));
      next.set('heading', headingFontId);
      next.set('body', bodyFontId);
      next.set('base', String(baseSize));
      next.set('ratio', String(scaleRatio));
      next.delete('h');
      next.delete('b');
      if (customContent) next.set('content', customContent.slice(0, 1000));
      else next.delete('content');
      return next;
    }, { replace: true });
  }, [fonts, headingFontId, bodyFontId, baseSize, scaleRatio, customContent, setSearchParams]);

  const scaleSteps = ["base", "lg", "xl", "2xl", "3xl", "4xl"];
  const calculatedSizes = useMemo(() => scaleSteps.map((_, i) => Math.round(baseSize * Math.pow(scaleRatio, i))), [baseSize, scaleRatio]);
  const headingFont = fonts.find(font => font.id === headingFontId) || fonts[0];
  const bodyFont = fonts.find(font => font.id === bodyFontId) || fonts[0];
  const headingName = headingFont ? getEffectiveFamilyName(headingFont) : "";
  const bodyName = bodyFont ? getEffectiveFamilyName(bodyFont) : "";
  const headingStack = headingFont ? getEffectiveCssStack(headingFont) : "sans-serif";
  const bodyStack = bodyFont ? getEffectiveCssStack(bodyFont) : "sans-serif";

  const suggestedFont = useMemo(() => {
    if (fonts.length >= 3 || fonts.length === 0 || !allFonts.length) return null;
    const baseFont = fonts[fonts.length - 1];
    const isSerif = baseFont.categories.includes("serif");
    let targetCat = "sans-serif";
    if (!isSerif && !baseFont.categories.includes("monospaced")) targetCat = "serif";
    if (baseFont.categories.includes("monospaced")) targetCat = "sans-serif";
    const candidates = allFonts.filter(font => font.categories.includes(targetCat) && !fonts.some(existing => existing.id === font.id));
    if (!candidates.length) return null;
    return candidates[baseFont.id.length % candidates.length];
  }, [fonts, allFonts]);

  const generateConfig = () => `
// tailwind.config.js theme extension
fontFamily: {
  'body': ['"${bodyName}"', '${fallbackFamily(bodyFont)}'],
  'display': ['"${headingName}"', '${fallbackFamily(headingFont)}'],
},
fontSize: {
  'base': '${baseSize}px',
  'lg': '${calculatedSizes[1]}px',
  'xl': '${calculatedSizes[2]}px',
  '2xl': '${calculatedSizes[3]}px',
  '3xl': '${calculatedSizes[4]}px',
  '4xl': '${calculatedSizes[5]}px',
}
  `.trim();

  const copyConfig = async () => {
    const config = generateConfig();
    if (await copyToClipboard(config)) toast.success(language === 'ru' ? 'Конфиг Tailwind скопирован' : 'Tailwind config copied');
    else {
      setConfigCode(config);
      setIsDialogOpen(true);
    }
  };

  const canonicalWorkbenchUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('fonts', fonts.map(font => font.id).join(','));
    if (headingFont?.id) url.searchParams.set('heading', headingFont.id);
    if (bodyFont?.id) url.searchParams.set('body', bodyFont.id);
    url.searchParams.set('base', String(baseSize));
    url.searchParams.set('ratio', String(scaleRatio));
    url.searchParams.delete('h');
    url.searchParams.delete('b');
    if (customContent) url.searchParams.set('content', customContent.slice(0, 1000));
    else url.searchParams.delete('content');
    return url.toString();
  };

  const shareUrl = async () => {
    const url = canonicalWorkbenchUrl();
    if (await copyToClipboard(url)) toast.success(language === 'ru' ? 'Переносимая ссылка Workbench скопирована' : 'Portable Workbench URL copied');
    else toast.info(`URL: ${url}`);
  };

  const updateContent = (value: string) => {
    setCustomContent(value);
    setPreviewText(value);
  };

  if (fonts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-8 bg-white">
        <div className="w-24 h-24 border border-neutral-200 rounded-full flex items-center justify-center mb-8"><Scale className="w-8 h-8 text-neutral-400" /></div>
        <h2 className="text-6xl md:text-8xl tracking-tighter mb-8 uppercase leading-none" style={{ fontWeight: 700 }}>{t('compare.emptyTitle')}</h2>
        <p className="font-mono text-xs md:text-sm uppercase tracking-[0.2em] text-neutral-500 mb-12 max-w-md leading-relaxed">{t('compare.emptyDesc')}</p>
        <button type="button" onClick={onBack} className="px-12 py-5 bg-neutral-800 text-white font-mono text-xs uppercase tracking-widest hover:bg-neutral-700 transition-colors">{t('compare.return')}</button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white text-black font-sans flex flex-col">
      <FontLoader fonts={fonts} />

      <div className="sticky top-16 z-40 bg-white border-b border-neutral-200 flex justify-between h-16">
        <div className="flex items-center min-w-0">
          <button type="button" onClick={onBack} className="h-full px-6 border-r border-neutral-200 hover:bg-neutral-100 transition-colors flex items-center gap-2 group"><ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /><span className="font-mono text-xs uppercase tracking-widest hidden sm:inline">{t('back')}</span></button>
          <div className="px-4 md:px-6 flex items-center gap-2 min-w-0"><span className="font-bold tracking-tight hidden sm:inline">{t('compare.systemWorkbench')}</span><span className="font-mono text-[10px] uppercase bg-neutral-800 text-white px-2 py-0.5 whitespace-nowrap">{fonts.length} {t('compare.sources')}</span></div>
        </div>
        <div className="flex h-full shrink-0">
          <button type="button" onClick={shareUrl} className="px-4 md:px-6 border-l border-neutral-200 bg-white text-black hover:bg-neutral-100 font-mono text-xs uppercase tracking-widest transition-colors flex items-center gap-2" aria-label={t('share')}><Share2 className="w-3 h-3" /><span className="hidden sm:inline">{t('share')}</span></button>
          <button type="button" onClick={copyConfig} className="px-4 md:px-6 border-l border-neutral-200 bg-neutral-800 text-white hover:bg-neutral-700 font-mono text-xs uppercase tracking-widest transition-colors flex items-center gap-2"><Copy className="w-3 h-3" /><span className="hidden sm:inline">{t('compare.export')}</span></button>
        </div>
      </div>

      <div className="flex-grow flex flex-col xl:flex-row">
        <div className="w-full xl:w-[400px] bg-neutral-50 border-b xl:border-b-0 xl:border-r border-neutral-200 flex flex-col h-auto xl:h-[calc(100vh-128px)] overflow-y-auto">
          <div className="p-6 border-b border-neutral-200">
            <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-400 mb-4">{t('compare.customContent')}</h3>
            <textarea aria-label={t('compare.customContent')} value={customContent} onChange={(e) => updateContent(e.target.value)} placeholder={t('preview.placeholder')} className="w-full h-24 bg-white border border-neutral-200 p-3 text-sm resize-none focus:outline-none focus:border-neutral-400 placeholder:text-neutral-300 transition-colors" />
          </div>

          <div className="p-6 border-b border-neutral-200">
            <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-400 mb-4">{t('compare.roles')}</h3>
            <div className="space-y-4">
              <div className="bg-white border border-neutral-200 p-4">
                <label htmlFor="workbench-heading" className="block font-bold text-xs uppercase mb-2">{t('compare.heading')}</label>
                <select id="workbench-heading" className="w-full bg-transparent border-b border-neutral-200 pb-1 font-mono text-xs focus:outline-none focus:border-neutral-400" value={headingFont?.id || ''} onChange={(e) => setHeadingFontId(e.target.value)}>{fonts.map(f => <option key={f.id} value={f.id}>{getEffectiveFamilyName(f)} ({f.categories[0]})</option>)}</select>
              </div>
              <div className="bg-white border border-neutral-200 p-4">
                <label htmlFor="workbench-body" className="block font-bold text-xs uppercase mb-2">{t('compare.body')}</label>
                <select id="workbench-body" className="w-full bg-transparent border-b border-neutral-200 pb-1 font-mono text-xs focus:outline-none focus:border-neutral-400" value={bodyFont?.id || ''} onChange={(e) => setBodyFontId(e.target.value)}>{fonts.map(f => <option key={f.id} value={f.id}>{getEffectiveFamilyName(f)} ({f.categories[0]})</option>)}</select>
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-neutral-200">
            <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-400 mb-4">{t('compare.scale')}</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><label htmlFor="workbench-base" className="block font-mono text-[10px] uppercase mb-1">{t('compare.base')}</label><input id="workbench-base" type="number" min="8" max="96" value={baseSize} onChange={(e) => setBaseSize(validNumber(e.target.value, 16, 8, 96))} className="w-full border border-neutral-200 p-2 font-mono text-sm focus:outline-none focus:border-neutral-400 transition-colors" /></div>
              <div><label htmlFor="workbench-ratio" className="block font-mono text-[10px] uppercase mb-1">{t('compare.ratio')}</label><select id="workbench-ratio" value={scaleRatio} onChange={(e) => setScaleRatio(Number(e.target.value))} className="w-full border border-neutral-200 p-2 font-mono text-sm bg-white focus:outline-none focus:border-neutral-400 transition-colors"><option value="1.067">1.067 (Minor Second)</option><option value="1.125">1.125 (Major Second)</option><option value="1.200">1.200 (Minor Third)</option><option value="1.250">1.250 (Major Third)</option><option value="1.333">1.333 (Perfect Fourth)</option><option value="1.414">1.414 (Augmented Fourth)</option><option value="1.500">1.500 (Perfect Fifth)</option><option value="1.618">1.618 (Golden Ratio)</option></select></div>
            </div>
            <div className="space-y-1">{calculatedSizes.slice().reverse().map((size, i) => { const index = calculatedSizes.length - 1 - i; return <div key={index} className="flex items-center justify-between text-xs border-b border-neutral-100 py-2"><span className="font-mono text-neutral-400 w-12">{scaleSteps[index]}</span><span className="font-mono">{size}px</span><div className="w-16 h-2 bg-black" style={{ opacity: 0.1 + (index * 0.15) }} /></div>; })}</div>
          </div>

          <div className="p-6 mt-auto">
            <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-400 mb-4">{t('compare.active')}</h3>
            <div className="space-y-2 mb-6">{fonts.map(f => { const name = getEffectiveFamilyName(f); return <div key={f.id} className="flex justify-between items-center text-sm group"><span>{name}</span><button type="button" onClick={() => removeFromCompare(f.id)} className="text-neutral-300 hover:text-red-500 transition-colors" aria-label={`Remove ${name}`}><X className="w-4 h-4" /></button></div>; })}</div>
            {suggestedFont && toggleCompare && <div className="bg-neutral-100 border border-neutral-200 p-4"><div className="flex items-center justify-between mb-2"><span className="font-mono text-[10px] uppercase text-neutral-400">{language === 'ru' ? 'Контрастная эвристика' : 'Contrast heuristic'}</span><span className="font-mono text-[10px] uppercase bg-black text-white px-1">PAIR</span></div><div className="font-bold text-lg mb-1">{getEffectiveFamilyName(suggestedFont)}</div><div className="font-mono text-[10px] text-neutral-500 mb-2 uppercase">{suggestedFont.categories[0]} / {getEffectiveAuthor(suggestedFont)}</div><p className="font-mono text-[8px] text-neutral-400 mb-3">{language === 'ru' ? 'Предложение основано на контрасте категории, не на метрическом анализе.' : 'Based on category contrast, not metric type analysis.'}</p><button type="button" onClick={() => toggleCompare(suggestedFont.id)} className="w-full py-2 border border-neutral-300 hover:bg-neutral-800 hover:text-white hover:border-neutral-800 transition-colors font-mono text-xs uppercase flex items-center justify-center gap-2"><Type className="w-3 h-3" />{language === 'ru' ? 'Добавить' : 'Add to stack'}</button></div>}
          </div>
        </div>

        <div className="flex-grow bg-white p-8 md:p-16 overflow-y-auto h-auto xl:h-[calc(100vh-128px)]">
          <div className="max-w-3xl mx-auto space-y-16">
            <section className="space-y-6">
              <p className="font-mono text-xs uppercase tracking-widest text-neutral-400 mb-8 border-b border-neutral-200 pb-2">Preview / Article Layout</p>
              <h1 style={{ fontFamily: headingStack, fontSize: `${calculatedSizes[5]}px`, lineHeight: 1.1 }} className="font-bold tracking-tight">{customContent || t('preview.title')}</h1>
              <p style={{ fontFamily: bodyStack, fontSize: `${calculatedSizes[2]}px` }} className="text-neutral-500 font-light leading-relaxed max-w-2xl">{customContent || t('preview.subtitle')}</p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-4 border-t border-neutral-200 pt-4"><span className="font-mono text-[10px] uppercase mb-2 block">{t('preview.meta')}</span><div style={{ fontFamily: bodyStack, fontSize: `${baseSize}px` }} className="space-y-1"><div>{t('preview.author')}: {headingFont ? getEffectiveAuthor(headingFont) : ''}</div><div>{t('preview.date')}: Nov 28, 2024</div><div>{t('preview.read')}: 5 min</div></div></div>
              <div className="md:col-span-8 border-t border-neutral-200 pt-4 space-y-8"><p style={{ fontFamily: bodyStack, fontSize: `${calculatedSizes[1]}px`, lineHeight: 1.6 }}>{customContent || t('preview.body1').replace('{heading}', headingName).replace('{body}', bodyName)}</p><h2 style={{ fontFamily: headingStack, fontSize: `${calculatedSizes[3]}px` }} className="font-bold pt-8">{t('compare.scale')}</h2><p style={{ fontFamily: bodyStack, fontSize: `${baseSize}px`, lineHeight: 1.6 }}>{customContent || t('preview.body2').replace('{ratio}', scaleRatio.toString()).replace('{base}', baseSize.toString())}</p><blockquote className="pl-6 border-l-4 border-neutral-300 py-2 my-8"><p style={{ fontFamily: headingStack, fontSize: `${calculatedSizes[2]}px` }} className="italic">“{t('preview.quote')}”</p></blockquote></div>
            </section>

            <section className="border-t border-neutral-200 pt-12 pb-24"><h3 className="font-mono text-xs uppercase tracking-widest text-neutral-400 mb-8">{t('preview.ui')}</h3><div className="flex flex-wrap gap-4"><button type="button" className="bg-neutral-800 text-white px-8 py-4 hover:opacity-80 transition-opacity" style={{ fontFamily: bodyStack, fontSize: `${baseSize}px` }}>{t('preview.primary')}</button><button type="button" className="border border-neutral-300 bg-transparent text-black px-8 py-4 hover:bg-neutral-50 transition-colors" style={{ fontFamily: bodyStack, fontSize: `${baseSize}px` }}>{t('preview.secondary')}</button></div></section>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('compare.export')}</DialogTitle><DialogDescription>{language === 'ru' ? 'Автоматическое копирование заблокировано. Скопируйте код вручную.' : 'Automatic copying is blocked by browser permissions. Please copy the code below.'}</DialogDescription></DialogHeader>
          <div className="bg-neutral-100 p-4 rounded-md overflow-x-auto border border-black/10"><pre className="text-xs font-mono">{configCode}</pre></div>
        </DialogContent>
      </Dialog>
    </div>
  );
};