from __future__ import annotations

import hashlib
import io
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path.cwd()
RELATIONS_PATH = ROOT / "src/app/data/verified/family-relations.json"
OUTPUT_PATH = ROOT / "src/app/data/verified/artifacts/historical-fonts.json"
TOKEN = os.environ.get("GITHUB_TOKEN", "")

TARGETS = [
    {
        "family": "Source Sans Pro",
        "repository": "adobe-fonts/source-sans",
        "ref": "f42c6e78cef38a192aa1e45bc3ff9b80e0d4b7f6",
        "paths": [
            "TTF/SourceSansPro-Regular.ttf",
            "OTF/SourceSansPro-Regular.otf",
        ],
    },
    {
        "family": "Open Sans Condensed",
        "repository": "google/fonts",
        "parent_of": "42fa6aedff8c20a9516b130182ba260a8ff3decb",
        "paths": [
            "apache/opensanscondensed/OpenSansCondensed-Light.ttf",
            "apache/opensanscondensed/OpenSansCondensed-Regular.ttf",
            "apache/opensanscondensed/OpenSansCondensed-Bold.ttf",
        ],
    },
]

ALLOWED_LICENSES = {"OFL-1.1", "Apache-2.0"}


def github_json(path: str):
    url = f"https://api.github.com/{path.lstrip('/')}"
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "onod-fonts-historical-artifact/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)


def download_bytes(url: str) -> bytes:
    headers = {"User-Agent": "onod-fonts-historical-artifact/1.0"}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=60) as response:
        return response.read()


def resolve_ref(target: dict) -> str:
    if target.get("ref"):
        return target["ref"]
    removal = target["parent_of"]
    commit = github_json(f"repos/{target['repository']}/commits/{removal}")
    parents = commit.get("parents") or []
    if not parents or not parents[0].get("sha"):
        raise RuntimeError(f"{target['family']}: cannot resolve parent of {removal}")
    return parents[0]["sha"]


def resolve_file(target: dict, ref: str):
    for candidate in target["paths"]:
        encoded = urllib.parse.quote(candidate, safe="/")
        encoded_ref = urllib.parse.quote(ref, safe="")
        try:
            item = github_json(f"repos/{target['repository']}/contents/{encoded}?ref={encoded_ref}")
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                continue
            raise
        if item.get("type") == "file" and item.get("download_url") and item.get("sha"):
            return candidate, item
    raise RuntimeError(f"{target['family']}: no historical font artifact found in reviewed candidate paths at {ref}")


def names(font: TTFont):
    table = font["name"]
    wanted = {1: "family", 2: "subfamily", 4: "fullName", 6: "postScriptName", 16: "typographicFamily", 17: "typographicSubfamily"}
    out = {}
    for name_id, key in wanted.items():
        values = []
        for record in table.names:
            if record.nameID != name_id:
                continue
            try:
                value = record.toUnicode().strip()
            except Exception:
                continue
            if value and value not in values:
                values.append(value)
        if values:
            out[key] = values
    return out


def axes(font: TTFont):
    if "fvar" not in font:
        return []
    result = []
    for axis in font["fvar"].axes:
        result.append({
            "tag": axis.axisTag,
            "min": float(axis.minValue),
            "default": float(axis.defaultValue),
            "max": float(axis.maxValue),
        })
    return result


def feature_tags(font: TTFont, tag: str):
    if tag not in font:
        return []
    try:
        records = font[tag].table.FeatureList.FeatureRecord
    except Exception:
        return []
    return sorted({record.FeatureTag for record in records if getattr(record, "FeatureTag", None)})


def scripts_from_codepoints(codepoints):
    tests = {
        "Latin": [(0x0000, 0x024F), (0x1E00, 0x1EFF)],
        "Greek": [(0x0370, 0x03FF), (0x1F00, 0x1FFF)],
        "Cyrillic": [(0x0400, 0x052F), (0x2DE0, 0x2DFF), (0xA640, 0xA69F)],
        "Arabic": [(0x0600, 0x06FF), (0x0750, 0x077F), (0x08A0, 0x08FF)],
        "Hebrew": [(0x0590, 0x05FF)],
        "Devanagari": [(0x0900, 0x097F)],
        "Thai": [(0x0E00, 0x0E7F)],
        "Vietnamese": [(0x1EA0, 0x1EF9)],
    }
    result = []
    for script, ranges in tests.items():
        if any(any(start <= cp <= end for start, end in ranges) for cp in codepoints):
            result.append(script)
    return result


def inspect(data: bytes):
    font = TTFont(io.BytesIO(data), lazy=False, recalcBBoxes=False, recalcTimestamp=False)
    table_tags = sorted(font.keys())
    best_cmap = font.getBestCmap() or {}
    codepoints = sorted(int(cp) for cp in best_cmap.keys())
    os2 = font["OS/2"] if "OS/2" in font else None
    head = font["head"] if "head" in font else None
    hhea = font["hhea"] if "hhea" in font else None
    maxp = font["maxp"] if "maxp" in font else None
    result = {
        "sfntVersion": str(font.sfntVersion),
        "tables": table_tags,
        "names": names(font),
        "axes": axes(font),
        "cmap": {
            "count": len(codepoints),
            "min": codepoints[0] if codepoints else None,
            "max": codepoints[-1] if codepoints else None,
            "scripts": scripts_from_codepoints(codepoints),
        },
        "features": {
            "GSUB": feature_tags(font, "GSUB"),
            "GPOS": feature_tags(font, "GPOS"),
        },
        "metrics": {
            "unitsPerEm": int(head.unitsPerEm) if head else None,
            "ascender": int(hhea.ascent) if hhea else None,
            "descender": int(hhea.descent) if hhea else None,
            "glyphCount": int(maxp.numGlyphs) if maxp else None,
            "weightClass": int(os2.usWeightClass) if os2 else None,
            "widthClass": int(os2.usWidthClass) if os2 else None,
        },
    }
    font.close()
    return result


def main():
    relations = json.loads(RELATIONS_PATH.read_text("utf8"))
    output = {}
    for target in TARGETS:
        family = target["family"]
        relation = relations.get(family)
        if not relation or relation.get("status") != "verified" or not str(relation.get("relation", "")).startswith("historical-"):
            raise RuntimeError(f"{family}: historical artifact acquisition requires a verified historical relation")
        license_id = (relation.get("historical") or {}).get("licenseId")
        if license_id not in ALLOWED_LICENSES:
            raise RuntimeError(f"{family}: historical license '{license_id}' is not approved for artifact inspection")

        ref = resolve_ref(target)
        path, item = resolve_file(target, ref)
        data = download_bytes(item["download_url"])
        artifact = inspect(data)
        artifact.update({
            "family": family,
            "relation": relation["relation"],
            "repository": target["repository"],
            "ref": ref,
            "path": path,
            "gitBlobSha": item["sha"],
            "sourceUrl": item["download_url"],
            "licenseId": license_id,
            "sha256": hashlib.sha256(data).hexdigest(),
            "size": len(data),
        })
        output[family] = artifact
        print(f"{family}: {path} @ {ref[:12]} sha256={artifact['sha256']} names={artifact['names'].get('family', [])} axes={len(artifact['axes'])} cmap={artifact['cmap']['count']}")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(dict(sorted(output.items())), indent=2, ensure_ascii=False) + "\n", "utf8")
    print(f"Historical artifact evidence written: {len(output)} families -> {OUTPUT_PATH}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise
