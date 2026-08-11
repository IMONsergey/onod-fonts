import googleRuntimeWireJson from "../data/verified/.generated/google-fonts-wire.json" with { type: "json" };

interface GoogleRuntimeWireRecord {
  d: string;
  l: string;
  s: string[];
  w: number[];
  a?: [string, number, number, number?][];
  r?: string;
  u?: string;
}

export interface VerifiedGoogleRuntimeFont {
  family: string;
  upstreamFamily?: string;
  designer: string;
  license: string;
  // This compatibility field now contains already-normalized script labels.
  // fontTrust's subsetToScript() accepts them equivalently.
  subsets: string[];
  axes: Record<string, { min: number; default?: number; max: number }>;
  weights: number[];
  repositoryUrl?: string;
  // Full path/SHA provenance remains in canonical google-fonts.json. Runtime UI
  // only needs an honest verification-source label, not 1,190 repeated paths.
  metadataPath: string;
}

const wire = googleRuntimeWireJson as Record<string, GoogleRuntimeWireRecord>;
const cache = new Map<string, VerifiedGoogleRuntimeFont>();

const decodeAxes = (axes: GoogleRuntimeWireRecord["a"]) => Object.fromEntries((axes || []).map(([tag, min, max, defaultValue]) => [tag, {
  min,
  ...(defaultValue !== undefined ? { default: defaultValue } : {}),
  max,
}]));

export function getGoogleRuntimeFont(family: string): VerifiedGoogleRuntimeFont | undefined {
  const cached = cache.get(family);
  if (cached) return cached;

  const record = wire[family];
  if (!record) return undefined;

  const decoded: VerifiedGoogleRuntimeFont = {
    family,
    ...(record.u ? { upstreamFamily: record.u } : {}),
    designer: record.d,
    license: record.l,
    subsets: record.s,
    axes: decodeAxes(record.a),
    weights: record.w,
    ...(record.r ? { repositoryUrl: record.r } : {}),
    metadataPath: "google/fonts METADATA.pb",
  };
  cache.set(family, decoded);
  return decoded;
}
