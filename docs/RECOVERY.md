# Standalone recovery

The repository was recovered from the original Figma Make export into a regular React/Vite source tree. GitHub `main` is the source of truth.

## 2026-08-08 catalog recovery

The first standalone migration contained a corrupt `fonts.json.gz` and only 507
rows across the emergency JSON shards. Those files could not represent the claimed
1,346-font catalog and failed both Node `gunzipSync` and browser gzip streaming.

The original bootstrap payload was recovered from Git history. One Base64 character
had been lost from the first payload part; inserting `I` at offset `3904` restored a
valid XZ stream and the complete original source tree. The full catalog generator is
now versioned directly in `src/app/data/mockFonts.ts` and sorted deterministically.

Validated catalog baseline:

- 1,346 font records;
- 1,346 unique IDs and names;
- 423 variable fonts;
- 261 fonts marked with Cyrillic support;
- zero records missing ID, name, source URL or weights.

`npm run check` passes locally (TypeScript and Vite production build). The lockfile
is versioned for reproducible installs.

## Pages deployment state

GitHub Pages is configured for `gh-pages` at the branch root. The repository API
reports `has_pages: true`, but the public URL still returns the GitHub Pages 404 until
the system `pages-build-deployment` job completes.

The current deployment blocker is shared GitHub Actions capacity, not the ONOD build.
The system Pages job has no assigned runner, while older account-level browser-test
jobs occupy hosted runners and a large earlier queue remains ahead of this repository.
Do not create additional Pages trigger commits while that queue is unresolved.
