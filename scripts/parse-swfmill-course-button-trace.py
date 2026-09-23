#!/usr/bin/env python3
"""Derive one course button's exact native-stage hit bounds from swfmill XML.

The output is deliberately narrow and fail-closed. It binds the hit shape,
button definition, child-timeline placement, root placement, and removal frame
needed by a source-authored natural trace. Decimal strings retain the exact
swfmill transform values; numeric values are included only for an executor.
"""

from __future__ import annotations

import argparse
from decimal import Decimal, getcontext
import gzip
import json
from pathlib import Path
import xml.etree.ElementTree as ET


getcontext().prec = 50
TWIPS_PER_PIXEL = Decimal("20")


def positive_int(value: str) -> int:
    parsed = int(value)
    if parsed < 1:
        raise argparse.ArgumentTypeError("value must be positive")
    return parsed


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--swfmill", required=True, type=Path)
    parser.add_argument("--sprite-object-id", required=True, type=positive_int)
    parser.add_argument("--root-placement-name", required=True)
    parser.add_argument("--root-placement-frame", required=True, type=positive_int)
    parser.add_argument("--button-object-id", required=True, type=positive_int)
    parser.add_argument("--hit-shape-object-id", required=True, type=positive_int)
    parser.add_argument("--button-frame", required=True, type=positive_int)
    parser.add_argument("--button-depth", required=True, type=positive_int)
    parser.add_argument("--button-removal-frame", required=True, type=positive_int)
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
    item = one(node.findall("./transform/Transform"), f"{label} Transform")
    raw = {
        "scaleX": item.get("scaleX", "1"),
        "skewX": item.get("skewX", "0"),
        "skewY": item.get("skewY", "0"),
        "scaleY": item.get("scaleY", "1"),
        "transX": item.get("transX", "0"),
        "transY": item.get("transY", "0"),
    }
    matrix = tuple(Decimal(raw[key]) for key in ("scaleX", "skewX", "skewY", "scaleY", "transX", "transY"))
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


def exact_box(values: dict[str, Decimal]) -> dict[str, str]:
    return {key: exact(value) for key, value in values.items()}


def numeric_box(values: dict[str, Decimal]) -> dict[str, float]:
    return {key: float(value) for key, value in values.items()}


def main() -> None:
    args = parse_args()
    opener = gzip.open if args.swfmill.suffix == ".gz" else open
    with opener(args.swfmill, "rb") as handle:
        root = ET.parse(handle).getroot()

    header = one(root.findall("./Header"), "Header")
    root_tags = one(header.findall("./tags"), "root tags")
    sprite_id = str(args.sprite_object_id)
    button_id = str(args.button_object_id)
    shape_id = str(args.hit_shape_object_id)
    depth = str(args.button_depth)

    sprite = one(
        [node for node in root_tags.findall("./DefineSprite") if node.get("objectID") == sprite_id],
        f"root-level DefineSprite objectID={sprite_id}",
    )
    if int(sprite.get("frames", "0")) < args.button_removal_frame:
        raise ValueError("button removal frame lies beyond the sprite timeline")
    sprite_tags = one(sprite.findall("./tags"), f"DefineSprite {sprite_id} tags")

    root_placements = [
        (frame, node)
        for frame, node in timeline_events(root_tags)
        if node.tag == "PlaceObject2"
        and node.get("objectID") == sprite_id
        and node.get("name") == args.root_placement_name
    ]
    root_frame, root_placement = one(root_placements, f"root placement {args.root_placement_name!r} objectID={sprite_id}")
    if root_frame != args.root_placement_frame:
        raise ValueError(f"root placement frame differs: expected {args.root_placement_frame}, observed {root_frame}")

    button_placements = [
        (frame, node)
        for frame, node in timeline_events(sprite_tags)
        if node.tag == "PlaceObject2"
        and node.get("objectID") == button_id
        and node.get("depth") == depth
    ]
    button_frame, button_placement = one(button_placements, f"button placement objectID={button_id} depth={depth}")
    if button_frame != args.button_frame:
        raise ValueError(f"button placement frame differs: expected {args.button_frame}, observed {button_frame}")

    removals = [
        (frame, node)
        for frame, node in timeline_events(sprite_tags)
        if node.tag == "RemoveObject2" and node.get("depth") == depth
    ]
    matching_removals = [(frame, node) for frame, node in removals if frame == args.button_removal_frame]
    removal_frame, removal = one(matching_removals, f"button removal at frame {args.button_removal_frame} depth={depth}")

    button = one(
        [node for node in root_tags.findall("./DefineButton2") if node.get("objectID") == button_id],
        f"DefineButton2 objectID={button_id}",
    )
    hit_records = [
        node
        for node in button.findall("./buttons/Button")
        if node.get("hitTest") == "1" and node.get("objectID") == shape_id
    ]
    hit_record = one(hit_records, f"button {button_id} hit record shape={shape_id}")
    press_conditions = [
        node
        for node in button.findall("./conditions/Condition")
        if node.get("pointerPush") == "1"
    ]
    press_condition = one(press_conditions, f"button {button_id} pointerPush condition")
    actions = [node.tag for node in press_condition.findall("./actions/*")]
    if actions != ["Play", "EndAction"]:
        raise ValueError(f"button {button_id} pointerPush actions differ: {actions}")

    shape = one(
        [node for node in root_tags.findall("./DefineShape3") if node.get("objectID") == shape_id],
        f"DefineShape3 objectID={shape_id}",
    )
    rectangle = one(shape.findall("./bounds/Rectangle"), f"shape {shape_id} bounds Rectangle")
    source_bounds = {
        "left": Decimal(rectangle.get("left", "0")),
        "right": Decimal(rectangle.get("right", "0")),
        "top": Decimal(rectangle.get("top", "0")),
        "bottom": Decimal(rectangle.get("bottom", "0")),
    }
    if source_bounds["left"] >= source_bounds["right"] or source_bounds["top"] >= source_bounds["bottom"]:
        raise ValueError("hit shape bounds are empty or inverted")

    root_raw, root_matrix = transform(root_placement, "root placement")
    button_raw, button_matrix = transform(button_placement, "button placement")
    hit_raw, hit_matrix = transform(hit_record, "hit record")
    composed = compose(root_matrix, compose(button_matrix, hit_matrix))
    corners = [
        apply(composed, x, y)
        for x in (source_bounds["left"], source_bounds["right"])
        for y in (source_bounds["top"], source_bounds["bottom"])
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
    center_pixels = {
        "x": (stage_pixels["left"] + stage_pixels["right"]) / Decimal("2"),
        "y": (stage_pixels["top"] + stage_pixels["bottom"]) / Decimal("2"),
    }

    stage_rectangle = one(header.findall("./size/Rectangle"), "stage Rectangle")
    stage = {
        "width": (Decimal(stage_rectangle.get("right", "0")) - Decimal(stage_rectangle.get("left", "0"))) / TWIPS_PER_PIXEL,
        "height": (Decimal(stage_rectangle.get("bottom", "0")) - Decimal(stage_rectangle.get("top", "0"))) / TWIPS_PER_PIXEL,
    }
    if not (Decimal("0") <= center_pixels["x"] <= stage["width"] and Decimal("0") <= center_pixels["y"] <= stage["height"]):
        raise ValueError("derived hit-target center lies outside the native stage")

    matrix_names = ("scaleX", "skewX", "skewY", "scaleY", "transX", "transY")
    payload = {
        "schemaVersion": 1,
        "parser": "python-xml.etree.ElementTree",
        "matrixConvention": "x'=scaleX*x+skewX*y+transX; y'=skewY*x+scaleY*y+transY",
        "twipsPerPixel": 20,
        "nativeStage": numeric_box(stage),
        "rootTimeline": {"frameCount": int(header.get("frames", "0"))},
        "sprite": {"objectId": args.sprite_object_id, "frameCount": int(sprite.get("frames", "0"))},
        "rootPlacement": {
            "frame": root_frame,
            "name": root_placement.get("name"),
            "objectId": args.sprite_object_id,
            "depth": int(root_placement.get("depth", "0")),
            "transformSourceDecimals": root_raw,
        },
        "buttonPlacement": {
            "frame": button_frame,
            "objectId": args.button_object_id,
            "depth": args.button_depth,
            "transformSourceDecimals": button_raw,
        },
        "buttonRemoval": {"frame": removal_frame, "depth": int(removal.get("depth", "0"))},
        "buttonDefinition": {
            "objectId": args.button_object_id,
            "pointerPush": True,
            "actions": actions,
            "hitRecord": {
                "shapeObjectId": args.hit_shape_object_id,
                "depth": int(hit_record.get("depth", "0")),
                "transformSourceDecimals": hit_raw,
            },
        },
        "hitShape": {
            "objectId": args.hit_shape_object_id,
            "definitionTag": shape.tag,
            "boundsTwips": {key: int(value) for key, value in source_bounds.items()},
        },
        "composedStageMatrixTwipsExactDecimals": {
            name: exact(value) for name, value in zip(matrix_names, composed)
        },
        "stageHitBounds": {
            "coordinateSpace": "native-stage",
            "units": "pixels",
            "exactDecimals": exact_box(stage_pixels),
            "numeric": numeric_box(stage_pixels),
            "interiorPointExactDecimals": exact_box(center_pixels),
            "interiorPointNumeric": numeric_box(center_pixels),
            "derivationOrder": ["button-hit-record", "sprite-button-placement", "root-sprite-placement"],
        },
    }
    print(json.dumps(payload, sort_keys=True, separators=(",", ":")))


if __name__ == "__main__":
    main()
