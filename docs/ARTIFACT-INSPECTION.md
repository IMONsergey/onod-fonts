# ONOD Fonts — open font artifact inspection

> Generated from hash-addressed TTF/OTF evidence acquired only from independently verified OFL-1.1 official repositories. Font binaries are inspected in CI but are not mirrored into this repository.

Inspected representative artifacts: **5**

| Family | Artifact | SHA-256 | Glyphs | Codepoints | Variable axes | GSUB | GPOS |
|---|---|---|---:|---:|---|---:|---:|
| Aspekta | packages/fonts/variable/AspektaVF.ttf | `aca4bea0033de370…` | 473 | 387 | wght 100–900 | 18 | 1 |
| Cal Sans | fonts/calsans-gf-api/CalSans[GEOM,SHRP,YTAS,opsz,wght].ttf | `28646b365180d27b…` | 1019 | 694 | opsz 8–45, GEOM 0–100, wght 400–700, YTAS 720–800, SHRP 0–100 | 18 | 3 |
| Hauora | fonts/variable/Hauora[wght].ttf | `308fab3575c94ab8…` | 741 | 677 | wght 200–800 | 14 | 1 |
| Overused Grotesk | fonts/variable/OverusedGrotesk-VF.ttf | `81fe7ec52c688030…` | 1118 | 792 | wght 300–900 | 26 | 1 |
| Uncut Sans | Variable/UncutSans-Variable.ttf | `9a7ef47d2d71dbb8…` | 738 | 472 | wght 300–700, ital 0–11 | 24 | 3 |

## Evidence rules

- Artifact identity must agree with the catalog family through the font `name` table.
- Each artifact stores both Git blob SHA and content SHA-256.
- Provider/source license evidence remains authoritative for legal semantics; embedded font metadata does not silently override it.
- ITF FFL / permission-required binaries are excluded from this acquisition pipeline.
- `cmap`/OpenType extraction here is technical evidence; user-facing language intelligence remains a later dedicated phase.

