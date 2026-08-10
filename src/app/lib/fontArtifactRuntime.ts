import type { Font } from "../data/mockFonts";
import openArtifactRuntimeJson from "../data/verified/.generated/open-artifact-runtime.json" with { type: "json" };

export interface VerifiedOpenFontArtifact {
  family: string;
  sourceUrl: string;
  sha256: string;
  sfntFormat: "ttf-sfnt" | "otf-cff";
  axes: Record<string, { min: number; default: number; max: number }>;
}

const openArtifacts = openArtifactRuntimeJson as Record<string, VerifiedOpenFontArtifact>;

export function getVerifiedOpenFontArtifact(font: Font): VerifiedOpenFontArtifact | undefined {
  const artifact = openArtifacts[font.name];
  if (!artifact || artifact.family !== font.name) return undefined;
  return artifact;
}
