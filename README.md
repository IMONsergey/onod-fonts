# ONOD Fonts

Standalone web version of **ONOD FONTS | DESIGN SPACE**, exported from Figma Make and normalized for regular React/Vite development.

## Local development

```bash
npm install
npm run dev
```

Production check:

```bash
npm run build
npm run preview
```

## Deployment

Every push to `main` builds and deploys the project through GitHub Actions to GitHub Pages. The workflow is stored in `.github/workflows/deploy-pages.yml`.

The production build automatically uses `/onod-fonts/` as the Vite base path. `dist/404.html` is generated during CI so React Router routes also work when opened directly on GitHub Pages.

## Origin

The UI originated as a Figma Make project and was converted into a standalone codebase. Figma-specific version-qualified package imports were normalized to standard npm imports.

<!-- bootstrap trigger -->
