#!/usr/bin/env python3
"""Extract the narrow IN008 terminal pattern-quiz drawing contract.

The parser reads swfmill XML plus two FFDec-exported Bauhaus subsets.  The
IN008 subset is authoritative for its embedded glyphs; the same-lesson IN006
subset is used only for glyphs absent from IN008 after every shared glyph has
been proven byte-for-byte outline/metric equivalent.  No ActionScript runs.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
from pathlib import Path
import xml.etree.ElementTree as ET

logging.getLogger("fontTools").setLevel(logging.CRITICAL)
from fontTools.pens.basePen import BasePen  # noqa: E402
from fontTools.ttLib import TTFont  # noqa: E402


class JsonPen(BasePen):
    def __init__(self, glyph_set):
        super().__init__(glyph_set)
        self.commands: list[list[object]] = []

    @staticmethod
    def point(value):
        return [int(value[0]), int(value[1])]

    def _moveTo(self, point):
        self.commands.append(["M", *self.point(point)])

    def _lineTo(self, point):
        self.commands.append(["L", *self.point(point)])

    def _qCurveToOne(self, control, point):
        self.commands.append(["Q", *self.point(control), *self.point(point)])

    def _curveToOne(self, control_one, control_two, point):
        self.commands.append([
            "C", *self.point(control_one), *self.point(control_two),
            *self.point(point),
        ])

    def _closePath(self):
        self.commands.append(["Z"])

    def _endPath(self):
        self.commands.append(["E"])


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--swfmill", required=True, type=Path)
    parser.add_argument("--primary-ttf", required=True, type=Path)
    parser.add_argument("--supplement-ttf", required=True, type=Path)
    parser.add_argument("--object-id", required=True, type=int)
    parser.add_argument("--font-object-id", required=True, type=int)
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
        if node.get(key) is not None:
            value = node.get(key, "")
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
        "boundsTwips": {
            key: integer(rectangle.get(key), f"bounds {key}")
            for key in ("left", "right", "top", "bottom")
        },
        "color": {
            key: integer(color.get(key), f"color {key}")
            for key in ("red", "green", "blue", "alpha")
        },
    }


def font_glyph(font: TTFont, character: str) -> dict[str, object]:
    cmap = font.getBestCmap()
    glyph_name = cmap.get(ord(character))
    if glyph_name is None:
        raise KeyError(character)
    glyph_set = font.getGlyphSet()
    pen = JsonPen(glyph_set)
    glyph_set[glyph_name].draw(pen)
    return {
        "advance": int(font["hmtx"].metrics[glyph_name][0]),
        "commands": pen.commands,
    }


def stable_bytes(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":")).encode()


def main() -> None:
    args = parse_args()
    if args.object_id < 1 or args.font_object_id < 1:
        raise ValueError("object ids must be positive")
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
                "transform": transform(tag),
                "hasEvents": tag.find("./events") is not None,
            })
        elif tag.tag == "ShowFrame":
            current_frame += 1

    declared_frame_count = integer(sprite.get("frames"), "sprite frames")
    observed_show_frame_count = current_frame - 1
    if observed_show_frame_count != declared_frame_count:
        raise ValueError("target sprite ShowFrame count differs from declaration")

    font_node = one(
        [node for node in root.iter("DefineFont2")
         if node.get("objectID") == str(args.font_object_id)],
        f"DefineFont2 objectID={args.font_object_id}",
    )
    primary = TTFont(args.primary_ttf, recalcBBoxes=False, recalcTimestamp=False)
    supplement = TTFont(
        args.supplement_ttf, recalcBBoxes=False, recalcTimestamp=False,
    )
    primary_cmap = primary.getBestCmap()
    supplement_cmap = supplement.getBestCmap()
    common_characters = sorted(set(primary_cmap) & set(supplement_cmap))
    mismatches = [
        chr(code) for code in common_characters
        if font_glyph(primary, chr(code)) != font_glyph(supplement, chr(code))
    ]
    if mismatches:
        raise ValueError(f"same-lesson font subsets differ: {mismatches!r}")

    required_characters = " ,-0123456789"
    glyphs: dict[str, object] = {}
    for character in required_characters:
        if ord(character) in primary_cmap:
            glyph = font_glyph(primary, character)
            glyph["source"] = "in008-primary-subset"
        elif ord(character) in supplement_cmap:
            glyph = font_glyph(supplement, character)
            glyph["source"] = "same-lesson-in006-supplement"
        else:
            raise ValueError(f"required Bauhaus glyph is unavailable: {character!r}")
        glyphs[character] = glyph

    primary_bytes = args.primary_ttf.read_bytes()
    supplement_bytes = args.supplement_ttf.read_bytes()
    common_manifest = {
        chr(code): font_glyph(primary, chr(code)) for code in common_characters
    }
    payload = {
        "schemaVersion": 1,
        "parser": "python-xml.etree.ElementTree+fontTools.ttLib",
        "targetSprite": {
            "objectId": args.object_id,
            "declaredFrameCount": declared_frame_count,
            "observedShowFrameCount": observed_show_frame_count,
            "actionFrames": action_frames,
            "stopFrameCandidates": stop_frame_candidates,
            "entryFrame": 216,
            "entryTagSequence": frame_tags.get(216, []),
            "entryPlacements": placements.get(216, []),
            "postStopFrames": [
                {"frame": 217, "tagSequence": frame_tags.get(217, [])}
            ],
        },
        "dynamicText": {
            "question": edit_text(root, 38),
            "answerOne": edit_text(root, 39),
            "answerTwo": edit_text(root, 40),
            "feedback": edit_text(root, 51),
        },
        "font": {
            "objectId": args.font_object_id,
            "name": font_node.get("name", ""),
            "swfGlyphCount": len(font_node.findall("./glyphs/Glyph")),
            "unitsPerEm": int(primary["head"].unitsPerEm),
            "ascent": int(primary["hhea"].ascent),
            "descent": int(primary["hhea"].descent),
            "primary": {
                "bytes": len(primary_bytes),
                "sha256": hashlib.sha256(primary_bytes).hexdigest(),
            },
            "sameLessonSupplement": {
                "bytes": len(supplement_bytes),
                "sha256": hashlib.sha256(supplement_bytes).hexdigest(),
                "sharedGlyphCount": len(common_characters),
                "sharedGlyphsEquivalent": True,
                "sharedGlyphManifestSha256": hashlib.sha256(
                    stable_bytes(common_manifest)
                ).hexdigest(),
            },
            "glyphs": glyphs,
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
