import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Font } from "@/data/mockFonts";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Copy,
  LoaderCircle,
  RotateCcw,
  Scale,
  Share2,
  Type,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { googleStylesheetUrl } from "@/lib/fontLoadingPlan";
import { FontCoverageNotice } from "@/components/FontCoverageNotice";
import { FontLoader } from "@/components/FontLoader";
import { useLanguage } from "@/lib/i18n";
import { copyToClipboard } from "@/lib/clipboard";
import {
  getEffectiveAuthor,
  getEffectiveCssStack,
  getEffectiveFamilyName,
  getEffectiveFontshareSlug,
  getEffectiveSourceLabel,
  getEffectiveSourceUrl,
  getEffectiveStyles,
  getEffectiveWeights,
} from "@/lib/fontTrust";
import { useFontRuntimeStatus } from "@/lib/fontRuntime";
import { useSearchParams } from "react-router";
import {
  buildWorkbenchExport,
  closestAvailableWeight,
  type WorkbenchExportConfig,
  type WorkbenchExportFormat,
  type WorkbenchFontToken,
  WORKBENCH_EXPORT_LABELS,
} from "@/lib/workbenchExports";
import {
  DEFAULT_WORKBENCH_SETTINGS,
  parseWorkbenchSearch,
  sameSerializedSearch,
  serializeWorkbenchSearch,
  WORKBENCH_RATIOS,
  type WorkbenchMode,
  type WorkbenchPreset,
  type WorkbenchUrlSettings,
} from "@/lib/workbenchUrl";

export interface CompareProps {
  fonts: Font[];
  allFonts?: Font[];
  previewText: string;
  setPreviewText: (text: string) => void;
  removeFromCompare: (id: string) => void;
  toggleCompare?: (id: string) => void;
  onReorder?: (ids: string[]) => void;
  onBack: () => void;
}

interface CopyText {
  comparison: string;
  pairing: string;
  controls: string;
  hideControls: string;
  showControls: string;
  sample: string;
  sampleHint: string;
  shareText: string;
  shareTextHint: string;
  typography: string;
  base: string;
  ratio: string;
  lineHeight: string;
  tracking: string;
  reset: string;
  roles: string;
  heading: string;
  body: string;
  ui: string;
  layout: string;
  article: string;
  interface: string;
  hero: string;
  selected: string;
  candidate: string;
  remove: string;
  moveUp: string;
  moveDown: string;
  addCandidate: string;
  export: string;
  format: string;
  copy: string;
  copied: string;
  copyFailed: string;
  shareCopied: string;
  shareFailed: string;
  source: string;
  runtimeIdle: string;
  runtimeLoading: string;
  runtimeReady: string;
  runtimeError: string;
  previewHeading: string;
  previewBody: string;
  interfaceHeading: string;
  interfaceBody: string;
  heroHeading: string;
  heroBody: string;
}

const COPY: Record<"ru" | "en", CopyText> = {
  ru: {
    comparison: "Сравнение",
    pairing: "Пара в макете",
    controls: "Настройки верстака",
    hideControls: "Скрыть настройки",
    showControls: "Показать настройки",
    sample: "Текст сравнения",
    sampleHint: "Один и тот же текст, кегль и интерлиньяж для всех гарнитур.",
    shareText: "Включить мой текст в ссылку",
    shareTextHint: "По умолчанию текст остаётся только в этом браузере.",
    typography: "Типографика",
    base: "Базовый кегль",
    ratio: "Коэффициент",
    lineHeight: "Интерлиньяж",
    tracking: "Трекинг, em",
    reset: "Сбросить",
    roles: "Роли",
    heading: "Заголовок",
    body: "Основной текст",
    ui: "Интерфейс / кандидат",
    layout: "Макет",
    article: "Статья",
    interface: "Интерфейс",
    hero: "Обложка",
    selected: "Выбранные гарнитуры",
    candidate: "Кандидат / UI",
    remove: "Убрать",
    moveUp: "Поднять",
    moveDown: "Опустить",
    addCandidate: "Добавить кандидата",
    export: "Экспорт токенов",
    format: "Формат",
    copy: "Копировать",
    copied: "Код скопирован",
    copyFailed: "Не удалось скопировать — код доступен ниже",
    shareCopied: "Ссылка скопирована",
    shareFailed: "Не удалось скопировать — ссылка доступна в настройках",
    source: "Источник",
    runtimeIdle: "Ожидание загрузки",
    runtimeLoading: "Загрузка",
    runtimeReady: "Загружен",
    runtimeError: "Ошибка загрузки",
    previewHeading: "Система, которая помогает читать",
    previewBody: "Заголовок задаёт голос, а основной текст удерживает ритм длинного чтения. Роли остаются различимыми без искусственной жирности.",
    interfaceHeading: "Обзор коллекции",
    interfaceBody: "Найдите гарнитуру, проверьте источник и сохраните рабочую пару.",
    heroHeading: "Смысл начинается с формы",
    heroBody: "Три роли, один спокойный визуальный язык.",
  },
  en: {
    comparison: "Comparison",
    pairing: "Pair in layout",
    controls: "Workbench controls",
    hideControls: "Hide controls",
    showControls: "Show controls",
    sample: "Comparison text",
    sampleHint: "The same text, size, and line height are used for every family.",
    shareText: "Include my text in the link",
    shareTextHint: "Your text stays in this browser by default.",
    typography: "Typography",
    base: "Base size",
    ratio: "Ratio",
    lineHeight: "Line height",
    tracking: "Tracking, em",
    reset: "Reset",
    roles: "Roles",
    heading: "Heading",
    body: "Body",
    ui: "Interface / candidate",
    layout: "Layout",
    article: "Article",
    interface: "Interface",
    hero: "Hero",
    selected: "Selected families",
    candidate: "Candidate / UI",
    remove: "Remove",
    moveUp: "Move up",
    moveDown: "Move down",
    addCandidate: "Add candidate",
    export: "Export tokens",
    format: "Format",
    copy: "Copy",
    copied: "Code copied",
    copyFailed: "Copy failed — the code remains available below",
    shareCopied: "Link copied",
    shareFailed: "Copy failed — the link is available in controls",
    source: "Source",
    runtimeIdle: "Waiting to load",
    runtimeLoading: "Loading",
    runtimeReady: "Loaded",
    runtimeError: "Load error",
    previewHeading: "A system made for reading",
    previewBody: "The heading establishes a voice while the body keeps long-form reading steady. Roles remain distinct without synthetic bold.",
    interfaceHeading: "Collection overview",
    interfaceBody: "Find a family, verify its source, and save a working pair.",
    heroHeading: "Meaning begins with form",
    heroBody: "Three roles, one calm visual language.",
  },
};

const SCALE_STEPS = ["base", "lg", "xl", "2xl", "3xl"];

const fallbackFamily = (font?: Font) => {
  if (!font) return "sans-serif";
  if (font.categories.includes("serif")) return "serif";
  if (font.categories.includes("monospaced")) return "monospace";
  return "sans-serif";
};

const resolveRoleId = (fonts: Font[], requested: string, fallbackIndex: number) => {
  if (fonts.some(font => font.id === requested)) return requested;
  return fonts[fallbackIndex]?.id || fonts[0]?.id || "";
};

const safeCommentValue = (value: string) => value.replaceAll("*/", "* /").replace(/[\r\n]+/g, " ");

const actualStyleFor = (font?: Font): "normal" | "italic" => {
  if (!font) return "normal";
  const styles = getEffectiveStyles(font).map(style => style.toLowerCase());
  return styles.includes("normal") || styles.includes("regular") ? "normal" : styles.includes("italic") ? "italic" : "normal";
};

const sourceCssFor = (font: Font, weight: number, style: "normal" | "italic") => {
  const family = getEffectiveFamilyName(font);
  const sourceLabel = getEffectiveSourceLabel(font);
  if (sourceLabel === "Google Fonts") {
    return `@import url("${googleStylesheetUrl(font)}");`;
  }
  const fontshareSlug = getEffectiveFontshareSlug(font);
  if (fontshareSlug) return `@import url("https://api.fontshare.com/v2/css?f[]=${encodeURIComponent(fontshareSlug)}@1&display=swap");`;
  return `/* ${safeCommentValue(family)}: connect a stylesheet from the verified source ${safeCommentValue(getEffectiveSourceUrl(font))}; no font binary embedded. */`;
};

interface CommittedNumberFieldProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onCommit: (value: number) => void;
}

const CommittedNumberField = ({ id, label, value, min, max, step, onCommit }: CommittedNumberFieldProps) => {
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) setDraft(String(value));
  }, [value]);

  const commit = () => {
    if (cancelled.current) { cancelled.current = false; setDraft(String(value)); return; }
    const parsed = Number(draft);
    if (draft.trim() === "" || !Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const normalized = Math.min(max, Math.max(min, parsed));
    setDraft(String(normalized));
    onCommit(normalized);
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-neutral-600">{label}</label>
      <input
        ref={inputRef}
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={draft}
        onChange={event => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={event => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            cancelled.current = true;
            setDraft(String(value));
            event.currentTarget.blur();
          }
        }}
        className="onod-input w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-neutral-600"
      />
    </div>
  );
};

const FontRuntimeBadge = ({ font, copy }: { font: Font; copy: CopyText }) => {
  const runtime = useFontRuntimeStatus(font.id);
  const config = runtime.status === "error"
    ? { icon: AlertTriangle, label: copy.runtimeError, className: "text-neutral-900" }
    : runtime.status === "loading"
      ? { icon: LoaderCircle, label: copy.runtimeLoading, className: "text-neutral-600" }
      : runtime.status === "ready"
        ? { icon: CheckCircle2, label: copy.runtimeReady, className: "text-neutral-600" }
        : { icon: Scale, label: copy.runtimeIdle, className: "text-neutral-500" };
  const Icon = config.icon;

  return (
    <div className={`mt-2 flex items-start gap-1.5 font-mono text-[11px] leading-4 ${config.className}`} aria-live="polite">
      <Icon className={`mt-0.5 h-3 w-3 shrink-0 ${runtime.status === "loading" ? "animate-spin" : ""}`} aria-hidden="true" />
      <span>{config.label}{runtime.status === "error" && runtime.message ? ` — ${runtime.message}` : ""}</span>
    </div>
  );
};

interface PairPreviewProps {
  preset: WorkbenchPreset;
  copy: CopyText;
  bodyText: string;
  headingFont?: Font;
  bodyFont?: Font;
  uiFont?: Font;
  headingWeight: number;
  bodyWeight: number;
  uiWeight: number;
  headingStyle: "normal" | "italic";
  bodyStyle: "normal" | "italic";
  uiStyleValue: "normal" | "italic";
  sizes: number[];
  lineHeight: number;
  tracking: number;
}

const PairPreview = ({ preset, copy, bodyText, headingFont, bodyFont, uiFont, headingWeight, bodyWeight, uiWeight, headingStyle: headingStyleValue, bodyStyle: bodyStyleValue, uiStyleValue, sizes, lineHeight, tracking }: PairPreviewProps) => {
  const headingStyle: React.CSSProperties = {
    fontFamily: headingFont ? getEffectiveCssStack(headingFont) : "sans-serif",
    fontWeight: headingWeight,
    fontStyle: headingStyleValue,
    lineHeight: Math.max(1, lineHeight - 0.35),
    letterSpacing: `${tracking}em`,
  };
  const bodyStyle: React.CSSProperties = {
    fontFamily: bodyFont ? getEffectiveCssStack(bodyFont) : "sans-serif",
    fontWeight: bodyWeight,
    fontStyle: bodyStyleValue,
    lineHeight,
    letterSpacing: `${tracking}em`,
  };
  const uiStyle: React.CSSProperties = {
    fontFamily: uiFont ? getEffectiveCssStack(uiFont) : "sans-serif",
    fontWeight: uiWeight,
    fontStyle: uiStyleValue,
  };

  if (preset === "interface") {
    return (
      <section className="mx-auto w-full max-w-5xl border border-neutral-300 bg-neutral-50 p-4 sm:p-8" aria-label={copy.interface}>
        <div className="mb-8 flex items-center justify-between border-b border-neutral-300 pb-4" style={uiStyle}>
          <span className="text-sm">ONOD / 018</span><span className="text-xs uppercase tracking-widest">Index</span>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1fr_240px]">
          <div>
            <h1 className="mb-5" style={{ ...headingStyle, fontSize: `${sizes[3]}px` }}>{copy.interfaceHeading}</h1>
            <p className="max-w-2xl text-neutral-700" style={{ ...bodyStyle, fontSize: `${sizes[0]}px` }}>{bodyText || copy.interfaceBody}</p>
          </div>
          <div className="space-y-3 border-t border-neutral-300 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0" style={uiStyle}>
            {["Sans Serif", "Serif", "Monospace"].map((item, index) => <div key={item} className="flex justify-between border-b border-neutral-200 pb-2 text-xs"><span>{item}</span><span>0{index + 4}</span></div>)}
          </div>
        </div>
      </section>
    );
  }

  if (preset === "hero") {
    return (
      <section className="mx-auto flex min-h-[560px] w-full max-w-6xl flex-col justify-between border border-neutral-300 bg-white p-6 sm:p-12" aria-label={copy.hero}>
        <div className="flex justify-between border-b border-neutral-300 pb-4 text-xs uppercase tracking-widest" style={uiStyle}><span>ONOD Fonts</span><span>2026</span></div>
        <div className="py-16">
          <h1 className="max-w-5xl" style={{ ...headingStyle, fontSize: `${sizes[4]}px` }}>{copy.heroHeading}</h1>
          <p className="mt-8 max-w-xl text-neutral-600" style={{ ...bodyStyle, fontSize: `${sizes[1]}px` }}>{bodyText || copy.heroBody}</p>
        </div>
        <button type="button" className="w-fit border border-neutral-900 px-6 py-3 text-sm" style={uiStyle}>{copy.addCandidate}</button>
      </section>
    );
  }

  return (
    <article className="mx-auto w-full max-w-4xl bg-white px-2 py-8 sm:px-8 sm:py-14" aria-label={copy.article}>
      <div className="mb-10 flex items-center justify-between border-b border-neutral-300 pb-3 text-xs uppercase tracking-widest" style={uiStyle}><span>Essay 018</span><span>8 min</span></div>
      <h1 className="max-w-3xl" style={{ ...headingStyle, fontSize: `${sizes[4]}px` }}>{copy.previewHeading}</h1>
      <p className="mt-8 max-w-2xl text-neutral-700" style={{ ...bodyStyle, fontSize: `${sizes[1]}px` }}>{bodyText || copy.previewBody}</p>
      <div className="mt-14 grid gap-8 border-t border-neutral-300 pt-8 sm:grid-cols-[160px_1fr]">
        <div className="text-xs uppercase tracking-widest" style={uiStyle}>Typography<br />Workbench</div>
        <div className="space-y-6" style={{ ...bodyStyle, fontSize: `${sizes[0]}px` }}>
          <p>{copy.previewBody}</p>
          <p className="text-neutral-600">{copy.interfaceBody}</p>
        </div>
      </div>
    </article>
  );
};

export const ComparePage: React.FC<CompareProps> = ({ fonts, allFonts = [], previewText, setPreviewText, removeFromCompare, toggleCompare, onReorder, onBack }) => {
  const { t, language } = useLanguage();
  const copy = COPY[language];
  const [searchParams, setSearchParams] = useSearchParams();
  const searchString = searchParams.toString();
  const initialUrl = useRef(parseWorkbenchSearch(searchString));
  const initial = initialUrl.current.settings;
  const [mode, setMode] = useState<WorkbenchMode>(initial.mode);
  const [preset, setPreset] = useState<WorkbenchPreset>(initial.preset);
  const [baseSize, setBaseSize] = useState(initial.baseSize);
  const [scaleRatio, setScaleRatio] = useState(initial.scaleRatio);
  const [lineHeight, setLineHeight] = useState(initial.lineHeight);
  const [tracking, setTracking] = useState(initial.tracking);
  const [comparisonText, setComparisonText] = useState(initialUrl.current.sharedText ?? previewText);
  const [headingFontId, setHeadingFontId] = useState(initial.headingFontId);
  const [bodyFontId, setBodyFontId] = useState(initial.bodyFontId);
  const [uiFontId, setUiFontId] = useState(initial.uiFontId);
  const [includeTextInShare, setIncludeTextInShare] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(true);
  const [exportFormat, setExportFormat] = useState<WorkbenchExportFormat>("css");
  const [shareFallbackUrl, setShareFallbackUrl] = useState("");
  const [urlHydrationRevision, setUrlHydrationRevision] = useState(0);
  const lastObservedSearch = useRef<string | null>(null);
  const lastWrittenSearch = useRef<string | null>(null);
  const skipSerializationForSearch = useRef<string | null>(null);

  const fontIds = useMemo(() => fonts.slice(0, 3).map(font => font.id), [fonts]);
  const fontIdsKey = fontIds.join(",");

  useEffect(() => {
    if (lastObservedSearch.current === searchString) return;
    lastObservedSearch.current = searchString;
    if (lastWrittenSearch.current === searchString) {
      lastWrittenSearch.current = null;
      return;
    }

    const parsed = parseWorkbenchSearch(searchString);
    skipSerializationForSearch.current = searchString;
    setMode(parsed.settings.mode);
    setPreset(parsed.settings.preset);
    setBaseSize(parsed.settings.baseSize);
    setScaleRatio(parsed.settings.scaleRatio);
    setLineHeight(parsed.settings.lineHeight);
    setTracking(parsed.settings.tracking);
    setHeadingFontId(parsed.settings.headingFontId);
    setBodyFontId(parsed.settings.bodyFontId);
    setUiFontId(parsed.settings.uiFontId);
    // Both explicit shared links and old `content=` links are consumed once.
    // The normal serializer removes the text from the visible address bar.
    if (parsed.sharedText !== undefined) {
      setComparisonText(parsed.sharedText);
      setPreviewText(parsed.sharedText);
    }
    setIncludeTextInShare(false);
    // Guarantees a follow-up serialization pass even when every parsed value
    // already equals local state (needed to scrub a legacy content parameter).
    setUrlHydrationRevision(revision => revision + 1);
  }, [searchString, setPreviewText]);

  useEffect(() => {
    setHeadingFontId(previous => resolveRoleId(fonts, previous, 0));
    setBodyFontId(previous => resolveRoleId(fonts, previous, 1));
    setUiFontId(previous => resolveRoleId(fonts, previous, 2));
  }, [fontIdsKey, fonts]);

  const resolvedHeadingId = resolveRoleId(fonts, headingFontId, 0);
  const resolvedBodyId = resolveRoleId(fonts, bodyFontId, 1);
  const resolvedUiId = resolveRoleId(fonts, uiFontId, 2);
  const urlSettings = useMemo<WorkbenchUrlSettings>(() => ({
    mode,
    preset,
    headingFontId: resolvedHeadingId,
    bodyFontId: resolvedBodyId,
    uiFontId: resolvedUiId,
    baseSize,
    scaleRatio,
    lineHeight,
    tracking,
  }), [mode, preset, resolvedHeadingId, resolvedBodyId, resolvedUiId, baseSize, scaleRatio, lineHeight, tracking]);
  const canonicalSearch = useMemo(
    () => serializeWorkbenchSearch(urlSettings, fontIds, searchString).toString(),
    [urlSettings, fontIdsKey, searchString],
  );

  useEffect(() => {
    if (skipSerializationForSearch.current === searchString) {
      skipSerializationForSearch.current = null;
      return;
    }
    if (sameSerializedSearch(canonicalSearch, searchString)) return;
    lastWrittenSearch.current = canonicalSearch;
    setSearchParams(new URLSearchParams(canonicalSearch), { replace: true });
  }, [canonicalSearch, searchString, setSearchParams, urlHydrationRevision]);

  const calculatedSizes = useMemo(
    () => SCALE_STEPS.map((_, index) => Math.round(baseSize * Math.pow(scaleRatio, index))),
    [baseSize, scaleRatio],
  );
  const headingFont = fonts.find(font => font.id === resolvedHeadingId) || fonts[0];
  const bodyFont = fonts.find(font => font.id === resolvedBodyId) || fonts[1] || fonts[0];
  const uiFont = fonts.find(font => font.id === resolvedUiId) || fonts[2] || fonts[1] || fonts[0];
  const weightFor = (font?: Font) => font ? closestAvailableWeight(getEffectiveWeights(font), 400) : 400;
  const headingWeight = weightFor(headingFont);
  const bodyWeight = weightFor(bodyFont);
  const uiWeight = weightFor(uiFont);
  const headingStyle = actualStyleFor(headingFont);
  const bodyStyle = actualStyleFor(bodyFont);
  const uiStyle = actualStyleFor(uiFont);

  const suggestedFont = useMemo(() => {
    if (fonts.length >= 3 || fonts.length === 0 || !allFonts.length) return null;
    const baseFont = fonts[fonts.length - 1];
    const targetCategory = baseFont.categories.includes("serif") ? "sans-serif" : "serif";
    return allFonts.find(font => font.categories.includes(targetCategory) && !fonts.some(existing => existing.id === font.id)) || null;
  }, [fonts, allFonts]);

  const exportConfig = useMemo<WorkbenchExportConfig>(() => {
    const roleToken = (font: Font | undefined, role: WorkbenchFontToken["role"], weight: number, style: "normal" | "italic", roleLineHeight: number): WorkbenchFontToken | null => font ? {
      role,
      family: getEffectiveFamilyName(font),
      stack: getEffectiveCssStack(font),
      fallback: fallbackFamily(font),
      fontSize: mode === "compare" ? calculatedSizes[2] : role === "heading" ? calculatedSizes[preset === "interface" ? 3 : 4] : role === "body" ? calculatedSizes[preset === "interface" ? 0 : 1] : baseSize,
      weight,
      style,
      lineHeight: roleLineHeight,
      tracking,
      sourceLabel: getEffectiveSourceLabel(font),
      sourceUrl: getEffectiveSourceUrl(font),
      sourceCss: sourceCssFor(font, weight, style),
    } : null;
    return {
      version: 1,
      baseSize,
      scaleRatio,
      roles: [
        roleToken(headingFont, "heading", headingWeight, headingStyle, Math.max(1, lineHeight - 0.35)),
        roleToken(bodyFont, "body", bodyWeight, bodyStyle, lineHeight),
        roleToken(uiFont, "ui", uiWeight, uiStyle, 1.2),
      ].filter((role): role is WorkbenchFontToken => Boolean(role)),
    };
  }, [headingFont, bodyFont, uiFont, headingWeight, bodyWeight, uiWeight, headingStyle, bodyStyle, uiStyle, lineHeight, tracking, baseSize, scaleRatio, calculatedSizes, mode, preset]);
  const exportCode = useMemo(() => buildWorkbenchExport(exportFormat, exportConfig), [exportFormat, exportConfig]);

  const updateComparisonText = (value: string) => {
    const bounded = value.slice(0, 1000);
    setComparisonText(bounded);
    setPreviewText(bounded);
  };
  const resetTypography = () => {
    setBaseSize(DEFAULT_WORKBENCH_SETTINGS.baseSize);
    setScaleRatio(DEFAULT_WORKBENCH_SETTINGS.scaleRatio);
    setLineHeight(DEFAULT_WORKBENCH_SETTINGS.lineHeight);
    setTracking(DEFAULT_WORKBENCH_SETTINGS.tracking);
  };
  const resetRoles = () => {
    setHeadingFontId(fonts[0]?.id || "");
    setBodyFontId(fonts[1]?.id || fonts[0]?.id || "");
    setUiFontId(fonts[2]?.id || fonts[1]?.id || fonts[0]?.id || "");
    setPreset(DEFAULT_WORKBENCH_SETTINGS.preset);
  };
  const reorder = (index: number, direction: -1 | 1) => {
    if (!onReorder) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= fontIds.length) return;
    const next = [...fontIds];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onReorder(next);
  };
  const copyExport = async () => {
    if (await copyToClipboard(exportCode)) toast.success(copy.copied);
    else toast.error(copy.copyFailed);
  };
  const shareUrl = async () => {
    const url = new URL(window.location.href);
    url.search = serializeWorkbenchSearch(urlSettings, fontIds, url.search, includeTextInShare ? comparisonText : undefined).toString();
    if (await copyToClipboard(url.toString())) {
      setShareFallbackUrl("");
      toast.success(copy.shareCopied);
    } else {
      setShareFallbackUrl(url.toString());
      toast.error(copy.shareFailed);
    }
  };

  if (fonts.length === 0) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center bg-white p-8 text-center">
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-neutral-200"><Scale className="h-8 w-8 text-neutral-400" /></div>
        <h2 className="mb-8 text-6xl uppercase leading-none tracking-tighter md:text-8xl" style={{ fontWeight: 700 }}>{t("compare.emptyTitle")}</h2>
        <p className="mb-12 max-w-md font-mono text-xs uppercase leading-relaxed tracking-[0.2em] text-neutral-500 md:text-sm">{t("compare.emptyDesc")}</p>
        <button type="button" onClick={onBack} className="onod-button bg-neutral-900 px-12 py-5 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:bg-neutral-700">{t("compare.return")}</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white text-black" style={{fontSynthesis:"none"}}>
      <FontLoader fonts={fonts} requests={fonts.map(font => ({fontId:font.id,weight:weightFor(font),style:actualStyleFor(font)}))} />
      <header className="sticky top-16 z-40 flex min-h-16 flex-wrap items-stretch justify-between border-b border-neutral-300 bg-white">
        <div className="flex min-w-0 items-center">
          <button type="button" onClick={onBack} aria-label={t("back")} className="flex min-h-16 items-center gap-2 border-r border-neutral-300 px-4 transition-colors hover:bg-neutral-100 sm:px-6"><ArrowLeft className="h-4 w-4" aria-hidden="true" /><span className="hidden font-mono text-xs uppercase tracking-widest sm:inline">{t("back")}</span></button>
          <div className="min-w-0 px-4 sm:px-6"><div className="truncate text-sm font-semibold">{t("compare.systemWorkbench")}</div><div className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">{fonts.length} {t("compare.sources")}</div></div>
        </div>
        <div className="flex min-h-16 items-stretch">
          <label className="hidden max-w-56 cursor-pointer items-center gap-2 border-l border-neutral-300 px-4 font-mono text-[11px] leading-4 text-neutral-600 md:flex"><input type="checkbox" checked={includeTextInShare} onChange={event => setIncludeTextInShare(event.target.checked)} className="h-4 w-4 accent-black" />{copy.shareText}</label>
          <button type="button" onClick={shareUrl} className="onod-button flex items-center gap-2 border-l border-neutral-300 px-4 font-mono text-xs uppercase tracking-widest transition-colors hover:bg-neutral-100 sm:px-6" aria-label={t("share")}><Share2 className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">{t("share")}</span></button>
        </div>
      </header>

        <button type="button" aria-expanded={controlsOpen} aria-controls="workbench-controls" onClick={() => setControlsOpen(previous => !previous)} className="onod-button flex items-center justify-between border-b border-neutral-300 bg-neutral-50 px-5 py-4 font-mono text-xs uppercase tracking-widest lg:hidden"><span>{controlsOpen ? copy.hideControls : copy.showControls}</span><Type className="h-4 w-4" aria-hidden="true" /></button>
      <div className="grid lg:grid-cols-[320px_minmax(0,1fr)]">
        <section aria-label={language === "ru" ? "Результат сравнения" : "Comparison preview"} className="min-w-0 bg-white p-4 sm:p-8 lg:col-start-2 lg:row-start-1 lg:min-h-[calc(100vh-128px)] lg:p-12 xl:p-16">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-300 pb-5">
            <div className="flex gap-1" role="group" aria-label={language === "ru" ? "Режим верстака" : "Workbench mode"}>
              {(["compare", "pair"] as WorkbenchMode[]).map(item => <button key={item} type="button" aria-pressed={mode === item} onClick={() => setMode(item)} className={`onod-button border px-4 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors ${mode === item ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white hover:bg-neutral-100"}`}>{item === "compare" ? copy.comparison : copy.pairing}</button>)}
            </div>
            <div className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">{mode === "compare" ? copy.sampleHint : `${copy.heading} / ${copy.body} / ${copy.ui}`}</div>
          </div>

          {mode === "compare" ? (
            <section className="grid gap-px border border-neutral-300 bg-neutral-300 md:grid-cols-2 2xl:grid-cols-3" aria-label={copy.comparison}>
              {fonts.slice(0, 3).map(font => {
                const family = getEffectiveFamilyName(font);
                const actualWeight = weightFor(font);
                return (
                  <article key={font.id} className="flex min-h-[300px] flex-col bg-white p-6 sm:p-8">
                    <div className="mb-12 border-b border-neutral-200 pb-4"><div className="flex items-baseline justify-between gap-3"><h2 className="text-sm font-semibold">{family}</h2><span className="font-mono text-[11px] text-neutral-500">{actualWeight} / {actualStyleFor(font)}</span></div><FontRuntimeBadge font={font} copy={copy} /></div>
                    <FontCoverageNotice font={font} text={comparisonText || copy.previewHeading} /><p className="break-words" style={{ fontFamily: getEffectiveCssStack(font), fontSize: `${calculatedSizes[2]}px`, fontWeight: actualWeight, fontStyle: actualStyleFor(font), lineHeight, letterSpacing: `${tracking}em` }}>{comparisonText || copy.previewHeading}</p>
                    <div className="mt-auto pt-12 font-mono text-[11px] uppercase tracking-wide text-neutral-500">{getEffectiveAuthor(font)} · {getEffectiveSourceLabel(font)}</div>
                  </article>
                );
              })}
            </section>
          ) : (
            <><div className="mb-5 grid gap-3 sm:grid-cols-2">{fonts.map(font => <div key={font.id}><span className="text-sm font-semibold">{getEffectiveFamilyName(font)}</span><FontRuntimeBadge font={font} copy={copy} /><FontCoverageNotice font={font} text={comparisonText || copy.previewHeading} /></div>)}</div><PairPreview preset={preset} copy={copy} bodyText={comparisonText} headingFont={headingFont} bodyFont={bodyFont} uiFont={uiFont} headingWeight={headingWeight} bodyWeight={bodyWeight} uiWeight={uiWeight} headingStyle={headingStyle} bodyStyle={bodyStyle} uiStyleValue={uiStyle} sizes={calculatedSizes} lineHeight={lineHeight} tracking={tracking} /></>
          )}
        </section>



        <aside id="workbench-controls" className={`${controlsOpen ? "block" : "hidden"} order-first min-w-0 border-r border-neutral-300 bg-neutral-50 lg:order-none lg:col-start-1 lg:row-start-1 lg:block`} aria-label={copy.controls}>
          <section className="border-b border-neutral-300 p-5">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-mono text-[11px] uppercase tracking-widest text-neutral-600">{copy.sample}</h2><button type="button" onClick={() => updateComparisonText("")} className="onod-button flex items-center gap-1 font-mono text-[11px] uppercase text-neutral-500 hover:text-black"><RotateCcw className="h-3 w-3" />{copy.reset}</button></div>
            <textarea aria-label={copy.sample} value={comparisonText} onChange={event => updateComparisonText(event.target.value)} maxLength={1000} placeholder={t("preview.placeholder")} className="onod-input min-h-24 w-full resize-y border border-neutral-300 bg-white p-3 text-sm leading-relaxed outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-600" />
            <p className="mt-2 text-[11px] leading-4 text-neutral-500">{copy.sampleHint}</p>
            <label className="mt-4 flex cursor-pointer items-start gap-2 border-t border-neutral-200 pt-4 text-[11px] leading-4 text-neutral-700 md:hidden"><input type="checkbox" checked={includeTextInShare} onChange={event => setIncludeTextInShare(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-black" /><span>{copy.shareText}<span className="mt-1 block text-neutral-500">{copy.shareTextHint}</span></span></label>
            {shareFallbackUrl && <div className="mt-4"><label htmlFor="workbench-share-fallback" className="mb-1 block font-mono text-[11px] uppercase text-neutral-600">URL</label><textarea id="workbench-share-fallback" readOnly value={shareFallbackUrl} onFocus={event => event.currentTarget.select()} className="w-full resize-y border border-neutral-300 bg-white p-2 font-mono text-[11px] leading-4" /></div>}
          </section>

          {mode === "pair" && (
            <section className="border-b border-neutral-300 p-5">
              <div className="mb-4 flex items-center justify-between"><h2 className="font-mono text-[11px] uppercase tracking-widest text-neutral-600">{copy.roles}</h2><button type="button" onClick={resetRoles} className="onod-button flex items-center gap-1 font-mono text-[11px] uppercase text-neutral-500 hover:text-black"><RotateCcw className="h-3 w-3" />{copy.reset}</button></div>
              <div className="space-y-3">
                {([
                  ["workbench-heading", copy.heading, resolvedHeadingId, setHeadingFontId],
                  ["workbench-body", copy.body, resolvedBodyId, setBodyFontId],
                  ["workbench-ui", copy.ui, resolvedUiId, setUiFontId],
                ] as const).map(([id, label, value, setter]) => <div key={id}><label htmlFor={id} className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-neutral-600">{label}</label><select id={id} value={value} onChange={event => setter(event.target.value)} className="onod-input w-full border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-600">{fonts.map(font => <option key={font.id} value={font.id}>{getEffectiveFamilyName(font)}</option>)}</select></div>)}
              </div>
              <div className="mb-1.5 mt-4 font-mono text-[11px] uppercase tracking-wide text-neutral-600">{copy.layout}</div>
              <div className="flex gap-1" role="group" aria-label={copy.layout}>{(["article", "interface", "hero"] as WorkbenchPreset[]).map(item => <button key={item} type="button" aria-pressed={preset === item} onClick={() => setPreset(item)} className={`onod-button flex-1 border px-2 py-2 font-mono text-[11px] ${preset === item ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white"}`}>{copy[item]}</button>)}</div>
            </section>
          )}

          <section className="border-b border-neutral-300 p-5">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-mono text-[11px] uppercase tracking-widest text-neutral-600">{copy.typography}</h2><button type="button" onClick={resetTypography} className="onod-button flex items-center gap-1 font-mono text-[11px] uppercase text-neutral-500 hover:text-black"><RotateCcw className="h-3 w-3" />{copy.reset}</button></div>
            <div className="grid grid-cols-2 gap-3">
              <CommittedNumberField id="workbench-base" label={copy.base} value={baseSize} min={8} max={96} step={1} onCommit={setBaseSize} />
              <div><label htmlFor="workbench-ratio" className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-neutral-600">{copy.ratio}</label><select id="workbench-ratio" value={String(scaleRatio)} onChange={event => setScaleRatio(Number(event.target.value))} className="onod-input w-full border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-600">{WORKBENCH_RATIOS.map(value => <option key={value} value={String(value)}>{value.toFixed(3)}</option>)}</select></div>
              <CommittedNumberField id="workbench-line" label={copy.lineHeight} value={lineHeight} min={1} max={2.4} step={0.05} onCommit={setLineHeight} />
              <CommittedNumberField id="workbench-tracking" label={copy.tracking} value={tracking} min={-0.08} max={0.2} step={0.005} onCommit={setTracking} />
            </div>
            <div className="mt-5 space-y-1 border-t border-neutral-200 pt-3">{calculatedSizes.map((size, index) => <div key={SCALE_STEPS[index]} className="flex items-center justify-between py-1 font-mono text-[11px]"><span className="text-neutral-500">{SCALE_STEPS[index]}</span><span>{size}px</span></div>)}</div>
          </section>

          <section className="border-b border-neutral-300 p-5">
            <h2 className="mb-4 font-mono text-[11px] uppercase tracking-widest text-neutral-600">{copy.selected}</h2>
            <div className="space-y-2">
              {fonts.map((font, index) => {
                const family = getEffectiveFamilyName(font);
                const roles = [resolvedHeadingId === font.id ? copy.heading : "", resolvedBodyId === font.id ? copy.body : "", resolvedUiId === font.id ? copy.ui : ""].filter(Boolean).join(" · ");
                return <div key={font.id} className="border border-neutral-300 bg-white p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="truncate text-sm font-medium">{family}</div><div className="mt-1 font-mono text-[11px] leading-4 text-neutral-500">{index === 2 ? copy.candidate : roles || copy.source}</div></div><div className="flex shrink-0">{onReorder && <><button type="button" onClick={() => reorder(index, -1)} disabled={index === 0} aria-label={`${copy.moveUp}: ${family}`} className="onod-button p-1 text-neutral-500 hover:text-black disabled:opacity-25"><ArrowUp className="h-3.5 w-3.5" /></button><button type="button" onClick={() => reorder(index, 1)} disabled={index === fonts.length - 1} aria-label={`${copy.moveDown}: ${family}`} className="onod-button p-1 text-neutral-500 hover:text-black disabled:opacity-25"><ArrowDown className="h-3.5 w-3.5" /></button></>}<button type="button" onClick={() => removeFromCompare(font.id)} aria-label={`${copy.remove}: ${family}`} className="onod-button p-1 text-neutral-500 hover:text-black"><X className="h-4 w-4" /></button></div></div><FontRuntimeBadge font={font} copy={copy} /></div>;
              })}
            </div>
            {suggestedFont && toggleCompare && <button type="button" onClick={() => toggleCompare(suggestedFont.id)} className="onod-button mt-3 flex w-full items-center justify-center gap-2 border border-neutral-300 bg-white px-3 py-2 text-sm hover:border-neutral-600"><Type className="h-4 w-4" />{copy.addCandidate}: {getEffectiveFamilyName(suggestedFont)}</button>}
          </section>

          <section className="p-5">
            <h2 className="mb-4 font-mono text-[11px] uppercase tracking-widest text-neutral-600">{copy.export}</h2>
            <label htmlFor="workbench-export-format" className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-neutral-600">{copy.format}</label>
            <div className="flex gap-2"><select id="workbench-export-format" value={exportFormat} onChange={event => setExportFormat(event.target.value as WorkbenchExportFormat)} className="onod-input min-w-0 flex-1 border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-600">{(Object.keys(WORKBENCH_EXPORT_LABELS) as WorkbenchExportFormat[]).map(format => <option key={format} value={format}>{WORKBENCH_EXPORT_LABELS[format]}</option>)}</select><button type="button" onClick={copyExport} className="onod-button flex items-center gap-1.5 border border-neutral-900 bg-neutral-900 px-3 py-2 font-mono text-[11px] uppercase text-white hover:bg-neutral-700"><Copy className="h-3.5 w-3.5" />{copy.copy}</button></div>
            <pre tabIndex={0} className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words border border-neutral-300 bg-white p-3 font-mono text-[11px] leading-5 text-neutral-800">{exportCode}</pre>
          </section>
        </aside>
      </div>
    </div>
  );
};
