"""Deterministic static P006 timeline inventory, not runtime acceptance."""
from pathlib import Path
import hashlib
import json
import sys
import xml.etree.ElementTree as ET
from collections import Counter

root = Path(__file__).resolve().parents[1]
audit = root / 'migrations/shared-alg001-l12-p006/audit'
xml_path = audit / 'ffdec-26.2.1/movie.xml'
raw = xml_path.read_bytes()
receipt = json.loads((xml_path.parent / 'extraction-receipt.json').read_text())
xml_hash = hashlib.sha256(raw).hexdigest()
assert next(x['sha256'] for x in receipt['files'] if x['path'] == 'movie.xml') == xml_hash
movie = ET.fromstring(raw)
assert movie.get('_generator') == 'JPEXS Free Flash Decompiler v.26.2.1'
timelines = []
for node in [movie] + movie.findall('.//item[@type="DefineSpriteTag"]'):
    name = 'root' if node is movie else 'sprite-' + node.get('spriteId')
    tags = node.find('tags' if node is movie else 'subTags')
    frame = 1
    events = []
    counts = Counter()
    for tag in tags:
        kind = tag.get('type')
        counts[kind] += 1
        if kind == 'ShowFrameTag':
            frame += 1
        elif kind.startswith(('PlaceObject', 'RemoveObject', 'DoAction', 'FrameLabel', 'SoundStreamHead')):
            events.append({'frame': frame, 'type': kind, 'attributes': dict(tag.attrib),
                           'children': [ET.tostring(child, encoding='unicode') for child in tag]})
        elif kind == 'SoundStreamBlockTag':
            data = bytes.fromhex(tag.get('streamSoundData'))
            events.append({'frame': frame, 'type': kind, 'bytes': len(data),
                           'sha256': hashlib.sha256(data).hexdigest(),
                           'sampleCount': int.from_bytes(data[:2], 'little'),
                           'seekSamples': int.from_bytes(data[2:4], 'little', signed=True)})
    assert frame - 1 == int(node.get('frameCount'))
    timelines.append({'id': name, 'frameCount': frame - 1, 'tagCounts': dict(counts), 'events': events})
buttons = []
for node in movie.findall('.//item[@type="DefineButton2Tag"]'):
    buttons.append({'id': int(node.get('buttonId')), 'xml': ET.tostring(node, encoding='unicode')})
result = {'schemaVersion': 1, 'animationId': 'shared-alg001-l12-p006',
          'sourceSha256': receipt['sourceSha256'], 'xmlSha256': xml_hash,
          'evidence': 'static-only; placement and audio timing are not original-runtime verified',
          'registered': False, 'header': dict(movie.attrib), 'timelines': timelines, 'buttons': buttons}
output = audit / 'source-structure-v1.json'
serialized = json.dumps(result, indent=2) + '\n'
assert len(sys.argv) == 2 and sys.argv[1] in ('--write', '--check')
if sys.argv[1] == '--check':
    assert output.read_text() == serialized
else:
    with output.open('x') as handle:
        handle.write(serialized)
print(json.dumps({'timelines': [(t['id'], t['frameCount']) for t in timelines],
                  'buttons': [b['id'] for b in buttons], 'registered': False}))
