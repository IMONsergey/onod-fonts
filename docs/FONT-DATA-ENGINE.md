# ONOD Fonts — Font Data Engine

Status: active Phase 1 after Trust Engine

Primary issue: #15

Base foundation: Trust Engine PR #12, merged as `71dc94910b56b76bc8d5dc02dd7ff031582845d2`.

Operational queue: [`TRUST-DEBT.md`](./TRUST-DEBT.md)

Durable project handoff: [`PROJECT-CONTEXT.md`](./PROJECT-CONTEXT.md)

## Objective

Replace the remaining recovered/heuristic catalog claims with a source-aware data engine that can answer two different questions without conflating them:

1. **What does the primary provider/upstream say about this family?**
2. **What can ONOD prove from the actual font artifact?**

Provider evidence and file-derived facts must coexist with explicit provenance and precedence rather than overwriting each other inside `mockFonts.ts`.

## Current starting point

Trust debt after Trust Engine:

- 88 families total;
- 82 Fontshare;
- 5 Google Fonts legacy/currently-unmatched names;
- 1 Uncut / Indie record (`Fire Sans`).

Google Fonts evidence already provides the reference architecture: versioned canonical evidence, explicit reviewed aliases, generated compact runtime projection, and build-time validation.

## Fontshare licensing boundary

Primary Fontshare sources:

- Open Source / SIL OFL documentation: https://fontshare.com/licenses/sil-ofl
- Closed Source / ITF Free Font License: https://www.fontshare.com/licenses/itf-ffl
- About Fontshare / Indian Type Foundry: https://www.fontshare.com/about

Fontshare explicitly distinguishes:

- **Open Source** fonts governed by SIL Open Font License;
- **Closed Source** proprietary freeware governed by Indian Type Foundry Free Font License.

Both classes are offered free for personal/commercial use, but they are not interchangeable from a data or redistribution perspective. In particular, FFL restrictions make a provider-hosted/API use capability materially different from ONOD being allowed to mirror or redistribute the underlying font software.

Therefore:

- never infer `OFL` merely from `source === "Fontshare"`;
- never infer `ITF-FFL` merely from designer/foundry naming;
- require family-level primary evidence;
- treat download URL and redistribution capability as separate fields;
- prefer a primary-source action over mirroring when redistribution is not explicitly established.

## Data model

### Layer 1 — source evidence

Evidence is provider/upstream-specific and audit-oriented. It should retain enough detail to prove where a canonical fact came from.

Proposed common envelope:

```ts
interface EvidenceRecord<TPayload> {
  provider: string;
  catalogFamily: string;
  upstreamFamily: string;
  sourceUrl: string;
  capturedAt: string;
  sourceRevision?: string;
  sourceHash?: string;
  payload: TPayload;
}
```

`capturedAt` documents ingestion time; it does not replace a stable revision/hash when the upstream exposes one.

Evidence belongs in versioned source-specific files/directories and is not automatically browser payload.

### Layer 2 — canonical family facts

Canonical facts are the product’s reviewed interpretation of evidence.

```ts
interface CanonicalFontFacts {
  catalogFamily: string;
  identity: {
    upstreamFamily: string;
    confidence: "exact" | "reviewed-alias";
    evidenceRef: string;
  };
  license: {
    id: string;
    label: string;
    evidenceRef: string;
  };
  capabilities: {
    personalUse: boolean | "unknown";
    commercialUse: boolean | "unknown";
    modification: boolean | "unknown";
    redistribution: boolean | "unknown";
    selfHosting: boolean | "unknown";
    providerApiHosting: boolean | "unknown";
  };
  sourceAction: {
    url: string;
    label: "source" | "provider" | "specimen";
  };
  downloadAction?: {
    url: string;
    mode: "primary-download" | "onod-mirror";
    evidenceRef: string;
  };
  designer?: string;
  foundry?: string;
  faces?: CanonicalFaceFacts[];
}
```

Do not collapse legal capabilities into a single `license: string` field.

### Layer 3 — font artifact evidence

For artifacts ONOD is permitted to acquire/inspect, keep file-level provenance separate from provider metadata.

```ts
interface FontArtifactEvidence {
  family: string;
  sourceUrl: string;
  sha256: string;
  filename: string;
  format: "ttf" | "otf" | "woff" | "woff2";
  size: number;
  inspectedAt: string;
  tables: {
    name?: unknown;
    os2?: unknown;
    head?: unknown;
    hhea?: unknown;
    fvar?: unknown;
    stat?: unknown;
    cmap?: unknown;
    gsub?: unknown;
    gpos?: unknown;
  };
}
```

The raw artifact does **not** decide its legal license. Font metadata can contain useful copyright/license strings, but provider/upstream license evidence retains precedence for legal product semantics unless explicitly reviewed otherwise.

### Layer 4 — runtime projection

The browser receives only fields needed for UI/filtering/rendering. Provenance-heavy evidence stays out of the initial JS bundle.

Runtime projections are generated from canonical facts. They are never hand-edited.

## Provenance rules

1. Primary source beats secondary source.
2. Exact upstream identity beats normalized-name similarity.
3. Reviewed alias may bridge a proven naming difference.
4. Provider license evidence beats a generic recovered catalog label.
5. File-derived technical facts may override recovered technical heuristics when artifact identity is proven.
6. File-derived legal strings do not silently override provider license evidence.
7. Unknown stays unknown; do not manufacture completeness.
8. Every conversion from evidence to a definitive UI fact must be deterministic and testable.

## License capability rules

The UI should eventually ask for capability rather than parse labels ad hoc.

Examples:

- `OFL-1.1` can normally support broad use/modification/redistribution under OFL conditions, but the exact product action still needs a compliant implementation.
- `ITF-FFL-1.0` may support personal/commercial use while restricting redistribution/modification. ONOD should not present that as equivalent to OFL.
- A provider API may be allowed while ONOD mirroring the same binary is not.

Until a capability is established from evidence, it is `unknown`, not `false` and not `true`.

## Phase 1A — Fontshare evidence discovery

The immediate engineering task is to locate the most stable official family-level evidence exposed by Fontshare.

Candidates to evaluate:

1. official family page application data;
2. official Fontshare API responses used by the site;
3. official CSS/API headers or metadata if they contain identity/license data;
4. downloadable package metadata/license files from the primary provider, only when retrieval is permitted and stable.

Acceptance criteria for a discovery mechanism:

- family-level identity is explicit;
- license class is explicit or directly referenced;
- data is served by Fontshare/Indian Type Foundry, not a third-party catalog;
- result can be reproduced in CI without browser scraping when possible;
- failures do not silently convert records to a guessed license;
- evidence can be versioned or hashed.

## Phase 1B — Fontshare canonicalization

For each of the 82 Fontshare debt records:

- capture primary evidence;
- resolve exact identity or add reviewed alias;
- classify exact license (`OFL-1.1`, `ITF-FFL-1.0`, or another explicitly documented value);
- capture designer/foundry where available;
- capture real face/axis information when provider evidence supports it;
- derive license capabilities;
- decide Source / primary Download / provider API availability independently;
- generate runtime metadata;
- remove family from trust debt only when required fields are proven.

## Phase 1C — six legacy records

Investigate individually:

### Google queue

- Cederville Cursive
- Manual
- Name Sans
- Open Sans Condensed
- Source Sans Pro

Questions:

- does the family still exist under the same name in `google/fonts`?
- was it renamed, superseded or removed?
- is the recovered entry pointing to a historical family identity?
- should the catalog retain an explicit historical alias/replacement relation rather than silently renaming it?

### Other queue

- Fire Sans

The current `Uncut / Indie` source classification combined with a Google Fonts specimen URL is suspicious. Verify identity before correcting it. Do not assume it means `Fira Sans` solely because the names are similar.

## Phase 1D — font-file inspection engine

Initial technical extraction targets:

- identity: `name`;
- metrics/classification: `OS/2`, `head`, `hhea`;
- variable axes: `fvar`, `STAT`;
- character coverage: `cmap`;
- substitution/positioning capabilities: `GSUB`, `GPOS`;
- feature tags and useful glyph/metric summaries.

The first implementation should be deterministic and command-line driven so CI can validate generated evidence before any UI depends on it.

## Repository layout target

Proposed direction:

```text
src/app/data/evidence/
  google-fonts/
  fontshare/
  artifacts/

src/app/data/canonical/
  families.json
  aliases.json

src/app/data/verified/.generated/
  runtime-font-metadata.json

scripts/font-data/
  sync-google-fonts.mjs
  sync-fontshare.mjs
  inspect-font.mjs
  build-canonical.mjs
  validate-font-data.mjs
```

Migration should be incremental. Do not move the working Google evidence pipeline merely for aesthetic folder symmetry until the new common schema has proved itself.

## CI gates for Font Data Engine

Before this phase can merge:

- existing `npm run check` remains green;
- canonical/evidence validation understands each new source;
- no verified count can increase through normalized-name matching alone;
- no family can receive an exact license without evidence;
- duplicate/contradictory identities are errors;
- generated runtime projection is reproducible;
- trust-debt report is regenerated from canonical state;
- direct artifact inspection, when introduced, is hash-addressed and deterministic;
- license-aware Download/Source actions have tests at the data-policy level.

## Non-goals for this PR

Do not mix these into Font Data Engine unless needed to expose the data safely:

- global UI redesign;
- full Pairing Engine;
- Workbench 2.0;
- broad cmap language UX;
- full Playwright/visual regression infrastructure.

Those are subsequent dedicated phases.
