#!/usr/bin/env python3
"""Generate SVG glyph runs from the Bauhaus font embedded in Conversion_1_2."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import xml.etree.ElementTree as ET


def number(value: float) -> str:
    rounded = round(value, 4)
    return str(int(rounded)) if rounded.is_integer() else str(rounded)


def glyph_path(glyph: ET.Element) -> str:
    x = 0.0
    y = 0.0
    commands: list[str] = []
    edges = glyph.find("./GlyphShape/edges")
    if edges is None:
        return ""

    for edge in edges:
        if edge.tag == "ShapeSetup":
            if "x" in edge.attrib or "y" in edge.attrib:
                x = float(edge.attrib.get("x", x))
                y = float(edge.attrib.get("y", y))
                commands.append(f"M{number(x)} {number(y)}")
        elif edge.tag == "LineTo":
            x += float(edge.attrib.get("x", 0))
            y += float(edge.attrib.get("y", 0))
            commands.append(f"L{number(x)} {number(y)}")
        elif edge.tag == "CurveTo":
            control_x = x + float(edge.attrib.get("x1", 0))
            control_y = y + float(edge.attrib.get("y1", 0))
            x = control_x + float(edge.attrib.get("x2", 0))
            y = control_y + float(edge.attrib.get("y2", 0))
            commands.append(
                f"Q{number(control_x)} {number(control_y)} {number(x)} {number(y)}"
            )

    return "".join(commands)


def text_run(text: ET.Element, glyph_maps: list[int]) -> dict[str, object]:
    font_height = 0
    baseline = 0
    x = 0.0
    run: list[dict[str, object]] = []

    for record in text.findall(".//TextRecord6"):
        if record.attrib.get("fontHeight"):
            font_height = int(record.attrib["fontHeight"])
        if record.attrib.get("y"):
            baseline = int(record.attrib["y"])
        if record.attrib.get("x"):
            x = int(record.attrib["x"]) / 20
        for entry in record.findall(".//TextEntry"):
            character = chr(glyph_maps[int(entry.attrib["glyph"])])
            run.append({"char": character, "x": round(x, 4)})
            x += int(entry.attrib["advance"]) / 20

    return {
        "run": run,
        "baseline": baseline / 20,
        "scale": font_height / 1024 / 20,
    }


def generate(
    xml_path: Path, output_path: Path, standalone_data_path: Path | None = None
) -> None:
    root = ET.parse(xml_path).getroot()
    tags = root.find("./Header/tags")
    if tags is None:
        raise ValueError("SWF XML has no root tag list")

    font = next(
        tag
        for tag in tags
        if tag.tag == "DefineFont2" and tag.attrib.get("objectID") == "145"
    )
    glyph_elements = font.findall("./glyphs/Glyph")
    glyph_maps = [int(glyph.attrib["map"]) for glyph in glyph_elements]
    glyphs = {
        chr(code): glyph_path(glyph)
        for code, glyph in zip(glyph_maps, glyph_elements, strict=True)
    }

    text_ids = {"146", "158", "165", "169", "172", "174", "179"}
    texts = {
        tag.attrib["objectID"]: text_run(tag, glyph_maps)
        for tag in tags
        if tag.tag == "DefineText" and tag.attrib.get("objectID") in text_ids
    }

    output = f'''"use client";

// Generated from the Bauhaus Md BT font embedded in Conversion_1_2.swf.
const GLYPHS = Object.freeze({json.dumps(glyphs, ensure_ascii=True, separators=(",", ":"))});
const TEXTS = Object.freeze({json.dumps(texts, ensure_ascii=True, separators=(",", ":"))});

function GlyphRun({{ textId, x, y, opacity = 1 }}) {{
  const text = TEXTS[textId];
  return (
    <g opacity={{opacity}}>
      {{text.run.map((entry, index) => (
        <path
          key={{index}}
          d={{GLYPHS[entry.char]}}
          fill="#000000"
          fillRule="evenodd"
          transform={{
            "translate(" + (x + entry.x) + " " + (y + text.baseline) + ") scale(" + text.scale + ")"
          }}
        />
      ))}}
    </g>
  );
}}

export function FlashFluidOunces({{ opacity }}) {{
  return <GlyphRun textId="146" x={{647.95}} y={{246.55}} opacity={{opacity}} />;
}}

export function FlashGallonCounter({{ value }}) {{
  if (value == null) return null;
  const textId = value === 32 ? "158" : value === 64 ? "165" : value === 96 ? "169" : "172";
  const x = value === 128 ? 663.95 : 669.9;
  return <GlyphRun textId={{textId}} x={{x}} y={{195.55}} />;
}}

export function FlashGallonFinalFormula({{ opacity }}) {{
  return <GlyphRun textId="174" x={{439.85}} y={{279.9}} opacity={{opacity}} />;
}}
'''
    output_path.write_text(output, encoding="ascii")
    if standalone_data_path is not None:
        standalone_data = {"glyphs": glyphs, "texts": texts}
        standalone_data_path.write_text(
            "window.CONVERSION_1_2_BAUHAUS = Object.freeze("
            + json.dumps(standalone_data, ensure_ascii=True, separators=(",", ":"))
            + ");\n",
            encoding="ascii",
        )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("xml", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--standalone-data", type=Path)
    args = parser.parse_args()
    generate(args.xml, args.output, args.standalone_data)


if __name__ == "__main__":
    main()
