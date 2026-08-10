# ONOD Fonts — Font Data Engine checkpoint

Date: 2026-08-10

This is the durable handoff for active Font Data Engine work. Read it with `docs/PROJECT-CONTEXT.md`, Issue #15 and draft PR #16. Current repository state always wins over this narrative if newer commits exist.

## Active state

- repository: `IMONsergey/onod-fonts`
- default branch: `main`
- Trust Engine merged to `main` as `71dc94910b56b76bc8d5dc02dd7ff031582845d2`
- active branch: `feat/font-data-engine`
- active issue: #15
- active draft PR: #16
- recovered catalog baseline: **1,346 families**

PR #16 must remain draft until a current human-authored head passes the full release gate after the final evidence/runtime changes.

## Latest measured trust state

Generated reports after Nacelle + Gratimo Grotesk and the Source Sans historical relation now report:

- catalog: **1,346**
- identity trust debt: **25**
- license trust debt: **36**
- source/license union debt: **36**
- source + license clear: **1,310**
- exact weights pending: **38**
- variable capability pending: **37**
- script coverage pending: **29**
- verified variable families exposed at runtime: **61**

Latest decisive green code head before this checkpoint:

`4066a3879de77468963fd0f97ae506bab6b773d7`

CI run **#197** passed:

- production dependency audit: 0 vulnerabilities at the configured production/high gate;
- Google runtime metadata: 1,190 families / 2 reviewed aliases;
- current Fontshare runtime evidence: 45 families;
- independent runtime: **17 identities / 6 verified licenses**;
- independent official-web evidence: **12 identities / 1 verified web license / 11 pending licenses**;
- verified historical relations: 1;
- open artifact evidence: 5 eligible / 5 inspected;
- strict artifact aliases: 2;
- runtime source/license verification: **1,310 / 1,346**;
- TypeScript, Vite production build, Pages base validation and direct-route/asset smoke: green.

Known performance debt remains explicit: initial production JS is ~923 kB minified / ~239 kB gzip. Do not suppress the warning; address it in Browser QA/Performance.

## Field-level trust model

`FontTrustReport` separates:

- `identityVerified`
- `licenseVerified`
- `weightsVerified`
- `variableVerified`
- `scriptsVerified`

Identity, legal facts and technical facts are independent. Do not collapse them into a single verified flag.

Important runtime rule: unverified script metadata is excluded from canonical script filters. `getEffectiveLanguages()` returns only verified script facts for evidence-backed records.

## Fontshare split

Recovered catalog contained 82 records labelled `source: Fontshare`.

Current official Fontshare API evidence proves:

- **45** exact/reviewed current Fontshare identities;
- all 45 report raw `license_type: itf_ffl`;
- **37** recovered names are absent from the current API under exact/reviewed identity.

After primary-source re-sourcing:

- current Fontshare: **45**
- legacy unmatched against current API: **37**
- legacy records re-sourced elsewhere: **17**
- unresolved legacy Fontshare identity queue: **20**

Canonical operational source report: `docs/FONTSHARE-SOURCE-AUDIT.md`.

FFL provider/CDN use is not treated as permission for ONOD redistribution, modification, self-hosting or binary inspection.

## Independent official-GitHub + OFL evidence

Canonical file: `src/app/data/verified/independent-sources.json`.

Five verified repositories:

1. Aspekta — `ivodolenc/aspekta`
2. Cal Sans — `calcom/sans`
3. Hauora — `WCYS-Co/Hauora-Sans`
4. Overused Grotesk — `RandomMaerks/Overused-Grotesk`
5. Uncut Sans — `kaspernordkvist/uncut_sans`

All five have reviewed OFL-1.1 evidence.

## Independent official-web evidence

Canonical file: `src/app/data/verified/independent-web-sources.json`.

Current reviewed web identities:

- Bw Gradual — Branding with Type / Alberto Romanos — Latin verified — license pending
- Bw Modelica — Branding with Type / Alberto Romanos — Latin + Greek + Cyrillic verified — license pending
- Bw Nista — Branding with Type / Alberto Romanos — Latin verified — license pending
- Duplet — Indian Type Foundry / Diana Ovezea + Rafał Buchner — Latin verified — license pending
- Gilam — Fontfabric / Plamen Motev + Ivan Petrov — Latin + Cyrillic + Greek verified — license pending
- Gratimo Grotesk — TypeMates / Jakob Runge + Mona Franz — Latin + Cyrillic + Greek verified — license pending
- Lausanne — WELTKERN / Nizar Kazan — technical fields pending — license pending
- Nacelle — DOT COLON / Sora Sagano — **OFL-1.1 verified** — technical fields pending
- New Spirit — Newlyn — Latin verified — license pending
- Nohemi — Rajesh Rajput — technical fields pending — license pending
- Saans — Displaay / Martin Vácha — Latin + variable capability verified — license pending
- Vercetti — Richard Mandona / Filippos Fragkogiannis — Latin verified — license pending; Licence Amicale fact recorded but capability policy intentionally unresolved due additional page-specific EULA restrictions

Validator: `scripts/validate-independent-web-sources.mjs`.

The validator supports `license.status=pending` and `license.status=verified`; currently only exact reviewed `OFL-1.1` is accepted as a verified web license. Approved primary-source hosts are versioned in the validator.

## Historical / successor relation layer

Canonical relation registry: `src/app/data/verified/family-relations.json`.

Relation types:

- `historical-successor`
- `provider-rename`
- `collection-member`

Validator: `scripts/validate-family-relations.mjs`.

`loadReplacementAllowed` is currently required to stay `false`; relation evidence cannot silently change rendering identity.

### Source Sans Pro

First verified relation:

`Source Sans Pro -> Source Sans 3` as `historical-successor`.

Official Adobe repository history proves historical Source Sans Pro files/package identity and OFL-1.1 at commit `f42c6e78cef38a192aa1e45bc3ff9b80e0d4b7f6`. The same official project later releases Source Sans 3 at `7c691c2772570a0d3a9e1bffe8a9d6074257d985`.

Trust state:

- identity: verified historical Adobe family;
- license: OFL-1.1 verified;
- weights/variable/scripts: pending;
- successor substitution: forbidden.

Source Sans Pro is no longer source/license debt, but remains technical debt until a historical binary is inspected.

## Open font artifact engine

Only official-GitHub identities with verified OFL-1.1 are currently eligible for binary acquisition/inspection. FFL families are excluded.

Core files:

- `scripts/font-data/acquire-open-artifacts.mjs`
- `scripts/font-data/inspect-sfnt.mjs`
- `scripts/font-data/validate-open-artifacts.mjs`
- `scripts/font-data/validate-open-artifacts-strict.mjs`
- `scripts/font-data/build-artifact-runtime.mjs`
- `src/app/data/verified/artifacts/open-fonts.json`
- `src/app/data/verified/artifacts/family-aliases.json`
- generated `.generated/open-artifact-runtime.json`

Current result: **5 eligible / 5 inspected**. Binaries themselves are never committed.

Artifact SHA-256:

- Aspekta — `aca4bea0033de37093916756e44cfa4e823a928316905732ecc03a070d218dda`
- Cal Sans — `28646b365180d27bab7604e82e307760366199f9741856092eb1fd6c16d2444e`
- Hauora — `308fab3575c94ab85a4b017d80d450c0d05c5ecd4fffb86616ff8449f1c0afea`
- Overused Grotesk — `81fe7ec52c68803073edbfab73474b93cd843df53e498e69a22dba42410b2176`
- Uncut Sans — `9a7ef47d2d71dbb807d4d1d24331230fcf63cdf5312daa0439891f54664d89dc`

Technical evidence includes `name`, `OS/2`, `head`, `hhea`, `maxp`, `fvar`, `cmap`, GSUB/GPOS, STAT presence, Git blob SHA and SHA-256.

Reviewed artifact-name aliases are exact and versioned:

- Aspekta -> Aspekta Variable
- Uncut Sans -> Uncut Sans Variable

No global suffix stripping is allowed.

## Canonical loader and UI

`FontLoader` routes by canonical source:

- verified Fontshare -> official Fontshare CSS by reviewed slug;
- inspected OFL artifact -> official GitHub binary through `FontFace`;
- current Google -> Google Fonts CSS;
- stale legacy custom URLs cannot override a re-sourced canonical identity;
- no verified loading strategy -> explicit unavailable/fallback state.

`FontCard`, `FontDetailsPage`, `FilterPanel` and `useFontFilter` use canonical/effective source/license facts. Details expose independent SOURCE / LICENSE / WEIGHTS / VARIABLE / SCRIPTS status.

Legacy direct download URLs do not automatically grant Download capability; Source remains a separate action.

## Mandatory release gate

`npm run check` enforces:

1. runtime metadata generation;
2. compact artifact runtime generation;
3. Fontshare evidence validation;
4. independent GitHub evidence validation;
5. independent official-web identity/license evidence validation;
6. family relation validation;
7. artifact evidence validation;
8. strict artifact internal-name/SFNT validation;
9. catalog/field-level trust validation;
10. TypeScript;
11. Vite production build;
12. Pages bundle validation;
13. direct-route + built-asset production smoke.

CI separately runs the production dependency audit.

## Automation edge

The trust-report workflow commits generated reports as `github-actions[bot]`. A generated bot commit may become PR head and produce `action_required` rather than normal PR CI. After meaningful generated report updates, create a real connector/human checkpoint commit and verify CI on that head before calling the PR release-ready.

Latest generated report commit before this checkpoint:

`4332092ffd2b0b227c00f1f952199d8e461ac5cf`

It confirmed:

- identity debt 25;
- license/union debt 36;
- scripts debt 29;
- Fontshare legacy 17 re-sourced / 20 unresolved.

## Remaining identity queue

Unresolved legacy Fontshare-tagged identities after Nacelle/Gratimo:

Barbara, Bromine, Bw Seido, Canchal, Cassandra, Deng, Dodi, Fokkol, H.H. Samuel, Helixa, Ladi, Magro, Mrow, Ozone, Polaris FS, Pramit, Strawford, Sudo, Thica, Wotfard FS.

Other unresolved identities:

- Cederville Cursive
- Manual
- Name Sans
- Open Sans Condensed
- Fire Sans

Names that require relation semantics rather than exact matching include at least:

- Wotfard FS vs current official `wotfard`
- Bw Seido vs current official collection/subfamilies
- deprecated/renamed Google-family records

Do not fuzzy-match these into trusted state.

## Immediate next work

1. Continue exact primary-source re-sourcing of the remaining 25 identity-debt records.
2. Add relation evidence for non-exact names only when the provider proves the lineage.
3. Resolve Cederville Cursive, Manual, Name Sans and Open Sans Condensed using exact current/historical provider evidence.
4. Resolve Fire Sans without typo guessing.
5. Consider historical Source Sans Pro artifact inspection.
6. Keep PR #16 focused on Font Data Engine; Browser QA/Performance, Pairing Engine, Workbench 2.0 and global UI redesign remain subsequent phases.

## Resume procedure

In a new session:

1. read `docs/PROJECT-CONTEXT.md`;
2. read this checkpoint;
3. inspect Issue #15 and PR #16;
4. read generated `docs/TRUST-DEBT.md`, `docs/FONTSHARE-SOURCE-AUDIT.md` and `docs/ARTIFACT-INSPECTION.md`;
5. inspect the actual PR head and latest CI before editing;
6. repository reality wins over narrative docs.
