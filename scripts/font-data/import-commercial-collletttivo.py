#!/usr/bin/env python3
"""Build the independent Collletttivo entries from publisher releases. Requires fontTools[woff]."""

import argparse
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
from io import BytesIO
import json
import os
from pathlib import Path, PurePosixPath
import re
import tempfile
import unicodedata
from urllib.parse import quote
from urllib.request import Request, urlopen
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

from fontTools.ttLib import TTFont


# Display names and designer credits are from collletttivo.it/typefaces.
# Classifications use the descriptions on those same publisher pages.
FAMILIES = [
    ("Absans", "Valerio Monopoli", "sans-serif", "e1ba5d9a2359934df024b4ebef4c1be76e0db263"),
    ("Apfel Grotezk", "Luigi Gorlero", "sans-serif", "8b4c9f2682d274d7fae81d8eceef24f7f2fba4ea"),
    ("Aujournuit", "Teo Gaudet", "display", "8b8aed12b67454ea6ae37009ad719bf33617b80d"),
    ("Borges", "Matteo Bertin", "display", "f0c85182388603998ab55f84f9bc8cd8e8719383"),
    ("Coconat", "Sara Lavazza", "display", "75f0bf21470de362ebee2f173e99505b7a7e977b"),
    ("Halibut", "Matteo Maggi", "serif", "afa8478dd72214dc3ec3b7ccebebe3052f167ef7"),
    ("Mattone", "Nunzio Mazzaferro", "sans-serif", "b1dc55dc6a432708ab00329d452d8f6907c6e570"),
    ("Mazius Display", "Alberto Casagrande", "serif", "5798d69b14f0b7c1691f031f2ecb98ebdb709b54"),
    ("Messapia", "Luca Marsano", "display", "c7fbc664055d3f16f5d7431271f738ab5cdc6373"),
    ("Necto Mono", "Marco Condello", "monospaced", "db9edb73bace38d64f36f29e698d9c7547045ce6"),
    ("Ortica", "Ben Bovani", "serif", "27bf44d3ea5057b7abcd09a8922d43d0b37a4f06"),
    ("Ribes", "Luigi Gorlero", "display", "e5f58f6ef719ff69b599a3155c66f4cecaed0a0f"),
    ("Ronzino", "Luigi Gorlero, Nunzio Mazzaferro", "sans-serif", "24df8cdde479fef13948de629c3b10849e1dffb5"),
    ("Sinistre", "Jules Durand", "display", "fbf85f1130670ff2e1b944a17ec13872996b4305"),
    ("Sneaky Times", "Jules Durand", "serif", "7094a621508090d479ccb95ce6a6b8827b3f9d4e"),
    ("Sprat", "Ethan Nakache", "serif", "bdf9c50243d647290ecb21555b03a1aafba447ac"),
]
WIDTH_CLASS = {1: 50, 2: 62.5, 3: 75, 4: 87.5, 5: 100, 6: 112.5, 7: 125, 8: 150, 9: 200}
ALPHABETS = {
    "Latin": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    "Cyrillic": "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя",
    "Greek": "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω",
}
LEGAL_FILES = {"LICENSE.TXT", "AUTHORS.TXT", "CONTRIBUTORS.TXT", "FONTLOG.TXT", "NOTICE", "NOTICE.TXT"}
# Fingerprint of the SPDX OFL-1.1 plaintext from PREAMBLE through DISCLAIMER,
# ignoring layout, punctuation and case. The copyright header is per family.
OFL_BODY_SHA256 = "34c1733fea6ab21201493ee83acdb34a204bd04657ac660f04a771a796b9bad7"
FORMATS = {".ttf": "truetype", ".otf": "opentype", ".woff2": "woff2"}
CATALOG_PATH = Path(__file__).resolve().parents[2] / "src/app/data/verified/commercial/collletttivo.json"


def normalized(name):
    return "".join(c for c in unicodedata.normalize("NFKC", name).casefold() if c.isalnum())


def json_bytes(data):
    return (json.dumps(data, indent=2, ensure_ascii=False) + "\n").encode()


def write_atomic(path, data):
    if path.exists() and path.read_bytes() == data:
        return
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as out:
        temporary = Path(out.name)
        try:
            out.write(data)
            out.flush()
            os.fchmod(out.fileno(), 0o644)
        except BaseException:
            temporary.unlink(missing_ok=True)
            raise
    try:
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def covers_alphabet(cmap, script):
    return all(cmap.get(ord(char)) not in (None, ".notdef") for char in ALPHABETS[script])


def has_full_russian(data):
    with TTFont(BytesIO(data), lazy=True) as font:
        return covers_alphabet(font.getBestCmap() or {}, "Cyrillic")


def inspect_face(data, name, family):
    with TTFont(BytesIO(data), lazy=True) as font:
        names, os2 = font["name"], font["OS/2"]
        aliases = {s for s in (names.getBestFamilyName(), names.getDebugName(1), names.getDebugName(16)) if s}
        axes = {}
        weights = {int(os2.usWeightClass)}
        if "fvar" in font:
            for axis in font["fvar"].axes:
                axes[axis.axisTag] = (axis.minValue, axis.maxValue)
            if "wght" in axes:
                lo, hi = axes["wght"]
                weights.update([int(lo), int(hi)])
                weights.update(round(i.coordinates["wght"]) for i in font["fvar"].instances if "wght" in i.coordinates)
        css_weight = " ".join(f"{n:g}" for n in axes["wght"]) if "wght" in axes else str(os2.usWeightClass)
        width = WIDTH_CLASS[os2.usWidthClass]
        css_width = " ".join(f"{n:g}%" for n in axes["wdth"]) if "wdth" in axes else f"{width:g}%"
        subfamily = names.getBestSubFamilyName() or "Regular"
        angle = font["post"].italicAngle if "post" in font else 0
        if "oblique" in subfamily.lower() or os2.fsSelection & 0x200:
            css_style = "oblique"
        elif "italic" in subfamily.lower() or os2.fsSelection & 1 or angle:
            css_style = "italic"
        else:
            css_style = "normal"
        variant = names.getBestFamilyName() or ""
        if variant.startswith(family + " ") and not subfamily.startswith(variant[len(family) + 1:]):
            subfamily = variant[len(family) + 1:] + " " + subfamily
        if axes:
            subfamily = "Variable"
        cmap = font.getBestCmap() or {}
        scripts = {script for script in ALPHABETS if covers_alphabet(cmap, script)}
    return dict(file=name, aliases=aliases, axes=axes, weights=weights, scripts=scripts, label=subfamily,
                weight=css_weight, width=css_width, style=css_style)


def make_preview(family, faces):
    # For identical CSS coordinates select the standard design first. An alternative
    # outline, such as Ortica Angular Bold, can still be selected by its own alias.
    faces = sorted(faces, key=lambda f: ("Angular" in f["label"], "Regular" not in f["label"], f["file"]))
    slots = set()
    rules = []
    for f in faces:
        slot = (f["weight"], f["width"], f["style"])
        css_family = family if slot not in slots else family + " " + f["label"]
        slots.add(slot)
        fmt = FORMATS[Path(f["file"]).suffix.lower()]
        url = quote(f["file"])
        rules.append(
            f"@font-face {{\n  font-family: {json.dumps(css_family)};\n"
            f'  src: url("./{url}") format("{fmt}");\n  font-style: {f["style"]};\n'
            f'  font-weight: {f["weight"]};\n  font-stretch: {f["width"]};\n  font-display: swap;\n}}\n'
        )
    return "\n".join(rules).encode()


def download_package(slug, revision):
    request = Request(f"https://codeload.github.com/collletttivo/{slug}/zip/{revision}",
                      headers={"User-Agent": "ONOD-Fonts/1"})
    with urlopen(request, timeout=45) as response:
        archive = response.read(64 * 1024 * 1024 + 1)
    if len(archive) > 64 * 1024 * 1024:
        raise ValueError(f"{slug}: unexpected source download size")
    selected = {}
    prefix = f"{slug}-{revision}/"
    with ZipFile(BytesIO(archive)) as source:
        for item in source.infolist():
            if item.is_dir() or not item.filename.startswith(prefix):
                continue
            path = PurePosixPath(item.filename[len(prefix):])
            is_font = len(path.parts) == 2 and path.parts[0] == "fonts" and path.suffix.lower() in FORMATS
            is_notice = len(path.parts) == 1 and path.name.upper() in LEGAL_FILES
            if is_font or is_notice:
                if item.file_size > 32 * 1024 * 1024 or str(path) in selected:
                    raise ValueError(f"{slug}: unexpected source entry {path}")
                selected[str(path)] = source.read(item)
    return selected


def build_family(family, author, category, revision, assets, existing):
    slug = family.lower().replace(" ", "-")
    repo = f"https://github.com/collletttivo/{slug}"
    key = f"it-{slug}-{revision[:12]}"
    files = download_package(slug, revision)
    license_bytes = files["LICENSE.txt"]
    license_text = license_bytes.decode("utf-8-sig")
    # Require the publisher-specific copyright and the license grant and conditions.
    holder = "Matteo Bertin" if slug == "borges" else "Collletttivo"
    if not all(s in license_text for s in (holder, "SIL OPEN FONT LICENSE Version 1.1",
                                          "PERMISSION & CONDITIONS", "Reserved Font Name", "DISCLAIMER")):
        raise ValueError(f"{slug}: unexpected license")
    body = license_text.split("PREAMBLE", 1)
    normalized_body = "".join(c for c in ("PREAMBLE" + body[-1]).lower() if c.isalnum())
    if len(body) != 2 or sha256(normalized_body.encode()).hexdigest() != OFL_BODY_SHA256:
        raise ValueError(f"{slug}: license differs from the verified OFL-1.1 text")
    installable = {p: data for p, data in files.items() if p.lower().endswith((".ttf", ".otf"))}
    if not installable:
        raise ValueError(f"{slug}: no installable fonts")
    previews = {}
    # Original WOFF2, or the original installable face if no WOFF2 exists.
    for path in sorted(installable):
        stem = str(PurePosixPath(path).with_suffix(""))
        preview_path = next(p for p in (stem + ".woff2", stem + ".otf", stem + ".ttf") if p in files)
        previews[preview_path] = files[preview_path]
    faces = [inspect_face(data, PurePosixPath(p).name, family) for p, data in previews.items()]
    aliases = set.union(*(f["aliases"] for f in faces), {family})
    if {normalized(n) for n in aliases} & existing:
        print(f"skip existing: {family}")
        return None

    pack = BytesIO()
    with ZipFile(pack, "w", compression=ZIP_DEFLATED, compresslevel=6) as z:
        for path, data in sorted(files.items()):
            if path in installable or not path.startswith("fonts/"):
                info = ZipInfo(path, (1980, 1, 1, 0, 0, 0))
                info.external_attr = 0o100644 << 16
                z.writestr(info, data, compress_type=ZIP_DEFLATED, compresslevel=6)
    assets_for_family = {PurePosixPath(p).name: data for p, data in previews.items()}
    assets_for_family.update({"OFL.txt": license_bytes, "family.zip": pack.getvalue(),
                              "preview.css": make_preview(family, faces)})
    license_url = f"{repo}/blob/{revision}/LICENSE.txt"
    evidence = {
        "family": family, "repository": repo, "revision": revision,
        "publisherPage": f"https://www.collletttivo.it/typefaces/{slug}",
        "license": "OFL-1.1", "licenseUrl": license_url,
        "upstreamFiles": {p: sha256(v).hexdigest() for p, v in sorted(files.items())},
        "assets": {p: sha256(v).hexdigest() for p, v in sorted(assets_for_family.items())},
    }
    directory = assets / key
    directory.mkdir(parents=True, exist_ok=True)
    for p, data in assets_for_family.items():
        write_atomic(directory / p, data)
    write_atomic(directory / "manifest.json", json_bytes(evidence))
    # Catalog script filters mean support across the family, not sparse isolated glyphs.
    languages = sorted(set.intersection(*(f["scripts"] for f in faces)))
    if not languages:
        raise ValueError(f"{slug}: no verified writing system")
    print(f"verified {family}: {len(previews)} previews, {len(installable)} installable sources", flush=True)
    full_russian = any(has_full_russian(data) for data in installable.values())
    return dict(id="ofl-it-" + slug, name=family, author=author, category=category, languages=languages,
                fullRussian=full_russian,
                weights=sorted(set.union(*(f["weights"] for f in faces))), variable=any(f["axes"] for f in faces),
                styles=sorted({f["label"] for f in faces}), key=key, sourceUrl=f"{repo}/tree/{revision}",
                licenseUrl=license_url, source="Collletttivo")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--existing", type=Path, required=True, help="JSON array of existing names and aliases")
    parser.add_argument("--assets", type=Path, required=True, help="Output directory for type/ assets")
    parser.add_argument("--catalog", type=Path, default=CATALOG_PATH)
    args = parser.parse_args()
    existing = {normalized(name) for name in json.loads(args.existing.read_text())}
    with ThreadPoolExecutor(max_workers=3) as pool:
        records = list(pool.map(lambda f: build_family(*f, args.assets, existing), FAMILIES))
    records = [r for r in records if r]
    if len({normalized(r["name"]) for r in records}) != len(records):
        raise ValueError("Duplicate publisher family in the import")
    args.catalog.parent.mkdir(parents=True, exist_ok=True)
    write_atomic(args.catalog, json_bytes(records))
    print(f"{len(records)} families written to {args.catalog}")


if __name__ == "__main__":
    main()
