# ONOD Fonts — Font Data Engine release checkpoint

Updated: 2026-08-11

This is the short authoritative handoff for PR #16. Read it with `PROJECT-CONTEXT.md`, Issue #15 and generated `TRUST-DEBT.md`. Repository state and newer generated reports always win over this narrative.

## Current measured trust state

Generated report after the reviewed Bw Seido collection relation:

- catalog families: **1,346**
- identity trust debt: **20**
- license trust debt: **34**
- source/license union debt: **34**
- source + license clear: **1,312**
- exact weights pending: **36**
- variable capability pending: **35**
- script coverage pending: **25**

The phase started at 88 source/license-trust-debt families. Remaining ambiguous identity/license work is intentionally preserved as explicit debt rather than cleared through fuzzy matching. Follow-up curation is tracked in Issue #17.

## Provider/runtime state

- Google Fonts: **1,190** compact runtime identities from versioned official `METADATA.pb` evidence, plus two explicit reviewed aliases.
- Current Fontshare: **45** exact/reviewed provider identities; all raw `itf_ffl`, interpreted through reviewed capability policy rather than blanket `Open Source` semantics.
- Independent current sources: **19** runtime identities from official GitHub/approved primary web evidence; **6** currently have verified open-license state and the rest retain license-pending state.
- Open current artifacts: **5/5** eligible OFL families inspected and hash-addressed.
- Historical artifacts: **2** exact historical binaries inspected and validated.

## Relation state

Canonical registry: `src/app/data/verified/family-relations.json`.

1. `Cederville Cursive -> Cedarville Cursive` — `catalog-correction`.
   - Current Google identity/OFL/Regular 400/Latin backed by official `METADATA.pb`.
   - Stable recovered ID retained.
   - This is the only relation class allowed to opt into canonical rendering replacement.

2. `Source Sans Pro -> Source Sans 3` — `historical-successor`.
   - Historical Adobe Source Sans Pro identity and OFL-1.1 verified.
   - Successor is lineage context only; silent substitution is forbidden.
   - Exact historical Source Sans Pro Regular binary is pinned, SHA-256 verified and rendered through `FontFace`.
   - `cmap` makes script coverage factual; family-wide weights remain pending because one Regular artifact does not prove the whole historical family.

3. `Open Sans Condensed` — `historical-removed`.
   - Historical Google identity, Apache-2.0, weights 300/700, non-variable state and Latin/Cyrillic/Greek/Vietnamese metadata verified.
   - Exact historical Light binary is pinned and SHA-256/internal-name validated.
   - No replacement family is invented.

4. `Bw Seido` — `collection-member`.
   - Recovered umbrella identity is verified as `Bw Seido Collection` from Branding with Type.
   - Explicit members: `Bw Seido Raw`, `Bw Seido Round`.
   - Extended Latin coverage is verified at collection level.
   - License, CSS numeric weights and variable capability remain pending.
   - ONOD must not silently choose Raw or Round for rendering.

## Evidence ingestion and consistency

- Temporary `independent-web-sources-*.json` shards can be reviewed/merged collision-safely into canonical web evidence.
- Pramit and Bromine were integrated through this path and now reach compact browser runtime as identity-verified / license-pending records.
- `scripts/validate-independent-runtime-consistency.mjs` blocks evidence that fails to reach runtime.
- Generated trust/source reports follow canonical evidence changes.

## Artifact intelligence

Current artifact systems retain provenance while keeping binaries out of the repository:

- SHA-256
- Git blob/revision where applicable
- internal `name`
- `OS/2`
- `head` / `hhea` / `maxp`
- `fvar`
- `STAT`
- `cmap`
- `GSUB` / `GPOS`
- feature inventory

FFL/proprietary binaries are not inspected unless a reviewed capability policy permits it.

## Last decisive green checkpoints

Human head `879fed648b828de90178822fe8433d36f2e0b62e` / CI #233 proved historical runtime promotion and reported source/license debt 34, weights 36, variable 35, scripts 26.

The subsequent Bw Seido relation tree also passed the full release gate and reduced generated identity debt to 20 and script debt to 25 without changing license/weights/variable debt.

## Mandatory release gate

The final PR #16 human-authored head must pass:

1. production dependency audit;
2. compact metadata generation;
3. Fontshare evidence/policy validation;
4. independent GitHub + web evidence validation;
5. independent canonical/runtime consistency;
6. family relation validation;
7. open artifact validation + strict internal identity;
8. historical artifact validation;
9. catalog field-level trust validation;
10. TypeScript;
11. Vite production build;
12. GitHub Pages base/bundle validation;
13. direct-route + built-asset production smoke.

Known non-blocking performance debt remains visible: initial JS is ~930 kB minified / ~242 kB gzip. Do not suppress the warning; Browser QA/Performance is the next product engineering phase after this merge.

## Post-merge boundary

- Issue #17 owns remaining ambiguous identity/license curation. Do not weaken matching rules to reduce its metrics.
- Next major engineering phase: Browser QA + Performance.
- Then Glyph/Language Intelligence.
- Pairing Engine, Workbench 2.0 and global UI redesign remain later phases.
