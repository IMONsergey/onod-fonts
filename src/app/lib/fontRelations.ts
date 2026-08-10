import type { Font } from "../data/mockFonts";
import relationsJson from "../data/verified/family-relations.json" with { type: "json" };

export type FamilyRelationKind = "historical-successor" | "provider-rename" | "collection-member";

export interface VerifiedFamilyRelation {
  catalogFamily: string;
  status: "verified";
  relation: FamilyRelationKind;
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
  loadReplacementAllowed: boolean;
  note: string;
}

const relations = relationsJson as Record<string, VerifiedFamilyRelation>;

export function getVerifiedFamilyRelation(font: Font): VerifiedFamilyRelation | undefined {
  const relation = relations[font.name];
  if (!relation || relation.status !== "verified" || relation.catalogFamily !== font.name) return undefined;
  return relation;
}

export function getHistoricalSourceRelation(font: Font): VerifiedFamilyRelation | undefined {
  const relation = getVerifiedFamilyRelation(font);
  if (!relation || relation.relation !== "historical-successor") return undefined;
  return relation;
}
