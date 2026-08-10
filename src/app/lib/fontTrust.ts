import type { Font } from "../data/mockFonts";
import verifiedGoogleFontsJson from "../data/verified/.generated/google-fonts-runtime.json" with { type: "json" };
import verifiedFontshareJson from "../data/verified/.generated/fontshare-runtime.json" with { type: "json" };
import verifiedIndependentJson from "../data/verified/.generated/independent-runtime.json" with { type: "json" };
import fontsharePoliciesJson from "../data/verified/fontshare-license-policies.json" with { type: "json" };
import familyRelationsJson from "../data/verified/family-relations.json" with { type: "json" };
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

export interface VerifiedIndependentFont {
  family: string;
  identity: {
    sourceType: "official-github" | "official-web";
    repository?: string;
    sourceUrl: string;
    designer: string;
  };
  license: {
    status: "verified" | "pending";
    id?: string;
  };
  technical: {
    variable?: boolean;
    weights?: number[];
    axes?: Record<string, { min: number; max: number }>;
    scripts?: string[];
    weightsVerified: boolean;
    variableVerified: boolean;
    scriptsVerified: boolean;
  };
}

interface RuntimeHistoricalRelation {
  catalogFamily: string;
  status: "verified";
  relation: "historical-successor" | "provider-rename" | "collection-member";
  provider: string;
  historical: {
    family: string;
    sourceUrl: string;
    designer: string;
    licenseId?: string;
  };
  successor?: {
    family: string;
    sourceUrl: string;
  };
  loadReplacementAllowed: false;
  note: string;
}

interface RuntimeCatalogCorrection {
  catalogFamily: string;
  status: "verified";
  relation: "catalog-correction";
  provider: string;
  canonical: {
    family: string;
    sourceUrl: string;
    designer: string;
    licenseId: string;
    weights: number[];
    variable: boolean;
    scripts: string[];
  };
  loadReplacementAllowed: true;
  note: string;
}

type RuntimeFamilyRelation = RuntimeHistoricalRelation | RuntimeCatalogCorrection;

interface RuntimeFontsharePolicy {
  label: string;
  capabilities: FontLicenseCapabilities;
}

export interface FontTrustReport {
  confidence: FontDataConfidence;
  identityVerified: boolean;
  licenseVerified: boolean;
  weightsVerified: boolean;
  variableVerified: boolean;
  scriptsVerified: boolean;
  licenseLabel: string;
  warnings: string[];
  upstreamVerified: boolean;
  verificationSource?: string;
  provider?: "Google Fonts" | "Fontshare" | "Independent" | "Historical";
  licenseCapabilities?: FontLicenseCapabilities;
}

const verifiedGoogleFonts = verifiedGoogleFontsJson as Record<string, VerifiedGoogleFont>;
const verifiedFontshare = verifiedFontshareJson as Record<string, VerifiedFontshareFont>;
const verifiedIndependent = verifiedIndependentJson as Record<string, VerifiedIndependentFont>;
const fontsharePolicies = fontsharePoliciesJson as Record<string, RuntimeFontsharePolicy>;
const familyRelations = familyRelationsJson as unknown as Record<string, RuntimeFamilyRelation>;

const isGeneratedDescription = (font: Font) => {
  const description = font.description || "";
  return description.includes(" typeface by ") && description.includes(", available on ");
};

const getHistoricalSourceRelation = (font: Font): RuntimeHistoricalRelation | undefined => {
  const relation = familyRelations[font.name];
  if (!relation || relation.status !== "verified" || relation.catalogFamily !== font.name || relation.relation !== "historical-successor") return undefined;
  return relation;
};

const getCatalogCorrectionRelation = (font: Font): RuntimeCatalogCorrection | undefined => {
  const relation = familyRelations[font.name];
  if (!relation || relation.status !== "verified" || relation.catalogFamily !== font.name || relation.relation !== "catalog-correction" || relation.loadReplacementAllowed !== true) return undefined;
  return relation;
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

export function getVerifiedIndependentFont(font: Font): VerifiedIndependentFont | undefined {
  const candidate = verifiedIndependent[font.name];
  if (!candidate || candidate.family !== font.name) return undefined;
  return candidate;
}

export function getEffectiveFamilyName(font: Font) {
  return getCatalogCorrectionRelation(font)?.canonical.family || font.name;
}

export function getEffectiveCssStack(font: Font) {
  const family = getEffectiveFamilyName(font);
  if (family === font.name) return font.cssStack;
  const comma = font.cssStack.indexOf(',');
  const fallback = comma >= 0 ? font.cssStack.slice(comma) : ', sans-serif';
  return `'${family.replaceAll("'", "\\'")}'${fallback}`;
}

export function getFontTrustReport(font: Font): FontTrustReport {
  const google = getVerifiedGoogleFont(font);
  if (google) {
    return {
      confidence: "curated",
      identityVerified: true,
      licenseVerified: true,
      weightsVerified: true,
      variableVerified: true,
      scriptsVerified: true,
      licenseLabel: google.license,
      warnings: [],
      upstreamVerified: true,
      verificationSource: google.metadataPath,
      provider: "Google Fonts",
    };
  }

  const correction = getCatalogCorrectionRelation(font);
  if (correction) {
    return {
      confidence: "curated",
      identityVerified: true,
      licenseVerified: true,
      weightsVerified: true,
      variableVerified: true,
      scriptsVerified: true,
      licenseLabel: correction.canonical.licenseId,
      warnings: [`Recovered catalog spelling '${font.name}' is corrected to canonical family '${correction.canonical.family}' by reviewed primary-source evidence while preserving the stable catalog ID.`],
      upstreamVerified: true,
      verificationSource: correction.canonical.sourceUrl,
      provider: "Google Fonts",
    };
  }

  const fontshare = getVerifiedFontshareFont(font);
  if (fontshare) {
    const policy = fontsharePolicies[fontshare.licenseType];
    if (!policy) {
      return {
        confidence: "derived",
        identityVerified: true,
        licenseVerified: false,
        weightsVerified: true,
        variableVerified: true,
        scriptsVerified: Boolean(fontshare.script),
        licenseLabel: "Verify at source",
        warnings: [`Fontshare provider license type '${fontshare.licenseType}' has no reviewed ONOD capability policy.`],
        upstreamVerified: false,
        verificationSource: fontshare.sourceUrl,
        provider: "Fontshare",
      };
    }

    const warnings: string[] = [];
    if (policy.capabilities.redistribution !== "allowed" || policy.capabilities.binaryInspection !== "allowed") {
      warnings.push("This family is verified through Fontshare, but provider-hosted use does not imply permission for ONOD to mirror, redistribute, self-host, modify, or inspect the font binary. Use source-sensitive actions according to the provider license policy.");
    }
    return {
      confidence: "curated",
      identityVerified: true,
      licenseVerified: true,
      weightsVerified: true,
      variableVerified: true,
      scriptsVerified: Boolean(fontshare.script),
      licenseLabel: policy.label,
      warnings,
      upstreamVerified: true,
      verificationSource: fontshare.sourceUrl,
      provider: "Fontshare",
      licenseCapabilities: policy.capabilities,
    };
  }

  const independent = getVerifiedIndependentFont(font);
  if (independent) {
    const licenseVerified = independent.license.status === "verified" && Boolean(independent.license.id);
    const warnings: string[] = [];
    if (!licenseVerified) warnings.push("Primary source identity is verified, but the exact license is still pending review. Source actions are safe to expose; license-sensitive download/redistribution claims are not.");
    if (!independent.technical.weightsVerified) warnings.push("Source identity is verified, but exact weight metadata is still pending technical evidence; ONOD keeps preview weights conservative.");
    if (!independent.technical.variableVerified) warnings.push("Variable-font capability has not yet been independently verified for this family.");
    if (!independent.technical.scriptsVerified) warnings.push("Script/language coverage is not yet independently verified for this family.");
    return {
      confidence: licenseVerified ? "curated" : "derived",
      identityVerified: true,
      licenseVerified,
      weightsVerified: independent.technical.weightsVerified,
      variableVerified: independent.technical.variableVerified,
      scriptsVerified: independent.technical.scriptsVerified,
      licenseLabel: licenseVerified ? independent.license.id! : "Verify at source",
      warnings,
      upstreamVerified: licenseVerified,
      verificationSource: independent.identity.sourceUrl,
      provider: "Independent",
    };
  }

  const historical = getHistoricalSourceRelation(font);
  if (historical) {
    const licenseVerified = Boolean(historical.historical.licenseId);
    const successor = historical.successor?.family;
    return {
      confidence: licenseVerified ? "curated" : "derived",
      identityVerified: true,
      licenseVerified,
      weightsVerified: false,
      variableVerified: false,
      scriptsVerified: false,
      licenseLabel: historical.historical.licenseId || "Verify at source",
      warnings: [
        `This recovered family is verified as a historical ${historical.provider} identity. Technical metadata is intentionally conservative until a historical font artifact is inspected.`,
        ...(successor ? [`The project later continues as ${successor}. ONOD does not silently substitute the successor when the catalog asks for ${font.name}.`] : []),
      ],
      upstreamVerified: licenseVerified,
      verificationSource: historical.historical.sourceUrl,
      provider: "Historical",
    };
  }

  const confidence: FontDataConfidence = isGeneratedDescription(font) ? "derived" : "curated";
  const identityVerified = confidence === "curated";
  const licenseVerified = font.license !== "Open Source";
  const warnings: string[] = [];
  if (!identityVerified) warnings.push("Catalog identity/source metadata was generated from a recovered source manifest and has not yet been verified against a primary source.");
  if (!licenseVerified) warnings.push("The exact upstream license identifier is not recorded yet. Verify the license at the source before redistribution or commercial delivery.");

  return {
    confidence,
    identityVerified,
    licenseVerified,
    weightsVerified: identityVerified,
    variableVerified: identityVerified,
    scriptsVerified: identityVerified,
    licenseLabel: licenseVerified ? font.license : "Verify at source",
    warnings,
    upstreamVerified: false,
  };
}

export function isCatalogMetadataDerived(font: Font) {
  const trust = getFontTrustReport(font);
  return !trust.identityVerified || !trust.licenseVerified;
}

export function hasTrustedMetricMetadata(font: Font) {
  const trust = getFontTrustReport(font);
  return trust.weightsVerified || trust.variableVerified;
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

  const correction = getCatalogCorrectionRelation(font);
  if (correction) return correction.canonical.weights.map(String);

  const fontshare = getVerifiedFontshareFont(font);
  if (fontshare) {
    const weightAxis = fontshare.axes.wght;
    if (weightAxis) return variableWeightSteps(weightAxis.min, weightAxis.max);
    const weights = Array.from(new Set(fontshare.weights)).sort((a, b) => a - b).map(String);
    return weights.length ? weights : ["400"];
  }

  const independent = getVerifiedIndependentFont(font);
  if (independent) {
    if (!independent.technical.weightsVerified) return ["400"];
    const weightAxis = independent.technical.axes?.wght;
    if (weightAxis) return variableWeightSteps(weightAxis.min, weightAxis.max);
    const weights = Array.from(new Set(independent.technical.weights || [])).sort((a, b) => a - b).map(String);
    return weights.length ? weights : ["400"];
  }

  const trust = getFontTrustReport(font);
  if (!trust.weightsVerified) return ["400"];
  const weights = font.weights.filter(weight => /^\d+$/.test(weight));
  return weights.length ? weights : ["400"];
}

export function isEffectivelyVariable(font: Font) {
  const google = getVerifiedGoogleFont(font);
  if (google) return Object.keys(google.axes).length > 0;
  const correction = getCatalogCorrectionRelation(font);
  if (correction) return correction.canonical.variable;
  const fontshare = getVerifiedFontshareFont(font);
  if (fontshare) return fontshare.variable || Object.keys(fontshare.axes).length > 0;
  const independent = getVerifiedIndependentFont(font);
  if (independent) return independent.technical.variableVerified ? Boolean(independent.technical.variable) : false;
  const trust = getFontTrustReport(font);
  return trust.variableVerified && font.variable;
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

  const correction = getCatalogCorrectionRelation(font);
  if (correction) return correction.canonical.scripts;

  const fontshare = getVerifiedFontshareFont(font);
  if (fontshare) {
    if (!fontshare.script) return [];
    const script = subsetToScript(fontshare.script) || fontshare.script;
    return [script];
  }

  const independent = getVerifiedIndependentFont(font);
  if (independent) {
    if (independent.technical.scriptsVerified && independent.technical.scripts?.length) return independent.technical.scripts;
    return [];
  }

  if (getHistoricalSourceRelation(font)) return [];

  const trust = getFontTrustReport(font);
  if (!trust.scriptsVerified) return [];

  const languages = new Set(font.languages);
  const name = font.name.toLowerCase();
  if (name.startsWith("noto sans jp") || name.startsWith("noto serif jp")) languages.add("Japanese");
  if (name.startsWith("noto sans kr") || name.startsWith("noto serif kr")) languages.add("Korean");
  if (name.startsWith("noto sans tc") || name.startsWith("noto serif tc") || name.startsWith("noto sans sc") || name.startsWith("noto serif sc")) languages.add("Chinese");
  return Array.from(languages);
}

export function getEffectiveAuthor(font: Font) {
  return getVerifiedGoogleFont(font)?.designer
    || getCatalogCorrectionRelation(font)?.canonical.designer
    || getVerifiedFontshareFont(font)?.designer
    || getVerifiedIndependentFont(font)?.identity.designer
    || getHistoricalSourceRelation(font)?.historical.designer
    || font.author;
}

export function getEffectiveSourceUrl(font: Font) {
  return getVerifiedGoogleFont(font)?.repositoryUrl
    || getCatalogCorrectionRelation(font)?.canonical.sourceUrl
    || getVerifiedFontshareFont(font)?.sourceUrl
    || getVerifiedIndependentFont(font)?.identity.sourceUrl
    || getHistoricalSourceRelation(font)?.historical.sourceUrl
    || font.sourceUrl;
}

export function getEffectiveSourceLabel(font: Font) {
  if (getVerifiedGoogleFont(font) || getCatalogCorrectionRelation(font)) return "Google Fonts";
  if (getVerifiedFontshareFont(font)) return "Fontshare";
  if (getVerifiedIndependentFont(font)) return "Independent";
  const historical = getHistoricalSourceRelation(font);
  if (historical) return `${historical.provider} (historical)`;
  return font.source;
}

export function getEffectiveLicenseLabel(font: Font) {
  return getFontTrustReport(font).licenseLabel;
}

export function getEffectiveFontshareSlug(font: Font) {
  return getVerifiedFontshareFont(font)?.slug;
}
