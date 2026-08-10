# ONOD Fonts — Font Data Engine checkpoint

Date: 2026-08-10

Use this checkpoint together with `docs/PROJECT-CONTEXT.md`, Issue #15 and draft PR #16. Repository state always wins if newer commits conflict with this document.

## Phase state

Trust Engine is already merged to `main` as `71dc94910b56b76bc8d5dc02dd7ff031582845d2`.

Active phase:

- Issue #15 — Font Data Engine
- branch `feat/font-data-engine`
- draft PR #16

## First Fontshare evidence wave

Recovered catalog had 82 records labelled `source: Fontshare`.

Official current Fontshare API comparison proved:

- 45 exact/reviewed current-provider identities;
- 37 legacy/unmatched recovered Fontshare labels;
- all 45 exact-current records report raw `license_type: itf_ffl`;
- no open-source Fontshare license type appeared in this exact-current intersection.

Canonical evidence:

- `src/app/data/verified/fontshare.json`
- `src/app/data/verified/fontshare-aliases.json`
- `src/app/data/verified/fontshare-license-policies.json`

Operational source-identity queue:

- `docs/FONTSHARE-SOURCE-AUDIT.md`

Policy rule: provider CDN availability is not permission for ONOD mirroring, redistribution, self-hosting or binary inspection. Current reviewed `itf_ffl` capability policy keeps modification, redistribution, self-hosting and binary inspection permission-gated.

## Runtime state after Fontshare wave

The Fontshare evidence pipeline is integrated into compact runtime metadata and `fontTrust`.

Measured green checkpoint before the independent-source batch:

- runtime verified: 1,235 / 1,346;
- source/license debt: 43;
- verified variable families: 55;
- production dependency audit: 0 runtime vulnerabilities.

## First independent-source re-source batch

Five families that the recovered catalog incorrectly/ambiguously labelled Fontshare were re-sourced to primary official GitHub repositories:

1. Aspekta — `ivodolenc/aspekta` — OFL-1.1
2. Cal Sans — `calcom/sans` — OFL-1.1
3. Hauora — `WCYS-Co/Hauora-Sans` — OFL-1.1
4. Overused Grotesk — `RandomMaerks/Overused-Grotesk` — OFL-1.1
5. Uncut Sans — `kaspernordkvist/uncut_sans` — OFL-1.1

Canonical evidence:

`src/app/data/verified/independent-sources.json`

Validator:

`scripts/validate-independent-sources.mjs`

## Field-level trust model

Critical architecture change: verification is no longer all-or-nothing.

`FontTrustReport` now distinguishes:

- `identityVerified`
- `licenseVerified`
- `weightsVerified`
- `variableVerified`
- `scriptsVerified`

This allows source/license facts to become trustworthy without manufacturing technical completeness.

Example current partial families:

- Cal Sans — source/license verified; variable verified; exact weights and scripts pending.
- Hauora — source/license verified; variable + scripts verified; exact weights pending.
- Uncut Sans — source/license verified; weights/variable/scripts still pending.
- Aspekta and Overused Grotesk have stronger primary technical evidence and can expose more verified runtime behavior.

Catalog cards now expose separate `VERIFIED`, `WEIGHTS?`, `CYR?` / variable states instead of using one broad `META?` state for every uncertainty.

Catalog search/source/license facets now use canonical effective metadata rather than recovered raw source/license labels.

## Latest fully green field-level checkpoint

Commit: `cdd78901e8dc3cc378dd54eaa121cd9fc4cc362f`

CI: run #134 / run id `31421865266` / job id `93564292642`

Measured state:

- runtime source/license verified: **1,308 / 1,346**
- source/license debt: **38**
- exact weights pending: **41**
- variable capability pending: **41**
- script/language metadata pending: **41**
- verified variable families: **58**
- independent evidence: **5 families / 5 primary repositories**
- Fontshare current evidence: **45 / 82 recovered Fontshare-tagged records**
- production dependency audit: **0 runtime vulnerabilities**
- TypeScript, Vite production build, Pages base-path validation and direct-route/asset smoke: green
- initial JS chunk remains approximately 0.9 MB raw / ~0.24 MB gzip and still needs a later performance phase; do not suppress the warning.

Subsequent schema/workflow/artifact commits after this checkpoint must pass a fresh current-head CI before PR #16 can merge.

## Identity and license are now independent evidence dimensions

`independent-sources.json` schema was migrated so an identity can be verified while license remains pending.

This is required for proprietary/official-site sources where ONOD can prove the family/designer but has not yet normalized exact redistribution/self-hosting terms.

### Staged primary-web identities

New staged evidence file:

`src/app/data/verified/independent-web-sources.json`

Current identity-only batch:

### Lausanne

- primary source: `https://weltkern.com/typefaces/lausanne/`
- designer: Nizar Kazan
- publisher: WELTKERN
- identity: verified from official WELTKERN material
- exact ONOD license policy: pending
- weights/variable/scripts: pending

Do **not** retain the recovered generic `Open Source` label as verified. WELTKERN is a commercial type publisher and source/license semantics require explicit reviewed terms.

### Nohemi

- primary source: `https://rajputrajesh-4489b.web.app/products/nohemi`
- designer/publisher: Rajesh Rajput
- identity: verified from official designer product page
- exact redistribution/self-hosting/download license policy: pending
- weights/variable/scripts: pending

Validator:

`scripts/validate-independent-web-sources.mjs`

Workflow:

`.github/workflows/validate-independent-web-evidence.yml`

The staged web-evidence batch intentionally cannot expose a definitive license id or technical facts until separate evidence exists.

## Historical/replacement Google queue

Still unresolved:

- Cederville Cursive
- Manual
- Name Sans
- Open Sans Condensed
- Source Sans Pro

Source Sans research confirms the current official Adobe source repository is Source Sans 3 and Google Fonts carries Source Sans 3. Do not silently map `Source Sans Pro -> Source Sans 3` until an explicit relation model is introduced.

Required relation types should distinguish at least:

- exact identity
- reviewed alias
- historical name
- successor/replacement
- unresolved

A successor/replacement relation must not masquerade as exact identity.

## Fire Sans

Still unresolved.

Recovered record combines `Uncut / Indie` with a Google Fonts-looking source URL. Do not auto-correct it to Fira Sans or any similar name without primary evidence.

## Open font artifact engine — started

New dependency-free SFNT inspection layer:

`scripts/font-data/inspect-sfnt.mjs`

Technical extraction implemented:

- SHA-256
- SFNT table directory
- `name`
- `head`
- `hhea`
- `maxp`
- `OS/2`
- `fvar`
- Unicode `cmap` formats 4/12 with codepoint ranges/count
- GSUB feature tags
- GPOS feature tags
- STAT presence

Acquisition script:

`scripts/font-data/acquire-open-artifacts.mjs`

Canonical artifact evidence store:

`src/app/data/verified/artifacts/open-fonts.json`

Policy boundary:

- only independently verified `OFL-1.1` official-GitHub sources are eligible;
- ITF FFL families are excluded;
- fonts are downloaded only in the CI workspace for inspection;
- ONOD commits metadata evidence, not font binaries;
- evidence retains Git blob SHA + content SHA-256 + official raw source URL.

Validators:

- `scripts/font-data/validate-open-artifacts.mjs`
- `scripts/font-data/validate-open-artifacts-strict.mjs`

Strict validation additionally requires the selected binary's internal `name` table to match the catalog family, preventing a multi-family repository from accidentally producing evidence for the wrong font.

Workflows:

- `.github/workflows/sync-open-font-artifacts.yml`
- `.github/workflows/validate-open-font-artifacts.yml`
- `.github/workflows/artifact-report.yml`

Generated report target:

`docs/ARTIFACT-INSPECTION.md`

Before using artifact-derived facts in runtime, verify that the current artifact sync actually produced valid records and that strict validation is green. Do not assume pipeline success from file creation alone.

## Immediate next work

1. Verify current-head CI after the schema v2 / canonical facet changes.
2. Integrate `independent-web-sources.json` into the generated runtime projection while preserving `identityVerified=true / licenseVerified=false`.
3. Refresh trust report so it separately counts identity debt and license debt as well as technical debt.
4. Confirm artifact sync results; repair artifact discovery/scoring if strict identity validation rejects a selected binary.
5. Once valid open artifacts exist, use file-derived facts to strengthen technical confidence for OFL independent families without changing legal/license provenance.
6. Continue primary-source re-sourcing of the remaining legacy Fontshare-tagged queue.
7. Add explicit historical/replacement model before resolving Source Sans Pro / Open Sans Condensed / other legacy Google names.
8. Resolve Fire Sans separately.
9. Keep PR #16 focused on Font Data Engine; do not mix Pairing Engine, Workbench 2.0 or global UI redesign into this PR.

## Resume procedure

In a new session:

1. read `docs/PROJECT-CONTEXT.md`;
2. read this checkpoint;
3. read Issue #15 and PR #16;
4. read `docs/TRUST-DEBT.md`, `docs/FONTSHARE-SOURCE-AUDIT.md`, and if present `docs/ARTIFACT-INSPECTION.md`;
5. inspect current PR #16 head and latest CI before editing;
6. repository reality wins over all narrative documents.
