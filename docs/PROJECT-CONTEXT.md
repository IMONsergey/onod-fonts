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

The product should know what is actually inside font files rather than merely repeat provider descriptions. Core product values are metadata provenance, faithful font rendering, strong typography tooling, portable workspaces, and transparent uncertainty.

## Completed foundation — Trust Engine

Umbrella audit issue: **#11 — Audit remediation: restore catalog trust, font fidelity, and portable workflows**.

Trust Engine PR: **#12 — feat: ONOD Fonts trust engine — rendering truth and catalog integrity**.

PR #12 was merged to `main` on 2026-08-10 as squash commit:

`71dc94910b56b76bc8d5dc02dd7ff031582845d2`

Canonical audit documents:

- `docs/AUDIT-2026-08-10.md`
- `docs/AUDIT-REMEDIATION-PLAN.md`
- `docs/TRUST-DEBT.md`

### Trust Engine state at merge

- catalog baseline: **1,346** families;
- Google Fonts canonical evidence/runtime verification: **1,190** families;
- explicit reviewed upstream aliases: **2**;
- remaining trust debt: **88** families;
- production dependency audit: **0 runtime vulnerabilities**;
- `npm run check` enforces runtime metadata generation, canonical evidence/trust validation, TypeScript, Vite build, GitHub Pages bundle validation and production preview/direct-route/asset smoke;
- the large initial JS chunk remains a known post-remediation performance task; do not suppress the warning without a measured budget or real code splitting.

### Rendering and trust rules now established

- Font loading is family-addressed rather than batch-index keyed.
- `document.fonts` verifies actual face registration.
- Failed font loads show `FALLBACK`; the product does not silently present system fallback as the requested family.
- Unverified metric records are constrained to conservative Regular 400 and cannot expose fake variable axes.
- Runtime trust layer: `src/app/lib/fontTrust.ts`.
- Runtime font state: `src/app/lib/fontRuntime.ts`.
- Canonical Google Fonts evidence: `src/app/data/verified/google-fonts.json`.
- Explicit reviewed Google family aliases: `src/app/data/verified/google-fonts-aliases.json`.
- Compact runtime metadata is generated under `src/app/data/verified/.generated/` and must not be hand-edited.
- Slug/canonicalized-name equality is discovery only, never proof of identity. A non-exact upstream family name is trusted only through a reviewed versioned alias.
- Current reviewed aliases include `Unifraktur Cook -> UnifrakturCook` and `Unifraktur Maguntia -> UnifrakturMaguntia`.
- Canonical evidence retains audit-only provenance such as exact `METADATA.pb` path and Git blob SHA; runtime metadata deliberately omits fields the browser does not need.

### Workflow / semantics / accessibility foundation

- Catalog search/filter/sort/view/preview state is URL-backed.
- Workbench links include selected font IDs and settings and are portable between browsers.
- Detail Back preserves source context.
- Source and Download are distinct product actions.
- Pairing/Related/Glyphs no longer overclaim capabilities.
- React Router is patched to 7.18.2 and high-severity production dependency audit is a CI blocker.
- Third-party analytics/session replay was removed until a deliberate consent architecture exists.
- Fake whole-page invert theme was removed.
- `prefers-reduced-motion` is respected.
- Dialog and mobile navigation trap/restore focus.
- MarkBuilder uses keyboard-operable semantic grid controls.

## Active phase — Font Data Engine

Primary issue: **#15 — Font Data Engine: close trust debt and inspect canonical font files**.

Active branch: `feat/font-data-engine`

Create/use a dedicated draft PR from that branch; do not reopen or continue PR #12 for new product work.

Operational queue: `docs/TRUST-DEBT.md`.

Current trust-debt composition:

- **82 Fontshare** families;
- **5 Google Fonts** legacy/currently-unmatched names: `Cederville Cursive`, `Manual`, `Name Sans`, `Open Sans Condensed`, `Source Sans Pro`;
- **1 Uncut / Indie** record: `Fire Sans`, currently carrying a suspicious Google Fonts URL and requiring identity verification.

### Critical Fontshare licensing finding

Fontshare’s own documentation distinguishes two materially different classes:

- Open Source families governed by SIL Open Font License (OFL);
- Closed Source / Indian Type Foundry families governed by ITF Free Font License (FFL).

Both may be free for use, but their redistribution/modification conditions differ. The recovered catalog’s blanket `Open Source` claim for the 82 Fontshare trust-debt records is therefore not acceptable as verified metadata.

Primary-source URLs and exact interpretation are recorded in Issue #15. Do not promote a Fontshare family to a verified license class without family-level primary evidence.

### Font Data Engine objectives

1. Build a primary-source Fontshare evidence pipeline and determine each family’s exact license class.
2. Add canonical/versioned provenance for source identity, license, designer/foundry and available faces/axes where supported by primary evidence.
3. Make Download/Source behavior license-aware; do not mirror/re-distribute proprietary FFL font software without explicit permission for that exact behavior.
4. Resolve the six non-Fontshare trust-debt records individually against primary sources.
5. Build a direct font-file acquisition/inspection layer for artifacts ONOD is allowed to inspect.
6. Extract and version useful file intelligence: `name`, `OS/2`, `head`, `hhea`, metrics, `fvar`, `STAT`, `cmap`, `GSUB`, `GPOS`, and OpenType features.
7. Retain provenance and define precedence between provider metadata, file-derived facts and manually reviewed aliases.
8. Regenerate `docs/TRUST-DEBT.md` after every enrichment pass and keep `npm run check` green.

## Following phases

### Phase 2 — Glyph & Language Intelligence

- real `cmap` coverage;
- Unicode block/script coverage;
- Russian/Ukrainian/Serbian/Bulgarian and other useful language checks;
- punctuation/currency/arrows/math/ligatures/OpenType capabilities;
- factual confidence/provenance in UI.

### Phase 3 — Browser QA / Performance

- Playwright full browser workflows;
- mobile viewport flows;
- axe accessibility automation;
- visual regression;
- direct GitHub Pages route/CDN-failure/localStorage/share-link scenarios;
- bundle/performance budgets and real code splitting/virtualization/load throttling as needed.

### Phase 4 — Typography Intelligence / Pairing Engine

Replace current category/contrast heuristic with explainable scoring using measurable font properties, role compatibility, script overlap, weights/axes and other defensible signals.

### Phase 5 — Workbench 2.0

Build role-based typography systems (Display / Heading / Subheading / Body / Caption / UI / Data), responsive scales, optical/variable settings and export to CSS/design tokens/Tailwind; later Figma variables/tokens.

### Phase 6 — Global product/UI redesign

Only redesign globally after the intelligence layers exist, so the interface is built around real capabilities rather than the old catalog structure.

## Engineering rules

- GitHub is the source of truth.
- Prefer primary upstream sources for metadata.
- Never turn uncertainty into authoritative UI for completeness.
- Exact identity or explicit reviewed alias is required for source-sensitive facts.
- Do not manually edit generated runtime metadata.
- Do not hand-edit `gh-pages` production output.
- Do not use breaking dependency fixes with `--force` without understanding the change.
- A green compile alone is not a release gate.
- Preserve the 1,346-family recovered baseline unless removal is intentional and documented.
- Do not suppress performance warnings merely to make CI quiet.
- Record every major architectural decision, source rule, failure mode and phase handoff in GitHub docs/issues/PRs.

## How to resume in a new session

1. Read this file.
2. Read Issue #15 and `docs/TRUST-DEBT.md`.
3. Inspect the current `feat/font-data-engine` branch and its draft PR.
4. Read Issue #11 / audit documents only when broader remediation context is needed.
5. Before major changes, read the current repository files/CI state; repository reality wins over this document.
6. Continue Font Data Engine until its own release gates are satisfied; do not mix Glyph Intelligence, global redesign or unrelated features into the same PR unless a shared foundation genuinely requires it.
