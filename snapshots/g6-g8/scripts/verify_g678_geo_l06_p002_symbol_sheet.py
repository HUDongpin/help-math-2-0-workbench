"""Fail-closed structural audit of P002's source-derived local SVG sheet.

This verifies technical content, not original-runtime fidelity or distribution rights.
"""

from __future__ import annotations

import base64
import hashlib
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SHEET = ROOT / "migrations/shared-geo001-l06-p002/audit/source-symbol-sheet-v1.svg"
SHEET_SHA256 = "ae5c6fb9ba4e7c5b4acb1ee1187739a2bf6c1c81ff6d0c9129c428a1f9094c7c"
SVG = "http://www.w3.org/2000/svg"
XLINK = "http://www.w3.org/1999/xlink"
FFDEC = "https://www.free-decompiler.com/flash"
TAGS = {"svg", "defs", "g", "path", "stop", "linearGradient", "radialGradient",
        "use", "pattern", "image"}
ATTRIBUTES = {"fill", "d", "stroke", "fill-rule", "offset", "stop-color",
              "stroke-linecap", "stroke-linejoin", "stroke-width", "stop-opacity",
              "gradientTransform", "gradientUnits", "spreadMethod", "stroke-opacity",
              "id", "x1", "x2", "cx", "cy", "r", "transform", "width", "height",
              "href", "fill-opacity", "viewBox", "style", "overflow", "patternTransform",
              "patternUnits"}
FFDEC_ATTRIBUTES = {"has-small-stroke", "original-stroke-width", "fill-bitmapId"}
FRAGMENT = re.compile(r"#[A-Za-z0-9_-]+\Z")
CSS_REFERENCE = re.compile(r"url\(#([A-Za-z0-9_-]+)\)")
CHARACTER = re.compile(r"geo-p002-character-(\d+)\Z")


def _split(name: str) -> tuple[str, str]:
    if name.startswith("{"):
        namespace, local = name[1:].split("}", 1)
        return namespace, local
    return "", name


def inspect_sheet(data: bytes, expected_characters: int = 207) -> dict[str, object]:
    """Reject executable markup, external resources, and broken local references."""
    if b"<!DOCTYPE" in data.upper() or b"<!ENTITY" in data.upper():
        raise ValueError("SVG entity or document type is forbidden")
    root = ET.fromstring(data)
    if root.tag != f"{{{SVG}}}svg" or len(root) != 1 or root[0].tag != f"{{{SVG}}}defs":
        raise ValueError("SVG sheet must contain one defs root")
    definitions = root[0]
    if len(definitions) != expected_characters:
        raise ValueError("SVG character count drift")
    character_ids = []
    for item in definitions:
        match = CHARACTER.fullmatch(item.get("id", ""))
        if item.tag != f"{{{SVG}}}g" or match is None:
            raise ValueError("SVG character identity drift")
        character_ids.append(int(match.group(1)))
    if len(set(character_ids)) != expected_characters:
        raise ValueError("duplicate SVG character")

    ids: set[str] = set()
    references: list[str] = []
    tag_counts: dict[str, int] = {}
    embedded_png_hashes: list[str] = []
    for element in root.iter():
        namespace, tag = _split(element.tag)
        if namespace != SVG or tag not in TAGS:
            raise ValueError(f"unsupported SVG element: {tag}")
        tag_counts[tag] = tag_counts.get(tag, 0) + 1
        if element.text and element.text.strip() or element.tail and element.tail.strip():
            raise ValueError("SVG text content is not expected")
        for raw_name, value in element.attrib.items():
            attr_namespace, name = _split(raw_name)
            if name.lower().startswith("on"):
                raise ValueError("SVG event attribute is forbidden")
            if attr_namespace == FFDEC:
                if name not in FFDEC_ATTRIBUTES:
                    raise ValueError(f"unsupported FFDec metadata: {name}")
            elif attr_namespace not in ("", XLINK) or name not in ATTRIBUTES or (
                attr_namespace == XLINK and name != "href"
            ):
                raise ValueError(f"unsupported SVG attribute: {name}")
            if name == "id":
                if value in ids or not re.fullmatch(r"[A-Za-z0-9_-]+", value):
                    raise ValueError("duplicate or invalid SVG ID")
                ids.add(value)
            elif name == "href":
                if tag == "use" and FRAGMENT.fullmatch(value):
                    references.append(value[1:])
                elif tag == "image" and value.startswith("data:image/PNG;base64,"):
                    png = base64.b64decode(value.partition(",")[2], validate=True)
                    if not png.startswith(b"\x89PNG\r\n\x1a\n"):
                        raise ValueError("embedded image is not PNG")
                    embedded_png_hashes.append(hashlib.sha256(png).hexdigest())
                else:
                    raise ValueError("external or unsupported SVG href")
            elif "url(" in value:
                matched = CSS_REFERENCE.findall(value)
                if len(matched) != value.count("url("):
                    raise ValueError("external CSS resource")
                if name == "style" and not re.fullmatch(
                    r"fill:url\(#[A-Za-z0-9_-]+\)", value
                ):
                    raise ValueError("unsupported inline style")
                references.extend(matched)
            elif name == "style" and value != "image-rendering:optimizeQuality":
                raise ValueError("unsupported inline style")
            if "javascript:" in value.lower():
                raise ValueError("executable SVG URL")
    if any(reference not in ids for reference in references):
        raise ValueError("unresolved SVG reference")
    if tag_counts.get("image") != 1 or len(embedded_png_hashes) != 1:
        raise ValueError("embedded PNG count drift")
    return {"characters": len(character_ids), "elements": sum(tag_counts.values()),
            "tagCounts": tag_counts, "internalReferences": len(references),
            "embeddedPngSha256": embedded_png_hashes[0], "externalResources": 0,
            "executableElementsOrAttributes": 0}


if __name__ == "__main__":
    sheet = SHEET.read_bytes()
    if hashlib.sha256(sheet).hexdigest() != SHEET_SHA256:
        raise SystemExit("P002 source symbol sheet hash drift")
    print(json.dumps({"sheetSha256": SHEET_SHA256, **inspect_sheet(sheet)}, sort_keys=True))
