#!/usr/bin/env python3
"""Parse swfmill and FFDec SVG evidence with XML parsers.

This helper deliberately uses ``xml.etree.ElementTree`` for both documents.
The JavaScript baseline builder invokes it with explicit files and consumes the
resulting JSON; no SWF/XML fact is recovered with regular-expression scraping.
"""

from __future__ import annotations

import argparse
import gzip
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def descendants(element: ET.Element, name: str) -> list[ET.Element]:
    return [candidate for candidate in element.iter() if local_name(candidate.tag) == name]


def one(elements: list[ET.Element], label: str) -> ET.Element:
    if len(elements) != 1:
        raise ValueError(f"expected exactly one {label}; observed {len(elements)}")
    return elements[0]


def direct_child(element: ET.Element, name: str) -> ET.Element:
    return one(
        [candidate for candidate in list(element) if local_name(candidate.tag) == name],
        f"direct {name} child",
    )


def first_descendant(element: ET.Element, name: str) -> ET.Element:
    matches = descendants(element, name)
    if not matches:
        raise ValueError(f"missing {name} descendant")
    return matches[0]


def numeric_attribute(element: ET.Element, name: str) -> float:
    value = element.attrib.get(name)
    if value is None:
        raise ValueError(f"{local_name(element.tag)} is missing {name}")
    return float(value)


def parse_length(value: str | None, label: str) -> float:
    if value is None:
        raise ValueError(f"SVG is missing {label}")
    normalized = value.strip()
    if normalized.endswith("px"):
        normalized = normalized[:-2]
    return float(normalized)


def parse_matrix(value: str | None) -> list[float]:
    if value is None:
        raise ValueError("SVG state group is missing transform")
    normalized = value.strip()
    if not normalized.startswith("matrix(") or not normalized.endswith(")"):
        raise ValueError(f"expected an SVG matrix transform; observed {value!r}")
    body = normalized[len("matrix(") : -1]
    values = [float(item.strip()) for item in body.split(",")]
    if len(values) != 6:
        raise ValueError(f"expected six SVG matrix values; observed {len(values)}")
    return values


def parse_swfmill(path: Path, button_id: int) -> dict[str, object]:
    with gzip.open(path, "rb") as source:
        document = ET.parse(source)
    root = document.getroot()

    header = one(descendants(root, "Header"), "Header")
    rectangle = first_descendant(direct_child(header, "size"), "Rectangle")
    stage_twips = {
        "left": numeric_attribute(rectangle, "left"),
        "top": numeric_attribute(rectangle, "top"),
        "right": numeric_attribute(rectangle, "right"),
        "bottom": numeric_attribute(rectangle, "bottom"),
    }
    stage = {
        "width": (stage_twips["right"] - stage_twips["left"]) / 20,
        "height": (stage_twips["bottom"] - stage_twips["top"]) / 20,
    }

    buttons = [
        element
        for element in descendants(root, "DefineButton2")
        if element.attrib.get("objectID") == str(button_id)
    ]
    button = one(buttons, f"DefineButton2 objectID={button_id}")

    placements = [
        element
        for element in descendants(root, "PlaceObject2")
        if element.attrib.get("objectID") == str(button_id)
    ]
    placement = one(placements, f"PlaceObject2 objectID={button_id}")
    placement_transform = first_descendant(placement, "Transform")
    placement_twips = {
        "x": numeric_attribute(placement_transform, "transX"),
        "y": numeric_attribute(placement_transform, "transY"),
    }

    records: list[dict[str, object]] = []
    buttons_container = direct_child(button, "buttons")
    for record in list(buttons_container):
        if local_name(record.tag) != "Button" or "objectID" not in record.attrib:
            continue
        transform = first_descendant(record, "Transform")
        parsed = {
            "objectId": int(record.attrib["objectID"]),
            "depth": int(record.attrib["depth"]),
            "up": record.attrib.get("up") == "1",
            "over": record.attrib.get("over") == "1",
            "down": record.attrib.get("down") == "1",
            "hitTest": record.attrib.get("hitTest") == "1",
            "transformTwips": {
                "x": float(transform.attrib.get("transX", "0")),
                "y": float(transform.attrib.get("transY", "0")),
            },
        }
        records.append(parsed)
    states: dict[str, list[int]] = {}
    for state in ("up", "over", "down", "hitTest"):
        states[state] = [
            record["objectId"]
            for record in sorted(records, key=lambda candidate: candidate["depth"])
            if record[state]
        ]

    conditions: list[dict[str, object]] = []
    conditions_container = direct_child(button, "conditions")
    for condition in list(conditions_container):
        if local_name(condition.tag) != "Condition":
            continue
        actions_container = first_descendant(condition, "actions")
        actions: list[dict[str, object]] = []
        for action in list(actions_container):
            action_name = local_name(action.tag)
            if action_name == "EndAction":
                continue
            actions.append({"name": action_name, "attributes": dict(action.attrib)})
        conditions.append({"attributes": dict(condition.attrib), "actions": actions})

    return {
        "document": {
            "root": local_name(root.tag),
            "version": root.attrib.get("version"),
            "compressed": root.attrib.get("compressed"),
        },
        "stageTwips": stage_twips,
        "stage": stage,
        "header": {
            "frameRate": float(header.attrib["framerate"]),
            "frameCount": int(header.attrib["frames"]),
        },
        "button": {
            "objectId": button_id,
            "menu": button.attrib.get("menu"),
            "records": records,
            "states": states,
            "conditions": conditions,
        },
        "placement": {
            "depth": int(placement.attrib["depth"]),
            "twips": placement_twips,
            "pixels": {"x": placement_twips["x"] / 20, "y": placement_twips["y"] / 20},
        },
    }


def namespaced_attribute(element: ET.Element, local: str) -> str | None:
    for key, value in element.attrib.items():
        if key == local or key.endswith("}" + local):
            return value
    return None


def parse_svg(path: Path) -> dict[str, object]:
    document = ET.parse(path)
    root = document.getroot()
    state_groups = [candidate for candidate in list(root) if local_name(candidate.tag) == "g"]
    group = one(state_groups, "top-level SVG state group")
    matrix = parse_matrix(group.attrib.get("transform"))
    character_ids: list[int] = []
    for child in list(group):
        if local_name(child.tag) != "use":
            continue
        character_id = namespaced_attribute(child, "characterId")
        if character_id is None:
            raise ValueError("top-level SVG use is missing ffdec:characterId")
        character_ids.append(int(character_id))
    return {
        "width": parse_length(root.attrib.get("width"), "width"),
        "height": parse_length(root.attrib.get("height"), "height"),
        "groupMatrix": matrix,
        "groupTranslation": {"x": matrix[4], "y": matrix[5]},
        "characterIds": character_ids,
    }


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--swfmill", required=True, type=Path)
    parser.add_argument("--button-id", required=True, type=int)
    parser.add_argument(
        "--svg",
        action="append",
        default=[],
        metavar="STATE=PATH",
        help="Parse a named FFDec SVG state (repeatable).",
    )
    return parser.parse_args()


def main() -> int:
    arguments = parse_arguments()
    svg_paths: dict[str, Path] = {}
    for value in arguments.svg:
        if "=" not in value:
            raise ValueError("--svg must use STATE=PATH")
        state, raw_path = value.split("=", 1)
        if not state or not raw_path or state in svg_paths:
            raise ValueError(f"invalid or duplicate SVG state: {value!r}")
        svg_paths[state] = Path(raw_path)
    result = parse_swfmill(arguments.swfmill, arguments.button_id)
    result["svgStates"] = {state: parse_svg(path) for state, path in sorted(svg_paths.items())}
    json.dump(result, sys.stdout, indent=2, sort_keys=True)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:  # Emit a concise deterministic CLI failure.
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1)
