#!/usr/bin/env python3
"""Compile preserved FFDec vectors into a deduplicated native-stage timeline.

No Flash bytecode is executed. ElementTree parses both source XML and SVG;
all vector definitions and their local references remain content-addressed.
The maintained React adapter owns source-visible UI state and child playheads.
"""
import argparse
import base64
import copy
import hashlib
import json
import pathlib
import re
import xml.etree.ElementTree as ET

SVG = "http://www.w3.org/2000/svg"
XLINK = "http://www.w3.org/1999/xlink"
FFDEC = "https://www.free-decompiler.com/flash"
ET.register_namespace("", SVG)
ET.register_namespace("xlink", XLINK)
ET.register_namespace("ffdec", FFDEC)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def serialized(element):
    # Whitespace in source glyph paths and instructional text is untouched.
    element.tail = None
    return ET.tostring(element, encoding="unicode", short_empty_elements=True)


def matrix(node):
    if node is None:
        return [1, 0, 0, 1, 0, 0]
    return [float(node.get("scaleX", "1")), float(node.get("rotateSkew0", "0")),
            float(node.get("rotateSkew1", "0")), float(node.get("scaleY", "1")),
            int(node.get("translateX", "0")) / 20,
            int(node.get("translateY", "0")) / 20]


def matrix_text(value):
    return "matrix(" + " ".join(format(x, ".8g") for x in value) + ")"


def transform_point(m, x, y):
    return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]


def source_display_frames(tags):
    """Replay source display-list placement/removal, retaining actual depths."""
    display, frames = {}, []
    for tag in tags:
        kind = tag.get("type", "")
        if kind.startswith("PlaceObject"):
            depth = int(tag.get("depth"))
            old = display.get(depth, {}) if tag.get("placeFlagMove") == "true" else {}
            item = {**old, "depth": depth}
            if tag.get("characterId"):
                item["characterId"] = int(tag.get("characterId"))
            if tag.get("name"):
                item["name"] = tag.get("name")
            if tag.find("matrix") is not None:
                item["matrix"] = matrix(tag.find("matrix"))
            display[depth] = item
        elif kind.startswith("RemoveObject"):
            display.pop(int(tag.get("depth")), None)
        elif kind == "ShowFrameTag":
            frames.append(copy.deepcopy(display))
    return frames


def source_bounds(character_id, characters, visited=None):
    visited = (visited or set()) | {character_id}
    character = characters[character_id]
    for key in ["shapeBounds", "bounds", "textBounds", "startBounds"]:
        rect = character.find(key)
        if rect is not None:
            return [int(rect.get(k)) / 20 for k in ["Xmin", "Ymin", "Xmax", "Ymax"]]
    kind = character.get("type", "")
    points = []
    if kind.startswith("DefineButton"):
        records = [x for x in character.find("characters") if x.get("buttonStateHitTest") == "true"]
        placements = [{"characterId": int(x.get("characterId")), "matrix": matrix(x.find("placeMatrix"))} for x in records]
    elif kind == "DefineSpriteTag":
        placements = list(source_display_frames(character.find("subTags"))[0].values())
    else:
        raise ValueError(f"No source hit bounds for {character_id}: {kind}")
    for p in placements:
        if p["characterId"] in visited:
            raise ValueError("Recursive source hit shape")
        bounds = source_bounds(p["characterId"], characters, visited)
        for x, y in [(bounds[0], bounds[1]), (bounds[2], bounds[1]), (bounds[2], bounds[3]), (bounds[0], bounds[3])]:
            points.append(transform_point(p["matrix"], x, y))
    if not points:
        raise ValueError(f"Empty hit shape {character_id}")
    return [min(p[0] for p in points), min(p[1] for p in points), max(p[0] for p in points), max(p[1] for p in points)]


class VectorLibrary:
    def __init__(self):
        self.definitions = {}

    def import_svg(self, svg_file, outer_matrix=None, hidden_names=(), hidden_ids=(), only_names=None):
        root = ET.parse(svg_file).getroot()
        assert root.tag == f"{{{SVG}}}svg"
        forbidden = {"script", "foreignObject", "audio", "video", "animate", "set"}
        for node in root.iter():
            if node.tag.split("}")[-1] in forbidden:
                raise ValueError(f"Non-vector or active element in {svg_file}: {node.tag}")
            for key, value in node.attrib.items():
                embedded = re.fullmatch(r"data:image/(png|jpeg);base64,([A-Za-z0-9+/=\r\n]+)", value, re.I)
                if node.tag == f"{{{SVG}}}image" and key.endswith("href") and embedded:
                    decoded = base64.b64decode(re.sub(r"\s", "", embedded[2]), validate=True)
                    magic = decoded.startswith(b"\x89PNG\r\n\x1a\n") if embedded[1].lower() == "png" else decoded.startswith(b"\xff\xd8\xff") and decoded.endswith(b"\xff\xd9")
                    assert magic and 0 < len(decoded) <= 16 * 1024 * 1024, "Invalid or oversized embedded source bitmap"
                    continue
                if key.lower().startswith("on") or (key.endswith("href") and not value.startswith("#")):
                    raise ValueError("External or executable vector reference")
        for style in root.iter(f"{{{SVG}}}style"):
            css = style.text or ""
            assert not re.search(r"@import|expression\s*\(|url\s*\(", css, re.I), "Active/external SVG CSS"
            # FFDec exports up/over/down/hit-test display CSS here. Dropping it
            # paints hit-only black rectangles over the actual formulas.
            self.definitions["css_" + sha(css.encode())] = serialized(copy.deepcopy(style))
        defs_node = root.find(f"{{{SVG}}}defs")
        local = {x.get("id"): x for x in defs_node} if defs_node is not None else {}
        # FFDec also emits clip paths inside display groups, outside <defs>.
        # Promote their definitions before namespacing references; retaining a
        # reference to the old clipPath0 would silently lose authored masks.
        definition_tags = {f"{{{SVG}}}{name}" for name in
                           ["clipPath", "mask", "filter", "linearGradient",
                            "radialGradient", "pattern", "marker", "symbol"]}
        for node in root.iter():
            if node.tag in definition_tags and node.get("id"):
                name = node.get("id")
                assert name not in local or local[name] is node, f"Duplicate SVG definition: {name}"
                local[name] = node
        resolved, resolving = {}, set()

        def rewrite(value):
            if value.startswith("#") and value[1:] in local:
                return "#" + resolve(value[1:])
            return re.sub(r"url\(#([^)]+)\)", lambda m: "url(#" + resolve(m[1]) + ")", value)

        def fix_refs(element):
            for node in element.iter():
                for key, value in list(node.attrib.items()):
                    if key != "id":
                        node.set(key, rewrite(value))

        def resolve(name):
            if name in resolved:
                return resolved[name]
            assert name in local and name not in resolving, f"Broken/cyclic SVG definition: {name}"
            resolving.add(name)
            node = copy.deepcopy(local[name])
            node.attrib.pop("id")
            fix_refs(node)
            digest = sha(serialized(node).encode())
            ident = "v_" + digest
            node.set("id", ident)
            self.definitions[ident] = serialized(node)
            resolved[name] = ident
            resolving.remove(name)
            return ident

        group = root.find(f"{{{SVG}}}g")
        assert group is not None, f"No source display group: {svg_file}"
        group = copy.deepcopy(group)
        for parent in list(group.iter()):
            for child in list(parent):
                if child.tag in definition_tags and child.get("id") in local:
                    parent.remove(child)
        for child in list(group):
            if child.get("id") in hidden_names or int(child.get(f"{{{FFDEC}}}characterId", "-1")) in hidden_ids or (only_names is not None and child.get("id") not in only_names):
                group.remove(child)
        if outer_matrix is not None:
            group.set("transform", matrix_text(outer_matrix))
        fix_refs(group)
        # Source instance names are metadata, not globally colliding DOM IDs.
        for node in group.iter():
            if node.get("id"):
                node.set("data-source-instance", node.attrib.pop("id"))
        return serialized(group)


def find_sprite(root, sprite_id):
    matches = list(root.glob(f"DefineSprite_{sprite_id}")) + list(root.glob(f"DefineSprite_{sprite_id}_*"))
    assert len(matches) == 1, f"Expected exactly one extracted sprite {sprite_id}: {matches}"
    return matches[0]


def compile_page(audit, raw_root, source_audit_root):
    page_id = audit["animationId"]
    machine = audit["sourceStateMachine"]
    source_xml_path = source_audit_root / page_id / "ffdec-source.xml"
    xml_bytes = source_xml_path.read_bytes()
    assert sha(xml_bytes) == audit["freshFfdecBinaryClosure"]["swfXml"]["sha256"]
    source = ET.fromstring(xml_bytes)
    tags = list(source.find("tags"))
    characters = {}
    for tag in tags:
        for key in ["spriteId", "shapeId", "buttonId", "textId", "characterID"]:
            if tag.get(key):
                characters[int(tag.get(key))] = tag
    main = characters[machine["mainObjectId"]]
    source_frames = source_display_frames(main.find("subTags"))
    assert len(source_frames) == machine["frameCount"]
    root_frame = source_display_frames(tags)[5]
    root_main = next(x for x in root_frame.values() if x.get("name") == "animation")
    root_matrix = root_main["matrix"]
    bg = next(x for x in tags if x.get("type") == "SetBackgroundColorTag").find("backgroundColor")
    background = "#" + "".join(f"{int(bg.get(c)):02x}" for c in ["red", "green", "blue"])
    library = VectorLibrary()
    native_root = library.import_svg(raw_root / "root" / "6.svg", hidden_names=["animation"])
    hidden_names = ["Mc_Popup", "CloseBtn", "Mc_PopUp", "Mc_box1", "Mc_box2"]
    feedback_ids = [r["spriteId"] for items in machine["feedbackEndpoints"].values() for r in items]
    main_dir = find_sprite(raw_root / "main", machine["mainObjectId"])
    bodies, frame_indices, index = [], [], {}
    for frame in range(1, machine["frameCount"] + 1):
        frame_hidden = hidden_names + (["a_text"] if machine["guidedHits"] and frame >= machine["guidedHits"][0]["frame"] else [])
        body = library.import_svg(main_dir / f"{frame}.svg", root_matrix, frame_hidden, feedback_ids)
        if body not in index:
            index[body] = len(bodies)
            bodies.append(body)
        frame_indices.append(index[body])

    def polygon(placement):
        bounds = source_bounds(placement["characterId"], characters)
        corners = [(bounds[0], bounds[1]), (bounds[2], bounds[1]), (bounds[2], bounds[3]), (bounds[0], bounds[3])]
        return [transform_point(root_matrix, *transform_point(placement["matrix"], *point)) for point in corners]

    quiz_display = source_frames[machine["quizFrame"] - 1]
    def placement_named(name, display=quiz_display):
        found = [x for x in display.values() if x.get("name") == name]
        assert len(found) == 1, (page_id, name)
        return found[0]

    choices = [{"label": row["visibleLabel"], "instanceName": row["instanceName"],
                "characterId": row["characterId"], "polygon": polygon(placement_named(row["instanceName"]))}
               for row in audit["answerVisibleGeometryCrosswalk"]["rows"]]
    # Reuse source popup exactly; main export's offset is replaced by root+instance placement.
    popup = placement_named("Mc_Popup")
    def compose(a, b):
        return [a[0]*b[0]+a[2]*b[1], a[1]*b[0]+a[3]*b[1],
                a[0]*b[2]+a[2]*b[3], a[1]*b[2]+a[3]*b[3],
                *transform_point(a, b[4], b[5])]
    popup_file = source_audit_root / audit["helpPopup"]["frameSvg"]["path"]
    assert sha(popup_file.read_bytes()) == audit["helpPopup"]["frameSvg"]["sha256"]
    help_body = library.import_svg(popup_file, compose(root_matrix, popup["matrix"]))
    help_open = polygon(placement_named("NMHBtn"))
    close_candidates = [x for x in quiz_display.values() if x.get("name") == "CloseBtn"]
    help_close = polygon(close_candidates[0]) if close_candidates else None
    close_body = library.import_svg(main_dir / f"{machine['quizFrame']}.svg", root_matrix, only_names=["CloseBtn"])
    guided, unresolved_guided = [], []
    for hit in machine["guidedHits"]:
        placement = source_frames[hit["frame"] - 1][hit["depth"]]
        assert placement["characterId"] == hit["objectId"]
        try:
            region = polygon(placement)
        except ValueError as error:
            if not str(error).startswith("Empty hit shape"):
                raise
            unresolved_guided.append({**hit, "reason": "source-sprite-has-no-visible-or-hit-geometry",
                                      "candidatePolygonInvented": False})
            continue
        guided.append({**hit, "polygon": region, "action": "continue-main"})
    direct_children = sorted({x["characterId"] for f in source_frames for x in f.values()
                              if x["characterId"] in characters and characters[x["characterId"]].get("type") == "DefineSpriteTag"
                              and x["characterId"] not in feedback_ids and x["characterId"] != popup["characterId"]})
    return {"schemaVersion": 1, "animationId": page_id, "source": audit["source"],
            "sourceXmlSha256": sha(xml_bytes), "mainObjectId": machine["mainObjectId"],
            "stage": {"width": 800, "height": 600, "background": background},
            "fps": 12, "frameCount": machine["frameCount"], "quizFrame": machine["quizFrame"],
            "rootFrame": 6, "rootMatrix": root_matrix,
            "definitions": list(library.definitions.values()), "rootBody": native_root,
            "frameBodies": bodies, "frameBodyIndices": frame_indices,
            "helpBody": help_body, "helpCloseBody": close_body, "choiceControls": choices,
            "helpOpenPolygon": help_open, "helpClosePolygon": help_close,
            "guidedControls": guided,
            **({"unresolvedGuidedControls": unresolved_guided} if unresolved_guided else {}),
            "childDomainsPending": [{"spriteId": i, "frameCount": int(characters[i].get("frameCount"))}
                                    for i in direct_children if int(characters[i].get("frameCount")) > 1],
            "coverage": {"mainFramesRendered": len(frame_indices),
                         "preQuizFramesRendered": machine["quizFrame"] - 1,
                         "postQuizFramesRendered": machine["frameCount"] - machine["quizFrame"],
                         "sourceChoicesVisible": 4, "sourceHelpRendered": True,
                         "sourceFeedbackAnimationRendered": False,
                         "productCalibrationPassed": False, "registered": False,
                         "audioAccepted": False, "visualFidelityAccepted": False}}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--audit", required=True)
    parser.add_argument("--page", required=True)
    parser.add_argument("--raw-root", required=True)
    parser.add_argument("--source-audit-root", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    audit = json.loads(pathlib.Path(args.audit).read_text())
    member = next(x for x in audit["members"] if x["animationId"] == args.page)
    result = compile_page(member, pathlib.Path(args.raw_root), pathlib.Path(args.source_audit_root))
    with open(args.output, "x", encoding="utf8") as target:
        json.dump(result, target, ensure_ascii=False, separators=(",", ":"))
        target.write("\n")
    print(json.dumps({"page": args.page, "frames": result["frameCount"], "uniqueBodies": len(result["frameBodies"]),
                      "definitions": len(result["definitions"]), "pendingChildDomains": result["childDomainsPending"]}))


if __name__ == "__main__":
    main()
