# ONOD Fonts — audit remediation release gates

Source audit: [`AUDIT-2026-08-10.md`](./AUDIT-2026-08-10.md)

Durable continuation context: [`PROJECT-CONTEXT.md`](./PROJECT-CONTEXT.md)

Operational trust queue: [`TRUST-DEBT.md`](./TRUST-DEBT.md)

This document tracks what is already enforced in the trust-engine release candidate and what deliberately moves to the next dedicated phases.

## Current release-candidate state

Latest fully green release-candidate measurement before the final documentation commit:

- catalog: **1,346** families;
- Google Fonts canonical evidence/runtime verification: **1,190** families;
- reviewed upstream aliases: **2**;
- remaining trust debt: **88** families;
- production dependency audit: **0 runtime vulnerabilities**;
- production build, GitHub Pages base-path validation, direct-route preview smoke and built-asset smoke: passing;
- initial production JS chunk still emits a large-chunk warning and is an explicit post-remediation performance task.

## Gate A — rendering truth

- [x] Replace Google batch-index cache keys with family-addressed keys.
- [x] Add `loading / ready / failed/fallback` family state.
- [x] Verify requested family through the browser FontFaceSet.
- [x] Request only trusted faces/axes; constrain derived records to conservative Regular 400.
- [x] Remove synthetic concrete weight/variable controls from unverified records.
- [ ] Add dedicated automated CDN/font-loader failure and retry browser tests.

Exit condition achieved for runtime semantics: a card no longer silently presents a failed system fallback as the requested family. Failure/retry automation moves to the browser-QA phase.

## Gate B — catalog truth

- [ ] Finish the normalized canonical catalog schema and move remaining legacy generation/ingestion out of runtime `mockFonts.ts`.
- [x] Add provenance/confidence to source-sensitive fields through the trust layer.
- [x] Add versioned Google Fonts `METADATA.pb` evidence with path and Git blob SHA.
- [x] Add an explicit reviewed alias registry; normalized/slug equality alone cannot grant verification.
- [x] Separate canonical evidence from compact generated browser metadata.
- [x] Eliminate array-index / blanket variable and weight heuristics from runtime semantics.
- [x] Validate license/source/script/face/evidence metadata at build time.
- [x] Make aggregate runtime stats depend on trust-safe effective metadata.
- [x] Correct known script enrichment issues and make script filters data-driven.
- [x] Generate a durable trust-debt queue grouped by source.
- [ ] Verify/enrich the remaining **88** non-canonical/legacy records from primary sources.
- [ ] Add verified download URLs only where redistribution/source terms permit them.

Gate B is safe enough for the trust-engine release, but not complete as a data-platform milestone. The remaining schema migration and 88-record enrichment move to Font Data Engine.

## Gate C — workflow continuity

- [x] Make catalog filter/sort/view/preview state URL-backed.
- [x] Make font-detail Back context-aware.
- [x] Encode compared font IDs and roles/settings into Workbench URLs.
- [x] Validate and normalize shared URL parameters.
- [x] Make all active filters visible/removable.
- [x] Restore license filter UI.
- [x] Make scripts data-driven rather than Latin/Cyrillic-only.
- [x] Restore intentional mobile equivalents for the core preview controls.

Exit condition achieved: navigation and sharing reproduce the working context rather than relying only on localStorage.

## Gate D — interaction quality

- [x] Replace the audited hover-only catalog menus with touch/keyboard-capable controls.
- [x] Replace audited click-only font-card/header interactions with semantic links/buttons.
- [x] Replace MarkBuilder click-only grid points with semantic keyboard-operable buttons.
- [x] Add Escape/cancel and accessible interaction state to MarkBuilder.
- [x] Complete custom Dialog focus trap, focus restore and accessible naming.
- [x] Complete mobile navigation focus trap/restore, Escape behavior and current-page semantics.
- [x] Add tab semantics to font details.
- [x] Honor reduced-motion preference globally and in Motion-heavy interactions.
- [x] Define intentional mobile equivalents for hidden desktop preview controls.
- [ ] Run a dedicated target-size/touch ergonomics audit across every secondary control.

Primary workflows are now usable by mouse, touch and keyboard; full automated accessibility coverage moves to Browser QA.

## Gate E — product semantics

- [x] Split `Source / Specimen` from `Download`.
- [x] Relabel pseudo-pairing until a meaningful scorer exists.
- [x] Replace generic Related wording with explicit same-category semantics.
- [x] Mark the current Glyphs view as a sample character set rather than verified cmap coverage.
- [x] Stop raw/untrusted weight counts from driving runtime filtering/ranking semantics.
- [ ] Implement real script-aware font-file glyph/cmap inspection.
- [ ] Make Workbench export include complete production loading/integration instructions and design-token outputs.

Labels now describe current behavior honestly. Real glyph intelligence and production export move to dedicated product phases.

## Gate F — QA / operations

- [x] Add structural catalog/evidence/trust validation.
- [ ] Add dedicated filter/ranking/URL-codec unit tests.
- [ ] Add Playwright full browser workflow tests.
- [x] Add production preview/direct-route smoke tests.
- [ ] Add axe automated accessibility checks.
- [ ] Add automated mobile viewport workflow tests.
- [ ] Add visual-regression screenshots for critical states.
- [ ] Add scheduled upstream source/font health checks.
- [x] Remove public Pages debug files and duplicate force-push diagnostics.
- [x] Make production high-severity dependency audit a repository CI blocker.
- [x] Patch React Router to 7.18.2 after the security gate caught vulnerable 7.13.0.
- [x] Make `npm run check` enforce metadata generation, evidence validation, TypeScript, build, Pages validation and preview smoke.
- [ ] Split/optimize the large initial JS chunk and add an explicit performance budget.

`npm run check` is now a meaningful release gate rather than a compile-only command. Full browser/a11y/performance automation moves to Browser QA / Performance.

## Gate G — localization / privacy / SEO

- [x] Synchronize document `lang` with UI language.
- [x] Complete RU/EN legal page localization for current behavior.
- [ ] Finish a dedicated RU/EN product-vocabulary editorial pass across every secondary screen.
- [x] Remove the third-party analytics/session-replay runtime until a deliberate consent architecture exists; align privacy disclosure with actual behavior.
- [ ] Replace the static/generic route metadata strategy with font-aware share/SEO metadata.
- [ ] Decide deep-route indexing/pre-render strategy for font pages.
- [x] Remove the fake whole-page invert-filter mode and its controls instead of presenting it as a real dark theme.

Public-facing privacy and theme behavior now match the actual application. SEO/indexing and final vocabulary polish remain separate workstreams.

## Merge boundary for PR #12

PR #12 may leave draft only when its **current head** passes all of the following:

1. `npm ci`;
2. `npm audit --omit=dev --audit-level=high`;
3. compact runtime metadata generation;
4. canonical evidence + reviewed aliases + catalog/trust validation;
5. TypeScript;
6. Vite production build;
7. GitHub Pages base-path/bundle validation;
8. production preview smoke for base URL, direct routes and JS/CSS assets;
9. PR remains mergeable;
10. no known P0/P1 regression introduced by the remediation diff.

After merge, do **not** continue growing the remediation branch. Start dedicated phases/PRs in this order:

1. Font Data Engine — close the remaining trust debt and build direct font-file inspection/provenance.
2. Glyph & Language Intelligence — real cmap/OpenType/language coverage.
3. Browser QA / Performance — Playwright, axe, mobile/visual regression, bundle/performance budgets.
4. Typography Intelligence / Pairing Engine — explainable real scoring.
5. Workbench 2.0 — role-based typography system builder and production export.
6. Global product/UI redesign around those real capabilities.
