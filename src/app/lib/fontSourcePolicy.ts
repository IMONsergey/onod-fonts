import fontsharePoliciesJson from "../data/verified/fontshare-license-policies.json" with { type: "json" };

export type CapabilityDecision = "allowed" | "permission-required" | "unknown";

export interface FontLicenseCapabilities {
  personalUse: CapabilityDecision;
  commercialUse: CapabilityDecision;
  modification: CapabilityDecision;
  redistribution: CapabilityDecision;
  selfHosting: CapabilityDecision;
  providerApiHosting: CapabilityDecision;
  binaryInspection: CapabilityDecision;
}

export interface FontLicensePolicy {
  provider: "Fontshare";
  providerLicenseType: string;
  label: string;
  primaryLicenseUrl: string;
  capabilities: FontLicenseCapabilities;
  note: string;
}

const UNKNOWN_CAPABILITIES: FontLicenseCapabilities = {
  personalUse: "unknown",
  commercialUse: "unknown",
  modification: "unknown",
  redistribution: "unknown",
  selfHosting: "unknown",
  providerApiHosting: "unknown",
  binaryInspection: "unknown",
};

const FONTSHARE_POLICIES = fontsharePoliciesJson as Record<string, FontLicensePolicy>;

export function hasReviewedFontshareLicensePolicy(providerLicenseType: string) {
  return Object.prototype.hasOwnProperty.call(FONTSHARE_POLICIES, providerLicenseType);
}

export function getFontshareLicensePolicy(providerLicenseType: string): FontLicensePolicy {
  return FONTSHARE_POLICIES[providerLicenseType] || {
    provider: "Fontshare",
    providerLicenseType,
    label: providerLicenseType ? `Fontshare license: ${providerLicenseType}` : "Fontshare license: unverified",
    primaryLicenseUrl: "https://www.fontshare.com/licenses",
    capabilities: UNKNOWN_CAPABILITIES,
    note: "This provider license type has not yet been mapped to an ONOD capability policy. Keep all source-sensitive actions conservative until reviewed.",
  };
}

export function canInspectFontshareBinary(providerLicenseType: string) {
  return getFontshareLicensePolicy(providerLicenseType).capabilities.binaryInspection === "allowed";
}

export function canRedistributeFontshareBinary(providerLicenseType: string) {
  return getFontshareLicensePolicy(providerLicenseType).capabilities.redistribution === "allowed";
}
