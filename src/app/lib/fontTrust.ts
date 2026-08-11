import type { Font } from "../data/mockFonts";
import verifiedGoogleFontsJson from "../data/verified/.generated/google-fonts-runtime.json" with { type: "json" };
import verifiedFontshareJson from "../data/verified/.generated/fontshare-runtime.json" with { type: "json" };
import verifiedIndependentJson from "../data/verified/.generated/independent-runtime.json" with { type: "json" };
import verifiedHistoricalArtifactsJson from "../data/verified/.generated/historical-artifact-runtime.json" with { type: "json" };
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

interface VerifiedHistoricalArtifact {
  family: string;
  relation: "historical-successor" | "historical-removed";
  sourceUrl: string;
  sha256: string;
  weightClass: number;
  scripts: string[];
  axes: Record<string, { min: number; default: number; max: number }>;
}

interface RuntimeHistoricalRelation {
  catalogFamily: string;
  status: "verified";
  relation: "historical-successor" | "historical-removed" | "provider-rename";
  provider: string;
  historical: {
    family: string;
    sourceUrl: string;
    designer: string;
    licenseId?: string;
    weights?: number[];
    variable?: boolean;
    scripts?: string[];
  };
  successor?: {
    family: string;
    sourceUrl: string;
  };
  loadReplacementAllowed: false;
  note: string;
}

interface RuntimeCollectionRelation {
  catalogFamily: string;
  status: "verified";
  relation: "collection-member";
  provider: string;
  collection: {
    family: string;
    sourceUrl: string;
    designer: string;
    members: string[];
    scripts: string[];
    license: {
      status: "pending" | "verified";
      id?: string;
    };
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

type RuntimeFamilyRelation = RuntimeHistoricalRelation | RuntimeCollectionRelation | RuntimeCatalogCorrection;

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
  provider?: "Google Fonts" | "Fontshare" | "Independent" | "Historical" | "Collection";
  licenseCapabilities?: FontLicenseCapabilities;
}

const verifiedGoogleFonts = verifiedGoogleFontsJson as Record<string, VerifiedGoogleFont>;
const verifiedFontshare = verifiedFontshareJson as Record<string, VerifiedFontshareFont>;
const verifiedIndependent = verifiedIndependentJson as Record<string, VerifiedIndependentFont>;
const verifiedHistoricalArtifacts = verifiedHistoricalArtifactsJson as Record<string, VerifiedHistoricalArtifact>;
const fontsharePolicies = fontsharePoliciesJson as Record<string, RuntimeFontsharePolicy>;
const familyRelations = familyRelationsJson as unknown as Record<string, RuntimeFamilyRelation>;

const isGeneratedDescription = (font: Font) => {
  const description = font.description || "";
  return description.includes(" typeface by ") && description.includes(", available on ");
};

const getHistoricalSourceRelation = (font: Font): RuntimeHistoricalRelation | undefined => {
  const relation = familyRelations[font.name];
  if (!relation || relation.status !== "verified" || relation.catalogFamily !== font.name) return undefined;
  if (!["historical-successor", "historical-removed", "provider-rename"].includes(relation.relation)) return undefined;
  return relation as RuntimeHistoricalRelation;
};

const getCollectionRelation = (font: Font): RuntimeCollectionRelation | undefined => {
  const relation = familyRelations[font.name];
  if (!relation || relation.status !== "verified" || relation.catalogFamily !== font.name || relation.relation !== "collection-member") return undefined;
  return relation;
};

const getCatalogCorrectionRelation = (font: Font): RuntimeCatalogCorrection | undefined => {
  const relation = familyRelations[font.name];
  if (!relation || relation.status !== "verified" || relation.catalogFamily !== font.name || relation.relation !== "catalog-correction" || relation.loadReplacementAllowed !== true) return undefined;
  return relation;
};

const getVerifiedHistoricalArtifact = (font: Font): VerifiedHistoricalArtifact | undefined => {
  const artifact = verifiedHistoricalArtifacts[font.name];
  const relation = getHistoricalSourceRelation(font);
  if (!artifact || !relation || artifact.family !== font.name || artifact.relation !== relation.relation) return undefined;
  return artifact;
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

  const collection = getCollectionRelation(font);
  if (collection) {
    const licenseVerified = collection.collection.license.status === "verified" && Boolean(collection.collection.license.id);
    return {
      confidence: licenseVerified ? "curated" : "derived",
      identityVerified: true,
      licenseVerified,
      weightsVerified: false,
      variableVerified: false,
      scriptsVerified: Boolean(collection.collection.scripts.length),
      licenseLabel: licenseVerified ? collection.collection.license.id! : "Verify at source",
      warnings: [
        `The recovered identity '${font.name}' is verified as the umbrella '${collection.collection.family}' collection containing ${collection.collection.members.join(" and ")}. ONOD does not silently choose a member family for rendering.`,
        ...(licenseVerified ? [] : ["The collection identity is verified, but exact license capabilities remain pending review."]),
        "Collection-level style counts do not prove CSS numeric weights or variable-font capability for the recovered umbrella record, so those technical fields remain conservative.",
      ],
      upstreamVerified: licenseVerified,
      verificationSource: collection.collection.sourceUrl,
      provider: "Collection",
    };
  }

  const historical = getHistoricalSourceRelation(font);
  if (historical) {
    const artifact = getVerifiedHistoricalArtifact(font);
    const licenseVerified = Boolean(historical.historical.licenseId);
    const metadataVerified = historical.relation === "historical-removed";
    const scriptsVerified = (metadataVerified && Boolean(historical.historical.scripts?.length)) || Boolean(artifact?.scripts?.length);
    const artifactVariableVerified = Boolean(artifact && Object.keys(artifact.axes).length > 0);
    const successor = historical.successor?.family;
    return {
      confidence: licenseVerified ? "curated" : "derived",
      identityVerified: true,
      licenseVerified,
      weightsVerified: metadataVerified && Boolean(historical.historical.weights?.length),
      variableVerified: (metadataVerified && typeof historical.historical.variable === "boolean") || artifactVariableVerified,
      scriptsVerified,
      licenseLabel: historical.historical.licenseId || "Verify at source",
      warnings: [
        metadataVerified
          ? `This recovered family is verified as a removed historical ${historical.provider} identity. Historical provider metadata is retained, and the exact historical binary is available for rendering without substituting another family.`
          : artifact
            ? `This recovered family is verified as a historical ${historical.provider} identity. An exact historical binary has been inspected and is used for rendering; cmap script coverage is factual, while family-wide weights remain conservative until broader historical package evidence exists.`
            : `This recovered family is verified as a historical ${historical.provider} identity. Technical metadata is intentionally conservative until a historical font artifact is inspected.`,
        ...(successor ? [`The project later continues as ${successor}. ONOD does not silently substitute the successor when the catalog asks for ${font.name}.`] : []),
      ],
      upstreamVerified: licenseVerified,
      verificationSource: artifact?.sourceUrl || historical.historical.sourceUrl,
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

  if (getCollectionRelation(font)) return ["400"];

  const historical = getHistoricalSourceRelation(font);
  if (historical?.relation === "historical-removed" && historical.historical.weights?.length) return historical.historical.weights.map(String);

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
  if (getCollectionRelation(font)) return false;
  const historical = getHistoricalSourceRelation(font);
  if (historical?.relation === "historical-removed" && typeof historical.historical.variable === "boolean") return historical.historical.variable;
  const artifact = getVerifiedHistoricalArtifact(font);
  if (artifact && Object.keys(artifact.axes).length > 0) return true;
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

  const collection = getCollectionRelation(font);
  if (collection) return collection.collection.scripts;

  const historical = getHistoricalSourceRelation(font);
  if (historical) {
    if (historical.relation === "historical-removed" && historical.historical.scripts?.length) return historical.historical.scripts;
    const artifact = getVerifiedHistoricalArtifact(font);
    if (artifact?.scripts?.length) return artifact.scripts;
    return [];
  }

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
    || getCollectionRelation(font)?.collection.designer
    || getHistoricalSourceRelation(font)?.historical.designer
    || font.author;
}

export function getEffectiveSourceUrl(font: Font) {
  return getVerifiedGoogleFont(font)?.repositoryUrl
    || getCatalogCorrectionRelation(font)?.canonical.sourceUrl
    || getVerifiedFontshareFont(font)?.sourceUrl
    || getVerifiedIndependentFont(font)?.identity.sourceUrl
    || getCollectionRelation(font)?.collection.sourceUrl
    || getVerifiedHistoricalArtifact(font)?.sourceUrl
    || getHistoricalSourceRelation(font)?.historical.sourceUrl
    || font.sourceUrl;
}

export function getEffectiveSourceLabel(font: Font) {
  if (getVerifiedGoogleFont(font) || getCatalogCorrectionRelation(font)) return "Google Fonts";
  if (getVerifiedFontshareFont(font)) return "Fontshare";
  if (getVerifiedIndependentFont(font)) return "Independent";
  const collection = getCollectionRelation(font);
  if (collection) return collection.provider;
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
