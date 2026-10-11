import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, AlignCenter, AlignLeft, AlignRight, ArrowLeft, Check, Code, ExternalLink, Heart, Minus, Plus, RotateCcw, Search } from "lucide-react";
import { FontCoverageNotice } from "@/components/FontCoverageNotice";
import { Link } from "react-router";
import { Font, mockFonts } from "@/data/mockFonts";
import { FontLoader } from "@/components/FontLoader";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { copyToClipboard } from "@/lib/clipboard";
import { useFontRuntimeStatus } from "@/lib/fontRuntime";
import { getEffectiveAuthor, getEffectiveAxes, getEffectiveCssStack, getEffectiveFamilyName, getEffectiveLanguages, getEffectiveSourceLabel, getEffectiveSourceUrl, getEffectiveStyles, getEffectiveWeights, getFontTrustReport, isEffectivelyVariable } from "@/lib/fontTrust";
import { toast } from "sonner";

interface FontDetailsProps {
  font: Font;
  onBack: () => void;
  toggleFavorite: (id: string) => void;
  isFavorite: boolean;
  toggleCompare: (id: string) => void;
  isCompare: boolean;
  testPairing?: (ids: string[]) => void;
  /** Initial specimen copy; later global changes intentionally do not replace a local draft. */
  previewText?: string;
}

type Tab = "specimen" | "glyphs" | "about";
type Align = "left" | "center" | "right";
type VerifiedStyle = "normal" | "italic";
type Preset = "custom" | "cyrillic" | "latin" | "digits" | "ui" | "paragraph";

const TAB_ORDER: Tab[] = ["specimen", "glyphs", "about"];
const DEFAULT_TEXT = "The quick brown fox jumps over the lazy dog.";
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const getDefaultAxisValues = (axes: Record<string, { min: number; max: number }>) => Object.fromEntries(
  Object.entries(axes).map(([tag, range]) => [tag, Math.round(clamp(tag === "wght" ? 400 : (range.min + range.max) / 2, range.min, range.max) * 100) / 100]),
);
const cssAxisValue = (tag: string, value: number) => `'${tag.replace(/'/g, "")}' ${value}`;

const googleImportUrl = (font: Font, weight: number, style: VerifiedStyle, selectedAxes: Record<string, number>) => {
  const selected: Record<string, number> = { ...selectedAxes, wght: weight };
  if (style === "italic") selected.ital = 1;
  const tags = Object.keys(selected).sort();
  const descriptor = `:${tags.join(",")}@${tags.map(tag => selected[tag]).join(",")}`;
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(`${getEffectiveFamilyName(font)}${descriptor}`).replace(/%20/g, "+")}&display=swap`;
};

const SCRIPT_SAMPLES: Record<string, { label: string; text: string }> = {
  Latin: { label: "Latin", text: "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz" },
  Cyrillic: { label: "Кириллица / Cyrillic", text: "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ абвгдеёжзийклмнопрстуфхцчшщъыьэюя" },
  Greek: { label: "Ελληνικά / Greek", text: "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ αβγδεζηθικλμνξοπρστυφχψω" },
  Arabic: { label: "العربية / Arabic", text: "ابتثجحخدذرزسشصضطظعغفقكلمنهوي" },
  Hebrew: { label: "עברית / Hebrew", text: "אבגדהוזחטיךכלםמןנסעףפץצקרשת" },
  Devanagari: { label: "देवनागरी / Devanagari", text: "अआइईउऊऋएऐओऔकखगघचछजझटठडढतथदधपफबभमयरलवशषसह" },
  Thai: { label: "ไทย / Thai", text: "กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ" },
  Vietnamese: { label: "Tiếng Việt", text: "ĂÂĐÊÔƠƯ ăâđêôơư ÁÀẢÃẠ ÉÈẺẼẸ" },
};

const presetText = (preset: Exclude<Preset, "custom">, language: "ru" | "en") => ({
  cyrillic: "Съешь ещё этих мягких французских булок, да выпей чаю.",
  latin: "Sphinx of black quartz, judge my vow.",
  digits: "0123456789 ¼ ½ ¾ № 10:24 — 99.9%",
  ui: language === "ru" ? "Создать проект  Сохранить  Отменить  Подробнее" : "Create project  Save  Cancel  Learn more",
  paragraph: language === "ru" ? "Хорошая типографика помогает увидеть структуру текста раньше, чем читатель замечает сам шрифт." : "Good typography lets readers see the structure of a text before they notice the typeface itself.",
}[preset]);

const codePointLabel = (character: string) => {
  const value = character.codePointAt(0);
  return value === undefined ? "" : `U+${value.toString(16).toUpperCase().padStart(4, "0")}`;
};

const parseGlyphQuery = (query: string) => {
  const value = query.trim();
  if (!value) return undefined;
  const match = /^U\+([0-9a-f]{1,6})$/i.exec(value);
  if (!match) return Array.from(value)[0] || null;
  const codePoint = Number.parseInt(match[1], 16);
  return codePoint <= 0x10ffff && !(codePoint >= 0xd800 && codePoint <= 0xdfff) ? String.fromCodePoint(codePoint) : null;
};

export const FontDetailsPage: React.FC<FontDetailsProps> = ({ font, onBack, toggleFavorite, isFavorite, toggleCompare, isCompare, testPairing, previewText }) => {
  const { t, language } = useLanguage();
  const runtime = useFontRuntimeStatus(font.id);
  const trust = useMemo(() => getFontTrustReport(font), [font]);
  const weights = useMemo(() => getEffectiveWeights(font), [font]);
  const axes = useMemo(() => getEffectiveAxes(font), [font]);
  const scripts = useMemo(() => getEffectiveLanguages(font), [font]);
  const styles = useMemo<VerifiedStyle[]>(() => {
    const verified = getEffectiveStyles(font).filter((style): style is VerifiedStyle => style === "normal" || style === "italic");
    return verified.length ? verified : ["normal"];
  }, [font]);
  const familyName = getEffectiveFamilyName(font);
  const cssStack = getEffectiveCssStack(font);
  const author = getEffectiveAuthor(font);
  const sourceUrl = getEffectiveSourceUrl(font);
  const sourceLabel = getEffectiveSourceLabel(font);
  const variable = isEffectivelyVariable(font);
  const defaultWeight = weights.includes("400") ? "400" : weights[0] || "400";
  const initialDraft = previewText || (language === "ru" && scripts.includes("Cyrillic") ? "Хорошая типографика помогает читать." : DEFAULT_TEXT);

  const [tab, setTab] = useState<Tab>("specimen");
  const [customDraft, setCustomDraft] = useState(initialDraft);
  const [text, setText] = useState(initialDraft);
  const [preset, setPreset] = useState<Preset>("custom");
  const [size, setSize] = useState(64);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [tracking, setTracking] = useState(0);
  const [align, setAlign] = useState<Align>("left");
  const [weight, setWeight] = useState(defaultWeight);
  const [fontStyle, setFontStyle] = useState<VerifiedStyle>(styles[0]);
  const [axisValues, setAxisValues] = useState<Record<string, number>>(() => getDefaultAxisValues(axes));
  const [glyphQuery, setGlyphQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ specimen: null, glyphs: null, about: null });

  useEffect(() => {
    setWeight(defaultWeight);
    setFontStyle(styles[0]);
    setAxisValues(getDefaultAxisValues(axes));
  }, [axes, defaultWeight, font.id, styles]);

  const axisEntries = Object.entries(axes);
  const selectedWeight = Math.round(axisValues.wght ?? Number(weight));
  const variationSettings = axisEntries.length ? axisEntries.map(([tag]) => cssAxisValue(tag, axisValues[tag])).join(", ") : undefined;
  const previewStyle: React.CSSProperties = { fontFamily: cssStack, fontWeight: selectedWeight, fontStyle, fontVariationSettings: variationSettings, fontSynthesis: "none" };
  const loaderRequests = [{ fontId: font.id, weight: selectedWeight, style: fontStyle, axes: axisEntries.length ? axisValues : undefined }];

  const recommendations = useMemo(() => {
    if (!trust.scriptsVerified || scripts.length === 0) return { pairing: undefined, related: [] as Font[] };
    const scriptSet = new Set(scripts);
    const candidates = mockFonts.filter(candidate => {
      if (candidate.id === font.id) return false;
      const candidateTrust = getFontTrustReport(candidate);
      return candidateTrust.identityVerified && candidateTrust.scriptsVerified && Boolean(getEffectiveSourceUrl(candidate)) && getEffectiveLanguages(candidate).some(script => scriptSet.has(script));
    });
    const target = font.categories.includes("serif") ? "sans-serif" : "serif";
    return {
      pairing: candidates.find(candidate => candidate.categories.includes(target)),
      related: candidates.filter(candidate => candidate.categories.some(category => font.categories.includes(category))).slice(0, 6),
    };
  }, [font, scripts, trust.scriptsVerified]);

  const snippets = useMemo(() => {
    const sourceComment = `/* ${trust.identityVerified ? "Verified source" : "Unverified source"}: ${sourceLabel} — ${sourceUrl} */`;
    const source = sourceLabel === "Google Fonts" && trust.identityVerified ? `@import url('${googleImportUrl(font, selectedWeight, fontStyle, axisValues)}');` : sourceComment;
    const css = [sourceComment, `font-family: ${cssStack};`, `font-style: ${fontStyle};`, `font-weight: ${selectedWeight};`, ...(variationSettings ? [`font-variation-settings: ${variationSettings};`] : []), "font-synthesis: none;"].join("\n");
    return { source, css };
  }, [cssStack, font, fontStyle, selectedWeight, sourceLabel, sourceUrl, trust.identityVerified, variationSettings]);

  const glyphGroups = useMemo(() => {
    const groups = scripts.map(script => SCRIPT_SAMPLES[script]).filter((group): group is { label: string; text: string } => Boolean(group));
    groups.push({ label: language === "ru" ? "Цифры и знаки" : "Digits and symbols", text: "0123456789 !?.,:; @#%&*()[]{} —–+−=<>" });
    return groups;
  }, [language, scripts]);
  const glyphResult = parseGlyphQuery(glyphQuery);

  const copy = async (key: string, value: string) => {
    if (!(await copyToClipboard(value))) return toast.error(language === "ru" ? "Не удалось скопировать" : "Copy failed");
    setCopied(key);
    toast.success(t("card.cssCopied"));
    window.setTimeout(() => setCopied(null), 1400);
  };

  const c = language === "ru" ? {
    source: "Официальный источник", sourceShort: "Источник", retry: "Повторить загрузку", fallback: "Шрифт не загрузился. Сейчас показан системный fallback; синтетическое начертание отключено.", presets: "Образец", custom: "Свой текст", reset: "Сбросить", style: "Начертание", axis: "Ось", verifiedRange: "Проверенный диапазон", physical: "Количество физических файлов не заявляется", glyphIntro: "Это образцы символов для известных письменностей, а не полная проверенная cmap-карта. Для неподтверждённого покрытия результат остаётся неизвестным.", glyphSearch: "Символ или U+XXXX", invalidCodePoint: "Некорректная кодовая точка", coverageUnknown: "Наличие глифа в файле не проверяется этим поиском.", pair: "Контрастное сочетание", related: "Похожие по категории", heuristic: "Эвристика по контрастной категории и общей подтверждённой письменности; не метрический анализ.", noRecommendations: "Рекомендации скрыты: для безопасного сопоставления нужна общая подтверждённая письменность и известный источник.", openPair: "Открыть в сравнении", code: "Код текущего начертания", metadata: "Метаданные и происхождение", cssSelections: "CSS-выбор", scripts: "Письменности", pending: "Не подтверждено",
  } : {
    source: "Official source", sourceShort: "Source", retry: "Retry loading", fallback: "The font failed to load. A system fallback is shown; synthetic styles are disabled.", presets: "Sample", custom: "Custom", reset: "Reset", style: "Style", axis: "Axis", verifiedRange: "Verified range", physical: "Physical file count is not asserted", glyphIntro: "These are sample characters for known scripts, not a complete verified cmap. Unverified coverage remains unknown.", glyphSearch: "Character or U+XXXX", invalidCodePoint: "Invalid code point", coverageUnknown: "This search does not test whether the font file contains the glyph.", pair: "Contrast pairing", related: "Related by category", heuristic: "A contrast-category heuristic with a shared verified script, not metric analysis.", noRecommendations: "Suggestions are hidden until a shared verified script and known source are available.", openPair: "Open in comparison", code: "Current style code", metadata: "Metadata and provenance", cssSelections: "CSS selections", scripts: "Scripts", pending: "Unverified",
  };

  const tabLabel = (item: Tab) => item === "specimen" ? t("details.lab") : item === "glyphs" ? t("details.glyphs") : t("details.about");
  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, current: Tab) => {
    const index = TAB_ORDER.indexOf(current);
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % TAB_ORDER.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + TAB_ORDER.length) % TAB_ORDER.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = TAB_ORDER.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    const next = TAB_ORDER[nextIndex];
    setTab(next);
    tabRefs.current[next]?.focus();
  };
  const choosePreset = (next: Preset) => {
    setPreset(next);
    setText(next === "custom" ? customDraft : presetText(next, language));
  };
  const resetSpecimen = () => {
    setSize(64); setLineHeight(1.2); setTracking(0); setAlign("left"); setWeight(defaultWeight); setFontStyle(styles[0]); setAxisValues(getDefaultAxisValues(axes));
  };

  return <div className="min-h-screen bg-white text-black">
    <FontLoader fonts={[font]} requests={loaderRequests} />

    <div className="sticky top-16 z-50 min-h-14 bg-white border-b border-neutral-200 flex items-stretch">
      <button type="button" onClick={onBack} className="px-4 md:px-6 border-r border-neutral-200 hover:bg-neutral-50 flex items-center gap-2" aria-label={t("details.back")}><ArrowLeft className="w-4 h-4" aria-hidden="true"/><span className="hidden md:inline font-mono text-[11px] uppercase tracking-widest">{t("details.back")}</span></button>
      <div className="flex-1 min-w-0 px-3 md:px-5 py-2 flex flex-col justify-center"><span className="truncate text-sm font-semibold">{familyName}</span><span className="truncate font-mono text-[11px] uppercase tracking-wider text-neutral-500">{sourceLabel}</span></div>
      <button type="button" onClick={() => toggleCompare(font.id)} className="w-12 md:w-14 border-l border-neutral-200 hover:bg-neutral-50 flex items-center justify-center" aria-label={isCompare ? t("card.removeFromCompare") : t("card.addToCompare")}>{isCompare ? <Minus className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}</button>
      <button type="button" onClick={() => toggleFavorite(font.id)} className="w-12 md:w-14 border-l border-neutral-200 hover:bg-neutral-50 flex items-center justify-center" aria-label={isFavorite ? t("card.removeFromFavorites") : t("card.addToFavorites")}><Heart className={cn("w-4 h-4", isFavorite && "fill-current")}/></button>
      <a href={sourceUrl} target="_blank" rel="noreferrer" className="px-3 md:px-5 border-l border-neutral-200 bg-neutral-900 text-white hover:bg-neutral-700 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider" aria-label={`${c.source}: ${sourceLabel}`}><ExternalLink className="w-3.5 h-3.5" aria-hidden="true"/><span>{c.sourceShort}</span></a>
    </div>

    {runtime.status === "error" && <div role="status" className="border-b border-neutral-300 bg-neutral-50 px-4 md:px-6 py-3 flex flex-wrap items-center gap-3 text-neutral-800"><AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true"/><p className="flex-1 min-w-56 text-sm">{c.fallback}</p><button type="button" onClick={() => window.dispatchEvent(new CustomEvent("onod:font-retry", { detail: { fontId: font.id } }))} className="h-9 px-3 border border-neutral-400 bg-white hover:bg-neutral-100 font-mono text-[11px] uppercase tracking-wider">{c.retry}</button></div>}

    <header className="px-5 py-6 md:px-8 md:py-8 border-b border-neutral-200"><p className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">{font.categories.join(" · ")} / {author}</p><div className="mt-3 flex flex-col md:flex-row md:items-end md:justify-between gap-4"><h1 className="text-4xl md:text-6xl tracking-tighter leading-none" style={previewStyle}>{familyName}</h1><a href={sourceUrl} target="_blank" rel="noreferrer" className="w-fit inline-flex items-center gap-2 underline underline-offset-4 text-sm font-medium">{c.source}: {sourceLabel}<ExternalLink className="w-3.5 h-3.5" aria-hidden="true"/></a></div></header>

    <nav className="h-14 border-b border-neutral-200 flex overflow-x-auto" role="tablist" aria-label={familyName}>{TAB_ORDER.map(item => <button key={item} ref={node => { tabRefs.current[item] = node; }} id={`font-tab-${item}`} type="button" role="tab" aria-selected={tab === item} aria-controls={`font-panel-${item}`} tabIndex={tab === item ? 0 : -1} onClick={() => setTab(item)} onKeyDown={event => onTabKeyDown(event, item)} className={cn("px-5 md:px-8 shrink-0 font-mono text-[11px] uppercase tracking-wider border-r border-neutral-200", tab === item ? "bg-neutral-900 text-white" : "hover:bg-neutral-50")}>{tabLabel(item)}</button>)}</nav>

    {tab === "specimen" && <section className="flex flex-col" id="font-panel-specimen" role="tabpanel" aria-labelledby="font-tab-specimen">
      <div id="specimen-controls" className="order-2 lg:order-1 p-4 md:p-5 border-y border-neutral-200 bg-neutral-50 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2" aria-label={c.presets}>{(["custom", "cyrillic", "latin", "digits", "ui", "paragraph"] as Preset[]).map(item => <button key={item} type="button" onClick={() => choosePreset(item)} aria-pressed={preset === item} className={cn("h-9 px-3 border font-mono text-[11px] uppercase tracking-wider", preset === item ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white hover:bg-neutral-100")}>{item === "custom" ? c.custom : language === "ru" ? ({cyrillic:"Кириллица",latin:"Латиница",digits:"Цифры",ui:"Интерфейс",paragraph:"Абзац"}[item]) : item}</button>)}<button type="button" onClick={resetSpecimen} className="h-9 px-3 ml-auto border border-neutral-300 bg-white hover:bg-neutral-100 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider"><RotateCcw className="w-3.5 h-3.5" aria-hidden="true"/>{c.reset}</button></div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <NumericControl label={t("details.size")} value={size} min={16} max={180} step={1} suffix="px" onChange={setSize}/>
          <NumericControl label={t("details.line")} value={lineHeight} min={0.8} max={2.2} step={0.05} onChange={setLineHeight}/>
          <NumericControl label={t("details.track")} value={tracking} min={-0.1} max={0.4} step={0.01} suffix="em" onChange={setTracking}/>
          <div className="flex items-end justify-between gap-3">{!axes.wght && weights.length > 1 ? <label className="flex-1 text-[11px] font-mono uppercase tracking-wider"><span className="block mb-1 text-neutral-500">{t("details.weights")}</span><select value={weight} onChange={event => setWeight(event.target.value)} className="h-9 w-full border border-neutral-300 bg-white px-2 text-sm">{weights.map(item => <option key={item} value={item}>{item}</option>)}</select></label> : <div className="flex-1 text-[11px] font-mono uppercase text-neutral-500">{weights.length === 1 ? `${t("details.weights")}: ${weights[0]}` : c.verifiedRange}</div>}<div className="flex h-9 border border-neutral-300 bg-white"><IconButton label={language === "ru" ? "По левому краю" : "Align left"} active={align === "left"} onClick={() => setAlign("left")}><AlignLeft className="w-3.5 h-3.5"/></IconButton><IconButton label={language === "ru" ? "По центру" : "Align center"} active={align === "center"} onClick={() => setAlign("center")}><AlignCenter className="w-3.5 h-3.5"/></IconButton><IconButton label={language === "ru" ? "По правому краю" : "Align right"} active={align === "right"} onClick={() => setAlign("right")}><AlignRight className="w-3.5 h-3.5"/></IconButton></div></div>
        </div>
        {(styles.length > 1 || axisEntries.length > 0) && <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 pt-3 border-t border-neutral-200">{styles.length > 1 && <label className="text-[11px] font-mono uppercase tracking-wider"><span className="block mb-1 text-neutral-500">{c.style}</span><select value={fontStyle} onChange={event => setFontStyle(event.target.value as VerifiedStyle)} className="h-9 w-full border border-neutral-300 bg-white px-2 text-sm">{styles.map(style => <option key={style}>{style}</option>)}</select></label>}{axisEntries.map(([tag, range]) => <NumericControl key={tag} label={`${c.axis} ${tag} · ${range.min}–${range.max}`} value={axisValues[tag]} min={range.min} max={range.max} step={tag === "wght" ? 1 : Math.max(0.01, (range.max - range.min) / 100)} onChange={value => setAxisValues(current => ({ ...current, [tag]: value }))}/>)}</div>}
        <p className="font-mono text-[11px] text-neutral-500">{c.cssSelections}: {axes.wght ? `wght ${axes.wght.min}–${axes.wght.max}` : `${weights.length} ${language === "ru" ? "значений веса" : "weight values"}`} · {styles.join(" / ")}. {c.physical}.</p>
      </div>
      <div className="order-1 lg:order-2"><FontCoverageNotice font={font} text={text} /><div className="p-5 md:p-10 min-h-[38vh]"><textarea aria-label={`${familyName} specimen`} value={text} onChange={event => { setText(event.target.value); setCustomDraft(event.target.value); setPreset("custom"); }} className="w-full min-h-[36vh] resize-y bg-transparent outline-none" style={{ ...previewStyle, fontSize: `${size}px`, lineHeight, letterSpacing: `${tracking}em`, textAlign: align }}/></div></div>
    </section>}

    {tab === "glyphs" && <section id="font-panel-glyphs" role="tabpanel" aria-labelledby="font-tab-glyphs" className="p-5 md:p-10">
      <p className="max-w-4xl text-sm leading-relaxed text-neutral-600">{c.glyphIntro}</p>
      <div className="mt-6 max-w-xl"><label htmlFor="glyph-search" className="block mb-2 font-mono text-[11px] uppercase tracking-wider text-neutral-500">{c.glyphSearch}</label><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" aria-hidden="true"/><input id="glyph-search" value={glyphQuery} onChange={event => setGlyphQuery(event.target.value)} placeholder={language === "ru" ? "Ж или U+0416" : "Ж or U+0416"} className="h-11 w-full border border-neutral-300 pl-10 pr-3 text-base outline-none focus:ring-2 focus:ring-inset focus:ring-black"/></div></div>
      {glyphQuery.trim() && <div className="mt-4 border border-neutral-300 p-4 flex items-center gap-5" role="status">{glyphResult ? <span className="text-5xl" style={previewStyle}>{glyphResult}</span> : <AlertTriangle className="w-5 h-5" aria-hidden="true"/>}<div><p className="font-mono text-sm">{glyphResult ? `${glyphResult} · ${codePointLabel(glyphResult)}` : c.invalidCodePoint}</p><p className="mt-1 text-xs text-neutral-500">{c.coverageUnknown}</p></div></div>}
      <div className="mt-8 space-y-10">{glyphGroups.map(group => <section key={group.label}><h2 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-neutral-500">{group.label} · {language === "ru" ? "образец" : "sample"}</h2><div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 xl:grid-cols-14 border-l border-t border-neutral-200">{Array.from(group.text).filter(character => character !== " ").map((character, index) => <button key={`${codePointLabel(character)}-${index}`} type="button" onClick={() => setGlyphQuery(character)} className="aspect-square min-h-12 border-r border-b border-neutral-200 flex flex-col items-center justify-center hover:bg-neutral-50" title={`${character} ${codePointLabel(character)}`}><span className="text-2xl" style={previewStyle}>{character}</span><span className="mt-1 font-mono text-[11px] text-neutral-600">{codePointLabel(character).replace("U+", "")}</span></button>)}</div></section>)}</div>
    </section>}

    {tab === "about" && <section id="font-panel-about" role="tabpanel" aria-labelledby="font-tab-about" className="p-5 md:p-10 grid lg:grid-cols-[minmax(0,1fr)_360px] gap-10">
      <div><h2 className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">{c.metadata}</h2><p className="mt-4 text-2xl md:text-4xl tracking-tight leading-tight">{font.description}</p><dl className="mt-8 border-t border-neutral-200 text-sm">{[[t("details.foundry"), author], [t("details.license"), trust.licenseVerified ? trust.licenseLabel : c.pending], [t("details.source"), sourceLabel], [t("details.weights"), trust.weightsVerified ? (axes.wght ? `${axes.wght.min}–${axes.wght.max} (${c.verifiedRange.toLowerCase()})` : weights.join(", ")) : c.pending], [c.style, styles.join(", ")], [c.scripts, trust.scriptsVerified && scripts.length ? scripts.join(", ") : c.pending], [language === "ru" ? "Переменный" : "Variable", trust.variableVerified ? (variable ? (language === "ru" ? "Да" : "Yes") : (language === "ru" ? "Нет" : "No")) : c.pending], [language === "ru" ? "Физические файлы" : "Physical files", c.physical]].map(([label, value]) => <div key={label} className="py-3 border-b border-neutral-200 grid sm:grid-cols-[180px_1fr] gap-2"><dt className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">{label}</dt><dd>{value}</dd></div>)}</dl>{trust.warnings.length > 0 && <div className="mt-6 border border-neutral-300 bg-neutral-50 p-4 space-y-2">{trust.warnings.map((warning, index) => <p key={index} className="text-sm leading-relaxed">{warning}</p>)}</div>}</div>
      <div><h2 className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">{c.code}</h2><div className="mt-4 space-y-3">{Object.entries(snippets).map(([key, value]) => <div key={key} className="border border-neutral-200"><div className="h-10 flex items-center justify-between px-3 border-b border-neutral-200 font-mono text-[11px] uppercase"><span>{key}</span><button type="button" onClick={() => copy(key, value)} className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100" aria-label={`${t("details.copy")} ${key}`}>{copied === key ? <Check className="w-4 h-4"/> : <Code className="w-4 h-4"/>}</button></div><pre className="p-3 overflow-auto text-xs whitespace-pre-wrap break-all">{value}</pre></div>)}</div></div>
    </section>}

    <section className="border-t border-neutral-200 p-5 md:p-10"><div className="grid lg:grid-cols-2 gap-8">
      <div><h2 className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">{c.pair}</h2><p className="mt-2 text-sm text-neutral-500">{c.heuristic}</p>{recommendations.pairing ? <div className="mt-4 border border-neutral-200 p-4 flex flex-wrap items-center justify-between gap-4"><div><Link to={`/${recommendations.pairing.id}`} className="text-2xl font-semibold hover:underline underline-offset-4">{getEffectiveFamilyName(recommendations.pairing)}</Link><p className="mt-1 text-xs text-neutral-500">{getEffectiveSourceLabel(recommendations.pairing)}</p></div>{testPairing && <button type="button" onClick={() => testPairing([font.id, recommendations.pairing!.id])} className="h-10 px-4 bg-neutral-900 text-white font-mono text-[11px] uppercase tracking-wider hover:bg-neutral-700">{c.openPair}</button>}</div> : <p className="mt-4 text-sm border border-dashed border-neutral-300 p-4 text-neutral-500">{c.noRecommendations}</p>}</div>
      <div><h2 className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">{c.related}</h2>{recommendations.related.length ? <div className="mt-4 grid sm:grid-cols-2 gap-px bg-neutral-200 border border-neutral-200">{recommendations.related.map(item => <Link key={item.id} to={`/${item.id}`} className="bg-white p-4 hover:bg-neutral-50"><span className="block text-lg font-semibold">{getEffectiveFamilyName(item)}</span><span className="block mt-1 text-xs text-neutral-500">{getEffectiveSourceLabel(item)} · {getEffectiveLanguages(item).filter(script => scripts.includes(script)).join(", ")}</span></Link>)}</div> : <p className="mt-4 text-sm border border-dashed border-neutral-300 p-4 text-neutral-500">{c.noRecommendations}</p>}</div>
    </div></section>
  </div>;
};

const NumericControl = ({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (value: number) => void }) => {
  const { language } = useLanguage();
  const [draft, setDraft] = useState(String(value));
  const cancelled = useRef(false);
  useEffect(() => setDraft(String(value)), [value]);
  const update = (next: number) => { if (Number.isFinite(next)) onChange(clamp(next, min, max)); };
  const commit = () => {
    if (cancelled.current) { cancelled.current = false; setDraft(String(value)); return; }
    if (draft.trim() === '' || !Number.isFinite(Number(draft))) { setDraft(String(value)); return; }
    const next = clamp(Number(draft), min, max); setDraft(String(next)); onChange(next);
  };
  return <div className="block text-[11px] font-mono uppercase tracking-wider"><span className="block mb-1 text-neutral-600 truncate">{label}</span><span className="flex h-10 items-center gap-2"><input aria-label={label} type="range" value={value} min={min} max={max} step={step} onChange={event => update(Number(event.target.value))} className="onod-range min-w-0 flex-1"/><input aria-label={`${label}: ${language === 'ru' ? 'значение' : 'value'}`} type="number" value={draft} min={min} max={max} step={step} onChange={event => setDraft(event.target.value)} onBlur={commit} onKeyDown={event => { if (event.key === 'Escape') {cancelled.current = true; event.currentTarget.blur();} if(event.key === 'Enter') event.currentTarget.blur(); }} className="h-10 w-20 border border-neutral-300 bg-white px-2 text-sm tabular-nums normal-case"/>{suffix && <span className="text-neutral-600 normal-case">{suffix}</span>}</span></div>;
};

const IconButton = ({ active, onClick, children, label }: { active: boolean; onClick: () => void; children: React.ReactNode; label: string }) => <button type="button" aria-label={label} aria-pressed={active} onClick={onClick} className={cn("w-9 flex items-center justify-center border-r last:border-r-0 border-neutral-300 hover:bg-neutral-100", active && "bg-neutral-900 text-white hover:bg-neutral-800")}>{children}</button>;
