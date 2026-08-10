import type { Font } from "../data/mockFonts";
import relationsJson from "../data/verified/family-relations.json" with { type: "json" };

export type FamilyRelationKind = "historical-successor" | "historical-removed" | "provider-rename" | "collection-member" | "catalog-correction";

interface BaseRelation {
  catalogFamily: string;
  status: "verified";
  relation: FamilyRelationKind;
  provider: string;
  loadReplacementAllowed: boolean;
  note: string;
}

export interface HistoricalFamilyRelation extends BaseRelation {
  relation: "historical-successor" | "historical-removed" | "provider-rename" | "collection-member";
  loadReplacementAllowed: false;
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
}

export interface CatalogCorrectionRelation extends BaseRelation {
  relation: "catalog-correction";
  loadReplacementAllowed: true;
  canonical: {
    family: string;
    sourceUrl: string;
    designer: string;
    licenseId: string;
    weights: number[];
    variable: boolean;
    scripts: string[];
  };
}

export type VerifiedFamilyRelation = HistoricalFamilyRelation | CatalogCorrectionRelation;

const relations = relationsJson as unknown as Record<string, VerifiedFamilyRelation>;

export function getVerifiedFamilyRelation(font: Font): VerifiedFamilyRelation | undefined {
  const relation = relations[font.name];
  if (!relation || relation.status !== "verified" || relation.catalogFamily !== font.name) return undefined;
  return relation;
}

export function getHistoricalSourceRelation(font: Font): HistoricalFamilyRelation | undefined {
  const relation = getVerifiedFamilyRelation(font);
  if (!relation || relation.relation === "catalog-correction") return undefined;
  return relation;
}

export function getCatalogCorrection(font: Font): CatalogCorrectionRelation | undefined {
  const relation = getVerifiedFamilyRelation(font);
  if (!relation || relation.relation !== "catalog-correction" || relation.loadReplacementAllowed !== true) return undefined;
  return relation;
}
