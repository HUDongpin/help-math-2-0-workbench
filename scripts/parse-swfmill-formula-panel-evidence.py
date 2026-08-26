#!/usr/bin/env python3
"""Parse formula-panel placement evidence with ElementTree.

The JavaScript builder deliberately delegates SWF XML and exported-SVG
structure reads to an XML parser.  It never derives tag, frame, transform, or
character membership data with regular expressions.
"""

from __future__ import annotations

import argparse
import gzip
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path


def number(value: str | None, label: str) -> float:
    if value is None:
        raise ValueError(f"{label} is missing")
    return float(value)


def pixels(value: str | None, label: str) -> float:
    return number(value, label) / 20.0


def svg_length(value: str | None, label: str) -> float:
    if value is None:
        raise ValueError(f"{label} is missing")
    match = re.fullmatch(r"\s*(-?(?:\d+(?:\.\d*)?|\.\d+))(?:px)?\s*", value)
    if not match:
        raise ValueError(f"{label} is not a pixel length: {value}")
    return float(match.group(1))


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--swfmill", required=True)
    parser.add_argument("--svg", required=True)
    parser.add_argument("--instance", default="Mc_SD")
    return parser.parse_args()


def load_xml(path: Path) -> ET.Element:
    if path.suffix == ".gz":
        with gzip.open(path, "rb") as stream:
            return ET.parse(stream).getroot()
    return ET.parse(path).getroot()


def parse_swf(root: ET.Element, instance_name: str) -> dict:
    header = root.find("Header")
    if header is None:
        raise ValueError("SWF XML has no Header")
    rectangle = header.find("./size/Rectangle")
    tags = header.find("tags")
    if rectangle is None or tags is None:
        raise ValueError("SWF XML has no stage rectangle or root tags")

    placements: list[tuple[int, ET.Element]] = []
    current_frame = 1
    show_frame_count = 0
    for tag in tags:
        if tag.tag == "ShowFrame":
            show_frame_count += 1
            current_frame += 1
            continue
        if tag.tag in ("PlaceObject", "PlaceObject2") and tag.attrib.get("name") == instance_name:
            placements.append((current_frame, tag))

    if len(placements) != 1:
        raise ValueError(
            f"expected exactly one root placement named {instance_name}, observed {len(placements)}"
        )
    placement_frame, placement = placements[0]
    object_id = int(placement.attrib["objectID"])
    depth = int(placement.attrib["depth"])
    transform = placement.find("./transform/Transform")
    if transform is None:
        raise ValueError(f"{instance_name} placement has no Transform")

    depth_events: list[dict] = []
    current_frame = 1
    for tag in tags:
        if tag.tag == "ShowFrame":
            current_frame += 1
            continue
        if tag.tag not in ("PlaceObject", "PlaceObject2", "RemoveObject", "RemoveObject2"):
            continue
        if int(tag.attrib.get("depth", "-1")) != depth:
            continue
        event = {"frame": current_frame, "tag": tag.tag}
        for key in ("replace", "depth", "objectID", "name"):
            if key in tag.attrib:
                value: object = tag.attrib[key]
                if key in ("depth", "objectID"):
                    value = int(str(value))
                event[key] = value
        event_transform = tag.find("./transform/Transform")
        if event_transform is not None:
            event["transform"] = dict(event_transform.attrib)
        depth_events.append(event)

    sprites = [
        tag for tag in tags.findall("DefineSprite")
        if int(tag.attrib.get("objectID", "-1")) == object_id
    ]
    if len(sprites) != 1:
        raise ValueError(f"expected exactly one DefineSprite {object_id}, observed {len(sprites)}")
    sprite = sprites[0]
    sprite_tags = sprite.find("tags")
    if sprite_tags is None:
        raise ValueError(f"DefineSprite {object_id} has no tags")
    child_placements = []
    for child in sprite_tags:
        if child.tag not in ("PlaceObject", "PlaceObject2"):
            continue
        child_transform = child.find("./transform/Transform")
        child_placements.append({
            "tag": child.tag,
            "depth": int(child.attrib["depth"]),
            "objectId": int(child.attrib["objectID"]),
            "transform": dict(child_transform.attrib) if child_transform is not None else None,
        })

    frame_count = int(header.attrib["frames"])
    x = pixels(transform.attrib.get("transX", "0"), "Mc_SD transX")
    y = pixels(transform.attrib.get("transY", "0"), "Mc_SD transY")
    stage_left = pixels(rectangle.attrib.get("left", "0"), "stage left")
    stage_top = pixels(rectangle.attrib.get("top", "0"), "stage top")
    stage_right = pixels(rectangle.attrib.get("right"), "stage right")
    stage_bottom = pixels(rectangle.attrib.get("bottom"), "stage bottom")
    return {
        "document": {"version": int(root.attrib["version"]), "compressed": root.attrib.get("compressed")},
        "header": {
            "frameRate": float(header.attrib["framerate"]),
            "frameCount": frame_count,
            "showFrameCount": show_frame_count,
        },
        "stage": {
            "left": stage_left,
            "top": stage_top,
            "width": stage_right - stage_left,
            "height": stage_bottom - stage_top,
        },
        "panel": {
            "instanceName": instance_name,
            "objectId": object_id,
            "depth": depth,
            "placementFrame": placement_frame,
            "placementTwips": {
                "x": float(transform.attrib.get("transX", "0")),
                "y": float(transform.attrib.get("transY", "0")),
            },
            "placementPixels": {"x": x, "y": y},
            "rootDepthEvents": depth_events,
            "persistsThroughFrame": frame_count if len(depth_events) == 1 else None,
            "spriteFrameCount": int(sprite.attrib["frames"]),
            "childPlacements": sorted(child_placements, key=lambda item: item["depth"]),
        },
    }


def parse_svg(root: ET.Element) -> dict:
    character_ids = []
    for element in root.iter():
        for key, value in element.attrib.items():
            if local_name(key) == "characterId":
                character_ids.append(int(value))
    top_level = [local_name(child.tag) for child in list(root)]
    return {
        "width": svg_length(root.attrib.get("width"), "SVG width"),
        "height": svg_length(root.attrib.get("height"), "SVG height"),
        "viewBox": root.attrib.get("viewBox"),
        "topLevelElements": top_level,
        "characterIds": character_ids,
    }


def main() -> None:
    options = parse_arguments()
    result = parse_swf(load_xml(Path(options.swfmill)), options.instance)
    result["exportedSvg"] = parse_svg(load_xml(Path(options.svg)))
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()
