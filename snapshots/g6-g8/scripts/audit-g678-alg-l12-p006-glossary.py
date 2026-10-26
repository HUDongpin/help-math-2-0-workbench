"""Rebuild P006's static glossary disposition from hash-bound FFDec evidence."""

import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / "migrations/shared-alg001-l12-p006/audit"
EXTRACTION = AUDIT / "ffdec-26.2.1"
OUTPUT = AUDIT / "glossary-disposition-v1.json"
SOURCE = Path(
    "/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/"
    "G6-G8-shared/ALG001/L12/RW/L12RW06.swf"
)
SOURCE_SHA256 = "933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6"
LESSON_INDEX = SOURCE.parents[1] / "index.xml"
LESSON_INDEX_SHA256 = "0755afb5645d3179fb1105641b0d1f1b06d8c803c02484bfbdc703ba5bb6f325"
RECEIPT_SHA256 = "7cee944f6b0096cda883b8176724a6fd0ef2e3fdd5f6882487160c41a8a9f6e6"
CATALOG = ROOT / "catalog/g678-vb02-l1-family-audit-v1.json"
CATALOG_SHA256 = "e5ff597b123c3097f2784d497b5f9ba1be0a750ffbd36b36e8038ea6bcd36763"
TERMS = {48: "Coordinate", 49: "Graph", 50: "Equation", 51: "Inequality"}


def demand(condition, message):
    if not condition:
        raise ValueError(message)


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def pinned_inputs():
    demand(SOURCE.is_file() and SOURCE.resolve() == SOURCE, "physical P006 SWF missing or symlinked")
    demand(sha256(SOURCE) == SOURCE_SHA256, "P006 SWF hash drift")
    demand(LESSON_INDEX.is_file() and LESSON_INDEX.resolve() == LESSON_INDEX,
           "physical P006 lesson index missing or symlinked")
    demand(sha256(LESSON_INDEX) == LESSON_INDEX_SHA256, "P006 lesson index hash drift")
    receipt_path = EXTRACTION / "extraction-receipt.json"
    demand(sha256(receipt_path) == RECEIPT_SHA256, "FFDec receipt hash drift")
    receipt = json.loads(receipt_path.read_text())
    demand(receipt["sourceSha256"] == SOURCE_SHA256, "receipt source mismatch")
    demand(receipt["sourceBytes"] == SOURCE.stat().st_size, "receipt source size mismatch")
    demand(receipt["animationId"] == "shared-alg001-l12-p006", "receipt animation mismatch")
    files = {item["path"]: item for item in receipt["files"]}
    demand(len(files) == len(receipt["files"]), "duplicate receipt paths")
    for relative, item in files.items():
        path = EXTRACTION / relative
        demand(path.resolve().is_relative_to(EXTRACTION.resolve()), "receipt path escaped extraction")
        demand(path.is_file() and path.stat().st_size == item["bytes"], f"missing or changed {relative}")
        demand(sha256(path) == item["sha256"], f"hash drift: {relative}")
    demand(sha256(CATALOG) == CATALOG_SHA256, "candidate glossary catalog hash drift")
    return receipt, files


def definition(movie, kind, attribute, value):
    nodes = movie.findall(f"./tags/item[@type='{kind}'][@{attribute}='{value}']")
    demand(len(nodes) == 1, f"expected one {kind} {value}")
    return nodes[0]


def button_records(movie):
    shape = definition(movie, "DefineShapeTag", "shapeId", "47")
    bounds = shape.find("shapeBounds")
    records = shape.findall("./shapes/shapeRecords/item")
    demand(bounds is not None and len(records) == 6, "hit shape 47 structure drift")
    hit_shape = {
        "characterId": 47,
        "type": shape.get("type"),
        "boundsTwips": {key: int(bounds.get(key)) for key in ("Xmin", "Xmax", "Ymin", "Ymax")},
        "shapeRecords": [dict(record.attrib) for record in records],
    }
    buttons = []
    for button_id, term in TERMS.items():
        node = definition(movie, "DefineButton2Tag", "buttonId", str(button_id))
        characters = node.findall("./characters/item")
        actions = node.findall("./actions/item")
        demand(len(characters) == len(actions) == 1, f"button {button_id} record drift")
        hit = characters[0]
        demand(hit.get("characterId") == "47" and hit.get("buttonStateHitTest") == "true", f"button {button_id} hit shape drift")
        demand(all(hit.get(f"buttonState{state}") == "false" for state in ("Up", "Over", "Down")), f"button {button_id} visual-state drift")
        demand(actions[0].get("condOverDownToOverUp") == "true", f"button {button_id} release event drift")
        script_path = f"as/scripts/DefineButton2_{button_id}/BUTTONCONDACTION on(release).as"
        script = (EXTRACTION / script_path).read_text()
        match = re.fullmatch(
            r'\s*on\(release\)\s*\{\s*_global\.KeyAttribute = "([^"]+)";'
            r'\s*_root\.DoHyperLinks\(\);\s*_root\.animation_mc\.animation\.stop\(\);\s*\}\s*',
            script,
        )
        demand(match is not None and match.group(1) == term, f"button {button_id} script drift")
        demand(term.encode() + b"\x00" in bytes.fromhex(actions[0].get("actionBytes")), f"button {button_id} XML/script term mismatch")
        buttons.append({
            "characterId": button_id,
            "sourceKeyAttribute": term,
            "scriptPath": f"audit/ffdec-26.2.1/{script_path}",
            "scriptSha256": sha256(EXTRACTION / script_path),
            "releaseSequence": ["set _global.KeyAttribute", "call _root.DoHyperLinks()", "stop _root.animation_mc.animation"],
            "buttonRecord": {"characterId": 47, "placeDepth": int(hit.get("placeDepth")),
                             "states": {state: hit.get(f"buttonState{state}") == "true" for state in ("Up", "Over", "Down", "HitTest")},
                             "placeMatrix": dict(hit.find("placeMatrix").attrib)},
        })
    return hit_shape, buttons


def timeline(movie, buttons):
    sprite = definition(movie, "DefineSpriteTag", "spriteId", "53")
    demand(sprite.get("frameCount") == "342", "main sprite frame count drift")
    root_frame = 1
    parent = None
    for tag in movie.find("tags"):
        if tag.get("type") == "ShowFrameTag":
            root_frame += 1
        if tag.get("type", "").startswith("PlaceObject") and tag.get("characterId") == "53":
            demand(parent is None, "multiple root sprite 53 placements")
            parent = {"rootFrame": root_frame, "depth": int(tag.get("depth")),
                      "name": tag.get("name"), "matrix": dict(tag.find("matrix").attrib)}
    demand(parent is not None and parent["rootFrame"] == 6 and parent["name"] == "animation", "root entry drift")
    depth_by_id = {button["characterId"]: None for button in buttons}
    active = {}
    lifecycle = []
    ranges = []
    presence = {}
    frame = 1
    for tag in sprite.find("subTags"):
        kind = tag.get("type", "")
        if kind == "ShowFrameTag":
            presence[frame] = sorted(state["characterId"] for state in active.values())
            frame += 1
            continue
        if not kind.startswith(("PlaceObject", "RemoveObject")):
            continue
        depth = int(tag.get("depth", "-1"))
        character = int(tag.get("characterId", "-1"))
        if character not in TERMS and depth not in active and depth not in depth_by_id.values():
            continue
        if kind.startswith("RemoveObject"):
            demand(depth in active, f"removal of absent button depth {depth}")
            previous = active.pop(depth)
            previous["lastFrame"] = frame - 1
            ranges.append(previous)
            lifecycle.append({"frame": frame, "operation": "remove", "depth": depth,
                              "characterId": previous["characterId"]})
            continue
        move = tag.get("placeFlagMove") == "true"
        demand(not move, f"button move at frame {frame}, depth {depth} needs separate disposition")
        demand(character in TERMS and depth not in active, f"unexpected button replacement at frame {frame}, depth {depth}")
        matrix = tag.find("matrix")
        demand(matrix is not None, f"button {character} has no placement matrix")
        if depth_by_id[character] is None:
            depth_by_id[character] = depth
        demand(depth_by_id[character] == depth, f"button {character} changed depth")
        event = {"frame": frame, "operation": "place", "depth": depth,
                 "characterId": character, "ratio": int(tag.get("ratio")),
                 "matrix": dict(matrix.attrib)}
        lifecycle.append(event)
        active[depth] = {"characterId": character, "depth": depth, "firstFrame": frame,
                         "ratio": event["ratio"], "matrix": event["matrix"]}
    demand(frame == 343 and len(presence) == 342, "sprite ShowFrame domain drift")
    for state in active.values():
        state["lastFrame"] = 342
        ranges.append(state)
    demand(set(presence[248]) == set() and all(presence[f] == sorted(TERMS) for f in range(249, 343)), "button presence windows drift")
    demand(len(lifecycle) == 12 and len(ranges) == 8, "button lifecycle drift")
    for button in buttons:
        button["depth"] = depth_by_id[button["characterId"]]
        button["placements"] = sorted((item for item in ranges if item["characterId"] == button["characterId"]), key=lambda item: item["firstFrame"])
        demand([(item["firstFrame"], item["lastFrame"], item["ratio"]) for item in button["placements"]] == [(249, 337, 248), (338, 342, 337)], "button range drift")
        demand(button["placements"][0]["matrix"] == button["placements"][1]["matrix"], "button replacement matrix drift")
    return parent, lifecycle, {str(f): presence[f] for f in (248, 249, 337, 338, 342)}


def clip_mask(movie):
    sprite = definition(movie, "DefineSpriteTag", "spriteId", "53")
    morph = definition(movie, "DefineMorphShapeTag", "characterId", "43")
    final_shape = definition(movie, "DefineShape3Tag", "shapeId", "52")
    frame = 1
    events = []
    for tag in sprite.find("subTags"):
        kind = tag.get("type", "")
        if kind == "ShowFrameTag":
            frame += 1
        elif kind.startswith(("PlaceObject", "RemoveObject")) and tag.get("depth") == "18":
            event = {"frame": frame, "operation": "remove" if kind.startswith("RemoveObject") else
                     "move" if tag.get("placeFlagMove") == "true" else "place"}
            for key in ("characterId", "clipDepth", "ratio"):
                if tag.get(key) is not None:
                    event[key] = int(tag.get(key))
            if tag.find("matrix") is not None:
                event["matrix"] = dict(tag.find("matrix").attrib)
            events.append(event)
    demand(events[0]["frame"] == 249 and events[0]["characterId"] == 43 and events[0]["clipDepth"] == 29,
           "morph clip mask entry drift")
    demand(events[-2:] == [{"frame": 338, "operation": "remove"},
                           {"frame": 338, "operation": "place", "characterId": 52,
                            "clipDepth": 29, "matrix": events[-1].get("matrix")}], "clip mask replacement drift")
    demand(all(event["operation"] == "move" and "ratio" in event for event in events[1:-2]),
           "clip mask move sequence drift")
    return {"depth": 18, "clipDepth": 29, "affectsButtonDepths": [21, 23, 25, 27],
            "morphCharacterId": 43, "morphStartBoundsTwips": dict(morph.find("startBounds").attrib),
            "morphEndBoundsTwips": dict(morph.find("endBounds").attrib),
            "finalCharacterId": 52, "finalBoundsTwips": dict(final_shape.find("shapeBounds").attrib),
            "lifecycle": events}


def candidate_definitions():
    catalog = json.loads(CATALOG.read_text())
    index = ET.parse(LESSON_INDEX).getroot()
    references = {"en": index.findtext("./Keyterms/English"),
                  "es": index.findtext("./Keyterms/Spanish")}
    demand([node.text for node in index.findall(".//Page") if node.text and node.text.strip() == "RW/L12RW06.swf"] == ["RW/L12RW06.swf"], "P006 lesson occurrence drift")
    entries = {item["sourceKeyAttribute"]: item for item in catalog["terms"] if item["sourceKeyAttribute"] in TERMS.values()}
    demand(set(entries) == set(TERMS.values()), "candidate definition keys drift")
    for entry in entries.values():
        demand(entry["localeSourceResolution"] == {"en": references["en"], "es": references["es"]},
               "candidate term source differs from P006 lesson references")
    return references, [{"sourceKeyAttribute": term, "entryId": entries[term]["id"],
             "labels": entries[term]["labels"], "definitions": entries[term]["definitions"],
             "localeSourceResolution": entries[term]["localeSourceResolution"],
             "sourceEntrySha256": entries[term]["sourceEntrySha256"],
             "status": "existing-source-backed-candidate; P006 host binding unverified"}
            for term in TERMS.values()]


def build():
    receipt, files = pinned_inputs()
    movie = ET.parse(EXTRACTION / "movie.xml").getroot()
    demand(movie.get("_generator") == "JPEXS Free Flash Decompiler v.26.2.1", "FFDec generator drift")
    hit_shape, buttons = button_records(movie)
    parent, lifecycle, presence = timeline(movie, buttons)
    mask = clip_mask(movie)
    references, entries = candidate_definitions()
    demand(movie.get("frameCount") == "10", "root frame count drift")
    return {
        "schemaVersion": 1,
        "animationId": "shared-alg001-l12-p006",
        "evidenceLevel": "hash-bound static SWF extraction; no original-runtime acceptance",
        "source": {"path": str(SOURCE), "sha256": SOURCE_SHA256, "bytes": SOURCE.stat().st_size},
        "lessonIndex": {"path": str(LESSON_INDEX), "sha256": LESSON_INDEX_SHA256,
                        "pageReference": "RW/L12RW06.swf", "keyTermReferences": references},
        "extraction": {"receiptPath": "audit/ffdec-26.2.1/extraction-receipt.json",
                       "receiptSha256": RECEIPT_SHA256, "xmlPath": "audit/ffdec-26.2.1/movie.xml",
                       "xmlSha256": files["movie.xml"]["sha256"], "generatorSha256": receipt["generatorSha256"]},
        "timeline": {"rootFrameCount": int(movie.get("frameCount")), "mainSpriteId": 53,
                     "mainFrameCount": 342, "parentPlacement": parent,
                     "buttonPresenceAtFrames": presence, "lifecycle": lifecycle,
                     "moveEvents": [], "sameFrameReplacement": 338},
        "hitShape": hit_shape,
        "clipMask": mask,
        "buttons": buttons,
        "existingDefinitionCandidate": {"catalogPath": "catalog/g678-vb02-l1-family-audit-v1.json",
                                        "catalogSha256": CATALOG_SHA256,
                                        "scope": "P006 lesson index names the same source XML paths; legacy host lookup still unobserved",
                                        "keyTermSources": json.loads(CATALOG.read_text())["keyTermSources"],
                                        "entries": entries},
        "minimalModernAdapterDisposition": {
            "sourceRequired": ["bind controls by character ID, exact KeyAttribute, depth, frame and hit shape",
                               "on release request a glossary entry and stop the main sprite clock"],
            "holds": ["verify original host resolves the indexed keyterm XML and selects these exact entries",
                      "observe original-host modal open, close, resume, Replay and audio-clock behavior",
                      "verify masks, occlusion and original-runtime hit testing at the retained frames",
                      "review safe entity decoding and bilingual typography before product use"],
            "registered": False,
        },
    }


if __name__ == "__main__":
    demand(len(sys.argv) == 2 and sys.argv[1] in ("--write", "--check"), "use --write or --check")
    rendered = json.dumps(build(), indent=2, ensure_ascii=False) + "\n"
    if sys.argv[1] == "--write":
        with OUTPUT.open("x") as handle:
            handle.write(rendered)
    else:
        demand(OUTPUT.read_text() == rendered, "glossary disposition drift")
    print(json.dumps({"animationId": "shared-alg001-l12-p006", "buttons": list(TERMS),
                      "presence": "249-342; same-frame remove/place at 338", "registered": False}))
