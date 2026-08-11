import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, AlignCenter, AlignLeft, AlignRight, ArrowLeft, Check, Code, Download, ExternalLink, Heart, Minus, Plus } from "lucide-react";
import { Font, mockFonts } from "@/data/mockFonts";
import { FontLoader } from "@/components/FontLoader";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { copyToClipboard } from "@/lib/clipboard";
import { useFontRuntimeStatus } from "@/lib/fontRuntime";
import { getEffectiveAuthor, getEffectiveCssStack, getEffectiveFamilyName, getEffectiveLanguages, getEffectiveSourceLabel, getEffectiveSourceUrl, getEffectiveWeights, getFontTrustReport, isEffectivelyVariable } from "@/lib/fontTrust";
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
  const weights = getEffectiveWeights(font).sort((a, b) => Number(a) - Number(b));
  let family = getEffectiveFamilyName(font);
  if (isEffectivelyVariable(font) && weights.length > 1) family += `:wght@${weights[0]}..${weights.at(-1)}`;
  else family += `:wght@${weights.join(";")}`;
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}&display=swap`;
};

export const FontDetailsPage: React.FC<FontDetailsProps> = ({ font, onBack, toggleFavorite, isFavorite, toggleCompare, isCompare, testPairing, previewText }) => {
  const { t, language } = useLanguage();
  const runtime = useFontRuntimeStatus(font.id);
  const trust = useMemo(() => getFontTrustReport(font), [font]);
  const weights = useMemo(() => getEffectiveWeights(font), [font]);
  const scripts = useMemo(() => getEffectiveLanguages(font), [font]);
  const familyName = getEffectiveFamilyName(font);
  const cssStack = getEffectiveCssStack(font);
  const author = getEffectiveAuthor(font);
  const sourceUrl = getEffectiveSourceUrl(font);
  const sourceLabel = getEffectiveSourceLabel(font);
  const variable = isEffectivelyVariable(font);
  const defaultWeight = weights.includes("400") ? "400" : weights[0] || "400";
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
    const candidates = mockFonts.filter(item => item.id !== font.id && item.categories.includes(target));
    const seed = [...font.id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return candidates.length ? candidates[seed % candidates.length] : undefined;
  }, [font]);

  const related = useMemo(() => mockFonts.filter(item => item.id !== font.id && item.categories.some(category => font.categories.includes(category))).slice(0, 6), [font]);
  const snippets = useMemo(() => ({
    import: sourceLabel === "Google Fonts" ? `@import url('${googleImportUrl(font)}');` : font.customCssUrl ? `@import url('${font.customCssUrl}');` : `/* Load ${familyName} from its verified source: ${sourceUrl} */`,
    css: `font-family: ${cssStack};`,
  }), [font, familyName, cssStack, sourceLabel, sourceUrl]);

  const copy = async (key: string, value: string) => {
    if (!(await copyToClipboard(value))) return toast.error("Copy failed");
    setCopied(key);
    toast.success(t("card.cssCopied"));
    window.setTimeout(() => setCopied(null), 1400);
  };

  const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const pending = language === "ru" ? "Проверяется" : "Pending";
  const weightsValue = trust.weightsVerified ? String(weights.length) : pending;
  const variableValue = trust.variableVerified ? (variable ? (language === "ru" ? "Да" : "Yes") : (language === "ru" ? "Нет" : "No")) : pending;
  const scriptsValue = trust.scriptsVerified ? (scripts.join(", ") || "—") : pending;
  const overallStatus = trust.identityVerified && trust.licenseVerified
    ? { label: "SOURCE + LICENSE VERIFIED", className: "border-emerald-300 text-emerald-700 bg-emerald-50" }
    : trust.identityVerified
      ? { label: "SOURCE VERIFIED / LICENSE?", className: "border-amber-300 text-amber-700 bg-amber-50" }
      : { label: "SOURCE?", className: "border-amber-300 text-amber-700 bg-amber-50" };
  const showLegacyDownload = Boolean(font.downloadUrl && trust.identityVerified && trust.licenseVerified && trust.provider !== "Fontshare");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{};:,.?";

  return <div className="min-h-screen bg-white text-black">
    <FontLoader fonts={[font, pairing, ...related].filter(Boolean) as Font[]} />

    <div className="sticky top-16 z-50 h-16 bg-white border-b border-neutral-200 flex items-center">
      <button type="button" onClick={onBack} className="h-full px-5 md:px-7 border-r border-neutral-200 hover:bg-neutral-50 flex items-center gap-2"><ArrowLeft className="w-4 h-4"/><span className="hidden sm:inline font-mono text-[10px] uppercase tracking-widest">{t("details.back")}</span></button>
      <div className="flex-1 min-w-0 px-4 text-center font-mono text-[10px] uppercase tracking-widest text-neutral-400 truncate">{familyName} / {font.categories.join(" + ")}</div>
      <button type="button" onClick={() => toggleCompare(font.id)} className="h-full px-5 border-l border-neutral-200" aria-label={isCompare ? t("card.removeFromCompare") : t("card.addToCompare")}>{isCompare ? <Minus className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}</button>
      <button type="button" onClick={() => toggleFavorite(font.id)} className="h-full px-5 border-l border-neutral-200" aria-label={isFavorite ? t("card.removeFromFavorites") : t("card.addToFavorites")}><Heart className={cn("w-4 h-4", isFavorite && "fill-current")}/></button>
      {showLegacyDownload && <button type="button" onClick={() => open(font.downloadUrl!)} className="h-full px-5 border-l border-neutral-200 hidden sm:flex items-center gap-2 font-mono text-[10px] uppercase"><Download className="w-3.5 h-3.5"/>{t("details.download")}</button>}
      <button type="button" onClick={() => open(sourceUrl)} className="h-full px-6 bg-neutral-900 text-white hidden sm:flex items-center gap-2 font-mono text-[10px] uppercase"><ExternalLink className="w-3.5 h-3.5"/>{language === "ru" ? "Источник" : "Source"}</button>
    </div>

    {runtime.status === "error" && <div role="status" className="border-b border-red-200 bg-red-50 px-6 py-3 flex gap-3 text-red-700"><AlertTriangle className="w-4 h-4 shrink-0"/><p className="font-mono text-[10px] uppercase leading-relaxed">{language === "ru" ? "Шрифт не загрузился: показан системный fallback." : "Font failed to load: preview is showing a system fallback."}</p></div>}

    <section className="grid grid-cols-1 lg:grid-cols-[320px_1fr] border-b border-neutral-200">
      <aside className="p-6 md:p-8 bg-neutral-50 border-b lg:border-b-0 lg:border-r border-neutral-200">
        <div className="flex items-center justify-between gap-3 mb-5"><span className="font-mono text-[9px] uppercase text-neutral-400">TYPEFACE / {sourceLabel}</span><span title={trust.verificationSource} className={cn("font-mono text-[8px] uppercase border px-1.5 py-1", overallStatus.className)}>{overallStatus.label}</span></div>
        <h1 className="text-5xl md:text-6xl tracking-tighter leading-[0.88] mb-8" style={{ fontFamily: cssStack, fontWeight: weight }}>{familyName}</h1>
        <dl className="font-mono text-[10px] uppercase tracking-wider space-y-3">
          {[[t("details.foundry"), author], [t("details.license"), trust.licenseLabel], [t("details.weights"), weightsValue], [language === "ru" ? "Вариативность" : "Variable", variableValue], [t("filters.languages"), scriptsValue], [t("details.source"), sourceLabel]].map(([label,value]) => <div key={label} className="flex justify-between gap-4 border-b border-neutral-200 pb-2"><dt className="text-neutral-400">{label}</dt><dd className="text-right">{value}</dd></div>)}
        </dl>
        <div className="mt-5 flex flex-wrap gap-1.5 font-mono text-[8px] uppercase">
          <span className={cn("border px-1.5 py-1", trust.identityVerified ? "border-emerald-200 text-emerald-700" : "border-amber-200 text-amber-700")}>SOURCE {trust.identityVerified ? "✓" : "?"}</span>
          <span className={cn("border px-1.5 py-1", trust.licenseVerified ? "border-emerald-200 text-emerald-700" : "border-amber-200 text-amber-700")}>LICENSE {trust.licenseVerified ? "✓" : "?"}</span>
          <span className={cn("border px-1.5 py-1", trust.weightsVerified ? "border-emerald-200 text-emerald-700" : "border-amber-200 text-amber-700")}>WEIGHTS {trust.weightsVerified ? "✓" : "?"}</span>
          <span className={cn("border px-1.5 py-1", trust.variableVerified ? "border-emerald-200 text-emerald-700" : "border-amber-200 text-amber-700")}>VARIABLE {trust.variableVerified ? "✓" : "?"}</span>
          <span className={cn("border px-1.5 py-1", trust.scriptsVerified ? "border-emerald-200 text-emerald-700" : "border-amber-200 text-amber-700")}>SCRIPTS {trust.scriptsVerified ? "✓" : "?"}</span>
        </div>
        {trust.warnings.length > 0 && <div className="mt-6 border border-amber-200 bg-amber-50 p-3 space-y-2">{trust.warnings.map((warning, i) => <p key={i} className="font-mono text-[9px] leading-relaxed text-amber-800">{warning}</p>)}</div>}
        {pairing && <div className="mt-10 border border-neutral-200 bg-white p-4"><div className="font-mono text-[9px] uppercase text-neutral-400 mb-3">{language === "ru" ? "Контрастное сочетание" : "Contrast suggestion"}</div><div className="text-2xl mb-1" style={{ fontFamily: getEffectiveCssStack(pairing) }}>{getEffectiveFamilyName(pairing)}</div><p className="font-mono text-[8px] text-neutral-400 mb-4">{language === "ru" ? "Эвристика категории, не метрический анализ." : "Category heuristic, not metric analysis."}</p>{testPairing && <button type="button" onClick={() => testPairing([font.id, pairing.id])} className="w-full border border-neutral-300 py-2 font-mono text-[9px] uppercase">{language === "ru" ? "Открыть" : "Open pairing"}</button>}</div>}
      </aside>

      <div className="min-w-0">
        <nav className="h-14 border-b border-neutral-200 flex overflow-x-auto" role="tablist">{(["specimen","glyphs","about"] as Tab[]).map(item => <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={cn("px-6 md:px-9 font-mono text-[10px] uppercase border-r border-neutral-200", tab === item ? "bg-neutral-900 text-white" : "hover:bg-neutral-50")}>{item === "specimen" ? t("details.lab") : item === "glyphs" ? t("details.glyphs") : t("details.about")}</button>)}</nav>

        {tab === "specimen" && <div role="tabpanel">
          <div className="p-4 border-b border-neutral-200 flex flex-wrap gap-5 items-center bg-neutral-50/50"><Control label={t("details.size")} value={size} min={16} max={180} step={1} onChange={setSize}/><Control label={t("details.line")} value={lineHeight} min={0.8} max={2.2} step={0.1} onChange={setLineHeight}/><Control label={t("details.track")} value={tracking} min={-0.1} max={0.4} step={0.01} onChange={setTracking}/><select aria-label="Weight" value={weight} disabled={runtime.status === "error" || !trust.weightsVerified || weights.length < 2} onChange={e => setWeight(e.target.value)} className="h-9 border border-neutral-300 bg-white px-3 font-mono text-[10px] uppercase disabled:opacity-40">{weights.map(item => <option key={item}>{item}</option>)}</select>{!trust.weightsVerified && <span className="font-mono text-[8px] uppercase text-amber-700 border border-amber-200 bg-amber-50 px-2 py-1">400 ONLY / WEIGHTS PENDING</span>}<div className="flex border border-neutral-300 ml-auto"><IconButton label="Align left" active={align === "left"} onClick={() => setAlign("left")}><AlignLeft className="w-3.5 h-3.5"/></IconButton><IconButton label="Align center" active={align === "center"} onClick={() => setAlign("center")}><AlignCenter className="w-3.5 h-3.5"/></IconButton><IconButton label="Align right" active={align === "right"} onClick={() => setAlign("right")}><AlignRight className="w-3.5 h-3.5"/></IconButton></div></div>
          <div className="p-6 md:p-12 min-h-[55vh]"><textarea aria-label={`${familyName} specimen`} value={text} onChange={e => setText(e.target.value)} className="w-full min-h-[40vh] resize-none bg-transparent outline-none" style={{ fontFamily: cssStack, fontSize: `${size}px`, lineHeight, letterSpacing: `${tracking}em`, textAlign: align, fontWeight: weight }}/></div>
          <div className="border-t border-neutral-200 p-6 md:p-12"><div className="font-mono text-[10px] uppercase text-neutral-400 mb-8">{trust.weightsVerified ? t("details.allWeights") : "CONSERVATIVE PREVIEW WEIGHT"}</div><div className="space-y-8">{weights.map(item => <button type="button" key={item} onClick={() => trust.weightsVerified && setWeight(item)} disabled={!trust.weightsVerified} className="w-full text-left disabled:cursor-default"><span className="font-mono text-[9px] text-neutral-400">{item}</span><div className="text-4xl md:text-6xl leading-none" style={{ fontFamily: cssStack, fontWeight: item }}>{familyName} {item}</div></button>)}</div></div>
        </div>}

        {tab === "glyphs" && <div role="tabpanel" className="p-6 md:p-12"><p className="mb-6 font-mono text-[9px] uppercase text-neutral-400">{language === "ru" ? "Демо-набор символов. Фактическое script-покрытие учитывается отдельно из cmap, но эта сетка не является полной картой глифов." : "Sample character set. Factual script coverage is tracked separately from cmap, but this grid is not a complete glyph map."}</p><div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 xl:grid-cols-12 border-l border-t border-neutral-200">{[...chars].map((char,i) => <div key={`${char}-${i}`} className="aspect-square border-r border-b border-neutral-200 flex items-center justify-center text-2xl" style={{ fontFamily: cssStack, fontWeight: weight }}>{char}</div>)}</div></div>}

        {tab === "about" && <div role="tabpanel" className="p-6 md:p-12 grid xl:grid-cols-[1fr_360px] gap-12"><div><p className="text-3xl md:text-5xl tracking-tight leading-[1.05] mb-12">{font.description}</p><div className="font-mono text-[9px] uppercase text-neutral-400 mb-2">{language === "ru" ? "ЕЩЁ В КАТЕГОРИИ" : "MORE IN CATEGORY"}</div><p className="font-mono text-[9px] text-neutral-400 mb-5">{language === "ru" ? "Не семантические рекомендации: только та же широкая категория." : "Not semantic recommendations: same broad category only."}</p><div className="grid sm:grid-cols-2 gap-px bg-neutral-200">{related.map(item => <div key={item.id} className="bg-white p-4"><div className="text-2xl" style={{ fontFamily: getEffectiveCssStack(item) }}>{getEffectiveFamilyName(item)}</div><div className="font-mono text-[9px] text-neutral-400 mt-2">{getEffectiveAuthor(item)}</div></div>)}</div></div><div><div className="font-mono text-[9px] uppercase text-neutral-400 mb-5">CODE</div><div className="space-y-3">{Object.entries(snippets).map(([key,value]) => <div key={key} className="border border-neutral-200"><div className="flex justify-between px-3 py-2 border-b border-neutral-200 font-mono text-[9px] uppercase"><span>{key}</span><button type="button" onClick={() => copy(key,value)} aria-label={`Copy ${key}`}>{copied === key ? <Check className="w-3.5 h-3.5"/> : <Code className="w-3.5 h-3.5"/>}</button></div><pre className="p-3 overflow-auto text-[10px] whitespace-pre-wrap break-all">{value}</pre></div>)}</div></div></div>}
      </div>
    </section>
  </div>;
};

const Control = ({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) => <label className="flex items-center gap-2 font-mono text-[9px] uppercase"><span className="text-neutral-400">{label}</span><input aria-label={label} type="range" value={value} min={min} max={max} step={step} onChange={e => onChange(Number(e.target.value))} className="w-20 h-px accent-black"/><span className="w-9 text-right">{Number.isInteger(value) ? value : value.toFixed(2)}</span></label>;
const IconButton = ({ active, onClick, children, label }: { active: boolean; onClick: () => void; children: React.ReactNode; label: string }) => <button type="button" aria-label={label} aria-pressed={active} onClick={onClick} className={cn("p-2 border-r last:border-r-0 border-neutral-300", active && "bg-neutral-900 text-white")}>{children}</button>;
