#!/usr/bin/env python3
"""Build the source-bound GEO001 L6 introduction display-list IR.

The source SWF is immutable. swfmill's XML and FFDec's two text exports are
audit inputs; this script creates the product IR exclusively and checks it
without modifying an existing output.
"""

import argparse
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(
    "/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/"
    "G6-G8-shared/GEO001/L6/IR/L6IR01.swf"
)
AUDIT = ROOT / "migrations/shared-geo001-l06-p001/audit"
XML = AUDIT / "movie.xml"
TEXTS = AUDIT / "ffdec-26.2.1/texts"
OUTPUT = ROOT / "packages/demos/src/generated/geo001-l06-p001-source-ir-v1.json"
SWF_SHA = "8997176bb8c1f3e68a8011ee98f132ece217c881b2407b90b42ea4067de49c58"
XML_SHA = "c08e2bb68aec6d90fcd89d6217d7fc87bd1fbb7ecd07411faf0f5badee8c694c"
TEXT_SHA = "8f22aa91bb9c19b7f2577cbbd74c0fe3e4e6ecb0fe47497ddd0a6607803de4fc"


def demand(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(f"GEO_L06_P001_SOURCE_DRIFT: {reason}")


def read_pinned(file: Path, expected: str) -> bytes:
    demand(file.is_file() and not file.is_symlink(), f"physical file: {file}")
    data = file.read_bytes()
    demand(hashlib.sha256(data).hexdigest() == expected, f"SHA-256: {file}")
    return data


def pose(place: ET.Element, previous: dict | None) -> dict:
    depth = int(place.attrib["depth"])
    character = int(place.attrib.get("objectID", previous["characterId"] if previous else 0))
    demand(depth in (1, 2) and character == 139 + depth, "title-only depth and character")
    transform = place.find("./transform/Transform")
    color = place.find("./colorTransform/ColorTransform2")
    demand(transform is not None and color is not None, "explicit title transform and alpha")
    return {
        "characterId": character,
        "depth": depth,
        "scaleX": float(transform.get("scaleX", "1")),
        "scaleY": float(transform.get("scaleY", "1")),
        "transXTwips": int(transform.get("transX", "0")),
        "transYTwips": int(transform.get("transY", "0")),
        "alpha256": int(color.get("factorAlpha", "256")),
    }


def build() -> bytes:
    demand(SOURCE.parent.is_dir() and not SOURCE.parent.is_symlink(), "real source directory")
    read_pinned(SOURCE, SWF_SHA)
    xml_bytes = read_pinned(XML, XML_SHA)
    title = []
    for character in (140, 141):
        title.append(read_pinned(TEXTS / f"{character}.txt", TEXT_SHA).decode("utf-8").strip())
    demand(title == ["Circles: Introduction"] * 2, "exact exported title")

    swf = ET.fromstring(xml_bytes)
    header = swf.find("Header")
    demand(swf.get("version") == "6" and header is not None, "SWF version")
    demand(header.get("framerate") == "12" and header.get("frames") == "10", "root clock")
    rect = header.find("./size/Rectangle")
    demand(rect is not None and rect.attrib == {"left": "0", "right": "16000", "top": "0", "bottom": "12000"}, "800x600 stage")
    tags = header.find("tags")
    demand(tags is not None, "root tags")
    root_frame = 1
    root_placements = []
    root_actions = []
    for tag in tags:
        if tag.tag == "ShowFrame":
            root_frame += 1
        elif tag.tag in ("PlaceObject", "PlaceObject2", "PlaceObject3"):
            root_placements.append((root_frame, tag))
        elif tag.tag == "DoAction":
            root_actions.append(root_frame)
    demand(root_frame == 11 and root_actions == [1, 6] and len(root_placements) == 1,
           "root placement/action graph")
    entry_frame, placement = root_placements[0]
    demand(entry_frame == 6 and placement.get("objectID") == "142" and
           placement.get("name") == "animation" and placement.get("depth") == "1", "title entry")
    transform = placement.find("./transform/Transform")
    demand(transform is not None and transform.get("transX") == "8248" and
           transform.get("transY") == "5666", "root title transform")
    sprites = [tag for tag in tags if tag.tag == "DefineSprite" and tag.get("objectID") == "142"]
    demand(len(sprites) == 1 and sprites[0].get("frames") == "130", "130-frame title sprite")
    child_tags = sprites[0].find("tags")
    demand(child_tags is not None, "child tags")
    frames = []
    current: dict[int, dict] = {}
    changes = 0
    for tag in child_tags:
        if tag.tag == "PlaceObject2":
            depth = int(tag.get("depth", "0"))
            demand(depth in (1, 2), "no other child layer")
            current[depth] = pose(tag, current.get(depth))
            changes += 1
        elif tag.tag == "ShowFrame":
            demand(set(current) == {1, 2}, "both title layers at every frame")
            frames.append({"frame": len(frames) + 1, "layers": [current[1], current[2]]})
        else:
            demand(tag.tag == "End", "no child script, sound or hidden interaction")
    demand(len(frames) == 130 and changes == 258, "129 animated frames plus held final frame")
    demand(frames[0]["layers"][0]["alpha256"] == 0 and
           frames[128]["layers"][0]["alpha256"] == 256 and
           frames[129]["layers"] == frames[128]["layers"], "fade and terminal hold")
    background = tags.find("./SetBackgroundColor/color/Color")
    demand(background is not None and background.attrib ==
           {"red": "184", "green": "216", "blue": "247"}, "source background")
    ir = {
        "schemaVersion": 1,
        "animationId": "shared-geo001-l06-p001",
        "sourceRelativePath": "G6-G8-shared/GEO001/L6/IR/L6IR01.swf",
        "sourceSwfSha256": SWF_SHA,
        "swfmillXmlSha256": XML_SHA,
        "ffdecVersion": "26.2.1",
        "titleTextSha256": TEXT_SHA,
        "title": title[0],
        "sourceTextIds": [140, 141],
        "stage": {"width": 800, "height": 600, "backgroundColor": "#b8d8f7"},
        "fps": 12,
        "rootFrameCount": 10,
        "rootEntryFrame": 6,
        "rootPlacement": {"characterId": 142, "depth": 1, "xTwips": 8248, "yTwips": 5666},
        "mainFrameDomain": "sprite-142",
        "mainFrameCount": 130,
        "frames": frames,
        "auditBoundary": "Root-reachable display list only; legacy host preloader and RandomAudio remain unresolved.",
    }
    return (json.dumps(ir, indent=2, ensure_ascii=False) + "\n").encode()


def write_exclusive(file: Path, data: bytes) -> None:
    with file.open("xb") as handle:
        handle.write(data)


def main() -> None:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true")
    mode.add_argument("--check", action="store_true")
    args = parser.parse_args()
    expected = build()
    if args.write:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        write_exclusive(OUTPUT, expected)
        print(f"created {OUTPUT.relative_to(ROOT)} ({len(expected)} bytes)")
    else:
        demand(OUTPUT.is_file() and OUTPUT.read_bytes() == expected, "product IR differs from source")
        print(f"PASS {OUTPUT.relative_to(ROOT)} source-bound 130 frames")


if __name__ == "__main__":
    main()
