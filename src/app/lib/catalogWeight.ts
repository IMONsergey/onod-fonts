import type { Font } from "../data/mockFonts";
import packagedWeightRanges from "../data/verified/packaged-preview-weight-ranges.json" with { type: "json" };
import { getVerifiedHistoricalFontArtifact, getVerifiedOpenFontArtifact } from "./fontArtifactRuntime";
import { getSpecimenWeights, getVerifiedFontshareFont, getVerifiedGoogleFont, getVerifiedIndependentFont } from "./fontTrust";

type WeightRange = readonly [number, number];
const availability = new Map<string, readonly WeightRange[]>();

function availableRanges(font: Font): readonly WeightRange[] {
  const weights = getSpecimenWeights(font).map(Number).filter(Number.isFinite);
  const single = (value: number): WeightRange => [value, value];

  if (font.commercialPackage) {
    // Some families ship italic-only weights, disjoint ranges or non-weight variable axes.
    const exception = packagedWeightRanges[font.id] as WeightRange[] | undefined;
    if (exception) return exception;

    const faces = font.commercialPackage.previewFaces;
    if (faces?.length) {
      const upright = faces.filter(face => face.style === "normal");
      return (upright.length ? upright : faces).map(face => single(face.weight));
    }
    if (font.commercialPackage.technicalVerified && font.variable && weights.length > 1) {
      return [[Math.min(...weights), Math.max(...weights)]];
    }
  } else {
    // Follow the same source priority as FontLoader. A single installed artifact cannot
    // display each static style described in the upstream family's metadata.
    const fontshare = getVerifiedFontshareFont(font);
    const artifact = !fontshare && (getVerifiedOpenFontArtifact(font) || getVerifiedHistoricalFontArtifact(font));
    if (artifact && !artifact.axes.wght) {
      const value = "weightClass" in artifact ? artifact.weightClass : (weights.includes(400) ? 400 : weights[0] ?? 400);
      return [single(value)];
    }
    const axis = fontshare?.axes.wght || artifact?.axes.wght || getVerifiedGoogleFont(font)?.axes.wght || getVerifiedIndependentFont(font)?.technical.axes?.wght;
    if (axis) return [[axis.min, axis.max]];
  }

  return (weights.length ? weights : [400]).map(single);
}

export function resolveCatalogWeight(font: Font, requested: number): number {
  let ranges = availability.get(font.id);
  if (!ranges) {
    ranges = availableRanges(font);
    availability.set(font.id, ranges);
  }
  const target = Number.isFinite(requested) ? requested : 400;
  let best = ranges[0][0];
  for (const [min, max] of ranges) {
    const candidate = Math.max(min, Math.min(max, target));
    const distance = Math.abs(target - candidate);
    const bestDistance = Math.abs(target - best);
    if (distance < bestDistance || (distance === bestDistance && candidate < best)) {
      best = candidate;
    }
  }
  return best;
}
