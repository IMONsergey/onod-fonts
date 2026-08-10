import type { Font } from "../data/mockFonts";
import verifiedGoogleFontsJson from "../data/verified/.generated/google-fonts-runtime.json" with { type: "json" };
import verifiedFontshareJson from "../data/verified/.generated/fontshare-runtime.json" with { type: "json" };
import fontsharePoliciesJson from "../data/verified/fontshare-license-policies.json" with { type: "json" };
import type { FontLicenseCapabilities } from "./fontSourcePolicy";

export type FontDataConfidence = "curated" | "derived";

interface VerifiedGoogleFont {
  family: string;
  designer: string;
  license: string;
  subsets: string[];
  axes: Record<string, { min: number; default?: number; max: number }>;
  weights: number[];
  repositoryUrl?: string;
  metadataPath: string;
}

export interface VerifiedFontshareFont {
  family: string;
  upstreamFamily?: string;
  upstreamId: string;
  slug: string;
  licenseType: string;
  designer: string;
  publisher?: string;
  script?: string;
  axes: Record<string, { min: number; default?: number; max: number }>;
  weights: number[];
  variable: boolean;
  sourceUrl: string;
}

interface RuntimeFontsharePolicy {
  label: string;
  capabilities: FontLicenseCapabilities;
}

export interface FontTrustReport {
  confidence: FontDataConfidence;
  licenseLabel: string;
  warnings: string[];
  upstreamVerified: boolean;
  verificationSource?: string;
  provider?: "Google Fonts" | "Fontshare";
  licenseCapabilities?: FontLicenseCapabilities;
}

const verifiedGoogleFonts = verifiedGoogleFontsJson as Record<string, VerifiedGoogleFont>;
const verifiedFontshare = verifiedFontshareJson as Record<string, VerifiedFontshareFont>;
const fontsharePolicies = fontsharePoliciesJson as Record<string, RuntimeFontsharePolicy>;

const isGeneratedDescription = (font: Font) => {
  const description = font.description || "";
  return description.includes(" typeface by ") && description.includes(", available on ");
};

export function getVerifiedGoogleFont(font: Font): VerifiedGoogleFont | undefined {
  const candidate = verifiedGoogleFonts[font.name];
  if (!candidate || candidate.family !== font.name) return undefined;
  return candidate;
}

export function getVerifiedFontshareFont(font: Font): VerifiedFontshareFont | undefined {
  const candidate = verifiedFontshare[font.name];
  if (!candidate || candidate.family !== font.name || font.source !== "Fontshare") return undefined;
  return candidate;
}

export function getFontTrustReport(font: Font): FontTrustReport {
  const google = getVerifiedGoogleFont(font);
  if (google) {
    return {
      confidence: "curated",
      licenseLabel: google.license,
      warnings: [],
      upstreamVerified: true,
      verificationSource: google.metadataPath,
      provider: "Google Fonts",
    };
  }

  const fontshare = getVerifiedFontshareFont(font);
  if (fontshare) {
    const policy = fontsharePolicies[fontshare.licenseType];
    if (!policy) {
      return {
        confidence: "derived",
        licenseLabel: "Verify at source",
        warnings: [`Fontshare provider license type '${fontshare.licenseType}' has no reviewed ONOD capability policy.`],
        upstreamVerified: false,
      };
    }

    const warnings: string[] = [];
    if (policy.capabilities.redistribution !== "allowed" || policy.capabilities.binaryInspection !== "allowed") {
      warnings.push("This family is verified through Fontshare, but provider-hosted use does not imply permission for ONOD to mirror, redistribute, self-host, modify, or inspect the font binary. Use source-sensitive actions according to the provider license policy.");
    }
    return {
      confidence: "curated",
      licenseLabel: policy.label,
      warnings,
      upstreamVerified: true,
      verificationSource: fontshare.sourceUrl,
      provider: "Fontshare",
      licenseCapabilities: policy.capabilities,
    };
  }

  const confidence: FontDataConfidence = isGeneratedDescription(font) ? "derived" : "curated";
  const warnings: string[] = [];
  if (confidence === "derived") warnings.push("Catalog metadata for this family was generated from a source manifest and has not yet been fully verified against the upstream font files.");
  if (font.license === "Open Source") warnings.push("The exact upstream license identifier is not recorded yet. Verify the license at the source before redistribution or commercial delivery.");

  return {
    confidence,
    licenseLabel: font.license === "Open Source" ? "Verify at source" : font.license,
    warnings,
    upstreamVerified: false,
  };
}

export function isCatalogMetadataDerived(font: Font) {
  return getFontTrustReport(font).confidence === "derived";
}

export function hasTrustedMetricMetadata(font: Font) {
  return Boolean(getVerifiedGoogleFont(font) || getVerifiedFontshareFont(font)) || !isCatalogMetadataDerived(font);
}

const variableWeightSteps = (min: number, max: number) => {
  const values = new Set<number>([Math.round(min), Math.round(max)]);
  const firstHundred = Math.ceil(min / 100) * 100;
  for (let value = firstHundred; value <= max; value += 100) values.add(value);
  return Array.from(values).filter(value => value >= min && value <= max).sort((a, b) => a - b).map(String);
};

export function getEffectiveWeights(font: Font) {
  const google = getVerifiedGoogleFont(font);
  if (google) {
    const weightAxis = google.axes.wght;
    if (weightAxis) return variableWeightSteps(weightAxis.min, weightAxis.max);
    const weights = Array.from(new Set(google.weights)).sort((a, b) => a - b).map(String);
    return weights.length ? weights : ["400"];
  }

  const fontshare = getVerifiedFontshareFont(font);
  if (fontshare) {
    const weightAxis = fontshare.axes.wght;
    if (weightAxis) return variableWeightSteps(weightAxis.min, weightAxis.max);
    const weights = Array.from(new Set(fontshare.weights)).sort((a, b) => a - b).map(String);
    return weights.length ? weights : ["400"];
  }

  if (!hasTrustedMetricMetadata(font)) return ["400"];
  const weights = font.weights.filter(weight => /^\d+$/.test(weight));
  return weights.length ? weights : ["400"];
}

export function isEffectivelyVariable(font: Font) {
  const google = getVerifiedGoogleFont(font);
  if (google) return Object.keys(google.axes).length > 0;
  const fontshare = getVerifiedFontshareFont(font);
  if (fontshare) return fontshare.variable || Object.keys(fontshare.axes).length > 0;
  return hasTrustedMetricMetadata(font) && font.variable;
}

const subsetToScript = (subset: string) => {
  const normalized = subset.toLowerCase().replace(/-ext$/, "");
  const map: Record<string, string> = {
    latin: "Latin", cyrillic: "Cyrillic", greek: "Greek", vietnamese: "Vietnamese", arabic: "Arabic", hebrew: "Hebrew",
    devanagari: "Devanagari", bengali: "Bengali", gurmukhi: "Gurmukhi", gujarati: "Gujarati", oriya: "Odia", odia: "Odia",
    tamil: "Tamil", telugu: "Telugu", kannada: "Kannada", malayalam: "Malayalam", thai: "Thai", lao: "Lao", khmer: "Khmer",
    myanmar: "Myanmar", sinhala: "Sinhala", tibetan: "Tibetan", korean: "Korean", japanese: "Japanese",
  };
  if (map[normalized]) return map[normalized];
  if (normalized.startsWith("chinese")) return "Chinese";
  return undefined;
};

export function getEffectiveLanguages(font: Font) {
  const google = getVerifiedGoogleFont(font);
  if (google) {
    const scripts = new Set(google.subsets.map(subsetToScript).filter((value): value is string => Boolean(value)));
    if (scripts.size) return Array.from(scripts);
  }

  const fontshare = getVerifiedFontshareFont(font);
  if (fontshare?.script) {
    const script = subsetToScript(fontshare.script) || fontshare.script;
    return [script];
  }

  const languages = new Set(font.languages);
  const name = font.name.toLowerCase();
  if (name.startsWith("noto sans jp") || name.startsWith("noto serif jp")) languages.add("Japanese");
  if (name.startsWith("noto sans kr") || name.startsWith("noto serif kr")) languages.add("Korean");
  if (name.startsWith("noto sans tc") || name.startsWith("noto serif tc") || name.startsWith("noto sans sc") || name.startsWith("noto serif sc")) languages.add("Chinese");
  return Array.from(languages);
}

export function getEffectiveAuthor(font: Font) {
  return getVerifiedGoogleFont(font)?.designer || getVerifiedFontshareFont(font)?.designer || font.author;
}

export function getEffectiveSourceUrl(font: Font) {
  return getVerifiedGoogleFont(font)?.repositoryUrl || getVerifiedFontshareFont(font)?.sourceUrl || font.sourceUrl;
}

export function getEffectiveFontshareSlug(font: Font) {
  return getVerifiedFontshareFont(font)?.slug;
}
