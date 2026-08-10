# ONOD Fonts

Standalone web application for **ONOD FONTS | DESIGN SPACE** — a curated interface for discovering, previewing, comparing and testing typefaces.

The product was originally prototyped in Figma Make. The repository is now a regular React/Vite codebase and no longer depends on Figma Make runtime features.

## Stack

- React 18
- Vite 6
- TypeScript
- Tailwind CSS 4
- Motion
- React Router

## Local development

```bash
npm install
npm run dev
```

Quality and production checks:

```bash
npm run catalog:validate
npm run typecheck
npm run build
npm run build:validate
npm run check
```

`npm run check` is the release gate: catalog integrity/trust policy, TypeScript, production build, and GitHub Pages bundle validation must all pass.

Preview the production bundle:

```bash
npm run preview
```

## GitHub Pages

Production is deployed automatically from `main` by `.github/workflows/deploy-pages.yml`.
The workflow installs dependencies with `npm ci`, runs the full `npm run check` quality gate,
builds the Vite application, preserves a SPA `404.html`, adds `.nojekyll`, and publishes the
resulting `dist/` directory to the `gh-pages` branch root in a single deterministic publish step.

GitHub Pages remains configured to serve the root of `gh-pages`. The production Vite base path
is `/onod-fonts/`, so generated JS/CSS assets resolve correctly at the project Pages URL.
Do not maintain a separate hand-written fallback page in `gh-pages`; production output must come
from the canonical React/Vite application in `main`.

Public site: https://imonsergey.github.io/onod-fonts/

## Catalog trust model

The recovered catalog contains **1,346 unique family records**, but not every legacy field has the same confidence level.
The product therefore separates source-manifest claims from data that is safe to expose as verified runtime behavior.

Current policy:

- generated legacy records are classified as **derived** until upstream metadata is verified;
- derived metric records are rendered conservatively at Regular 400 and do not expose a `VAR` axis as confirmed;
- a generic `Open Source` label is not treated as an exact license identifier and is shown as **Verify at source** in details;
- runtime font loading is observable: a failed family is marked `FALLBACK` instead of silently rendering as a system font;
- script metadata can be repaired by the trust layer for known legacy normalization errors, while uncertain metadata remains explicitly marked;
- catalog validation blocks duplicate IDs/names, invalid URLs/weights and violations of the runtime trust policy.

The UI uses `META?` for records that still require upstream metadata verification. The goal is to remove that trust debt progressively, not to hide it behind authoritative-looking badges.

## Workspace URLs

Catalog state is encoded in the URL, including search, filters, sort, view mode and preview controls. Font detail navigation preserves the originating catalog/favorites context.

Workbench links are portable: selected font IDs, heading/body roles, modular scale settings and optional preview content are encoded in the URL rather than depending only on localStorage.

## Standalone migration

The Figma Make export has been normalized for independent development:

- removed `figma:asset/*` runtime resolution;
- reduced 55 exported image assets to the two assets actually used by the application;
- replaced opaque Figma asset hashes with maintainable filenames;
- normalized version-qualified package imports;
- reduced the dependency graph to packages actually imported by runtime code;
- replaced four Radix wrappers with small native React primitives;
- removed dead shadcn/Figma export files and empty Make templates;
- removed Make-specific Vite resolver logic;
- added TypeScript validation, catalog validation, build validation, CI and GitHub Pages CI/CD;
- made the font catalog order deterministic instead of random on every page load;
- hardened localStorage parsing and observable font loading behavior.

## Font data

The current bundled catalog contains 1,346 unique font records. Its generator and source manifests live in `src/app/data/mockFonts.ts`; generated binary blobs are not treated as source of truth.

The trust overlay lives in `src/app/lib/fontTrust.ts`, runtime font readiness in `src/app/lib/fontRuntime.ts`, and structural/trust validation in `scripts/validate-catalog.mjs`.

## Source of truth

The `main` branch of this GitHub repository is the single source of truth for ONOD Fonts. All subsequent product changes and deployments should be committed here.
