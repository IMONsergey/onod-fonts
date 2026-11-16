"""Build ONOD's downloadable Google Fonts collection from an official git checkout.

Requires Python 3.10+, fonttools and git. Example:
    python import-commercial-google.py --upstream /data/google-fonts \
        --revision COMMIT --existing existing-family-names.json \
        --assets /data/onod/type --catalog src/app/data/verified/commercial/google.json

The input name list includes canonical names and known aliases. A partial clone
must have the selected family directories checked out, including their fonts.
The catalog is published only after the whole import finishes successfully.
"""

import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha1, sha256
import json
import os
from pathlib import Path
import re
import subprocess
from tempfile import TemporaryDirectory, NamedTemporaryFile
import unicodedata
from urllib.parse import quote
from zipfile import ZipFile, ZIP_DEFLATED, ZipInfo

from fontTools import unicodedata as unicode_fonts
from fontTools.ttLib import TTFont


OFL_BODY = "5fc648ffc1fc17805a23c568e4499700a2c2435dde61812748b880222f95b4e8"
CATEGORIES = {
    "SANS_SERIF": "sans-serif",
    "SERIF": "serif",
    "DISPLAY": "display",
    "HANDWRITING": "handwriting",
    "MONOSPACE": "monospaced",
}
LANGUAGE_NAMES = {
    "chinese-simplified": "Chinese (Simplified)",
    "chinese-traditional": "Chinese (Traditional)",
    "chinese-hongkong": "Chinese (Hong Kong)",
    "nko": "NKo",
    "phags-pa": "Phags Pa",
    "kana-extended": "Japanese",
    "tamil-supplement": "Tamil",
}
SAMPLE_TEXT = {
    "Cyrl": "Пример шрифта",
    "Arab": "أبجد هوز",
    "Armn": "Հայերեն",
    "Beng": "বাংলা",
    "Deva": "देवनागरी",
    "Ethi": "ኢትዮጵያ",
    "Geor": "ქართული",
    "Grek": "Ελληνικά",
    "Gujr": "ગુજરાતી",
    "Guru": "ਪੰਜਾਬੀ",
    "Hang": "한글 글꼴",
    "Hans": "字体设计",
    "Hant": "字體設計",
    "Hani": "文字",
    "Hebr": "עברית",
    "Jpan": "日本語",
    "Khmr": "ខ្មែរ",
    "Knda": "ಕನ್ನಡ",
    "Kore": "한글 글꼴",
    "Laoo": "ລາວ",
    "Mlym": "മലയാളം",
    "Mymr": "မြန်မာ",
    "Orya": "ଓଡ଼ିଆ",
    "Sinh": "සිංහල",
    "Taml": "தமிழ்",
    "Telu": "తెలుగు",
    "Thai": "ภาษาไทย",
    "Tibt": "བོད་ཡིག",
}
NON_TYPE = re.compile(
    r"^(?:Adobe Blank|Redacted(?: Script)?|Material (?:Icons|Symbols).*|Libre Barcode.*)$|\b(?:Test|Emoji|Icons?|Symbols)\b",
    re.I,
)
NOTICE = re.compile(r"^(?:OFL|LICEN[SC]E|COPYRIGHT|NOTICE|AUTHORS?|FONTLOG)(?:[._-].*)?$", re.I)


def identity(s):
    return "".join(c for c in unicodedata.normalize("NFKD", s).casefold() if c.isalnum())


def fields(text, key, indent=""):
    # Google Fonts METADATA.pb writes the scalar family and font fields on individual lines.
    pattern = "^" + indent + re.escape(key) + r':\s*("(?:\\.|[^"\\])*")\s*$'
    return [json.loads(x.replace("\\'", "'")) for x in re.findall(pattern, text, re.M)]


def scalar(text, key, indent=""):
    values = fields(text, key, indent)
    return values[0] if values else ""


def blocks(text, tag):
    return re.findall("^" + tag + r" \{\n(.*?)^\}", text, re.M | re.S)


def git_files(repo, revision):
    actual = subprocess.check_output(["git", "-C", str(repo), "rev-parse", "HEAD"], text=True).strip()
    if actual != revision or not re.fullmatch(r"[a-f0-9]{40}", revision):
        raise ValueError("Checkout does not match the requested full commit.")
    tree = subprocess.check_output(["git", "-C", str(repo), "ls-tree", "-rz", revision, "ofl"])
    records = {}
    for row in tree.split(b"\0"):
        if not row:
            continue
        header, rawpath = row.split(b"\t", 1)
        path = Path(rawpath.decode())
        if len(path.parts) == 3:
            records.setdefault(path.parts[1], {})[path.name] = header.split()[2].decode()
    return records


def file_bytes(path, blob):
    data = path.read_bytes()
    if sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest() != blob:
        raise ValueError(f"Git blob mismatch: {path}")
    return data


def verified_license(content):
    text = content.decode("utf-8-sig").replace("\r", "")
    header, marker, body = text.partition("PREAMBLE")
    normalized = "".join(c for c in body.lower() if c.isalnum())
    copyright_lines = [
        line.strip() for line in header.splitlines() if re.search(r"copyright|©|\(c\)", line, re.I)
    ]
    return bool(
        marker
        and re.search(r"SIL Open Font License,?\s+Version 1\.1", header, re.I)
        and sha256(normalized.encode()).hexdigest() == OFL_BODY
        and any(
            re.search(r"(19|20)\d{2}", line) and not re.search(r"<dates>|<copyright holder>", line, re.I)
            for line in copyright_lines
        )
    )


def is_covered(string, chars):
    return bool(
        string and any(c.isalpha() for c in string) and all(ord(c) in chars or c.isspace() for c in string)
    )


def sample_for(metadata, chars, family, scripts):
    primary = scalar(metadata, "primary_script")
    # For multiscript Latin designs provide a Cyrillic specimen when actually present.
    if primary in ("", "Latn") and "Cyrillic" in scripts and is_covered(SAMPLE_TEXT["Cyrl"], chars):
        return SAMPLE_TEXT["Cyrl"]
    if primary != "Latn":
        for sample_block in blocks(metadata, "sample_text"):
            for key in ("masthead_partial", "styles", "masthead_full"):
                sample = scalar(sample_block, key, "  ")
                if 1 <= len(sample) <= 60 and is_covered(sample, chars):
                    return sample
        sample = SAMPLE_TEXT.get(primary)
        if is_covered(sample, chars):
            return sample
        if primary:
            letters = [
                chr(cp)
                for cp in sorted(chars)
                if unicode_fonts.script(chr(cp)) == primary and unicodedata.category(chr(cp)).startswith("L")
            ]
            if len(letters) >= 3:
                return "".join(letters[:10])
    if is_covered(family, chars):
        return family
    letters = [chr(cp) for cp in sorted(chars) if unicodedata.category(chr(cp)).startswith("L")]
    return "".join(letters[:12]) or None


RUSSIAN_LETTERS = {ord(c) for c in "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя"}


def language_names(metadata, chars, full_russian, has_cyrillic_letter):
    subsets = set(fields(metadata, "subsets")) - {"menu", "math", "symbols", "symbols2", "emoji", "music"}
    languages = {LANGUAGE_NAMES.get(s, s.removesuffix("-ext").replace("-", " ").title()) for s in subsets}
    if full_russian:
        languages.add("Cyrillic")
    elif not has_cyrillic_letter:
        languages.discard("Cyrillic")
    # Several school handwriting families have only the technical 'menu' subset.
    if not languages and all(ord(c) in chars for c in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"):
        languages.add("Latin")
    return sorted(languages)


def is_fixed_pitch(font, cmap):
    if "post" in font and font["post"].isFixedPitch:
        return True
    probes = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    if "hmtx" not in font or not all(ord(c) in cmap for c in probes):
        return False
    widths = {font["hmtx"][cmap[ord(c)]][0] for c in probes}
    return len(widths) == 1 and next(iter(widths)) > 0


def package_family(args, slug, tree, metadata, family):
    folder = args.upstream / "ofl" / slug
    if (
        "OFL.txt" not in tree
        or scalar(metadata, "license") != "OFL"
        or not verified_license(file_bytes(folder / "OFL.txt", tree["OFL.txt"]))
    ):
        return "unconfirmed OFL", None
    if NON_TYPE.search(family) or "SYMBOLS" in fields(metadata, "classifications"):
        return "symbol, barcode or test face", None
    category = next((CATEGORIES[c] for c in fields(metadata, "category") if c in CATEGORIES), "")
    designer = scalar(metadata, "designer")
    if not category or not designer:
        return "incomplete identity", None
    key = "gf-" + slug + "-" + args.revision[:12]
    dest = args.assets / key
    declared = {}
    for block in blocks(metadata, "fonts"):
        filename = scalar(block, "filename", "  ")
        if not filename or Path(filename).name != filename or filename not in tree:
            raise ValueError(f"{family}: metadata declares an absent or invalid font file {filename!r}")
        declared[filename] = (scalar(block, "style", "  "), scalar(block, "post_script_name", "  "))
    sfnt_files = {n for n in tree if Path(n).suffix.lower() in {".otf", ".ttf"}}
    if not declared or sfnt_files != declared.keys():
        return "metadata and canonical binaries differ", None
    notices = sorted(n for n in tree if NOTICE.match(n))
    weights, styles, faces, css = set(), set(), [], []
    claims_mono = bool(re.search(r"\b(?:Mono|Monospace)\b", family, re.IGNORECASE))
    all_faces_fixed = True
    any_variable = False
    full_russian = False
    has_cyrillic_letter = False
    cmap, sample_priority = set(), None
    with TemporaryDirectory(dir=args.assets, prefix=".onod-build-") as temporary:
        tmp = Path(temporary)
        hashes = {}
        for filename, (style, postscript) in sorted(declared.items()):
            if style not in {"normal", "italic"}:
                raise ValueError(f"{family}: unexpected style {style}")
            binary = file_bytes(folder / filename, tree[filename])
            sha = sha256(binary).hexdigest()
            (tmp / filename).write_bytes(binary)
            del binary
            hashes[filename] = sha
            with TTFont(tmp / filename, lazy=True) as font:
                if font.sfntVersion not in ("\0\1\0\0", "OTTO", "true") or not {
                    "name",
                    "cmap",
                    "OS/2",
                } <= set(font.keys()):
                    raise ValueError(f"{family}: malformed installable font: {filename}")
                table = font["name"]
                ps_name = table.getDebugName(6) or ""
                family_names = [table.getDebugName(i) or "" for i in (1, 16, 21)]
                if identity(ps_name) != identity(postscript) and identity(family) not in set(
                    map(identity, family_names)
                ):
                    return "binary family identity mismatch", None
                axes = (
                    {a.axisTag: [a.minValue, a.defaultValue, a.maxValue] for a in font["fvar"].axes}
                    if "fvar" in font
                    else {}
                )
                any_variable |= bool(axes)
                default = int(font["OS/2"].usWeightClass)
                if not (1 <= default <= 1000):
                    return "invalid binary weight", None
                lo, default_weight, hi = map(int, axes.get("wght", [default, default, default]))
                if not (1 <= lo <= default_weight <= hi <= 1000):
                    return "invalid binary weight axis", None
                weights.update({lo, default_weight, hi})
                weights.update(range(((lo + 99) // 100) * 100, hi + 1, 100))
                glyphs = {cp: glyph for cp, glyph in (font.getBestCmap() or {}).items() if glyph != ".notdef"}
                if claims_mono and all_faces_fixed:
                    all_faces_fixed = is_fixed_pitch(font, glyphs)
                face_chars = set(glyphs)
                # Test each usable face independently so partly complementary styles do not pass.
                full_russian |= RUSSIAN_LETTERS <= face_chars
                if not has_cyrillic_letter:
                    has_cyrillic_letter = full_russian or any(
                        unicode_fonts.script(chr(cp)) == "Cyrl"
                        and unicodedata.category(chr(cp)).startswith("L")
                        for cp in face_chars
                    )
                priority = (style != "normal", abs(default_weight - 400), filename)
                if sample_priority is None or priority < sample_priority:
                    cmap = face_chars
                    sample_priority = priority
                weight_css = str(lo) if lo == hi else f"{lo} {hi}"
                # Preserve the upstream binaries, including all variable axes, without renaming the face.
                fmt = "opentype" if filename.lower().endswith(".otf") else "truetype"
                descriptors = [
                    f"font-family: {json.dumps(family, ensure_ascii=False)}",
                    f'src: url("{quote(filename)}") format("{fmt}")',
                    f"font-weight: {weight_css}",
                    f"font-style: {style}",
                    "font-display: swap",
                ]
                if "wdth" in axes:
                    narrow, _, wide = axes["wdth"]
                    descriptors.append(f"font-stretch: {narrow:g}% {wide:g}%")
                css.append("@font-face { " + "; ".join(descriptors) + "; }")
                styles.add(style)
                faces.append(
                    {
                        "file": filename,
                        "postScriptName": ps_name,
                        "style": style,
                        "weight": default,
                        "axes": axes,
                        "sha256": sha,
                        "gitBlob": tree[filename],
                    }
                )
        if claims_mono and all_faces_fixed:
            category = "monospaced"
        scripts = language_names(metadata, cmap, full_russian, has_cyrillic_letter)
        sample = sample_for(metadata, cmap, family, scripts)
        if not scripts or not sample:
            return "no confirmed text repertoire", None
        for n in notices:
            data = file_bytes(folder / n, tree[n])
            (tmp / n).write_bytes(data)
            hashes[n] = sha256(data).hexdigest()
        css_text = "\n".join(css) + "\n"
        (tmp / "preview.css").write_text(css_text)
        license_url = f"https://raw.githubusercontent.com/google/fonts/{args.revision}/ofl/{slug}/OFL.txt"
        source_url = f"https://github.com/google/fonts/tree/{args.revision}/ofl/{slug}"
        record = {
            "id": "ofl-gf-" + slug,
            "name": family,
            "author": designer,
            "category": category,
            "languages": scripts,
            "fullRussian": full_russian,
            "weights": sorted(weights),
            "variable": any_variable,
            "styles": sorted(styles),
            "key": key,
            "sourceUrl": source_url,
            "licenseUrl": license_url,
            "source": "Google Fonts",
            "sample": sample,
        }
        with ZipFile(tmp / "family.zip", "w", compression=ZIP_DEFLATED, compresslevel=4) as zipf:
            for n in sorted(hashes):
                info = ZipInfo(n, (1980, 1, 1, 0, 0, 0))
                info.compress_type = ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                zipf.writestr(info, (tmp / n).read_bytes(), compresslevel=4)
        with ZipFile(tmp / "family.zip") as zipf:
            if set(zipf.namelist()) != set(hashes) or any(
                sha256(zipf.read(n)).hexdigest() != h for n, h in hashes.items()
            ):
                raise ValueError(f"{family}: packaged file hash mismatch")
        manifest = {
            "family": family,
            "source": source_url,
            "commit": args.revision,
            "metadataBlob": tree["METADATA.pb"],
            "license": "OFL-1.1",
            "licenseBlob": tree["OFL.txt"],
            "files": faces,
            "sha256": hashes,
            "archiveSha256": sha256((tmp / "family.zip").read_bytes()).hexdigest(),
        }
        (tmp / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
        if dest.exists():
            for built in tmp.iterdir():
                previous = dest / built.name
                if (
                    not previous.is_file()
                    or sha256(previous.read_bytes()).digest() != sha256(built.read_bytes()).digest()
                ):
                    raise ValueError(f"{family}: staged asset differs from the verified build: {previous}")
        else:
            tmp.chmod(0o755)
            for p in tmp.iterdir():
                p.chmod(0o644)
            tmp.rename(dest)
    return "added", record


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for arg in ("upstream", "existing", "assets", "catalog"):
        parser.add_argument("--" + arg, type=Path, required=True)
    parser.add_argument("--revision", required=True)
    parser.add_argument("--workers", type=int, default=4)
    args = parser.parse_args()
    if not 1 <= args.workers <= 16:
        parser.error("--workers must be 1..16")
    args.assets.mkdir(parents=True, exist_ok=True)
    tree = git_files(args.upstream, args.revision)
    existing = {identity(n) for n in json.loads(args.existing.read_text())}
    queued = []
    for slug, family_tree in sorted(tree.items()):
        if "METADATA.pb" not in family_tree:
            continue
        path = args.upstream / "ofl" / slug / "METADATA.pb"
        metadata = file_bytes(path, family_tree["METADATA.pb"]).decode("utf-8-sig")
        family = scalar(metadata, "name")
        if not family or identity(family) in existing:
            continue
        if not re.fullmatch("[a-z0-9]+", slug):
            raise ValueError("Unexpected Google Fonts family slug: " + slug)
        existing.add(identity(family))
        queued.append((args, slug, family_tree, metadata, family))
    print("Candidate families:", len(queued), flush=True)
    records = []
    outcomes = Counter()
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        for request, (status, record) in zip(
            queued, pool.map(lambda request: package_family(*request), queued)
        ):
            outcomes[status] += 1
            if record:
                records.append(record)
            else:
                print("Skip:", request[-1], status, flush=True)
            if sum(outcomes.values()) % 100 == 0:
                print("Processed", sum(outcomes.values()), "added", len(records), flush=True)
    records.sort(key=lambda r: r["name"].casefold())
    with NamedTemporaryFile(mode="w", dir=args.catalog.parent, delete=False) as output:
        json.dump(records, output, ensure_ascii=False, indent=2)
        output.write("\n")
        os.fchmod(output.fileno(), 0o644)
    os.replace(output.name, args.catalog)
    print(json.dumps(outcomes, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
