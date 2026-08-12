import React, { useEffect, useMemo, useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, ArrowLeft, Check, Code, Download, ExternalLink, Heart, Layers } from "lucide-react";
import { Font } from "@/data/mockFonts";
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

type Tab = "specimen" | "glyphs" | "info";
type Align = "left" | "center" | "right";

const googleImportUrl = (font: Font) => {
  const weights = getEffectiveWeights(font).sort((a, b) => Number(a) - Number(b));
  let family = getEffectiveFamilyName(font);
  if (isEffectivelyVariable(font) && weights.length > 1) family += `:wght@${weights[0]}..${weights.at(-1)}`;
  else family += `:wght@${weights.join(";")}`;
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}&display=swap`;
};

export const FontDetailsPage: React.FC<FontDetailsProps> = ({ font, onBack, toggleFavorite, isFavorite, testPairing, previewText }) => {
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
  const [text, setText] = useState(previewText || (language === "ru" ? "Съешь ещё этих мягких французских булок." : "The quick brown fox jumps over the lazy dog."));
  const [size, setSize] = useState(64);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [tracking, setTracking] = useState(0);
  const [align, setAlign] = useState<Align>("left");
  const [weight, setWeight] = useState(defaultWeight);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => setWeight(defaultWeight), [font.id, defaultWeight]);

  const snippets = useMemo(() => ({
    import: sourceLabel === "Google Fonts" ? `@import url('${googleImportUrl(font)}');` : font.customCssUrl ? `@import url('${font.customCssUrl}');` : `/* Load ${familyName} from ${sourceUrl} */`,
    css: `font-family: ${cssStack};`,
  }), [font, familyName, cssStack, sourceLabel, sourceUrl]);

  const copy = async (key: string, value: string) => {
    if (!(await copyToClipboard(value))) return toast.error("Copy failed");
    setCopied(key);
    toast.info(t("card.cssCopied"));
    window.setTimeout(() => setCopied(null), 1400);
  };

  const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const showDownload = Boolean(font.downloadUrl && trust.identityVerified && trust.licenseVerified && trust.provider !== "Fontshare");
  const statusLabel = trust.identityVerified && trust.licenseVerified
    ? (language === "ru" ? "Источник и лицензия проверены" : "Source and license verified")
    : trust.identityVerified
      ? (language === "ru" ? "Источник проверен, лицензия уточняется" : "Source verified, license pending")
      : (language === "ru" ? "Метаданные требуют проверки" : "Metadata review pending");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{};:,.?";

  return (
    <div className="min-h-screen bg-white text-black">
      <FontLoader fonts={[font]} />

      <div className="sticky top-16 z-40 h-16 bg-white/95 backdrop-blur-md border-b border-neutral-200 flex items-center">
        <button type="button" onClick={onBack} className="h-full px-5 md:px-6 border-r border-neutral-200 flex items-center gap-2 text-neutral-500 hover:text-black hover:bg-neutral-50 transition-colors"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline text-sm">{t("details.back")}</span></button>
        <div className="flex-1 min-w-0 px-4 md:px-6 truncate text-sm font-medium">{familyName}</div>
        <button type="button" onClick={() => toggleFavorite(font.id)} className="h-full px-5 border-l border-neutral-200 flex items-center gap-2 hover:bg-neutral-50" aria-label={isFavorite ? t("card.removeFromFavorites") : t("card.addToFavorites")}><Heart className={cn("w-4 h-4", isFavorite && "fill-current")} /><span className="hidden md:inline text-sm">{t('nav.favorites')}</span></button>
        {testPairing && <button type="button" onClick={() => testPairing([font.id])} className="h-full px-5 border-l border-neutral-200 bg-neutral-900 text-white flex items-center gap-2 hover:bg-neutral-700"><Layers className="w-4 h-4" /><span className="hidden md:inline text-sm">Workbench</span></button>}
      </div>

      {runtime.status === "error" && <div role="status" className="border-b border-neutral-200 bg-neutral-50 px-5 md:px-8 py-3 text-sm text-neutral-600">{language === "ru" ? "Шрифт не загрузился — показан системный fallback." : "Font failed to load — preview is showing a system fallback."}</div>}

      <section className="border-b border-neutral-200 grid lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.8fr)]">
        <div className="p-6 md:p-10 lg:p-12 bg-neutral-50 lg:border-r border-neutral-200 flex flex-col justify-between gap-10">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">{font.categories.slice(0, 2).join(" · ") || "Typeface"}</div>
            <h1 className="mt-5 text-5xl md:text-7xl tracking-tighter leading-[0.9] break-words" style={{ fontFamily: cssStack, fontWeight: weight }}>{familyName}</h1>
            <p className="mt-5 text-sm text-neutral-500">{author}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">{sourceLabel}</span>
            {variable && <span className="px-2 py-1 bg-neutral-900 text-white font-mono text-[8px] uppercase">Variable</span>}
          </div>
        </div>
        <div className="p-6 md:p-10 lg:p-12 min-h-[320px] flex items-center justify-center overflow-hidden">
          <p className="w-full text-center break-words leading-tight" style={{ fontFamily: cssStack, fontWeight: weight, fontSize: "clamp(3rem, 9vw, 8rem)" }}>{previewText || familyName}</p>
        </div>
      </section>

      <nav className="sticky top-32 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-neutral-200 flex overflow-x-auto" role="tablist">
        {(["specimen", "glyphs", "info"] as Tab[]).map(item => <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={cn("px-6 md:px-8 h-full border-r border-neutral-200 font-mono text-[9px] uppercase tracking-widest", tab === item ? "bg-neutral-900 text-white" : "hover:bg-neutral-50")}>{item === "specimen" ? t("details.lab") : item === "glyphs" ? t("details.glyphs") : (language === "ru" ? "Информация" : "Info")}</button>)}
      </nav>

      {tab === "specimen" && <section role="tabpanel">
        <div className="p-4 md:px-6 border-b border-neutral-200 flex flex-wrap items-center gap-4 bg-neutral-50/60">
          <Control label={t("details.size")} value={size} min={16} max={180} step={1} onChange={setSize} />
          <Control label={t("details.line")} value={lineHeight} min={0.8} max={2.2} step={0.1} onChange={setLineHeight} />
          <Control label={t("details.track")} value={tracking} min={-0.1} max={0.4} step={0.01} onChange={setTracking} />
          <label className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">Weight<select aria-label="Weight" value={weight} disabled={runtime.status === "error" || !trust.weightsVerified || weights.length < 2} onChange={event => setWeight(event.target.value)} className="ml-2 h-9 border border-neutral-300 bg-white px-3 text-[10px] disabled:opacity-40">{weights.map(item => <option key={item}>{item}</option>)}</select></label>
          <div className="flex border border-neutral-300 md:ml-auto"><IconButton label="Align left" active={align === "left"} onClick={() => setAlign("left")}><AlignLeft className="w-3.5 h-3.5" /></IconButton><IconButton label="Align center" active={align === "center"} onClick={() => setAlign("center")}><AlignCenter className="w-3.5 h-3.5" /></IconButton><IconButton label="Align right" active={align === "right"} onClick={() => setAlign("right")}><AlignRight className="w-3.5 h-3.5" /></IconButton></div>
        </div>
        <div className="p-6 md:p-10 lg:p-14 min-h-[52vh]"><textarea aria-label={`${familyName} specimen`} value={text} onChange={event => setText(event.target.value)} className="w-full min-h-[42vh] resize-none bg-transparent outline-none" style={{ fontFamily: cssStack, fontSize: `${size}px`, lineHeight, letterSpacing: `${tracking}em`, textAlign: align, fontWeight: weight }} /></div>
        <div className="border-t border-neutral-200 p-6 md:p-10 lg:p-14"><div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mb-8">{trust.weightsVerified ? t("details.allWeights") : (language === "ru" ? "Доступный вес" : "Available weight")}</div><div className="space-y-7">{weights.map(item => <button type="button" key={item} onClick={() => trust.weightsVerified && setWeight(item)} disabled={!trust.weightsVerified} className="w-full text-left disabled:cursor-default"><span className="font-mono text-[9px] text-neutral-400">{item}</span><div className="mt-2 text-3xl md:text-5xl truncate" style={{ fontFamily: cssStack, fontWeight: item }}>{familyName}</div></button>)}</div></div>
      </section>}

      {tab === "glyphs" && <section role="tabpanel" className="p-6 md:p-10 lg:p-14"><div className="max-w-6xl"><div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mb-3">{language === "ru" ? "Набор для визуальной проверки" : "Visual sample set"}</div><p className="max-w-xl text-sm text-neutral-500 mb-10">{language === "ru" ? "Это не заявленная полная cmap-поддержка, а практический образец символов для просмотра формы." : "This is a practical shape sample, not a claim of complete cmap coverage."}</p><div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 border-t border-l border-neutral-200">{Array.from(chars).map((char, index) => <div key={`${char}-${index}`} className="aspect-square border-r border-b border-neutral-200 flex items-center justify-center text-2xl" style={{ fontFamily: cssStack, fontWeight: weight }}>{char}</div>)}</div></div></section>}

      {tab === "info" && <section role="tabpanel" className="p-6 md:p-10 lg:p-14"><div className="max-w-6xl grid lg:grid-cols-2 gap-10 lg:gap-16">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{language === "ru" ? "О гарнитуре" : "Typeface information"}</h2>
          <dl className="mt-6 border-t border-neutral-200">
            <InfoRow label={t("details.foundry")} value={author} />
            <InfoRow label={t("details.license")} value={trust.licenseLabel} />
            <InfoRow label={t("details.weights")} value={trust.weightsVerified ? weights.join(", ") : (language === "ru" ? "Проверяется" : "Pending")} />
            <InfoRow label={language === "ru" ? "Variable" : "Variable"} value={trust.variableVerified ? (variable ? "Yes" : "No") : (language === "ru" ? "Проверяется" : "Pending")} />
            <InfoRow label={t("filters.languages")} value={trust.scriptsVerified ? (scripts.join(", ") || "—") : (language === "ru" ? "Проверяется" : "Pending")} />
            <InfoRow label={t("details.source")} value={sourceLabel} />
          </dl>
          <div className="mt-8 border border-neutral-200 p-4"><div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">{language === "ru" ? "Достоверность данных" : "Data confidence"}</div><div className="mt-2 text-sm font-medium">{statusLabel}</div>{trust.warnings.length > 0 && <div className="mt-4 space-y-2">{trust.warnings.map((warning, index) => <p key={index} className="text-xs leading-relaxed text-neutral-500">{warning}</p>)}</div>}</div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{language === "ru" ? "Использование" : "Use"}</h2>
          <div className="mt-6 space-y-3">
            <Snippet label="CSS" value={snippets.css} copied={copied === "css"} onCopy={() => copy("css", snippets.css)} />
            <Snippet label="Import" value={snippets.import} copied={copied === "import"} onCopy={() => copy("import", snippets.import)} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" onClick={() => open(sourceUrl)} className="px-4 py-2.5 bg-neutral-900 text-white text-sm inline-flex items-center gap-2 hover:bg-neutral-700"><ExternalLink className="w-3.5 h-3.5" />{language === "ru" ? "Источник" : "Source"}</button>
            {showDownload && <button type="button" onClick={() => open(font.downloadUrl!)} className="px-4 py-2.5 border border-neutral-300 text-sm inline-flex items-center gap-2 hover:bg-neutral-50"><Download className="w-3.5 h-3.5" />{t("details.download")}</button>}
          </div>
        </div>
      </div></section>}
    </div>
  );
};

const Control = ({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) => (
  <label className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-neutral-500"><span>{label}</span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} className="w-20 md:w-28 h-px bg-black appearance-none cursor-pointer accent-black" /><span className="w-10 text-right tabular-nums">{Number(value.toFixed(2))}</span></label>
);

const IconButton = ({ label, active, onClick, children }: { label: string; active: boolean; onClick: () => void; children: React.ReactNode }) => <button type="button" aria-label={label} aria-pressed={active} onClick={onClick} className={cn("w-9 h-9 flex items-center justify-center border-r last:border-r-0 border-neutral-300", active ? "bg-neutral-900 text-white" : "bg-white hover:bg-neutral-100")}>{children}</button>;
const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 py-3 border-b border-neutral-200 text-sm"><dt className="text-neutral-400">{label}</dt><dd className="text-right break-words">{value}</dd></div>;
const Snippet = ({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) => <div className="border border-neutral-200 bg-neutral-50 p-4"><div className="flex items-center justify-between gap-3 mb-3"><span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">{label}</span><button type="button" onClick={onCopy} className="w-7 h-7 flex items-center justify-center border border-neutral-200 bg-white hover:bg-neutral-100" aria-label={`Copy ${label}`}>{copied ? <Check className="w-3 h-3" /> : <Code className="w-3 h-3" />}</button></div><code className="text-xs break-all">{value}</code></div>;
