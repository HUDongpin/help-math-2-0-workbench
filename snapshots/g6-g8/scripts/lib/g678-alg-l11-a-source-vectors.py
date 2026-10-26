#!/usr/bin/env python3
"""Compile extracted A10 source vectors; interaction admission remains separate."""
import importlib.util
import json
import pathlib
import re
import xml.etree.ElementTree as ET

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SPEC = importlib.util.spec_from_file_location("source_vectors", HERE / "g678-alg-l11-b-source-vectors.py")
V = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(V)
HELPER_SHA = V.sha((HERE / "g678-alg-l11-b-source-vectors.py").read_bytes())
RAW = ROOT / "work/g678-shared-page-factory/g678-alg-l11-tranche-a-instructional-visuals-v2"
OUT = ROOT / "work/g678-shared-page-factory/g678-alg-l11-tranche-a-vector-bundles-v6"
AUDIT = ROOT / "catalog/g678-alg-l11-interactive10-tranche-c-audit-v1.json"


def file_binding(file):
    assert file.is_file() and not file.is_symlink() and file.stat().st_nlink == 1
    data = file.read_bytes()
    return {"path": str(file.relative_to(ROOT)), "bytes": len(data), "sha256": V.sha(data)}


def compile_page(member, receipt):
    page = member["animationId"]
    folder = RAW / page
    for entry in receipt["files"]:
        file = folder / entry["path"]
        observed = file_binding(file)
        assert observed["sha256"] == entry["sha256"] and observed["bytes"] == entry["bytes"]
    xml_bytes = (folder / "source.xml").read_bytes()
    source = ET.fromstring(xml_bytes)
    tags = list(source.find("tags"))
    characters = {}
    for tag in tags:
        for key in ["spriteId", "shapeId", "buttonId", "textId", "characterID"]:
            if tag.get(key):
                characters[int(tag.get(key))] = tag
    main = member["exactMainTimeline"]
    frames = V.source_display_frames(characters[main["objectId"]].find("subTags"))
    assert len(frames) == main["frameCount"]
    root_frame = V.source_display_frames(tags)[5]
    placement = [x for x in root_frame.values() if x.get("characterId") == main["objectId"]]
    assert len(placement) == 1
    root_matrix = placement[0]["matrix"]
    library = V.VectorLibrary()
    root_body = library.import_svg(folder / "root-frame6/6.svg", hidden_names=[placement[0]["name"]])
    controls = []
    contract = member["sourceContract"]
    quiz = contract.get("quizFrame")
    if quiz:
        display = frames[quiz - 1]
        for slot in contract["geometry"]["optionSlots"]:
            if not slot["present"]:
                continue
            hit = slot["hitTarget"]
            current = display[hit["depth"]]
            assert current["characterId"] == hit["objectId"] and current["name"] == hit["name"]
            bounds = V.source_bounds(current["characterId"], characters)
            polygon = [V.transform_point(root_matrix, *V.transform_point(current["matrix"], x, y))
                       for x, y in [(bounds[0], bounds[1]), (bounds[2], bounds[1]),
                                    (bounds[2], bounds[3]), (bounds[0], bounds[3])]]
            controls.append({"slot": slot["slot"], "sourceInstanceName": hit["name"],
                             "sourceObjectId": hit["objectId"], "correct": slot["correct"],
                             "polygon": polygon, "geometrySha256": slot["geometrySha256"]})
    dynamic = {}
    hidden = set()
    for frame in frames:
        for item in frame.values():
            name = item.get("name", "")
            obj = characters.get(item["characterId"])
            if obj is not None and obj.get("type") == "DefineSpriteTag" and int(obj.get("frameCount")) > 1:
                dynamic[(name, item["characterId"])] = int(obj.get("frameCount"))
            if re.match(r"Mc_(Right|Wrong)_Feed\d+$", name) or name in {"Mc_Popup", "Mc_Feed_Popup1", "CloseBtn", "RightFeed_mc"}:
                hidden.add(name)
    sprite = V.find_sprite(folder / "main-frames", main["objectId"])
    bodies, indices, lookup = [], [], {}
    for frame in range(1, main["frameCount"] + 1):
        body = library.import_svg(sprite / f"{frame}.svg", root_matrix, sorted(hidden))
        if body not in lookup:
            lookup[body] = len(bodies)
            bodies.append(body)
        indices.append(lookup[body])
    help_body = library.import_svg(sprite / f"{quiz}.svg", root_matrix,
                                   only_names=["Mc_Popup", "CloseBtn"]) if page.endswith("p011") else None
    help_controls = None
    if help_body:
        help_controls = {}
        for action, name in [("open", "NMHBtn"), ("close", "CloseBtn")]:
            matches = [x for x in frames[quiz - 1].values() if x.get("name") == name]
            assert len(matches) == 1
            item = matches[0]
            bounds = V.source_bounds(item["characterId"], characters)
            polygon = [V.transform_point(root_matrix, *V.transform_point(item["matrix"], x, y))
                       for x, y in [(bounds[0], bounds[1]), (bounds[2], bounds[1]),
                                    (bounds[2], bounds[3]), (bounds[0], bounds[3])]]
            help_controls[action] = {"sourceInstanceName": name,
                                     "sourceObjectId": item["characterId"], "polygon": polygon}
    return {"schemaVersion": 1, "animationId": page, "source": member["source"],
            "sourceXmlSha256": V.sha(xml_bytes), "stage": {"width": 800, "height": 600},
            "fps": 12, "mainObjectId": main["objectId"], "frameCount": main["frameCount"],
            "quizFrame": quiz, "rootMatrix": root_matrix, "rootBody": root_body,
            "definitions": list(library.definitions.values()), "frameBodies": bodies,
            "frameBodyIndices": indices, "choiceControls": controls,
            "helpBody": help_body,
            "helpControls": help_controls,
            "hiddenManagedInstances": sorted(hidden),
            "childDomainsPending": [{"name": name, "objectId": obj, "frameCount": count}
                                    for (name, obj), count in sorted(dynamic.items())],
            "coverage": {"mainVectorFrameCount": len(indices), "sourceOptionsVisible": len(controls),
                         "childBehaviorCompositionComplete": False, "productCalibrationPassed": False,
                         "registered": False, "audioAccepted": False, "visualFidelityAccepted": False}}


def main():
    extraction = json.loads((RAW / "extraction.json").read_text())
    audit = json.loads(AUDIT.read_text())
    assert V.sha(AUDIT.read_bytes()) == extraction["audit"]["sha256"]
    assert [p["animationId"] for p in extraction["pages"]] == audit["exactPlacementIds"]
    OUT.mkdir()
    files = []
    for member, receipt in zip(audit["members"], extraction["pages"]):
        result = compile_page(member, receipt)
        output = OUT / f'{member["animationId"]}.json'
        with output.open("x", encoding="utf8") as target:
            json.dump(result, target, ensure_ascii=False, separators=(",", ":"))
            target.write("\n")
        files.append(file_binding(output))
        print(json.dumps({"page": member["animationId"], "mainFrames": result["frameCount"],
                          "uniqueFrameBodies": len(result["frameBodies"]), "bytes": files[-1]["bytes"]}), flush=True)
    manifest = {"artifactType": "g678-alg-l11-a-instructional-vector-bundles-v1",
                "status": "unregistered-main-vector-layer-child-behavior-pending",
                "inputs": [file_binding(RAW / "extraction.json"), file_binding(AUDIT),
                           file_binding(pathlib.Path(__file__).resolve()), file_binding(HERE / "g678-alg-l11-b-source-vectors.py")],
                "files": files, "productCalibrationPassed": False, "registered": False}
    assert V.sha((HERE / "g678-alg-l11-b-source-vectors.py").read_bytes()) == HELPER_SHA, "Shared normalizer changed during compilation"
    with (OUT / "manifest.json").open("x", encoding="utf8") as target:
        json.dump(manifest, target, indent=2)
        target.write("\n")


if __name__ == "__main__":
    main()
