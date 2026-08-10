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

The intended product loop is:

`Discover -> Inspect -> Compare -> Build typography system -> Export`

The product should eventually know what is actually inside font files, not merely repeat provider descriptions. Core product values are metadata provenance, faithful font rendering, strong typography tooling, portable workspaces, and transparent uncertainty.

## Current primary remediation

Umbrella issue: **#11 — Audit remediation: restore catalog trust, font fidelity, and portable workflows**.

Primary branch: `feat/trust-engine`

Primary PR: **#12 — feat: ONOD Fonts trust engine — rendering truth and catalog integrity**

PR #12 is intentionally kept as a draft until the complete release gate is green after the final accessibility/QA/automation changes.

The audit and release plan are canonical background documents:

- `docs/AUDIT-2026-08-10.md`
- `docs/AUDIT-REMEDIATION-PLAN.md`

## What PR #12 changes

### Rendering truth

- Font loading is family-specific rather than batch-index keyed.
- `document.fonts` verifies whether the intended face actually registered.
- Font loading state is observable (`loading`, `ready`, `error`).
- Failed font loads display `FALLBACK`; system fallback is no longer silently presented as the requested font.
- Unverified metric records are constrained to conservative Regular 400 at runtime.

### Catalog trust

- Runtime trust layer: `src/app/lib/fontTrust.ts`.
- Runtime font state: `src/app/lib/fontRuntime.ts`.
- Canonical Google Fonts evidence: `src/app/data/verified/google-fonts.json`.
- Canonical evidence includes the Google Fonts `METADATA.pb` path and Git blob SHA.
- Explicitly reviewed family aliases live in `src/app/data/verified/google-fonts-aliases.json`.
- Normalized/slug equality never grants verification by itself. A non-exact upstream family name is trusted only when a reviewed alias is versioned.
- Current reviewed aliases include the catalog display names `Unifraktur Cook` -> upstream `UnifrakturCook` and `Unifraktur Maguntia` -> upstream `UnifrakturMaguntia`, verified against the official Google Fonts metadata.
- Compact runtime metadata is generated, not committed, under `src/app/data/verified/.generated/`.
- Generator: `scripts/build-runtime-metadata.mjs`.
- Google Fonts upstream sync: `scripts/sync-google-fonts.mjs` + `.github/workflows/sync-google-fonts.yml`.
- UI distinguishes verified/curated data from `META?`/derived data.
- Generic `Open Source` is not treated as an exact license identifier.

Latest fully green trust measurement before final workflow cleanup (CI run #88):

- 1,346 catalog families total.
- 1,190 families backed by versioned Google Fonts `METADATA.pb` evidence/runtime verification.
- 2 of those 1,190 use explicit reviewed family aliases.
- 88 derived records remain as trust debt.
- Derived records remain visibly marked and are constrained to Regular 400 until verified.
- production dependency audit reported 0 runtime vulnerabilities.

### Workspace continuity

- Catalog filter/search/sort/view/preview state is encoded in the URL.
- Details -> Back preserves originating Catalog/Favorites context.
- Workbench URLs include selected font IDs and typography settings; they are portable across browsers instead of depending only on localStorage.
- License/source/script filters are exposed consistently.
- Core preview controls are usable on mobile.

### Product semantics

- `Download` and `Source` are distinct actions.
- If no verified download URL exists, the UI does not imply that Source is a download.
- Previous pseudo-pairing is explicitly labeled as a contrast/category heuristic.
- Previous `Related` output is described as same-category rather than semantic similarity.
- Glyph panel is explicitly a sample character set until real cmap analysis exists.

### Safety, privacy and dependencies

- React Router was upgraded from 7.13.0 to patched 7.18.2 after CI caught high-severity production advisories.
- CI blocks high-severity production dependency advisories.
- Third-party Yandex Metrika/Webvisor/clickmap runtime was physically removed from `App.tsx`; the obsolete `window.ym` type was removed too.
- Privacy/Terms/License copy was aligned with actual runtime behavior and metadata uncertainty.
- The fake whole-page CSS invert theme and its UI controls were removed rather than presented as a real dark theme.

### Accessibility and motion

- `prefers-reduced-motion` is respected globally and Motion-heavy interactive components use reduced-motion-aware transitions.
- Custom Dialog has focus trapping, focus restoration and accessible title/description wiring.
- Header navigation uses semantic buttons, current-page semantics, keyboard focus states, Escape-close behavior and an accessible mobile menu.
- MarkBuilder 5x5 grid uses real buttons instead of click-only divs, supports keyboard activation, Escape cancellation, accessible point labels/status, and cancels stale animation timers.

### QA and deployment

- Catalog/evidence/trust validation: `scripts/validate-catalog.mjs`.
- Production bundle validation: `scripts/validate-build.mjs`.
- Production preview smoke: `scripts/smoke-preview.mjs`.
- `npm run check` now obligatorily runs metadata generation, catalog/evidence validation, TypeScript, Vite build, Pages bundle validation and production preview smoke.
- Smoke checks exercise the Pages base URL, direct Workbench route, direct font route and built assets.
- GitHub Pages emergency diagnostics/double-publish plumbing was removed after production recovered.
- `.github/workflows/sync-google-fonts.yml` and `.github/workflows/trust-debt-report.yml` are branch-safe for both the remediation branch and `main`; they no longer hard-code a future-dead feature branch as their push target.
- Metadata sync validates refreshed evidence before committing it.
- Trust debt is generated by `scripts/build-trust-report.mjs`; the generated repository report is `docs/TRUST-DEBT.md` when the report workflow has run.

## Important current validator architecture

Do not merge runtime and evidence responsibilities again.

Canonical evidence (`google-fonts.json`) contains audit/provenance-only fields such as `metadataSha` and exact upstream family names.

Compact runtime metadata deliberately excludes fields the browser does not need and rewrites a reviewed alias to the catalog identity while preserving optional `upstreamFamily` context. Therefore:

- browser/runtime code validates only runtime fields;
- build-time catalog validation separately reads the canonical evidence file and validates metadata paths, SHA provenance, licenses and source URLs;
- exact family identity is the default;
- a non-exact family identity passes only through `google-fonts-aliases.json`, which is explicitly validated against both the catalog and canonical evidence.

A prior CI failure occurred because the validator incorrectly required `metadataSha` from the compact runtime object. The fix is to validate canonical evidence separately rather than bloating the runtime map.

## Required release gate before merging PR #12

All of these must pass on the current PR head:

1. `npm ci`
2. `npm audit --omit=dev --audit-level=high`
3. generated runtime metadata succeeds
4. canonical evidence + reviewed aliases + catalog/trust validation succeeds
5. TypeScript succeeds
6. Vite production build succeeds
7. GitHub Pages base-path/bundle validation succeeds
8. production preview smoke succeeds for base URL, direct routes and JS/CSS assets
9. PR remains mergeable
10. no unresolved known P0/P1 regression from the audit

Only then mark PR #12 ready and merge it to `main`; deployment should happen from `main` automatically.

## Next large roadmap after PR #12

Work in this order unless repository reality dictates otherwise.

### Phase 1 — Font Data Engine

Goal: remove the remaining trust debt and establish direct font-file intelligence.

- Maintain an exact trust-debt queue grouped by source in `docs/TRUST-DEBT.md`.
- Verify non-Google/legacy records against primary sources.
- Record exact license identifiers and primary-source provenance.
- Add verified download URLs only where source/license terms support it.
- Build a font-file acquisition/cache layer for files we are allowed to inspect.
- Extract tables/metadata from actual files: `name`, `OS/2`, `fvar`, `STAT`, `GSUB`, `GPOS`, `cmap`, metrics and OpenType features.
- Keep provenance for every derived fact.

### Phase 2 — Glyph & Language Intelligence

Goal: replace script badges with real coverage knowledge.

- Parse real `cmap` coverage.
- Compute Unicode block/script coverage.
- Add useful language checks, especially Cyrillic/Russian/Ukrainian/Serbian/Bulgarian distinctions.
- Inspect punctuation, currency, arrows, math, ligatures and OpenType features.
- Surface coverage as factual data with confidence/provenance.

### Phase 3 — Browser QA / performance infrastructure

Goal: make regressions difficult to ship.

- Add Playwright browser E2E.
- Add mobile viewport flows.
- Add accessibility automation (`axe` or equivalent).
- Add visual regression screenshots for core routes/states.
- Test direct GitHub Pages routes, font CDN failure, empty/localStorage corruption and shareable Workbench URLs.
- Add performance budgets and bundle-size gates.
- Address the current large initial JS chunk; the trust release still emits a chunk-size warning and this becomes a measured performance task, not a suppressed warning.
- Add catalog virtualization / font-load throttling if needed.

### Phase 4 — Typography Intelligence / Pairing Engine

Goal: replace the current heuristic with a defensible scoring system.

Potential signals:

- classification contrast;
- x-height/proportions;
- width and visual density;
- stroke contrast;
- aperture/terminal characteristics where measurable;
- available weight/axis compatibility;
- script/language overlap;
- intended role (display, text, UI, code);
- variable/optical-size capabilities.

Recommendations must explain why a pair scores well and expose uncertainty.

### Phase 5 — Workbench 2.0

Goal: turn comparison into a typography-system builder.

- Roles: Display / Heading / Subheading / Body / Caption / UI / Data.
- Responsive modular scales.
- Line-height/tracking/measure constraints.
- Variable axes and optical sizing.
- Realistic specimens: editorial, UI, mobile, poster, data/table.
- Export CSS variables / `@font-face` / design tokens / Tailwind theme.
- Later: Figma variables/tokens integration.

### Phase 6 — Global product/UI redesign

Do this after Font/Glyph/Pairing intelligence exists, so UI is designed around real capabilities rather than the old catalog.

Desired direction:

- light, professional, typography-first interface;
- less decorative chrome, more actual specimen/data space;
- Search -> Discover -> Inspect -> Compare -> Build -> Export;
- contextual panels rather than duplicated controls;
- command/search palette;
- strong responsive behavior;
- no fake capability labels.

## Engineering rules

- GitHub is the source of truth.
- Prefer primary upstream sources for metadata.
- Never turn uncertain metadata into authoritative UI merely to make the catalog look complete.
- Slug/canonicalized-name equality is not evidence of family identity; only exact names or reviewed aliases are accepted.
- Do not manually edit generated runtime metadata.
- Do not hand-edit `gh-pages` production output.
- Do not run breaking dependency fixes with `--force` without understanding the change.
- A green compile alone is not a release gate.
- Preserve the 1,346-family recovered catalog baseline unless removal is intentional and documented.
- Do not suppress the large-chunk warning just to make CI quieter; either split the bundle or create an explicit measured budget.
- Every major architectural decision or discovered failure mode should be recorded in GitHub docs/issues/PRs.

## How to resume in a new session

1. Read this file.
2. Read Issue #11.
3. Read PR #12 and its latest CI run if PR #12 is still open.
4. Read `docs/AUDIT-2026-08-10.md` and `docs/AUDIT-REMEDIATION-PLAN.md` if broader context is needed.
5. Do not assume PR #12 is merge-ready until its latest head has a fully green release gate.
6. After PR #12 merges, create/use a dedicated Font Data Engine branch/PR instead of continuing unrelated work in the old remediation PR.
7. Use `docs/TRUST-DEBT.md` as the operational queue for the remaining source verification work once generated.
