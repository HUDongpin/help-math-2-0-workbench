#!/usr/bin/env python3
"""Derive a root-timeline Replay target and wrap transition from swfmill XML.

This parser is intentionally narrow and source-only.  It verifies one
DefineButton2 placement that remains active through a root terminal stop,
selects one opaque hit-test shape, composes the source transforms in twips,
and proves that pointerReleaseInside executes GotoFrame(0), Play.

It does not launch Flash, observe runtime behavior, capture frames, or create
baseline/acceptance evidence.
"""

from __future__ import annotations

import argparse
from decimal import Decimal, getcontext
import gzip
import hashlib
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
    parser.add_argument("--button-object-id", required=True, type=positive_int)
    parser.add_argument("--hit-shape-object-id", required=True, type=positive_int)
    parser.add_argument("--button-frame", required=True, type=positive_int)
    parser.add_argument("--button-depth", required=True, type=positive_int)
    parser.add_argument("--terminal-frame", required=True, type=positive_int)
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
    matrix = tuple(Decimal(raw[key]) for key in (
        "scaleX", "skewX", "skewY", "scaleY", "transX", "transY"
    ))
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


def element_sha256(node: ET.Element) -> str:
    return hashlib.sha256(ET.tostring(node, encoding="utf-8")).hexdigest()


def canonical_sha256(value: object) -> str:
    encoded = json.dumps(
        value,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def point(x: Decimal, y: Decimal) -> dict[str, Decimal]:
    return {"x": x, "y": y}


def exact_point(value: dict[str, Decimal]) -> dict[str, str]:
    return {"x": exact(value["x"]), "y": exact(value["y"])}


def same_point(left: dict[str, Decimal], right: dict[str, Decimal]) -> bool:
    return left["x"] == right["x"] and left["y"] == right["y"]


def serialized_segment(segment: dict[str, object]) -> dict[str, object]:
    result = {
        "type": segment["type"],
        "start": exact_point(segment["start"]),
        "end": exact_point(segment["end"]),
    }
    if segment["type"] == "quadratic":
        result["control"] = exact_point(segment["control"])
    return result


def fill_styles(style_list: ET.Element, label: str) -> list[dict[str, object]]:
    fill_style_list = one(
        style_list.findall("./fillStyles"),
        f"{label} fillStyles",
    )
    result = []
    for index, style in enumerate(list(fill_style_list), start=1):
        item = {
            "index": index,
            "type": style.tag,
            "alpha": None,
        }
        if style.tag == "Solid":
            color = one(style.findall("./color/Color"), f"{label} solid fill {index} Color")
            item["alpha"] = int(color.get("alpha", "255"))
        result.append(item)
    return result


def reconstruct_fill_paths(shape: ET.Element) -> tuple[
    dict[int, list[dict[str, object]]],
    dict[tuple[int, str, int], list[list[dict[str, object]]]],
]:
    """Reconstruct source fill-boundary paths without flattening curves.

    swfmill writes LineTo deltas relative to the current point and CurveTo as
    a control delta followed by an anchor delta.  A ShapeSetup containing
    nested styles starts a new style epoch, so style index 1 before and after
    that record must not be conflated.
    """

    initial_style_list = one(
        shape.findall("./styles/StyleList"),
        "initial shape StyleList",
    )
    styles_by_epoch = {0: fill_styles(initial_style_list, "initial shape")}
    paths: dict[tuple[int, str, int], list[list[dict[str, object]]]] = {}
    active = {"fillStyle0": 0, "fillStyle1": 0}
    epoch = 0
    current = point(Decimal("0"), Decimal("0"))
    edges = one(shape.findall("./shapes/Shape/edges"), "shape edges")

    def append_to_active(segment: dict[str, object]) -> None:
        for side in ("fillStyle0", "fillStyle1"):
            style_index = active[side]
            if style_index < 1:
                continue
            key = (epoch, side, style_index)
            runs = paths.setdefault(key, [])
            if not runs or not same_point(runs[-1][-1]["end"], segment["start"]):
                runs.append([])
            runs[-1].append(segment)

    for node in edges:
        if node.tag == "ShapeSetup":
            nested_style_lists = node.findall("./styles/StyleList")
            if nested_style_lists:
                nested_style_list = one(nested_style_lists, "ShapeSetup StyleList")
                epoch += 1
                styles_by_epoch[epoch] = fill_styles(
                    nested_style_list,
                    f"ShapeSetup style epoch {epoch}",
                )
                active = {"fillStyle0": 0, "fillStyle1": 0}
            if "x" in node.attrib:
                current["x"] = Decimal(node.get("x", "0"))
            if "y" in node.attrib:
                current["y"] = Decimal(node.get("y", "0"))
            for side in ("fillStyle0", "fillStyle1"):
                if side in node.attrib:
                    active[side] = int(node.get(side, "0"))
                    if active[side] > len(styles_by_epoch[epoch]):
                        raise ValueError(
                            f"{side} index {active[side]} exceeds style epoch "
                            f"{epoch} fill count {len(styles_by_epoch[epoch])}"
                        )
            continue

        start = point(current["x"], current["y"])
        if node.tag == "LineTo":
            end = point(
                current["x"] + Decimal(node.get("x", "0")),
                current["y"] + Decimal(node.get("y", "0")),
            )
            segment = {"type": "line", "start": start, "end": end}
        elif node.tag == "CurveTo":
            control = point(
                current["x"] + Decimal(node.get("x1", "0")),
                current["y"] + Decimal(node.get("y1", "0")),
            )
            end = point(
                control["x"] + Decimal(node.get("x2", "0")),
                control["y"] + Decimal(node.get("y2", "0")),
            )
            segment = {
                "type": "quadratic",
                "start": start,
                "control": control,
                "end": end,
            }
        else:
            raise ValueError(f"unsupported shape edge record {node.tag}")
        append_to_active(segment)
        current = point(end["x"], end["y"])

    return styles_by_epoch, paths


def prove_closed_capsule_interior(
    segments: list[dict[str, object]],
    source_point: dict[str, Decimal],
    *,
    epoch: int,
    side: str,
    style_index: int,
    style: dict[str, object],
) -> dict[str, object] | None:
    """Prove a point lies inside a simple opaque capsule boundary.

    The proof is exact in source twips.  It requires two opposed horizontal
    edges joined by y-monotone quadratic caps that remain wholly outside the
    central rectangle.  Consequently every horizontal line through the open
    rectangle meets the left and right caps exactly once, and the rectangle
    (including the selected strict-interior point) is inside the closed fill.
    """

    expected_types = (
        ["line"] +
        ["quadratic"] * 4 +
        ["line"] +
        ["quadratic"] * 4
    )
    if [segment["type"] for segment in segments] != expected_types:
        return None
    if not same_point(segments[-1]["end"], segments[0]["start"]):
        return None

    top_line = segments[0]
    bottom_line = segments[5]
    if (
        top_line["start"]["y"] != top_line["end"]["y"]
        or bottom_line["start"]["y"] != bottom_line["end"]["y"]
    ):
        return None
    top = top_line["start"]["y"]
    bottom = bottom_line["start"]["y"]
    if top >= bottom:
        return None

    top_x = {top_line["start"]["x"], top_line["end"]["x"]}
    bottom_x = {bottom_line["start"]["x"], bottom_line["end"]["x"]}
    if top_x != bottom_x or len(top_x) != 2:
        return None
    left = min(top_x)
    right = max(top_x)
    if not (
        top_line["start"]["x"] == right
        and top_line["end"]["x"] == left
        and bottom_line["start"]["x"] == left
        and bottom_line["end"]["x"] == right
    ):
        return None

    left_cap = segments[1:5]
    right_cap = segments[6:10]

    def monotone_cap(
        cap: list[dict[str, object]],
        direction: str,
        boundary_x: Decimal,
    ) -> tuple[bool, Decimal]:
        points = []
        for segment in cap:
            start_y = segment["start"]["y"]
            control_y = segment["control"]["y"]
            end_y = segment["end"]["y"]
            if direction == "increasing":
                if not start_y <= control_y <= end_y:
                    return False, Decimal("0")
            elif not start_y >= control_y >= end_y:
                return False, Decimal("0")
            points.extend((segment["start"], segment["control"], segment["end"]))
        x_values = [item["x"] for item in points]
        extreme = max(x_values) if direction == "increasing" else min(x_values)
        contained = extreme <= boundary_x if direction == "increasing" else extreme >= boundary_x
        return contained, extreme

    left_ok, left_max_x = monotone_cap(left_cap, "increasing", left)
    right_ok, right_min_x = monotone_cap(right_cap, "decreasing", right)
    if not left_ok or not right_ok:
        return None
    if not (
        same_point(left_cap[0]["start"], top_line["end"])
        and same_point(left_cap[-1]["end"], bottom_line["start"])
        and same_point(right_cap[0]["start"], bottom_line["end"])
        and same_point(right_cap[-1]["end"], top_line["start"])
    ):
        return None

    strictly_inside = (
        left < source_point["x"] < right
        and top < source_point["y"] < bottom
    )
    if not strictly_inside:
        return None

    serialized = [serialized_segment(segment) for segment in segments]
    return {
        "method": "exact-closed-quadratic-capsule-central-rectangle",
        "fill": {
            "styleEpoch": epoch,
            "side": side,
            "styleIndex": style_index,
            "type": style["type"],
            "alpha": style["alpha"],
        },
        "boundary": {
            "closed": True,
            "segmentCount": len(segments),
            "lineSegmentIndexes": [0, 5],
            "quadraticSegmentIndexes": [1, 2, 3, 4, 6, 7, 8, 9],
            "canonicalSegmentsSha256": canonical_sha256(serialized),
        },
        "centralRectangleTwips": {
            "left": int(left),
            "right": int(right),
            "top": int(top),
            "bottom": int(bottom),
        },
        "leftCap": {
            "segmentIndexes": [1, 2, 3, 4],
            "yMonotone": "increasing",
            "maxControlOrEndpointX": int(left_max_x),
            "outsideOrOnRectangleBoundary": True,
        },
        "rightCap": {
            "segmentIndexes": [6, 7, 8, 9],
            "yMonotone": "decreasing",
            "minControlOrEndpointX": int(right_min_x),
            "outsideOrOnRectangleBoundary": True,
        },
        "interiorPointTwipsExactDecimals": exact_point(source_point),
        "strictlyInsideCentralRectangle": True,
        "proofConclusion": "point-strictly-inside-opaque-source-fill",
    }


def main() -> None:
    args = parse_args()
    opener = gzip.open if args.swfmill.suffix == ".gz" else open
    with opener(args.swfmill, "rb") as handle:
        root = ET.parse(handle).getroot()

    header = one(root.findall("./Header"), "Header")
    tags = one(header.findall("./tags"), "root tags")
    frame_count = int(header.get("frames", "0"))
    if frame_count != args.terminal_frame:
        raise ValueError(
            f"terminal frame must equal the root frame count: "
            f"{args.terminal_frame} versus {frame_count}"
        )

    stage_rectangle = one(header.findall("./size/Rectangle"), "stage Rectangle")
    stage_twips = {
        "left": Decimal(stage_rectangle.get("left", "0")),
        "right": Decimal(stage_rectangle.get("right", "0")),
        "top": Decimal(stage_rectangle.get("top", "0")),
        "bottom": Decimal(stage_rectangle.get("bottom", "0")),
    }
    stage = {
        "width": (stage_twips["right"] - stage_twips["left"]) / TWIPS_PER_PIXEL,
        "height": (stage_twips["bottom"] - stage_twips["top"]) / TWIPS_PER_PIXEL,
    }

    button_id = str(args.button_object_id)
    hit_shape_id = str(args.hit_shape_object_id)
    depth = str(args.button_depth)
    events = list(timeline_events(tags))

    placements = [
        (frame, node)
        for frame, node in events
        if node.tag in {"PlaceObject", "PlaceObject2", "PlaceObject3"}
        and node.get("objectID") == button_id
        and node.get("depth") == depth
    ]
    button_frame, placement = one(
        placements,
        f"root button placement objectID={button_id} depth={depth}",
    )
    if button_frame != args.button_frame:
        raise ValueError(
            f"button placement frame differs: expected {args.button_frame}, "
            f"observed {button_frame}"
        )

    later_depth_mutations = [
        (frame, node.tag, dict(node.attrib))
        for frame, node in events
        if frame >= button_frame
        and node is not placement
        and node.get("depth") == depth
        and node.tag in {
            "PlaceObject", "PlaceObject2", "PlaceObject3",
            "RemoveObject", "RemoveObject2",
        }
    ]
    if later_depth_mutations:
        raise ValueError(
            f"button depth {depth} is modified after placement: "
            f"{later_depth_mutations}"
        )

    button = one(
        [node for node in tags.findall("./DefineButton2") if node.get("objectID") == button_id],
        f"DefineButton2 objectID={button_id}",
    )
    release_conditions = [
        node
        for node in button.findall("./conditions/Condition")
        if node.get("pointerReleaseInside") == "1"
    ]
    release = one(
        release_conditions,
        f"button {button_id} pointerReleaseInside condition",
    )
    condition_attributes = dict(sorted(release.attrib.items()))
    expected_condition = {
        "key": "0",
        "menuEnter": "0",
        "menuLeave": "0",
        "next": "0",
        "pointerDragEnter": "0",
        "pointerDragLeave": "0",
        "pointerEnter": "0",
        "pointerLeave": "0",
        "pointerPush": "0",
        "pointerReleaseInside": "1",
        "pointerReleaseOutside": "0",
    }
    if condition_attributes != expected_condition:
        raise ValueError(
            f"button {button_id} release condition differs: "
            f"{condition_attributes}"
        )
    release_actions = [
        {"name": node.tag, "attributes": dict(sorted(node.attrib.items()))}
        for node in release.findall("./actions/*")
    ]
    if release_actions != [
        {"name": "GotoFrame", "attributes": {"frame": "0"}},
        {"name": "Play", "attributes": {}},
        {"name": "EndAction", "attributes": {}},
    ]:
        raise ValueError(
            f"button {button_id} pointerReleaseInside actions differ: "
            f"{release_actions}"
        )

    hit_record = one(
        [
            node
            for node in button.findall("./buttons/Button")
            if node.get("hitTest") == "1"
            and node.get("objectID") == hit_shape_id
        ],
        f"button {button_id} hit record shape={hit_shape_id}",
    )
    shape = one(
        [
            node
            for node in tags
            if node.tag in {"DefineShape", "DefineShape2", "DefineShape3", "DefineShape4"}
            and node.get("objectID") == hit_shape_id
        ],
        f"hit shape objectID={hit_shape_id}",
    )
    bounds_node = one(shape.findall("./bounds/Rectangle"), f"shape {hit_shape_id} bounds")
    source_bounds = {
        "left": Decimal(bounds_node.get("left", "0")),
        "right": Decimal(bounds_node.get("right", "0")),
        "top": Decimal(bounds_node.get("top", "0")),
        "bottom": Decimal(bounds_node.get("bottom", "0")),
    }
    if (
        source_bounds["left"] >= source_bounds["right"]
        or source_bounds["top"] >= source_bounds["bottom"]
    ):
        raise ValueError("selected hit shape bounds are empty or inverted")

    opaque_solid_fills = [
        node
        for node in shape.findall("./styles/StyleList/fillStyles/Solid")
        if node.find("./color/Color") is not None
        and node.find("./color/Color").get("alpha", "255") == "255"
    ]
    if not opaque_solid_fills:
        raise ValueError("selected hit shape has no opaque source fill")
    active_fill_records = [
        node
        for node in shape.findall("./shapes/Shape/edges/ShapeSetup")
        if node.get("fillStyle0") == "1" or node.get("fillStyle1") == "1"
    ]
    if not active_fill_records:
        raise ValueError("selected hit shape never activates source fill style 1")

    placement_raw, placement_matrix = transform(placement, "button placement")
    hit_raw, hit_matrix = transform(hit_record, "hit record")
    composed = compose(placement_matrix, hit_matrix)
    corners = [
        apply(composed, x, y)
        for x in (source_bounds["left"], source_bounds["right"])
        for y in (source_bounds["top"], source_bounds["bottom"])
    ]
    hit_bounds_twips = {
        "left": min(point[0] for point in corners),
        "right": max(point[0] for point in corners),
        "top": min(point[1] for point in corners),
        "bottom": max(point[1] for point in corners),
    }
    hit_bounds = {
        key: value / TWIPS_PER_PIXEL for key, value in hit_bounds_twips.items()
    }
    hit_bounds["width"] = hit_bounds["right"] - hit_bounds["left"]
    hit_bounds["height"] = hit_bounds["bottom"] - hit_bounds["top"]
    source_center = {
        "x": (source_bounds["left"] + source_bounds["right"]) / Decimal("2"),
        "y": (source_bounds["top"] + source_bounds["bottom"]) / Decimal("2"),
    }
    styles_by_epoch, fill_paths = reconstruct_fill_paths(shape)
    interior_proofs = []
    for (epoch, side, style_index), runs in fill_paths.items():
        style = styles_by_epoch[epoch][style_index - 1]
        if style["type"] != "Solid" or style["alpha"] != 255:
            continue
        for segments in runs:
            proof = prove_closed_capsule_interior(
                segments,
                source_center,
                epoch=epoch,
                side=side,
                style_index=style_index,
                style=style,
            )
            if proof is not None:
                interior_proofs.append(proof)
    opaque_fill_interior_proof = one(
        interior_proofs,
        "exact closed opaque fill interior proof",
    )

    center_twips_tuple = apply(composed, source_center["x"], source_center["y"])
    center = {
        "x": center_twips_tuple[0] / TWIPS_PER_PIXEL,
        "y": center_twips_tuple[1] / TWIPS_PER_PIXEL,
    }
    if not (
        Decimal("0") <= center["x"] <= stage["width"]
        and Decimal("0") <= center["y"] <= stage["height"]
    ):
        raise ValueError("selected source hit point lies outside the native stage")

    do_actions = [
        (frame, node)
        for frame, node in events
        if node.tag == "DoAction"
    ]
    terminal_action_frame, terminal_action = one(do_actions, "root DoAction")
    if terminal_action_frame != args.terminal_frame:
        raise ValueError(
            f"root DoAction differs from terminal frame: "
            f"{terminal_action_frame} versus {args.terminal_frame}"
        )
    terminal_actions = [
        {"name": node.tag, "attributes": dict(sorted(node.attrib.items()))}
        for node in terminal_action.findall("./actions/*")
    ]
    if terminal_actions != [
        {"name": "Stop", "attributes": {}},
        {"name": "EndAction", "attributes": {}},
    ]:
        raise ValueError(f"terminal root actions differ: {terminal_actions}")

    matrix_names = ("scaleX", "skewX", "skewY", "scaleY", "transX", "transY")
    payload = {
        "schemaVersion": 2,
        "parser": "python-xml.etree.ElementTree",
        "matrixConvention": "x'=scaleX*x+skewX*y+transX; y'=skewY*x+scaleY*y+transY",
        "twipsPerPixel": 20,
        "nativeStage": numeric_box(stage),
        "rootTimeline": {
            "frameCount": frame_count,
            "frameRate": float(header.get("framerate", "0")),
            "terminalFrame": args.terminal_frame,
            "terminalActions": terminal_actions,
        },
        "buttonPlacement": {
            "timelineId": "root",
            "frame": button_frame,
            "activeThroughFrame": args.terminal_frame,
            "objectId": args.button_object_id,
            "depth": args.button_depth,
            "transformSourceDecimals": placement_raw,
            "laterDepthMutationCount": 0,
        },
        "buttonDefinition": {
            "objectId": args.button_object_id,
            "pointerReleaseInside": True,
            "conditionAttributes": condition_attributes,
            "actions": release_actions,
            "selectedHitRecord": {
                "shapeObjectId": args.hit_shape_object_id,
                "depth": int(hit_record.get("depth", "0")),
                "transformSourceDecimals": hit_raw,
            },
        },
        "selectedHitShape": {
            "objectId": args.hit_shape_object_id,
            "definitionTag": shape.tag,
            "boundsTwips": {
                key: int(value) for key, value in source_bounds.items()
            },
            "xmlElementSha256": element_sha256(shape),
            "opaqueSolidFillCount": len(opaque_solid_fills),
            "activeFillStyleOneRecordCount": len(active_fill_records),
            "sourceCenterTwipsExactDecimals": exact_box(source_center),
            "opaqueFillInteriorProof": opaque_fill_interior_proof,
        },
        "composedStageMatrixTwipsExactDecimals": {
            name: exact(value) for name, value in zip(matrix_names, composed)
        },
        "stageHitBounds": {
            "coordinateSpace": "native-stage",
            "units": "pixels",
            "exactDecimals": exact_box(hit_bounds),
            "numeric": numeric_box(hit_bounds),
            "interiorPointExactDecimals": exact_box(center),
            "interiorPointNumeric": numeric_box(center),
            "derivationOrder": [
                "selected-button-hit-record",
                "root-button-placement",
            ],
            "interiorPointBasis": (
                "source-bounds center proven strictly inside the locked "
                "closed opaque fill's exact central rectangle; "
                "runtime hit resolution still requires original-runtime execution"
            ),
        },
        "replayTransition": {
            "event": "pointerReleaseInside",
            "preState": {
                "rootFrame": args.terminal_frame,
                "rootPlayState": "stopped",
            },
            "sourceActions": release_actions,
            "postState": {
                "rootFrame": 1,
                "rootPlayState": "playing",
            },
            "frameWrap": {
                "fromFrame": args.terminal_frame,
                "toFrame": 1,
            },
        },
    }
    print(json.dumps(payload, sort_keys=True, separators=(",", ":")))


if __name__ == "__main__":
    main()
