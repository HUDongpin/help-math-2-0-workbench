#!/usr/bin/env python3
"""Extract the narrow IN006 number-line quiz contract from swfmill XML.

The parser records the exact terminal quiz entry frame, its display-list
placements, the three post-stop frames, the dynamic text definitions, and the
embedded Bauhaus font metrics exported by FFDec. It never executes
ActionScript and grants no runtime, fidelity, audio, review, or acceptance
authority.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
from pathlib import Path
import xml.etree.ElementTree as ET

logging.getLogger("fontTools").setLevel(logging.CRITICAL)
from fontTools.ttLib import TTFont  # noqa: E402


def positive_int(value: str) -> int:
    parsed = int(value)
    if parsed < 1:
        raise argparse.ArgumentTypeError("value must be positive")
    return parsed


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--swfmill", required=True, type=Path)
    parser.add_argument("--ttf", required=True, type=Path)
    parser.add_argument("--object-id", required=True, type=positive_int)
    parser.add_argument("--font-object-id", required=True, type=positive_int)
    return parser.parse_args()


def one(elements: list[ET.Element], label: str) -> ET.Element:
    if len(elements) != 1:
        raise ValueError(f"expected exactly one {label}, observed {len(elements)}")
    return elements[0]


def integer(value: str | None, label: str) -> int:
    if value is None:
        raise ValueError(f"missing integer {label}")
    return int(value)


def transform(place: ET.Element) -> dict[str, int | float]:
    nodes = place.findall("./transform/Transform")
    if not nodes:
        return {}
    node = one(nodes, "placement Transform")
    result: dict[str, int | float] = {}
    for key in ("scaleX", "scaleY", "skewX", "skewY", "transX", "transY"):
        if node.get(key) is not None:
            value = node.get(key, "")
            result[key] = float(value) if "." in value else int(value)
    return result


def edit_text(root: ET.Element, object_id: int) -> dict[str, object]:
    node = one(
        [
            item
            for item in root.iter("DefineEditText")
            if item.get("objectID") == str(object_id)
        ],
        f"DefineEditText objectID={object_id}",
    )
    rectangle = one(node.findall("./size/Rectangle"), "edit-text bounds")
    color = one(node.findall("./color/Color"), "edit-text color")
    return {
        "objectId": object_id,
        "fontRef": integer(node.get("fontRef"), "fontRef"),
        "fontHeightTwips": integer(node.get("fontHeight"), "fontHeight"),
        "align": integer(node.get("align"), "align"),
        "readOnly": node.get("readOnly") == "1",
        "notSelectable": node.get("notSelectable") == "1",
        "boundsTwips": {
            key: integer(rectangle.get(key), f"bounds {key}")
            for key in ("left", "right", "top", "bottom")
        },
        "color": {
            key: integer(color.get(key), f"color {key}")
            for key in ("red", "green", "blue", "alpha")
        },
    }


def main() -> None:
    args = parse_args()
    root = ET.parse(args.swfmill).getroot()
    sprite = one(
        [
            node
            for node in root.iter("DefineSprite")
            if node.get("objectID") == str(args.object_id)
        ],
        f"DefineSprite objectID={args.object_id}",
    )
    tags = one(sprite.findall("./tags"), "sprite tags")

    current_frame = 1
    frame_tags: dict[int, list[str]] = {}
    placements: dict[int, list[dict[str, object]]] = {}
    action_frames: list[int] = []
    stop_frame_candidates: list[int] = []
    for tag in list(tags):
        frame_tags.setdefault(current_frame, []).append(tag.tag)
        if tag.tag == "DoAction":
            action_frames.append(current_frame)
            action_xml = ET.tostring(tag, encoding="unicode")
            if "Stop" in action_xml:
                stop_frame_candidates.append(current_frame)
        elif tag.tag == "PlaceObject2":
            placements.setdefault(current_frame, []).append(
                {
                    "depth": integer(tag.get("depth"), "placement depth"),
                    "objectId": (
                        integer(tag.get("objectID"), "placement objectID")
                        if tag.get("objectID") is not None
                        else None
                    ),
                    "name": tag.get("name"),
                    "transform": transform(tag),
                    "hasEvents": tag.find("./events") is not None,
                }
            )
        elif tag.tag == "ShowFrame":
            current_frame += 1

    declared_frame_count = integer(sprite.get("frames"), "sprite frames")
    observed_show_frame_count = current_frame - 1
    if observed_show_frame_count != declared_frame_count:
        raise ValueError(
            "target sprite ShowFrame count differs from its declared frame count"
        )

    numbering = one(
        [item for item in placements.get(1, []) if item["name"] == "numbering"],
        "frame-1 numbering template placement",
    )
    entry_frame = 1054
    entry_placements = placements.get(entry_frame, [])
    named_entry_placements = [item for item in entry_placements if item["name"]]

    font_node = one(
        [
            node
            for node in root.iter("DefineFont2")
            if node.get("objectID") == str(args.font_object_id)
        ],
        f"DefineFont2 objectID={args.font_object_id}",
    )
    glyph_count = len(font_node.findall("./glyphs/Glyph"))
    ttf_bytes = args.ttf.read_bytes()
    font = TTFont(args.ttf, recalcBBoxes=False, recalcTimestamp=False)
    cmap = font.getBestCmap()
    metrics = font["hmtx"].metrics
    required_characters = " -0123456789to+="
    advances: dict[str, int] = {}
    for character in required_characters:
        glyph_name = cmap.get(ord(character))
        if glyph_name is None or glyph_name not in metrics:
            raise ValueError(f"exported font is missing required glyph {character!r}")
        advances[character] = int(metrics[glyph_name][0])

    payload = {
        "schemaVersion": 1,
        "parser": "python-xml.etree.ElementTree+fontTools.ttLib",
        "targetSprite": {
            "objectId": args.object_id,
            "declaredFrameCount": declared_frame_count,
            "observedShowFrameCount": observed_show_frame_count,
            "actionFrames": action_frames,
            "stopFrameCandidates": stop_frame_candidates,
            "entryFrame": entry_frame,
            "entryTagSequence": frame_tags.get(entry_frame, []),
            "entryPlacements": named_entry_placements,
            "postStopFrames": [
                {"frame": frame, "tagSequence": frame_tags.get(frame, [])}
                for frame in range(entry_frame + 1, declared_frame_count + 1)
            ],
            "numberingTemplate": numbering,
        },
        "dynamicText": {
            "numberLabel": edit_text(root, 14),
            "question": edit_text(root, 139),
            "answer": edit_text(root, 140),
        },
        "font": {
            "objectId": args.font_object_id,
            "name": font_node.get("name", ""),
            "glyphCount": glyph_count,
            "ttfBytes": len(ttf_bytes),
            "ttfSha256": hashlib.sha256(ttf_bytes).hexdigest(),
            "unitsPerEm": int(font["head"].unitsPerEm),
            "ascent": int(font["hhea"].ascent),
            "descent": int(font["hhea"].descent),
            "advances": advances,
        },
        "authorityBoundary": {
            "actionScriptExecuted": False,
            "naturalRuntimeEstablished": False,
            "visualParityEstablished": False,
            "audioEstablished": False,
            "acceptanceEffect": "none",
        },
    }
    print(json.dumps(payload, sort_keys=True, separators=(",", ":")))


if __name__ == "__main__":
    main()
