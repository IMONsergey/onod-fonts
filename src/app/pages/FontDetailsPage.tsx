import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Code, Download, Heart, Minus, Plus, AlignLeft, AlignCenter, AlignRight, ExternalLink, AlertTriangle } from "lucide-react";
import { Font, mockFonts } from "@/data/mockFonts";
import { FontLoader } from "@/components/FontLoader";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { copyToClipboard } from "@/lib/clipboard";
import { useFontRuntimeStatus } from "@/lib/fontRuntime";
import { getFontTrustReport } from "@/lib/fontTrust";
import { toast } from "sonner";

interface FontDetailsProps {
  font: Font;
  onBack: () => void;
  toggleFavorite: (id: string) => void;
  isFavorite: boolean;
  toggleCompare: (id: string) => void;
  isCompare: boolean;
  testPairing?: (ids: string[]) => void;
  previewText?: string;
}

type Tab = "specimen" | "glyphs" | "about";
type Align = "left" | "center" | "right";

const googleImportUrl = (font: Font) => {
  const weights = Array.from(new Set(font.weights.filter(item => /^\d+$/.test(item)))).sort((a, b) => Number(a) - Number(b));
  let familySpec = font.name;
  if (font.variable && weights.length >= 2) familySpec += `:wght@${weights[0]}..${weights[weights.length - 1]}`;
  else if (weights.length) familySpec += `:wght@${weights.join(';')}`;
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(familySpec).replace(/%20/g, '+')}&display=swap`;
};

export const FontDetailsPage: React.FC<FontDetailsProps> = ({ font, onBack, toggleFavorite, isFavorite, toggleCompare, isCompare, testPairing, previewText }) => {
  const { t, language } = useLanguage();
  const runtime = useFontRuntimeStatus(font.id);
  const trust = useMemo(() => getFontTrustReport(font), [font]);
  const defaultWeight = font.weights.includes("400") ? "400" : (font.weights[0] || "400");
  const [tab, setTab] = useState<Tab>("specimen");
  const [text, setText] = useState(previewText || "The quick brown fox jumps over the lazy dog.");
  const [size, setSize] = useState(64);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [tracking, setTracking] = useState(0);
  const [align, setAlign] = useState<Align>("left");
  const [weight, setWeight] = useState(defaultWeight);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => setWeight(defaultWeight), [font.id, defaultWeight]);

  const pairing = useMemo(() => {
    const target = font.categories.includes("serif") ? "sans-serif" : "serif";
    const candidates = mockFonts.filter(f => f.id !== font.id && f.categories.includes(target));
    const seed = [...font.id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return candidates.length ? candidates[seed % candidates.length] : undefined;
  }, [font]);

  const related = useMemo(() => mockFonts
    .filter(f => f.id !== font.id && f.categories.some(category => font.categories.includes(category)))
    .slice(0, 6), [font]);

  const snippets = useMemo(() => {
    const cssImport = font.source === "Google Fonts"
      ? `@import url('${googleImportUrl(font)}');`
      : font.customCssUrl ? `@import url('${font.customCssUrl}');` : `/* Load ${font.name} from ${font.source} */`;
    return {
      import: cssImport,
      css: `font-family: ${font.cssStack};`,
      tailwind: `fontFamily: { custom: ['${font.name}', '${font.categories.includes("serif") ? "serif" : font.categories.includes("monospaced") ? "monospace" : "sans-serif"}'] }`,
    };
  }, [font]);

  const copy = async (key: string, value: string) => {
    if (!(await copyToClipboard(value))) return toast.error("Copy failed");
    setCopied(key);
    toast.success(t("card.cssCopied"));
    window.setTimeout(() => setCopied(null), 1400);
  };

  const openExternal = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{};:,.?";
  const pairingLabel = language === "ru" ? "Контрастное сочетание" : "Contrast suggestion";
  const sourceLabel = language === "ru" ? "Источник" : "Source";
  const derivedLabel = language === "ru" ? "ДАННЫЕ: ПРОИЗВОДНЫЕ" : "DATA: DERIVED";
  const curatedLabel = language === "ru" ? "ДАННЫЕ: КУРАТОРСКИЕ" : "DATA: CURATED";

  return (
    <div className="min-h-screen bg-white text-black">
      <FontLoader fonts={[font, pairing, ...related].filter(Boolean) as Font[]} />

      <div className="sticky top-16 z-50 h-16 bg-white border-b border-neutral-200 flex items-center">
        <button type="button" onClick={onBack} className="h-full px-5 md:px-7 border-r border-neutral-200 hover:bg-neutral-50 flex items-center gap-2"><ArrowLeft className="w-4 h-4"/><span className="hidden sm:inline font-mono text-[10px] uppercase tracking-widest">{t("details.back")}</span></button>
        <div className="flex-1 min-w-0 px-4 text-center font-mono text-[10px] uppercase tracking-widest text-neutral-400 truncate">{font.name} / {font.categories.join(" + ")}</div>
        <button type="button" onClick={() => toggleCompare(font.id)} className="h-full px-5 border-l border-neutral-200 hover:bg-neutral-50" aria-label={isCompare ? t("card.removeFromCompare") : t("card.addToCompare")}>{isCompare ? <Minus className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}</button>
        <button type="button" onClick={() => toggleFavorite(font.id)} className="h-full px-5 border-l border-neutral-200 hover:bg-neutral-50" aria-label={isFavorite ? t("card.removeFromFavorites") : t("card.addToFavorites")}><Heart className={cn("w-4 h-4", isFavorite && "fill-current")}/></button>
        {font.downloadUrl && <button type="button" onClick={() => openExternal(font.downloadUrl!)} className="h-full px-5 border-l border-neutral-200 hover:bg-neutral-50 hidden sm:flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest"><Download className="w-3.5 h-3.5"/>{t("details.download")}</button>}
        <button type="button" onClick={() => openExternal(font.sourceUrl)} className="h-full px-6 bg-neutral-900 text-white hover:bg-neutral-700 hidden sm:flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest"><ExternalLink className="w-3.5 h-3.5"/>{sourceLabel}</button>
      </div>

      {runtime.status === "error" && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3 flex items-start gap-3 text-red-700" role="status">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="font-mono text-[10px] uppercase tracking-wider leading-relaxed">
            {language === "ru" ? "Шрифт не загрузился. Превью сейчас показывает системный fallback, а не выбранную гарнитуру." : "The font failed to load. The preview is currently showing a system fallback, not the selected typeface."}
            {runtime.message && <span className="block opacity-60 normal-case tracking-normal mt-1">{runtime.message}</span>}
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-[320px_1fr] border-b border-neutral-200">
        <aside className="p-6 md:p-8 bg-neutral-50 border-b lg:border-b-0 lg:border-r border-neutral-200">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">TYPEFACE / {font.source}</div>
            <span className={cn("font-mono text-[8px] uppercase tracking-widest border px-1.5 py-1", trust.confidence === "derived" ? "border-amber-300 text-amber-700 bg-amber-50" : "border-neutral-300 text-neutral-500")}>{trust.confidence === "derived" ? derivedLabel : curatedLabel}</span>
          </div>
          <h1 className="text-5xl md:text-6xl tracking-tighter leading-[0.88] mb-8" style={{ fontFamily: font.cssStack, fontWeight: weight }}>{font.name}</h1>
          <dl className="font-mono text-[10px] uppercase tracking-wider space-y-3">
            {[[t("details.foundry"), font.author], [t("details.license"), trust.licenseLabel], [t("details.weights"), String(font.weights.length)], [t("details.source"), font.source]].map(([label,value]) => <div key={label} className="flex justify-between gap-4 border-b border-neutral-200 pb-2"><dt className="text-neutral-400">{label}</dt><dd className="text-right">{value}</dd></div>)}
          </dl>
          {trust.warnings.length > 0 && <div className="mt-6 border border-amber-200 bg-amber-50 p-3 space-y-2">{trust.warnings.map((warning, index) => <p key={index} className="font-mono text-[9px] leading-relaxed text-amber-800">{warning}</p>)}</div>}
          {pairing && <div className="mt-10 border border-neutral-200 bg-white p-4"><div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mb-3">{pairingLabel}</div><div className="text-2xl mb-1" style={{ fontFamily: pairing.cssStack }}>{pairing.name}</div><div className="font-mono text-[9px] uppercase text-neutral-400 mb-2">{pairing.author}</div><p className="font-mono text-[8px] leading-relaxed text-neutral-400 mb-4">{language === "ru" ? "Эвристика по контрасту категории; это пока не метрический анализ гарнитур." : "Category-contrast heuristic; this is not yet a metric typeface analysis."}</p>{testPairing && <button type="button" onClick={() => testPairing([font.id, pairing.id])} className="w-full border border-neutral-300 py-2 font-mono text-[9px] uppercase tracking-widest hover:bg-neutral-900 hover:text-white transition-colors">{language === "ru" ? "Открыть сочетание" : "Open pairing"}</button>}</div>}
        </aside>

        <div className="min-w-0">
          <nav className="h-14 border-b border-neutral-200 flex overflow-x-auto" role="tablist" aria-label={`${font.name} views`}>
            {(["specimen","glyphs","about"] as Tab[]).map(item => <button key={item} type="button" role="tab" aria-selected={tab === item} aria-controls={`font-panel-${item}`} id={`font-tab-${item}`} onClick={() => setTab(item)} className={cn("px-6 md:px-9 font-mono text-[10px] uppercase tracking-widest border-r border-neutral-200", tab === item ? "bg-neutral-900 text-white" : "hover:bg-neutral-50")}>{item === "specimen" ? t("details.lab") : item === "glyphs" ? t("details.glyphs") : t("details.about")}</button>)}
          </nav>

          {tab === "specimen" && <div id="font-panel-specimen" role="tabpanel" aria-labelledby="font-tab-specimen">
            <div className="p-4 border-b border-neutral-200 flex flex-wrap gap-5 items-center bg-neutral-50/50">
              <Control label={t("details.size")} value={size} min={16} max={180} step={1} onChange={setSize}/>
              <Control label={t("details.line")} value={lineHeight} min={0.8} max={2.2} step={0.1} onChange={setLineHeight}/>
              <Control label={t("details.track")} value={tracking} min={-0.1} max={0.4} step={0.01} onChange={setTracking}/>
              <label className="sr-only" htmlFor={`weight-${font.id}`}>Weight</label>
              <select id={`weight-${font.id}`} value={weight} disabled={runtime.status === "error"} onChange={e => setWeight(e.target.value)} className="h-9 border border-neutral-300 bg-white px-3 font-mono text-[10px] uppercase disabled:opacity-40">{font.weights.map(item => <option key={item} value={item}>{item}</option>)}</select>
              <div className="flex border border-neutral-300 ml-auto"><IconButton label="Align left" active={align === "left"} onClick={() => setAlign("left")}><AlignLeft className="w-3.5 h-3.5"/></IconButton><IconButton label="Align center" active={align === "center"} onClick={() => setAlign("center")}><AlignCenter className="w-3.5 h-3.5"/></IconButton><IconButton label="Align right" active={align === "right"} onClick={() => setAlign("right")}><AlignRight className="w-3.5 h-3.5"/></IconButton></div>
            </div>
            <div className="p-6 md:p-12 min-h-[55vh]"><textarea aria-label={`${font.name} specimen text`} value={text} onChange={e => setText(e.target.value)} className="w-full min-h-[40vh] resize-none bg-transparent outline-none" style={{ fontFamily: font.cssStack, fontSize: `${size}px`, lineHeight, letterSpacing: `${tracking}em`, textAlign: align, fontWeight: weight }}/></div>
            <div className="border-t border-neutral-200 p-6 md:p-12"><div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-8">{t("details.allWeights")}</div><div className="space-y-8">{font.weights.map(item => <button type="button" key={item} disabled={runtime.status === "error"} onClick={() => setWeight(item)} className="w-full text-left group disabled:opacity-40"><div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mb-2 group-hover:text-black">{item}</div><div className="text-4xl md:text-6xl leading-none break-words" style={{ fontFamily: font.cssStack, fontWeight: item }}>{font.name} {item}</div></button>)}</div></div>
          </div>}

          {tab === "glyphs" && <div id="font-panel-glyphs" role="tabpanel" aria-labelledby="font-tab-glyphs" className="p-6 md:p-12"><div className="mb-6 font-mono text-[9px] uppercase tracking-widest text-neutral-400">{language === "ru" ? "Демонстрационный набор символов — не подтверждённая карта покрытия шрифта" : "Sample character set — not a verified font coverage map"}</div><div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 xl:grid-cols-12 border-l border-t border-neutral-200">{[...chars].map((char,index) => <div key={`${char}-${index}`} className="aspect-square border-r border-b border-neutral-200 flex items-center justify-center text-2xl md:text-3xl hover:bg-neutral-900 hover:text-white transition-colors" style={{ fontFamily: font.cssStack, fontWeight: weight }}>{char === " " ? "·" : char}</div>)}</div></div>}

          {tab === "about" && <div id="font-panel-about" role="tabpanel" aria-labelledby="font-tab-about" className="p-6 md:p-12 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-12">
            <div><div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mb-5">001 / DESCRIPTION</div><p className="text-3xl md:text-5xl tracking-tight leading-[1.05] mb-12">{font.description}</p><div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mb-2">002 / {language === "ru" ? "ЕЩЁ В КАТЕГОРИИ" : "MORE IN CATEGORY"}</div><p className="font-mono text-[9px] text-neutral-400 mb-5">{language === "ru" ? "Это не семантические рекомендации: сейчас блок показывает другие гарнитуры той же широкой категории." : "These are not semantic recommendations yet; this block currently shows other families from the same broad category."}</p><div className="grid sm:grid-cols-2 gap-px bg-neutral-200 border border-neutral-200">{related.map(item => <div key={item.id} className="bg-white p-4"><div className="text-2xl" style={{ fontFamily: item.cssStack }}>{item.name}</div><div className="font-mono text-[9px] uppercase text-neutral-400 mt-2">{item.author}</div></div>)}</div></div>
            <div><div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mb-5">003 / CODE</div><div className="space-y-3">{Object.entries(snippets).map(([key,value]) => <div key={key} className="border border-neutral-200"><div className="flex justify-between items-center px-3 py-2 border-b border-neutral-200 font-mono text-[9px] uppercase"><span>{key}</span><button type="button" onClick={() => copy(key,value)} aria-label={`Copy ${key} snippet`}>{copied === key ? <Check className="w-3.5 h-3.5"/> : <Code className="w-3.5 h-3.5"/>}</button></div><pre className="p-3 overflow-auto text-[10px] whitespace-pre-wrap break-all">{value}</pre></div>)}</div><div className="mt-8 p-4 bg-neutral-50 border border-neutral-200 font-mono text-[10px] leading-relaxed">{trust.licenseLabel === "Verify at source" ? (language === "ru" ? "Точный идентификатор лицензии ещё не подтверждён в каталоге. Перед коммерческим использованием или распространением проверьте условия в первичном источнике." : "The exact license identifier has not yet been verified in the catalog. Check the upstream source before commercial delivery or redistribution.") : t("details.licenseDesc").replace("{license}", trust.licenseLabel)}</div></div>
          </div>}
        </div>
      </section>
    </div>
  );
};

const Control = ({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) => <label className="flex items-center gap-2 font-mono text-[9px] uppercase"><span className="text-neutral-400">{label}</span><input aria-label={label} type="range" value={value} min={min} max={max} step={step} onChange={e => onChange(Number(e.target.value))} className="w-20 h-px accent-black"/><span className="w-9 text-right">{Number.isInteger(value) ? value : value.toFixed(2)}</span></label>;
const IconButton = ({ active, onClick, children, label }: { active: boolean; onClick: () => void; children: React.ReactNode; label: string }) => <button type="button" aria-label={label} aria-pressed={active} onClick={onClick} className={cn("p-2 border-r last:border-r-0 border-neutral-300", active && "bg-neutral-900 text-white")}>{children}</button>;
