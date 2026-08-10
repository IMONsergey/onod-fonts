import type { Font } from "@/data/mockFonts";

export type FontDataConfidence = "curated" | "derived";

export interface FontTrustReport {
  confidence: FontDataConfidence;
  licenseLabel: string;
  warnings: string[];
}

const isGeneratedDescription = (font: Font) => {
  const description = font.description || "";
  return description.includes(" typeface by ") && description.includes(", available on ");
};

export function getFontTrustReport(font: Font): FontTrustReport {
  const confidence: FontDataConfidence = isGeneratedDescription(font) ? "derived" : "curated";
  const warnings: string[] = [];

  if (confidence === "derived") {
    warnings.push("Catalog metadata for this family was generated from a source manifest and has not yet been fully verified against the upstream font files.");
  }

  if (font.license === "Open Source") {
    warnings.push("The exact upstream license identifier is not recorded yet. Verify the license at the source before redistribution or commercial delivery.");
  }

  const licenseLabel = font.license === "Open Source" ? "Verify at source" : font.license;
  return { confidence, licenseLabel, warnings };
}

export function isCatalogMetadataDerived(font: Font) {
  return getFontTrustReport(font).confidence === "derived";
}

export function hasTrustedMetricMetadata(font: Font) {
  return !isCatalogMetadataDerived(font);
}

export function getEffectiveWeights(font: Font) {
  if (!hasTrustedMetricMetadata(font)) return ["400"];
  const weights = font.weights.filter(weight => /^\d+$/.test(weight));
  return weights.length ? weights : ["400"];
}

export function isEffectivelyVariable(font: Font) {
  return hasTrustedMetricMetadata(font) && font.variable;
}

export function getEffectiveLanguages(font: Font) {
  const languages = new Set(font.languages);
  const name = font.name.toLowerCase();

  // Repair the legacy Early Access normalization bug without mutating the recovered source manifest.
  if (name.startsWith("noto sans jp") || name.startsWith("noto serif jp")) languages.add("Japanese");
  if (name.startsWith("noto sans kr") || name.startsWith("noto serif kr")) languages.add("Korean");
  if (name.startsWith("noto sans tc") || name.startsWith("noto serif tc") || name.startsWith("noto sans sc") || name.startsWith("noto serif sc")) languages.add("Chinese");

  return Array.from(languages);
}
