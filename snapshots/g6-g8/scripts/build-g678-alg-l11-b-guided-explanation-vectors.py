#!/usr/bin/env python3
"""Extract the two source explanation domains for exact B guided pages."""
import hashlib
import importlib.util
import json
import os
import pathlib
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("vectors", ROOT / "scripts/lib/g678-alg-l11-b-source-vectors.py")
v = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v)
AUDIT_ROOT = ROOT / "work/g678-shared-page-factory/g678-alg-l11-behavior10-tranche-b-audit-v1"
RUN = ROOT / "work/g678-shared-page-factory/g678-alg-l11-b-guided-explanation-vectors-v1"


def binding(file):
    data = file.read_bytes()
    return {"path": str(file.relative_to(ROOT)) if file.is_relative_to(ROOT) else str(file), "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}


def write(file, value):
    with open(file, "x") as stream:
        json.dump(value, stream, ensure_ascii=False, separators=(",", ":"))
        stream.write("\n")


def compose(a, b):
    return [a[0]*b[0]+a[2]*b[1], a[1]*b[0]+a[3]*b[1], a[0]*b[2]+a[2]*b[3], a[1]*b[2]+a[3]*b[3], *v.transform_point(a,b[4],b[5])]


def build(page):
    assert page in ["040", "041", "042"]
    audit_file = ROOT / "catalog/g678-alg-l11-behavior10-tranche-b-audit-v1.json"
    assert binding(audit_file)["sha256"] == "2b45cee5d1503d9e98521b5ca0518500a29f8bc43a0b1c84145016dccc5289b8"
    member = next(x for x in json.loads(audit_file.read_text())["members"] if x["animationId"].endswith("p"+page))
    page_id = member["animationId"]
    source_file = pathlib.Path(os.environ["HELP_MATH_G678_SOURCE_ROOT"]) / member["source"]["path"]
    assert source_file.stat().st_mode & 0o222 == 0
    assert binding(source_file)["sha256"] == member["source"]["sha256"]
    jar = pathlib.Path("/Users/peter/Applications/FFDec.app/Contents/Resources/ffdec.jar")
    assert binding(jar)["sha256"] == "090ab695053ad94cba6408574c7d7eea20ec60b6ae789ee6056a23f45106762f"
    source_xml = AUDIT_ROOT / page_id / "ffdec-source.xml"
    assert binding(source_xml)["sha256"] == member["freshFfdecBinaryClosure"]["swfXml"]["sha256"]
    tags = list(ET.parse(source_xml).getroot().find("tags"))
    characters = {int(t.get(k)):t for t in tags for k in ["spriteId","shapeId","buttonId","characterID"] if t.get(k)}
    main_id = member["sourceStateMachine"]["mainObjectId"]
    frames = v.source_display_frames(characters[main_id].find("subTags"))
    root_matrix = next(x for x in v.source_display_frames(tags)[5].values() if x.get("name")=="animation")["matrix"]
    scripts_root = AUDIT_ROOT/page_id/"ffdec-export/scripts"
    scripts = []
    for file in sorted((scripts_root/f"DefineSprite_{main_id}").glob("frame_*/PlaceObject2_*/*.as")):
        text = file.read_text()
        match = re.search(r"_parent\.(Mc_box[12])\.gotoAndPlay\(1\)",text)
        if match:
            frame = int(file.parent.parent.name.removeprefix("frame_"))
            target_id, depth = map(int,file.parent.name.removeprefix("PlaceObject2_").split("_"))
            display = frames[frame-1]
            box = next(x for x in display.values() if x.get("name")==match[1])
            scripts.append({"frame":frame,"targetId":target_id,"depth":depth,"box":box,"script":binding(file)})
    assert len(scripts)==2 and {s["box"]["name"] for s in scripts}=={"Mc_box1","Mc_box2"}
    ids = sorted({s["box"]["characterId"] for s in scripts})
    destination = RUN/page_id
    RUN.mkdir(parents=True,exist_ok=True)
    destination.mkdir()
    argv = ["/opt/homebrew/bin/ffdec","-onerror","abort","-timeout","120","-exportTimeout","600","-format","sprite:svg",
            "-select", ",".join(f"{i}:1-{characters[i].get('frameCount')}" for i in ids), "-selectid", ",".join(map(str,ids)),
            "-export","sprite",str(destination/"raw"),str(source_file)]
    result = subprocess.run(argv, cwd=ROOT, capture_output=True, text=True, timeout=660)
    with open(destination/"stdout.txt","x") as f:f.write(result.stdout)
    with open(destination/"stderr.txt","x") as f:f.write(result.stderr)
    write(destination/"command.json",{"argv":argv,"returncode":result.returncode})
    assert result.returncode==0
    library = v.VectorLibrary()
    branches=[]
    for record in scripts:
        sprite_id=record["box"]["characterId"]
        frame_count=int(characters[sprite_id].get("frameCount"))
        domain_scripts=scripts_root/f"DefineSprite_{sprite_id}"
        assert (domain_scripts/"frame_1/DoAction.as").read_text().strip()=="stop();"
        assert (domain_scripts/"frame_15/DoAction.as").read_text().strip()=="stop();"
        end=(domain_scripts/"frame_20/DoAction.as").read_text()
        assert "gotoAndStop(1);" in end and "_parent.NMHBtn._visible = true;" in end
        placement=frames[record["frame"]-1][record["depth"]]
        bounds=v.source_bounds(placement["characterId"],characters)
        polygon=[v.transform_point(root_matrix,*v.transform_point(placement["matrix"],x,y)) for x,y in [(bounds[0],bounds[1]),(bounds[2],bounds[1]),(bounds[2],bounds[3]),(bounds[0],bounds[3])]]
        box_matrix=compose(root_matrix,record["box"]["matrix"])
        folder=v.find_sprite(destination/"raw",sprite_id)
        bodies=[library.import_svg(folder/f"{frame}.svg",box_matrix) for frame in range(1,frame_count+1)]
        box_display=v.source_display_frames(characters[sprite_id].find("subTags"))[14]
        close=[]
        for placed in box_display.values():
            cid=placed["characterId"]
            if not characters[cid].get("type","").startswith("DefineButton"):continue
            paths=list((scripts_root/f"DefineButton2_{cid}").glob("*.as"))
            if len(paths)!=1:continue
            action=paths[0].read_text()
            if "play();" not in action or "_parent.NMHBtn.enabled = true;" not in action:continue
            b=v.source_bounds(cid,characters)
            close_polygon=[v.transform_point(box_matrix,*v.transform_point(placed["matrix"],x,y)) for x,y in [(b[0],b[1]),(b[2],b[1]),(b[2],b[3]),(b[0],b[3])]]
            close.append({"polygon":close_polygon,"script":binding(paths[0])})
        assert len(close)==1
        branches.append({"mainFrame":record["frame"],"name":record["box"]["name"],"spriteId":sprite_id,
                         "sourceFrameCount":frame_count,"stopFrame":15,"closeStartFrame":16,"resetFrame":20,
                         "openPolygon":polygon,"closePolygon":close[0]["polygon"],"frameBodies":bodies,
                         "sourceOpenScript":record["script"],"sourceCloseScript":close[0]["script"],
                         "sourceStopScripts":[binding(domain_scripts/f"frame_{f}/DoAction.as") for f in [1,15,20]]})
    write(destination/"explanation-bundle.json",{"schemaVersion":1,"animationId":page_id,"sourceSha256":member["source"]["sha256"],
          "definitions":list(library.definitions.values()),"branches":branches,"productCalibrationPassed":False})
    write(destination/"run-receipt.json",{"runId":"g678-alg-l11-b-guided-explanation-vectors-v1","source":member["source"],
          "audit":binding(audit_file),"xml":binding(source_xml),"jar":binding(jar),"generator":binding(pathlib.Path(__file__)),
          "normalizer":binding(ROOT/"scripts/lib/g678-alg-l11-b-source-vectors.py"),
          "files":[binding(f) for f in sorted(destination.rglob("*")) if f.is_file()],
          "acceptanceEffects":{"registered":False,"calibrated":False,"audioAccepted":False,"fidelityAccepted":False,"strictComplete":False,"released":False}})
    print(json.dumps({"page":page_id,"branches":len(branches),"sourceFrames":sum(x["sourceFrameCount"] for x in branches),"bundle":binding(destination/"explanation-bundle.json")}))


if __name__=="__main__":
    for page in sys.argv[1:] or ["040","041","042"]:build(page)
