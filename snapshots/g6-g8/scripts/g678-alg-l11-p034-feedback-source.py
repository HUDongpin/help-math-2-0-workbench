import base64
import hashlib
import json
import struct
import sys
import xml.etree.ElementTree as ET

root = ET.parse(sys.argv[1]).getroot()
assert root.find('Header').get('framerate') == '12'
result = []
for character_id, count, expected in [(105, 28, '3506fcffbe07e726fd4cf1c750cd2641d2aa06f4ca14379b4407ea5843e4f0f0'),
                                      (118, 27, '6b25fd9df2ad01bd22bf57d9b8e0d3d9114e2bde208ebe7b0b6322820a5ad741')]:
    sprite = root.find(f'.//DefineSprite[@objectID="{character_id}"]')
    assert int(sprite.get('frames')) == count
    frame = 1
    blocks = []
    payload = b''
    head = None
    for tag in sprite.find('tags'):
        if tag.tag == 'SoundStreamHead':
            head = dict(tag.attrib)
            head['latencySeek'] = struct.unpack('<h', base64.b64decode(tag.find('./latencySeek/data').text))[0]
        elif tag.tag == 'SoundStreamBlock':
            data = base64.b64decode(tag.find('data').text)
            samples, seek = struct.unpack('<Hh', data[:4])
            blocks.append({'frame': frame, 'sampleCount': samples, 'seekSamples': seek,
                           'byteOffset': len(payload), 'payloadBytes': len(data)-4,
                           'sourceBlockSha256': hashlib.sha256(data).hexdigest()})
            payload += data[4:]
        elif tag.tag == 'ShowFrame':
            frame += 1
    assert frame == count+1 and len(blocks) == 27
    assert hashlib.sha256(payload).hexdigest() == expected
    result.append({'characterId': character_id, 'frameCount': count, 'startFrame': 2,
                   'terminalFrame': count, 'head': head, 'blocks': blocks,
                   'payloadBase64': base64.b64encode(payload).decode(), 'payloadSha256': expected,
                   'payloadBytes': len(payload), 'sampleCount': sum(x['sampleCount'] for x in blocks)})
print(json.dumps({'fps': 12, 'sourceRootFrames': 10, 'feedback': result}, sort_keys=True))
