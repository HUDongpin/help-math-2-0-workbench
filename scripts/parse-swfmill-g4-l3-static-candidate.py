#!/usr/bin/env python3
"""Extract one source-static course sprite contract from swfmill XML.

This parser is intentionally narrow. It proves stage/header/background, the
root begin label, and one named root placement. It does not claim natural
runtime reachability, audio timing, localization, or acceptance.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import xml.etree.ElementTree as ET


def positive_int(value: str) -> int:
    parsed = int(value)
    if parsed < 1:
        raise argparse.ArgumentTypeError("value must be positive")
    return parsed


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--swfmill", required=True, type=Path)
    parser.add_argument("--object-id", required=True, type=positive_int)
    parser.add_argument("--placement-name", required=True)
    parser.add_argument("--begin-label", required=True)
    return parser.parse_args()


def one(elements: list[ET.Element], label: str) -> ET.Element:
    if len(elements) != 1:
        raise ValueError(f"expected exactly one {label}, observed {len(elements)}")
    return elements[0]


def frame_numbered_root_facts(
    tags: ET.Element,
    *,
    object_id: str,
    placement_name: str,
    begin_label: str,
) -> tuple[dict[str, object], dict[str, object]]:
    current_frame = 1
    labels: list[dict[str, object]] = []
    placements: list[dict[str, object]] = []

    for tag in list(tags):
        if tag.tag == "ShowFrame":
            current_frame += 1
            continue
        if tag.tag == "FrameLabel" and tag.get("label") == begin_label:
            labels.append({"label": begin_label, "frame": current_frame})
        if (
            tag.tag in {"PlaceObject", "PlaceObject2", "PlaceObject3"}
            and tag.get("objectID") == object_id
            and tag.get("name") == placement_name
        ):
            transform = one(tag.findall("./transform/Transform"), "placement Transform")
            trans_x = int(transform.get("transX", "0"))
            trans_y = int(transform.get("transY", "0"))
            placements.append(
                {
                    "tag": tag.tag,
                    "frame": current_frame,
                    "depth": int(tag.get("depth", "0")),
                    "name": placement_name,
                    "objectId": int(object_id),
                    "translationTwips": {"x": trans_x, "y": trans_y},
                    "translationPixels": {"x": trans_x / 20, "y": trans_y / 20},
                }
            )

    return one(labels, f"root label {begin_label!r}"), one(
        placements,
        f"root placement {placement_name!r} objectID={object_id}",
    )


def main() -> None:
    args = parse_args()
    root = ET.parse(args.swfmill).getroot()
    header = one(root.findall("./Header"), "Header")
    tags = one(header.findall("./tags"), "root tags")
    target_id = str(args.object_id)

    sprite = one(
        [node for node in tags.findall("./DefineSprite") if node.get("objectID") == target_id],
        f"root-level DefineSprite objectID={target_id}",
    )
    begin, placement = frame_numbered_root_facts(
        tags,
        object_id=target_id,
        placement_name=args.placement_name,
        begin_label=args.begin_label,
    )

    rectangle = one(header.findall("./size/Rectangle"), "stage Rectangle")
    left = int(rectangle.get("left", "0"))
    right = int(rectangle.get("right", "0"))
    top = int(rectangle.get("top", "0"))
    bottom = int(rectangle.get("bottom", "0"))
    background_tag = one(tags.findall("./SetBackgroundColor"), "SetBackgroundColor")
    color = one(background_tag.findall("./color/Color"), "background Color")
    red = int(color.get("red", "0"))
    green = int(color.get("green", "0"))
    blue = int(color.get("blue", "0"))

    payload = {
        "schemaVersion": 1,
        "parser": "python-xml.etree.ElementTree",
        "stage": {
            "widthTwips": right - left,
            "heightTwips": bottom - top,
            "width": (right - left) / 20,
            "height": (bottom - top) / 20,
            "backgroundRgb": {"red": red, "green": green, "blue": blue},
            "backgroundHex": f"#{red:02x}{green:02x}{blue:02x}",
        },
        "fps": float(header.get("framerate", "0")),
        "rootFrameCount": int(header.get("frames", "0")),
        "rootBeginLabel": begin,
        "targetSprite": {
            "objectId": args.object_id,
            "frameCount": int(sprite.get("frames", "0")),
        },
        "rootPlacement": placement,
        "authorityBoundary": {
            "naturalRuntimeEstablished": False,
            "localizationEstablished": False,
            "audioSynchronizationEstablished": False,
            "acceptanceEffect": "none",
        },
    }
    print(json.dumps(payload, sort_keys=True, separators=(",", ":")))


if __name__ == "__main__":
    main()
