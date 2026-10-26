#!/usr/bin/env python3
"""Freeze GEO001 L7's source-reachable 130-frame introduction title."""

import argparse
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path("/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware")
SOURCE = SOURCE_ROOT / "G6-G8-shared/GEO001/L7/IR/L7IR01.swf"
AUDIT = ROOT / "migrations/shared-geo001-l07-p001/audit"
XML = AUDIT / "movie.xml"
TEXTS = AUDIT / "ffdec-26.2.1/texts"
OUTPUT = ROOT / "packages/demos/src/generated/geo001-l07-p001-source-ir-v1.json"
SWF_SHA = "9aafb8a470b5e67f4254b671696940c6fd53be258f517dd6b97abfa511e76430"
XML_SHA = "f1b22b10f00957bdb0ab04c61a956af7998961ac0a83c8e2b1d6456725e0ab69"
TEXT_SHA = "abec03391b80173b1dbe65f7d991449d71332033d9dec9042f8a4d3b40e98c26"
TITLE = "Volume and Surface Area: Introduction"


def demand(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(f"GEO_L07_P001_SOURCE_DRIFT: {reason}")


def read_pinned(file: Path, expected: str) -> bytes:
    demand(file.is_file() and not file.is_symlink(), f"physical file: {file}")
    data = file.read_bytes()
    demand(hashlib.sha256(data).hexdigest() == expected, f"SHA-256: {file}")
    return data


def title_pose(place: ET.Element, previous: dict | None) -> dict:
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
    demand(SOURCE_ROOT.is_dir() and not SOURCE_ROOT.is_symlink(), "real source root")
    read_pinned(SOURCE, SWF_SHA)
    swf = ET.fromstring(read_pinned(XML, XML_SHA))
    title = [read_pinned(TEXTS / f"{character}.txt", TEXT_SHA).decode("utf-8").strip()
             for character in (140, 141)]
    demand(title == [TITLE, TITLE], "exact source title in both text layers")
    header = swf.find("Header")
    demand(swf.get("version") == "6" and header is not None and
           header.get("framerate") == "12" and header.get("frames") == "10", "source clock")
    rect = header.find("./size/Rectangle")
    demand(rect is not None and rect.attrib ==
           {"left": "0", "right": "16000", "top": "0", "bottom": "12000"}, "800x600 stage")
    tags = header.find("tags")
    demand(tags is not None, "root tags")
    root_frame, placements, actions = 1, [], []
    for tag in tags:
        if tag.tag == "ShowFrame":
            root_frame += 1
        elif tag.tag in ("PlaceObject", "PlaceObject2", "PlaceObject3"):
            placements.append((root_frame, tag))
        elif tag.tag == "DoAction":
            actions.append(root_frame)
    demand(root_frame == 11 and actions == [1, 6] and len(placements) == 1,
           "root placement/action graph")
    entry_frame, placement = placements[0]
    demand(entry_frame == 6 and placement.get("objectID") == "142" and
           placement.get("name") == "animation" and placement.get("depth") == "1", "title entry")
    transform = placement.find("./transform/Transform")
    demand(transform is not None and transform.get("transX") == "8248" and
           transform.get("transY") == "5666", "root title transform")
    sprites = [tag for tag in tags if tag.tag == "DefineSprite" and tag.get("objectID") == "142"]
    demand(len(sprites) == 1 and sprites[0].get("frames") == "130", "title sprite")
    child_tags = sprites[0].find("tags")
    demand(child_tags is not None, "child tags")
    frames, current, changes = [], {}, 0
    for tag in child_tags:
        if tag.tag == "PlaceObject2":
            depth = int(tag.get("depth", "0"))
            demand(depth in (1, 2), "no other child layer")
            current[depth] = title_pose(tag, current.get(depth))
            changes += 1
        elif tag.tag == "ShowFrame":
            demand(set(current) == {1, 2}, "both title layers at every frame")
            frames.append({"frame": len(frames) + 1, "layers": [current[1], current[2]]})
        else:
            demand(tag.tag == "End", "no child script, sound, or hidden interaction")
    demand(len(frames) == 130 and changes == 258, "complete title placements")
    demand(frames[0]["layers"][0]["alpha256"] == 0 and
           frames[128]["layers"][0]["alpha256"] == 256 and
           frames[129]["layers"] == frames[128]["layers"], "fade and terminal hold")
    background = tags.find("./SetBackgroundColor/color/Color")
    demand(background is not None and background.attrib ==
           {"red": "184", "green": "216", "blue": "247"}, "source background")
    ir = {
        "schemaVersion": 1,
        "animationId": "shared-geo001-l07-p001",
        "sourceRelativePath": "G6-G8-shared/GEO001/L7/IR/L7IR01.swf",
        "sourceSwfSha256": SWF_SHA,
        "swfmillXmlSha256": XML_SHA,
        "ffdecVersion": "26.2.1",
        "titleTextSha256": TEXT_SHA,
        "title": TITLE,
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
        demand(OUTPUT.is_file() and OUTPUT.read_bytes() == expected,
               "product IR differs from source")
        print(f"PASS {OUTPUT.relative_to(ROOT)} source-bound 130 frames")


if __name__ == "__main__":
    main()
