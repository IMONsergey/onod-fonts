"""Verify ONOD's expanded collection against the versioned assets served by Nginx.

Run with Python 3.10+ and fonttools. Every package must contain a usable installable
font and a license or author notice. All CSS previews and local specimen images
must resolve within the asset directory assigned to their family.
"""
import argparse
import json
import re
from collections import Counter
from io import BytesIO
from pathlib import Path, PurePosixPath
from urllib.parse import unquote, urlsplit
from zipfile import ZipFile

from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen


FONT_SIGNATURES = (b"OTTO", b"\x00\x01\x00\x00", b"wOF2", b"wOFF", b"true", b"ttcf")
RUSSIAN = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя"
CSS_URL = re.compile(r"""url\(\s*["']?([^)'"]+)""", re.IGNORECASE)
LOCAL_HOST = "onod.space"


def require(condition, message):
    if not condition:
        raise ValueError(message)


def local_path(directory, path):
    relative = PurePosixPath(unquote(path))
    require(not relative.is_absolute() and ".." not in relative.parts, "unsafe asset path")
    result = directory.joinpath(*relative.parts)
    require(result.is_file(), f"missing asset {relative}")
    return result


def verify_local_link(url, directory):
    if not url:
        return
    link = urlsplit(url)
    if link.hostname not in (None, LOCAL_HOST):
        require(link.scheme == "https", "expected an HTTPS source")
        return
    prefix = f"/assets/type/{directory.name}/"
    require(link.path.startswith(prefix), "link points outside the family package")
    local_path(directory, link.path[len(prefix):])


def check_text_metrics(font, cmap):
    """Reject unusable spacing on ordinary text, while preserving legitimate combining marks."""
    units = font["head"].unitsPerEm
    widths = font["hmtx"].metrics
    for char in " ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" + RUSSIAN:
        name = cmap.get(ord(char))
        if name and name in widths and widths[name][0] > 8 * units:
            raise ValueError(f"implausible text advance for {char!r}")


def supports_russian(font, cmap):
    glyph_names = [cmap.get(ord(char)) for char in RUSSIAN]
    if not all(glyph_names) or any(g in {".notdef", "space", "null", "nonmarkingreturn"} for g in glyph_names):
        return False
    unique_names = set(glyph_names)
    if len(unique_names) < 30:
        return False
    glyphs = font.getGlyphSet()
    drawings = {}
    for name in unique_names:
        pen = DecomposingRecordingPen(glyphs)
        glyphs[name].draw(pen)
        if not any(op in {"lineTo", "qCurveTo", "curveTo"} for op, points in pen.value):
            return False
        drawings[name] = repr(pen.value)
    for letters in (RUSSIAN[:33], RUSSIAN[33:]):
        if len({drawings[cmap[ord(char)]] for char in letters}) < 27:
            return False
    return all(drawings[cmap[ord(base)]] != drawings[cmap[ord(accent)]] for base, accent in (("Е", "Ё"), ("е", "ё")))



def verify_package(row, directory):
    css = local_path(directory, "preview.css").read_text()
    references = CSS_URL.findall(css)
    require(references, "preview stylesheet has no font source")
    for reference in references:
        require(not urlsplit(reference.strip()).scheme, "expected a local preview font")
        with local_path(directory, reference.strip()).open("rb") as preview:
            require(preview.read(4) in FONT_SIGNATURES, "invalid preview font signature")

    with ZipFile(local_path(directory, "family.zip")) as package:
        require(package.testzip() is None, "ZIP integrity failure")
        members = [entry for entry in package.infolist() if not entry.is_dir()]
        for entry in members:
            path = PurePosixPath(entry.filename)
            require(not path.is_absolute() and ".." not in path.parts, "invalid ZIP path")

        fonts = [m for m in members if m.filename.lower().endswith((".otf", ".ttf"))]
        notices = [
            m for m in members
            if m.file_size > 50 and not m.filename.lower().endswith((".otf", ".ttf", ".woff", ".woff2", ".png", ".jpg"))
        ]
        require(fonts and notices, "expected installable fonts and an accompanying notice")

        has_russian = False
        has_variable = False
        for entry in fonts:
            with TTFont(BytesIO(package.read(entry)), lazy=True) as font:
                cmap = font.getBestCmap()
                require(bool(cmap), f"missing Unicode character map in {entry.filename}")
                check_text_metrics(font, cmap)
                has_russian |= supports_russian(font, cmap)
                has_variable |= "fvar" in font and bool(font["fvar"].axes)
        require(has_russian == ("Cyrillic" in row["languages"]), "Russian coverage differs from the listed coverage")
        require(has_variable == row["variable"], "variable flag differs from the font binaries")
        return len(fonts)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, required=True)
    parser.add_argument("--assets", type=Path, required=True)
    args = parser.parse_args()

    rows = json.loads(args.catalog.read_text())
    require(rows, "catalog is empty")
    counts = Counter()
    for row in rows:
        try:
            key = row["key"]
            require(re.fullmatch(r"[a-z0-9][a-z0-9_-]*", key), "invalid family key")
            directory = args.assets / key
            require(row["sourceUrl"].startswith("https://") and row["licenseUrl"].startswith("https://"), "missing secure license evidence")
            verify_local_link(row.get("licenseUrl"), directory)
            verify_local_link(row.get("previewImageUrl"), directory)
            if row.get("sourceOnly"):
                require(row.get("previewImageUrl") or row.get("previewCssUrl"), "missing source specimen")
                counts["sourceOnly"] += 1
            else:
                counts["installableFiles"] += verify_package(row, directory)
                counts["hosted"] += 1
        except Exception as error:
            raise ValueError(f"{row['id']} ({row['name']}): {error}") from error
    print(json.dumps({"families": len(rows), **counts}, ensure_ascii=False))


if __name__ == "__main__":
    main()
