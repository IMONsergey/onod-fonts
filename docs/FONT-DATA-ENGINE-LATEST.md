# ONOD Fonts — Font Data Engine latest checkpoint

Updated: 2026-08-10

This is the short current-state pointer for active PR #16. For architecture/history, read `PROJECT-CONTEXT.md` and `FONT-DATA-ENGINE-CHECKPOINT-2026-08-10.md`. Repository state wins if newer commits exist.

## Current trust state

Generated trust report at bot commit `8369323daa0fcfbe49531e039c2f5340cf3ee6bf`:

- catalog families: **1,346**
- identity trust debt: **23**
- license trust debt: **34**
- source/license union debt: **34**
- source + license clear: **1,312**
- exact weights pending: **36**
- variable capability pending: **35**
- script coverage pending: **27**

## Current relation state

Canonical registry: `src/app/data/verified/family-relations.json`.

Verified relations now include:

1. `Cederville Cursive -> Cedarville Cursive` — `catalog-correction`.
   - Current canonical Google family is Cedarville Cursive.
   - OFL-1.1, Regular 400, Latin are verified from official Google Fonts `METADATA.pb`.
   - Stable recovered catalog ID is preserved.
   - Canonical family replacement is allowed only because this is a reviewed spelling correction.
   - Catalog, Details, Workbench, CSS/Tailwind export, document title and FontLoader use the corrected canonical family/stack.

2. `Source Sans Pro -> Source Sans 3` — `historical-successor`.
   - Historical Source Sans Pro identity and OFL-1.1 are verified from the official Adobe repository.
   - Source Sans 3 is lineage context only.
   - Silent successor rendering is forbidden.
   - Technical facts remain pending until a historical binary is inspected.

3. `Open Sans Condensed` — `historical-removed`.
   - Official `google/fonts` removal commit `42fa6aedff8c20a9516b130182ba260a8ff3decb` proves it was a historical Google Fonts family removed from the catalog.
   - Parent revision contains exact `apache/opensanscondensed/METADATA.pb` and Apache 2.0 `LICENSE.txt` evidence.
   - Verified historical metadata: Steve Matteson; weights 300 and 700 (with italic 300 face); Latin, Cyrillic, Greek and Vietnamese; non-variable.
   - No replacement family is invented; silent rendering substitution is forbidden.

`catalog-correction` is the only relation kind allowed to set `loadReplacementAllowed=true`. All historical/rename/collection relations remain false unless policy is deliberately changed later.

## Current independent source state

Independent runtime contains verified current identities from official GitHub and approved official websites. Current highlighted additions include:

- Nacelle — DOT COLON / Sora Sagano — OFL-1.1 verified.
- Gratimo Grotesk — TypeMates / Jakob Runge + Mona Franz — Latin/Cyrillic/Greek verified; license pending.
- Saans — Displaay / Martin Vácha — Latin + variable capability verified; license pending.
- Vercetti — current identity + Latin verified; license capability pending because upstream Licence Amicale language and page-specific EULA restrictions must be reconciled rather than guessed.

## Open artifact engine

- 5 eligible official-GitHub OFL families / 5 inspected.
- Full evidence is build-time-only; browser receives compact artifact runtime metadata.
- FontLoader loads inspected OFL artifacts via `FontFace` from official GitHub binary URLs.
- Binary-internal aliases are reviewed explicitly only (`Aspekta Variable`, `Uncut Sans Variable`).
- FFL binaries are excluded from inspection.

## Release gate

`npm run check` requires source/evidence/relation/artifact validation, TypeScript, Vite build, Pages validation and direct-route/asset smoke. CI separately enforces production dependency audit.

This file is a human-authored checkpoint above the generated report commit so PR CI runs against the actual latest tree rather than ending on a `github-actions[bot]` report commit.

## Immediate next work

1. Verify full CI on this human checkpoint.
2. Resolve `Manual` and `Name Sans` only from exact current/historical primary evidence; no fuzzy name trust.
3. Resolve `Fire Sans` without guessing `Fira Sans`.
4. Continue the remaining legacy Fontshare identity queue using primary foundry evidence.
5. Add relation records for non-exact names such as `Wotfard FS` / `Bw Seido` only after provider lineage is proved.
6. Consider historical artifact acquisition for Source Sans Pro and Open Sans Condensed without enabling successor replacement.
