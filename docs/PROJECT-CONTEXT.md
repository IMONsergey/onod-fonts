# ONOD Fonts — durable project context

Last updated: 2026-08-10

This document is the durable handoff for continuing ONOD Fonts development when chat/session context is unavailable. GitHub is the source of truth; if this document conflicts with current repository state, current repository state wins.

## Repository and production

- Repository: `IMONsergey/onod-fonts`
- Default branch: `main`
- Public production: `https://imonsergey.github.io/onod-fonts/`
- Production deployment: `.github/workflows/deploy-pages.yml` builds the canonical React/Vite app from `main` and publishes `dist/` to `gh-pages`.
- Do not hand-maintain `gh-pages` or a separate emergency HTML application.

## Product direction

ONOD Fonts is evolving from a Figma Make-derived font catalog into a trustworthy typography operating environment.

Intended product loop:

`Discover -> Inspect -> Compare -> Build typography system -> Export`

Core values: metadata provenance, faithful rendering, transparent uncertainty, strong typography tooling, portable workspaces, and production-safe source/license semantics.

## Completed foundation — Trust Engine

Umbrella audit issue: **#11**.

Trust Engine PR: **#12**, merged to `main` as squash commit:

`71dc94910b56b76bc8d5dc02dd7ff031582845d2`

Trust Engine established:

- 1,346-family recovered catalog baseline;
- family-addressed observable font loading + `document.fonts` verification;
- visible `FALLBACK` instead of silent system fallback;
- conservative Regular 400 for unverified metric records;
- canonical Google Fonts evidence with `METADATA.pb` path + Git blob SHA;
- reviewed Google alias registry;
- generated compact runtime metadata under `src/app/data/verified/.generated/`;
- URL-backed Catalog/Workbench state;
- source/download semantic separation;
- patched React Router 7.18.2 + production security gate;
- privacy/theme/accessibility cleanup;
- production build/Pages/direct-route smoke validation.

Trust Engine state at merge:

- 1,190 Google Fonts families verified;
- 2 reviewed Google aliases;
- 88 trust-debt families;
- 0 production dependency vulnerabilities.

## Active phase — Font Data Engine

Primary issue: **#15 — Font Data Engine: close trust debt and inspect canonical font files**.

Active branch: `feat/font-data-engine`

Active draft PR: **#16 — feat: Font Data Engine — provenance, licensing and artifact intelligence**.

Architecture: `docs/FONT-DATA-ENGINE.md`

Operational reports:

- `docs/TRUST-DEBT.md`
- `docs/FONTSHARE-SOURCE-AUDIT.md`

### Current first-wave state

The first Fontshare evidence pass changed the trust picture materially.

Current canonical/runtime state:

- total catalog families: **1,346**;
- verified families across Google Fonts + current Fontshare evidence: **1,235**;
- fully clear families: **1,303**;
- remaining trust debt: **43**;
- verified variable families: **55**;
- current official Fontshare API evidence: **45** families;
- legacy/unmatched records that the recovered catalog labelled Fontshare but that are absent under those exact names in the current official Fontshare API: **37**;
- remaining unmatched Google legacy names: **5**;
- remaining `Uncut / Indie` suspicious record: **1** (`Fire Sans`).

The generated operational report is authoritative for the queue; do not hand-edit its counts.

### Fontshare primary-source discovery

Official Fontshare API used by the provider site:

`https://api.fontshare.com/v2/fonts`

The API exposes family-level source facts including:

- exact family name / slug / upstream id;
- `license_type`;
- publisher/designers;
- script/languages;
- variable axes;
- OpenType feature tags;
- styles, weights and variable flags;
- provider CDN file URLs;
- provider metrics/version.

Canonical evidence:

`src/app/data/verified/fontshare.json`

Reviewed identity aliases:

`src/app/data/verified/fontshare-aliases.json`

Current first-wave evidence contains **45 exact current-provider matches out of 82 recovered Fontshare-tagged records**. All 45 current matches expose:

`license_type: "itf_ffl"`

No open-source Fontshare license type appeared in this exact-current intersection.

### Critical legacy-source finding

The old `source: Fontshare` field is not trustworthy for all 82 recovered records.

Only 45 have current exact official API identity. **37 do not appear under those names in the current official Fontshare API.** They remain source-identity debt and must be re-sourced from primary evidence rather than receiving a guessed Fontshare license.

Generated queue:

`docs/FONTSHARE-SOURCE-AUDIT.md`

The 37 unmatched records include Aspekta, Cal Sans, Nohemi, Uncut Sans, Vercetti, Lausanne, Wotfard FS and others. Their existing recovered author/source/license fields are not evidence.

### Fontshare licensing / capability policy

Fontshare distinguishes Open Source/OFL families from proprietary ITF Free Font License families. The 45 current exact matches in our catalog are `itf_ffl`.

Versioned ONOD policy registry:

`src/app/data/verified/fontshare-license-policies.json`

Typed UI helper:

`src/app/lib/fontSourcePolicy.ts`

For reviewed `itf_ffl` policy, ONOD currently models:

- personal use: allowed;
- commercial use: allowed;
- provider API hosting: allowed;
- modification: permission-required;
- redistribution: permission-required;
- independent self-hosting: permission-required;
- binary inspection/reverse-engineering path: permission-required.

Important: a provider CDN file URL in evidence is **not** interpreted as ONOD redistribution/download/inspection permission.

The Font Data Engine must fail CI when a new upstream `license_type` appears without a reviewed versioned capability policy.

### Fontshare evidence pipeline

Sync script:

`scripts/sync-fontshare.mjs`

Evidence validator:

`scripts/validate-fontshare-evidence.mjs`

Workflow:

`.github/workflows/sync-fontshare.yml`

Release gate includes offline Fontshare evidence validation. Network sync is not part of normal `npm run check`.

Initial exact-current evidence floor is deliberately **40**, because the first official API comparison proved 45 exact matches and 37 legacy misses. The floor is a regression detector, not a claim that 40/82 is sufficient product completeness.

### Runtime integration

`scripts/build-runtime-metadata.mjs` now generates compact runtime projections for:

- Google Fonts evidence;
- Fontshare evidence.

Fontshare runtime projection includes only UI/runtime-relevant fields such as identity, provider slug, license type, verified designer/publisher, script, axes, weights/variable state and primary source URL. The very large provider language/style/evidence payload stays out of the initial browser bundle.

`src/app/lib/fontTrust.ts` consumes both Google and Fontshare generated runtime metadata.

For the 45 verified Fontshare families, the UI/runtime now receives:

- verified source identity;
- verified ITF FFL label through reviewed policy;
- official provider slug;
- real weights / `wght` axis / variable status;
- verified script;
- verified designer/publisher;
- primary Fontshare source URL;
- restrictions warning for source-sensitive actions.

`FontLoader` uses the official verified Fontshare slug when available rather than a guessed name slug.

Result measured by CI after runtime integration:

- trust debt: **43**;
- runtime verified: **1,235**;
- verified variable families: **55**.

### Remaining debt after first wave

#### Legacy/unmatched recovered Fontshare labels — 37

Use `docs/FONTSHARE-SOURCE-AUDIT.md` as the exact queue. Re-source each family from primary evidence; do not assume it is actually Fontshare.

#### Google legacy/currently-unmatched — 5

- Cederville Cursive
- Manual
- Name Sans
- Open Sans Condensed
- Source Sans Pro

Do not map through name similarity. Record an explicit historical rename/replacement relation only when primary upstream evidence proves it.

Source Sans upstream investigation has already found the current official Adobe source repository is **Source Sans 3** and Google Fonts carries Source Sans 3. This is not yet encoded as a catalog replacement; define the replacement/legacy model before changing the record.

#### Other — 1

- Fire Sans (`Uncut / Indie` recovered source with a suspicious Google Fonts URL).

Do not silently “fix” this to Fira Sans or another similar name without primary identity proof.

## Font Data Engine next implementation order

1. Keep PR #16 green after Fontshare runtime integration.
2. Update Issue #15 / PR #16 metadata with 45-current / 37-legacy / 43-debt state.
3. Investigate/re-source the 37 legacy Fontshare-tagged records using primary sources.
4. Define a canonical `replacement / historical-name / reviewed-alias` model for legacy Google families; resolve the five Google queue records.
5. Resolve Fire Sans identity.
6. Introduce direct font-artifact inspection **only for artifacts whose license/source capability policy permits inspection**.
7. Artifact pipeline should be hash-addressed and deterministic; target tables: `name`, `OS/2`, `head`, `hhea`, `fvar`, `STAT`, `cmap`, `GSUB`, `GPOS`.
8. Keep provider/legal evidence separate from file-derived technical facts.
9. Regenerate operational reports after every clear batch.
10. Keep `npm run check` and production security audit green.

## Following phases

### Phase 2 — Glyph & Language Intelligence

Real cmap/OpenType/language coverage, especially script/language distinctions that metadata labels cannot prove.

### Phase 3 — Browser QA / Performance

Playwright, axe, mobile/visual regression, CDN/localStorage/share-link failure scenarios, code splitting and explicit performance budgets.

### Phase 4 — Typography Intelligence / Pairing Engine

Explainable pairing/role compatibility based on measurable font properties rather than category pseudo-randomness.

### Phase 5 — Workbench 2.0

Role-based typography systems, responsive scales, variable/optical settings, CSS/design-token/Tailwind export, later Figma variables.

### Phase 6 — Global product/UI redesign

Only after the intelligence layers exist.

## Engineering rules

- GitHub is the source of truth.
- Primary source beats secondary source.
- Exact identity or explicit reviewed alias/replacement is required for source-sensitive facts.
- A recovered provider label is not evidence.
- A provider API/CDN URL is not automatically a redistribution or inspection right.
- Unknown stays unknown.
- Every newly seen provider license type requires reviewed policy before it can become verified runtime truth.
- Do not manually edit generated runtime metadata.
- Do not hand-edit `gh-pages` production output.
- Preserve the 1,346-family recovered baseline unless removal is intentional and documented.
- A green compile alone is not a release gate.
- Do not suppress performance warnings just to make CI quiet.
- Record major source rules, architectural decisions, failure modes and phase handoffs in GitHub.

## How to resume in a new session

1. Read this file.
2. Read Issue #15 and draft PR #16.
3. Read `docs/TRUST-DEBT.md` and `docs/FONTSHARE-SOURCE-AUDIT.md`.
4. Inspect latest PR #16 CI and branch files; repository reality wins over this document.
5. Continue Font Data Engine; do not mix Pairing Engine, Workbench 2.0 or global redesign into PR #16.
