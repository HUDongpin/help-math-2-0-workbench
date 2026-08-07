#!/usr/bin/env python3
"""Resolve exact named or unnamed-depth shell placement edges from swfmill XML."""

from __future__ import annotations

import argparse
import gzip
import json
from pathlib import Path
import xml.etree.ElementTree as ET


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--swfmill", required=True, type=Path)
    parser.add_argument("--edge", action="append", required=True)
    return parser.parse_args()


def parse_edge(value: str) -> tuple[str, str, str]:
    parts = value.split(":", 2)
    if len(parts) != 3 or not parts[0] or not parts[1].isdigit() or not parts[2]:
        raise ValueError(f"invalid edge {value!r}; expected parent:childObjectId:name-or-#depth")
    parent, child, selector = parts
    if parent != "root" and not (parent.startswith("sprite-") and parent[7:].isdigit()):
        raise ValueError(f"invalid parent timeline {parent!r}")
    if selector.startswith("#") and not selector[1:].isdigit():
        raise ValueError(f"invalid unnamed-placement selector {selector!r}; expected #depth")
    return parent, child, selector


def one(elements: list[ET.Element], label: str) -> ET.Element:
    if len(elements) != 1:
        raise ValueError(f"expected exactly one {label}, observed {len(elements)}")
    return elements[0]


def timeline_tags(header_tags: ET.Element, sprites: dict[str, ET.Element], timeline_id: str) -> ET.Element:
    if timeline_id == "root":
        return header_tags
    object_id = timeline_id[7:]
    sprite = sprites.get(object_id)
    if sprite is None:
        raise ValueError(f"missing DefineSprite objectID={object_id}")
    return one(sprite.findall("./tags"), f"{timeline_id} tags")


def placement_frame(tags: ET.Element, target: ET.Element) -> int:
    frame = 1
    for child in list(tags):
        if child is target:
            return frame
        if child.tag == "ShowFrame":
            frame += 1
    raise ValueError("placement is not a child of the expected timeline")


def transform_payload(transform: ET.Element) -> dict[str, object]:
    def number(name: str, fallback: float) -> float:
        value = float(transform.get(name, str(fallback)))
        return int(value) if value.is_integer() else value

    trans_x = int(transform.get("transX", "0"))
    trans_y = int(transform.get("transY", "0"))
    return {
        "scaleX": number("scaleX", 1.0),
        "skewY": number("skewY", 0.0),
        "skewX": number("skewX", 0.0),
        "scaleY": number("scaleY", 1.0),
        "translateTwips": {"x": trans_x, "y": trans_y},
        "translatePixels": {"x": trans_x / 20, "y": trans_y / 20},
    }


def main() -> None:
    args = parse_args()
    opener = gzip.open if args.swfmill.suffix == ".gz" else open
    with opener(args.swfmill, "rb") as handle:
        root = ET.parse(handle).getroot()
    header_tags = one(one(root.findall("./Header"), "Header").findall("./tags"), "root tags")
    sprites = {node.get("objectID", ""): node for node in header_tags.findall("./DefineSprite") if node.get("objectID")}

    edges = []
    for raw_edge in args.edge:
        parent, child_object_id, selector = parse_edge(raw_edge)
        tags = timeline_tags(header_tags, sprites, parent)
        if selector.startswith("#"):
            depth = selector[1:]
            matches = [node for node in tags.findall("./PlaceObject2") if node.get("objectID") == child_object_id and node.get("depth") == depth and node.get("name") is None]
            label = f"{parent} unnamed placement depth={depth} objectID={child_object_id}"
        else:
            matches = [node for node in tags.findall("./PlaceObject2") if node.get("objectID") == child_object_id and node.get("name") == selector]
            label = f"{parent} placement {selector!r} objectID={child_object_id}"
        placement = one(matches, label)
        transform = one(placement.findall("./transform/Transform"), "placement Transform")
        edges.append({
            "parentTimelineId": parent,
            "childTimelineId": f"sprite-{child_object_id}",
            "sourceObjectId": int(child_object_id),
            "frame": placement_frame(tags, placement),
            "depth": int(placement.get("depth", "0")),
            "selector": selector,
            "instanceName": placement.get("name"),
            "tag": placement.tag,
            "replace": placement.get("replace", "0"),
            "hasClipActions": placement.find("./events") is not None,
            "transform": transform_payload(transform),
        })

    print(json.dumps({"schemaVersion": 1, "parser": "python-xml.etree.ElementTree", "source": str(args.swfmill), "edges": edges}, sort_keys=True, separators=(",", ":")))


if __name__ == "__main__":
    main()
