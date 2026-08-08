# Catalog contribution checklist

Use this checklist before proposing a typeface for the ONOD Fonts catalog. Keep the contribution focused on one family and include source and license evidence in the pull request.

## Identity and source

- [ ] Search the current catalog for duplicate family names, aliases, and renamed releases.
- [ ] Use the official family name and the exact style names published by the source.
- [ ] Record the designer, foundry, or both when the official source provides them.
- [ ] Link to the official foundry, designer, publisher, or project source rather than an unofficial download mirror.

## License and distribution

- [ ] Identify the exact license name and version.
- [ ] Confirm that the license permits web use.
- [ ] Confirm separately whether the font files may be redistributed from this repository.
- [ ] Do not add binary files when the license permits use but not redistribution.
- [ ] Keep the source and license evidence available for review.

## Catalog metadata

- [ ] Fill every field required by the existing catalog schema in `src/app/data/mockFonts.ts`.
- [ ] Check family, styles, classification, designer or foundry, source, license, language coverage, and any variable-font axes that the schema supports.
- [ ] Keep generated data deterministic and avoid changing unrelated catalog records.
- [ ] Verify that names and metadata remain readable when optional values are absent.

## Product verification

- [ ] Confirm that every referenced font resource loads successfully and that a failed request remains recoverable.
- [ ] Check the catalog card and the individual font preview with representative text.
- [ ] Verify that search finds the family by its expected name and metadata.
- [ ] Exercise the relevant filters and confirm that the new record appears only in the correct groups.
- [ ] Test keyboard access and visible focus states for any changed controls.
- [ ] Check the catalog, preview, search, and filters on a narrow mobile viewport as well as desktop.
- [ ] Verify the direct font route in a production preview so GitHub Pages routing is not regressed.

## Final quality gate

- [ ] Review the final diff for unrelated generated files or font binaries.
- [ ] Document the official source, license decision, and tested viewport sizes in the pull request.
- [ ] Run the complete project check:

```sh
npm run check
```

Open the pull request only after every applicable item passes or a remaining limitation is clearly documented.
