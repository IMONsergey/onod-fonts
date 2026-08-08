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
npm run typecheck
npm run build
npm run check
```

Preview the production bundle:

```bash
npm run preview
```

## GitHub Pages

Production is published from the `gh-pages` branch root. The branch contains a
runner-independent static fallback so the public catalog remains deployable even
when the React build workflow is unavailable.

The production Vite base path is `/onod-fonts/`. A future automated React deploy
must preserve `dist/404.html` so direct React Router routes resolve on GitHub Pages.

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
- added TypeScript validation and GitHub Pages CI/CD;
- made the font catalog order deterministic instead of random on every page load;
- hardened localStorage parsing and font loading retry behavior.

## Font data

The current bundled catalog contains 1,346 unique font records. Its generator and
source manifests live in `src/app/data/mockFonts.ts`; generated binary blobs are not
treated as source of truth.

## Source of truth

The `main` branch of this GitHub repository is the single source of truth for ONOD Fonts. All subsequent product changes and deployments should be committed here.
