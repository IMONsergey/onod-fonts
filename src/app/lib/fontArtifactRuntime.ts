import type { Font } from "../data/mockFonts";
import openArtifactRuntimeJson from "../data/verified/.generated/open-artifact-runtime.json" with { type: "json" };
import historicalArtifactRuntimeJson from "../data/verified/.generated/historical-artifact-runtime.json" with { type: "json" };

export interface VerifiedOpenFontArtifact {
  family: string;
  sourceUrl: string;
  sha256: string;
  sfntFormat: "ttf-sfnt" | "otf-cff";
  axes: Record<string, { min: number; default: number; max: number }>;
}

export interface VerifiedHistoricalFontArtifact {
  family: string;
  relation: "historical-successor" | "historical-removed";
  sourceUrl: string;
  sha256: string;
  weightClass: number;
  scripts: string[];
  axes: Record<string, { min: number; default: number; max: number }>;
}

const openArtifacts = openArtifactRuntimeJson as Record<string, VerifiedOpenFontArtifact>;
const historicalArtifacts = historicalArtifactRuntimeJson as Record<string, VerifiedHistoricalFontArtifact>;

export function getVerifiedOpenFontArtifact(font: Font): VerifiedOpenFontArtifact | undefined {
  const artifact = openArtifacts[font.name];
  if (!artifact || artifact.family !== font.name) return undefined;
  return artifact;
}

export function getVerifiedHistoricalFontArtifact(font: Font): VerifiedHistoricalFontArtifact | undefined {
  const artifact = historicalArtifacts[font.name];
  if (!artifact || artifact.family !== font.name) return undefined;
  return artifact;
}
