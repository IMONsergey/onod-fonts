# ONOD Fonts — platform audit / 2026-08-12

## Objective

Turn ONOD Fonts from a collection of typography demos and engineering surfaces into one coherent client-facing product while preserving the canonical font/trust engine.

## Product contract

- Primary job: discover, preview, save and inspect typefaces.
- Secondary job: build a small typography system in Workbench.
- Educational and provenance material remains available, but does not compete with the primary workflow.
- Interface palette is strictly black, white and neutral gray.
- Canonical font identity, licensing, provenance and artifact evidence remain source-of-truth data and are not weakened by UI simplification.

## Audit findings

### P0 — information architecture

1. Header gives Catalog, Workbench, Favorites, Protocol and About equal hierarchy. Protocol/About are informational routes and should be secondary.
2. Catalog was simplified in PR #22, but Favorites, Details, About and Protocol still belong to earlier UI generations.
3. Workbench depends on hidden compare state after compare controls were intentionally removed from catalog cards. Font selection must be self-contained in Workbench.
4. Details exposes engineering trust state before the actual specimen. Technical confidence belongs in a dedicated information tab, not the primary visual hierarchy.
5. The Details page includes a category-only pseudo-pairing recommendation. It is not strong enough to be a client-facing recommendation system and should be removed until a real scorer exists.

### P0 — startup / runtime

Current production main before this audit:

- entry JS: 912.25 kB minified / 237.93 kB gzip;
- Vite emits a >500 kB chunk warning;
- all top-level routes are eagerly imported;
- `motion/react` is pulled into the critical path by App/PageTransition/Header;
- catalog font requests are not globally concurrency-limited and do not wait for viewport proximity.

### P1 — consistency

1. Favorites duplicates a typography lab with a second sticky toolbar and tracking controls.
2. About is a motion-heavy showcase with kinetic letters, Mark Builder, ticker and decorative interaction unrelated to the primary product job.
3. Protocol uses cyber/debug language that reads as visual theatre instead of documentation.
4. Empty states use oversized display typography inconsistent with the quieter catalog.
5. Several advanced controls rely on placeholders rather than explicit accessible names.

### P1 — verification

The repository has strong build/data validation but no browser-level release gate on main. Critical user flows, mobile focus behavior and direct-route semantics should run in CI.

## Implementation decisions

- Keep Catalog synchronous; lazy-load every non-catalog route.
- Remove Motion from the critical App/PageTransition/Header path.
- Keep Protocol modules lazy and viewport-bound; simplify its shell/copy.
- Replace About showcase with a concise product/about page.
- Simplify Favorites to the same preview language as Catalog.
- Make Workbench own font selection (up to three families), roles, scale, share and export.
- Remove pseudo-pairing from Details and move provenance/trust information into Info.
- Bound font loading concurrency and use viewport proximity for catalog cards.
- Compact Google runtime metadata before bundling.
- Add an explicit startup performance budget.
- Add ChromeDriver browser QA without adding a browser-test runtime dependency.

## Non-goals

- No fuzzy font identity matching.
- No relaxation of license/provenance policy.
- No new AI pairing claims.
- No catalog-volume expansion.
- No color accents.

## Remaining independent work

Issue #17 remains the canonical data-curation backlog. A future Pairing Engine must be metric-based and explainable before recommendations return to the client UI.
