"""Verify that the deployable files match the licensed families in the ONOD catalog."""
import argparse
import json
import re
from collections import Counter
from pathlib import Path, PurePosixPath
from urllib.parse import unquote, urlsplit
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[2]
FONT_HEADERS = {b"\x00\x01\x00\x00", b"OTTO", b"wOF2", b"wOFF", b"true", b"ttcf"}
URL = re.compile(r"""url\(\s*['"]?([^)'"]+)['"]?\s*\)""", re.IGNORECASE)


def verify_family(family, assets):
    key = family["key"]
    if not isinstance(family.get("fullRussian"), bool):
        raise ValueError("the Russian alphabet coverage check is missing")
    if family["fullRussian"] and "Cyrillic" not in family["languages"]:
        raise ValueError("fully supported Russian alphabet is missing from the Cyrillic filter")
    if not re.fullmatch(r"(?:gf|it)-[a-z0-9][a-z0-9-]*-[a-f0-9]{12}", key):
        raise ValueError(f"unexpected package key {key}")
    base = assets / key
    license_bytes = (base / "OFL.txt").read_bytes()
    license_text = " ".join(license_bytes.decode("utf-8-sig").lower().split())
    if not all(term in license_text for term in ("open font license", "version 1.1", "copyright", "permission", "termination")):
        raise ValueError("incomplete OFL-1.1 license")
    if key.rsplit("-", 1)[1] not in family["licenseUrl"] or urlsplit(family["licenseUrl"]).scheme != "https":
        raise ValueError("license URL does not identify the packaged revision")
    css = (base / "preview.css").read_text()
    urls = URL.findall(css)
    if "@font-face" not in css or not urls:
        raise ValueError("preview stylesheet contains no font faces")
    for url in urls:
        parsed = urlsplit(url.strip())
        local_path = PurePosixPath(unquote(parsed.path))
        if parsed.scheme or parsed.netloc or local_path.is_absolute() or ".." in local_path.parts:
            raise ValueError(f"preview refers outside the package: {url}")
        with (base / local_path).open("rb") as file:
            if file.read(4) not in FONT_HEADERS:
                raise ValueError(f"unrecognized preview font: {url}")
    with ZipFile(base / "family.zip") as archive:
        infos = archive.infolist()
        if len({info.filename for info in infos}) != len(infos):
            raise ValueError("duplicate ZIP entries")
        for info in infos:
            path = PurePosixPath(info.filename)
            if path.is_absolute() or ".." in path.parts:
                raise ValueError(f"unsafe archive path {path}")
        license_names = [i.filename for i in infos if re.search(r"(?:ofl|licen[cs]e)", PurePosixPath(i.filename).name, re.I) and i.file_size == len(license_bytes)]
        if not any(archive.read(name) == license_bytes for name in license_names):
            raise ValueError("the original license is missing from the ZIP")
        desktop = [i for i in infos if PurePosixPath(i.filename).suffix.lower() in {".ttf", ".otf", ".ttc"}]
        if not desktop:
            raise ValueError("no installable desktop fonts")
        for font in desktop:
            with archive.open(font) as member:
                if member.read(4) not in FONT_HEADERS:
                    raise ValueError(f"unrecognized desktop font: {font.filename}")
        invalid_file = archive.testzip()
        if invalid_file:
            raise ValueError(f"failed ZIP CRC: {invalid_file}")
        return len(desktop)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("assets", type=Path, help="directory containing the versioned family packages")
    args = parser.parse_args()
    catalogs = ROOT / "src/app/data/verified/commercial"
    counts = Counter()
    keys = set()
    total_fonts = 0
    for source in ("google", "collletttivo"):
        for family in json.loads((catalogs / f"{source}.json").read_text()):
            key = family["key"]
            if key in keys:
                raise SystemExit(f"Duplicate asset package: {key}")
            try:
                total_fonts += verify_family(family, args.assets)
            except (OSError, ValueError, KeyError) as error:
                raise SystemExit(f"{family['name']} ({key}): {error}") from error
            keys.add(key)
            counts[source] += 1
    if not keys:
        raise SystemExit("No licensed family packages found")
    print(f"Verified {len(keys)} family ZIPs, licenses and preview stylesheets; {total_fonts} installable fonts. {dict(counts)}")


if __name__ == "__main__":
    main()
