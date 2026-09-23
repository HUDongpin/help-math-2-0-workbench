#!/usr/bin/env python3
"""Extract the three VB005 glossary-hotspot source records from swfmill XML.

The result is geometry and timeline evidence only. It never executes the
button ActionScript and deliberately marks every modern interaction authority
field false.
"""

from __future__ import annotations

import argparse
from decimal import Decimal, getcontext
import json
from pathlib import Path
import xml.etree.ElementTree as ET


getcontext().prec = 50
TWIPS_PER_PIXEL = Decimal("20")
SPRITE_ID = 53
ROOT_PLACEMENT_NAME = "animation"
HOTSPOTS = (
    (11, "Negative number", 1, 5),
    (12, "Less than", 1, 7),
    (13, "Zero", 1, 9),
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--swfmill", required=True, type=Path)
    return parser.parse_args()


def one(elements: list[ET.Element], label: str) -> ET.Element:
    if len(elements) != 1:
        raise ValueError(f"expected exactly one {label}, observed {len(elements)}")
    return elements[0]


def timeline_events(tags: ET.Element):
    frame = 1
    for node in tags:
        if node.tag == "ShowFrame":
            frame += 1
        else:
            yield frame, node


def transform(node: ET.Element, label: str) -> tuple[dict[str, str], tuple[Decimal, ...]]:
    element = one(node.findall("./transform/Transform"), f"{label} Transform")
    raw = {
        "scaleX": element.get("scaleX", "1"),
        "skewX": element.get("skewX", "0"),
        "skewY": element.get("skewY", "0"),
        "scaleY": element.get("scaleY", "1"),
        "transX": element.get("transX", "0"),
        "transY": element.get("transY", "0"),
    }
    matrix = tuple(
        Decimal(raw[key])
        for key in ("scaleX", "skewX", "skewY", "scaleY", "transX", "transY")
    )
    return raw, matrix


def compose(parent: tuple[Decimal, ...], child: tuple[Decimal, ...]) -> tuple[Decimal, ...]:
    pa, pb, pc, pd, ptx, pty = parent
    ca, cb, cc, cd, ctx, cty = child
    return (
        pa * ca + pb * cc,
        pa * cb + pb * cd,
        pc * ca + pd * cc,
        pc * cb + pd * cd,
        pa * ctx + pb * cty + ptx,
        pc * ctx + pd * cty + pty,
    )


def apply(matrix: tuple[Decimal, ...], x: Decimal, y: Decimal) -> tuple[Decimal, Decimal]:
    a, b, c, d, tx, ty = matrix
    return a * x + b * y + tx, c * x + d * y + ty


def exact(value: Decimal) -> str:
    rendered = format(value, "f")
    if "." in rendered:
        rendered = rendered.rstrip("0").rstrip(".")
    return rendered or "0"


def exact_map(values: dict[str, Decimal]) -> dict[str, str]:
    return {key: exact(value) for key, value in values.items()}


def numeric_map(values: dict[str, Decimal]) -> dict[str, float]:
    return {key: float(value) for key, value in values.items()}


def interval_for_button(
    events: list[tuple[int, ET.Element]],
    *,
    button_id: int,
    expected_first_frame: int,
    depth: int,
    sprite_frame_count: int,
) -> tuple[ET.Element, int]:
    placements = [
        (frame, node)
        for frame, node in events
        if node.tag in {"PlaceObject", "PlaceObject2", "PlaceObject3"}
        and node.get("objectID") == str(button_id)
        and node.get("depth") == str(depth)
    ]
    first_frame, placement = one(placements, f"button {button_id} placement")
    if first_frame != expected_first_frame:
        raise ValueError(
            f"button {button_id} first frame differs: expected {expected_first_frame}, observed {first_frame}"
        )

    last_frame = sprite_frame_count
    for frame, node in events:
        if frame <= first_frame or node.get("depth") != str(depth):
            continue
        if node.tag in {"RemoveObject", "RemoveObject2"}:
            last_frame = frame - 1
            break
        if node.tag in {"PlaceObject", "PlaceObject2", "PlaceObject3"}:
            replacement_id = node.get("objectID")
            if replacement_id is not None:
                last_frame = frame - 1
                break
            if node.find("./transform/Transform") is not None:
                raise ValueError(
                    f"button {button_id} has an unmodeled transform update at frame {frame}"
                )
    if last_frame < first_frame:
        raise ValueError(f"button {button_id} has an empty frame interval")
    return placement, last_frame


def main() -> None:
    args = parse_args()
    root = ET.parse(args.swfmill).getroot()
    header = one(root.findall("./Header"), "Header")
    root_tags = one(header.findall("./tags"), "root tags")
    sprite = one(
        [node for node in root_tags.findall("./DefineSprite") if node.get("objectID") == str(SPRITE_ID)],
        f"DefineSprite objectID={SPRITE_ID}",
    )
    sprite_frame_count = int(sprite.get("frames", "0"))
    if sprite_frame_count != 180:
        raise ValueError(f"sprite-{SPRITE_ID} frame count changed: {sprite_frame_count}")
    sprite_tags = one(sprite.findall("./tags"), f"sprite-{SPRITE_ID} tags")
    root_events = list(timeline_events(root_tags))
    sprite_events = list(timeline_events(sprite_tags))

    root_placements = [
        (frame, node)
        for frame, node in root_events
        if node.tag in {"PlaceObject", "PlaceObject2", "PlaceObject3"}
        and node.get("objectID") == str(SPRITE_ID)
        and node.get("name") == ROOT_PLACEMENT_NAME
    ]
    root_frame, root_placement = one(root_placements, "sprite-53 named root placement")
    root_raw, root_matrix = transform(root_placement, "root placement")
    if root_frame != 6 or root_placement.get("depth") != "4":
        raise ValueError("sprite-53 root frame/depth changed")

    hit_shape = one(
        [
            node
            for node in root_tags
            if node.tag.startswith("DefineShape") and node.get("objectID") == "10"
        ],
        "shared hit shape objectID=10",
    )
    rectangle = one(hit_shape.findall("./bounds/Rectangle"), "hit-shape bounds")
    shape_bounds = {
        "left": Decimal(rectangle.get("left", "0")),
        "right": Decimal(rectangle.get("right", "0")),
        "top": Decimal(rectangle.get("top", "0")),
        "bottom": Decimal(rectangle.get("bottom", "0")),
    }
    if shape_bounds["left"] >= shape_bounds["right"] or shape_bounds["top"] >= shape_bounds["bottom"]:
        raise ValueError("shared hit shape bounds are empty or inverted")

    results = []
    matrix_names = ("scaleX", "skewX", "skewY", "scaleY", "transX", "transY")
    for button_id, key_attribute, first_frame, depth in HOTSPOTS:
        placement, last_frame = interval_for_button(
            sprite_events,
            button_id=button_id,
            expected_first_frame=first_frame,
            depth=depth,
            sprite_frame_count=sprite_frame_count,
        )
        placement_raw, placement_matrix = transform(placement, f"button {button_id} placement")
        definition = one(
            [
                node
                for node in root_tags.findall("./DefineButton2")
                if node.get("objectID") == str(button_id)
            ],
            f"DefineButton2 objectID={button_id}",
        )
        records = [node for node in definition.findall("./buttons/Button") if node.get("objectID")]
        hit_records = [node for node in records if node.get("hitTest") == "1"]
        hit_record = one(hit_records, f"button {button_id} hit-state record")
        if hit_record.get("objectID") != "10" or hit_record.get("depth") != "1":
            raise ValueError(f"button {button_id} shared hit-state identity changed")
        if any(hit_record.get(state) != "0" for state in ("up", "over", "down")):
            raise ValueError(f"button {button_id} unexpectedly exposes a visible button state")
        hit_raw, hit_matrix = transform(hit_record, f"button {button_id} hit record")
        conditions = definition.findall("./conditions/Condition")
        release = one(
            [node for node in conditions if node.get("pointerReleaseInside") == "1"],
            f"button {button_id} release-inside condition",
        )
        if any(
            release.get(name) == "1"
            for name in (
                "menuEnter",
                "pointerReleaseOutside",
                "pointerDragEnter",
                "pointerDragLeave",
                "pointerPush",
                "pointerLeave",
                "pointerEnter",
                "menuLeave",
            )
        ):
            raise ValueError(f"button {button_id} event condition changed")

        dictionary_strings = [node.get("value", "") for node in release.findall("./actions/Dictionary/strings/String")]
        if key_attribute not in dictionary_strings:
            raise ValueError(f"button {button_id} KeyAttribute value changed")

        composed = compose(root_matrix, compose(placement_matrix, hit_matrix))
        corners = [
            apply(composed, x, y)
            for x in (shape_bounds["left"], shape_bounds["right"])
            for y in (shape_bounds["top"], shape_bounds["bottom"])
        ]
        stage_twips = {
            "left": min(point[0] for point in corners),
            "right": max(point[0] for point in corners),
            "top": min(point[1] for point in corners),
            "bottom": max(point[1] for point in corners),
        }
        stage_pixels = {key: value / TWIPS_PER_PIXEL for key, value in stage_twips.items()}
        stage_pixels["width"] = stage_pixels["right"] - stage_pixels["left"]
        stage_pixels["height"] = stage_pixels["bottom"] - stage_pixels["top"]
        interior = {
            "x": (stage_pixels["left"] + stage_pixels["right"]) / Decimal("2"),
            "y": (stage_pixels["top"] + stage_pixels["bottom"]) / Decimal("2"),
        }
        results.append(
            {
                "characterId": button_id,
                "keyAttribute": key_attribute,
                "event": "pointerReleaseInside",
                "frameInterval": {"first": first_frame, "lastInclusive": last_frame},
                "placement": {
                    "depth": depth,
                    "transformSourceDecimals": placement_raw,
                },
                "hitState": {
                    "hitTest": True,
                    "visibleStates": {"up": False, "over": False, "down": False},
                    "shapeObjectId": 10,
                    "depth": 1,
                    "transformSourceDecimals": hit_raw,
                },
                "composedStageMatrixTwipsExactDecimals": {
                    name: exact(value) for name, value in zip(matrix_names, composed)
                },
                "stageHitBounds": {
                    "coordinateSpace": "native-stage",
                    "units": "pixels",
                    "exactDecimals": exact_map(stage_pixels),
                    "numeric": numeric_map(stage_pixels),
                    "interiorPointExactDecimals": exact_map(interior),
                    "interiorPointNumeric": numeric_map(interior),
                },
                "behaviorExecutedByCandidate": False,
                "pointerEventsEnabledByCandidate": False,
            }
        )

    stage_rectangle = one(header.findall("./size/Rectangle"), "stage rectangle")
    stage = {
        "width": (Decimal(stage_rectangle.get("right", "0")) - Decimal(stage_rectangle.get("left", "0"))) / TWIPS_PER_PIXEL,
        "height": (Decimal(stage_rectangle.get("bottom", "0")) - Decimal(stage_rectangle.get("top", "0"))) / TWIPS_PER_PIXEL,
    }
    payload = {
        "schemaVersion": 1,
        "parser": "python-xml.etree.ElementTree",
        "matrixConvention": "x'=scaleX*x+skewX*y+transX; y'=skewY*x+scaleY*y+transY",
        "twipsPerPixel": 20,
        "nativeStage": numeric_map(stage),
        "rootPlacement": {
            "frame": root_frame,
            "objectId": SPRITE_ID,
            "name": ROOT_PLACEMENT_NAME,
            "depth": int(root_placement.get("depth", "0")),
            "transformSourceDecimals": root_raw,
        },
        "sprite": {"objectId": SPRITE_ID, "frameCount": sprite_frame_count},
        "sharedHitShape": {
            "objectId": 10,
            "definitionTag": hit_shape.tag,
            "boundsTwips": {key: int(value) for key, value in shape_bounds.items()},
        },
        "hotspots": results,
        "evidenceBoundary": {
            "sourceGeometryOnly": True,
            "legacyActionScriptExecuted": False,
            "hostCallbacksResolved": False,
            "pointerEventsEnabled": False,
            "behaviorParityEstablished": False,
            "acceptanceEffect": "none",
        },
    }
    print(json.dumps(payload, sort_keys=True, separators=(",", ":")))


if __name__ == "__main__":
    main()
