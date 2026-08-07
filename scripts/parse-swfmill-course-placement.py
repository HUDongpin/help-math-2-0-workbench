#!/usr/bin/env python3
"""Extract one root placement and its DefineSprite metadata from swfmill XML.

The parser deliberately uses ElementTree rather than regular expressions so a
hash-pinned migration generator can verify the root/local timeline boundary.
"""

from __future__ import annotations

import argparse
import gzip
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
    return parser.parse_args()


def one(elements: list[ET.Element], label: str) -> ET.Element:
    if len(elements) != 1:
        raise ValueError(f"expected exactly one {label}, observed {len(elements)}")
    return elements[0]


def main() -> None:
    args = parse_args()
    opener = gzip.open if args.swfmill.suffix == ".gz" else open
    with opener(args.swfmill, "rb") as handle:
        root = ET.parse(handle).getroot()

    header = one(root.findall("./Header"), "Header")
    header_tags = one(header.findall("./tags"), "root tags")
    target_id = str(args.object_id)

    sprite = one(
        [node for node in header_tags.findall("./DefineSprite") if node.get("objectID") == target_id],
        f"root-level DefineSprite objectID={target_id}",
    )
    placement = one(
        [
            node
            for node in header_tags.findall("./PlaceObject2")
            if node.get("objectID") == target_id and node.get("name") == args.placement_name
        ],
        f"root placement {args.placement_name!r} objectID={target_id}",
    )
    transform = one(placement.findall("./transform/Transform"), "placement Transform")

    display_rect = one(header.findall("./size/Rectangle"), "stage Rectangle")
    left = int(display_rect.get("left", "0"))
    right = int(display_rect.get("right", "0"))
    top = int(display_rect.get("top", "0"))
    bottom = int(display_rect.get("bottom", "0"))
    trans_x = int(transform.get("transX", "0"))
    trans_y = int(transform.get("transY", "0"))

    payload = {
        "schemaVersion": 1,
        "parser": "python-xml.etree.ElementTree",
        "stage": {
            "widthTwips": right - left,
            "heightTwips": bottom - top,
            "width": (right - left) / 20,
            "height": (bottom - top) / 20,
        },
        "fps": float(header.get("framerate", "0")),
        "rootFrameCount": int(header.get("frames", "0")),
        "targetSprite": {
            "objectId": args.object_id,
            "frameCount": int(sprite.get("frames", "0")),
        },
        "rootPlacement": {
            "tag": placement.tag,
            "name": placement.get("name"),
            "objectId": int(placement.get("objectID", "0")),
            "depth": int(placement.get("depth", "0")),
            "translationTwips": {"x": trans_x, "y": trans_y},
            "translationPixels": {"x": trans_x / 20, "y": trans_y / 20},
        },
    }
    print(json.dumps(payload, sort_keys=True, separators=(",", ":")))


if __name__ == "__main__":
    main()
