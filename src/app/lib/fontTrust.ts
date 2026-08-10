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
