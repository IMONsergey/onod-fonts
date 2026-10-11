import assert from "node:assert/strict";
import { compareCatalogRanks, rankCatalogEntry } from "./catalogRanking.ts";

const base = { id: "font-1", name: "PT Sans", canonicalName: "PT Sans", author: "ParaType", description: "A sans serif family", tags: ["humanist"] };

assert.equal(rankCatalogEntry(base, "PT Sans")?.tier, 0, "exact family comes first");
assert.equal(rankCatalogEntry({ ...base, aliases: ["Public Type Sans"] }, "Public Type Sans")?.tier, 1, "exact alias comes second");
assert.equal(rankCatalogEntry(base, "PT")?.tier, 2, "family prefix comes before token/metadata");
assert.equal(rankCatalogEntry(base, "Sans PT")?.tier, 3, "unordered family tokens remain discoverable");
assert.equal(rankCatalogEntry(base, "ParaType")?.tier, 4, "author matches rank below names");
assert.equal(rankCatalogEntry(base, "humanist")?.tier, 5, "description and tag matches remain discoverable");
assert.equal(rankCatalogEntry(base, "unrelated"), null, "unmatched entries are excluded");

const exact = rankCatalogEntry(base, "PT Sans");
const author = rankCatalogEntry(base, "ParaType");
assert.ok(exact && author && compareCatalogRanks(exact, author) < 0, "rank ordering is deterministic");

console.log("catalogRanking: 8 assertions passed");
