# ONOD Fonts — audit remediation release gates

Source audit: [`AUDIT-2026-08-10.md`](./AUDIT-2026-08-10.md)

This document turns the audit into release gates. Do not expand catalog scope aggressively until Gate A and Gate B are complete.

## Gate A — rendering truth

- [ ] Replace Google batch-index cache keys with content/family-addressed keys.
- [ ] Add `loading / ready / failed / fallback` family state.
- [ ] Verify requested family through the browser FontFaceSet.
- [ ] Request only authoritative faces/axes.
- [ ] Remove synthetic concrete weight controls from unverified records.
- [ ] Add loader failure/retry tests.

Exit condition: a card can never silently present a fallback font as the requested family.

## Gate B — catalog truth

- [ ] Introduce normalized catalog schema.
- [ ] Add provenance/confidence to source-sensitive fields.
- [ ] Move generation/ingestion out of runtime `mockFonts.ts`.
- [ ] Eliminate array-index / blanket variable and weight heuristics.
- [ ] Validate license/source/script/face metadata at build time.
- [ ] Make aggregate footer stats depend only on canonical records.
- [ ] Correct script enrichment including CJK records.

Exit condition: every fact shown as definitive in the UI is backed by canonical data/provenance.

## Gate C — workflow continuity

- [ ] Make catalog filter/sort/view state URL-backed or persistently stored.
- [ ] Make font-detail Back context-aware.
- [ ] Encode compared font IDs and roles into Workbench URLs.
- [ ] Validate shared URL parameters.
- [ ] Make all active filters visible/removable.
- [ ] Restore missing license filter UI.
- [ ] Make scripts dynamic rather than Latin/Cyrillic-only.

Exit condition: navigation and sharing reproduce the same workspace instead of resetting or relying on localStorage.

## Gate D — interaction quality

- [ ] Replace hover-only menus with keyboard/touch-capable menus.
- [ ] Replace clickable div/h3 controls with semantic links/buttons.
- [ ] Complete dialog/mobile-drawer focus management.
- [ ] Add tab semantics to font details.
- [ ] Add reduced-motion behavior.
- [ ] Define intentional mobile equivalents for hidden desktop controls.
- [ ] Increase small target hit areas.

Exit condition: primary workflows are usable by mouse, touch, and keyboard.

## Gate E — product semantics

- [ ] Split `Source / Specimen` from `Download`.
- [ ] Relabel pseudo-pairing until a meaningful scorer exists.
- [ ] Replace generic Related with explicit similarity/category semantics.
- [ ] Implement script-aware specimen/glyph inspection.
- [ ] Correct `Most Styles` vs weight-count sorting.
- [ ] Make Workbench export include actual loading/integration instructions.

Exit condition: labels describe what the product actually does.

## Gate F — QA / operations

- [ ] Add schema/data tests.
- [ ] Add filter/ranking/URL-codec unit tests.
- [ ] Add Playwright core workflow smoke tests.
- [ ] Add production direct-route tests.
- [ ] Add axe accessibility checks.
- [ ] Add mobile viewport smoke tests.
- [ ] Add scheduled source/font health checks.
- [ ] Remove public Pages debug files and duplicate force-push diagnostics.

Exit condition: `npm run check` evolves from a compile gate into a meaningful production quality gate.

## Gate G — localization / privacy / SEO

- [ ] Synchronize document `lang` with UI language.
- [ ] Complete legal page localization.
- [ ] Normalize Russian product vocabulary.
- [ ] Align actual analytics instrumentation with privacy disclosure and product policy.
- [ ] Replace static generic route metadata strategy.
- [ ] Decide deep-route indexing/pre-render strategy for font pages.
- [ ] Replace invert-filter theme with real theme tokens.

Exit condition: public-facing language, metadata, privacy disclosure, and theme behavior match the actual application.
