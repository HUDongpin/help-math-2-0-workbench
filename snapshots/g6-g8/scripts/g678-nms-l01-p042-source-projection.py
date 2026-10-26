#!/usr/bin/env python3
"""Read one hash-bound swfmill XML and emit an in-memory source projection."""
import base64
import hashlib
import json
import struct
import sys
import xml.etree.ElementTree as ET

root = ET.parse(sys.argv[1]).getroot()
header = root.find('Header')
assert header.attrib == {'framerate': '12', 'frames': '10'}
tags = header.find('tags')
sprites = {int(n.attrib['objectID']): n for n in tags.findall('DefineSprite')}
assert set(sprites) == {3, 23}
assert sprites[3].attrib['frames'] == '1' and sprites[23].attrib['frames'] == '125'
sha = lambda value: hashlib.sha256(value).hexdigest()

def project(nodes):
    frame, placements, actions, streams, blocks, visual_events = 1, [], [], [], [], []
    for node in nodes:
        if node.tag == 'PlaceObject2':
            assert node.find('clipActions') is None
            transform = node.find('transform/Transform')
            placements.append({'frame': frame, 'characterId': int(node.attrib['objectID']),
                'depth': int(node.attrib['depth']), 'name': node.attrib.get('name'),
                'transform': dict(transform.attrib)})
            visual_events.append({'frame': frame, 'tag': node.tag})
        elif node.tag == 'DoAction':
            actions.append({'frame': frame, 'operations': [a.tag for a in node.find('actions')]})
        elif node.tag == 'SoundStreamHead':
            streams.append({'frame': frame, 'attributes': dict(node.attrib),
                'latencySeek': struct.unpack('<h', base64.b64decode(node.findtext('latencySeek/data')))[0]})
        elif node.tag == 'SoundStreamBlock':
            data = base64.b64decode(node.findtext('data'), validate=True)
            samples, seek = struct.unpack('<Hh', data[:4])
            blocks.append({'frame': frame, 'bytes': len(data), 'sha256': sha(data),
                'sampleCount': samples, 'seekSamples': seek, 'payload': data[4:]})
        elif node.tag in ['RemoveObject', 'RemoveObject2', 'PlaceObject', 'PlaceObject3']:
            raise AssertionError('Unexpected visual mutation')
        elif node.tag == 'ShowFrame':
            frame += 1
    return {'observedFrames': frame - 1, 'placements': placements, 'actions': actions,
        'streamHeads': streams, 'blocks': blocks, 'visualEvents': visual_events}

main = project(sprites[23].find('tags'))
assert main['observedFrames'] == 125
assert len(main['placements']) == 20 and all(p['frame'] == 1 for p in main['placements'])
assert main['actions'] == [{'frame': 125, 'operations': ['Stop', 'EndAction']}]
assert len(main['streamHeads']) == 1 and main['streamHeads'][0]['latencySeek'] == 1673
assert [b['frame'] for b in main['blocks']] == list(range(8, 126))
assert not any(n.tag.startswith('DefineButton') for n in tags)
assert not any(n.tag in ['DefineSprite', 'DefineMorphShape', 'DefineEditText'] for n in sprites[23].find('tags'))
root_state = project(tags)
assert root_state['observedFrames'] == 10
assert [(p['frame'], p['characterId'], p['depth'], p['name']) for p in root_state['placements']] == [
    (6, 3, 1, 'Mc_ Page_Title'), (6, 23, 3, 'animation')]
assert [a['frame'] for a in root_state['actions']] == [1, 6]
assert root_state['actions'][1]['operations'] == ['Stop', 'EndAction']
empty_text = next(n for n in tags.findall('DefineText') if n.attrib['objectID'] == '17')
assert [n.attrib for n in empty_text.findall('.//TextEntry')] == [{'glyph': '0', 'advance': '120'}]
assert [n.attrib['objectID'] for n in empty_text.findall('.//TextRecord6') if n.attrib.get('isSetup') == '1'] == ['5']
font = next(n for n in tags.findall('DefineFont2') if n.attrib['objectID'] == '5')
glyph = list(font.find('glyphs'))[0]
assert glyph.attrib['map'] == '32'
assert [n.tag for n in glyph.find('GlyphShape/edges')] == ['ShapeSetup']
assert list(glyph.find('GlyphShape/edges'))[0].attrib == {}
empty_glyph = {'sourceCharacterId': 17, 'fontCharacterId': 5, 'glyphIndex': 0,
    'unicode': 32, 'advance': 120, 'outlineCommands': ['ShapeSetup']}
payload = b''.join(b['payload'] for b in main['blocks'])
block_metadata = [{k: v for k, v in block.items() if k != 'payload'} for block in main['blocks']]
main['blocks'] = block_metadata
root_state.pop('blocks')
print(json.dumps({'schemaVersion': 1, 'root': root_state, 'title': project(sprites[3].find('tags')), 'emptyTextGlyph': empty_glyph,
    'main': main, 'allMainVisualStatesIdenticalByTagSequence': True,
    'audio': {'streamDomain': 'sprite-23', 'firstBlockFrame': 8, 'lastBlockFrame': 125,
        'blockCount': 118, 'rawBlockBytes': sum(b['bytes'] for b in block_metadata),
        'payloadBytes': len(payload), 'payloadSha256': sha(payload),
        'sourcePayloadBase64': base64.b64encode(payload).decode('ascii'),
        'primingRemoved': False, 'latencySeek': 1673, 'integrated': False, 'accepted': False}}, sort_keys=True))
