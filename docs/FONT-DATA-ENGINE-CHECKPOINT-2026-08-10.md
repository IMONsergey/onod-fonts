# ONOD Fonts — Font Data Engine checkpoint

Date: 2026-08-10

Use this checkpoint together with `docs/PROJECT-CONTEXT.md`, Issue #15 and draft PR #16. Repository state always wins if newer commits conflict with this document.

## Active development state

Trust Engine is merged to `main` as `71dc94910b56b76bc8d5dc02dd7ff031582845d2`.

Active work:

- Issue #15 — Font Data Engine
- branch `feat/font-data-engine`
- draft PR #16
- recovered catalog baseline: **1,346 families**

PR #16 is intentionally still draft. Do not merge it until a current human-authored head passes the full release gate after all evidence/runtime changes.

## Current trust model

Verification is field-level, not all-or-nothing.

`FontTrustReport` separates:

- `identityVerified`
- `licenseVerified`
- `weightsVerified`
- `variableVerified`
- `scriptsVerified`

This distinction is mandatory. A primary source may prove family identity while the exact license remains unresolved; a font binary may prove technical facts without changing legal/provider facts.

Latest generated trust report after web identity + artifact projection:

- catalog: **1,346**
- identity trust debt: **36**
- license trust debt: **38**
- source/license union debt: **38**
- source + license clear: **1,308**
- exact weights pending: **38**
- variable capability pending: **38**
- script coverage pending: **38**

Canonical operational report:

`docs/TRUST-DEBT.md`

## Fontshare current-provider evidence

Recovered catalog contained 82 records labelled `source: Fontshare`.

Official current Fontshare API comparison proved:

- **45** exact/reviewed current Fontshare identities;
- **37** legacy/unmatched recovered Fontshare labels;
- all 45 exact-current records report raw `license_type: itf_ffl`.

Canonical evidence:

- `src/app/data/verified/fontshare.json`
- `src/app/data/verified/fontshare-aliases.json`
- `src/app/data/verified/fontshare-license-policies.json`

Operational identity audit:

`docs/FONTSHARE-SOURCE-AUDIT.md`

Current `itf_ffl` policy keeps modification, redistribution, self-hosting and binary inspection permission-gated. Provider CDN/API availability is not treated as permission for ONOD to mirror, modify or reverse-engineer font software.

## Independent primary-source evidence

Five recovered Fontshare-tagged families were re-sourced to official GitHub repositories and exact OFL-1.1 evidence:

1. Aspekta — `ivodolenc/aspekta`
2. Cal Sans — `calcom/sans`
3. Hauora — `WCYS-Co/Hauora-Sans`
4. Overused Grotesk — `RandomMaerks/Overused-Grotesk`
5. Uncut Sans — `kaspernordkvist/uncut_sans`

Canonical repository evidence:

`src/app/data/verified/independent-sources.json`

Validator:

`scripts/validate-independent-sources.mjs`

### Identity-only official-web evidence

Two additional families now have primary-source identity evidence while license remains deliberately pending:

- **Lausanne** — official WELTKERN page, designer Nizar Kazan;
- **Nohemi** — official Rajesh Rajput product page.

Canonical staged evidence:

`src/app/data/verified/independent-web-sources.json`

Validator:

`scripts/validate-independent-web-sources.mjs`

Runtime projection now merges official-GitHub and approved official-web identities into `independent-runtime.json` with collisions rejected. Lausanne/Nohemi must appear as `identityVerified=true`, `licenseVerified=false`, with technical fields pending.

## Canonical source/license facets

Catalog filtering/search is no longer allowed to use recovered raw source/license claims after re-sourcing.

Effective helpers in `src/app/lib/fontTrust.ts` provide:

- canonical author;
- canonical source URL;
- canonical source label;
- canonical license label;
- effective weights/scripts/variable state.

`useFontFilter` and `FilterPanel` use these effective facts. Re-sourced independent families must not remain counted as `Fontshare / Open Source` merely because the legacy manifest says so.

## Open font artifact engine

Only official-GitHub families with verified `OFL-1.1` are eligible for binary acquisition/inspection.

ITF FFL families are excluded.

Acquisition does not commit font binaries. CI downloads a primary artifact temporarily, computes evidence, then commits only metadata/provenance.

Core implementation:

- `scripts/font-data/acquire-open-artifacts.mjs`
- `scripts/font-data/inspect-sfnt.mjs`
- `scripts/font-data/validate-open-artifacts.mjs`
- `scripts/font-data/validate-open-artifacts-strict.mjs`
- `src/app/data/verified/artifacts/open-fonts.json`

Current acquisition result: **5 eligible / 5 inspected**.

Inspected artifacts:

- Aspekta — `packages/fonts/variable/AspektaVF.ttf` — SHA-256 `aca4bea0033de37093916756e44cfa4e823a928316905732ecc03a070d218dda`
- Cal Sans — `fonts/calsans-gf-api/CalSans[GEOM,SHRP,YTAS,opsz,wght].ttf` — SHA-256 `28646b365180d27bab7604e82e307760366199f9741856092eb1fd6c16d2444e`
- Hauora — `fonts/variable/Hauora[wght].ttf` — SHA-256 `308fab3575c94ab85a4b017d80d450c0d05c5ecd4fffb86616ff8449f1c0afea`
- Overused Grotesk — `fonts/variable/OverusedGrotesk-VF.ttf` — SHA-256 `81fe7ec52c68803073edbfab73474b93cd843df53e498e69a22dba42410b2176`
- Uncut Sans — `Variable/UncutSans-Variable.ttf` — SHA-256 `9a7ef47d2d71dbb807d4d1d24331230fcf63cdf5312daa0439891f54664d89dc`

Extracted technical evidence includes:

- SHA-256 + Git blob SHA
- SFNT table directory
- `name`
- `head`
- `hhea`
- `maxp`
- `OS/2`
- `fvar`
- Unicode `cmap` ranges/count
- GSUB/GPOS feature tags
- STAT presence

`build-runtime-metadata.mjs` now upgrades independent technical trust from inspected binaries:

- `fvar` supplies actual variable axes and weight ranges;
- `cmap` supplies coarse factual script coverage;
- legal/source provenance remains independent from artifact-derived technical facts.

This is why technical debt has fallen to **38 / 38 / 38** without changing license debt.

### Reviewed artifact identity aliases

Binary internal names are not globally normalized. Explicit reviewed aliases are stored in:

`src/app/data/verified/artifacts/family-aliases.json`

Current reviewed artifact identities:

- `Aspekta` -> `Aspekta Variable`
- `Uncut Sans` -> `Uncut Sans Variable`

Do not implement a global “strip Variable” heuristic. The strict validator accepts exact internal identity or only a versioned reviewed artifact alias.

## Mandatory release gate

`npm run check` now includes:

1. compact runtime metadata generation;
2. Fontshare evidence validation;
3. independent GitHub evidence validation;
4. independent official-web identity validation;
5. open artifact evidence validation;
6. strict artifact internal-name/SFNT validation;
7. catalog/field-level trust validation;
8. TypeScript;
9. Vite production build;
10. Pages bundle validation;
11. production direct-route/asset smoke.

Production dependency audit remains a separate CI step and must report 0 production vulnerabilities at high severity or above.

## Automation edge discovered

The trust-report workflow commits generated documentation as `github-actions[bot]`. Such a bot commit can become the PR head and GitHub may mark PR-triggered workflows `action_required` rather than rerunning normal CI.

Latest bot-generated report commit before this checkpoint:

`49e8b155ba27c79048a65eec9d1a864e2e7ab3ce`

That commit contained only the generated `docs/TRUST-DEBT.md` refresh and confirmed:

- identity debt 36;
- license debt 38;
- union debt 38;
- technical debt 38/38/38;
- Lausanne and Nohemi in the identity-verified/license-pending section.

This checkpoint commit is intentionally human-authored through the GitHub connector so the full PR release gate runs again on the actual current tree.

## Historical/replacement Google queue

Still unresolved:

- Cederville Cursive
- Manual
- Name Sans
- Open Sans Condensed
- Source Sans Pro

Do not silently rename/rebind these records. The relation model must distinguish:

- exact identity;
- reviewed alias;
- historical name;
- successor/replacement;
- unresolved.

Source Sans research indicates current Source Sans 3 exists in the official Adobe/Google ecosystem, but `Source Sans Pro -> Source Sans 3` must be represented as a reviewed historical/successor relation, not exact identity.

## Fire Sans

Still unresolved.

The recovered record mixes `Uncut / Indie` with a Google-Fonts-looking URL. Do not guess `Fira Sans` or another similar family without primary evidence.

## Immediate next work

1. Confirm this human head passes the full expanded `npm run check` gate, especially strict artifact aliases.
2. Generate/commit `docs/ARTIFACT-INSPECTION.md` once strict gate is proven.
3. Update Font Details and any remaining consumer surfaces to use field-level/canonical source facts rather than raw legacy labels.
4. Continue primary-source re-sourcing of the remaining 36 identity-debt families.
5. Introduce the explicit historical/successor relation schema before resolving Google legacy names.
6. Resolve Fire Sans independently.
7. Keep PR #16 focused on Font Data Engine; Pairing Engine, Workbench 2.0 and global UI redesign remain later PRs.

## Resume procedure

In a new session:

1. read `docs/PROJECT-CONTEXT.md`;
2. read this checkpoint;
3. read Issue #15 and PR #16;
4. read `docs/TRUST-DEBT.md`, `docs/FONTSHARE-SOURCE-AUDIT.md`, and `docs/ARTIFACT-INSPECTION.md` if present;
5. inspect the actual PR #16 head and latest CI before editing;
6. repository reality wins over narrative docs.
