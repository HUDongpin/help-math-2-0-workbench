#!/usr/bin/env python3
"""Extract the narrow FQ002 quiz-branch timeline contract from swfmill XML.

This parser records frame labels and ActionScript tag positions for one exact
DefineSprite.  It does not execute ActionScript or claim natural reachability,
visual parity, audio behavior, or acceptance.
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
    return parser.parse_args()


def one(elements: list[ET.Element], label: str) -> ET.Element:
    if len(elements) != 1:
        raise ValueError(f"expected exactly one {label}, observed {len(elements)}")
    return elements[0]


def main() -> None:
    args = parse_args()
    root = ET.parse(args.swfmill).getroot()
    target_id = str(args.object_id)
    sprite = one(
        [
            node
            for node in root.iter("DefineSprite")
            if node.get("objectID") == target_id
        ],
        f"DefineSprite objectID={target_id}",
    )
    tags = one(sprite.findall("./tags"), "sprite tags")

    current_frame = 1
    labels: list[dict[str, object]] = []
    action_frames: list[int] = []
    tag_counts: dict[str, int] = {}
    for tag in list(tags):
        tag_counts[tag.tag] = tag_counts.get(tag.tag, 0) + 1
        if tag.tag == "FrameLabel":
            labels.append({"label": tag.get("label", ""), "frame": current_frame})
        elif tag.tag == "DoAction":
            action_frames.append(current_frame)
        elif tag.tag == "ShowFrame":
            current_frame += 1

    declared_frame_count = int(sprite.get("frames", "0"))
    observed_show_frame_count = current_frame - 1
    if observed_show_frame_count != declared_frame_count:
        raise ValueError(
            "target sprite ShowFrame count differs from its declared frame count"
        )

    payload = {
        "schemaVersion": 1,
        "parser": "python-xml.etree.ElementTree",
        "targetSprite": {
            "objectId": args.object_id,
            "declaredFrameCount": declared_frame_count,
            "observedShowFrameCount": observed_show_frame_count,
            "labels": labels,
            "actionFrames": action_frames,
            "tagCounts": dict(sorted(tag_counts.items())),
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
