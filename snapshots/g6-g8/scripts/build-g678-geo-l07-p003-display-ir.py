#!/usr/bin/env python3
"""Freeze exact P003 display, audio-block, and glossary-button source events."""

import argparse
import base64
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path('/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/GEO001/L7/RW/L7RW03.swf')
XML = ROOT / 'migrations/shared-geo001-l07-p003/audit/movie.xml'
STREAM = ROOT / 'migrations/shared-geo001-l07-p003/audit/sprite-140-source-stream-v1.mp3'
OUTPUT = ROOT / 'migrations/shared-geo001-l07-p003/audit/display-list-events-v2.json'
SOURCE_SHA = 'd0e3c429a5cf15de8f89c0e627a51d990b2bfed8d532af3a84f559531b9a4deb'
XML_SHA = 'c6131380de0e00d4054cfbc89b6b98c50d0f76e0328239e201ce5a523592b35e'
STREAM_SHA = '17b1d24e26ca2b225a421bdcaa1250a22a1f311b34d35e6b7880c4946a546e90'
BUTTONS = {46: 'Measurement', 47: 'Three dimensional', 48: 'Figure',
           120: 'Cubic unit', 134: 'Cubic foot', 135: 'Unit', 136: 'volume'}
CENSUS = {'PlaceObject2': 457, 'RemoveObject2': 164, 'ShowFrame': 1274,
          'SoundStreamHead': 1, 'SoundStreamBlock': 1126, 'End': 1}


def sha(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def pinned(path: Path, expected: str) -> None:
    if path.is_symlink() or not path.is_file() or path.resolve() != path or sha(path.read_bytes()) != expected:
        raise ValueError(f'source file identity drift: {path}')


def ranges(frames: list[int]) -> list[list[int]]:
    result = []
    for frame in frames:
        if result and frame == result[-1][1] + 1:
            result[-1][1] = frame
        else:
            result.append([frame, frame])
    return result


def render() -> bytes:
    for path, digest in ((SOURCE, SOURCE_SHA), (XML, XML_SHA), (STREAM, STREAM_SHA)):
        pinned(path, digest)
    document = ET.parse(XML).getroot()
    header = document.find('Header')
    if document.get('version') != '6' or header is None or header.get('frames') != '10' or header.get('framerate') != '12':
        raise ValueError('SWF header drift')
    rectangle = header.find('size/Rectangle')
    if rectangle is None or rectangle.attrib != {'left': '0', 'right': '16000', 'top': '0', 'bottom': '12000'}:
        raise ValueError('stage rectangle drift')
    root_tags = header.find('tags')
    if root_tags is None:
        raise ValueError('root timeline missing')
    root_frame = 1
    root_entries = []
    for tag in root_tags:
        if tag.tag == 'ShowFrame':
            root_frame += 1
        elif tag.tag == 'PlaceObject2' and tag.get('objectID') == '140':
            root_entries.append({'frame': root_frame, **tag.attrib})
    if root_frame != 11 or root_entries != [{'frame': 6, 'replace': '0', 'depth': '4',
                                            'objectID': '140', 'morph': '5', 'name': 'animation'}]:
        raise ValueError('root child placement drift')
    definitions = {}
    for button in document.findall('.//DefineButton2'):
        character_id = int(button.get('objectID') or 0)
        condition = button.find('conditions/Condition')
        if character_id not in BUTTONS or condition is None or condition.get('pointerReleaseInside') != '1':
            raise ValueError('unexpected source button')
        strings = [value.get('value') for value in condition.findall('actions/Dictionary/strings/String')]
        if strings != ['_global', 'KeyAttribute', BUTTONS[character_id], '_root',
                       'DoHyperLinks', 'animation_mc', 'animation', 'stop']:
            raise ValueError(f'button {character_id} ActionScript drift')
        definitions[character_id] = {'characterId': character_id,
            'sourceKeyAttribute': BUTTONS[character_id],
            'releaseEffect': 'set-KeyAttribute-call-DoHyperLinks-stop-animation'}
    if set(definitions) != set(BUTTONS):
        raise ValueError('button set drift')
    sprites = document.findall('.//DefineSprite[@objectID="140"]')
    if len(sprites) != 1 or sprites[0].get('frames') != '1274':
        raise ValueError('main frame domain drift')
    tags = sprites[0].find('tags')
    if tags is None:
        raise ValueError('main tags missing')
    frame, events, blocks = 1, [], []
    census = {key: 0 for key in CENSUS}
    active_depths: dict[int, int] = {}
    resident_frames = {key: [] for key in BUTTONS}
    for tag in tags:
        if tag.tag not in census:
            raise ValueError(f'unsupported main-domain tag: {tag.tag}')
        census[tag.tag] += 1
        if tag.tag == 'PlaceObject2':
            if any(child.tag not in ('transform', 'colorTransform') for child in tag):
                raise ValueError('unsupported placement children')
            depth = int(tag.get('depth') or -1)
            if tag.get('objectID') is not None:
                active_depths[depth] = int(tag.get('objectID'))
            transform = tag.find('transform/Transform')
            color = tag.find('colorTransform/ColorTransform2')
            events.append({'frame': frame, 'op': 'place', 'attributes': tag.attrib,
                           'transform': transform.attrib if transform is not None else None,
                           'colorTransform': color.attrib if color is not None else None})
        elif tag.tag == 'RemoveObject2':
            active_depths.pop(int(tag.get('depth') or -1), None)
            events.append({'frame': frame, 'op': 'remove', 'attributes': tag.attrib})
        elif tag.tag == 'SoundStreamBlock':
            raw = base64.b64decode(tag.findtext('data') or '', validate=True)
            if len(raw) < 4:
                raise ValueError('short source audio block')
            blocks.append({'frame': frame, 'sampleCount': int.from_bytes(raw[:2], 'little'),
                           'seekSamples': int.from_bytes(raw[2:4], 'little', signed=True),
                           'payloadSha256': sha(raw[4:])})
        elif tag.tag == 'ShowFrame':
            for character_id in set(active_depths.values()) & set(BUTTONS):
                resident_frames[character_id].append(frame)
            frame += 1
    if census != CENSUS or frame != 1275 or len(blocks) != 1126 or sum(b['sampleCount'] for b in blocks) != 2061504:
        raise ValueError('main source event census drift')
    actual_placements = [(event['frame'], int(event['attributes']['objectID'])) for event in events
                         if event['op'] == 'place' and event['attributes'].get('objectID') in {str(i) for i in BUTTONS}]
    expected_placements = [(422, 46), (456, 47), (460, 48), (460, 46),
                           (943, 120), (943, 120), (1009, 120), (1168, 134),
                           (1168, 135), (1168, 136), (1168, 120)]
    if actual_placements != expected_placements:
        raise ValueError('glossary display placement drift')
    buttons = [dict(definitions[character_id], depthResidentFrameRanges=ranges(resident_frames[character_id]))
               for character_id in sorted(BUTTONS)]
    result = {'schemaVersion': 1, 'kind': 'g678-source-display-event-ir-v1',
        'animationId': 'shared-geo001-l07-p003', 'sourceSwfSha256': SOURCE_SHA,
        'swfmillXmlSha256': XML_SHA, 'rootEntry': root_entries[0],
        'stage': {'width': 800, 'height': 600}, 'fps': 12,
        'rootFrameCount': 10, 'mainFrameDomain': 'sprite-140', 'mainFrameCount': 1274,
        'embeddedMp3Sha256': STREAM_SHA, 'tagCensus': census,
        'displayEvents': events, 'soundBlocks': blocks, 'glossaryButtons': buttons,
        'claimBoundary': 'Static source events and depth residence only; clipping, alpha, hit-test reachability, original-runtime trace, glossary definitions, renderer, synchronization and acceptance remain unverified.'}
    return (json.dumps(result, indent=2, ensure_ascii=False) + '\n').encode()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--write', action='store_true')
    mode.add_argument('--check', action='store_true')
    parser.add_argument('--output', type=Path, default=OUTPUT)
    args = parser.parse_args()
    content = render()
    if args.write:
        with args.output.open('xb') as target:
            target.write(content)
    elif args.output.read_bytes() != content:
        raise ValueError('display event IR drift')
    print(f'PASS GEO001 L7 P003 display IR: {len(content)} bytes, SHA-256 {sha(content)}')


if __name__ == '__main__':
    main()
