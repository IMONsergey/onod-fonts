import React, { useState, memo } from "react";
import { Font } from "@/data/mockFonts";
import { Heart, Download, Check, Plus, Code, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";
import { useFontRuntimeStatus } from "@/lib/fontRuntime";
import { getEffectiveAuthor, getEffectiveLanguages, getEffectiveSourceUrl, getEffectiveWeights, getFontTrustReport, isEffectivelyVariable } from "@/lib/fontTrust";

interface FontCardProps {
  font: Font;
  previewText: string;
  isFavorite: boolean;
  isCompared: boolean;
  layout?: "grid" | "list";
  fontSize: number;
  letterSpacing: number;
  onToggleFavorite: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export const FontCard: React.FC<FontCardProps> = memo(({
  font,
  previewText,
  isFavorite,
  isCompared,
  layout = "list",
  fontSize,
  letterSpacing,
  onToggleFavorite,
  onToggleCompare,
  onViewDetails,
}) => {
  const { t, language } = useLanguage();
  const runtime = useFontRuntimeStatus(font.id);
  const trust = getFontTrustReport(font);
  const effectiveWeights = getEffectiveWeights(font);
  const effectiveVariable = isEffectivelyVariable(font);
  const effectiveLanguages = getEffectiveLanguages(font);
  const effectiveAuthor = getEffectiveAuthor(font);
  const effectiveSourceUrl = getEffectiveSourceUrl(font);
  const defaultWeight = effectiveWeights.includes("400") ? 400 : Number(effectiveWeights[0] || 400);
  const [localWeight, setLocalWeight] = useState(defaultWeight);
  const [cssCopied, setCssCopied] = useState(false);

  const style = {
    fontFamily: font.cssStack,
    fontWeight: effectiveVariable ? localWeight : defaultWeight,
    fontSize: `${fontSize}px`,
    letterSpacing: `${letterSpacing}em`,
  };

  const displayPreview = previewText || font.name;
  const runtimeBadge = runtime.status === "error"
    ? { label: "FALLBACK", className: "border-red-300 text-red-600" }
    : runtime.status === "loading"
      ? { label: "LOADING", className: "border-neutral-300 text-neutral-400" }
      : null;

  const copyCss = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await copyToClipboard(`font-family: ${font.cssStack};`);
    if (ok) {
      setCssCopied(true);
      toast.success(t('card.cssCopied'));
      setTimeout(() => setCssCopied(false), 2000);
    } else toast.error('Copy failed');
  };

  const openExternal = (url: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const MetadataBadges = ({ compact = false }: { compact?: boolean }) => (
    <div className="flex gap-1 items-center">
      {runtimeBadge && <span title={runtime.message} className={cn("font-mono uppercase border px-1 py-0.5", compact ? "text-[7px]" : "text-[8px]", runtimeBadge.className)}>{runtimeBadge.label}</span>}
      {trust.upstreamVerified && <span title={trust.verificationSource} className={cn("font-mono uppercase border border-emerald-300 text-emerald-700 bg-emerald-50 px-1 py-0.5", compact ? "text-[7px]" : "text-[8px]")}>VERIFIED</span>}
      {trust.confidence === "derived" && <span title={language === 'ru' ? 'Метаданные ещё не подтверждены по первичному источнику' : 'Metadata has not yet been verified against the upstream source'} className={cn("font-mono uppercase border border-amber-300 text-amber-700 bg-amber-50 px-1 py-0.5", compact ? "text-[7px]" : "text-[8px]")}>META?</span>}
      {effectiveLanguages.includes("Cyrillic") && <span className={cn("font-mono uppercase border border-neutral-300 px-1 pt-0.5", compact ? "text-[8px]" : "text-[9px]")}>{trust.confidence === "derived" ? "CYR?" : "CYR"}</span>}
      {effectiveVariable && <span className={cn("font-mono uppercase bg-neutral-800 text-white px-1 pt-0.5", compact ? "text-[8px]" : "text-[9px]")}>VAR</span>}
    </div>
  );

  if (layout === "list") {
    return (
      <article className="group border-b border-neutral-200 bg-white min-h-[300px] flex flex-col md:flex-row transition-colors hover:bg-neutral-50">
        <div className="w-full md:w-72 flex-shrink-0 p-4 md:p-6 border-r border-neutral-200 flex flex-col justify-between relative">
          <div>
            <div className="flex items-center justify-between mb-4 gap-2">
              <span className="font-mono text-[10px] uppercase tracking-tighter text-neutral-500">ID: {(font.id.split('-')[1] || font.id).substring(0, 4).padStart(3, '0')}</span>
              <MetadataBadges />
            </div>

            <button type="button" className="block text-left text-xl md:text-3xl tracking-tighter leading-none mb-1 hover:underline decoration-2 underline-offset-4" onClick={() => onViewDetails(font.id)} style={{ fontWeight: 700 }}>{font.name}</button>
            <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-wide mb-1">{effectiveAuthor}</p>
            <p className="font-mono text-[9px] text-neutral-400 uppercase tracking-wide mb-6">{font.source}</p>

            <div className={cn("space-y-6 transition-opacity duration-300", runtime.status === "error" ? "opacity-30" : "opacity-20 group-hover:opacity-100")}>
              {effectiveVariable && (
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-[9px] uppercase"><span>Wt</span><span>{localWeight}</span></div>
                  <input type="range" min={Number(effectiveWeights[0] || 100)} max={Number(effectiveWeights[effectiveWeights.length - 1] || 900)} step="100" value={localWeight} disabled={runtime.status === "error"} onChange={(e) => setLocalWeight(Number(e.target.value))} aria-label={`${font.name} weight`} className="w-full h-px bg-black appearance-none cursor-pointer accent-black disabled:cursor-not-allowed" />
                </div>
              )}
              <div className="font-mono text-[9px] uppercase text-neutral-400">{trust.confidence === "derived" ? (language === 'ru' ? 'Метрики проверяются' : 'Metrics pending') : `${effectiveWeights.length} ${t('styles.available')}`}</div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-neutral-200 mt-auto">
            <button type="button" onClick={(e) => { e.stopPropagation(); onToggleFavorite(font.id); }} className="hover:opacity-50 transition-opacity" aria-label={isFavorite ? t('card.removeFromFavorites') : t('card.addToFavorites')}><Heart className={cn("w-4 h-4", isFavorite ? "fill-black" : "stroke-black")} /></button>
            <button type="button" onClick={(e) => { e.stopPropagation(); onToggleCompare(font.id); }} className="hover:opacity-50 transition-opacity flex items-center gap-1 group/btn" aria-label={isCompared ? t('card.removeFromCompare') : t('card.addToCompare')}>{isCompared ? <span className="bg-neutral-800 text-white p-0.5"><Check className="w-3 h-3" /></span> : <Plus className="w-4 h-4 stroke-black group-hover/btn:stroke-neutral-500" />}<span className="font-mono text-[9px] uppercase hidden group-hover/btn:inline">{isCompared ? t('card.inStack') : t('card.addToStack')}</span></button>
            <button type="button" onClick={copyCss} className="hover:opacity-50 transition-opacity" title="Copy CSS" aria-label="Copy CSS">{cssCopied ? <Check className="w-4 h-4 text-green-600" /> : <Code className="w-4 h-4 stroke-neutral-400" />}</button>
            {font.downloadUrl && <button type="button" onClick={(e) => openExternal(font.downloadUrl!, e)} className="hover:opacity-50 transition-opacity ml-auto" aria-label={t('details.download')}><Download className="w-4 h-4 stroke-black" /></button>}
            <button type="button" onClick={(e) => openExternal(effectiveSourceUrl, e)} className={cn("hover:opacity-50 transition-opacity", !font.downloadUrl && "ml-auto")} aria-label="Open source"><ExternalLink className="w-4 h-4 stroke-black" /></button>
          </div>
        </div>

        <button type="button" className="flex-grow flex flex-col relative p-4 md:p-6 group-hover:bg-neutral-50/50 transition-colors overflow-hidden text-left" onClick={() => onViewDetails(font.id)} aria-label={`Open ${font.name} details`}>
          <div className="absolute top-2 right-2 font-mono text-[9px] text-neutral-300 uppercase">+ Preview</div>
          <div className="flex-grow flex items-center justify-center overflow-hidden w-full"><p className="text-black leading-tight text-center break-words w-full transition-all duration-200" style={style}>{displayPreview}</p></div>
          {runtime.status === "error" && <div className="absolute bottom-3 left-4 right-4 font-mono text-[8px] uppercase tracking-widest text-red-500 text-center">Font unavailable — showing fallback</div>}
        </button>
      </article>
    );
  }

  return (
    <article className="group bg-white border-b border-r border-neutral-200 flex flex-col h-[350px] relative hover:bg-neutral-50 transition-colors">
      <div className="p-3 flex justify-between items-start border-b border-neutral-100 gap-2">
        <div className="min-w-0"><button type="button" onClick={() => onViewDetails(font.id)} className="block text-left text-sm text-black tracking-tight hover:underline truncate" style={{ fontWeight: 700 }}>{font.name}</button><p className="font-mono text-[9px] text-neutral-500 uppercase truncate">{font.source}</p></div>
        <div className="flex items-center gap-1.5 shrink-0"><MetadataBadges compact /><button type="button" onClick={copyCss} className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity" title="Copy CSS" aria-label="Copy CSS">{cssCopied ? <Check className="w-3 h-3 text-green-600" /> : <Code className="w-3 h-3 text-neutral-400" />}</button><button type="button" onClick={() => onToggleFavorite(font.id)} aria-label={isFavorite ? t('card.removeFromFavorites') : t('card.addToFavorites')}><Heart className={cn("w-3 h-3", isFavorite ? "fill-black" : "stroke-black")} /></button></div>
      </div>

      <button type="button" className="flex-grow flex items-center justify-center p-4 overflow-hidden w-full" onClick={() => onViewDetails(font.id)} aria-label={`Open ${font.name} details`}><p className="text-center leading-tight transition-all duration-200" style={{ ...style, fontSize: `${Math.min(fontSize, 60)}px` }}>{displayPreview}</p>{runtime.status === "error" && <span className="absolute bottom-12 left-3 right-3 font-mono text-[7px] uppercase tracking-widest text-red-500">Fallback preview</span>}</button>

      <div className="h-10 px-4 border-t border-neutral-100 flex justify-between items-center">
        <button type="button" onClick={(e) => { e.stopPropagation(); onToggleCompare(font.id); }} className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 hover:text-black transition-colors flex items-center gap-2" aria-label={isCompared ? t('card.removeFromCompare') : t('card.addToCompare')}>{isCompared ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}<span>{isCompared ? t('card.stacked') : t('card.stack')}</span></button>
        <div className="flex items-center gap-2">{trust.confidence === "derived" ? <span className="font-mono text-[8px] text-amber-700 uppercase">META?</span> : <span className="font-mono text-[9px] text-neutral-400">{effectiveWeights.length}w</span>}</div>
      </div>
    </article>
  );
});
