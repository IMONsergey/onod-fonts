export type WorkbenchMode = "compare" | "pair";
export type WorkbenchPreset = "article" | "interface" | "hero";

export interface WorkbenchUrlSettings {
  mode: WorkbenchMode;
  preset: WorkbenchPreset;
  headingFontId: string;
  bodyFontId: string;
  uiFontId: string;
  baseSize: number;
  scaleRatio: number;
  lineHeight: number;
  tracking: number;
}

export interface ParsedWorkbenchUrl {
  settings: WorkbenchUrlSettings;
  fontIds: string[];
  hasFontsMarker: boolean;
  sharedText?: string;
}

export const DEFAULT_WORKBENCH_SETTINGS: WorkbenchUrlSettings = {
  mode: "compare",
  preset: "article",
  headingFontId: "",
  bodyFontId: "",
  uiFontId: "",
  baseSize: 16,
  scaleRatio: 1.25,
  lineHeight: 1.55,
  tracking: 0,
};

export const WORKBENCH_RATIOS = [1.067, 1.125, 1.2, 1.25, 1.333, 1.414, 1.5, 1.618] as const;

const PARAMS = [
  "fonts", "mode", "preset", "heading", "body", "ui", "base", "ratio", "line", "tracking",
  "h", "b", "content", "shareText",
] as const;

const clampNumber = (raw: string | null, fallback: number, min: number, max: number) => {
  if (raw === null || raw.trim() === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
};

const safeId = (raw: string | null) => (raw || "").trim().slice(0, 160);

const normalizeFontIds = (raw: string | null) => {
  if (raw === null || raw === "") return [];
  return Array.from(new Set(raw.split(",").map(safeId).filter(Boolean))).slice(0, 3);
};

export function parseWorkbenchSearch(search: string | URLSearchParams): ParsedWorkbenchUrl {
  const params = typeof search === "string"
    ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
    : new URLSearchParams(search);
  const mode = params.get("mode") === "pair" ? "pair" : "compare";
  const presetValue = params.get("preset");
  const preset: WorkbenchPreset = presetValue === "interface" || presetValue === "hero" ? presetValue : "article";
  const content = params.get("content");
  const ratio = clampNumber(params.get("ratio"), DEFAULT_WORKBENCH_SETTINGS.scaleRatio, 1.01, 2);

  return {
    settings: {
      mode,
      preset,
      headingFontId: safeId(params.get("heading") || params.get("h")),
      bodyFontId: safeId(params.get("body") || params.get("b")),
      uiFontId: safeId(params.get("ui")),
      baseSize: clampNumber(params.get("base"), DEFAULT_WORKBENCH_SETTINGS.baseSize, 8, 96),
      scaleRatio: WORKBENCH_RATIOS.includes(ratio as (typeof WORKBENCH_RATIOS)[number]) ? ratio : DEFAULT_WORKBENCH_SETTINGS.scaleRatio,
      lineHeight: clampNumber(params.get("line"), DEFAULT_WORKBENCH_SETTINGS.lineHeight, 1, 2.4),
      tracking: clampNumber(params.get("tracking"), DEFAULT_WORKBENCH_SETTINGS.tracking, -0.08, 0.2),
    },
    fontIds: normalizeFontIds(params.get("fonts")),
    hasFontsMarker: params.has("fonts"),
    sharedText: content === null ? undefined : content.slice(0, 1000),
  };
}

const numberParam = (value: number) => String(Number(value.toFixed(4)));

export function serializeWorkbenchSearch(
  settings: WorkbenchUrlSettings,
  fontIds: string[],
  current: string | URLSearchParams = "",
  sharedText?: string,
) {
  const params = typeof current === "string"
    ? new URLSearchParams(current.startsWith("?") ? current.slice(1) : current)
    : new URLSearchParams(current);

  PARAMS.forEach(param => params.delete(param));
  // The marker is intentionally present even for an empty selection. It makes
  // an empty shared Workbench authoritative over a recipient's local storage.
  params.set("fonts", Array.from(new Set(fontIds.filter(Boolean))).slice(0, 3).join(","));
  params.set("mode", settings.mode);
  params.set("preset", settings.preset);
  params.set("heading", settings.headingFontId);
  params.set("body", settings.bodyFontId);
  params.set("ui", settings.uiFontId);
  params.set("base", numberParam(settings.baseSize));
  params.set("ratio", numberParam(settings.scaleRatio));
  params.set("line", numberParam(settings.lineHeight));
  params.set("tracking", numberParam(settings.tracking));

  if (sharedText !== undefined) {
    params.set("shareText", "1");
    params.set("content", sharedText.slice(0, 1000));
  }

  return params;
}

export function sameSerializedSearch(a: string | URLSearchParams, b: string | URLSearchParams) {
  const left = typeof a === "string" ? new URLSearchParams(a.startsWith("?") ? a.slice(1) : a) : a;
  const right = typeof b === "string" ? new URLSearchParams(b.startsWith("?") ? b.slice(1) : b) : b;
  return left.toString() === right.toString();
}
