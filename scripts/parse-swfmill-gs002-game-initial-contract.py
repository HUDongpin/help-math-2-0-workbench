#!/usr/bin/env python3
"""Extract the narrow GS002 frame-427 game-initial drawing contract.

This parser reads swfmill XML only. It does not execute ActionScript or launch
an original Flash runtime. The output is deliberately structural: frame/tag
boundaries, placements, button identities, and blank dynamic-field geometry.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import xml.etree.ElementTree as ET


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--swfmill", required=True, type=Path)
    parser.add_argument("--object-id", required=True, type=int)
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
        value = node.get(key)
        if value is not None:
            result[key] = float(value) if "." in value else int(value)
    return result


def edit_text(root: ET.Element, object_id: int) -> dict[str, object]:
    node = one(
        [item for item in root.iter("DefineEditText")
         if item.get("objectID") == str(object_id)],
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
        "hasBorder": node.get("hasBorder") == "1",
        "useOutlines": node.get("useOutlines") == "1",
        "maxLength": int(node.get("maxLength", "0")),
        "initialText": node.get("initialText", ""),
        "boundsTwips": {
            key: integer(rectangle.get(key), f"bounds {key}")
            for key in ("left", "right", "top", "bottom")
        },
        "color": {
            key: integer(color.get(key), f"color {key}")
            for key in ("red", "green", "blue", "alpha")
        },
    }


def font(root: ET.Element, object_id: int) -> dict[str, object]:
    node = one(
        [item for item in root.iter("DefineFont2")
         if item.get("objectID") == str(object_id)],
        f"DefineFont2 objectID={object_id}",
    )
    glyphs = one(node.findall("./glyphs"), "font glyph inventory")
    return {
        "objectId": object_id,
        "name": node.get("name", ""),
        "bold": node.get("bold") == "1",
        "italic": node.get("italic") == "1",
        "language": integer(node.get("language"), "font language"),
        "glyphCount": len(list(glyphs)),
    }


def main() -> None:
    args = parse_args()
    if args.object_id < 1:
        raise ValueError("object id must be positive")
    root = ET.parse(args.swfmill).getroot()
    sprite = one(
        [node for node in root.iter("DefineSprite")
         if node.get("objectID") == str(args.object_id)],
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
            if "<Stop" in ET.tostring(tag, encoding="unicode"):
                stop_frame_candidates.append(current_frame)
        elif tag.tag == "PlaceObject2":
            placements.setdefault(current_frame, []).append({
                "depth": integer(tag.get("depth"), "placement depth"),
                "objectId": integer(tag.get("objectID"), "placement objectID")
                if tag.get("objectID") is not None else None,
                "name": tag.get("name"),
                "replace": tag.get("replace") == "1",
                "transform": transform(tag),
                "hasEvents": tag.find("./events") is not None,
            })
        elif tag.tag == "ShowFrame":
            current_frame += 1

    declared_frame_count = integer(sprite.get("frames"), "sprite frames")
    observed_show_frame_count = current_frame - 1
    if observed_show_frame_count != declared_frame_count:
        raise ValueError("target sprite ShowFrame count differs from declaration")

    button_ids = sorted(
        integer(node.get("objectID"), "button objectID")
        for node in root.iter("DefineButton2")
    )
    payload = {
        "schemaVersion": 1,
        "parser": "python-xml.etree.ElementTree",
        "targetSprite": {
            "objectId": args.object_id,
            "declaredFrameCount": declared_frame_count,
            "observedShowFrameCount": observed_show_frame_count,
            "actionFrames": action_frames,
            "stopFrameCandidates": stop_frame_candidates,
            "entryFrame": 427,
            "entryTagSequence": frame_tags.get(427, []),
            "entryPlacements": placements.get(427, []),
            "postStopFrames": [
                {
                    "frame": 428,
                    "tagSequence": frame_tags.get(428, []),
                    "placements": placements.get(428, []),
                }
            ],
        },
        "dynamicText": {
            "timer": edit_text(root, 77),
            "score": edit_text(root, 83),
            "sign": edit_text(root, 137),
            "location": edit_text(root, 138),
            "feedback": edit_text(root, 157),
        },
        "dynamicFonts": {
            "timer": font(root, 76),
            "score": font(root, 82),
        },
        "buttonObjectIds": button_ids,
        "authorityBoundary": {
            "actionScriptExecuted": False,
            "naturalRuntimeEstablished": False,
            "interactionEstablished": False,
            "visualParityEstablished": False,
            "audioEstablished": False,
            "acceptanceEffect": "none",
        },
    }
    print(json.dumps(payload, sort_keys=True, separators=(",", ":")))


if __name__ == "__main__":
    main()
