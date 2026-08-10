# ONOD Fonts — Font Data Engine checkpoint

Date: 2026-08-10

This is the durable handoff for active Font Data Engine work. Read it together with `docs/PROJECT-CONTEXT.md`, Issue #15 and draft PR #16. Current repository state always wins if newer commits conflict with this document.

## Active state

- repository: `IMONsergey/onod-fonts`
- default branch: `main`
- Trust Engine merged to `main` as `71dc94910b56b76bc8d5dc02dd7ff031582845d2`
- active branch: `feat/font-data-engine`
- active issue: #15
- active draft PR: #16
- recovered catalog baseline: **1,346 families**

PR #16 must remain draft until a current human-authored head passes the complete release gate after the final evidence/runtime changes.

## Latest measured trust state

Generated `docs/TRUST-DEBT.md` after the first historical relation now reports:

- catalog: **1,346**
- identity trust debt: **27**
- license trust debt: **37**
- source/license union debt: **37**
- source + license clear: **1,309**
- exact weights pending: **38**
- variable capability pending: **37**
- script coverage pending: **30**
- verified variable families exposed at runtime: **61**

Latest decisive green human code head before this checkpoint:

`4ef79f1f0898fe6d727a6d5e39ad062668827ed1`

CI run **#193** passed:

- production dependency audit: 0 vulnerabilities at the configured production/high gate;
- Google runtime metadata: 1,190 families / 2 reviewed aliases;
- current Fontshare runtime evidence: 45 families;
- independent runtime evidence: 15 current independent identities / 5 verified independent OFL licenses;
- verified historical relation evidence: 1 relation;
- open artifact evidence: 5 eligible / 5 inspected;
- strict artifact identity aliases: 2;
- catalog validation: 1,346 unique families;
- runtime source/license verification: 1,309 / 1,346;
- TypeScript, Vite build, Pages bundle validation and direct-route/asset smoke: green.

Known performance debt remains: initial production JS chunk is ~923 kB minified / ~239 kB gzip and still emits the deliberate large-chunk warning. Do not suppress it; address it in the Browser QA/Performance phase.

## Field-level trust model

Verification is not all-or-nothing. `FontTrustReport` separates:

- `identityVerified`
- `licenseVerified`
- `weightsVerified`
- `variableVerified`
- `scriptsVerified`

A primary source can prove family identity while license remains pending. A binary can prove technical facts without changing provider/legal facts. A historical relation can prove an old family and its license without allowing silent rendering through its successor.

Unverified script metadata is no longer allowed into canonical script filters. `getEffectiveLanguages()` returns only verified script facts for evidence-backed/pending records; it does not fall back to legacy guesses when `scriptsVerified=false`.

## Fontshare current-provider split

Recovered catalog contained 82 records labelled `source: Fontshare`.

Current official Fontshare API evidence proves:

- **45** exact/reviewed current Fontshare identities;
- all 45 report `license_type: itf_ffl`;
- **37** recovered names are absent from the current API under exact/reviewed identity.

After independent re-sourcing of those 37 legacy records:

- current Fontshare: **45**
- legacy unmatched against current API: **37**
- legacy records already re-sourced to other primary sources: **15**
- unresolved legacy Fontshare identity queue: **22**

Canonical files:

- `src/app/data/verified/fontshare.json`
- `src/app/data/verified/fontshare-aliases.json`
- `src/app/data/verified/fontshare-license-policies.json`
- `docs/FONTSHARE-SOURCE-AUDIT.md`

Current `itf_ffl` policy treats provider API/CDN use separately from modification, redistribution, self-hosting and binary inspection. The latter capabilities remain permission-gated.

## Independent official-GitHub evidence

Five recovered Fontshare-tagged families were re-sourced to official GitHub repositories with exact OFL-1.1 evidence:

1. Aspekta — `ivodolenc/aspekta`
2. Cal Sans — `calcom/sans`
3. Hauora — `WCYS-Co/Hauora-Sans`
4. Overused Grotesk — `RandomMaerks/Overused-Grotesk`
5. Uncut Sans — `kaspernordkvist/uncut_sans`

Canonical evidence:

`src/app/data/verified/independent-sources.json`

Validator:

`scripts/validate-independent-sources.mjs`

## Independent official-web evidence

Ten additional families now have reviewed current primary-source identity evidence. Their licenses remain intentionally `pending` until exact capability policies are normalized:

- Bw Gradual — Branding with Type / Alberto Romanos — Latin verified
- Bw Modelica — Branding with Type / Alberto Romanos — Latin + Greek + Cyrillic verified
- Bw Nista — Branding with Type / Alberto Romanos — Latin verified
- Duplet — Indian Type Foundry / Diana Ovezea + Rafał Buchner — Latin verified
- Gilam — Fontfabric / Plamen Motev + Ivan Petrov — Latin + Cyrillic + Greek verified
- Lausanne — WELTKERN / Nizar Kazan — technical fields pending
- New Spirit — Newlyn — Latin verified
- Nohemi — Rajesh Rajput — technical fields pending
- Saans — Displaay / Martin Vácha — Latin + variable capability verified; numeric weight metadata pending
- Vercetti — Richard Mandona / Filippos Fragkogiannis — Latin verified; upstream Licence Amicale fact recorded but capability policy remains pending because page-specific EULA restrictions also apply

Canonical evidence:

`src/app/data/verified/independent-web-sources.json`

Validator:

`scripts/validate-independent-web-sources.mjs`

The approved-host whitelist is versioned in that validator. Do not accept arbitrary external URLs as primary evidence.

## Historical / successor relation layer

Canonical relation registry:

`src/app/data/verified/family-relations.json`

Runtime/UI helper:

`src/app/lib/fontRelations.ts`

Validator:

`scripts/validate-family-relations.mjs`

Relation kinds are explicit and must not collapse into aliases:

- `historical-successor`
- `provider-rename`
- `collection-member`

`loadReplacementAllowed` is currently required to remain `false` for canonical relations. A relation may explain lineage but cannot silently substitute another family in rendering.

### Source Sans Pro

The first verified relation is `Source Sans Pro -> Source Sans 3` as `historical-successor`.

Official Adobe repository history proves historical `SourceSansPro-*` releases. `LICENSE.txt` at historical commit `f42c6e78cef38a192aa1e45bc3ff9b80e0d4b7f6` is OFL-1.1. The same official project later releases Source Sans 3 at commit `7c691c2772570a0d3a9e1bffe8a9d6074257d985`.

Trust result for Source Sans Pro:

- identity: verified historical Adobe family;
- license: OFL-1.1 verified;
- weights/variable/scripts: pending until historical artifact inspection;
- successor: Source Sans 3 is exposed as lineage context only;
- silent successor loading: forbidden.

This relation reduced source/license union debt from 38 to **37**.

## Open font artifact engine

Only official-GitHub identities with verified OFL-1.1 are eligible for current binary acquisition/inspection. ITF FFL records are excluded.

Core implementation:

- `scripts/font-data/acquire-open-artifacts.mjs`
- `scripts/font-data/inspect-sfnt.mjs`
- `scripts/font-data/validate-open-artifacts.mjs`
- `scripts/font-data/validate-open-artifacts-strict.mjs`
- `scripts/font-data/build-artifact-runtime.mjs`
- `src/app/data/verified/artifacts/open-fonts.json`
- `src/app/data/verified/artifacts/family-aliases.json`
- generated `.generated/open-artifact-runtime.json`

Acquisition result: **5 eligible / 5 inspected**. Binaries themselves are never committed.

Artifacts:

- Aspekta — `AspektaVF.ttf` — SHA-256 `aca4bea0033de37093916756e44cfa4e823a928316905732ecc03a070d218dda`
- Cal Sans — `CalSans[GEOM,SHRP,YTAS,opsz,wght].ttf` — SHA-256 `28646b365180d27bab7604e82e307760366199f9741856092eb1fd6c16d2444e`
- Hauora — `Hauora[wght].ttf` — SHA-256 `308fab3575c94ab85a4b017d80d450c0d05c5ecd4fffb86616ff8449f1c0afea`
- Overused Grotesk — `OverusedGrotesk-VF.ttf` — SHA-256 `81fe7ec52c68803073edbfab73474b93cd843df53e498e69a22dba42410b2176`
- Uncut Sans — `UncutSans-Variable.ttf` — SHA-256 `9a7ef47d2d71dbb807d4d1d24331230fcf63cdf5312daa0439891f54664d89dc`

Artifact evidence includes SHA-256, Git blob SHA, SFNT tables, `name`, `head`, `hhea`, `maxp`, `OS/2`, `fvar`, Unicode `cmap`, GSUB/GPOS feature tags and STAT presence.

Technical runtime overlay uses:

- `fvar` for actual axes and weight ranges;
- `cmap` ranges for coarse factual script coverage;
- canonical source/license evidence separately from file-derived facts.

### Reviewed artifact identity aliases

Exact internal family identity is default. The only current reviewed binary-name aliases are:

- `Aspekta` -> `Aspekta Variable`
- `Uncut Sans` -> `Uncut Sans Variable`

Do not implement global suffix stripping.

## Canonical loader and consumer UI

`FontLoader` now routes by canonical verified source, not raw recovered source:

- verified Fontshare -> official Fontshare CSS by verified slug;
- inspected independent OFL family -> official GitHub binary through `FontFace` API;
- verified/current Google -> Google Fonts CSS;
- stale legacy `customCssUrl` is not allowed to override a re-sourced canonical provider;
- no verified loading strategy -> explicit unavailable/fallback state.

`FontCard`, `FontDetailsPage`, `FilterPanel` and `useFontFilter` use canonical/effective source and license facts.

Details expose independent chips for:

- SOURCE
- LICENSE
- WEIGHTS
- VARIABLE
- SCRIPTS

Identity-verified/license-pending families show `SOURCE VERIFIED / LICENSE?` instead of an all-or-nothing metadata status.

Legacy direct download actions are not exposed for Fontshare/Independent records merely because the recovered manifest contains a URL. Source remains separate from Download.

## Mandatory release gate

`npm run check` currently enforces:

1. Google + Fontshare + independent runtime metadata generation;
2. compact artifact runtime projection;
3. Fontshare evidence validation;
4. independent GitHub evidence validation;
5. independent official-web evidence validation;
6. historical relation validation;
7. open artifact evidence validation;
8. strict artifact internal-name/SFNT validation;
9. catalog/field-level trust validation;
10. TypeScript;
11. Vite production build;
12. GitHub Pages bundle/base validation;
13. production direct-route and built-asset smoke.

CI separately runs production dependency audit.

## Automation edge

Trust-report automation commits generated reports as `github-actions[bot]`. Such a bot commit can become PR head and cause PR-triggered CI to appear `action_required`. Therefore, after important generated report commits, create a meaningful human connector commit (checkpoint/code/doc) and verify CI on that human head before treating the PR as release-ready.

Latest generated report commit at this checkpoint:

`5cda398234e6947ee886b520619a3260fcf1ff68`

## Remaining source identity queue

`docs/FONTSHARE-SOURCE-AUDIT.md` currently lists 22 unresolved legacy Fontshare-tagged identities:

Barbara, Bromine, Bw Seido, Canchal, Cassandra, Deng, Dodi, Fokkol, Gratimo Grotesk, H.H. Samuel, Helixa, Ladi, Magro, Mrow, Nacelle, Ozone, Polaris FS, Pramit, Strawford, Sudo, Thica, Wotfard FS.

Other unresolved identity records include:

- Cederville Cursive
- Manual
- Name Sans
- Open Sans Condensed
- Fire Sans

`Source Sans Pro` is no longer in source/license debt; it is historical technical debt only.

### Names that require relation semantics

Do not add these as exact independent identities until relations are proven:

- Wotfard FS vs current official `wotfard`
- Bw Seido vs official Bw Seido collection/subfamilies
- other Google deprecated/renamed family names

## Fire Sans

Still unresolved. The recovered record mixes `Uncut / Indie` with a Google-Fonts-looking URL. Do not guess `Fira Sans` or another similar family without primary evidence.

## Immediate next work

1. Continue primary-source re-sourcing of the remaining 27 identity-debt records.
2. Add only evidence-backed relation records for Wotfard FS, Bw Seido and other non-exact names.
3. Resolve Cederville Cursive / Manual / Name Sans / Open Sans Condensed using exact historical/current provider evidence.
4. Resolve Fire Sans independently.
5. Consider historical artifact acquisition for Source Sans Pro so weights/scripts can become technical facts without using Source Sans 3 as replacement.
6. Keep PR #16 focused on Font Data Engine; Browser QA/Performance, Pairing Engine, Workbench 2.0 and global UI redesign remain subsequent phases.

## Resume procedure

In a new session:

1. read `docs/PROJECT-CONTEXT.md`;
2. read this checkpoint;
3. inspect Issue #15 and PR #16;
4. read generated `docs/TRUST-DEBT.md`, `docs/FONTSHARE-SOURCE-AUDIT.md`, `docs/ARTIFACT-INSPECTION.md`;
5. inspect the actual PR #16 head and latest CI before editing;
6. repository reality wins over narrative docs.
